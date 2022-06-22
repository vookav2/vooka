import {
  VoiceConnection,
  VoiceConnectionDisconnectReason,
  VoiceConnectionStatus,
  entersState,
  joinVoiceChannel,
} from '@discordjs/voice'
import { config, makeLogger } from '../../util'

import { VoiceBasedChannel } from 'discord.js'

export const makeVoiceConnection = ({
  guild: { id: guildId, voiceAdapterCreator },
  id: channelId,
}: VoiceBasedChannel) => {
  const logger = makeLogger('VoiceConnection')
  logger.debug('Joining voice channel')
  const voiceConnection = joinVoiceChannel({
    guildId,
    channelId,
    adapterCreator: voiceAdapterCreator,
    selfDeaf: true,
    selfMute: false,
    debug: config().NODE_ENV === 'development',
  })

  const waitForConnectionReady = async (voiceConnection: VoiceConnection) => {
    try {
      const connection = await entersState(voiceConnection, VoiceConnectionStatus.Ready, 20e3)
      logger.debug('Voice connection ready')
      return connection
    } catch (error) {
      logger.error(error)
      voiceConnection.destroy()
    }
  }

  voiceConnection.on('debug', debug => logger.debug(debug))
  voiceConnection.on('error', error => logger.error(error))
  voiceConnection.on(VoiceConnectionStatus.Disconnected, async (_, newState) => {
    if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
      logger.debug('Voice connection closed due to web socker close with code 4014, try to reconnect')
      try {
        await Promise.race([
          entersState(voiceConnection, VoiceConnectionStatus.Signalling, 5e3),
          entersState(voiceConnection, VoiceConnectionStatus.Connecting, 5e3),
        ])
      } catch (err) {
        logger.error(err)
        voiceConnection.destroy()
      }
    } else {
      voiceConnection.destroy()
    }
  })

  return waitForConnectionReady(voiceConnection)
}
