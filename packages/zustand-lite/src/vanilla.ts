/**
 * Vanilla (framework-agnostic) store implementation.
 *
 * This module provides the core store functionality without any React dependencies.
 * It follows Single Responsibility Principle - only handles state management.
 *
 * @module vanilla
 */

import type {
  StateCreator,
  StoreApi,
  StoreMutatorIdentifier,
  Mutate,
  Listener,
  SetState,
  GetState,
  Subscribe,
} from './types'

// ============================================================
// HELPER FUNCTIONS (Single Responsibility)
// ============================================================

/**
 * Computes the next state from current state and an update.
 *
 * @template T - The state type
 * @param currentState - Current state
 * @param partial - Partial state or updater function
 * @returns The computed next state (may be partial)
 */
const computeNextState = <T>(
  currentState: T,
  partial: T | Partial<T> | ((state: T) => T | Partial<T>)
): T | Partial<T> => {
  return typeof partial === 'function'
    ? (partial as (state: T) => T | Partial<T>)(currentState)
    : partial
}

/**
 * Notifies all listeners about state change.
 * Uses for...of loop for better performance than forEach.
 *
 * @template T - The state type
 * @param listeners - Set of listener functions
 * @param state - New state
 * @param previousState - Previous state
 */
const notifyListeners = <T>(
  listeners: Set<Listener<T>>,
  state: T,
  previousState: T
): void => {
  for (const listener of listeners) {
    listener(state, previousState)
  }
}

// ============================================================
// CREATE STORE IMPLEMENTATION
// ============================================================

/**
 * Internal implementation of createStore.
 * Separated for clean type inference.
 *
 * @template T - The state type
 * @param createState - State creator function
 * @returns Store API
 */
const createStoreImpl = <T>(createState: StateCreator<T, [], []>): StoreApi<T> => {
  /** Current state */
  let state: T

  /** Set of listener functions */
  const listeners = new Set<Listener<T>>()

  /**
   * Returns the current state.
   */
  const getState: GetState<T> = () => state

  /**
   * Returns the initial state (captured after creation).
   * Used for SSR and hydration.
   */
  let initialState: T
  const getInitialState = () => initialState

  /**
   * Updates the state and notifies listeners.
   *
   * @param partial - New partial state or updater function
   * @param replace - If true, replaces entire state instead of merging
   */
  const setState: SetState<T> = (partial, replace) => {
    const nextState = computeNextState(state, partial)

    // Only update if state actually changed (referential equality check)
    if (!Object.is(nextState, state)) {
      const previousState = state

      // Replace or merge based on flags
      state =
        replace ?? (typeof nextState !== 'object' || nextState === null)
          ? (nextState as T)
          : Object.assign({}, state, nextState)

      // Notify all subscribers
      notifyListeners(listeners, state, previousState)
    }
  }

  /**
   * Subscribes to state changes.
   *
   * @param listener - Callback function
   * @returns Unsubscribe function
   */
  const subscribe: Subscribe<T> = (listener) => {
    listeners.add(listener)

    // Return unsubscribe function
    return () => {
      listeners.delete(listener)
    }
  }

  /**
   * Cleans up the store by removing all listeners.
   * Useful for testing and SSR cleanup.
   */
  const destroy = (): void => {
    listeners.clear()
  }

  // Build the store API
  const api: StoreApi<T> = {
    getState,
    getInitialState,
    setState,
    subscribe,
    destroy,
  }

  // Initialize state by calling the creator function
  // This passes set, get, and the full api to the creator
  state = createState(setState, getState, api)

  // Capture initial state for SSR
  initialState = state

  return api
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Creates a vanilla (framework-agnostic) store.
 *
 * Supports two calling patterns:
 * 1. `createStore(initializer)` - direct creation
 * 2. `createStore<T>()(initializer)` - curried for explicit typing
 *
 * @example
 * // Direct creation (type inferred)
 * const store = createStore((set) => ({
 *   count: 0,
 *   increment: () => set((s) => ({ count: s.count + 1 })),
 * }))
 *
 * @example
 * // Curried with explicit type
 * interface State {
 *   count: number
 *   increment: () => void
 * }
 * const store = createStore<State>()((set) => ({
 *   count: 0,
 *   increment: () => set((s) => ({ count: s.count + 1 })),
 * }))
 */
type CreateStore = {
  <T, Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>
  ): Mutate<StoreApi<T>, Mos>

  <T>(): <Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>
  ) => Mutate<StoreApi<T>, Mos>
}

/**
 * Creates a vanilla store.
 *
 * @see CreateStore for detailed documentation
 */
export const createStore = (<T>(
  createState?: StateCreator<T, [], []>
): StoreApi<T> | (<Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>
  ) => Mutate<StoreApi<T>, Mos>) => {
  // If no createState provided, return curried function
  if (createState === undefined) {
    return <Mos extends [StoreMutatorIdentifier, unknown][] = []>(
      initializer: StateCreator<T, [], Mos>
    ) => createStoreImpl(initializer) as Mutate<StoreApi<T>, Mos>
  }

  return createStoreImpl(createState)
}) as CreateStore

// Re-export types for convenience
export type {
  StateCreator,
  StoreApi,
  StoreMutatorIdentifier,
  Mutate,
  Listener,
  SetState,
  GetState,
  Subscribe,
} from './types'
