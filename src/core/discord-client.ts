/* eslint-disable complexity */
import { Client, Collection, Interaction } from 'discord.js'
import { config, makeLogger } from '../util'
import { getCommands, getSubscriber } from './managers'

import { Button } from '../entities'
import { getContext } from './context'

// eslint-disable-next-line sonarjs/cognitive-complexity
export const startDiscordClient = () => {
  const client = new Client({
    intents: 1921,
    presence: {
      status: 'online',
      activities: [
        {
          name: 'with my friends',
          type: 'PLAYING',
        },
      ],
    },
  })
  const logger = makeLogger('DiscordClient')

  const handleInteraction = async (interaction: Interaction) => {
    if (!interaction.inGuild()) {
      return
    }
    const context = getContext()
    if (interaction.isAutocomplete()) {
      const { commandName } = interaction
      logger.debug(`Handling autocomplete ${commandName}`)
      const command = getCommands().get(commandName)
      if (!command || !command.handleAutocomplete) {
        return
      }
      command.handleAutocomplete(interaction).catch(() => true)
    } else if (interaction.isCommand()) {
      const { commandName } = interaction
      logger.debug(`Handling command ${commandName}`)
      const command = getCommands().get(commandName)
      if (!command) {
        return
      }
      command.handle(interaction).catch(() => true)
    } else if (interaction.isButton()) {
      const { customId } = interaction
      logger.debug(`Handling button ${customId}`)
      const buttons = context.get<Collection<string, Button>>('buttons')
      const button = buttons.find(_button => {
        if (_button.customIdStartWith) {
          return customId.startsWith(_button.customIdStartWith)
        }
        return _button.customId === customId
      })
      if (!button) {
        return
      }
      button.handle(interaction).catch(() => true)
    }
  }

  client.on('debug', debug => logger.debug(debug))
  client.on('warn', warn => logger.warn(warn))
  client.on('ready', _client => {
    _client.user.setUsername(`vooka 🫡${config().NODE_ENV === 'development' ? ' - nightly' : ''}`)
    getContext().add('client', _client)
    logger.info('Client ready!')
  })
  client.on('error', error => logger.error(error))
  client.on('interactionCreate', interaction => handleInteraction(interaction))
  client.on('voiceStateUpdate', async ({ guild: oldGuild }, { guild: newGuild }) => {
    const subscriber = getSubscriber(oldGuild.id)
    if (oldGuild.id !== newGuild.id || !subscriber) {
      return
    }
    if (subscriber.isWaitingToDestroy()) {
      subscriber.cancelDestroy()
    } else if (await subscriber.isNoMembers()) {
      subscriber.waitForDestroy(60_000)
    }
  })

  const initiate = async () => {
    logger.debug('Client Initiating')
    const context = getContext()
    const initiateError = (error: Error) => {
      logger.error(error)
      context.destroy()
      client.destroy()
      process.exit(1)
    }

    logger.debug('Client Initiating: Connecting to Discord')
    await client.login(config().TOKEN).catch(initiateError)
  }

  initiate()
}
export const getClient = (): Client<true> => getContext().get('client')
