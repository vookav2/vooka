import { config, makeLogger, md5, noWhitespace } from '../../util'

import { Logger } from 'pino'
import { createClient } from 'redis'
import { getContext } from '../context'

class CacheRedis {
  private static _instance: CacheRedis
  private _client: ReturnType<typeof createClient>
  private _logger: Logger

  public constructor() {
    this._logger = makeLogger('CacheRedis')
    this._client = createClient({
      url: config().REDIS_URI,
    })

    this._client.on('error', err => this._logger.error(err))
    this._client.on('connect', () => this._logger.info('Connecting to Redis'))
    this._client.on('reconnecting', () => this._logger.info('Reconnecting to Redis'))
    this._client.on('ready', () => this._logger.info('Redis is ready'))
    this._client.on('end', () => this._logger.info('Redis connection ended'))
  }

  public setString(key: string, data: string) {
    return this._client.set(key, data)
  }

  public getString(key: string) {
    return this._client.get(key)
  }

  public createKey(any: string, prefix = 'cache') {
    const hash = md5(noWhitespace(any))
    return `${prefix || ''}:${hash}`
  }

  public static async create() {
    if (!this._instance) {
      this._instance = new CacheRedis()
    }
    await this._instance._connect()
    return this._instance
  }

  private async _connect(): Promise<void> {
    if (!this._client.isOpen) {
      await this._client.connect()
    }
  }
}

export const makeCacheRedis = () => CacheRedis.create().then(cache => getContext().add('cache', cache))
