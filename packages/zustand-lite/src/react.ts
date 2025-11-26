/**
 * React bindings for zustand-lite.
 *
 * This module provides React hooks and the main `create` function.
 * It follows Single Responsibility Principle - only handles React integration.
 *
 * @module react
 */

import { useSyncExternalStore, useCallback, useRef } from 'react'
import { createStore as createVanillaStore } from './vanilla'
import type {
  StateCreator,
  StoreApi,
  StoreMutatorIdentifier,
  Mutate,
  UseBoundStore,
  Selector,
  EqualityFn,
  ReadonlyStoreApi,
} from './types'

// ============================================================
// USE STORE HOOK
// ============================================================

/**
 * React hook to subscribe to a store with optional selector.
 *
 * Uses React 18's useSyncExternalStore for:
 * - Safe concurrent rendering
 * - Automatic subscription cleanup
 * - SSR support
 *
 * @template T - Store state type
 * @template U - Selected value type
 * @param api - Store API
 * @param selector - Optional selector function (defaults to identity)
 * @param equalityFn - Optional equality function (defaults to Object.is)
 * @returns Selected state value
 *
 * @example
 * const count = useStore(counterStore, (state) => state.count)
 */
export function useStore<T, U = T>(
  api: ReadonlyStoreApi<T>,
  selector: Selector<T, U> = (state) => state as unknown as U,
  equalityFn: EqualityFn<U> = Object.is
): U {
  // Store selector and equality function in refs to avoid re-creating getSnapshot
  const selectorRef = useRef(selector)
  const equalityFnRef = useRef(equalityFn)
  const sliceRef = useRef<U>()
  const stateRef = useRef<T>()

  // Initialize slice on first render
  if (sliceRef.current === undefined) {
    sliceRef.current = selector(api.getState())
  }

  // Update refs synchronously (before render)
  selectorRef.current = selector
  equalityFnRef.current = equalityFn

  // Stable getSnapshot - only depends on api
  const getSnapshot = useCallback(() => {
    const state = api.getState()
    const currentSelector = selectorRef.current
    const currentEqualityFn = equalityFnRef.current

    // If state reference is the same, return cached slice
    if (stateRef.current === state && sliceRef.current !== undefined) {
      return sliceRef.current
    }

    const nextSlice = currentSelector(state)

    // Return cached slice if equal (prevents unnecessary re-renders)
    if (sliceRef.current !== undefined && currentEqualityFn(sliceRef.current, nextSlice)) {
      // Update state ref but keep the same slice reference
      stateRef.current = state
      return sliceRef.current
    }

    // Update both refs
    stateRef.current = state
    sliceRef.current = nextSlice
    return nextSlice
  }, [api])

  // Get server snapshot (for SSR)
  const getServerSnapshot = useCallback(() => {
    return selectorRef.current(api.getInitialState())
  }, [api])

  return useSyncExternalStore(api.subscribe, getSnapshot, getServerSnapshot)
}

// ============================================================
// CREATE STORE HOOK
// ============================================================

/**
 * Internal implementation of create.
 *
 * @template T - Store state type
 * @template Mos - Middleware output mutators
 * @param createState - State creator function
 * @returns Bound store hook
 */
function createImpl<T, Mos extends [StoreMutatorIdentifier, unknown][] = []>(
  createState: StateCreator<T, [], Mos>
): UseBoundStore<Mutate<StoreApi<T>, Mos>> {
  // Create the vanilla store
  const api = createVanillaStore(createState) as Mutate<StoreApi<T>, Mos>

  // Create the bound hook
  const useBoundStore = <U = T>(
    selector?: Selector<T, U>,
    equalityFn?: EqualityFn<U>
  ): U => {
    // If no selector, return full state with identity selector
    if (selector === undefined) {
      // When no selector provided, U defaults to T
      // Cast through unknown is required because TypeScript can't infer U = T
      return useStore(api, (state: T) => state) as unknown as U
    }

    return useStore(api, selector, equalityFn)
  }

  // Attach store API methods to the hook
  Object.assign(useBoundStore, api)

  return useBoundStore as UseBoundStore<Mutate<StoreApi<T>, Mos>>
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Creates a React hook bound to a store.
 *
 * Supports two calling patterns:
 * 1. `create(initializer)` - direct creation with type inference
 * 2. `create<State>()(initializer)` - curried for explicit typing
 *
 * The curried pattern is recommended when:
 * - State type is complex
 * - Using middleware
 * - Need explicit type annotations
 *
 * @example
 * // Direct creation (type inferred)
 * const useCounterStore = create((set) => ({
 *   count: 0,
 *   increment: () => set((s) => ({ count: s.count + 1 })),
 * }))
 *
 * @example
 * // Curried with explicit type
 * interface CounterState {
 *   count: number
 *   increment: () => void
 * }
 *
 * const useCounterStore = create<CounterState>()((set) => ({
 *   count: 0,
 *   increment: () => set((s) => ({ count: s.count + 1 })),
 * }))
 *
 * @example
 * // Using in component
 * function Counter() {
 *   const count = useCounterStore((state) => state.count)
 *   const increment = useCounterStore((state) => state.increment)
 *
 *   return <button onClick={increment}>{count}</button>
 * }
 *
 * @example
 * // Access store API directly
 * useCounterStore.getState() // Get current state
 * useCounterStore.setState({ count: 5 }) // Set state directly
 * useCounterStore.subscribe((state) => console.log(state)) // Subscribe
 */
type Create = {
  // Direct form - type inference from initializer
  <T, Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>
  ): UseBoundStore<Mutate<StoreApi<T>, Mos>>

  // Curried form - explicit type parameter
  <T>(): <Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>
  ) => UseBoundStore<Mutate<StoreApi<T>, Mos>>
}

/**
 * Creates a store with React bindings.
 *
 * @see Create for detailed documentation
 */
export const create = (<T>(
  createState?: StateCreator<T, [], []>
): UseBoundStore<StoreApi<T>> | (<Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>
  ) => UseBoundStore<Mutate<StoreApi<T>, Mos>>) => {
  // If no createState, return curried function
  if (createState === undefined) {
    return <Mos extends [StoreMutatorIdentifier, unknown][] = []>(
      initializer: StateCreator<T, [], Mos>
    ) => createImpl(initializer)
  }

  return createImpl(createState)
}) as Create

// Re-export types and utilities
export { createStore } from './vanilla'
export { shallow } from './utils/shallow'
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
