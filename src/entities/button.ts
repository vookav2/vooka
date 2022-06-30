/* eslint-disable complexity */
import { ButtonInteraction, WebhookEditMessageOptions } from 'discord.js'

import { makeMessage } from './message'

type ButtonParams = {
  customId: string
  customIdStartWith?: string
  handler: AsyncFuncParams<ButtonInteraction, string | WebhookEditMessageOptions | undefined>
  shouldDefer?: boolean
  deleteDelay?: number
  manualDelete?: boolean
  hasPermission?: FuncParams<ButtonInteraction, boolean>
}
export type Button = {
  customId: string
  customIdStartWith?: string
  handle: AsyncFuncParams<ButtonInteraction, void>
}

export const makeButton: FuncParams<ButtonParams, Button> = ({
  customId,
  customIdStartWith,
  handler,
  deleteDelay,
  manualDelete,
  hasPermission,
}) => {
  const handle = async (_interaction: ButtonInteraction) => {
    await _interaction.deferReply()
    const message = makeMessage(_interaction)

    if (hasPermission && !hasPermission(_interaction)) {
      await message.editReply('You are not allowed. Please join to the voice channel first.')
      message.deleteReplyAfter(3000)
      return
    }
    const messageContent = await handler(_interaction)
    if (!messageContent) {
      await message.deleteReply()
      return
    }
    if (!deleteDelay) {
      deleteDelay = 1000
    }

    await message.editReply(messageContent)
    if (!manualDelete) {
      await message.deleteReplyAfter(deleteDelay)
    }
  }

  return { customId, customIdStartWith, handle }
}
