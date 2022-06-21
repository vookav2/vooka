import 'dotenv/config'

import { registerSlashCommands, startDiscordClient } from './core'

import { makeLogger } from './util'

const handleProcessException = (err: Error) => {
  const logger = makeLogger('ProcessException')
  logger.error(err)
  process.exit(1)
}

process.on('uncaughtException', handleProcessException)
process.on('unhandledRejection', handleProcessException)

const [, , act] = process.argv
switch (act) {
  case 'start-client':
    startDiscordClient()
    break
  case 'refresh-commands':
    registerSlashCommands()
    break
  default:
    handleProcessException(new Error('Unknown action'))
    break
}
