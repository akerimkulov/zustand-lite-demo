/**
 * Tests for combine utility.
 * Coverage: state/action separation, type inference, middleware composition
 */

import { describe, it, expect, vi } from 'vitest'
import { createStore } from '../../src/vanilla'
import { combine } from '../../src/middleware/combine'

// ============================================================
// BASIC FUNCTIONALITY
// ============================================================

describe('combine utility', () => {
  describe('basic usage', () => {
    it('combines initial state with actions', () => {
      const store = createStore(
        combine(
          { count: 0, name: 'counter' },
          (set) => ({
            increment: () => set((s) => ({ count: s.count + 1 })),
            setName: (name: string) => set({ name }),
          })
        )
      )

      expect(store.getState().count).toBe(0)
      expect(store.getState().name).toBe('counter')
      expect(typeof store.getState().increment).toBe('function')
      expect(typeof store.getState().setName).toBe('function')
    })

    it('actions can update state', () => {
      const store = createStore(
        combine(
          { count: 0 },
          (set) => ({
            increment: () => set((s) => ({ count: s.count + 1 })),
            decrement: () => set((s) => ({ count: s.count - 1 })),
            reset: () => set({ count: 0 }),
          })
        )
      )

      store.getState().increment()
      expect(store.getState().count).toBe(1)

      store.getState().increment()
      store.getState().increment()
      expect(store.getState().count).toBe(3)

      store.getState().decrement()
      expect(store.getState().count).toBe(2)

      store.getState().reset()
      expect(store.getState().count).toBe(0)
    })

    it('actions can access full state via get', () => {
      const store = createStore(
        combine(
          { count: 0, multiplier: 2 },
          (set, get) => ({
            multiplyAndAdd: () => {
              const { count, multiplier } = get()
              set({ count: count * multiplier })
            },
          })
        )
      )

      store.setState({ count: 5 })
      store.getState().multiplyAndAdd()
      expect(store.getState().count).toBe(10)
    })

    it('actions can access api', () => {
      let capturedApi: any

      const store = createStore(
        combine(
          { count: 0 },
          (set, get, api) => {
            capturedApi = api
            return {
              increment: () => set((s) => ({ count: s.count + 1 })),
            }
          }
        )
      )

      expect(capturedApi).toBeDefined()
      expect(capturedApi.getState).toBe(store.getState)
      expect(capturedApi.setState).toBe(store.setState)
    })
  })

  describe('state types', () => {
    it('works with primitive values', () => {
      const store = createStore(
        combine(
          {
            str: 'hello',
            num: 42,
            bool: true,
            nil: null as null | string,
          },
          (set) => ({
            setStr: (str: string) => set({ str }),
            setNum: (num: number) => set({ num }),
            setBool: (bool: boolean) => set({ bool }),
            setNil: (nil: null | string) => set({ nil }),
          })
        )
      )

      expect(store.getState().str).toBe('hello')
      expect(store.getState().num).toBe(42)
      expect(store.getState().bool).toBe(true)
      expect(store.getState().nil).toBeNull()

      store.getState().setStr('world')
      store.getState().setNum(100)
      store.getState().setBool(false)
      store.getState().setNil('not null')

      expect(store.getState().str).toBe('world')
      expect(store.getState().num).toBe(100)
      expect(store.getState().bool).toBe(false)
      expect(store.getState().nil).toBe('not null')
    })

    it('works with arrays', () => {
      const store = createStore(
        combine(
          { items: [] as string[] },
          (set) => ({
            addItem: (item: string) => set((s) => ({ items: [...s.items, item] })),
            removeItem: (index: number) =>
              set((s) => ({
                items: s.items.filter((_, i) => i !== index),
              })),
          })
        )
      )

      store.getState().addItem('first')
      store.getState().addItem('second')
      expect(store.getState().items).toEqual(['first', 'second'])

      store.getState().removeItem(0)
      expect(store.getState().items).toEqual(['second'])
    })

    it('works with nested objects', () => {
      const store = createStore(
        combine(
          {
            user: {
              name: 'John',
              settings: {
                theme: 'dark' as 'dark' | 'light',
              },
            },
          },
          (set) => ({
            setUserName: (name: string) =>
              set((s) => ({
                user: { ...s.user, name },
              })),
            setTheme: (theme: 'dark' | 'light') =>
              set((s) => ({
                user: {
                  ...s.user,
                  settings: { ...s.user.settings, theme },
                },
              })),
          })
        )
      )

      expect(store.getState().user.name).toBe('John')
      expect(store.getState().user.settings.theme).toBe('dark')

      store.getState().setUserName('Jane')
      store.getState().setTheme('light')

      expect(store.getState().user.name).toBe('Jane')
      expect(store.getState().user.settings.theme).toBe('light')
    })
  })

  describe('computed values', () => {
    it('actions can compute derived values', () => {
      const store = createStore(
        combine(
          { items: [1, 2, 3, 4, 5] },
          (set, get) => ({
            getSum: () => get().items.reduce((a, b) => a + b, 0),
            getAverage: () => {
              const items = get().items
              return items.length > 0
                ? items.reduce((a, b) => a + b, 0) / items.length
                : 0
            },
            addItem: (n: number) => set((s) => ({ items: [...s.items, n] })),
          })
        )
      )

      expect(store.getState().getSum()).toBe(15)
      expect(store.getState().getAverage()).toBe(3)

      store.getState().addItem(10)
      expect(store.getState().getSum()).toBe(25)
    })
  })

  describe('edge cases', () => {
    it('works with empty initial state', () => {
      const store = createStore(
        combine({}, (set) => ({
          setValue: (key: string, value: unknown) =>
            set((s) => ({ ...s, [key]: value })),
        }))
      )

      expect(store.getState()).toEqual({ setValue: expect.any(Function) })
    })

    it('works with empty actions', () => {
      const store = createStore(
        combine({ count: 0 }, () => ({}))
      )

      expect(store.getState().count).toBe(0)
      store.setState({ count: 5 })
      expect(store.getState().count).toBe(5)
    })

    it('actions override initial state keys of same name', () => {
      // This is expected behavior - actions spread after initial state
      const store = createStore(
        combine(
          { action: 'not a function' as string | (() => void) },
          () => ({
            action: () => {
              // This function overrides the string
            },
          })
        )
      )

      expect(typeof store.getState().action).toBe('function')
    })

    it('handles async actions', async () => {
      const store = createStore(
        combine(
          { data: null as string | null, loading: false },
          (set) => ({
            fetchData: async () => {
              set({ loading: true })
              await new Promise((resolve) => setTimeout(resolve, 10))
              set({ data: 'fetched', loading: false })
            },
          })
        )
      )

      expect(store.getState().loading).toBe(false)
      expect(store.getState().data).toBeNull()

      const promise = store.getState().fetchData()
      expect(store.getState().loading).toBe(true)

      await promise
      expect(store.getState().loading).toBe(false)
      expect(store.getState().data).toBe('fetched')
    })
  })

  describe('subscriptions', () => {
    it('subscribers are notified of state changes', () => {
      const store = createStore(
        combine(
          { count: 0 },
          (set) => ({
            increment: () => set((s) => ({ count: s.count + 1 })),
          })
        )
      )

      const listener = vi.fn()
      store.subscribe(listener)

      store.getState().increment()

      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ count: 1 }),
        expect.objectContaining({ count: 0 })
      )
    })
  })

  describe('getInitialState', () => {
    it('preserves initial state reference', () => {
      const store = createStore(
        combine(
          { count: 0, name: 'test' },
          (set) => ({
            increment: () => set((s) => ({ count: s.count + 1 })),
          })
        )
      )

      store.getState().increment()
      store.getState().increment()

      expect(store.getState().count).toBe(2)
      expect(store.getInitialState().count).toBe(0)
      expect(store.getInitialState().name).toBe('test')
    })
  })
})

// ============================================================
// COMPLEX SCENARIOS
// ============================================================

describe('combine complex scenarios', () => {
  it('shopping cart example', () => {
    interface CartItem {
      id: string
      name: string
      price: number
      quantity: number
    }

    const store = createStore(
      combine(
        { items: [] as CartItem[], discount: 0 },
        (set, get) => ({
          addItem: (item: Omit<CartItem, 'quantity'>) => {
            const existing = get().items.find((i) => i.id === item.id)
            if (existing) {
              set({
                items: get().items.map((i) =>
                  i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                ),
              })
            } else {
              set({ items: [...get().items, { ...item, quantity: 1 }] })
            }
          },
          removeItem: (id: string) =>
            set({ items: get().items.filter((i) => i.id !== id) }),
          setDiscount: (discount: number) => set({ discount }),
          getTotal: () => {
            const { items, discount } = get()
            const subtotal = items.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            )
            return subtotal * (1 - discount / 100)
          },
        })
      )
    )

    store.getState().addItem({ id: '1', name: 'Widget', price: 10 })
    store.getState().addItem({ id: '2', name: 'Gadget', price: 25 })
    store.getState().addItem({ id: '1', name: 'Widget', price: 10 })

    expect(store.getState().items).toHaveLength(2)
    expect(store.getState().items[0].quantity).toBe(2)
    expect(store.getState().getTotal()).toBe(45)

    store.getState().setDiscount(10)
    expect(store.getState().getTotal()).toBe(40.5)
  })

  it('form state example', () => {
    interface FormField {
      value: string
      error: string | null
      touched: boolean
    }

    const createField = (value = ''): FormField => ({
      value,
      error: null,
      touched: false,
    })

    const store = createStore(
      combine(
        {
          fields: {
            email: createField(),
            password: createField(),
          },
          isSubmitting: false,
        },
        (set, get) => ({
          setField: (name: 'email' | 'password', value: string) =>
            set({
              fields: {
                ...get().fields,
                [name]: { ...get().fields[name], value, touched: true },
              },
            }),
          setError: (name: 'email' | 'password', error: string | null) =>
            set({
              fields: {
                ...get().fields,
                [name]: { ...get().fields[name], error },
              },
            }),
          validate: () => {
            const { fields } = get()
            let valid = true

            if (!fields.email.value.includes('@')) {
              store.getState().setError('email', 'Invalid email')
              valid = false
            }

            if (fields.password.value.length < 8) {
              store.getState().setError('password', 'Password too short')
              valid = false
            }

            return valid
          },
          submit: () => {
            if (get().isSubmitting) return

            if (store.getState().validate()) {
              set({ isSubmitting: true })
              // Simulate submit
            }
          },
        })
      )
    )

    store.getState().setField('email', 'invalid')
    store.getState().setField('password', '123')

    expect(store.getState().validate()).toBe(false)
    expect(store.getState().fields.email.error).toBe('Invalid email')
    expect(store.getState().fields.password.error).toBe('Password too short')

    store.getState().setField('email', 'test@example.com')
    store.getState().setField('password', 'password123')

    expect(store.getState().validate()).toBe(true)
  })
})
