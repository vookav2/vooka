import { Button, makeButton } from '../entities'
import { Subscriber, getSubscriber, lyricsSearch, makeLyricsEmbeds } from '../core'

import { Message } from 'discord.js'

export const makePlayerButtons = () => {
  const buttons: Map<string, Button> = new Map()
  const deleteDelay = 3000

  const getQueue = (guildId: string) => {
    const subscriber = getSubscriber(guildId) as Subscriber
    return subscriber.queue
  }

  const previousButton = makeButton({
    customId: 'player@prev',
    deleteDelay,
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
