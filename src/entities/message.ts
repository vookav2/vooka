import {
  BaseMessageOptions,
  ButtonInteraction,
  ChannelType,
  CommandInteraction,
  Message,
  MessageEditOptions,
  MessagePayload,
  WebhookEditMessageOptions,
} from 'discord.js'

import { sleep } from '../util'

type Interaction = ButtonInteraction | CommandInteraction

export type MessageHandler = {
  message: Message | null
  followUp: AsyncFuncParams<
    { options: string | BaseMessageOptions | MessagePayload; deleteAfter?: number },
    Message<boolean> | undefined
  >
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

  const followUp: MessageHandler['followUp'] = async ({ options, deleteAfter }) => {
    if (!message || !message.channel.isTextBased() || message.channel.type === ChannelType.GuildStageVoice) {
      return
    }
    const followUpMessage = await message.channel.send(options)
    if (deleteAfter) {
      sleep(deleteAfter)
        .then(() => followUpMessage.delete() as any)
        .catch(() => true)
    }

    return followUpMessage
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
