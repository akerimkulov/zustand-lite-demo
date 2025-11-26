/**
 * Tests for SSR hydration utilities.
 * Coverage: useHydration, HydrationBoundary, useStoreHydrated, isServer, isClient
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { createStore } from '../../src/vanilla'
import { persist } from '../../src/middleware/persist'
import {
  useHydration,
  HydrationBoundary,
  useStoreHydrated,
  isServer,
  isClient,
} from '../../src/ssr/hydration'
import type { PersistStorage, StorageValue } from '../../src/middleware/persist'

// ============================================================
// TEST SETUP
// ============================================================

interface TestState {
  count: number
  name: string
  increment: () => void
}

// Create mock storage
function createMockStorage<T>(): PersistStorage<T> & { data: Map<string, T> } {
  const data = new Map<string, T>()
  return {
    data,
    getItem: vi.fn((name: string) => data.get(name) ?? null),
    setItem: vi.fn((name: string, value: T) => data.set(name, value)),
    removeItem: vi.fn((name: string) => {
      data.delete(name)
    }),
  }
}

// ============================================================
// USE HYDRATION HOOK TESTS
// ============================================================

describe('useHydration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('with persist middleware', () => {
    it('returns false initially, true after hydration', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      storage.data.set('test', { state: { count: 5 }, version: 0 })

      const store = createStore<TestState>()(
        persist(
          (set) => ({
            count: 0,
            name: 'test',
            increment: () => set((s) => ({ count: s.count + 1 })),
          }),
          { name: 'test', storage, skipHydration: true }
        )
      )

      const states: boolean[] = []

      function TestComponent() {
        const hydrated = useHydration(store)
        states.push(hydrated)
        return <div data-testid="hydrated">{hydrated ? 'yes' : 'no'}</div>
      }

      render(<TestComponent />)

      // Initially not hydrated
      expect(screen.getByTestId('hydrated').textContent).toBe('no')

      // Wait for hydration
      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(screen.getByTestId('hydrated').textContent).toBe('yes')
    })

    it('returns true immediately if already hydrated', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()

      const store = createStore<TestState>()(
        persist(
          (set) => ({
            count: 0,
            name: 'test',
            increment: () => set((s) => ({ count: s.count + 1 })),
          }),
          { name: 'test', storage } // Auto-hydrate
        )
      )

      // Wait for auto-hydration
      await vi.runAllTimersAsync()

      function TestComponent() {
        const hydrated = useHydration(store)
        return <div data-testid="hydrated">{hydrated ? 'yes' : 'no'}</div>
      }

      render(<TestComponent />)

      // Should be hydrated immediately
      expect(screen.getByTestId('hydrated').textContent).toBe('yes')
    })

    it('triggers rehydrate for skipHydration stores', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      storage.data.set('test', { state: { count: 42 }, version: 0 })

      const store = createStore<TestState>()(
        persist(
          (set) => ({
            count: 0,
            name: 'test',
            increment: () => set((s) => ({ count: s.count + 1 })),
          }),
          { name: 'test', storage, skipHydration: true }
        )
      )

      expect(store.getState().count).toBe(0)
      expect(store.persist.hasHydrated()).toBe(false)

      function TestComponent() {
        const hydrated = useHydration(store)
        const count = store.getState().count
        return (
          <div>
            <span data-testid="hydrated">{hydrated ? 'yes' : 'no'}</span>
            <span data-testid="count">{count}</span>
          </div>
        )
      }

      render(<TestComponent />)

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(store.persist.hasHydrated()).toBe(true)
      expect(store.getState().count).toBe(42)
    })
  })

  describe('without persist middleware', () => {
    it('returns true immediately', () => {
      const store = createStore<TestState>()((set) => ({
        count: 0,
        name: 'test',
        increment: () => set((s) => ({ count: s.count + 1 })),
      }))

      function TestComponent() {
        const hydrated = useHydration(store)
        return <div data-testid="hydrated">{hydrated ? 'yes' : 'no'}</div>
      }

      render(<TestComponent />)

      expect(screen.getByTestId('hydrated').textContent).toBe('yes')
    })
  })
})

// ============================================================
// HYDRATION BOUNDARY COMPONENT TESTS
// ============================================================

describe('HydrationBoundary', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders fallback before hydration', async () => {
    const storage = createMockStorage<StorageValue<Partial<TestState>>>()
    storage.data.set('test', { state: { count: 5 }, version: 0 })

    const store = createStore<TestState>()(
      persist(
        (set) => ({
          count: 0,
          name: 'test',
          increment: () => set((s) => ({ count: s.count + 1 })),
        }),
        { name: 'test', storage, skipHydration: true }
      )
    )

    render(
      <HydrationBoundary store={store} fallback={<div data-testid="fallback">Loading...</div>}>
        <div data-testid="content">Content</div>
      </HydrationBoundary>
    )

    expect(screen.queryByTestId('fallback')).not.toBeNull()
    expect(screen.queryByTestId('content')).toBeNull()
  })

  it('renders children after hydration', async () => {
    const storage = createMockStorage<StorageValue<Partial<TestState>>>()
    storage.data.set('test', { state: { count: 5 }, version: 0 })

    const store = createStore<TestState>()(
      persist(
        (set) => ({
          count: 0,
          name: 'test',
          increment: () => set((s) => ({ count: s.count + 1 })),
        }),
        { name: 'test', storage, skipHydration: true }
      )
    )

    render(
      <HydrationBoundary store={store} fallback={<div data-testid="fallback">Loading...</div>}>
        <div data-testid="content">Content</div>
      </HydrationBoundary>
    )

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(screen.queryByTestId('fallback')).toBeNull()
    expect(screen.queryByTestId('content')).not.toBeNull()
  })

  it('calls onHydrated callback', async () => {
    const storage = createMockStorage<StorageValue<Partial<TestState>>>()
    storage.data.set('test', { state: { count: 5 }, version: 0 })

    const store = createStore<TestState>()(
      persist(
        (set) => ({
          count: 0,
          name: 'test',
          increment: () => set((s) => ({ count: s.count + 1 })),
        }),
        { name: 'test', storage, skipHydration: true }
      )
    )

    const onHydrated = vi.fn()

    render(
      <HydrationBoundary store={store} onHydrated={onHydrated}>
        <div>Content</div>
      </HydrationBoundary>
    )

    expect(onHydrated).not.toHaveBeenCalled()

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(onHydrated).toHaveBeenCalledTimes(1)
  })

  it('renders null as default fallback', () => {
    const storage = createMockStorage<StorageValue<Partial<TestState>>>()

    const store = createStore<TestState>()(
      persist(
        (set) => ({
          count: 0,
          name: 'test',
          increment: () => set((s) => ({ count: s.count + 1 })),
        }),
        { name: 'test', storage, skipHydration: true }
      )
    )

    const { container } = render(
      <HydrationBoundary store={store}>
        <div data-testid="content">Content</div>
      </HydrationBoundary>
    )

    expect(container.innerHTML).toBe('')
  })

  it('works with store without persist', () => {
    const store = createStore<TestState>()((set) => ({
      count: 0,
      name: 'test',
      increment: () => set((s) => ({ count: s.count + 1 })),
    }))

    render(
      <HydrationBoundary store={store} fallback={<div data-testid="fallback">Loading</div>}>
        <div data-testid="content">Content</div>
      </HydrationBoundary>
    )

    // Should immediately show content (no persist = immediately hydrated)
    expect(screen.queryByTestId('fallback')).toBeNull()
    expect(screen.queryByTestId('content')).not.toBeNull()
  })
})

// ============================================================
// USE STORE HYDRATED HOOK TESTS
// ============================================================

describe('useStoreHydrated', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns fallback before hydration', () => {
    const storage = createMockStorage<StorageValue<Partial<TestState>>>()
    storage.data.set('test', { state: { count: 42 }, version: 0 })

    const store = createStore<TestState>()(
      persist(
        (set) => ({
          count: 0,
          name: 'test',
          increment: () => set((s) => ({ count: s.count + 1 })),
        }),
        { name: 'test', storage, skipHydration: true }
      )
    )

    function TestComponent() {
      const count = useStoreHydrated(store, (s) => s.count, -1)
      return <div data-testid="count">{count}</div>
    }

    render(<TestComponent />)

    expect(screen.getByTestId('count').textContent).toBe('-1')
  })

  it('returns selected state after hydration', async () => {
    const storage = createMockStorage<StorageValue<Partial<TestState>>>()
    storage.data.set('test', { state: { count: 42 }, version: 0 })

    const store = createStore<TestState>()(
      persist(
        (set) => ({
          count: 0,
          name: 'test',
          increment: () => set((s) => ({ count: s.count + 1 })),
        }),
        { name: 'test', storage, skipHydration: true }
      )
    )

    function TestComponent() {
      const count = useStoreHydrated(store, (s) => s.count, -1)
      return <div data-testid="count">{count}</div>
    }

    render(<TestComponent />)

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(screen.getByTestId('count').textContent).toBe('42')
  })

  it('updates when state changes after hydration', async () => {
    const storage = createMockStorage<StorageValue<Partial<TestState>>>()
    storage.data.set('test', { state: { count: 10 }, version: 0 })

    const store = createStore<TestState>()(
      persist(
        (set) => ({
          count: 0,
          name: 'test',
          increment: () => set((s) => ({ count: s.count + 1 })),
        }),
        { name: 'test', storage, skipHydration: true }
      )
    )

    function TestComponent() {
      const count = useStoreHydrated(store, (s) => s.count, -1)
      return (
        <div>
          <span data-testid="count">{count}</span>
          <button onClick={() => store.getState().increment()}>Inc</button>
        </div>
      )
    }

    render(<TestComponent />)

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(screen.getByTestId('count').textContent).toBe('10')

    act(() => {
      screen.getByRole('button').click()
    })

    expect(screen.getByTestId('count').textContent).toBe('11')
  })

  it('works with store without persist', () => {
    const store = createStore<TestState>()((set) => ({
      count: 5,
      name: 'test',
      increment: () => set((s) => ({ count: s.count + 1 })),
    }))

    function TestComponent() {
      const count = useStoreHydrated(store, (s) => s.count, -1)
      return <div data-testid="count">{count}</div>
    }

    render(<TestComponent />)

    // Should immediately show actual value
    expect(screen.getByTestId('count').textContent).toBe('5')
  })
})

// ============================================================
// IS SERVER / IS CLIENT CONSTANTS
// ============================================================

describe('isServer and isClient', () => {
  it('isClient is true in test environment (jsdom/happy-dom)', () => {
    expect(isClient).toBe(true)
  })

  it('isServer is false in test environment', () => {
    expect(isServer).toBe(false)
  })

  it('isServer and isClient are opposites', () => {
    expect(isServer).toBe(!isClient)
  })
})

// ============================================================
// INTEGRATION TESTS
// ============================================================

describe('hydration integration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('complete SSR hydration flow', async () => {
    const storage = createMockStorage<StorageValue<{ items: string[] }>>()
    storage.data.set('cart', {
      state: { items: ['item1', 'item2'] },
      version: 0,
    })

    interface CartState {
      items: string[]
      addItem: (item: string) => void
    }

    const store = createStore<CartState>()(
      persist(
        (set) => ({
          items: [],
          addItem: (item) => set((s) => ({ items: [...s.items, item] })),
        }),
        { name: 'cart', storage, skipHydration: true }
      )
    )

    function Cart() {
      const hydrated = useHydration(store)
      const items = hydrated ? store.getState().items : []

      if (!hydrated) {
        return <div data-testid="skeleton">Loading cart...</div>
      }

      return (
        <div data-testid="cart">
          <span data-testid="count">{items.length} items</span>
          <ul>
            {items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )
    }

    render(<Cart />)

    // Initially shows skeleton
    expect(screen.queryByTestId('skeleton')).not.toBeNull()
    expect(screen.queryByTestId('cart')).toBeNull()

    // After hydration
    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(screen.queryByTestId('skeleton')).toBeNull()
    expect(screen.queryByTestId('cart')).not.toBeNull()
    expect(screen.getByTestId('count').textContent).toBe('2 items')
  })

  it('multiple stores hydration', async () => {
    const userStorage = createMockStorage<StorageValue<{ name: string }>>()
    userStorage.data.set('user', { state: { name: 'John' }, version: 0 })

    const settingsStorage = createMockStorage<StorageValue<{ theme: string }>>()
    settingsStorage.data.set('settings', { state: { theme: 'dark' }, version: 0 })

    const userStore = createStore<{ name: string }>()(
      persist(() => ({ name: '' }), {
        name: 'user',
        storage: userStorage,
        skipHydration: true,
      })
    )

    const settingsStore = createStore<{ theme: string }>()(
      persist(() => ({ theme: 'light' }), {
        name: 'settings',
        storage: settingsStorage,
        skipHydration: true,
      })
    )

    function App() {
      const userHydrated = useHydration(userStore)
      const settingsHydrated = useHydration(settingsStore)
      const allHydrated = userHydrated && settingsHydrated

      if (!allHydrated) {
        return <div data-testid="loading">Loading...</div>
      }

      return (
        <div data-testid="app">
          <span data-testid="name">{userStore.getState().name}</span>
          <span data-testid="theme">{settingsStore.getState().theme}</span>
        </div>
      )
    }

    render(<App />)

    expect(screen.queryByTestId('loading')).not.toBeNull()

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(screen.queryByTestId('loading')).toBeNull()
    expect(screen.getByTestId('name').textContent).toBe('John')
    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })
})
