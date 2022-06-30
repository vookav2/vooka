import {
  ButtonInteraction,
  CommandInteraction,
  Message,
  MessageEditOptions,
  MessageOptions,
  MessagePayload,
  WebhookEditMessageOptions,
} from 'discord.js'

import { sleep } from '../util'

type Interaction = ButtonInteraction | CommandInteraction

export type MessageHandler = {
  message: Message | null
  followUp: AsyncFuncParams<string | MessageOptions | MessagePayload, void>
  editReply: AsyncFuncParams<string | MessageEditOptions | WebhookEditMessageOptions, void>
  deleteReply: AsyncFunc<void>
  deleteReplyAfter: AsyncFuncParams<number, void>
}
export const makeMessage: FuncParams<Interaction, MessageHandler> = _interaction => {
  let message: Message | null = null
  let interaction: Interaction | null = _interaction

  const destroy = (): void => {
    message = null
    interaction = null
  }

  const saveMessage = (_newMessage: unknown) => {
    message = _newMessage as Message
    interaction = null
  }

  const followUp: MessageHandler['followUp'] = async _options => {
    if (!message) {
      return
    }
    const followUpMessage = await message.channel.send(_options)
    sleep(3000)
      .then(() => followUpMessage.delete())
      .catch(() => true)
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
      await interaction.deleteReply().catch(() => true)
    } else if (message && message.deletable) {
      await message.delete().catch(() => true)
    }
    destroy()
  }

  const deleteReplyAfter: MessageHandler['deleteReplyAfter'] = async delay => {
    sleep(delay).then(deleteReply)
  }

  return {
    message,
    editReply,
    deleteReply,
    deleteReplyAfter,
    followUp,
  }
}
