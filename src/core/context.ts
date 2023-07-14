import { existsSync, readFileSync } from 'fs'

import { Collection } from 'discord.js'
import { EventEmitter } from 'events'
import { makeCommands } from '../handlers/commands'
import { makePlayerButtons } from '../handlers'

class Context extends EventEmitter {
  private static _context: Context

  public constructor(private _contexts: Map<symbol, unknown> = new Map()) {
    super()
    this._init()
  }
  public add<T>(key: string, value: T): T {
    this._contexts.set(Symbol.for(key), value)

    return value
  }
  public get<T>(key: string): T {
    return this._contexts.get(Symbol.for(key)) as T
  }
  public getFrom<T>(from: string, key: string): T {
    return this.get<Map<symbol, T>>(from).get(Symbol.for(key)) as T
  }
  public addTo<T>(to: string, key: string, value: T): T {
    let collection = this.get<Collection<symbol, T> | undefined>('to')
    if (!collection) {
      collection = this.add(to, new Collection<symbol, T>())
    }
    collection.set(Symbol.for(key), value)

    return value
  }
  public deleteFrom(from: string, key: string): boolean {
    return this.get<Map<symbol, unknown>>(from).delete(Symbol.for(key))
  }
  public destroy(): void {
    this._clean()
  }
  private _init(): void {
    this.add('subscribers', new Map<symbol, unknown>())
    this.add('commands', makeCommands())
    this.add('buttons', makePlayerButtons())
    this.add('config', this._initConfig())

    this.setMaxListeners(1)
  }
  private _initConfig(): NodeJS.ProcessEnv {
    const path = './config.json'
    if (existsSync(path)) {
      const text = readFileSync(path, 'utf-8')
      return JSON.parse(text)
    } else {
      const {
        NODE_ENV,
        LOG_LEVEL,
        TOKEN,
        CLIENT_ID,
        GUILD_TEST_ID,
        CHANNEL_TEST_ID,
        APP_ID,
        // REDIS_URI
      } = process.env
      return {
        NODE_ENV,
        LOG_LEVEL,
        TOKEN,
        CLIENT_ID,
        GUILD_TEST_ID,
        CHANNEL_TEST_ID,
        APP_ID,
        // REDIS_URI,
      }
    }
  }
  private _clean(): void {
    this._contexts.clear()
    this.removeAllListeners()
  }
  public static getContext(): Context {
    if (!Context._context) {
      Context._context = new Context()
    }
    return Context._context
  }
}

export const getContext = (): Context => Context.getContext()
