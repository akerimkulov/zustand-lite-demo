import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { create, useStore, createStore } from '../src/react'
import { shallow } from '../src/utils/shallow'
import type { StoreApi } from '../src/types'

describe('react bindings', () => {
  // ============================================================
  // create function
  // ============================================================
  describe('create', () => {
    it('creates a bound hook with state access', () => {
      const useStore = create(() => ({ count: 0 }))

      const { result } = renderHook(() => useStore())

      expect(result.current).toEqual({ count: 0 })
    })

    it('supports curried API for explicit typing', () => {
      interface State {
        count: number
        name: string
      }

      const useStore = create<State>()(() => ({
        count: 0,
        name: 'test',
      }))

      const { result } = renderHook(() => useStore())

      expect(result.current).toEqual({ count: 0, name: 'test' })
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

      create(initializer)
      expect(initializer).toHaveBeenCalledTimes(1)
    })

    it('hook returns full state without selector', () => {
      const useStore = create(() => ({
        count: 0,
        name: 'test',
        nested: { value: true },
      }))

      const { result } = renderHook(() => useStore())

      expect(result.current).toEqual({
        count: 0,
        name: 'test',
        nested: { value: true },
      })
    })

    it('hook with selector returns selected slice', () => {
      const useStore = create(() => ({
        count: 42,
        name: 'test',
      }))

      const { result } = renderHook(() => useStore((state) => state.count))

      expect(result.current).toBe(42)
    })

    it('attaches store API methods to hook', () => {
      const useStore = create(() => ({ count: 0 }))

      expect(typeof useStore.getState).toBe('function')
      expect(typeof useStore.setState).toBe('function')
      expect(typeof useStore.subscribe).toBe('function')
      expect(typeof useStore.destroy).toBe('function')
      expect(typeof useStore.getInitialState).toBe('function')
    })

    it('getState returns current state', () => {
      const useStore = create(() => ({ count: 0 }))

      expect(useStore.getState()).toEqual({ count: 0 })
    })

    it('setState updates state', () => {
      const useStore = create(() => ({ count: 0 }))

      useStore.setState({ count: 5 })

      expect(useStore.getState()).toEqual({ count: 5 })
    })

    it('subscribe adds listener', () => {
      const useStore = create(() => ({ count: 0 }))
      const listener = vi.fn()

      useStore.subscribe(listener)
      useStore.setState({ count: 1 })

      expect(listener).toHaveBeenCalledWith({ count: 1 }, { count: 0 })
    })

    it('getInitialState returns initial state', () => {
      const useStore = create(() => ({ count: 0 }))

      useStore.setState({ count: 100 })

      expect(useStore.getInitialState()).toEqual({ count: 0 })
    })
  })

  // ============================================================
  // useStore hook
  // ============================================================
  describe('useStore hook', () => {
    let store: StoreApi<{ count: number; name: string }>

    beforeEach(() => {
      store = createStore(() => ({ count: 0, name: 'initial' }))
    })

    afterEach(() => {
      store.destroy()
    })

    it('returns full state without selector', () => {
      const { result } = renderHook(() => useStore(store))

      expect(result.current).toEqual({ count: 0, name: 'initial' })
    })

    it('returns selected slice with selector', () => {
      const { result } = renderHook(() =>
        useStore(store, (state) => state.count)
      )

      expect(result.current).toBe(0)
    })

    it('re-renders when state changes', async () => {
      const { result } = renderHook(() =>
        useStore(store, (state) => state.count)
      )

      expect(result.current).toBe(0)

      act(() => {
        store.setState({ count: 5 })
      })

      expect(result.current).toBe(5)
    })

    it('does not re-render when unrelated state changes', () => {
      const renderCount = vi.fn()

      const { result } = renderHook(() => {
        renderCount()
        return useStore(store, (state) => state.count)
      })

      expect(renderCount).toHaveBeenCalledTimes(1)
      expect(result.current).toBe(0)

      act(() => {
        store.setState({ name: 'changed' })
      })

      // Should not re-render since count didn't change
      expect(renderCount).toHaveBeenCalledTimes(1)
      expect(result.current).toBe(0)
    })

    it('uses custom equality function', () => {
      const renderCount = vi.fn()
      const store = createStore(() => ({
        user: { name: 'John', age: 30 },
      }))

      const { result } = renderHook(() => {
        renderCount()
        return useStore(
          store,
          (state) => ({ name: state.user.name }),
          shallow
        )
      })

      expect(renderCount).toHaveBeenCalledTimes(1)
      expect(result.current).toEqual({ name: 'John' })

      act(() => {
        // Change only age, name stays the same
        store.setState({ user: { name: 'John', age: 31 } })
      })

      // With shallow comparison, should not re-render since selected object is equal
      expect(renderCount).toHaveBeenCalledTimes(1)
    })

    it('unsubscribes on unmount', () => {
      const { unmount } = renderHook(() =>
        useStore(store, (state) => state.count)
      )

      unmount()

      // After unmount, state changes should not cause issues
      act(() => {
        store.setState({ count: 100 })
      })

      expect(store.getState().count).toBe(100)
    })
  })

  // ============================================================
  // Selector behavior
  // ============================================================
  describe('selector behavior', () => {
    it('selector can compute derived values', () => {
      const useStore = create(() => ({
        items: [1, 2, 3, 4, 5],
      }))

      const { result } = renderHook(() =>
        useStore((state) => state.items.reduce((a, b) => a + b, 0))
      )

      expect(result.current).toBe(15)
    })

    it('selector can return objects', () => {
      const useStore = create(() => ({
        user: { name: 'John', age: 30 },
        settings: { theme: 'dark' },
      }))

      const { result } = renderHook(() =>
        useStore((state) => ({
          userName: state.user.name,
          theme: state.settings.theme,
        }))
      )

      expect(result.current).toEqual({ userName: 'John', theme: 'dark' })
    })

    it('selector returning undefined works', () => {
      const useStore = create<{ value?: string }>(() => ({}))

      const { result } = renderHook(() =>
        useStore((state) => state.value)
      )

      expect(result.current).toBeUndefined()
    })

    it('selector returning null works', () => {
      const useStore = create(() => ({ value: null as string | null }))

      const { result } = renderHook(() =>
        useStore((state) => state.value)
      )

      expect(result.current).toBeNull()
    })

    it('selector returning NaN works', () => {
      const useStore = create(() => ({ value: NaN }))

      const { result } = renderHook(() =>
        useStore((state) => state.value)
      )

      expect(result.current).toBeNaN()
    })

    it('multiple selectors on same store work independently', () => {
      const useStore = create(() => ({
        count: 0,
        name: 'test',
      }))

      const { result: countResult } = renderHook(() =>
        useStore((state) => state.count)
      )
      const { result: nameResult } = renderHook(() =>
        useStore((state) => state.name)
      )

      expect(countResult.current).toBe(0)
      expect(nameResult.current).toBe('test')

      act(() => {
        useStore.setState({ count: 5 })
      })

      expect(countResult.current).toBe(5)
      expect(nameResult.current).toBe('test')
    })
  })

  // ============================================================
  // Equality function
  // ============================================================
  describe('equality function', () => {
    it('uses Object.is by default', () => {
      const useStore = create(() => ({
        obj: { value: 1 },
      }))

      const renderCount = vi.fn()
      renderHook(() => {
        renderCount()
        return useStore((state) => state.obj)
      })

      expect(renderCount).toHaveBeenCalledTimes(1)

      act(() => {
        // Setting same value but different reference
        useStore.setState({ obj: { value: 1 } })
      })

      // Object.is returns false for different references, so re-render
      expect(renderCount).toHaveBeenCalledTimes(2)
    })

    it('custom equality function prevents unnecessary re-renders', () => {
      const useStore = create(() => ({
        a: 1,
        b: 2,
      }))

      const renderCount = vi.fn()
      renderHook(() => {
        renderCount()
        return useStore(
          (state) => ({ a: state.a, b: state.b }),
          shallow
        )
      })

      expect(renderCount).toHaveBeenCalledTimes(1)

      act(() => {
        // Set same values
        useStore.setState({ a: 1, b: 2 })
      })

      // Shallow comparison returns true, no re-render
      expect(renderCount).toHaveBeenCalledTimes(1)
    })

    it('custom equality function can be any comparison', () => {
      const useStore = create(() => ({ count: 0 }))

      // Always equal - never re-render after initial
      const alwaysEqual = () => true

      const renderCount = vi.fn()
      renderHook(() => {
        renderCount()
        return useStore((state) => state.count, alwaysEqual)
      })

      expect(renderCount).toHaveBeenCalledTimes(1)

      act(() => {
        useStore.setState({ count: 100 })
      })

      // alwaysEqual returns true, so no re-render
      expect(renderCount).toHaveBeenCalledTimes(1)
    })
  })

  // ============================================================
  // Actions
  // ============================================================
  describe('actions', () => {
    it('actions defined in store work correctly', () => {
      const useStore = create((set) => ({
        count: 0,
        increment: () => set((s) => ({ count: s.count + 1 })),
        decrement: () => set((s) => ({ count: s.count - 1 })),
        reset: () => set({ count: 0 }),
      }))

      const { result } = renderHook(() => ({
        count: useStore((s) => s.count),
        increment: useStore((s) => s.increment),
        decrement: useStore((s) => s.decrement),
        reset: useStore((s) => s.reset),
      }))

      expect(result.current.count).toBe(0)

      act(() => {
        result.current.increment()
      })
      expect(result.current.count).toBe(1)

      act(() => {
        result.current.increment()
        result.current.increment()
      })
      expect(result.current.count).toBe(3)

      act(() => {
        result.current.decrement()
      })
      expect(result.current.count).toBe(2)

      act(() => {
        result.current.reset()
      })
      expect(result.current.count).toBe(0)
    })

    it('async actions work correctly', async () => {
      const useStore = create((set) => ({
        data: null as string | null,
        loading: false,
        fetchData: async () => {
          set({ loading: true })
          await new Promise((r) => setTimeout(r, 10))
          set({ data: 'fetched', loading: false })
        },
      }))

      const { result } = renderHook(() => ({
        data: useStore((s) => s.data),
        loading: useStore((s) => s.loading),
        fetchData: useStore((s) => s.fetchData),
      }))

      expect(result.current.loading).toBe(false)
      expect(result.current.data).toBeNull()

      act(() => {
        result.current.fetchData()
      })

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.data).toBe('fetched')
      })
    })

    it('actions can use get() for current state', () => {
      const useStore = create((set, get) => ({
        count: 0,
        incrementIfLessThan: (max: number) => {
          if (get().count < max) {
            set((s) => ({ count: s.count + 1 }))
          }
        },
      }))

      const { result } = renderHook(() => ({
        count: useStore((s) => s.count),
        incrementIfLessThan: useStore((s) => s.incrementIfLessThan),
      }))

      act(() => {
        result.current.incrementIfLessThan(2)
        result.current.incrementIfLessThan(2)
        result.current.incrementIfLessThan(2)
      })

      expect(result.current.count).toBe(2)
    })
  })

  // ============================================================
  // Multiple components
  // ============================================================
  describe('multiple components sharing store', () => {
    it('multiple hooks share same state', () => {
      const useStore = create(() => ({ count: 0 }))

      const { result: result1 } = renderHook(() => useStore((s) => s.count))
      const { result: result2 } = renderHook(() => useStore((s) => s.count))

      expect(result1.current).toBe(0)
      expect(result2.current).toBe(0)

      act(() => {
        useStore.setState({ count: 5 })
      })

      expect(result1.current).toBe(5)
      expect(result2.current).toBe(5)
    })

    it('state changes propagate to all subscribers', () => {
      const useStore = create((set) => ({
        count: 0,
        increment: () => set((s) => ({ count: s.count + 1 })),
      }))

      const { result: result1 } = renderHook(() => ({
        count: useStore((s) => s.count),
        increment: useStore((s) => s.increment),
      }))

      const { result: result2 } = renderHook(() =>
        useStore((s) => s.count)
      )

      act(() => {
        result1.current.increment()
      })

      expect(result1.current.count).toBe(1)
      expect(result2.current).toBe(1)
    })
  })

  // ============================================================
  // Edge cases
  // ============================================================
  describe('edge cases', () => {
    it('handles rapid state updates', () => {
      const useStore = create(() => ({ count: 0 }))

      const { result } = renderHook(() => useStore((s) => s.count))

      act(() => {
        for (let i = 0; i < 100; i++) {
          useStore.setState((s) => ({ count: s.count + 1 }))
        }
      })

      expect(result.current).toBe(100)
    })

    it('handles state updates during render', () => {
      const useStore = create(() => ({ count: 0 }))

      const { result } = renderHook(() => {
        const count = useStore((s) => s.count)
        // Don't update during render - this is bad practice but should not crash
        return count
      })

      expect(result.current).toBe(0)
    })

    it('works with primitive state', () => {
      const useStore = create<number>(() => 42)

      const { result } = renderHook(() => useStore())

      expect(result.current).toBe(42)

      act(() => {
        useStore.setState(100)
      })

      expect(result.current).toBe(100)
    })

    it('works with array state', () => {
      const useStore = create<number[]>(() => [1, 2, 3])

      const { result } = renderHook(() => useStore())

      expect(result.current).toEqual([1, 2, 3])

      act(() => {
        useStore.setState([4, 5, 6], true)
      })

      expect(result.current).toEqual([4, 5, 6])
    })

    it('selector changes work when state also changes', () => {
      const useStore = create(() => ({
        count: 10,
        name: 'test',
      }))

      // Use props to change selector
      const { result, rerender } = renderHook(
        ({ selectCount }: { selectCount: boolean }) =>
          useStore((s) => (selectCount ? s.count : s.name)),
        { initialProps: { selectCount: true } }
      )

      expect(result.current).toBe(10)

      // Trigger state change to apply new selector
      act(() => {
        useStore.setState({ count: 20 })
      })

      // Rerender with different selector
      rerender({ selectCount: false })

      // Trigger another state change
      act(() => {
        useStore.setState({ name: 'updated' })
      })

      expect(result.current).toBe('updated')
    })

    it('handles store destruction gracefully', () => {
      const useStore = create(() => ({ count: 0 }))

      const { result, unmount } = renderHook(() => useStore((s) => s.count))

      expect(result.current).toBe(0)

      useStore.destroy()
      unmount()

      // Should not throw
      expect(useStore.getState()).toEqual({ count: 0 })
    })
  })

  // ============================================================
  // SSR support
  // ============================================================
  describe('SSR support', () => {
    it('getInitialState is used for server snapshot', () => {
      const useStore = create(() => ({ count: 0 }))

      // Simulate state change
      useStore.setState({ count: 100 })

      // Initial state should still be 0
      expect(useStore.getInitialState()).toEqual({ count: 0 })
    })

    it('hook uses getState for client rendering', () => {
      const useStore = create(() => ({ count: 0 }))

      useStore.setState({ count: 50 })

      const { result } = renderHook(() => useStore((s) => s.count))

      // Should use current state, not initial
      expect(result.current).toBe(50)
    })
  })

  // ============================================================
  // Re-exports
  // ============================================================
  describe('re-exports', () => {
    it('exports createStore', () => {
      expect(createStore).toBeDefined()
      const store = createStore(() => ({ count: 0 }))
      expect(store.getState()).toEqual({ count: 0 })
    })

    it('exports shallow', () => {
      expect(shallow).toBeDefined()
      expect(shallow({ a: 1 }, { a: 1 })).toBe(true)
    })
  })

  // ============================================================
  // Memoization and caching
  // ============================================================
  describe('memoization and caching', () => {
    it('returns cached slice when state reference unchanged', () => {
      const useStore = create(() => ({ count: 0, other: 'value' }))

      const selectorCalls = vi.fn((s: { count: number }) => s.count)

      const { result, rerender } = renderHook(() =>
        useStore(selectorCalls)
      )

      expect(result.current).toBe(0)

      // Re-render without state change
      rerender()

      // Selector may be called on rerender but should return cached value
      expect(result.current).toBe(0)
    })

    it('caches slice when equality function returns true', () => {
      const useStore = create(() => ({ items: [1, 2, 3] }))

      const renderCount = vi.fn()
      renderHook(() => {
        renderCount()
        return useStore((s) => [...s.items], shallow) // New array each time
      })

      expect(renderCount).toHaveBeenCalledTimes(1)

      act(() => {
        // Set same items - shallow equal
        useStore.setState({ items: [1, 2, 3] })
      })

      // Shallow comparison of arrays [1,2,3] === [1,2,3]
      expect(renderCount).toHaveBeenCalledTimes(1)
    })
  })

  // ============================================================
  // Store isolation
  // ============================================================
  describe('store isolation', () => {
    it('multiple stores are independent', () => {
      const useStore1 = create(() => ({ value: 'store1' }))
      const useStore2 = create(() => ({ value: 'store2' }))

      const { result: result1 } = renderHook(() => useStore1((s) => s.value))
      const { result: result2 } = renderHook(() => useStore2((s) => s.value))

      expect(result1.current).toBe('store1')
      expect(result2.current).toBe('store2')

      act(() => {
        useStore1.setState({ value: 'changed1' })
      })

      expect(result1.current).toBe('changed1')
      expect(result2.current).toBe('store2')
    })
  })
})
