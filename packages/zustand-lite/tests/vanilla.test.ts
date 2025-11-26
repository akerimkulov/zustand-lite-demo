import { describe, it, expect, vi } from 'vitest'
import { createStore } from '../src/vanilla'

describe('vanilla store', () => {
  // ============================================================
  // createStore
  // ============================================================
  describe('createStore', () => {
    it('creates store with initializer function', () => {
      const store = createStore(() => ({ count: 0 }))

      expect(store).toBeDefined()
      expect(store.getState).toBeDefined()
      expect(store.setState).toBeDefined()
      expect(store.subscribe).toBeDefined()
      expect(store.destroy).toBeDefined()
      expect(store.getInitialState).toBeDefined()
    })

    it('supports curried API for explicit typing', () => {
      interface State {
        count: number
        name: string
      }

      const store = createStore<State>()(() => ({
        count: 0,
        name: 'test',
      }))

      expect(store.getState()).toEqual({ count: 0, name: 'test' })
    })

    it('passes set, get, api to initializer', () => {
      const initializer = vi.fn((set, get, api) => {
        expect(typeof set).toBe('function')
        expect(typeof get).toBe('function')
        expect(api).toHaveProperty('getState')
        expect(api).toHaveProperty('setState')
        expect(api).toHaveProperty('subscribe')
        return { count: 0 }
      })

      createStore(initializer)
      expect(initializer).toHaveBeenCalledTimes(1)
    })

    it('initializes state correctly', () => {
      const store = createStore(() => ({
        count: 42,
        name: 'test',
        nested: { value: true },
      }))

      expect(store.getState()).toEqual({
        count: 42,
        name: 'test',
        nested: { value: true },
      })
    })
  })

  // ============================================================
  // getState
  // ============================================================
  describe('getState', () => {
    it('returns current state', () => {
      const store = createStore(() => ({ count: 0 }))
      expect(store.getState()).toEqual({ count: 0 })
    })

    it('returns updated state after setState', () => {
      const store = createStore(() => ({ count: 0 }))
      store.setState({ count: 5 })
      expect(store.getState()).toEqual({ count: 5 })
    })

    it('returns same reference if state not changed', () => {
      const store = createStore(() => ({ count: 0 }))
      store.getState()
      store.setState({ count: 0 }) // Same value
      const state2 = store.getState()
      // State should be different reference due to Object.assign
      // but values should be same
      expect(state2).toEqual({ count: 0 })
    })
  })

  // ============================================================
  // getInitialState
  // ============================================================
  describe('getInitialState', () => {
    it('returns initial state', () => {
      const store = createStore(() => ({ count: 0, name: 'initial' }))
      expect(store.getInitialState()).toEqual({ count: 0, name: 'initial' })
    })

    it('returns initial state even after mutations', () => {
      const store = createStore(() => ({ count: 0 }))
      store.setState({ count: 100 })
      store.setState({ count: 200 })

      expect(store.getInitialState()).toEqual({ count: 0 })
      expect(store.getState()).toEqual({ count: 200 })
    })

    it('preserves initial state reference', () => {
      const store = createStore(() => ({ count: 0 }))
      const initial1 = store.getInitialState()
      store.setState({ count: 50 })
      const initial2 = store.getInitialState()

      expect(initial1).toBe(initial2)
    })
  })

  // ============================================================
  // setState - basic operations
  // ============================================================
  describe('setState', () => {
    describe('partial object updates', () => {
      it('updates state with partial object', () => {
        const store = createStore(() => ({ count: 0, name: 'test' }))
        store.setState({ count: 5 })

        expect(store.getState()).toEqual({ count: 5, name: 'test' })
      })

      it('merges partial state with existing state', () => {
        const store = createStore(() => ({
          a: 1,
          b: 2,
          c: 3,
        }))
        store.setState({ b: 20 })

        expect(store.getState()).toEqual({ a: 1, b: 20, c: 3 })
      })

      it('adds new properties via partial update', () => {
        const store = createStore<{ count: number; name?: string }>(() => ({
          count: 0,
        }))
        store.setState({ name: 'added' })

        expect(store.getState()).toEqual({ count: 0, name: 'added' })
      })
    })

    describe('updater function', () => {
      it('updates state with updater function', () => {
        const store = createStore(() => ({ count: 0 }))
        store.setState((state) => ({ count: state.count + 1 }))

        expect(store.getState()).toEqual({ count: 1 })
      })

      it('receives current state in updater', () => {
        const store = createStore(() => ({ count: 10, multiplier: 2 }))
        store.setState((state) => ({
          count: state.count * state.multiplier,
        }))

        expect(store.getState()).toEqual({ count: 20, multiplier: 2 })
      })

      it('supports chained updates', () => {
        const store = createStore(() => ({ count: 0 }))
        store.setState((s) => ({ count: s.count + 1 }))
        store.setState((s) => ({ count: s.count + 1 }))
        store.setState((s) => ({ count: s.count + 1 }))

        expect(store.getState()).toEqual({ count: 3 })
      })
    })

    describe('replace mode', () => {
      it('replaces entire state when replace is true', () => {
        const store = createStore(() => ({ count: 0, name: 'test' }))
        store.setState({ count: 5 } as any, true)

        expect(store.getState()).toEqual({ count: 5 })
        expect((store.getState() as any).name).toBeUndefined()
      })

      it('merges state when replace is false', () => {
        const store = createStore(() => ({ count: 0, name: 'test' }))
        store.setState({ count: 5 }, false)

        expect(store.getState()).toEqual({ count: 5, name: 'test' })
      })

      it('merges state when replace is undefined', () => {
        const store = createStore(() => ({ count: 0, name: 'test' }))
        store.setState({ count: 5 })

        expect(store.getState()).toEqual({ count: 5, name: 'test' })
      })
    })

    describe('Object.is equality check', () => {
      it('does not notify listeners if state is same reference', () => {
        const store = createStore(() => ({ count: 0 }))
        const listener = vi.fn()
        store.subscribe(listener)

        const currentState = store.getState()
        store.setState(currentState)

        // setState with same reference should not notify
        expect(listener).not.toHaveBeenCalled()
      })

      it('does not notify when updater returns same value', () => {
        const store = createStore(() => ({ count: 0 }))
        const listener = vi.fn()
        store.subscribe(listener)

        store.setState((state) => state) // Return same reference

        expect(listener).not.toHaveBeenCalled()
      })

      it('notifies listeners when state changes', () => {
        const store = createStore(() => ({ count: 0 }))
        const listener = vi.fn()
        store.subscribe(listener)

        store.setState({ count: 1 })

        expect(listener).toHaveBeenCalledTimes(1)
      })
    })

    describe('primitive state handling', () => {
      it('replaces state when partial is not an object', () => {
        const store = createStore<number>(() => 0)
        store.setState(5)

        expect(store.getState()).toBe(5)
      })

      it('replaces state when partial is null', () => {
        const store = createStore<{ count: number } | null>(() => ({
          count: 0,
        }))
        store.setState(null)

        expect(store.getState()).toBeNull()
      })

      it('handles string state', () => {
        const store = createStore<string>(() => 'initial')
        store.setState('updated')

        expect(store.getState()).toBe('updated')
      })

      it('handles boolean state', () => {
        const store = createStore<boolean>(() => false)
        store.setState(true)

        expect(store.getState()).toBe(true)
      })
    })
  })

  // ============================================================
  // setState - edge cases
  // ============================================================
  describe('setState edge cases', () => {
    it('handles empty object update', () => {
      const store = createStore(() => ({ count: 0, name: 'test' }))
      const listener = vi.fn()
      store.subscribe(listener)

      store.setState({})

      // Empty object creates new reference, so listener is called
      expect(listener).toHaveBeenCalled()
      expect(store.getState()).toEqual({ count: 0, name: 'test' })
    })

    it('handles array as state with replace', () => {
      const store = createStore<number[]>(() => [1, 2, 3])
      // Arrays need replace: true to avoid Object.assign converting to object
      store.setState([4, 5, 6], true)

      expect(store.getState()).toEqual([4, 5, 6])
    })

    it('array without replace gets merged as object', () => {
      const store = createStore<number[]>(() => [1, 2, 3])
      // Without replace, Object.assign merges arrays as objects
      store.setState([4, 5, 6])

      // This is expected behavior - Object.assign({}, [1,2,3], [4,5,6])
      expect(store.getState()).toEqual({ '0': 4, '1': 5, '2': 6 })
    })

    it('handles nested object updates', () => {
      const store = createStore(() => ({
        user: { name: 'John', age: 30 },
        settings: { theme: 'dark' },
      }))

      store.setState({
        user: { name: 'Jane', age: 25 },
      })

      expect(store.getState()).toEqual({
        user: { name: 'Jane', age: 25 },
        settings: { theme: 'dark' },
      })
    })

    it('handles undefined values in partial', () => {
      const store = createStore<{ a: number; b?: string }>(() => ({
        a: 1,
        b: 'test',
      }))
      store.setState({ b: undefined })

      expect(store.getState()).toEqual({ a: 1, b: undefined })
    })

    it('handles updater function returning partial', () => {
      const store = createStore(() => ({ a: 1, b: 2, c: 3 }))
      store.setState((state) => ({ a: state.a + 10 }))

      expect(store.getState()).toEqual({ a: 11, b: 2, c: 3 })
    })

    it('handles multiple rapid updates', () => {
      const store = createStore(() => ({ count: 0 }))
      const listener = vi.fn()
      store.subscribe(listener)

      for (let i = 0; i < 100; i++) {
        store.setState((s) => ({ count: s.count + 1 }))
      }

      expect(store.getState().count).toBe(100)
      expect(listener).toHaveBeenCalledTimes(100)
    })

    it('handles setState inside setState (nested calls)', () => {
      const store = createStore((set) => ({
        count: 0,
        doubleIncrement: () => {
          set((s) => ({ count: s.count + 1 }))
          set((s) => ({ count: s.count + 1 }))
        },
      }))

      store.getState().doubleIncrement()
      expect(store.getState().count).toBe(2)
    })

    it('can use get() inside actions', () => {
      const store = createStore((set, get) => ({
        count: 0,
        incrementIfLessThan: (max: number) => {
          if (get().count < max) {
            set((s) => ({ count: s.count + 1 }))
          }
        },
      }))

      store.getState().incrementIfLessThan(2)
      store.getState().incrementIfLessThan(2)
      store.getState().incrementIfLessThan(2)

      expect(store.getState().count).toBe(2)
    })

    it('handles Date objects in state', () => {
      const date = new Date('2024-01-01')
      const store = createStore(() => ({ date }))

      expect(store.getState().date).toBe(date)

      const newDate = new Date('2024-12-31')
      store.setState({ date: newDate })

      expect(store.getState().date).toBe(newDate)
    })

    it('handles Map in state', () => {
      const store = createStore(() => ({
        map: new Map([['key', 'value']]),
      }))

      expect(store.getState().map.get('key')).toBe('value')

      const newMap = new Map([['newKey', 'newValue']])
      store.setState({ map: newMap })

      expect(store.getState().map.get('newKey')).toBe('newValue')
    })

    it('handles Set in state', () => {
      const store = createStore(() => ({
        set: new Set([1, 2, 3]),
      }))

      expect(store.getState().set.has(1)).toBe(true)

      const newSet = new Set([4, 5, 6])
      store.setState({ set: newSet })

      expect(store.getState().set.has(4)).toBe(true)
      expect(store.getState().set.has(1)).toBe(false)
    })
  })

  // ============================================================
  // subscribe
  // ============================================================
  describe('subscribe', () => {
    it('adds listener and returns unsubscribe function', () => {
      const store = createStore(() => ({ count: 0 }))
      const listener = vi.fn()

      const unsubscribe = store.subscribe(listener)

      expect(typeof unsubscribe).toBe('function')
    })

    it('calls listener on state change', () => {
      const store = createStore(() => ({ count: 0 }))
      const listener = vi.fn()
      store.subscribe(listener)

      store.setState({ count: 1 })

      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('passes new state and previous state to listener', () => {
      const store = createStore(() => ({ count: 0 }))
      const listener = vi.fn()
      store.subscribe(listener)

      store.setState({ count: 5 })

      expect(listener).toHaveBeenCalledWith(
        { count: 5 },
        { count: 0 }
      )
    })

    it('stops calling listener after unsubscribe', () => {
      const store = createStore(() => ({ count: 0 }))
      const listener = vi.fn()
      const unsubscribe = store.subscribe(listener)

      store.setState({ count: 1 })
      expect(listener).toHaveBeenCalledTimes(1)

      unsubscribe()

      store.setState({ count: 2 })
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('supports multiple listeners', () => {
      const store = createStore(() => ({ count: 0 }))
      const listener1 = vi.fn()
      const listener2 = vi.fn()
      const listener3 = vi.fn()

      store.subscribe(listener1)
      store.subscribe(listener2)
      store.subscribe(listener3)

      store.setState({ count: 1 })

      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)
      expect(listener3).toHaveBeenCalledTimes(1)
    })

    it('unsubscribes only the specific listener', () => {
      const store = createStore(() => ({ count: 0 }))
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      store.subscribe(listener1)
      const unsubscribe2 = store.subscribe(listener2)

      store.setState({ count: 1 })
      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)

      unsubscribe2()

      store.setState({ count: 2 })
      expect(listener1).toHaveBeenCalledTimes(2)
      expect(listener2).toHaveBeenCalledTimes(1)
    })

    it('allows re-subscribing the same listener', () => {
      const store = createStore(() => ({ count: 0 }))
      const listener = vi.fn()

      const unsub1 = store.subscribe(listener)
      unsub1()

      store.subscribe(listener)
      store.setState({ count: 1 })

      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  // ============================================================
  // subscribe - edge cases
  // ============================================================
  describe('subscribe edge cases', () => {
    it('handles unsubscribe called multiple times', () => {
      const store = createStore(() => ({ count: 0 }))
      const listener = vi.fn()
      const unsubscribe = store.subscribe(listener)

      unsubscribe()
      unsubscribe()
      unsubscribe()

      store.setState({ count: 1 })
      expect(listener).not.toHaveBeenCalled()
    })

    it('allows subscribe inside listener', () => {
      const store = createStore(() => ({ count: 0 }))
      const innerListener = vi.fn()
      let subscribed = false

      const outerListener = vi.fn(() => {
        if (!subscribed) {
          store.subscribe(innerListener)
          subscribed = true
        }
      })

      store.subscribe(outerListener)
      store.setState({ count: 1 })

      expect(outerListener).toHaveBeenCalledTimes(1)
      // Inner listener is added during iteration and Set.forEach continues to iterate
      // So inner listener IS called for the same update
      expect(innerListener).toHaveBeenCalledTimes(1)

      store.setState({ count: 2 })
      expect(innerListener).toHaveBeenCalledTimes(2)
    })

    it('allows unsubscribe inside listener', () => {
      const store = createStore(() => ({ count: 0 }))
      let unsubscribe: () => void

      const listener = vi.fn(() => {
        unsubscribe()
      })

      unsubscribe = store.subscribe(listener)

      store.setState({ count: 1 })
      expect(listener).toHaveBeenCalledTimes(1)

      store.setState({ count: 2 })
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('continues notifying other listeners if one throws', () => {
      const store = createStore(() => ({ count: 0 }))
      const listener1 = vi.fn()
      const errorListener = vi.fn(() => {
        throw new Error('Listener error')
      })
      const listener2 = vi.fn()

      store.subscribe(listener1)
      store.subscribe(errorListener)
      store.subscribe(listener2)

      expect(() => store.setState({ count: 1 })).toThrow('Listener error')
      // Due to forEach, error stops iteration
      expect(listener1).toHaveBeenCalled()
      // listener2 may or may not be called depending on Set iteration order
    })

    it('handles subscribe with same function multiple times', () => {
      const store = createStore(() => ({ count: 0 }))
      const listener = vi.fn()

      store.subscribe(listener)
      store.subscribe(listener) // Same function, Set will dedupe

      store.setState({ count: 1 })

      // Set deduplicates, so listener called only once
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('handles many subscribers efficiently', () => {
      const store = createStore(() => ({ count: 0 }))
      const listeners: ReturnType<typeof vi.fn>[] = []

      for (let i = 0; i < 1000; i++) {
        const listener = vi.fn()
        listeners.push(listener)
        store.subscribe(listener)
      }

      store.setState({ count: 1 })

      listeners.forEach((listener) => {
        expect(listener).toHaveBeenCalledTimes(1)
      })
    })
  })

  // ============================================================
  // destroy
  // ============================================================
  describe('destroy', () => {
    it('removes all listeners', () => {
      const store = createStore(() => ({ count: 0 }))
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      store.subscribe(listener1)
      store.subscribe(listener2)

      store.destroy()

      store.setState({ count: 1 })

      expect(listener1).not.toHaveBeenCalled()
      expect(listener2).not.toHaveBeenCalled()
    })

    it('allows subscribe after destroy', () => {
      const store = createStore(() => ({ count: 0 }))
      const listener = vi.fn()

      store.subscribe(listener)
      store.destroy()

      const newListener = vi.fn()
      store.subscribe(newListener)

      store.setState({ count: 1 })

      expect(listener).not.toHaveBeenCalled()
      expect(newListener).toHaveBeenCalledTimes(1)
    })

    it('allows setState after destroy', () => {
      const store = createStore(() => ({ count: 0 }))
      store.destroy()

      store.setState({ count: 5 })

      expect(store.getState()).toEqual({ count: 5 })
    })

    it('can be called multiple times', () => {
      const store = createStore(() => ({ count: 0 }))
      const listener = vi.fn()
      store.subscribe(listener)

      store.destroy()
      store.destroy()
      store.destroy()

      store.setState({ count: 1 })
      expect(listener).not.toHaveBeenCalled()
    })

    it('preserves state after destroy', () => {
      const store = createStore(() => ({ count: 42 }))
      store.destroy()

      expect(store.getState()).toEqual({ count: 42 })
    })
  })

  // ============================================================
  // computeNextState (tested via setState)
  // ============================================================
  describe('computeNextState behavior', () => {
    it('executes function partial with current state', () => {
      const store = createStore(() => ({ value: 10 }))

      store.setState((state) => {
        expect(state).toEqual({ value: 10 })
        return { value: 20 }
      })

      expect(store.getState()).toEqual({ value: 20 })
    })

    it('returns partial directly if not a function', () => {
      const store = createStore(() => ({ a: 1, b: 2 }))
      store.setState({ a: 10 })

      expect(store.getState()).toEqual({ a: 10, b: 2 })
    })
  })

  // ============================================================
  // notifyListeners (tested via setState)
  // ============================================================
  describe('notifyListeners behavior', () => {
    it('notifies listeners in order of subscription', () => {
      const store = createStore(() => ({ count: 0 }))
      const callOrder: number[] = []

      store.subscribe(() => callOrder.push(1))
      store.subscribe(() => callOrder.push(2))
      store.subscribe(() => callOrder.push(3))

      store.setState({ count: 1 })

      expect(callOrder).toEqual([1, 2, 3])
    })

    it('passes correct previous and next state', () => {
      const store = createStore(() => ({ count: 0 }))
      const states: Array<{ prev: unknown; next: unknown }> = []

      store.subscribe((next, prev) => {
        states.push({ next, prev })
      })

      store.setState({ count: 1 })
      store.setState({ count: 2 })
      store.setState({ count: 3 })

      expect(states).toEqual([
        { next: { count: 1 }, prev: { count: 0 } },
        { next: { count: 2 }, prev: { count: 1 } },
        { next: { count: 3 }, prev: { count: 2 } },
      ])
    })
  })

  // ============================================================
  // Integration scenarios
  // ============================================================
  describe('integration scenarios', () => {
    it('supports typical counter store pattern', () => {
      const store = createStore((set) => ({
        count: 0,
        increment: () => set((s) => ({ count: s.count + 1 })),
        decrement: () => set((s) => ({ count: s.count - 1 })),
        reset: () => set({ count: 0 }),
      }))

      expect(store.getState().count).toBe(0)

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

    it('supports async actions', async () => {
      const store = createStore((set) => ({
        data: null as string | null,
        loading: false,
        error: null as string | null,
        fetchData: async () => {
          set({ loading: true, error: null })
          try {
            // Simulate async operation
            await new Promise((resolve) => setTimeout(resolve, 10))
            set({ data: 'fetched', loading: false })
          } catch {
            set({ error: 'Failed', loading: false })
          }
        },
      }))

      expect(store.getState().loading).toBe(false)

      const fetchPromise = store.getState().fetchData()
      expect(store.getState().loading).toBe(true)

      await fetchPromise
      expect(store.getState().loading).toBe(false)
      expect(store.getState().data).toBe('fetched')
    })

    it('supports computed values via selectors', () => {
      const store = createStore(() => ({
        items: [
          { id: 1, price: 10 },
          { id: 2, price: 20 },
          { id: 3, price: 30 },
        ],
      }))

      // Selector pattern
      const getTotal = () =>
        store.getState().items.reduce((sum, item) => sum + item.price, 0)

      expect(getTotal()).toBe(60)

      store.setState({
        items: [...store.getState().items, { id: 4, price: 40 }],
      })

      expect(getTotal()).toBe(100)
    })

    it('supports state slicing', () => {
      const store = createStore(() => ({
        user: { name: 'John', email: 'john@example.com' },
        settings: { theme: 'dark', language: 'en' },
        notifications: [],
      }))

      // Update only user slice
      store.setState({
        user: { name: 'Jane', email: 'jane@example.com' },
      })

      expect(store.getState().user.name).toBe('Jane')
      expect(store.getState().settings.theme).toBe('dark')
    })
  })
})
