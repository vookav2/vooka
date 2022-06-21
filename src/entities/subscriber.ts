import { VoiceBasedChannel } from 'discord.js'
import { VoiceConnectionStatus } from '@discordjs/voice'
import { makeLogger } from '../util'
import { makeVoiceConnection } from '../core'

export type Subscriber = {
  guildId: string
  queue: unknown
}
type SubscriberParams = {
  guildId: string
  voiceChannel: VoiceBasedChannel
  onDestroy: () => void
}

export const makeSubscriber: FuncParams<SubscriberParams, void> = async ({ guildId, voiceChannel, onDestroy }) => {
  const logger = makeLogger('Subscriber')
  logger.debug(`Creating subscriber for id: ${guildId}`)
  const voiceConnection = await makeVoiceConnection(voiceChannel).catch(logger.error)
  if (!voiceConnection) {
    logger.error('Fail to create voice connection')
    return
  }

  voiceConnection.on(VoiceConnectionStatus.Destroyed, (_, __) => onDestroy())
}
