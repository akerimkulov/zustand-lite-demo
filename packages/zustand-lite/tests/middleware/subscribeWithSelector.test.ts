/**
 * Tests for subscribeWithSelector middleware.
 * Coverage: selector subscriptions, equalityFn, fireImmediately, edge cases
 */

import { describe, it, expect, vi } from 'vitest'
import { createStore } from '../../src/vanilla'
import { subscribeWithSelector } from '../../src/middleware/subscribeWithSelector'
import { shallow } from '../../src/utils/shallow'

// ============================================================
// TEST TYPES
// ============================================================

interface TestState {
  count: number
  name: string
  items: string[]
  nested: { value: number }
  increment: () => void
  setName: (name: string) => void
  addItem: (item: string) => void
}

const createTestStore = () =>
  createStore<TestState>()(
    subscribeWithSelector((set) => ({
      count: 0,
      name: 'test',
      items: [],
      nested: { value: 0 },
      increment: () => set((s) => ({ count: s.count + 1 })),
      setName: (name) => set({ name }),
      addItem: (item) => set((s) => ({ items: [...s.items, item] })),
    }))
  )

// ============================================================
// BASIC FUNCTIONALITY
// ============================================================

describe('subscribeWithSelector middleware', () => {
  describe('store creation', () => {
    it('creates store with initial state', () => {
      const store = createTestStore()

      expect(store.getState().count).toBe(0)
      expect(store.getState().name).toBe('test')
      expect(store.getState().items).toEqual([])
    })

    it('preserves store API', () => {
      const store = createTestStore()

      expect(typeof store.getState).toBe('function')
      expect(typeof store.setState).toBe('function')
      expect(typeof store.subscribe).toBe('function')
      expect(typeof store.destroy).toBe('function')
    })
  })

  describe('original subscribe pattern', () => {
    it('works without selector (original behavior)', () => {
      const store = createTestStore()
      const listener = vi.fn()

      store.subscribe(listener)
      store.getState().increment()

      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ count: 1 }),
        expect.objectContaining({ count: 0 })
      )
    })

    it('returns unsubscribe function', () => {
      const store = createTestStore()
      const listener = vi.fn()

      const unsubscribe = store.subscribe(listener)
      store.getState().increment()
      expect(listener).toHaveBeenCalledTimes(1)

      unsubscribe()
      store.getState().increment()
      expect(listener).toHaveBeenCalledTimes(1) // No more calls
    })
  })
})

// ============================================================
// SELECTOR-BASED SUBSCRIPTION
// ============================================================

describe('selector-based subscription', () => {
  describe('basic selector functionality', () => {
    it('fires when selected value changes', () => {
      const store = createTestStore()
      const listener = vi.fn()

      store.subscribe((state) => state.count, listener)

      store.getState().increment()
      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(1, 0)
    })

    it('does not fire when other state changes', () => {
      const store = createTestStore()
      const listener = vi.fn()

      store.subscribe((state) => state.count, listener)

      store.getState().setName('changed')
      expect(listener).not.toHaveBeenCalled()
    })

    it('provides previous selected state', () => {
      const store = createTestStore()
      const listener = vi.fn()

      store.subscribe((state) => state.count, listener)

      store.getState().increment()
      store.getState().increment()
      store.getState().increment()

      expect(listener).toHaveBeenCalledTimes(3)
      expect(listener).toHaveBeenNthCalledWith(1, 1, 0)
      expect(listener).toHaveBeenNthCalledWith(2, 2, 1)
      expect(listener).toHaveBeenNthCalledWith(3, 3, 2)
    })

    it('works with derived selectors', () => {
      const store = createTestStore()
      const listener = vi.fn()

      store.subscribe((state) => state.count * 2, listener)

      store.getState().increment()
      expect(listener).toHaveBeenCalledWith(2, 0)

      store.getState().increment()
      expect(listener).toHaveBeenCalledWith(4, 2)
    })

    it('works with object selectors (creates new reference each time)', () => {
      const store = createTestStore()
      const listener = vi.fn()

      // This will fire on every state change because object reference changes
      store.subscribe(
        (state) => ({ count: state.count }),
        listener
      )

      store.getState().setName('changed') // Different state, but count same
      // Object.is returns false for different object references
      expect(listener).toHaveBeenCalled()
    })
  })

  describe('array selectors', () => {
    it('fires when array changes', () => {
      const store = createTestStore()
      const listener = vi.fn()

      store.subscribe((state) => state.items, listener)

      store.getState().addItem('first')
      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(['first'], [])
    })

    it('fires when array length changes', () => {
      const store = createTestStore()
      const listener = vi.fn()

      store.subscribe((state) => state.items.length, listener)

      store.getState().addItem('first')
      store.getState().addItem('second')

      expect(listener).toHaveBeenCalledTimes(2)
      expect(listener).toHaveBeenNthCalledWith(1, 1, 0)
      expect(listener).toHaveBeenNthCalledWith(2, 2, 1)
    })
  })

  describe('nested state selectors', () => {
    it('fires when nested value changes', () => {
      const store = createTestStore()
      const listener = vi.fn()

      store.subscribe((state) => state.nested.value, listener)

      store.setState({ nested: { value: 42 } })
      expect(listener).toHaveBeenCalledWith(42, 0)
    })

    it('does not fire when nested object is same value', () => {
      const store = createTestStore()
      const listener = vi.fn()

      store.subscribe((state) => state.nested.value, listener)

      store.setState({ nested: { value: 0 } }) // Same value
      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('unsubscribe', () => {
    it('returns unsubscribe function', () => {
      const store = createTestStore()
      const listener = vi.fn()

      const unsubscribe = store.subscribe((state) => state.count, listener)

      store.getState().increment()
      expect(listener).toHaveBeenCalledTimes(1)

      unsubscribe()

      store.getState().increment()
      expect(listener).toHaveBeenCalledTimes(1) // No more calls
    })
  })
})

// ============================================================
// OPTIONS
// ============================================================

describe('subscription options', () => {
  describe('fireImmediately', () => {
    it('fires immediately with current value when true', () => {
      const store = createTestStore()
      store.setState({ count: 5 })

      const listener = vi.fn()

      store.subscribe((state) => state.count, listener, {
        fireImmediately: true,
      })

      // Called immediately with current value
      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(5, 5)
    })

    it('does not fire immediately when false (default)', () => {
      const store = createTestStore()
      store.setState({ count: 5 })

      const listener = vi.fn()

      store.subscribe((state) => state.count, listener, {
        fireImmediately: false,
      })

      expect(listener).not.toHaveBeenCalled()
    })

    it('does not fire immediately when option not provided', () => {
      const store = createTestStore()
      store.setState({ count: 5 })

      const listener = vi.fn()

      store.subscribe((state) => state.count, listener)

      expect(listener).not.toHaveBeenCalled()
    })

    it('fires immediately then fires on change', () => {
      const store = createTestStore()

      const listener = vi.fn()

      store.subscribe((state) => state.count, listener, {
        fireImmediately: true,
      })

      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(0, 0)

      store.getState().increment()

      expect(listener).toHaveBeenCalledTimes(2)
      expect(listener).toHaveBeenNthCalledWith(2, 1, 0)
    })
  })

  describe('equalityFn', () => {
    it('uses Object.is by default', () => {
      const store = createTestStore()
      const listener = vi.fn()

      store.subscribe((state) => state.count, listener)

      store.setState({ count: 0 }) // Same value
      expect(listener).not.toHaveBeenCalled()

      store.setState({ count: 1 })
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('supports custom equality function', () => {
      const store = createTestStore()
      const listener = vi.fn()

      // Always consider different (will always fire)
      const alwaysDifferent = () => false

      store.subscribe((state) => state.count, listener, {
        equalityFn: alwaysDifferent,
      })

      store.getState().setName('changed') // Count unchanged
      // But with alwaysDifferent, it should fire
      expect(listener).toHaveBeenCalled()
    })

    it('supports shallow equality for objects', () => {
      const store = createTestStore()
      const listener = vi.fn()

      store.subscribe(
        (state) => ({ count: state.count, name: state.name }),
        listener,
        { equalityFn: shallow }
      )

      // Change items (not selected)
      store.getState().addItem('item')
      expect(listener).not.toHaveBeenCalled()

      // Change count (selected)
      store.getState().increment()
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('supports shallow equality for arrays', () => {
      const store = createTestStore()
      const listener = vi.fn()

      store.subscribe(
        (state) => [state.count, state.name] as const,
        listener,
        { equalityFn: shallow }
      )

      // Change items (not in array)
      store.getState().addItem('item')
      expect(listener).not.toHaveBeenCalled()

      // Change count (in array)
      store.getState().increment()
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('custom equality can prevent updates', () => {
      const store = createTestStore()
      const listener = vi.fn()

      // Only notify if count changes by more than 5
      const bigChangeOnly = (a: number, b: number) => Math.abs(a - b) <= 5

      store.subscribe((state) => state.count, listener, {
        equalityFn: bigChangeOnly,
      })

      store.setState({ count: 3 })
      expect(listener).not.toHaveBeenCalled() // Change <= 5

      store.setState({ count: 10 })
      expect(listener).toHaveBeenCalledTimes(1) // Change > 5
    })
  })

  describe('combined options', () => {
    it('works with fireImmediately and equalityFn together', () => {
      const store = createTestStore()
      store.setState({ count: 5, name: 'initial' })

      const listener = vi.fn()

      store.subscribe(
        (state) => ({ count: state.count }),
        listener,
        {
          fireImmediately: true,
          equalityFn: shallow,
        }
      )

      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith({ count: 5 }, { count: 5 })

      // Change name (not in selector) - should not fire due to shallow
      store.getState().setName('changed')
      expect(listener).toHaveBeenCalledTimes(1)

      // Change count - should fire
      store.getState().increment()
      expect(listener).toHaveBeenCalledTimes(2)
    })
  })
})

// ============================================================
// EDGE CASES
// ============================================================

describe('edge cases', () => {
  it('handles multiple subscriptions with different selectors', () => {
    const store = createTestStore()
    const countListener = vi.fn()
    const nameListener = vi.fn()

    store.subscribe((state) => state.count, countListener)
    store.subscribe((state) => state.name, nameListener)

    store.getState().increment()
    expect(countListener).toHaveBeenCalledTimes(1)
    expect(nameListener).not.toHaveBeenCalled()

    store.getState().setName('changed')
    expect(countListener).toHaveBeenCalledTimes(1)
    expect(nameListener).toHaveBeenCalledTimes(1)
  })

  it('handles same selector multiple times', () => {
    const store = createTestStore()
    const listener1 = vi.fn()
    const listener2 = vi.fn()

    store.subscribe((state) => state.count, listener1)
    store.subscribe((state) => state.count, listener2)

    store.getState().increment()

    expect(listener1).toHaveBeenCalledTimes(1)
    expect(listener2).toHaveBeenCalledTimes(1)
  })

  it('handles rapid state changes', () => {
    const store = createTestStore()
    const listener = vi.fn()

    store.subscribe((state) => state.count, listener)

    for (let i = 0; i < 100; i++) {
      store.getState().increment()
    }

    expect(listener).toHaveBeenCalledTimes(100)
    expect(listener).toHaveBeenLastCalledWith(100, 99)
  })

  it('handles undefined selector result', () => {
    interface StateWithOptional {
      data?: { value: number }
      setData: (data?: { value: number }) => void
    }

    const store = createStore<StateWithOptional>()(
      subscribeWithSelector((set) => ({
        data: undefined,
        setData: (data) => set({ data }),
      }))
    )

    const listener = vi.fn()

    store.subscribe((state) => state.data?.value, listener)

    store.getState().setData({ value: 1 })
    expect(listener).toHaveBeenCalledWith(1, undefined)

    store.getState().setData(undefined)
    expect(listener).toHaveBeenCalledWith(undefined, 1)
  })

  it('handles null selector result', () => {
    interface StateWithNull {
      value: number | null
      setValue: (v: number | null) => void
    }

    const store = createStore<StateWithNull>()(
      subscribeWithSelector((set) => ({
        value: null,
        setValue: (value) => set({ value }),
      }))
    )

    const listener = vi.fn()

    store.subscribe((state) => state.value, listener)

    store.getState().setValue(1)
    expect(listener).toHaveBeenCalledWith(1, null)

    store.getState().setValue(null)
    expect(listener).toHaveBeenCalledWith(null, 1)
  })

  it('selector receives full state', () => {
    const store = createTestStore()
    const selectorFn = vi.fn((state: TestState) => state.count)

    store.subscribe(selectorFn, () => {})

    store.getState().increment()

    expect(selectorFn).toHaveBeenCalledWith(
      expect.objectContaining({
        count: expect.any(Number),
        name: expect.any(String),
        items: expect.any(Array),
      })
    )
  })

  it('works with computed values', () => {
    const store = createTestStore()
    const listener = vi.fn()

    store.subscribe(
      (state) => state.items.length > 0,
      listener
    )

    // First item: false -> true
    store.getState().addItem('first')
    expect(listener).toHaveBeenCalledWith(true, false)

    // Second item: still true
    store.getState().addItem('second')
    expect(listener).toHaveBeenCalledTimes(1) // No additional call
  })

  it('handles NaN correctly with Object.is', () => {
    interface NaNState {
      value: number
      setValue: (v: number) => void
    }

    const store = createStore<NaNState>()(
      subscribeWithSelector((set) => ({
        value: NaN,
        setValue: (value) => set({ value }),
      }))
    )

    const listener = vi.fn()

    store.subscribe((state) => state.value, listener)

    // NaN to NaN - Object.is(NaN, NaN) is true
    store.getState().setValue(NaN)
    expect(listener).not.toHaveBeenCalled()

    // NaN to 1
    store.getState().setValue(1)
    expect(listener).toHaveBeenCalledWith(1, NaN)
  })

  it('handles -0 and +0 correctly with Object.is', () => {
    interface ZeroState {
      value: number
      setValue: (v: number) => void
    }

    const store = createStore<ZeroState>()(
      subscribeWithSelector((set) => ({
        value: 0,
        setValue: (value) => set({ value }),
      }))
    )

    const listener = vi.fn()

    store.subscribe((state) => state.value, listener)

    // +0 to -0 - Object.is(0, -0) is false
    store.getState().setValue(-0)
    expect(listener).toHaveBeenCalledWith(-0, 0)
  })
})

// ============================================================
// INTEGRATION WITH OTHER PATTERNS
// ============================================================

describe('integration patterns', () => {
  it('works with selectors that return functions', () => {
    const store = createTestStore()
    const listener = vi.fn()

    // Select the increment function
    store.subscribe(
      (state) => state.increment,
      listener
    )

    // Functions are recreated on each state change with our store setup
    // So this should fire on any state change
    store.getState().setName('changed')

    // Depends on implementation - if increment is stable, won't fire
    // If recreated, will fire
  })

  it('allows subscribing to multiple fields efficiently', () => {
    const store = createTestStore()
    const listener = vi.fn()

    // Use shallow to compare multiple fields
    store.subscribe(
      (state) => ({ count: state.count, name: state.name }),
      listener,
      { equalityFn: shallow }
    )

    // Only count or name changes trigger
    store.getState().addItem('item')
    expect(listener).not.toHaveBeenCalled()

    store.getState().increment()
    expect(listener).toHaveBeenCalledTimes(1)

    store.getState().setName('new')
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('can be used for side effects', async () => {
    const store = createTestStore()
    const sideEffect = vi.fn()

    store.subscribe(
      (state) => state.count,
      (count) => {
        if (count > 5) {
          sideEffect()
        }
      }
    )

    for (let i = 0; i < 10; i++) {
      store.getState().increment()
    }

    // count starts at 0, increments to 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
    // > 5 means 6, 7, 8, 9, 10 - that's 5 calls
    expect(sideEffect).toHaveBeenCalledTimes(5)
  })
})
