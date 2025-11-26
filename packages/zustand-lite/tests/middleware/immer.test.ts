/**
 * Tests for immer middleware.
 * Coverage: mutable-style updates, draft behavior, return values, replace mode
 */

import { describe, it, expect } from 'vitest'
import { createStore } from '../../src/vanilla'
import { immer } from '../../src/middleware/immer'

// ============================================================
// TEST TYPES
// ============================================================

interface TestState {
  count: number
  name: string
  items: Array<{ id: number; value: string }>
  nested: {
    deep: {
      value: number
    }
  }
  increment: () => void
  addItem: (item: { id: number; value: string }) => void
}

interface SimpleState {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

// ============================================================
// BASIC FUNCTIONALITY
// ============================================================

describe('immer middleware', () => {
  describe('store creation', () => {
    it('creates store with initial state', () => {
      const store = createStore<SimpleState>()(
        immer((set) => ({
          count: 0,
          increment: () => set((draft) => { draft.count++ }),
          decrement: () => set((draft) => { draft.count-- }),
          reset: () => set({ count: 0 }),
        }))
      )

      expect(store.getState().count).toBe(0)
      expect(typeof store.getState().increment).toBe('function')
    })

    it('preserves store API', () => {
      const store = createStore<SimpleState>()(
        immer((set) => ({
          count: 0,
          increment: () => set((draft) => { draft.count++ }),
          decrement: () => set((draft) => { draft.count-- }),
          reset: () => set({ count: 0 }),
        }))
      )

      expect(typeof store.getState).toBe('function')
      expect(typeof store.setState).toBe('function')
      expect(typeof store.subscribe).toBe('function')
      expect(typeof store.destroy).toBe('function')
    })
  })

  describe('mutable-style updates', () => {
    it('allows mutable assignment in updater', () => {
      const store = createStore<SimpleState>()(
        immer((set) => ({
          count: 0,
          increment: () => set((draft) => { draft.count++ }),
          decrement: () => set((draft) => { draft.count-- }),
          reset: () => set({ count: 0 }),
        }))
      )

      store.getState().increment()
      expect(store.getState().count).toBe(1)

      store.getState().increment()
      store.getState().increment()
      expect(store.getState().count).toBe(3)

      store.getState().decrement()
      expect(store.getState().count).toBe(2)
    })

    it('allows mutating object properties', () => {
      const store = createStore<{ user: { name: string; age: number } }>()(
        immer(() => ({
          user: { name: 'John', age: 25 },
        }))
      )

      store.setState((draft) => {
        draft.user.name = 'Jane'
        draft.user.age = 30
      })

      expect(store.getState().user).toEqual({ name: 'Jane', age: 30 })
    })

    it('allows mutating nested objects', () => {
      const store = createStore<TestState>()(
        immer((set) => ({
          count: 0,
          name: 'test',
          items: [],
          nested: { deep: { value: 1 } },
          increment: () => set((draft) => { draft.count++ }),
          addItem: (item) => set((draft) => { draft.items.push(item) }),
        }))
      )

      store.setState((draft) => {
        draft.nested.deep.value = 42
      })

      expect(store.getState().nested.deep.value).toBe(42)
    })

    it('allows pushing to arrays', () => {
      const store = createStore<TestState>()(
        immer((set) => ({
          count: 0,
          name: 'test',
          items: [],
          nested: { deep: { value: 1 } },
          increment: () => set((draft) => { draft.count++ }),
          addItem: (item) => set((draft) => { draft.items.push(item) }),
        }))
      )

      store.getState().addItem({ id: 1, value: 'first' })
      store.getState().addItem({ id: 2, value: 'second' })

      expect(store.getState().items).toHaveLength(2)
      expect(store.getState().items[0]).toEqual({ id: 1, value: 'first' })
      expect(store.getState().items[1]).toEqual({ id: 2, value: 'second' })
    })

    it('allows splicing arrays', () => {
      const store = createStore<{ items: number[] }>()(
        immer(() => ({
          items: [1, 2, 3, 4, 5],
        }))
      )

      store.setState((draft) => {
        draft.items.splice(2, 1) // Remove element at index 2
      })

      expect(store.getState().items).toEqual([1, 2, 4, 5])
    })

    it('allows filtering arrays via reassignment', () => {
      const store = createStore<{ items: number[] }>()(
        immer(() => ({
          items: [1, 2, 3, 4, 5],
        }))
      )

      store.setState((draft) => {
        draft.items = draft.items.filter((x) => x % 2 === 0)
      })

      expect(store.getState().items).toEqual([2, 4])
    })

    it('allows delete operator on optional properties', () => {
      const store = createStore<{ data: { a?: number; b: number } }>()(
        immer(() => ({
          data: { a: 1, b: 2 },
        }))
      )

      store.setState((draft) => {
        delete draft.data.a
      })

      expect(store.getState().data).toEqual({ b: 2 })
      expect(store.getState().data.a).toBeUndefined()
    })
  })

  describe('return value behavior', () => {
    it('uses draft when updater returns undefined (void)', () => {
      const store = createStore<{ count: number }>()(
        immer(() => ({ count: 0 }))
      )

      store.setState((draft) => {
        draft.count = 10
        // No return - returns undefined
      })

      expect(store.getState().count).toBe(10)
    })

    it('uses returned value when updater returns new state', () => {
      const store = createStore<{ count: number }>()(
        immer(() => ({ count: 0 }))
      )

      store.setState((_draft) => {
        // Ignore draft, return completely new state
        return { count: 99 }
      })

      expect(store.getState().count).toBe(99)
    })

    it('uses returned partial when updater returns partial state', () => {
      const store = createStore<{ count: number; name: string }>()(
        immer(() => ({ count: 0, name: 'test' }))
      )

      store.setState((_draft) => {
        // Return partial - should merge with state
        return { count: 50 }
      })

      // Immer produce replaces state entirely when you return
      // So name will be lost unless we return full state
      expect(store.getState().count).toBe(50)
    })
  })

  describe('non-function partials', () => {
    it('passes through object partials unchanged', () => {
      const store = createStore<{ count: number; name: string }>()(
        immer(() => ({ count: 0, name: 'test' }))
      )

      store.setState({ count: 5 })

      expect(store.getState().count).toBe(5)
      expect(store.getState().name).toBe('test')
    })

    it('passes through full state object', () => {
      const store = createStore<{ count: number; name: string }>()(
        immer(() => ({ count: 0, name: 'test' }))
      )

      store.setState({ count: 100, name: 'changed' })

      expect(store.getState().count).toBe(100)
      expect(store.getState().name).toBe('changed')
    })
  })

  describe('replace mode', () => {
    it('works with replace=true and function updater', () => {
      const store = createStore<{ count: number; extra?: string }>()(
        immer(() => ({ count: 0, extra: 'data' }))
      )

      store.setState(
        (draft) => {
          return { count: draft.count + 1 }
        },
        true
      )

      expect(store.getState().count).toBe(1)
      // With replace, extra should be gone
      expect(store.getState().extra).toBeUndefined()
    })

    it('works with replace=true and object partial', () => {
      const store = createStore<{ count: number; extra?: string }>()(
        immer(() => ({ count: 0, extra: 'data' }))
      )

      store.setState({ count: 50 }, true)

      expect(store.getState().count).toBe(50)
      expect(store.getState().extra).toBeUndefined()
    })
  })

  describe('api.setState modification', () => {
    it('replaces api.setState with immer version', () => {
      let capturedApi: any

      createStore<{ count: number }>()(
        immer((_set, _get, api) => {
          capturedApi = api
          return { count: 0 }
        })
      )

      // setState on API should work with immer
      capturedApi.setState((draft: { count: number }) => {
        draft.count = 42
      })

      expect(capturedApi.getState().count).toBe(42)
    })
  })
})

// ============================================================
// EDGE CASES
// ============================================================

describe('immer edge cases', () => {
  it('handles empty initial state', () => {
    const store = createStore<Record<string, never>>()(
      immer(() => ({}))
    )

    expect(store.getState()).toEqual({})
  })

  it('handles deeply nested state mutations', () => {
    interface DeepState {
      level1: {
        level2: {
          level3: {
            level4: {
              value: number
            }
          }
        }
      }
    }

    const store = createStore<DeepState>()(
      immer(() => ({
        level1: {
          level2: {
            level3: {
              level4: {
                value: 0,
              },
            },
          },
        },
      }))
    )

    store.setState((draft) => {
      draft.level1.level2.level3.level4.value = 999
    })

    expect(store.getState().level1.level2.level3.level4.value).toBe(999)
  })

  it('handles multiple mutations in single update', () => {
    const store = createStore<{
      a: number
      b: number
      c: number
    }>()(
      immer(() => ({ a: 0, b: 0, c: 0 }))
    )

    store.setState((draft) => {
      draft.a = 1
      draft.b = 2
      draft.c = 3
    })

    expect(store.getState()).toEqual({ a: 1, b: 2, c: 3 })
  })

  it('maintains immutability of previous state', () => {
    const store = createStore<{ items: number[] }>()(
      immer(() => ({ items: [1, 2, 3] }))
    )

    const stateBefore = store.getState()

    store.setState((draft) => {
      draft.items.push(4)
    })

    const stateAfter = store.getState()

    // Original state should be unchanged
    expect(stateBefore.items).toEqual([1, 2, 3])
    // New state should have the change
    expect(stateAfter.items).toEqual([1, 2, 3, 4])
    // Should be different references
    expect(stateBefore).not.toBe(stateAfter)
    expect(stateBefore.items).not.toBe(stateAfter.items)
  })

  it('handles state with functions', () => {
    const store = createStore<{
      value: number
      increment: () => void
    }>()(
      immer((set) => ({
        value: 0,
        increment: () =>
          set((draft) => {
            draft.value++
          }),
      }))
    )

    store.getState().increment()
    store.getState().increment()

    expect(store.getState().value).toBe(2)
    expect(typeof store.getState().increment).toBe('function')
  })

  it('handles arrays at root level', () => {
    // Note: Zustand state should be an object, but immer can handle arrays too
    const store = createStore<{ data: number[] }>()(
      immer(() => ({ data: [1, 2, 3] }))
    )

    store.setState((draft) => {
      draft.data.push(4)
      draft.data.shift()
    })

    expect(store.getState().data).toEqual([2, 3, 4])
  })

  it('handles Map-like structures', () => {
    const store = createStore<{
      map: Record<string, { count: number }>
    }>()(
      immer(() => ({
        map: {
          a: { count: 1 },
          b: { count: 2 },
        },
      }))
    )

    store.setState((draft) => {
      draft.map.a.count = 10
      draft.map.c = { count: 3 }
    })

    expect(store.getState().map.a.count).toBe(10)
    expect(store.getState().map.c.count).toBe(3)
  })

  it('handles conditional mutations', () => {
    const store = createStore<{ count: number; flag: boolean }>()(
      immer(() => ({ count: 0, flag: false }))
    )

    store.setState((draft) => {
      if (draft.count === 0) {
        draft.count = 10
        draft.flag = true
      }
    })

    expect(store.getState().count).toBe(10)
    expect(store.getState().flag).toBe(true)

    store.setState((draft) => {
      if (draft.count === 0) {
        draft.count = 20 // Should not execute
      }
    })

    expect(store.getState().count).toBe(10) // Unchanged
  })

  it('subscribers receive new state after immer update', () => {
    const store = createStore<{ count: number }>()(
      immer(() => ({ count: 0 }))
    )

    const states: { count: number }[] = []
    store.subscribe((state) => {
      states.push(state)
    })

    store.setState((draft) => {
      draft.count = 1
    })
    store.setState((draft) => {
      draft.count = 2
    })

    expect(states).toHaveLength(2)
    expect(states[0].count).toBe(1)
    expect(states[1].count).toBe(2)
  })
})

// ============================================================
// COMPLEX SCENARIOS
// ============================================================

describe('immer complex scenarios', () => {
  it('todo list operations', () => {
    interface Todo {
      id: number
      text: string
      completed: boolean
    }

    interface TodoState {
      todos: Todo[]
      filter: 'all' | 'active' | 'completed'
      addTodo: (text: string) => void
      toggleTodo: (id: number) => void
      removeTodo: (id: number) => void
    }

    let nextId = 1

    const store = createStore<TodoState>()(
      immer((set) => ({
        todos: [],
        filter: 'all',
        addTodo: (text) =>
          set((draft) => {
            draft.todos.push({ id: nextId++, text, completed: false })
          }),
        toggleTodo: (id) =>
          set((draft) => {
            const todo = draft.todos.find((t) => t.id === id)
            if (todo) {
              todo.completed = !todo.completed
            }
          }),
        removeTodo: (id) =>
          set((draft) => {
            draft.todos = draft.todos.filter((t) => t.id !== id)
          }),
      }))
    )

    store.getState().addTodo('Learn Zustand')
    store.getState().addTodo('Write tests')
    store.getState().addTodo('Ship code')

    expect(store.getState().todos).toHaveLength(3)

    store.getState().toggleTodo(1)
    expect(store.getState().todos[0].completed).toBe(true)

    store.getState().removeTodo(2)
    expect(store.getState().todos).toHaveLength(2)
    expect(store.getState().todos.find((t) => t.id === 2)).toBeUndefined()
  })

  it('shopping cart operations', () => {
    interface CartItem {
      id: number
      name: string
      quantity: number
      price: number
    }

    interface CartState {
      items: CartItem[]
      addItem: (item: Omit<CartItem, 'quantity'>) => void
      updateQuantity: (id: number, quantity: number) => void
      removeItem: (id: number) => void
      getTotal: () => number
    }

    const store = createStore<CartState>()(
      immer((set, get) => ({
        items: [],
        addItem: (item) =>
          set((draft) => {
            const existing = draft.items.find((i) => i.id === item.id)
            if (existing) {
              existing.quantity++
            } else {
              draft.items.push({ ...item, quantity: 1 })
            }
          }),
        updateQuantity: (id, quantity) =>
          set((draft) => {
            const item = draft.items.find((i) => i.id === id)
            if (item) {
              item.quantity = quantity
            }
          }),
        removeItem: (id) =>
          set((draft) => {
            draft.items = draft.items.filter((i) => i.id !== id)
          }),
        getTotal: () =>
          get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      }))
    )

    store.getState().addItem({ id: 1, name: 'Widget', price: 10 })
    store.getState().addItem({ id: 2, name: 'Gadget', price: 25 })
    store.getState().addItem({ id: 1, name: 'Widget', price: 10 }) // Add same item

    expect(store.getState().items).toHaveLength(2)
    expect(store.getState().items[0].quantity).toBe(2)
    expect(store.getState().getTotal()).toBe(45) // 2*10 + 1*25

    store.getState().updateQuantity(1, 5)
    expect(store.getState().getTotal()).toBe(75) // 5*10 + 1*25
  })

  it('nested form state', () => {
    interface FormState {
      form: {
        personal: {
          firstName: string
          lastName: string
        }
        address: {
          street: string
          city: string
          zip: string
        }
      }
      setField: (
        section: 'personal' | 'address',
        field: string,
        value: string
      ) => void
    }

    const store = createStore<FormState>()(
      immer((set) => ({
        form: {
          personal: { firstName: '', lastName: '' },
          address: { street: '', city: '', zip: '' },
        },
        setField: (section, field, value) =>
          set((draft) => {
            (draft.form[section] as Record<string, string>)[field] = value
          }),
      }))
    )

    store.getState().setField('personal', 'firstName', 'John')
    store.getState().setField('personal', 'lastName', 'Doe')
    store.getState().setField('address', 'city', 'New York')

    expect(store.getState().form.personal.firstName).toBe('John')
    expect(store.getState().form.personal.lastName).toBe('Doe')
    expect(store.getState().form.address.city).toBe('New York')
    expect(store.getState().form.address.street).toBe('') // Unchanged
  })
})
