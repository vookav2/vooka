import { config, makeLogger } from '../../util'

import { Collection } from 'discord.js'
import { Command } from '../../entities'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v10'
import { getContext } from '../context'

export const registerSlashCommands = async () => {
  const rest = new REST({ version: '10' }).setToken(config.TOKEN)
  const commands = getContext().get<Collection<string, Command>>('commands')
  const commandsJSON = commands.map(command => command.slashCommand.toJSON())
  const { APP_ID, GUILD_TEST_ID, NODE_ENV } = config

  const guildRoutes = Routes.applicationGuildCommands(APP_ID!, GUILD_TEST_ID!)
  const appRoutes = Routes.applicationCommands(APP_ID!)
  const logger = makeLogger('RegisterSlashCommands')
  return rest
    .put(NODE_ENV !== 'production' ? guildRoutes : appRoutes, {
      body: commandsJSON,
    })
    .then(() => logger.info('Slash commands registered'))
    .catch(err => logger.error(err))
}
export const getCommands = () => getContext().get<Collection<string, Command>>('commands')
