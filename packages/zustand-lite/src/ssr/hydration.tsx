/**
 * Hydration utilities for zustand-lite.
 *
 * Provides hooks and components for safe SSR hydration.
 * Prevents hydration mismatches when using persist middleware.
 *
 * @module ssr/hydration
 */

'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'
import type { StoreApi } from '../types'
import type { PersistApi } from '../middleware/persist'

// ============================================================
// TYPES
// ============================================================

/**
 * Store with persist middleware applied.
 */
type StoreWithPersist<T> = StoreApi<T> & Partial<PersistApi<T>>

// ============================================================
// USE HYDRATION HOOK
// ============================================================

/**
 * Hook to track hydration state.
 *
 * Returns false until client-side hydration is complete.
 * Useful for showing loading states during SSR/hydration.
 *
 * @template T - State type
 * @param store - Store API (optionally with persist middleware)
 * @returns True when hydration is complete
 *
 * @example
 * function Cart() {
 *   const hydrated = useHydration(useCartStore)
 *   const items = useCartStore((s) => s.items)
 *
 *   if (!hydrated) {
 *     return <CartSkeleton />
 *   }
 *
 *   return <CartItems items={items} />
 * }
 */
export function useHydration<T>(store: StoreWithPersist<T>): boolean {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // If store has persist middleware
    if (store.persist) {
      // Check if already hydrated
      if (store.persist.hasHydrated()) {
        setHydrated(true)
        return
      }

      // Wait for hydration to complete
      const unsubscribe = store.persist.onFinishHydration(() => {
        setHydrated(true)
      })

      // Trigger rehydration if it hasn't started
      // (for skipHydration: true stores)
      void store.persist.rehydrate()

      return unsubscribe
    }

    // No persist middleware, hydrated immediately
    setHydrated(true)
  }, [store])

  return hydrated
}

// ============================================================
// HYDRATION BOUNDARY COMPONENT
// ============================================================

/**
 * Props for HydrationBoundary component.
 */
export interface HydrationBoundaryProps<T> {
  /** Store to wait for hydration */
  store: StoreWithPersist<T>
  /** Content to render after hydration */
  children: ReactNode
  /** Fallback content during hydration */
  fallback?: ReactNode
  /** Called when hydration completes */
  onHydrated?: () => void
}

/**
 * Component that waits for store hydration before rendering children.
 *
 * @example
 * <HydrationBoundary store={useCartStore} fallback={<CartSkeleton />}>
 *   <Cart />
 * </HydrationBoundary>
 */
export function HydrationBoundary<T>({
  store,
  children,
  fallback = null,
  onHydrated,
}: HydrationBoundaryProps<T>): ReactNode {
  const hydrated = useHydration(store)

  useEffect(() => {
    if (hydrated) {
      onHydrated?.()
    }
  }, [hydrated, onHydrated])

  return hydrated ? children : fallback
}

// ============================================================
// USE STORE HYDRATION HOOK
// ============================================================

/**
 * Hook that returns store state only after hydration.
 *
 * @template T - State type
 * @template U - Selected type
 * @param store - Store with persist middleware
 * @param selector - State selector
 * @param fallback - Fallback value before hydration
 * @returns Selected state or fallback
 *
 * @example
 * function CartCount() {
 *   const itemCount = useStoreHydrated(
 *     useCartStore,
 *     (s) => s.items.length,
 *     0 // Fallback before hydration
 *   )
 *
 *   return <span>{itemCount}</span>
 * }
 */
export function useStoreHydrated<T, U>(
  store: StoreWithPersist<T>,
  selector: (state: T) => U,
  fallback: U
): U {
  const hydrated = useHydration(store)
  const [value, setValue] = useState<U>(fallback)

  // Stabilize selector reference to prevent subscription leaks
  const selectorRef = useRef(selector)
  selectorRef.current = selector

  useEffect(() => {
    if (hydrated) {
      setValue(selectorRef.current(store.getState()))

      // Subscribe to changes
      const unsubscribe = store.subscribe((state) => {
        setValue(selectorRef.current(state))
      })

      return unsubscribe
    }
  }, [hydrated, store])

  return hydrated ? value : fallback
}

// ============================================================
// SSR HELPER
// ============================================================

/**
 * Check if code is running on server.
 */
export const isServer = typeof window === 'undefined'

/**
 * Check if code is running on client.
 */
export const isClient = !isServer
