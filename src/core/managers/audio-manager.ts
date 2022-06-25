import { AudioPlayer, NoSubscriberBehavior, StreamType, createAudioResource } from '@discordjs/voice'

import { Readable } from 'stream'
import { exec } from 'youtube-dl-exec'
import { makeLogger } from '../../util'

export const makeAudioPlayer = () => {
  const logger = makeLogger('AudioPlayer')

  const audioPlayer = new AudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Pause,
    },
    debug: true,
  })

  audioPlayer.on('debug', debug => logger.debug(debug))
  audioPlayer.on('error', error => logger.error(error))

  return audioPlayer
}

export const createAudioResourceFromStream = <T>(stream: Readable, metadata?: T) =>
  createAudioResource<T>(stream, {
    inputType: StreamType.WebmOpus,
    silencePaddingFrames: 5,
    inlineVolume: false,
    metadata,
  })

export const createAudioStream = async (id: string, refererId?: string) =>
  new Promise<Readable>((resolve, reject) => {
    const logger = makeLogger('CreateAudioReadable')
    const childProcess = exec(
      `https://www.youtube.com/watch?v=${id}`,
      {
        quiet: true,
        output: '-',
        retries: 7,
        format: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio',
        limitRate: '100K',
        referer: refererId ? `https://music.youtube.com/watch?v=${refererId}` : 'https://music.youtube.com',
      },
      {
        stdio: ['ignore', 'pipe', 'ignore'],
      }
    )

    logger.debug('Created child process')
    logger.debug(childProcess.spawnargs)
    if (childProcess.stdout === null) {
      return reject(new Error('AudioStream: Failed to spawn child process'))
    }
    const stdout = childProcess.stdout
    const onChildProcessSpawn = () => resolve(stdout)
    const onChildProcessSpawnError = (_reason: any) => {
      stdout.destroy()
      if (!childProcess.killed) {
        logger.debug('Kill child process')
        childProcess.kill()
      }
      stdout.resume()
      reject(new Error('AudioStream: Failed to read stream'))
    }

    childProcess.once('spawn', onChildProcessSpawn).catch(onChildProcessSpawnError)
  })
