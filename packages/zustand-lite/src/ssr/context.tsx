/**
 * SSR Context utilities for zustand-lite.
 *
 * Provides React Context-based store management for SSR scenarios.
 * Creates a new store instance per request on the server.
 *
 * @module ssr/context
 */

'use client'

import {
  createContext,
  useContext,
  useRef,
  type ReactNode,
} from 'react'
import { useStore } from '../react'
import type { StoreApi, Selector, EqualityFn } from '../types'

// ============================================================
// TYPES
// ============================================================

/**
 * Props for store provider component.
 *
 * @template T - State type
 */
export interface StoreProviderProps<T> {
  children: ReactNode
  /** Initial state to merge with default state */
  initialState?: Partial<T>
}

/**
 * Return type of createStoreContext.
 *
 * @template T - State type
 * @template Store - Store API type
 */
export interface StoreContextValue<T, Store extends StoreApi<T>> {
  /** Provider component */
  StoreProvider: (props: StoreProviderProps<T>) => ReactNode
  /** Hook to use store with selector */
  useStoreContext: {
    (): T
    <U>(selector: Selector<T, U>): U
    <U>(selector: Selector<T, U>, equalityFn: EqualityFn<U>): U
  }
  /** Hook to get the store API directly */
  useStoreApi: () => Store
  /** The React context (for advanced use cases) */
  StoreContext: React.Context<Store | null>
}

// ============================================================
// IMPLEMENTATION
// ============================================================

/**
 * Creates a context-based store for SSR scenarios.
 *
 * This ensures each request gets its own store instance on the server,
 * preventing state leakage between requests.
 *
 * @template T - State type
 * @template Store - Store API type
 * @param createStoreFn - Function that creates the store
 * @returns Object with Provider, hooks, and Context
 *
 * @example
 * // stores/cart-store.tsx
 * import { createStoreContext } from 'zustand-lite/ssr'
 * import { create } from 'zustand-lite'
 * import { persist } from 'zustand-lite/middleware'
 *
 * interface CartState {
 *   items: CartItem[]
 *   addItem: (item: CartItem) => void
 * }
 *
 * const createCartStore = (initialState?: Partial<CartState>) =>
 *   create<CartState>()(
 *     persist(
 *       (set) => ({
 *         items: [],
 *         ...initialState,
 *         addItem: (item) => set((s) => ({ items: [...s.items, item] })),
 *       }),
 *       { name: 'cart', skipHydration: true }
 *     )
 *   )
 *
 * export const {
 *   StoreProvider: CartProvider,
 *   useStoreContext: useCart,
 *   useStoreApi: useCartApi,
 * } = createStoreContext(createCartStore)
 *
 * @example
 * // app/layout.tsx
 * import { CartProvider } from '@/stores/cart-store'
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <CartProvider>
 *       {children}
 *     </CartProvider>
 *   )
 * }
 *
 * @example
 * // components/Cart.tsx
 * 'use client'
 * import { useCart, useCartApi } from '@/stores/cart-store'
 * import { useHydration } from 'zustand-lite/ssr'
 *
 * export function Cart() {
 *   const api = useCartApi()
 *   const hydrated = useHydration(api)
 *   const items = useCart((s) => s.items)
 *
 *   if (!hydrated) return <CartSkeleton />
 *
 *   return <div>{items.length} items</div>
 * }
 */
export function createStoreContext<T, Store extends StoreApi<T> = StoreApi<T>>(
  createStoreFn: (initialState?: Partial<T>) => Store
): StoreContextValue<T, Store> {
  // Create React Context
  const StoreContext = createContext<Store | null>(null)

  /**
   * Provider component that creates store on mount.
   * On server: creates new store per request
   * On client: creates store once and reuses it
   */
  function StoreProvider({
    children,
    initialState,
  }: StoreProviderProps<T>): ReactNode {
    // Use ref to ensure store is created only once
    const storeRef = useRef<Store>()

    if (!storeRef.current) {
      storeRef.current = createStoreFn(initialState)
    }

    return (
      <StoreContext.Provider value={storeRef.current}>
        {children}
      </StoreContext.Provider>
    )
  }

  /**
   * Hook to get the store API.
   * Throws if used outside of provider.
   */
  function useStoreApi(): Store {
    const store = useContext(StoreContext)

    if (!store) {
      throw new Error(
        'useStoreApi must be used within a StoreProvider. ' +
        'Make sure to wrap your component tree with the provider.'
      )
    }

    return store
  }

  /**
   * Hook to subscribe to store state with optional selector.
   */
  function useStoreContext<U = T>(
    selector?: Selector<T, U>,
    equalityFn?: EqualityFn<U>
  ): U {
    const store = useStoreApi()

    return useStore(
      store,
      selector ?? ((state) => state as unknown as U),
      equalityFn
    )
  }

  return {
    StoreProvider,
    useStoreContext: useStoreContext as StoreContextValue<T, Store>['useStoreContext'],
    useStoreApi,
    StoreContext,
  }
}

export default createStoreContext
