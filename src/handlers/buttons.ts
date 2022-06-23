import { Button, makeButton } from '../entities'
import { ButtonInteraction, GuildMember, Message } from 'discord.js'
import { getSubscriber, lyricsSearch, makeLyricsEmbeds } from '../core'

export const makePlayerButtons = () => {
  const buttons: Map<string, Button> = new Map()
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

  buttons.set(previousButton.customId, previousButton)
  buttons.set(nextButton.customId, nextButton)
  buttons.set(playButton.customId, playButton)
  buttons.set(pauseButton.customId, pauseButton)
  buttons.set(stopButton.customId, stopButton)
  buttons.set(repeatCurrentButton.customId, repeatCurrentButton)
  buttons.set(lyricsButton.customId, lyricsButton)

  return buttons
}
