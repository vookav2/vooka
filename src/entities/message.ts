import {
  ButtonInteraction,
  CommandInteraction,
  Message,
  MessageEditOptions,
  WebhookEditMessageOptions,
} from 'discord.js'

import { sleep } from '../util'

type Interaction = ButtonInteraction | CommandInteraction

export type MessageHandler = {
  editReply: AsyncFuncParams<string | MessageEditOptions | WebhookEditMessageOptions, void>
  deleteReply: AsyncFunc<void>
  deleteReplyAfter: AsyncFuncParams<number, void>
}
export const makeMessage: FuncParams<Interaction, MessageHandler> = _interaction => {
  let message: Message | null
  let interaction: Interaction | null = _interaction

  const destroy = (): void => {
    message = null
    interaction = null
  }

  const saveMessage = (_newMessage: unknown) => {
    message = _newMessage as Message
    interaction = null
  }

  const editReply: MessageHandler['editReply'] = async _options => {
    if (interaction) {
      await interaction.editReply(_options as WebhookEditMessageOptions).then(saveMessage)
    } else if (message && message.editable) {
      await message.edit(_options).then(saveMessage)
    } else {
      throw new Error('No message to edit')
    }
  }

  const deleteReply: MessageHandler['deleteReply'] = async () => {
    if (interaction) {
      await interaction.deleteReply().then(saveMessage)
    } else if (message && message.deletable) {
      await message.delete().then(saveMessage)
    }
    destroy()
  }

  const deleteReplyAfter: MessageHandler['deleteReplyAfter'] = async delay => {
    await sleep(delay).then(deleteReply)
  }

  return {
    editReply,
    deleteReply,
    deleteReplyAfter,
  }
}
