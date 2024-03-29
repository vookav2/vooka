import { AudioPlayer, NoSubscriberBehavior, createAudioResource } from '@discordjs/voice'
import { YouTubeStream, stream as playDlStream } from 'play-dl'
import { create as createYoutubeDL, exec as youtubeDlExec } from 'youtube-dl-exec'

import { Readable } from 'stream'
import { YOUTUBE_DL_PATH } from 'youtube-dl-exec/src/constants'
import { makeLogger } from '../../util'

export const makeAudioPlayer = () => {
  const logger = makeLogger('AudioPlayer')

  const audioPlayer = new AudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Pause,
    },
    debug: false,
  })

  audioPlayer.on('debug', debug => logger.debug(debug))
  audioPlayer.on('error', error => logger.error(error))

  return audioPlayer
}

export const createAudioResourceFromStream = <T>(stream: Readable | string | YouTubeStream, metadata?: T) => {
  if (typeof stream === 'string' || stream instanceof Readable) {
    return createAudioResource<T>(stream, {
      silencePaddingFrames: 5,
      inlineVolume: false,
      metadata,
    })
  }
  return createAudioResource<T>(stream.stream, {
    inputType: stream.type,
    silencePaddingFrames: 5,
    inlineVolume: false,
    metadata,
  })
}

export const createAudioStreamYtDl = async (id: string, _refererId?: string) =>
  new Promise<Readable>((resolve, reject) => {
    const logger = makeLogger('CreateAudioReadable')
    const childProcess = youtubeDlExec(
      `https://www.youtube.com/watch?v=${id}`,
      {
        quiet: true,
        output: '-',
        format: 'ba[aext=webm][acodec=opus][asr=48000]/ba[acodec=opus]',
        addHeader: [
          'referer:youtube.com',
          'user-agent:Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        ],
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

export const createAudioWebmUrl = async (id: string, _refererId?: string) => {
  const logger = makeLogger('CreateAudioWebmUrl')
  const youtubeDl = createYoutubeDL(YOUTUBE_DL_PATH)
  const url = `https://www.youtube.com/watch?v=${id}`

  logger.debug('Create audio webm url')
  logger.debug(url)

  const ytResponse = await youtubeDl(url, {
    dumpSingleJson: true,
    noCheckCertificates: true,
    noWarnings: true,
    format: 'ba[aext=webm][acodec=opus][asr=48000]/ba[acodec=opus]',
    addHeader: [
      'referer:youtube.com',
      'user-agent:Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    ],
  })

  logger.debug('Got response from youtube-dl')
  logger.debug(ytResponse.url)

  return ytResponse?.url ?? null
}

export const createAudioStream = async (id: string, _refererId?: string) => {
  const logger = makeLogger('createAudioStream[PlayDL]')
  const url = `https://www.youtube.com/watch?v=${id}`

  logger.debug('Create audio stream')
  return await playDlStream(url, {
    htmldata: false,
  })
}
