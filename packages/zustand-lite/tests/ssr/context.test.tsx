/**
 * Tests for SSR context utilities.
 * Coverage: createStoreContext, StoreProvider, useStoreContext, useStoreApi
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { createStore } from '../../src/vanilla'
import { createStoreContext } from '../../src/ssr/context'
import { shallow } from '../../src/utils/shallow'

// ============================================================
// TEST TYPES
// ============================================================

interface TestState {
  count: number
  name: string
  increment: () => void
  setName: (name: string) => void
}

// ============================================================
// CREATE STORE CONTEXT TESTS
// ============================================================

describe('createStoreContext', () => {
  const createTestStore = (initialState?: Partial<TestState>) =>
    createStore<TestState>()((set) => ({
      count: 0,
      name: 'test',
      increment: () => set((s) => ({ count: s.count + 1 })),
      setName: (name) => set({ name }),
      ...initialState,
    }))

  describe('return value', () => {
    it('returns StoreProvider, useStoreContext, useStoreApi, and StoreContext', () => {
      const result = createStoreContext(createTestStore)

      expect(result.StoreProvider).toBeDefined()
      expect(result.useStoreContext).toBeDefined()
      expect(result.useStoreApi).toBeDefined()
      expect(result.StoreContext).toBeDefined()
      expect(typeof result.StoreProvider).toBe('function')
      expect(typeof result.useStoreContext).toBe('function')
      expect(typeof result.useStoreApi).toBe('function')
    })
  })

  describe('StoreProvider', () => {
    it('provides store to children via context', () => {
      const { StoreProvider, useStoreContext } = createStoreContext(createTestStore)

      function TestComponent() {
        const count = useStoreContext((s) => s.count)
        return <div data-testid="count">{count}</div>
      }

      render(
        <StoreProvider>
          <TestComponent />
        </StoreProvider>
      )

      expect(screen.getByTestId('count').textContent).toBe('0')
    })

    it('creates store with initialState', () => {
      const { StoreProvider, useStoreContext } = createStoreContext(createTestStore)

      function TestComponent() {
        const count = useStoreContext((s) => s.count)
        const name = useStoreContext((s) => s.name)
        return (
          <div>
            <span data-testid="count">{count}</span>
            <span data-testid="name">{name}</span>
          </div>
        )
      }

      render(
        <StoreProvider initialState={{ count: 10, name: 'custom' }}>
          <TestComponent />
        </StoreProvider>
      )

      expect(screen.getByTestId('count').textContent).toBe('10')
      expect(screen.getByTestId('name').textContent).toBe('custom')
    })

    it('creates store only once', () => {
      const createStoreFn = vi.fn(createTestStore)
      const { StoreProvider, useStoreContext } = createStoreContext(createStoreFn)

      function TestComponent() {
        const count = useStoreContext((s) => s.count)
        return <div>{count}</div>
      }

      const { rerender } = render(
        <StoreProvider>
          <TestComponent />
        </StoreProvider>
      )

      rerender(
        <StoreProvider>
          <TestComponent />
        </StoreProvider>
      )

      expect(createStoreFn).toHaveBeenCalledTimes(1)
    })

    it('different providers create different stores', () => {
      const { StoreProvider, useStoreApi } = createStoreContext(createTestStore)

      let store1: any
      let store2: any

      function GetStore1() {
        store1 = useStoreApi()
        return null
      }

      function GetStore2() {
        store2 = useStoreApi()
        return null
      }

      render(
        <>
          <StoreProvider>
            <GetStore1 />
          </StoreProvider>
          <StoreProvider>
            <GetStore2 />
          </StoreProvider>
        </>
      )

      expect(store1).not.toBe(store2)
    })
  })

  describe('useStoreApi', () => {
    it('returns the store API', () => {
      const { StoreProvider, useStoreApi } = createStoreContext(createTestStore)

      let api: any

      function TestComponent() {
        api = useStoreApi()
        return null
      }

      render(
        <StoreProvider>
          <TestComponent />
        </StoreProvider>
      )

      expect(api).toBeDefined()
      expect(typeof api.getState).toBe('function')
      expect(typeof api.setState).toBe('function')
      expect(typeof api.subscribe).toBe('function')
    })

    it('throws error when used outside provider', () => {
      const { useStoreApi } = createStoreContext(createTestStore)

      function TestComponent() {
        useStoreApi()
        return null
      }

      expect(() => render(<TestComponent />)).toThrow(
        'useStoreApi must be used within a StoreProvider'
      )
    })

    it('allows direct state manipulation', () => {
      const { StoreProvider, useStoreApi, useStoreContext } = createStoreContext(createTestStore)

      function ManipulatorComponent() {
        const api = useStoreApi()
        return (
          <button onClick={() => api.setState({ count: 100 })}>
            Set 100
          </button>
        )
      }

      function DisplayComponent() {
        const count = useStoreContext((s) => s.count)
        return <div data-testid="count">{count}</div>
      }

      render(
        <StoreProvider>
          <ManipulatorComponent />
          <DisplayComponent />
        </StoreProvider>
      )

      expect(screen.getByTestId('count').textContent).toBe('0')

      act(() => {
        screen.getByRole('button').click()
      })

      expect(screen.getByTestId('count').textContent).toBe('100')
    })
  })

  describe('useStoreContext', () => {
    it('returns full state when no selector provided', () => {
      const { StoreProvider, useStoreContext } = createStoreContext(createTestStore)

      let state: TestState | undefined

      function TestComponent() {
        state = useStoreContext()
        return null
      }

      render(
        <StoreProvider>
          <TestComponent />
        </StoreProvider>
      )

      expect(state).toBeDefined()
      expect(state?.count).toBe(0)
      expect(state?.name).toBe('test')
      expect(typeof state?.increment).toBe('function')
    })

    it('returns selected state with selector', () => {
      const { StoreProvider, useStoreContext } = createStoreContext(createTestStore)

      function TestComponent() {
        const count = useStoreContext((s) => s.count)
        return <div data-testid="count">{count}</div>
      }

      render(
        <StoreProvider>
          <TestComponent />
        </StoreProvider>
      )

      expect(screen.getByTestId('count').textContent).toBe('0')
    })

    it('re-renders when selected state changes', () => {
      const { StoreProvider, useStoreContext } = createStoreContext(createTestStore)
      const renderCount = vi.fn()

      function TestComponent() {
        const count = useStoreContext((s) => s.count)
        const increment = useStoreContext((s) => s.increment)
        renderCount()
        return (
          <div>
            <span data-testid="count">{count}</span>
            <button onClick={increment}>Inc</button>
          </div>
        )
      }

      render(
        <StoreProvider>
          <TestComponent />
        </StoreProvider>
      )

      expect(renderCount).toHaveBeenCalledTimes(1)

      act(() => {
        screen.getByRole('button').click()
      })

      expect(screen.getByTestId('count').textContent).toBe('1')
      expect(renderCount).toHaveBeenCalledTimes(2)
    })

    it('does not re-render when unrelated state changes', () => {
      const { StoreProvider, useStoreContext, useStoreApi } = createStoreContext(createTestStore)
      const renderCount = vi.fn()

      function CountComponent() {
        const count = useStoreContext((s) => s.count)
        renderCount()
        return <div data-testid="count">{count}</div>
      }

      function UpdateNameButton() {
        const api = useStoreApi()
        return (
          <button onClick={() => api.setState({ name: 'changed' })}>
            Change Name
          </button>
        )
      }

      render(
        <StoreProvider>
          <CountComponent />
          <UpdateNameButton />
        </StoreProvider>
      )

      expect(renderCount).toHaveBeenCalledTimes(1)

      act(() => {
        screen.getByRole('button').click()
      })

      // Should not re-render since count didn't change
      expect(renderCount).toHaveBeenCalledTimes(1)
    })

    it('supports custom equality function', () => {
      const { StoreProvider, useStoreContext, useStoreApi } = createStoreContext(createTestStore)
      const renderCount = vi.fn()

      function TestComponent() {
        // Select object, use shallow equality
        const data = useStoreContext(
          (s) => ({ count: s.count, name: s.name }),
          shallow
        )
        renderCount()
        return <div data-testid="data">{JSON.stringify(data)}</div>
      }

      function UpdateButton() {
        const api = useStoreApi()
        return (
          <button onClick={() => api.setState({ count: 1 })}>
            Update
          </button>
        )
      }

      render(
        <StoreProvider>
          <TestComponent />
          <UpdateButton />
        </StoreProvider>
      )

      expect(renderCount).toHaveBeenCalledTimes(1)

      act(() => {
        screen.getByRole('button').click()
      })

      expect(renderCount).toHaveBeenCalledTimes(2)
      expect(screen.getByTestId('data').textContent).toContain('"count":1')
    })
  })

  describe('StoreContext', () => {
    it('can be used directly with useContext', () => {
      const { StoreProvider, StoreContext } = createStoreContext(createTestStore)

      function TestComponent() {
        const store = React.useContext(StoreContext)
        return <div data-testid="hasStore">{store ? 'yes' : 'no'}</div>
      }

      render(
        <StoreProvider>
          <TestComponent />
        </StoreProvider>
      )

      expect(screen.getByTestId('hasStore').textContent).toBe('yes')
    })

    it('returns null when outside provider', () => {
      const { StoreContext } = createStoreContext(createTestStore)

      function TestComponent() {
        const store = React.useContext(StoreContext)
        return <div data-testid="hasStore">{store ? 'yes' : 'no'}</div>
      }

      render(<TestComponent />)

      expect(screen.getByTestId('hasStore').textContent).toBe('no')
    })
  })
})

// ============================================================
// NESTED PROVIDERS
// ============================================================

describe('nested providers', () => {
  it('inner provider shadows outer provider', () => {
    const createCountStore = (init?: Partial<{ value: number }>) =>
      createStore<{ value: number; inc: () => void }>()((set) => ({
        value: 0,
        inc: () => set((s) => ({ value: s.value + 1 })),
        ...init,
      }))

    const { StoreProvider, useStoreContext } = createStoreContext(createCountStore)

    function DisplayValue() {
      const value = useStoreContext((s) => s.value)
      return <span data-testid="value">{value}</span>
    }

    render(
      <StoreProvider initialState={{ value: 1 }}>
        <div data-testid="outer">
          <DisplayValue />
        </div>
        <StoreProvider initialState={{ value: 2 }}>
          <div data-testid="inner">
            <DisplayValue />
          </div>
        </StoreProvider>
      </StoreProvider>
    )

    const values = screen.getAllByTestId('value')
    expect(values[0].textContent).toBe('1') // outer
    expect(values[1].textContent).toBe('2') // inner
  })
})

// ============================================================
// MULTIPLE STORES
// ============================================================

describe('multiple stores', () => {
  it('supports multiple independent stores', () => {
    const createCountStore = () =>
      createStore<{ count: number; inc: () => void }>()((set) => ({
        count: 0,
        inc: () => set((s) => ({ count: s.count + 1 })),
      }))

    const createNameStore = () =>
      createStore<{ name: string; setName: (n: string) => void }>()((set) => ({
        name: '',
        setName: (name) => set({ name }),
      }))

    const {
      StoreProvider: CountProvider,
      useStoreContext: useCount,
    } = createStoreContext(createCountStore)

    const {
      StoreProvider: NameProvider,
      useStoreContext: useName,
    } = createStoreContext(createNameStore)

    function TestComponent() {
      const count = useCount((s) => s.count)
      const name = useName((s) => s.name)
      const inc = useCount((s) => s.inc)
      const setName = useName((s) => s.setName)

      return (
        <div>
          <span data-testid="count">{count}</span>
          <span data-testid="name">{name || 'empty'}</span>
          <button onClick={inc}>Inc</button>
          <button onClick={() => setName('test')}>Set Name</button>
        </div>
      )
    }

    render(
      <CountProvider>
        <NameProvider>
          <TestComponent />
        </NameProvider>
      </CountProvider>
    )

    expect(screen.getByTestId('count').textContent).toBe('0')
    expect(screen.getByTestId('name').textContent).toBe('empty')

    act(() => {
      screen.getByText('Inc').click()
    })

    expect(screen.getByTestId('count').textContent).toBe('1')
    expect(screen.getByTestId('name').textContent).toBe('empty')

    act(() => {
      screen.getByText('Set Name').click()
    })

    expect(screen.getByTestId('count').textContent).toBe('1')
    expect(screen.getByTestId('name').textContent).toBe('test')
  })
})
