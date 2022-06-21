import songlyrics, { TLyrics } from 'songlyrics'

import { makeLogger } from '../../util'

export const lyricsSearch = async (query: string, _key?: string): Promise<TLyrics | undefined> => {
  const logger = makeLogger('LyricsSearch')
  logger.debug(`Searching for lyrics for ${query}`)
  // const cache = await makeCacheRedis()
  // key = key ?? cache.createKey(query, 'lyrics')

  // const resultFromCache = await cache.getString(key)
  // if (resultFromCache) {
  //   return JSON.parse(resultFromCache)
  // }

  // const result = safety(await songlyrics(query)).nullOrUndefined()
  // await cache.setString(key, JSON.stringify(result))

  // return result
  return songlyrics(query).catch(err => {
    logger.error(err)
    return undefined
  })
}
