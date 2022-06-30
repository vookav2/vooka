import { ApplicationCommandOptionChoiceData, AutocompleteInteraction, CommandInteraction } from 'discord.js'
import { MessageHandler, makeMessage } from './message'

type HandlerParams = {
  interaction: CommandInteraction
  message: MessageHandler
}
type CommandParams = {
  commandId: string
  slashCommand: any
  handler: AsyncFuncParams<HandlerParams, void>
  autocompleteHandler?: AsyncFuncParams<ApplicationCommandOptionChoiceData, ApplicationCommandOptionChoiceData[]>
}
export type Command = {
  commandId: string
  handle: AsyncFuncParams<CommandInteraction, void>
  handleAutocomplete?: AsyncFuncParams<AutocompleteInteraction, void>
  slashCommand: any
}
export const makeCommand: FuncParams<CommandParams, Command> = ({
  commandId,
  autocompleteHandler,
  handler,
  slashCommand,
}) => {
  const handle: Command['handle'] = async interaction => {
    await interaction.deferReply()

    const message = makeMessage(interaction)
    await handler({
      interaction,
      message,
    }).catch(_error => {
      message.deleteReplyAfter(3000)
    })
  }
  const handleAutocomplete: Command['handleAutocomplete'] = async interaction => {
    if (!autocompleteHandler) {
      return
    }
    const data = interaction.options.getFocused(true)
    const choices = await autocompleteHandler(data)
    await interaction.respond(choices)
  }

  return {
    commandId,
    handle,
    handleAutocomplete,
    slashCommand,
  }
}
