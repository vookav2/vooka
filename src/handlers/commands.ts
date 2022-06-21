import { Collection, GuildMember } from 'discord.js'
import { Command, makeCommand } from '../entities'
import { Playlist, getPlaylistFromUrl, querySuggestion, search } from '@vookav2/searchmusic'
import { SlashCommandBuilder, SlashCommandStringOption } from '@discordjs/builders'

import { makeSubscriber } from '../core'
import { safety } from '../util'
import { ytUrl } from '@vookav2/searchmusic/build/yt-scraper'

export const makeCommands = () => {
  const commands: Collection<string, Command> = new Collection()

  const playCommand = makeCommand({
    commandId: 'play',
    slashCommand: new SlashCommandBuilder()
      .setName('play')
      .setDescription('Play a song')
      .addStringOption(
        new SlashCommandStringOption()
          .setName('query')
          .setDescription('<auto suggestion> | youtube url')
          .setAutocomplete(true)
          .setRequired(true)
      ),
    handler: async ({ interaction: { guildId, member, options }, message }) => {
      const query = options.getString('query', true)

      let playlistRequest: Promise<Playlist>
      if (ytUrl.isYtUrl(query)) {
        playlistRequest = getPlaylistFromUrl(query)
      } else {
        const { result } = await search(query)
        const getPlaylist = safety(result?.getPlaylist).nullOrUndefined()
        playlistRequest = getPlaylist()
      }

      if (!playlistRequest) {
        message.deleteReply()
      } else {
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
