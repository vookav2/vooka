/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable complexity */

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js'
import { MessageActionRowComponentBuilder, inlineCode, italic, userMention } from '@discordjs/builders'

import { Pagination } from '../managers'
import { Song } from '@vookav2/searchmusic'
import { TLyrics } from 'songlyrics'
import { emojiAudio } from '../../miscs'
import { strLimit } from '../../util'

const makeButton = () => new ButtonBuilder().setStyle(ButtonStyle.Secondary).setDisabled(false)
const makeEmbed = () => new EmbedBuilder().setColor(0xf5f9f9)

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
}) => {
  const { isLoading, isPaused, isPlaying, isRepeatCurrent, hasNext, hasPrevious } = options
  const topRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents([
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
      .setStyle(ButtonStyle.Danger)
      .setDisabled(isLoading ?? false),
  ])
  const bottomRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents([
    makeButton()
      .setLabel('Lyrics')
      .setCustomId(PlayerCustomId.Lyrics)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(isLoading ?? false),
    // makeButton()
    //   .setLabel('Add to Favorite')
    //   .setCustomId(PlayerCustomId.AddToFavorite)
    //   .setStyle(ButtonStyle.Primary)
    //   .setDisabled(true),
  ])
  return [topRow, bottomRow]
}
export const makeLyricsButtons = (messageId: string) => {
  const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents([
    makeButton()
      .setLabel('Remove')
      .setCustomId(`guild:lyrics:${messageId}`)
      .setStyle(ButtonStyle.Danger)
      .setDisabled(false),
  ])
  return [row]
}
export const makeLyricsEmbeds = (data: TLyrics): EmbedBuilder[] | undefined => {
  const { title, lyrics, source } = data
  if (!lyrics || !lyrics.length) {
    return undefined
  }
  const defaultEmbed = makeEmbed().addFields([{ name: '\u200B', value: italic(`Source: ${source.name}`) }])
  const embedTitle = strLimit(title, 256)
  const embeds: EmbedBuilder[] = []
  if (lyrics.length > 4000) {
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
  const albumTitleOrViews = song.album?.title.toLowerCase().includes('views') ? 'Views' : 'Album'
  return makeEmbed()
    .setTitle(`🎧 ${strLimit(song.title, 256)}`)
    .setDescription(makeSupportContent())
    .addFields(
      {
        name: 'Artist',
        value: song.channel?.name ?? '-',
        inline: true,
      },
      {
        name: albumTitleOrViews,
        value: song.album?.title ?? '-',
        inline: true,
      },
      {
        name: 'Explicit',
        value: song.explicit ? 'Yes' : 'No',
        inline: true,
      },
      {
        name: 'Arranged by',
        value: userMention('464985649460674572'),
        inline: true,
      }
    )
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
