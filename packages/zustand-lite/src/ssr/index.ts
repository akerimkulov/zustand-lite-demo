/**
 * SSR utilities for zustand-lite.
 *
 * @module ssr
 *
 * @example
 * import {
 *   createStoreContext,
 *   useHydration,
 *   HydrationBoundary,
 * } from 'zustand-lite/ssr'
 */

export { createStoreContext } from './context'
export type { StoreProviderProps, StoreContextValue } from './context'

export {
  useHydration,
  HydrationBoundary,
  useStoreHydrated,
  isServer,
  isClient,
} from './hydration'
export type { HydrationBoundaryProps } from './hydration'
