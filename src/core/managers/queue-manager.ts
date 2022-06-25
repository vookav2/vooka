import { AudioPlayerStatus, VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice'
import { Message, WebhookEditMessageOptions } from 'discord.js'
import { Playlist, Song } from '@vookav2/searchmusic'
import { createAudioResourceFromStream, createAudioStream, makeAudioPlayer } from './audio-manager'
import { makeButtonsPlayer, makePlaylistContent, makeSongEmbed } from '../builders/content-builder'

import { MessageHandler } from '../../entities'
import { getRandomGifUrl } from '../lib'
import { makeLogger } from '../../util'

export type Pagination = {
  currentIndex: number
  currentPage: number
  perPage: number
  totalPages: number
  totalContent: number
}
export type Queue = {
  destroy: () => void
  previous: () => void
  next: (force?: boolean) => void
  pause: () => void
  unpause: () => void
  setRepeat: () => void
  currentSong: () => Song | undefined
  addDeleteMessage: (message: Message) => void
}
type QueueParams = {
  voiceConnection: VoiceConnection
  playlist: Playlist
  message: MessageHandler
}
type QueueOptions = {
  repeat: boolean
}
export const makeQueue: FuncParams<QueueParams, Queue> = ({
  message,
  voiceConnection,
  playlist: { length, songs, playlistTitle },
}): Readonly<Queue> => {
  const logger = makeLogger('QueueManager')

  const meta: Map<string, unknown> = new Map()
  const get = <T>(key: string): T => meta.get(key) as T
  const set = (key: string, value: unknown) => meta.set(key, value)
  const audioPlayer = makeAudioPlayer()
  let destroyed = false
  let queueLocked = false

  const initiate = () => {
    setOptions()
    set('position', -1)
    set('length', length)
    set('songs', songs)
    set('deleteMessages', [])

    audioPlayer.on(AudioPlayerStatus.Idle, (_, __) => nextSong())
    audioPlayer.on(AudioPlayerStatus.Buffering, (_, __) => sendPlaylistContent())
    audioPlayer.on(AudioPlayerStatus.Paused, (_, __) => sendPlaylistContent())
    audioPlayer.on(AudioPlayerStatus.Playing, (_, __) => sendPlaylistContent())
    voiceConnection.on(VoiceConnectionStatus.Destroyed, (_, __) => destroy(true))

    voiceConnection.subscribe(audioPlayer)

    nextSong()
  }

  const addDeleteMessage = (message: Message) => get<Message[]>('deleteMessages').push(message)

  const setOptions = (options: QueueOptions = { repeat: false }) => set('options', options)

  const getSong = (position: number) => get<Song[]>('songs').at(position)
  const currentSong = () => getSong(get<number>('position'))
  const hasPrevious = () => get<number>('position') > 0
  const hasNext = () => get<number>('position') < get<number>('length') - 1

  const increasePosition = () => set('position', get<number>('position') + 1)
  const decreasePosition = () => set('position', get<number>('position') - 1)

  const isPlayerStatus = (status: AudioPlayerStatus) => audioPlayer.state.status === status

  const deletePendingMessages = () => {
    get<Message[]>('deleteMessages')?.forEach(message => message.deletable && message.delete())
    set('deleteMessages', [])
  }

  const adjustNext = () => {
    increasePosition()
    if (get<QueueOptions>('options').repeat && get<number>('position') > -1) {
      decreasePosition()
    } else {
      deletePendingMessages()
    }
  }

  const nextSong = (force?: boolean) => {
    if (queueLocked || destroyed) {
      return
    }
    queueLocked = true
    if (force) {
      setOptions()
    }
    if (isPlayerStatus(AudioPlayerStatus.Playing)) {
      audioPlayer.stop()
    }
    adjustNext()
    playAudio(currentSong())
  }
  const previousSong = () => {
    if (queueLocked || destroyed) {
      return
    }
    queueLocked = true
    setOptions()
    decreasePosition()
    playAudio(currentSong())
  }

  const getReferer = (): string | undefined => getSong(get<number>('position') - 1)?.id
  const playAudio = async (song: Song | undefined) => {
    if (!song) {
      destroy()
      return
    }
    const giftQuery = [song.title, song.channel.name]
    const gifUrl = await getRandomGifUrl(giftQuery[Math.floor(Math.random() * giftQuery.length)])
    set('gifUrl', gifUrl)
    await createAudioStream(song.id, getReferer())
      .then(stream => createAudioResourceFromStream(stream, song))
      .then(resource => audioPlayer.play(resource))
      .catch(reason => {
        queueLocked = false
        logger.error(reason)
        nextSong()
      })
    queueLocked = false
  }
  const pauseAudio = () => audioPlayer.pause()
  const unpauseAudio = () => audioPlayer.unpause()

  const getPagination = (): Pagination => {
    const position = get<number>('position')
    const length = get<number>('length')
    const pos = position < 0 ? 0 : position
    return {
      currentIndex: pos,
      currentPage: Math.floor(pos / 5) + 1,
      perPage: 5,
      totalPages: Math.ceil(length / 5),
      totalContent: length,
    }
  }
  const getContent = (): WebhookEditMessageOptions => {
    const position = get<number>('position')
    const songs = get<Song[]>('songs')
    const playerOptions = {
      isLoading: isPlayerStatus(AudioPlayerStatus.Buffering),
      isPaused: isPlayerStatus(AudioPlayerStatus.Paused),
      isPlaying: isPlayerStatus(AudioPlayerStatus.Playing),
    }
    const content = makePlaylistContent(playlistTitle, songs, {
      pagination: getPagination(),
      player: playerOptions,
    })
    return {
      content,
      embeds: [makeSongEmbed(songs[position < 0 ? 0 : position], get<string | undefined>('gifUrl'))],
      components: [
        ...makeButtonsPlayer({
          hasNext: hasNext(),
          hasPrevious: hasPrevious(),
          ...playerOptions,
          isRepeatCurrent: get<QueueOptions>('options').repeat,
        }),
      ],
    }
  }
  const sendPlaylistContent = () => message.editReply(getContent())

  const destroy = (voiceDestroyed = false) => {
    destroyed = true
    if (!voiceDestroyed) {
      voiceConnection.destroy()
    }
    deletePendingMessages()
    message.deleteReply()
    audioPlayer.stop()
    meta.clear()
  }

  initiate()

  return {
    addDeleteMessage,
    currentSong,
    next: nextSong,
    previous: previousSong,
    pause: pauseAudio,
    unpause: unpauseAudio,
    destroy,
    setRepeat: () => setOptions({ repeat: true }),
  }
}
