/**
 * SubscribeWithSelector middleware for zustand-lite.
 *
 * Enhances the subscribe method to support selector-based subscriptions.
 * Only fires listener when selected state changes.
 *
 * @module middleware/subscribeWithSelector
 */

import type {
  StateCreator,
  StoreApi,
  StoreMutatorIdentifier,
  Write,
  Cast,
  Listener,
} from '../types'

// ============================================================
// TYPES
// ============================================================

/**
 * Options for selector-based subscription.
 */
export interface SubscribeWithSelectorOptions<U> {
  /** Custom equality function (defaults to Object.is) */
  equalityFn?: (a: U, b: U) => boolean
  /** Fire listener immediately with current value */
  fireImmediately?: boolean
}

/**
 * Enhanced subscribe function that supports selectors.
 *
 * @template T - State type
 */
export type SubscribeWithSelectorFn<T> = {
  /** Original subscribe (no selector) */
  (listener: Listener<T>): () => void

  /** Subscribe with selector */
  <U>(
    selector: (state: T) => U,
    listener: (selectedState: U, previousSelectedState: U) => void,
    options?: SubscribeWithSelectorOptions<U>
  ): () => void
}

// Register mutator type
declare module '../types' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface StoreMutators<S, A> {
    'zustand-lite/subscribeWithSelector': Write<
      Cast<S, StoreApi<unknown>>,
      {
        subscribe: SubscribeWithSelectorFn<
          Cast<
            S extends { getState: () => infer T } ? T : never,
            object
          >
        >
      }
    >
  }
}

// ============================================================
// MIDDLEWARE IMPLEMENTATION
// ============================================================

type SubscribeWithSelector = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initializer: StateCreator<
    T,
    [...Mps, ['zustand-lite/subscribeWithSelector', never]],
    Mcs
  >
) => StateCreator<T, Mps, [['zustand-lite/subscribeWithSelector', never], ...Mcs]>

type SubscribeWithSelectorImpl = <T>(
  initializer: StateCreator<T, [], []>
) => StateCreator<T, [], []>

/**
 * SubscribeWithSelector middleware implementation.
 */
const subscribeWithSelectorImpl: SubscribeWithSelectorImpl =
  (initializer) => (set, get, api) => {
    // Store original subscribe
    const originalSubscribe = api.subscribe

    /**
     * Enhanced subscribe that supports selectors.
     */
    const subscribeWithSelector: SubscribeWithSelectorFn<unknown> = <U>(
      selectorOrListener: ((state: unknown) => U) | Listener<unknown>,
      listener?: (selectedState: U, previousSelectedState: U) => void,
      options?: SubscribeWithSelectorOptions<U>
    ) => {
      // If no listener provided, it's the original subscribe pattern
      if (listener === undefined) {
        return originalSubscribe(selectorOrListener as Listener<unknown>)
      }

      // Selector-based subscription
      const selector = selectorOrListener as (state: unknown) => U
      const { equalityFn = Object.is, fireImmediately = false } = options ?? {}

      // Track current selected value
      let currentSlice = selector(get())

      // Fire immediately if requested
      if (fireImmediately) {
        listener(currentSlice, currentSlice)
      }

      // Subscribe to state changes
      return originalSubscribe((state, _previousState) => {
        const nextSlice = selector(state)

        // Only fire if selected value changed
        if (!equalityFn(currentSlice, nextSlice)) {
          const previousSlice = currentSlice
          currentSlice = nextSlice
          listener(nextSlice, previousSlice)
        }
      })
    }

    // Replace subscribe on API
    api.subscribe = subscribeWithSelector as typeof api.subscribe

    return initializer(set, get, api)
  }

/**
 * SubscribeWithSelector middleware.
 *
 * Enhances subscribe to support selectors, so listeners only fire
 * when the selected portion of state changes.
 *
 * @example
 * const useStore = create(
 *   subscribeWithSelector((set) => ({
 *     items: [],
 *     filter: 'all',
 *     addItem: (item) => set((s) => ({ items: [...s.items, item] })),
 *   }))
 * )
 *
 * // Subscribe to items only
 * useStore.subscribe(
 *   (state) => state.items,
 *   (items, prevItems) => {
 *     console.log('Items changed:', items.length)
 *   }
 * )
 *
 * @example
 * // With options
 * useStore.subscribe(
 *   (state) => state.filter,
 *   (filter) => console.log('Filter:', filter),
 *   {
 *     fireImmediately: true, // Fire immediately with current value
 *     equalityFn: (a, b) => a === b, // Custom equality
 *   }
 * )
 *
 * @example
 * // With shallow equality for objects
 * import { shallow } from 'zustand-lite'
 *
 * useStore.subscribe(
 *   (state) => ({ a: state.a, b: state.b }),
 *   (selected) => console.log('a or b changed'),
 *   { equalityFn: shallow }
 * )
 */
export const subscribeWithSelector =
  subscribeWithSelectorImpl as unknown as SubscribeWithSelector

export type { SubscribeWithSelector }
