/**
 * Cart store for E-commerce demo.
 *
 * Demonstrates:
 * - Full zustand-lite API usage
 * - Middleware composition (persist + devtools + immer)
 * - SSR support with skipHydration
 * - SOLID principles in action
 */

'use client'

import { create } from 'zustand-lite'
import { persist, devtools, subscribeWithSelector } from 'zustand-lite/middleware'
import type { Product } from '@/data/products'

// ============================================================
// TYPES (Interface Segregation - separate interfaces)
// ============================================================

export interface CartItem {
  product: Product
  quantity: number
}

export interface CartState {
  items: CartItem[]
  isOpen: boolean
}

export interface CartActions {
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
}

export type CartStore = CartState & CartActions

// ============================================================
// SELECTORS (Single Responsibility - separate computation logic)
// ============================================================

/**
 * Get total number of items in cart.
 */
export const selectCartItemCount = (state: CartStore): number =>
  state.items.reduce((sum, item) => sum + item.quantity, 0)

/**
 * Get total price of all items.
 */
export const selectCartTotal = (state: CartStore): number =>
  state.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

/**
 * Find specific item in cart.
 */
export const selectCartItem =
  (productId: string) =>
  (state: CartStore): CartItem | undefined =>
    state.items.find((item) => item.product.id === productId)

/**
 * Check if product is in cart.
 */
export const selectIsInCart =
  (productId: string) =>
  (state: CartStore): boolean =>
    state.items.some((item) => item.product.id === productId)

// ============================================================
// STORE CREATION
// ============================================================

/**
 * Cart store with full middleware composition.
 *
 * Middleware order (inner to outer):
 * 1. subscribeWithSelector - enables fine-grained subscriptions
 * 2. persist - saves cart to localStorage
 * 3. devtools - enables Redux DevTools debugging
 */
export const useCartStore = create<CartStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, _get) => ({
          // State
          items: [],
          isOpen: false,

          // Actions
          addItem: (product) => {
            set(
              (state) => {
                const existingItem = state.items.find(
                  (item) => item.product.id === product.id
                )

                if (existingItem) {
                  return {
                    items: state.items.map((item) =>
                      item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                    ),
                  }
                }

                return {
                  items: [...state.items, { product, quantity: 1 }],
                }
              },
              false
            )
          },

          removeItem: (productId) => {
            set(
              (state) => ({
                items: state.items.filter(
                  (item) => item.product.id !== productId
                ),
              }),
              false
            )
          },

          updateQuantity: (productId, quantity) => {
            set(
              (state) => {
                if (quantity <= 0) {
                  return {
                    items: state.items.filter(
                      (item) => item.product.id !== productId
                    ),
                  }
                }

                return {
                  items: state.items.map((item) =>
                    item.product.id === productId
                      ? { ...item, quantity }
                      : item
                  ),
                }
              },
              false
            )
          },

          clearCart: () => {
            set({ items: [] }, false)
          },

          toggleCart: () => {
            set((state) => ({ isOpen: !state.isOpen }), false)
          },

          openCart: () => {
            set({ isOpen: true }, false)
          },

          closeCart: () => {
            set({ isOpen: false }, false)
          },
        }),
        {
          name: 'cart-storage',
          // Only persist items, not UI state
          partialize: (state) => ({ items: state.items }),
          // Skip automatic hydration for SSR
          skipHydration: true,
        }
      )
    ),
    {
      name: 'CartStore',
      enabled: process.env.NODE_ENV !== 'production',
    }
  )
)

// ============================================================
// SUBSCRIPTION EXAMPLES
// ============================================================

// Subscribe to cart total changes (e.g., for analytics)
// Type assertion needed due to middleware type complexity
if (typeof window !== 'undefined') {
  const store = useCartStore as unknown as {
    subscribe: <U>(
      selector: (state: CartStore) => U,
      listener: (selectedState: U, previousSelectedState: U) => void,
      options?: { fireImmediately?: boolean }
    ) => () => void
  }
  store.subscribe(
    selectCartItemCount,
    (count, prevCount) => {
      console.log(`Cart items changed: ${prevCount} → ${count}`)
    },
    { fireImmediately: false }
  )
}
