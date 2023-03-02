import { AudioPlayer, NoSubscriberBehavior, createAudioResource } from '@discordjs/voice'
import { create as createYoutubeDL, exec as youtubeDlExec } from 'youtube-dl-exec'

import { Readable } from 'stream'
import { YOUTUBE_DL_PATH } from 'youtube-dl-exec/src/constants'
import { makeLogger } from '../../util'

export const makeAudioPlayer = () => {
  const logger = makeLogger('AudioPlayer')

  const audioPlayer = new AudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play,
    },
    debug: true,
  })

  audioPlayer.on('debug', debug => logger.debug(debug))
  audioPlayer.on('error', error => logger.error(error))

  return audioPlayer
}

export const createAudioResourceFromStream = <T>(stream: Readable | string, metadata?: T) =>
  createAudioResource<T>(stream, {
    // inputType: StreamType.WebmOpus,
    silencePaddingFrames: 5,
    inlineVolume: false,
    metadata,
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
    limitRate: '100K',
    addHeader: [
      'referer:youtube.com',
      'user-agent:Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    ],
  })

  logger.debug('Got response from youtube-dl')
  logger.debug(ytResponse.url)

  return ytResponse?.url ?? null
}

export const createAudioStream = async (id: string, _refererId?: string) =>
  new Promise<Readable>((resolve, reject) => {
    const logger = makeLogger('CreateAudioReadable')
    const childProcess = youtubeDlExec(
      `https://www.youtube.com/watch?v=${id}`,
      {
        noCheckCertificates: true,
        noWarnings: true,
        quiet: true,
        output: '-',
        retries: 7,
        // format: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio',
        format: 'ba[aext=webm][acodec=opus][asr=48000]/ba[acodec=opus]',
        limitRate: '100K',
        userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        // referer: refererId ? `https://music.youtube.com/watch?v=${refererId}` : 'https://music.youtube.com',
        referer: 'music.youtube.com',
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
