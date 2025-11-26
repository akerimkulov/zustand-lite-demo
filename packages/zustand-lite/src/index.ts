/**
 * zustand-lite - Lightweight state management library inspired by Zustand.
 *
 * @packageDocumentation
 * @module zustand-lite
 *
 * @example
 * // Basic usage
 * import { create } from 'zustand-lite'
 *
 * const useStore = create((set) => ({
 *   count: 0,
 *   increment: () => set((s) => ({ count: s.count + 1 })),
 * }))
 *
 * function Counter() {
 *   const count = useStore((s) => s.count)
 *   return <span>{count}</span>
 * }
 *
 * @example
 * // With middleware
 * import { create } from 'zustand-lite'
 * import { persist, devtools } from 'zustand-lite/middleware'
 *
 * const useStore = create(
 *   devtools(
 *     persist(
 *       (set) => ({ count: 0 }),
 *       { name: 'counter' }
 *     )
 *   )
 * )
 */

// Main exports
export { create, useStore, createStore, shallow } from './react'

// Type exports
export type {
  StateCreator,
  StoreApi,
  StoreMutatorIdentifier,
  Mutate,
  UseBoundStore,
  ExtractState,
  Selector,
  EqualityFn,
  ReadonlyStoreApi,
  Listener,
  SetState,
  GetState,
  Subscribe,
} from './types'
