import { Collection, GuildMember } from 'discord.js'
import { Command, makeCommand } from '../entities'
import { Playlist, getPlaylistFromUrl, querySuggestion, search } from '@vookav2/searchmusic'
import { SlashCommandBuilder, SlashCommandStringOption } from '@discordjs/builders'
import { getContext, getSubscriber, lyricsSearch, makeLyricsButtons, makeLyricsEmbeds, makeSubscriber } from '../core'

import { safety } from '../util'
import { ytUrl } from '@vookav2/searchmusic/build/yt-scraper'

export const makeCommands = () => {
  const commands: Collection<string, Command> = new Collection()

  const playCommand = makeCommand({
    commandId: 'play',
    slashCommand: new SlashCommandBuilder()
      .setName('play')
      .setDescription('Play a song')
      .setDMPermission(false)
      .addStringOption(
        new SlashCommandStringOption()
          .setName('query')
          .setDescription('<auto suggestion> | youtube url')
          .setAutocomplete(true)
          .setRequired(true)
      ),
    handler: async ({ interaction: { guildId, member, options }, message }) => {
      if (!(member as GuildMember).voice.channel) {
        await message.editReply('You are not allowed. Please join to the voice channel first')
        throw new Error('Member not allowed')
      }

      const query = (options as any).getString('query', true)

      let playlistRequest: Promise<Playlist>
      if (ytUrl.isYtUrl(query)) {
        playlistRequest = getPlaylistFromUrl(query)
      } else {
        const { result: searchResult } = await search(query)
        const result = safety(searchResult).nullOrUndefined()
        if (result.type === 'Playlist') {
          playlistRequest = Promise.resolve(result)
        } else {
          playlistRequest = result.getPlaylist()
        }
      }

      if (!playlistRequest) {
        throw new Error('Playlist not found')
      } else {
        const subscriber = getSubscriber(guildId!)
        if (subscriber) {
          await message.editReply('Can not play due to the bot already played song in this guild.')
          throw new Error('Subscriber already registered.')
        }

        await makeSubscriber({
          getPlaylist: () => playlistRequest,
          guildId: guildId!,
          message,
          voiceChannel: (member as GuildMember).voice.channel!,
        })
      }
    },
    autocompleteHandler: async ({ name, value }) => {
      try {
        if (name === 'query') {
          const { suggestions } = await querySuggestion(`${value}`)
          return suggestions.map(data => ({ name: data, value: data }))
        }
        return []
      } catch (error) {
        return []
      }
    },
  })

  const lyricsCommand = makeCommand({
    commandId: 'lyrics',
    slashCommand: new SlashCommandBuilder()
      .setName('lyrics')
      .setDescription('Get lyrics of a song')
      .setDMPermission(false)
      .addStringOption(
        new SlashCommandStringOption()
          .setName('search')
          .setDescription('song_title artist_name(optional)')
          .setAutocomplete(false)
          .setRequired(true)
      ),
    handler: async ({ interaction, message }) => {
      const { guildId, options } = interaction
      if (!guildId) {
        throw new Error('Request is not from a guild')
      }
      const searchQuery = (options as any).getString('search', true)

      const lyrics = await lyricsSearch(searchQuery)
      if (!lyrics) {
        throw new Error('Lyrics not found')
      }
      const messageFetched = await interaction.fetchReply()
      const messageOptions = {
        content: '\u200B',
        embeds: makeLyricsEmbeds(lyrics),
        components: makeLyricsButtons(messageFetched.id),
      }
      await message.editReply(messageOptions)
      getContext().addTo('lyrics', messageFetched.id, message)
    },
  })

  commands.set(playCommand.commandId, playCommand)
  commands.set(lyricsCommand.commandId, lyricsCommand)
  return commands
}
