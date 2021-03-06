export * from './Lincoln'
export * from './Scrubs'

import { Is } from '@nofrills/types'
import { Lincoln, Logger } from './Logging'
import { Registry, Scrubber, Scrubs, ScrubsOptions } from './Scrubs'

import merge = require('lodash.merge')

const log: Lincoln = Logger.extend('scrubslib')

Registry.register<any[]>('array', (value: any[], options: ScrubsOptions, instance: Scrubs): any[] => {
  return value.map((v) => instance.scrub(v))
})

Registry.register<any>('object', (value: any, options: ScrubsOptions, instance: Scrubs): any => {
  const walk = (object: any): any => {
    Object.keys(object).forEach((key: string) => {
      if (options.properties.indexOf(key) >= 0) {
        object[key] = options.text
      } else if (Is.array(object[key]) || Is.object(object[key])) {
        object[key] = walk(object[key])
      } else if (Is.string(object[key])) {
        object[key] = instance.scrub<string>(object[key])
      } else {
        object[key] = value
      }
    })
    return object
  }

  const clone: any = walk(merge({}, value))
  log.debug('ObjectScrubber', value, clone)
  return clone
})

Registry.register<string>('string', (value: string, options: ScrubsOptions): string => {
  const regex: RegExp = new RegExp(`([${options.properties.join('|')}]=[\'"]?)\\w+([\'"]?&?)`, 'g')
  const transformed: string = value.replace(regex, `$1${options.text}$2`)
  log.debug('StringScrubber', value, transformed)
  return transformed
})

Registry.register<string>('string', (value: string, options: ScrubsOptions): string => {
  const regex: RegExp = /(http[s]:\/\/\w+:)\w+(@.*)/g
  const transformed: string = value.replace(regex, `$1${options.text}$2`)
  log.debug('StringScrubber', value, transformed)
  return transformed
})
