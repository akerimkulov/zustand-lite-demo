/**
 * Integration tests for middleware composition.
 * Tests how multiple middleware work together.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createStore } from '../../src/vanilla'
import { persist } from '../../src/middleware/persist'
import { immer } from '../../src/middleware/immer'
import { devtools } from '../../src/middleware/devtools'
import { subscribeWithSelector } from '../../src/middleware/subscribeWithSelector'
import { combine } from '../../src/middleware/combine'
import { enableDevToolsMock, disableDevToolsMock } from '../setup'
import type { PersistStorage, StorageValue } from '../../src/middleware/persist'

// ============================================================
// TEST SETUP
// ============================================================

interface TodoState {
  todos: Array<{ id: number; text: string; done: boolean }>
  filter: 'all' | 'active' | 'completed'
  addTodo: (text: string) => void
  toggleTodo: (id: number) => void
  setFilter: (filter: 'all' | 'active' | 'completed') => void
}

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
// DEVTOOLS + PERSIST
// ============================================================

describe('devtools + persist', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    enableDevToolsMock()
  })

  afterEach(() => {
    vi.useRealTimers()
    disableDevToolsMock()
  })

  it('devtools wraps persist correctly', async () => {
    const storage = createMockStorage<StorageValue<{ count: number }>>()
    storage.data.set('test', { state: { count: 10 }, version: 0 })

    const store = createStore<{ count: number; increment: () => void }>()(
      devtools(
        persist(
          (set) => ({
            count: 0,
            increment: () => set((s) => ({ count: s.count + 1 })),
          }),
          { name: 'test', storage }
        ),
        { name: 'TestStore' }
      )
    )

    await vi.runAllTimersAsync()

    // Should have both APIs
    expect(store.devtools).toBeDefined()
    expect(store.persist).toBeDefined()

    // Should hydrate from storage
    expect(store.getState().count).toBe(10)

    // State changes should work
    store.setState({ count: 20 })
    expect(store.getState().count).toBe(20)
  })

  it('persist wraps devtools correctly', async () => {
    const storage = createMockStorage<StorageValue<{ count: number }>>()
    storage.data.set('test', { state: { count: 10 }, version: 0 })

    const store = createStore<{ count: number; increment: () => void }>()(
      persist(
        devtools(
          (set) => ({
            count: 0,
            increment: () => set((s) => ({ count: s.count + 1 })),
          }),
          { name: 'TestStore' }
        ),
        { name: 'test', storage }
      )
    )

    await vi.runAllTimersAsync()

    expect(store.devtools).toBeDefined()
    expect(store.persist).toBeDefined()
    expect(store.getState().count).toBe(10)
  })
})

// ============================================================
// IMMER + PERSIST
// ============================================================

describe('immer + persist', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('immer works with persist', async () => {
    const storage = createMockStorage<StorageValue<{ items: string[] }>>()
    storage.data.set('test', { state: { items: ['initial'] }, version: 0 })

    const store = createStore<{ items: string[]; addItem: (item: string) => void }>()(
      persist(
        immer((set) => ({
          items: [],
          addItem: (item) =>
            set((draft) => {
              draft.items.push(item)
            }),
        })),
        { name: 'test', storage }
      )
    )

    await vi.runAllTimersAsync()

    expect(store.getState().items).toEqual(['initial'])

    store.getState().addItem('new item')

    expect(store.getState().items).toEqual(['initial', 'new item'])
  })

  it('persist partialize works with immer', async () => {
    const storage = createMockStorage<StorageValue<{ count: number }>>()

    const store = createStore<{
      count: number
      loading: boolean
      increment: () => void
    }>()(
      persist(
        immer((set) => ({
          count: 0,
          loading: false,
          increment: () =>
            set((draft) => {
              draft.count++
            }),
        })),
        {
          name: 'test',
          storage,
          partialize: (state) => ({ count: state.count }),
        }
      )
    )

    await vi.runAllTimersAsync()

    store.getState().increment()
    await vi.advanceTimersByTimeAsync(100)

    const persisted = storage.data.get('test')
    expect(persisted?.state).toEqual({ count: 1 })
    expect((persisted?.state as any).loading).toBeUndefined()
  })
})

// ============================================================
// SUBSCRIBE WITH SELECTOR + IMMER
// ============================================================

describe('subscribeWithSelector + immer', () => {
  it('selector subscriptions work with immer updates', () => {
    const store = createStore<TodoState>()(
      subscribeWithSelector(
        immer((set) => ({
          todos: [],
          filter: 'all',
          addTodo: (text) =>
            set((draft) => {
              draft.todos.push({ id: Date.now(), text, done: false })
            }),
          toggleTodo: (id) =>
            set((draft) => {
              const todo = draft.todos.find((t) => t.id === id)
              if (todo) todo.done = !todo.done
            }),
          setFilter: (filter) =>
            set((draft) => {
              draft.filter = filter
            }),
        }))
      )
    )

    const todoListener = vi.fn()
    const filterListener = vi.fn()

    store.subscribe((state) => state.todos, todoListener)
    store.subscribe((state) => state.filter, filterListener)

    store.getState().addTodo('Test todo')

    expect(todoListener).toHaveBeenCalledTimes(1)
    expect(filterListener).not.toHaveBeenCalled()

    store.getState().setFilter('active')

    expect(todoListener).toHaveBeenCalledTimes(1)
    expect(filterListener).toHaveBeenCalledTimes(1)
  })
})

// ============================================================
// COMBINE + ALL MIDDLEWARE
// ============================================================

describe('combine with middleware', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    enableDevToolsMock()
  })

  afterEach(() => {
    vi.useRealTimers()
    disableDevToolsMock()
  })

  it('combine works with devtools + persist + immer', async () => {
    const storage = createMockStorage<StorageValue<{ count: number; items: string[] }>>()
    storage.data.set('test', {
      state: { count: 5, items: ['stored'] },
      version: 0,
    })

    const store = createStore()(
      devtools(
        persist(
          immer(
            combine(
              { count: 0, items: [] as string[] },
              (set) => ({
                increment: () =>
                  set((draft) => {
                    draft.count++
                  }),
                addItem: (item: string) =>
                  set((draft) => {
                    draft.items.push(item)
                  }),
              })
            )
          ),
          { name: 'test', storage }
        ),
        { name: 'CombinedStore' }
      )
    )

    await vi.runAllTimersAsync()

    expect(store.getState().count).toBe(5)
    expect(store.getState().items).toEqual(['stored'])

    store.getState().increment()
    store.getState().addItem('new')

    expect(store.getState().count).toBe(6)
    expect(store.getState().items).toEqual(['stored', 'new'])

    expect(store.devtools).toBeDefined()
    expect(store.persist).toBeDefined()
  })
})

// ============================================================
// FULL STACK: ALL MIDDLEWARE
// ============================================================

describe('full middleware stack', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    enableDevToolsMock()
  })

  afterEach(() => {
    vi.useRealTimers()
    disableDevToolsMock()
  })

  it('devtools > persist > subscribeWithSelector > immer', async () => {
    const storage = createMockStorage<
      StorageValue<{ count: number; name: string }>
    >()
    storage.data.set('test', {
      state: { count: 10, name: 'stored' },
      version: 0,
    })

    interface State {
      count: number
      name: string
      increment: () => void
      setName: (name: string) => void
    }

    const store = createStore<State>()(
      devtools(
        persist(
          subscribeWithSelector(
            immer((set) => ({
              count: 0,
              name: 'initial',
              increment: () =>
                set((draft) => {
                  draft.count++
                }),
              setName: (name) =>
                set((draft) => {
                  draft.name = name
                }),
            }))
          ),
          { name: 'test', storage }
        ),
        { name: 'FullStackStore' }
      )
    )

    await vi.runAllTimersAsync()

    // Verify hydration
    expect(store.getState().count).toBe(10)
    expect(store.getState().name).toBe('stored')

    // Verify subscribeWithSelector
    const countListener = vi.fn()
    store.subscribe((state) => state.count, countListener)

    // Verify immer
    store.getState().increment()
    expect(store.getState().count).toBe(11)
    expect(countListener).toHaveBeenCalledWith(11, 10)

    // Name change shouldn't trigger count listener
    store.getState().setName('updated')
    expect(countListener).toHaveBeenCalledTimes(1)

    // Verify APIs exist
    expect(store.devtools).toBeDefined()
    expect(store.persist).toBeDefined()
  })

  it('persist > devtools > immer > subscribeWithSelector (different order)', async () => {
    const storage = createMockStorage<
      StorageValue<{ value: number }>
    >()
    storage.data.set('alt-order', {
      state: { value: 42 },
      version: 0,
    })

    interface State {
      value: number
      double: () => void
    }

    const store = createStore<State>()(
      persist(
        devtools(
          immer(
            subscribeWithSelector((set) => ({
              value: 0,
              double: () =>
                set((draft) => {
                  draft.value *= 2
                }),
            }))
          ),
          { name: 'AltOrderStore' }
        ),
        { name: 'alt-order', storage }
      )
    )

    await vi.runAllTimersAsync()

    expect(store.getState().value).toBe(42)

    const listener = vi.fn()
    store.subscribe((state) => state.value, listener)

    store.getState().double()
    expect(store.getState().value).toBe(84)
    expect(listener).toHaveBeenCalledWith(84, 42)
  })
})

// ============================================================
// EDGE CASES
// ============================================================

describe('middleware composition edge cases', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('handles async migration with immer', async () => {
    const storage = createMockStorage<StorageValue<{ count: number }>>()
    storage.data.set('migrate', {
      state: { count: 5 },
      version: 0,
    })

    const store = createStore<{ count: number }>()(
      persist(
        immer(() => ({ count: 0 })),
        {
          name: 'migrate',
          storage,
          version: 1,
          migrate: async (state) => {
            await new Promise((r) => setTimeout(r, 50))
            return { count: (state as { count: number }).count * 2 }
          },
        }
      )
    )

    await vi.advanceTimersByTimeAsync(100)

    expect(store.getState().count).toBe(10)
  })

  it('subscribeWithSelector with shallow comparison on complex state', () => {
    const store = createStore<{
      data: { items: number[]; meta: { total: number } }
      setItems: (items: number[]) => void
    }>()(
      subscribeWithSelector(
        immer((set) => ({
          data: { items: [1, 2, 3], meta: { total: 3 } },
          setItems: (items) =>
            set((draft) => {
              draft.data.items = items
              draft.data.meta.total = items.length
            }),
        }))
      )
    )

    const itemsListener = vi.fn()
    store.subscribe((state) => state.data.items.length, itemsListener)

    // Same length, shouldn't fire
    store.getState().setItems([4, 5, 6])
    expect(itemsListener).not.toHaveBeenCalled()

    // Different length, should fire
    store.getState().setItems([7, 8, 9, 10])
    expect(itemsListener).toHaveBeenCalledWith(4, 3)
  })

  it('multiple stores with same middleware stack are independent', async () => {
    const storage1 = createMockStorage<StorageValue<{ value: number }>>()
    const storage2 = createMockStorage<StorageValue<{ value: number }>>()

    storage1.data.set('store1', { state: { value: 1 }, version: 0 })
    storage2.data.set('store2', { state: { value: 2 }, version: 0 })

    const createWithMiddleware = (
      name: string,
      storage: PersistStorage<StorageValue<{ value: number }>>
    ) =>
      createStore<{ value: number; inc: () => void }>()(
        persist(
          immer((set) => ({
            value: 0,
            inc: () =>
              set((draft) => {
                draft.value++
              }),
          })),
          { name, storage }
        )
      )

    const store1 = createWithMiddleware('store1', storage1)
    const store2 = createWithMiddleware('store2', storage2)

    await vi.runAllTimersAsync()

    expect(store1.getState().value).toBe(1)
    expect(store2.getState().value).toBe(2)

    store1.getState().inc()

    expect(store1.getState().value).toBe(2)
    expect(store2.getState().value).toBe(2) // Unchanged
  })
})
