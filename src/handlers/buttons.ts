import { Button, MessageHandler, makeButton } from '../entities'
import { ButtonInteraction, Collection, GuildMember, Message } from 'discord.js'
import { getContext, getSubscriber, lyricsSearch, makeLyricsEmbeds } from '../core'

export const makePlayerButtons = () => {
  const buttons: Collection<string, Button> = new Collection()
  const deleteDelay = 3000

  const getQueue = (guildId: string) => {
    const subscriber = getSubscriber(guildId)
    return subscriber?.queue
  }

  const hasPermission = ({ guildId, member }: ButtonInteraction) => {
    const subscriber = getSubscriber(guildId!)
    if (!subscriber) {
      return false
    }
    return (member as GuildMember).voice.channel !== null
  }

  const previousButton = makeButton({
    customId: 'player@prev',
    deleteDelay,
    hasPermission,
    handler: async ({ guildId }) => {
      if (!guildId) {
        return
      }
      getQueue(guildId)?.previous()
      return 'Play previous song 🫡'
    },
  })
  const nextButton = makeButton({
    customId: 'player@next',
    deleteDelay,
    hasPermission,
    handler: async ({ guildId }) => {
      if (!guildId) {
        return
      }
      getQueue(guildId)?.next(true)
      return 'Play next song 🫡'
    },
  })
  const playButton = makeButton({
    customId: 'player@play',
    deleteDelay,
    hasPermission,
    handler: async ({ guildId }) => {
      if (!guildId) {
        return
      }
      getQueue(guildId)?.unpause()
      return 'Unpause 🫡'
    },
  })
  const pauseButton = makeButton({
    customId: 'player@pause',
    deleteDelay,
    hasPermission,
    handler: async ({ guildId }) => {
      if (!guildId) {
        return
      }
      getQueue(guildId)?.pause()
      return 'Pause 🫡'
    },
  })
  const stopButton = makeButton({
    customId: 'player@stop',
    deleteDelay,
    hasPermission,
    handler: async ({ guildId }) => {
      if (!guildId) {
        return
      }
      getQueue(guildId)?.destroy()
      return 'Stop 🫡'
    },
  })
  const repeatCurrentButton = makeButton({
    customId: 'player@repeatCurrent',
    deleteDelay,
    hasPermission,
    handler: async ({ guildId }) => {
      if (!guildId) {
        return
      }
      getQueue(guildId)?.setRepeat()
      return 'Repeat current song 🫡'
    },
  })
  const lyricsButton = makeButton({
    customId: 'player@lyrics',
    deleteDelay,
    hasPermission,
    manualDelete: true,
    handler: async _interaction => {
      const { guildId } = _interaction
      if (!guildId) {
        return
      }
      const queue = getQueue(guildId)
      if (!queue) {
        return
      }
      const { title, channel, hash } = queue.currentSong()!
      const lyrics = await lyricsSearch(`${title} ${channel.name}`, hash)
      if (!lyrics) {
        return
      }
      const message = await _interaction.fetchReply()
      queue.addDeleteMessage(message as Message)
      return {
        content: '\u200B',
        embeds: makeLyricsEmbeds(lyrics),
      }
    },
  })

  const removeLyricsButton = makeButton({
    customId: 'guild:lyrics:{messageId}',
    customIdStartWith: 'guild:lyrics:',
    shouldDefer: true,
    handler: async ({ customId, guildId }) => {
      if (!guildId) {
        return
      }
      const messageId = customId.replace('guild:lyrics:', '')
      const lyricsContent = getContext().getFrom<MessageHandler | undefined>('lyrics', messageId)
      if (!lyricsContent) {
        return
      }
      await lyricsContent.deleteReply()
      return 'Remove content 🫡'
    },
  })

  buttons.set(previousButton.customId, previousButton)
  buttons.set(nextButton.customId, nextButton)
  buttons.set(playButton.customId, playButton)
  buttons.set(pauseButton.customId, pauseButton)
  buttons.set(stopButton.customId, stopButton)
  buttons.set(repeatCurrentButton.customId, repeatCurrentButton)
  buttons.set(lyricsButton.customId, lyricsButton)
  buttons.set(removeLyricsButton.customId, removeLyricsButton)

  return buttons
}
