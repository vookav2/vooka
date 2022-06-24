import { Collection, GuildMember } from 'discord.js'
import { Command, makeCommand } from '../entities'
import { Playlist, getPlaylistFromUrl, querySuggestion, search } from '@vookav2/searchmusic'
import { SlashCommandBuilder, SlashCommandStringOption } from '@discordjs/builders'
import { getSubscriber, makeSubscriber } from '../core'

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

      const query = options.getString('query', true)

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

  commands.set(playCommand.commandId, playCommand)
  return commands
}
