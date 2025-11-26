/**
 * Middleware exports for zustand-lite.
 *
 * @module middleware
 *
 * @example
 * import { persist, devtools, immer, combine, subscribeWithSelector } from 'zustand-lite/middleware'
 */

export { persist, createJSONStorage } from './persist'
export type { PersistOptions, PersistStorage, StorageValue, PersistApi } from './persist'

export { devtools } from './devtools'
export type { DevtoolsOptions, DevtoolsApi } from './devtools'

export { immer } from './immer'
export type { SetStateImmer } from './immer'

export { combine } from './combine'
export type { Combine } from './combine'

export { subscribeWithSelector } from './subscribeWithSelector'
export type {
  SubscribeWithSelectorOptions,
  SubscribeWithSelectorFn,
} from './subscribeWithSelector'
