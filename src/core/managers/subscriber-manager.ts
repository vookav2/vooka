import { Queue, makeQueue } from './queue-manager'

import { MessageHandler } from '../../entities'
import { Playlist } from '@vookav2/searchmusic'
import { VoiceBasedChannel } from 'discord.js'
import { VoiceConnectionStatus } from '@discordjs/voice'
import { getContext } from '../context'
import { makeLogger } from '../../util'
import { makeVoiceConnection } from './voice-manager'

export type Subscriber = {
  guildId: string
  queue: Queue
}
type SubscriberParams = {
  guildId: string
  voiceChannel: VoiceBasedChannel
  message: MessageHandler
  getPlaylist: () => Promise<Playlist>
}

export const makeSubscriber: AsyncFuncParams<SubscriberParams, void> = async ({
  guildId,
  voiceChannel,
  getPlaylist,
  message,
}) => {
  const logger = makeLogger('Subscriber')
  logger.debug(`Creating subscriber for id: ${guildId}`)

  const [voiceConnection, playlist] = await Promise.all([makeVoiceConnection(voiceChannel), getPlaylist()])
  if (!voiceConnection) {
    throw new Error('Fail to create voice connection')
  }

  const queue = makeQueue({ voiceConnection, playlist, message })
  const subscriber = { guildId, queue }

  const context = getContext()
  const deleteSubscriber = () => {
    context.deleteFrom('subscribers', guildId)
  }

  context.addTo('subscribers', guildId, subscriber)
  voiceConnection.on(VoiceConnectionStatus.Destroyed, (_, __) => deleteSubscriber())
}
export const getSubscriber = (guildId: string) => getContext().getFrom<Subscriber | undefined>('subscribers', guildId)
