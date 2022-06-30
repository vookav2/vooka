import { Queue, makeQueue } from './queue-manager'

import { MessageHandler } from '../../entities'
import { Playlist } from '@vookav2/searchmusic'
import { VoiceBasedChannel } from 'discord.js'
import { VoiceConnectionStatus } from '@discordjs/voice'
import { getContext } from '../context'
import { makeLogger } from '../../util'
import { makeVoiceConnection } from './voice-manager'

export type Subscriber = {
  guildId: string
  queue: Queue
  isNoMembers: AsyncFunc<boolean>
  isWaitingToDestroy: ReturnFunc<boolean>
  waitForDestroy: FuncParams<number, void>
  cancelDestroy: ReturnFunc<void>
}
type SubscriberParams = {
  guildId: string
  voiceChannel: VoiceBasedChannel
  message: MessageHandler
  getPlaylist: AsyncFunc<Playlist>
}

export const makeSubscriber: AsyncFuncParams<SubscriberParams, void> = async ({
  guildId,
  voiceChannel,
  getPlaylist,
  message,
}) => {
  const logger = makeLogger('Subscriber')
  logger.debug(`Creating subscriber for id: ${guildId}`)

  const [voiceConnection, playlist] = await Promise.all([makeVoiceConnection(voiceChannel), getPlaylist()])
  if (!voiceConnection) {
    throw new Error('Fail to create voice connection')
  }

  const queue = makeQueue({ voiceConnection, playlist, message })

  let timeoutDestroy: NodeJS.Timeout | undefined = undefined

  const isNoMembers = async () => {
    try {
      const channelFetched = await voiceChannel.fetch()
      return channelFetched.members.filter(member => !member.user.bot).size === 0
    } catch {
      return false
    }
  }
  const isWaitingToDestroy = () => timeoutDestroy !== undefined
  const destroy = () => {
    if (!isWaitingToDestroy()) {
      return
    }
    queue.destroy()
  }
  const waitForDestroy = (ms: number) => {
    if (isWaitingToDestroy()) {
      return
    }
    message.followUp({
      options: 'Where you gonna go guys? I will wait for 5 minutes before leaving. ⏳',
      deleteAfter: 60_000,
    })
    timeoutDestroy = setTimeout(destroy, ms)
  }
  const cancelDestroy = () => {
    if (!isWaitingToDestroy()) {
      return
    }
    message.followUp({ options: 'Hey, you come back. 👋', deleteAfter: 10_000 })
    clearTimeout(timeoutDestroy)
    timeoutDestroy = undefined
  }
  const subscriber: Subscriber = {
    guildId,
    queue,
    isNoMembers,
    isWaitingToDestroy,
    waitForDestroy,
    cancelDestroy,
  }

  getContext().addTo('subscribers', guildId, subscriber)
  voiceConnection.on(VoiceConnectionStatus.Destroyed, (_, __) => {
    getContext().deleteFrom('subscribers', guildId)
  })
}
export const getSubscriber = (guildId: string) => getContext().getFrom<Subscriber | undefined>('subscribers', guildId)
