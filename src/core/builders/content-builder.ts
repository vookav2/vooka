/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable complexity */

import { MessageActionRow, MessageButton, MessageEmbed } from 'discord.js'
import { inlineCode, italic, userMention } from '@discordjs/builders'

import { Pagination } from '../managers'
import { Song } from '@vookav2/searchmusic'
import { TLyrics } from 'songlyrics'
import { emojiAudio } from '../../miscs'
import { strLimit } from '../../util'

const makeButton = () => new MessageButton().setStyle('SECONDARY').setDisabled(false)
const makeEmbed = () => new MessageEmbed().setColor(0xf5f9f9)

export enum PlayerCustomId {
  Prev = 'player@prev',
  Next = 'player@next',
  Play = 'player@play',
  Pause = 'player@pause',
  Stop = 'player@stop',
  RepeatCurrent = 'player@repeatCurrent',
  Lyrics = 'player@lyrics',
  // AddToFavorite = 'player@addToFavorite',
}
export const makeButtonsPlayer = (options: {
  isPlaying?: boolean
  isPaused?: boolean
  isLoading?: boolean
  isRepeatCurrent?: boolean
  hasPrevious?: boolean
  hasNext?: boolean
}): MessageActionRow[] => {
  const { isLoading, isPaused, isPlaying, isRepeatCurrent, hasNext, hasPrevious } = options
  const topRow = new MessageActionRow().addComponents([
    makeButton()
      .setLabel(emojiAudio.previous)
      .setCustomId(PlayerCustomId.Prev)
      .setDisabled(!hasPrevious || isLoading),
    makeButton()
      .setLabel(isPlaying ? emojiAudio.pause : isPaused ? emojiAudio.play : emojiAudio.pause)
      .setCustomId(isPlaying ? PlayerCustomId.Pause : isPaused ? PlayerCustomId.Play : PlayerCustomId.Pause)
      .setDisabled(isLoading ?? false),
    makeButton()
      .setLabel(emojiAudio.next)
      .setCustomId(PlayerCustomId.Next)
      .setDisabled(!hasNext || isLoading),
    makeButton()
      .setLabel(emojiAudio.repeatSingle)
      .setCustomId(PlayerCustomId.RepeatCurrent)
      .setDisabled(isLoading ?? isRepeatCurrent ?? false),
    makeButton()
      .setLabel(emojiAudio.stop)
      .setCustomId(PlayerCustomId.Stop)
      .setStyle('DANGER')
      .setDisabled(isLoading ?? false),
  ])
  const bottomRow = new MessageActionRow().addComponents([
    makeButton()
      .setLabel('Lyrics')
      .setCustomId(PlayerCustomId.Lyrics)
      .setStyle('PRIMARY')
      .setDisabled(isLoading ?? false),
    // makeButton()
    //   .setLabel('Add to Favorite')
    //   .setCustomId(PlayerCustomId.AddToFavorite)
    //   .setStyle('PRIMARY')
    //   .setDisabled(true),
  ])
  return [topRow, bottomRow]
}
export const makeLyricsEmbeds = (data: TLyrics): MessageEmbed[] | undefined => {
  const { title, lyrics, source } = data
  if (!lyrics || !lyrics.length) {
    return undefined
  }
  const defaultEmbed = makeEmbed().addFields([{ name: '\u200B', value: italic(`Source: ${source.name}`) }])
  const embedTitle = strLimit(title, 256)
  const embeds: MessageEmbed[] = []
  if (lyrics.length > 4096) {
    const split = lyrics.split('\n\n')
    const len = split.length / 2
    embeds.push(defaultEmbed.setTitle(embedTitle).setDescription(split.splice(0, len).join('\n\n')))
    embeds.push(defaultEmbed.setDescription(split.join('\n\n')))
  } else {
    embeds.push(defaultEmbed.setTitle(embedTitle).setDescription(lyrics))
  }

  return embeds
}
export const makePlaylistContent = (
  title: string,
  songs: Readonly<Song[]>,
  {
    pagination,
    player: { isLoading, isPaused, isPlaying },
  }: { pagination: Pagination; player: { isLoading: boolean; isPaused: boolean; isPlaying: boolean } }
): string => {
  const { currentPage, totalPages, totalContent, perPage, currentIndex } = pagination
  const startNumber = perPage * (currentPage - 1)

  const getIcon = (no: number) =>
    isPaused ? emojiAudio.pause : isPlaying ? emojiAudio.play : isLoading ? emojiAudio.loading : no

  const content = songs.slice(startNumber, startNumber + perPage).map<string>((song, index) => {
    const number = startNumber + index + 1
    return inlineCode(
      `[${number - 1 === currentIndex ? getIcon(number) : number}] ${song.title} - ${song.channel.name} [${
        song.durationString
      }]`
    )
  })
  content.unshift(inlineCode(strLimit(`Playlist • ${title}`, 256)) + '\n')
  content.push('\n' + inlineCode(`page: ${currentPage} of ${totalPages} Total: ${totalContent} song(s)`))
  return content.join('\n')
}
export const makeSongEmbed = (song: Song, gifUrl?: string) => {
  if (!gifUrl) {
    gifUrl = 'https://c.tenor.com/APAoWgAqNxkAAAAM/cat-dance-catto-dace.gif'
  }
  return makeEmbed()
    .setTitle(`🎧 ${strLimit(song.title, 256)}`)
    .setDescription(makeSupportContent())
    .addField('Artist', song.channel?.name ?? '-', true)
    .addField('Album', song.album?.title ?? '-', true)
    .addField('Explicit', song.explicit ? 'Yes' : 'No', true)
    .addField('Requested by', userMention('464985649460674572'), false)
    .setAuthor({ name: 'Playing', iconURL: gifUrl })
    .setFooter({ text: '•••', iconURL: gifUrl })
    .setThumbnail(song.thumbnail)
    .setImage(gifUrl)
}
export const makeSupportContent = (): string => {
  const DONATE_URL = 'https://saweria.co/daphino'
  // const VOTE_URL = 'https://top.gg/bot/not-yet'
  const FEEDBACK_URL = 'https://discordapp.com/channels/@me/464985649460674572'

  const descriptionTexts = [
    `[${inlineCode('Donate and support')}](${DONATE_URL})`,
    // `[${inlineCode('Vote Bot')}](${VOTE_URL})`,
    `[${inlineCode('Feedback')}](${FEEDBACK_URL})`,
  ]

  return `❤️ ${descriptionTexts.join(' | ')}`
}
