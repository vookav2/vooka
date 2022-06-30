import { Message, VoiceBasedChannel } from 'discord.js'
import { Queue, makeQueue } from './queue-manager'

import { MessageHandler } from '../../entities'
import { Playlist } from '@vookav2/searchmusic'
import { VoiceConnectionStatus } from '@discordjs/voice'
import { getContext } from '../context'
import { makeLogger } from '../../util'
import { makeVoiceConnection } from './voice-manager'

export type Subscriber = {
  guildId: string
  queue: Queue
  isNoMembers: AsyncFunc<boolean>
  isWaitingToDestroy: ReturnFunc<boolean>
  waitForDestroy: AsyncFuncParams<number, void>
  cancelDestroy: AsyncFunc<void>
}
type SubscriberParams = {
  guildId: string
  voiceChannel: VoiceBasedChannel
  message: MessageHandler
  getPlaylist: AsyncFunc<Playlist>
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

  let timeoutDestroy: NodeJS.Timeout | undefined = undefined
  let waitingDestroyMessage: Message | undefined = undefined
  let cancelDestroyMessage: Message | undefined = undefined

  const deleteDestroyMessage = async () => {
    if (waitingDestroyMessage) {
      await waitingDestroyMessage.delete()
      waitingDestroyMessage = undefined
    }
    if (cancelDestroyMessage) {
      await cancelDestroyMessage.delete()
      cancelDestroyMessage = undefined
    }
  }

  const isNoMembers = async () => {
    try {
      const channelFetched = await voiceChannel.fetch()
      return channelFetched.members.filter(member => !member.user.bot).size === 0
    } catch {
      return false
    }
  }
  const isWaitingToDestroy = () => timeoutDestroy !== undefined
  const destroy = async () => {
    if (!isWaitingToDestroy()) {
      return
    }
    await deleteDestroyMessage()
    queue.destroy()
  }
  const waitForDestroy = async (ms: number) => {
    if (isWaitingToDestroy()) {
      return
    }
    await deleteDestroyMessage()
    waitingDestroyMessage = await message.followUp({
      options: 'Where you gonna go guys? I will wait for 5 minutes before leaving. ⏳',
    })
    timeoutDestroy = setTimeout(destroy, ms)
  }
  const cancelDestroy = async () => {
    if (!isWaitingToDestroy()) {
      return
    }
    await deleteDestroyMessage()
    cancelDestroyMessage = await message.followUp({ options: 'Hey, you come back. 👋' })
    clearTimeout(timeoutDestroy)
    timeoutDestroy = undefined
  }
  const subscriber: Subscriber = {
    guildId,
    queue,
    isNoMembers,
    isWaitingToDestroy,
    waitForDestroy,
    cancelDestroy,
  }

  getContext().addTo('subscribers', guildId, subscriber)
  voiceConnection.on(VoiceConnectionStatus.Destroyed, (_, __) => {
    getContext().deleteFrom('subscribers', guildId)
  })
}
export const getSubscriber = (guildId: string) => getContext().getFrom<Subscriber | undefined>('subscribers', guildId)
