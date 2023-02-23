import { getContext } from './core'
import { hashMd5 } from '@vookav2/searchmusic/build/utils'
import { pino } from 'pino'
import { setTimeout } from 'node:timers/promises'

export const config = () => getContext().get<NodeJS.ProcessEnv>('config')
export const sleep = (delay: number) => setTimeout(delay)

// STRING
export const strLimit = (str: string, length: number, end = '...') =>
  str.length > length ? str.substring(0, length) + end : str

// SAFETY
class Safety<T> {
  private static _instance: Safety<unknown>

  public constructor(private target: T) {}

  public nullOrUndefined(): NonNullable<T>
  public nullOrUndefined(error?: Error | string): NonNullable<T>
  public nullOrUndefined(error?: Error | string | CallableFunction): NonNullable<T>
  public nullOrUndefined(error?: Error | string | CallableFunction, callback?: CallableFunction): NonNullable<T> {
    if (this.isUndefined(this.target) || this.isNull(this.target)) {
      if (!this.isUndefined(callback) && this.isCallableFunction(callback)) {
        callback(this.anError(error))
      } else {
        if (this.isCallableFunction(error)) {
          error(this.anError('Safety: value is null'))
        } else {
          throw this.anError(error)
        }
      }
    }
    return this.target as NonNullable<T>
  }
  public setTarget(target: T) {
    this.target = target
    return this
  }

  private isNull(target: unknown): target is null {
    return this.target === null
  }
  private isUndefined(target: unknown): target is undefined {
    return this.target === undefined
  }
  private isCallableFunction(target: unknown): target is CallableFunction {
    return typeof target === 'function'
  }
  private anError<T>(error?: T | Error | string): T | Error {
    if (this.isUndefined(error)) {
      return new Error('Safety: unknown error')
    }
    return typeof error === 'string' ? new Error(error) : error
  }
  public static of<T>(target: T): Safety<T> {
    if (!Safety._instance) {
      Safety._instance = new Safety(target)
    }
    return Safety._instance.setTarget(target) as Safety<T>
  }
}
export const safety = Safety.of

export { ytUrl } from '@vookav2/searchmusic/build/yt-scraper/yt-util'

export const makeLogger = (childName?: string) => {
  const pinoLogger = pino({
    level: process.env.LOG_LEVEL || 'trace',
  })
  return childName ? pinoLogger.child({ name: childName }) : pinoLogger
}
export const logger = makeLogger()
export const noWhitespace = (str: string) => str.replace(/\s/g, '')
export const md5 = hashMd5
