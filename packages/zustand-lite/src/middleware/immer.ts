/**
 * Immer middleware for zustand-lite.
 *
 * Enables mutable-style state updates using Immer's produce function.
 * The middleware intercepts setState calls and wraps them with produce.
 *
 * @module middleware/immer
 */

import { produce, type Draft } from 'immer'
import type {
  StateCreator,
  StoreApi,
  StoreMutatorIdentifier,
  Write,
  Cast,
  Get,
} from '../types'

// ============================================================
// TYPES
// ============================================================

/**
 * Modified SetState type that accepts Immer-style updaters.
 *
 * @template T - State type
 */
type SetStateImmer<T> = {
  (
    partial:
      | T
      | Partial<T>
      | ((draft: Draft<T>) => void | T | Partial<T>),
    replace?: false
  ): void
  (
    state: T | ((draft: Draft<T>) => T),
    replace: true
  ): void
}

// Register mutator type
declare module '../types' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface StoreMutators<S, A> {
    'zustand-lite/immer': Write<
      Cast<S, StoreApi<unknown>>,
      {
        setState: SetStateImmer<Cast<Get<S, 'getState', never> extends () => infer T ? T : never, object>>
      }
    >
  }
}

// ============================================================
// MIDDLEWARE IMPLEMENTATION
// ============================================================

type Immer = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initializer: StateCreator<T, [...Mps, ['zustand-lite/immer', never]], Mcs>
) => StateCreator<T, Mps, [['zustand-lite/immer', never], ...Mcs]>

type ImmerImpl = <T>(
  initializer: StateCreator<T, [], []>
) => StateCreator<T, [], []>

/**
 * Immer middleware implementation.
 */
const immerImpl: ImmerImpl = (initializer) => (set, get, api) => {
  /**
   * Wrapped setState that uses Immer's produce for function updaters.
   */
  const setWithImmer: typeof set = (partial, replace) => {
    // If partial is a function, wrap with produce
    if (typeof partial === 'function') {
      const updater = partial as (draft: Draft<unknown>) => void | unknown

      set(
        produce(get() as object, (draft) => {
          const result = updater(draft as Draft<never>)
          // If updater returns a value, use it (allows returning new state)
          if (result !== undefined) {
            return result as never
          }
        }) as never,
        replace as never
      )
    } else {
      // Non-function partials are passed through
      set(partial, replace as never)
    }
  }

  // Replace setState on the API
  api.setState = setWithImmer

  // Initialize with the wrapped set
  return initializer(setWithImmer as never, get, api)
}

/**
 * Immer middleware.
 *
 * Enables mutable-style state updates that are converted to immutable updates.
 *
 * @example
 * const useStore = create(
 *   immer((set) => ({
 *     items: [],
 *     addItem: (item) => set((draft) => {
 *       draft.items.push(item) // Mutable syntax!
 *     }),
 *     removeItem: (id) => set((draft) => {
 *       draft.items = draft.items.filter(i => i.id !== id)
 *     }),
 *   }))
 * )
 *
 * @example
 * // Composing with other middleware
 * const useStore = create(
 *   devtools(
 *     persist(
 *       immer((set) => ({
 *         count: 0,
 *         increment: () => set((draft) => { draft.count++ }),
 *       })),
 *       { name: 'counter' }
 *     )
 *   )
 * )
 */
export const immer = immerImpl as unknown as Immer

export type { Immer, SetStateImmer }
