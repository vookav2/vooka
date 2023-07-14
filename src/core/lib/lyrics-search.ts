import songlyrics, { TLyrics } from 'songlyrics'

import { makeLogger } from '../../util'

export const lyricsSearch = async (query: string, _key?: string): Promise<TLyrics | undefined> => {
  const logger = makeLogger('LyricsSearch')
  logger.debug(`Searching for lyrics for ${query}`)
  return songlyrics(query).catch(err => {
    logger.error(err)
    return undefined
  })
}
