/**
 * Core type definitions for zustand-lite state management library.
 *
 * This module defines the fundamental types used throughout the library,
 * following Interface Segregation Principle (ISP) from SOLID.
 *
 * @module types
 */

// ============================================================
// LISTENER TYPES
// ============================================================

/**
 * Listener function that receives current and previous state.
 * Called whenever the store state changes.
 *
 * @template T - The type of the store state
 */
export type Listener<T> = (state: T, previousState: T) => void

// ============================================================
// STORE API TYPES (Interface Segregation)
// ============================================================

/**
 * Function to get the current state of the store.
 *
 * @template T - The type of the store state
 * @returns The current state
 */
export type GetState<T> = () => T

/**
 * Function to update the store state.
 *
 * Supports three update modes:
 * 1. Partial state object - merged with current state
 * 2. Updater function - receives current state, returns partial state
 * 3. Full replacement - when `replace` is true, replaces entire state
 *
 * @template T - The type of the store state
 */
export type SetState<T> = {
  (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: false
  ): void
  (state: T | ((state: T) => T), replace: true): void
}

/**
 * Function to subscribe to state changes.
 * Returns an unsubscribe function.
 *
 * @template T - The type of the store state
 * @param listener - Function called on state change
 * @returns Unsubscribe function
 */
export type Subscribe<T> = (listener: Listener<T>) => () => void

/**
 * Core store API interface.
 * Provides methods to get, set, and subscribe to state changes.
 *
 * This is the minimal interface that all stores implement.
 * (Liskov Substitution Principle - all stores are interchangeable)
 *
 * @template T - The type of the store state
 */
export interface StoreApi<T> {
  /** Get current state */
  getState: GetState<T>
  /** Get the initial state (for SSR) */
  getInitialState: () => T
  /** Update state */
  setState: SetState<T>
  /** Subscribe to state changes */
  subscribe: Subscribe<T>
  /** Clean up the store */
  destroy: () => void
}

/**
 * Read-only version of StoreApi for consumers that shouldn't mutate state.
 *
 * @template T - The type of the store state
 */
export type ReadonlyStoreApi<T> = Pick<
  StoreApi<T>,
  'getState' | 'getInitialState' | 'subscribe'
>

// ============================================================
// STATE CREATOR TYPES
// ============================================================

/**
 * Identifier for store mutators (middlewares).
 * Used by the type system to track which middlewares are applied.
 */
export type StoreMutatorIdentifier = string

/**
 * Registry for store mutators.
 * Middlewares extend this interface via declaration merging.
 *
 * @example
 * declare module 'zustand-lite/types' {
 *   interface StoreMutators<S, A> {
 *     'my-middleware': S & { myMethod: () => void }
 *   }
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-unused-vars
export interface StoreMutators<S, A> {}

/**
 * Applies a list of mutations to a store type.
 * This enables TypeScript to track middleware transformations.
 *
 * @template S - The base store type
 * @template Ms - Array of [MutatorId, MutatorArg] tuples
 */
export type Mutate<S, Ms> = Ms extends []
  ? S
  : Ms extends [[infer Mi extends keyof StoreMutators<S, unknown>, infer Ma], ...infer Rest]
    ? Mutate<
        StoreMutators<S, Ma>[Mi] extends (...args: unknown[]) => infer R
          ? R
          : StoreMutators<S, Ma>[Mi] extends undefined
            ? S
            : StoreMutators<S, Ma>[Mi],
        Rest extends [StoreMutatorIdentifier, unknown][]
          ? Rest
          : []
      >
    : Ms extends [[string, unknown], ...infer Rest]
      ? Mutate<S, Rest extends [StoreMutatorIdentifier, unknown][] ? Rest : []>
      : never

/**
 * Function that creates the initial state and actions for a store.
 *
 * This is the heart of the type system - it defines what the store contains.
 *
 * @template T - The full state type
 * @template Mis - Middleware input mutators (what this middleware receives)
 * @template Mos - Middleware output mutators (what this middleware adds)
 * @template U - Return type (defaults to T, used for slices)
 *
 * @example
 * const createState: StateCreator<CounterState> = (set, get, api) => ({
 *   count: 0,
 *   increment: () => set((state) => ({ count: state.count + 1 })),
 * })
 */
export type StateCreator<
  T,
  Mis extends [StoreMutatorIdentifier, unknown][] = [],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Mos extends [StoreMutatorIdentifier, unknown][] = [],
  U = T,
> = (
  setState: Get<Mutate<StoreApi<T>, Mis>, 'setState', never>,
  getState: Get<Mutate<StoreApi<T>, Mis>, 'getState', never>,
  store: Mutate<StoreApi<T>, Mis>
) => U

// ============================================================
// REACT HOOK TYPES
// ============================================================

/**
 * Selector function type.
 * Extracts a slice of state from the full store state.
 *
 * @template T - The full state type
 * @template U - The selected slice type
 */
export type Selector<T, U> = (state: T) => U

/**
 * Equality function for comparing selected state.
 * Used to prevent unnecessary re-renders.
 *
 * @template T - The type to compare
 */
export type EqualityFn<T> = (a: T, b: T) => boolean

/**
 * Extract state type from a store.
 *
 * @template S - Store type
 */
export type ExtractState<S> = S extends { getState: () => infer T } ? T : never

/**
 * The bound store hook returned by create().
 * Can be called as a hook and also provides direct access to store API.
 *
 * @template S - The store API type
 */
export type UseBoundStore<S extends ReadonlyStoreApi<unknown>> = {
  (): ExtractState<S>
  <U>(selector: Selector<ExtractState<S>, U>): U
  <U>(selector: Selector<ExtractState<S>, U>, equalityFn: EqualityFn<U>): U
} & S

// ============================================================
// UTILITY TYPES
// ============================================================

/**
 * Safely get a property from a type, with a fallback.
 *
 * @template T - The object type
 * @template K - The key to get
 * @template F - Fallback type if key doesn't exist
 */
export type Get<T, K, F> = K extends keyof T ? T[K] : F

/**
 * Write utility for merging types (replaces properties).
 *
 * @template T - Base type
 * @template U - Override type
 */
export type Write<T, U> = Omit<T, keyof U> & U

/**
 * Cast utility for safe type narrowing.
 *
 * @template T - Type to cast
 * @template U - Target type
 */
export type Cast<T, U> = T extends U ? T : U

/**
 * Helper for extracting action properties (functions) from state.
 *
 * @template T - The state type
 */
export type Actions<T> = {
  [K in keyof T as T[K] extends (...args: unknown[]) => unknown
    ? K
    : never]: T[K]
}

/**
 * Helper for extracting non-action properties (data) from state.
 *
 * @template T - The state type
 */
export type State<T> = Omit<T, keyof Actions<T>>
