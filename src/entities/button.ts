/* eslint-disable complexity */
import { ButtonInteraction, WebhookEditMessageOptions } from 'discord.js'

import { makeMessage } from './message'

type ButtonParams = {
  customId: string
  handler: AsyncFuncParams<ButtonInteraction, string | WebhookEditMessageOptions | undefined>
  shouldDefer?: boolean
  deleteDelay?: number
  manualDelete?: boolean
}
export type Button = {
  customId: string
  handle: AsyncFuncParams<ButtonInteraction, void>
}

export const makeButton: FuncParams<ButtonParams, Button> = ({ customId, handler, deleteDelay, manualDelete }) => {
  const handle = async (_interaction: ButtonInteraction) => {
    const { customId: interactionCustomId } = _interaction
    if (interactionCustomId !== customId) {
      throw new Error(`Button interaction customId ${customId} is invalid`)
    }
    await _interaction.deferReply()
    const messageContent = await handler(_interaction)
    if (!messageContent) {
      await _interaction.deleteReply()
      return
    }
    if (!deleteDelay) {
      deleteDelay = 1000
    }
    const message = makeMessage(_interaction)

    await message.editReply(messageContent)
    if (!manualDelete) {
      await message.deleteReplyAfter(deleteDelay)
    }
  }

  return { customId, handle }
}
