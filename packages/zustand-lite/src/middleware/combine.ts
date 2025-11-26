/**
 * Combine utility for zustand-lite.
 *
 * Separates initial state from actions for cleaner type inference.
 * Useful when you want TypeScript to infer state type from an object literal.
 *
 * @module middleware/combine
 */

import type {
  StateCreator,
  StoreMutatorIdentifier,
} from '../types'

// ============================================================
// TYPES
// ============================================================

/**
 * Combine function type.
 *
 * @template T - Initial state type
 * @template U - Actions type
 * @template Mps - Middleware input mutators
 * @template Mcs - Middleware output mutators
 */
type Combine = <
  T extends object,
  U extends object,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initialState: T,
  additionalStateCreator: StateCreator<T & U, Mps, Mcs, U>
) => StateCreator<T & U, Mps, Mcs>

// ============================================================
// IMPLEMENTATION
// ============================================================

/**
 * Combine initial state with actions creator.
 *
 * This utility separates the "data" part of state from the "actions" part,
 * which can help with type inference and code organization.
 *
 * @example
 * // Types are inferred from the initial state object
 * const useStore = create(
 *   combine(
 *     // Initial state - types inferred
 *     { count: 0, name: 'counter' },
 *     // Actions
 *     (set, get) => ({
 *       increment: () => set((s) => ({ count: s.count + 1 })),
 *       setName: (name: string) => set({ name }),
 *     })
 *   )
 * )
 *
 * @example
 * // With middleware
 * const useStore = create(
 *   devtools(
 *     combine(
 *       { items: [] as Item[], loading: false },
 *       (set) => ({
 *         addItem: (item: Item) => set((s) => ({ items: [...s.items, item] })),
 *         setLoading: (loading: boolean) => set({ loading }),
 *       })
 *     )
 *   )
 * )
 */
const combineImpl: Combine = (initialState, additionalStateCreator) =>
  (set, get, api) => ({
    ...initialState,
    ...additionalStateCreator(set, get, api),
  })

export const combine = combineImpl

export type { Combine }
