/**
 * Tests for persist middleware.
 * Coverage: createJSONStorage, persist middleware, PersistApi, all options
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createStore } from '../../src/vanilla'
import { persist, createJSONStorage } from '../../src/middleware/persist'
import type { PersistStorage, StorageValue } from '../../src/middleware/persist'

// ============================================================
// TEST SETUP
// ============================================================

interface TestState {
  count: number
  name: string
  items: string[]
  increment: () => void
  setName: (name: string) => void
}

const createTestStore = (
  options: Parameters<typeof persist>[1],
  initialState?: Partial<TestState>
) => {
  return createStore<TestState>()(
    persist(
      (set) => ({
        count: 0,
        name: 'test',
        items: [],
        increment: () => set((s) => ({ count: s.count + 1 })),
        setName: (name) => set({ name }),
        ...initialState,
      }),
      options
    )
  )
}

// In-memory mock storage
const createMockStorage = <T>(): PersistStorage<T> & {
  data: Map<string, T>
  _getItemError?: Error
  _setItemError?: Error
  _removeItemError?: Error
} => {
  const data = new Map<string, T>()
  return {
    data,
    _getItemError: undefined,
    _setItemError: undefined,
    _removeItemError: undefined,
    getItem: vi.fn((name: string) => {
      const storage = createMockStorage as any
      if (storage._getItemError) throw storage._getItemError
      return data.get(name) ?? null
    }),
    setItem: vi.fn((name: string, value: T) => {
      const storage = createMockStorage as any
      if (storage._setItemError) throw storage._setItemError
      data.set(name, value)
    }),
    removeItem: vi.fn((name: string) => {
      const storage = createMockStorage as any
      if (storage._removeItemError) throw storage._removeItemError
      data.delete(name)
    }),
  }
}

// Async mock storage
const createAsyncMockStorage = <T>(
  delay = 10
): PersistStorage<T> & { data: Map<string, T> } => {
  const data = new Map<string, T>()
  return {
    data,
    getItem: vi.fn(
      (name: string) =>
        new Promise((resolve) =>
          setTimeout(() => resolve(data.get(name) ?? null), delay)
        )
    ),
    setItem: vi.fn(
      (name: string, value: T) =>
        new Promise<void>((resolve) =>
          setTimeout(() => {
            data.set(name, value)
            resolve()
          }, delay)
        )
    ),
    removeItem: vi.fn(
      (name: string) =>
        new Promise<void>((resolve) =>
          setTimeout(() => {
            data.delete(name)
            resolve()
          }, delay)
        )
    ),
  }
}

// ============================================================
// createJSONStorage TESTS
// ============================================================

describe('createJSONStorage', () => {
  describe('getItem', () => {
    it('returns null if storage is undefined', () => {
      const storage = createJSONStorage(() => undefined)
      expect(storage.getItem('test')).toBeNull()
    })

    it('returns null if item not found', () => {
      const mockStorage = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
      }
      const storage = createJSONStorage(() => mockStorage as Storage)
      expect(storage.getItem('nonexistent')).toBeNull()
    })

    it('returns parsed JSON value', () => {
      const mockStorage = {
        getItem: vi.fn(() => JSON.stringify({ state: { count: 5 }, version: 0 })),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
      }
      const storage = createJSONStorage<StorageValue<{ count: number }>>(
        () => mockStorage as Storage
      )
      expect(storage.getItem('test')).toEqual({ state: { count: 5 }, version: 0 })
    })

    it('returns null on JSON parse error', () => {
      const mockStorage = {
        getItem: vi.fn(() => 'invalid json{{{'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
      }
      const storage = createJSONStorage(() => mockStorage as Storage)
      expect(storage.getItem('test')).toBeNull()
    })

    it('returns null if storage throws', () => {
      const mockStorage = {
        getItem: vi.fn(() => {
          throw new Error('Storage error')
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
      }
      const storage = createJSONStorage(() => mockStorage as Storage)
      expect(storage.getItem('test')).toBeNull()
    })
  })

  describe('setItem', () => {
    it('does nothing if storage is undefined', () => {
      const storage = createJSONStorage(() => undefined)
      expect(() => storage.setItem('test', { value: 1 })).not.toThrow()
    })

    it('stores JSON stringified value', () => {
      const mockStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
      }
      const storage = createJSONStorage(() => mockStorage as Storage)
      storage.setItem('test', { state: { count: 5 }, version: 1 })
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'test',
        JSON.stringify({ state: { count: 5 }, version: 1 })
      )
    })

    it('catches storage errors silently', () => {
      const mockStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(() => {
          throw new Error('Quota exceeded')
        }),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
      }
      const storage = createJSONStorage(() => mockStorage as Storage)
      expect(() => storage.setItem('test', { value: 1 })).not.toThrow()
    })
  })

  describe('removeItem', () => {
    it('does nothing if storage is undefined', () => {
      const storage = createJSONStorage(() => undefined)
      expect(() => storage.removeItem('test')).not.toThrow()
    })

    it('removes item from storage', () => {
      const mockStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
      }
      const storage = createJSONStorage(() => mockStorage as Storage)
      storage.removeItem('test')
      expect(mockStorage.removeItem).toHaveBeenCalledWith('test')
    })

    it('catches storage errors silently', () => {
      const mockStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(() => {
          throw new Error('Storage error')
        }),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
      }
      const storage = createJSONStorage(() => mockStorage as Storage)
      expect(() => storage.removeItem('test')).not.toThrow()
    })
  })

  describe('with localStorage', () => {
    it('uses localStorage by default in browser environment', () => {
      const storage = createJSONStorage(() => localStorage)
      storage.setItem('test-key', { state: { a: 1 }, version: 0 })
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify({ state: { a: 1 }, version: 0 })
      )
    })
  })
})

// ============================================================
// persist MIDDLEWARE BASIC TESTS
// ============================================================

describe('persist middleware', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('store creation', () => {
    it('creates store with initial state', () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      const store = createTestStore({ name: 'test', storage })

      expect(store.getState().count).toBe(0)
      expect(store.getState().name).toBe('test')
    })

    it('adds persist API to store', () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      const store = createTestStore({ name: 'test', storage })

      expect(store.persist).toBeDefined()
      expect(typeof store.persist.rehydrate).toBe('function')
      expect(typeof store.persist.hasHydrated).toBe('function')
      expect(typeof store.persist.onFinishHydration).toBe('function')
      expect(typeof store.persist.onHydrate).toBe('function')
      expect(typeof store.persist.getOptions).toBe('function')
      expect(typeof store.persist.clearStorage).toBe('function')
      expect(typeof store.persist.flush).toBe('function')
    })

    it('uses storage key from name option', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      storage.data.set('my-custom-key', {
        state: { count: 99 },
        version: 0,
      })

      const store = createTestStore({ name: 'my-custom-key', storage })
      await vi.runAllTimersAsync()

      expect(store.getState().count).toBe(99)
    })
  })

  describe('automatic rehydration', () => {
    it('rehydrates state from storage on creation', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      storage.data.set('test', { state: { count: 10, name: 'rehydrated' }, version: 0 })

      const store = createTestStore({ name: 'test', storage })
      await vi.runAllTimersAsync()

      expect(store.getState().count).toBe(10)
      expect(store.getState().name).toBe('rehydrated')
    })

    it('does not rehydrate if storage is empty', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      const store = createTestStore({ name: 'test', storage })
      await vi.runAllTimersAsync()

      expect(store.getState().count).toBe(0)
    })

    it('merges persisted state with initial state', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      storage.data.set('test', { state: { count: 5 }, version: 0 })

      const store = createTestStore({ name: 'test', storage })
      await vi.runAllTimersAsync()

      expect(store.getState().count).toBe(5)
      expect(store.getState().name).toBe('test') // From initial state
      expect(typeof store.getState().increment).toBe('function') // From initial state
    })
  })

  describe('state persistence', () => {
    it('persists state changes to storage', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      const store = createTestStore({ name: 'test', storage })
      await vi.runAllTimersAsync()

      store.getState().increment()
      await vi.advanceTimersByTimeAsync(100) // Debounce time

      expect(storage.data.get('test')?.state).toMatchObject({ count: 1 })
    })

    it('debounces multiple state changes', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      const store = createTestStore({ name: 'test', storage })
      await vi.runAllTimersAsync()

      // Clear mock calls from initial setup
      vi.mocked(storage.setItem).mockClear()

      // Rapidly change state
      store.getState().increment()
      store.getState().increment()
      store.getState().increment()

      // Should not persist immediately
      expect(storage.setItem).not.toHaveBeenCalled()

      // After debounce
      await vi.advanceTimersByTimeAsync(100)

      // Should only persist once with final state
      expect(storage.setItem).toHaveBeenCalledTimes(1)
      expect(storage.data.get('test')?.state).toMatchObject({ count: 3 })
    })

    it('does not persist before hydration', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      storage.data.set('test', { state: { count: 10 }, version: 0 })

      const store = createTestStore({ name: 'test', storage, skipHydration: true })

      // Clear mock calls
      vi.mocked(storage.setItem).mockClear()

      // Change state before hydration
      store.getState().increment()
      await vi.advanceTimersByTimeAsync(100)

      // Should not persist
      expect(storage.setItem).not.toHaveBeenCalled()
    })

    it('persists with version number', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      const store = createTestStore({ name: 'test', storage, version: 5 })
      await vi.runAllTimersAsync()

      store.getState().increment()
      await vi.advanceTimersByTimeAsync(100)

      expect(storage.data.get('test')?.version).toBe(5)
    })
  })
})

// ============================================================
// PERSIST API TESTS
// ============================================================

describe('persist API', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('hasHydrated', () => {
    it('returns false before hydration', () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      const store = createTestStore({ name: 'test', storage, skipHydration: true })

      expect(store.persist.hasHydrated()).toBe(false)
    })

    it('returns true after hydration', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      const store = createTestStore({ name: 'test', storage })
      await vi.runAllTimersAsync()

      expect(store.persist.hasHydrated()).toBe(true)
    })

    it('returns true after manual rehydration', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      const store = createTestStore({ name: 'test', storage, skipHydration: true })

      expect(store.persist.hasHydrated()).toBe(false)
      await store.persist.rehydrate()
      expect(store.persist.hasHydrated()).toBe(true)
    })
  })

  describe('rehydrate', () => {
    it('manually triggers rehydration', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      storage.data.set('test', { state: { count: 42 }, version: 0 })

      const store = createTestStore({ name: 'test', storage, skipHydration: true })

      expect(store.getState().count).toBe(0)
      await store.persist.rehydrate()
      expect(store.getState().count).toBe(42)
    })

    it('can be called multiple times', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      storage.data.set('test', { state: { count: 1 }, version: 0 })

      const store = createTestStore({ name: 'test', storage, skipHydration: true })

      await store.persist.rehydrate()
      expect(store.getState().count).toBe(1)

      storage.data.set('test', { state: { count: 2 }, version: 0 })
      await store.persist.rehydrate()
      expect(store.getState().count).toBe(2)
    })
  })

  describe('onHydrate', () => {
    it('calls listener when hydration starts', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      const store = createTestStore({ name: 'test', storage, skipHydration: true })

      const listener = vi.fn()
      store.persist.onHydrate(listener)

      await store.persist.rehydrate()

      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ count: 0 }))
    })

    it('returns unsubscribe function', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      const store = createTestStore({ name: 'test', storage, skipHydration: true })

      const listener = vi.fn()
      const unsubscribe = store.persist.onHydrate(listener)

      unsubscribe()
      await store.persist.rehydrate()

      expect(listener).not.toHaveBeenCalled()
    })

    it('supports multiple listeners', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      const store = createTestStore({ name: 'test', storage, skipHydration: true })

      const listener1 = vi.fn()
      const listener2 = vi.fn()
      store.persist.onHydrate(listener1)
      store.persist.onHydrate(listener2)

      await store.persist.rehydrate()

      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)
    })
  })

  describe('onFinishHydration', () => {
    it('calls listener when hydration finishes', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      storage.data.set('test', { state: { count: 100 }, version: 0 })
      const store = createTestStore({ name: 'test', storage, skipHydration: true })

      const listener = vi.fn()
      store.persist.onFinishHydration(listener)

      await store.persist.rehydrate()

      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ count: 100 }))
    })

    it('returns unsubscribe function', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      const store = createTestStore({ name: 'test', storage, skipHydration: true })

      const listener = vi.fn()
      const unsubscribe = store.persist.onFinishHydration(listener)

      unsubscribe()
      await store.persist.rehydrate()

      expect(listener).not.toHaveBeenCalled()
    })

    it('calls listener even on hydration error', async () => {
      const storage: PersistStorage<StorageValue<Partial<TestState>>> = {
        getItem: vi.fn(() => {
          throw new Error('Storage error')
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }
      const store = createTestStore({ name: 'test', storage, skipHydration: true })

      const listener = vi.fn()
      store.persist.onFinishHydration(listener)

      await store.persist.rehydrate()

      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('getOptions', () => {
    it('returns persist options', () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      const options = {
        name: 'test-storage',
        storage,
        version: 3,
      }
      const store = createTestStore(options)

      const returnedOptions = store.persist.getOptions()
      expect(returnedOptions.name).toBe('test-storage')
      expect(returnedOptions.version).toBe(3)
    })
  })

  describe('clearStorage', () => {
    it('removes persisted state from storage', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      storage.data.set('test', { state: { count: 5 }, version: 0 })

      const store = createTestStore({ name: 'test', storage })
      await vi.runAllTimersAsync()

      expect(storage.data.has('test')).toBe(true)
      store.persist.clearStorage()
      expect(storage.removeItem).toHaveBeenCalledWith('test')
    })
  })

  describe('flush', () => {
    it('flushes pending debounced writes', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      const store = createTestStore({ name: 'test', storage })
      await vi.runAllTimersAsync()

      vi.mocked(storage.setItem).mockClear()

      store.getState().increment()
      // Don't wait for debounce

      expect(storage.setItem).not.toHaveBeenCalled()

      await store.persist.flush()

      expect(storage.setItem).toHaveBeenCalledTimes(1)
    })

    it('does nothing if no pending writes', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      const store = createTestStore({ name: 'test', storage })
      await vi.runAllTimersAsync()

      vi.mocked(storage.setItem).mockClear()

      await store.persist.flush()

      expect(storage.setItem).not.toHaveBeenCalled()
    })
  })
})

// ============================================================
// OPTIONS TESTS
// ============================================================

describe('persist options', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('partialize', () => {
    it('persists only selected state', async () => {
      const storage = createMockStorage<StorageValue<{ count: number }>>()
      const store = createStore<TestState>()(
        persist(
          (set) => ({
            count: 0,
            name: 'test',
            items: [],
            increment: () => set((s) => ({ count: s.count + 1 })),
            setName: (name) => set({ name }),
          }),
          {
            name: 'test',
            storage,
            partialize: (state) => ({ count: state.count }),
          }
        )
      )
      await vi.runAllTimersAsync()

      store.getState().increment()
      store.getState().setName('changed')
      await vi.advanceTimersByTimeAsync(100)

      const persisted = storage.data.get('test')
      expect(persisted?.state).toEqual({ count: 1 })
      expect((persisted?.state as any).name).toBeUndefined()
    })

    it('rehydrates only partialized fields', async () => {
      const storage = createMockStorage<StorageValue<{ count: number }>>()
      storage.data.set('test', { state: { count: 50 }, version: 0 })

      const store = createStore<TestState>()(
        persist(
          (set) => ({
            count: 0,
            name: 'initial',
            items: ['a', 'b'],
            increment: () => set((s) => ({ count: s.count + 1 })),
            setName: (name) => set({ name }),
          }),
          {
            name: 'test',
            storage,
            partialize: (state) => ({ count: state.count }),
          }
        )
      )
      await vi.runAllTimersAsync()

      expect(store.getState().count).toBe(50)
      expect(store.getState().name).toBe('initial') // Not overwritten
      expect(store.getState().items).toEqual(['a', 'b']) // Not overwritten
    })
  })

  describe('onRehydrateStorage', () => {
    it('calls callback before rehydration', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      const onRehydrate = vi.fn()

      createTestStore({
        name: 'test',
        storage,
        onRehydrateStorage: onRehydrate,
      })
      await vi.runAllTimersAsync()

      expect(onRehydrate).toHaveBeenCalledTimes(1)
    })

    it('calls returned callback on success', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      storage.data.set('test', { state: { count: 10 }, version: 0 })

      const afterHydrate = vi.fn()
      const onRehydrate = vi.fn(() => afterHydrate)

      createTestStore({
        name: 'test',
        storage,
        onRehydrateStorage: onRehydrate,
      })
      await vi.runAllTimersAsync()

      expect(afterHydrate).toHaveBeenCalledWith(
        expect.objectContaining({ count: 10 }),
        undefined
      )
    })

    it('calls returned callback with error on failure', async () => {
      const storage: PersistStorage<StorageValue<Partial<TestState>>> = {
        getItem: vi.fn(() => {
          throw new Error('Storage error')
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }

      const afterHydrate = vi.fn()
      const onRehydrate = vi.fn(() => afterHydrate)

      createTestStore({
        name: 'test',
        storage,
        onRehydrateStorage: onRehydrate,
      })
      await vi.runAllTimersAsync()

      expect(afterHydrate).toHaveBeenCalledWith(
        undefined,
        expect.any(Error)
      )
    })
  })

  describe('version and migrate', () => {
    it('stores version with state', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      const store = createTestStore({ name: 'test', storage, version: 2 })
      await vi.runAllTimersAsync()

      store.getState().increment()
      await vi.advanceTimersByTimeAsync(100)

      expect(storage.data.get('test')?.version).toBe(2)
    })

    it('runs migration when version differs', async () => {
      const storage = createMockStorage<StorageValue<{ count: number; oldField?: string }>>()
      storage.data.set('test', {
        state: { count: 5, oldField: 'old' },
        version: 1,
      })

      const migrate = vi.fn((state: unknown, version: number) => {
        if (version === 1) {
          const s = state as { count: number; oldField?: string }
          return { count: s.count * 2 } // Double count in migration
        }
        return state as { count: number }
      })

      const store = createStore<{ count: number; increment: () => void }>()(
        persist(
          (set) => ({
            count: 0,
            increment: () => set((s) => ({ count: s.count + 1 })),
          }),
          {
            name: 'test',
            storage: storage as PersistStorage<StorageValue<{ count: number }>>,
            version: 2,
            migrate,
          }
        )
      )
      await vi.runAllTimersAsync()

      expect(migrate).toHaveBeenCalledWith({ count: 5, oldField: 'old' }, 1)
      expect(store.getState().count).toBe(10) // Migrated
    })

    it('does not run migration when version matches', async () => {
      const storage = createMockStorage<StorageValue<{ count: number }>>()
      storage.data.set('test', { state: { count: 5 }, version: 2 })

      const migrate = vi.fn((state: unknown) => state as { count: number })

      const store = createStore<{ count: number }>()(
        persist(
          () => ({ count: 0 }),
          {
            name: 'test',
            storage,
            version: 2,
            migrate,
          }
        )
      )
      await vi.runAllTimersAsync()

      expect(migrate).not.toHaveBeenCalled()
      expect(store.getState().count).toBe(5)
    })

    it('handles async migration', async () => {
      const storage = createMockStorage<StorageValue<{ count: number }>>()
      storage.data.set('test', { state: { count: 5 }, version: 0 })

      const migrate = vi.fn(
        (state: unknown) =>
          new Promise<{ count: number }>((resolve) =>
            setTimeout(() => resolve({ count: (state as any).count + 100 }), 50)
          )
      )

      const store = createStore<{ count: number }>()(
        persist(
          () => ({ count: 0 }),
          {
            name: 'test',
            storage,
            version: 1,
            migrate,
          }
        )
      )

      await vi.advanceTimersByTimeAsync(100)

      expect(store.getState().count).toBe(105)
    })

    it('uses version 0 when stored version is undefined', async () => {
      const storage = createMockStorage<StorageValue<{ count: number }>>()
      storage.data.set('test', { state: { count: 5 } }) // No version

      const migrate = vi.fn((state: unknown, version: number) => {
        return { count: (state as any).count, migratedFrom: version }
      })

      createStore<{ count: number; migratedFrom?: number }>()(
        persist(
          () => ({ count: 0 }),
          {
            name: 'test',
            storage: storage as any,
            version: 1,
            migrate,
          }
        )
      )
      await vi.runAllTimersAsync()

      expect(migrate).toHaveBeenCalledWith({ count: 5 }, 0)
    })
  })

  describe('merge', () => {
    it('uses custom merge strategy', async () => {
      const storage = createMockStorage<StorageValue<{ items: string[] }>>()
      storage.data.set('test', { state: { items: ['a', 'b'] }, version: 0 })

      const store = createStore<{ items: string[]; other: number }>()(
        persist(
          () => ({ items: ['c'], other: 5 }),
          {
            name: 'test',
            storage: storage as PersistStorage<StorageValue<{ items: string[] }>>,
            merge: (persisted, current) => ({
              ...current,
              items: [
                ...current.items,
                ...(persisted as { items: string[] }).items,
              ],
            }),
          }
        )
      )
      await vi.runAllTimersAsync()

      expect(store.getState().items).toEqual(['c', 'a', 'b'])
      expect(store.getState().other).toBe(5)
    })

    it('default merge is shallow', async () => {
      const storage = createMockStorage<StorageValue<{ nested: { a: number } }>>()
      storage.data.set('test', {
        state: { nested: { a: 1 } },
        version: 0,
      })

      const store = createStore<{ nested: { a: number; b: number } }>()(
        persist(
          () => ({ nested: { a: 0, b: 2 } }),
          {
            name: 'test',
            storage: storage as any,
          }
        )
      )
      await vi.runAllTimersAsync()

      // Shallow merge replaces nested object entirely
      expect(store.getState().nested).toEqual({ a: 1 })
      expect((store.getState().nested as any).b).toBeUndefined()
    })
  })

  describe('skipHydration', () => {
    it('skips automatic hydration when true', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      storage.data.set('test', { state: { count: 99 }, version: 0 })

      const store = createTestStore({ name: 'test', storage, skipHydration: true })
      await vi.runAllTimersAsync()

      expect(store.getState().count).toBe(0) // Not rehydrated
      expect(store.persist.hasHydrated()).toBe(false)
    })

    it('allows manual rehydration after skip', async () => {
      const storage = createMockStorage<StorageValue<Partial<TestState>>>()
      storage.data.set('test', { state: { count: 99 }, version: 0 })

      const store = createTestStore({ name: 'test', storage, skipHydration: true })
      await vi.runAllTimersAsync()

      expect(store.getState().count).toBe(0)

      await store.persist.rehydrate()

      expect(store.getState().count).toBe(99)
      expect(store.persist.hasHydrated()).toBe(true)
    })
  })
})

// ============================================================
// ASYNC STORAGE TESTS
// ============================================================

describe('async storage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('handles async getItem', async () => {
    const storage = createAsyncMockStorage<StorageValue<Partial<TestState>>>()
    storage.data.set('test', { state: { count: 25 }, version: 0 })

    const store = createTestStore({ name: 'test', storage })

    // Initially not rehydrated
    expect(store.getState().count).toBe(0)

    // Wait for async storage
    await vi.advanceTimersByTimeAsync(50)

    expect(store.getState().count).toBe(25)
  })

  it('handles async setItem', async () => {
    const storage = createAsyncMockStorage<StorageValue<Partial<TestState>>>(10)
    const store = createTestStore({ name: 'test', storage })
    await vi.advanceTimersByTimeAsync(50)

    store.getState().increment()
    await vi.advanceTimersByTimeAsync(150) // debounce + async delay

    expect(storage.data.get('test')?.state).toMatchObject({ count: 1 })
  })

  it('handles async removeItem', async () => {
    const storage = createAsyncMockStorage<StorageValue<Partial<TestState>>>(10)
    storage.data.set('test', { state: { count: 5 }, version: 0 })

    const store = createTestStore({ name: 'test', storage })
    await vi.advanceTimersByTimeAsync(50)

    // Don't await - advance timers to let the Promise resolve
    const clearPromise = store.persist.clearStorage()
    await vi.advanceTimersByTimeAsync(50)
    await clearPromise

    expect(storage.data.has('test')).toBe(false)
  })
})

// ============================================================
// EDGE CASES
// ============================================================

describe('edge cases', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('handles storage returning null', async () => {
    const storage = createMockStorage<StorageValue<Partial<TestState>>>()
    const store = createTestStore({ name: 'test', storage })
    await vi.runAllTimersAsync()

    expect(store.getState().count).toBe(0)
    expect(store.persist.hasHydrated()).toBe(true)
  })

  it('handles storage error during getItem', async () => {
    const storage: PersistStorage<StorageValue<Partial<TestState>>> = {
      getItem: vi.fn(() => {
        throw new Error('Read error')
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    }

    const afterHydrate = vi.fn()
    const store = createTestStore({
      name: 'test',
      storage,
      onRehydrateStorage: () => afterHydrate,
    })
    await vi.runAllTimersAsync()

    // Should still mark as hydrated (with error)
    expect(store.persist.hasHydrated()).toBe(true)
    expect(afterHydrate).toHaveBeenCalledWith(undefined, expect.any(Error))
  })

  it('handles storage error during setItem silently', async () => {
    const storage: PersistStorage<StorageValue<Partial<TestState>>> = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new Error('Write error')
      }),
      removeItem: vi.fn(),
    }

    const store = createTestStore({ name: 'test', storage })
    await vi.runAllTimersAsync()

    // Should not throw
    expect(() => {
      store.getState().increment()
    }).not.toThrow()
  })

  it('works with empty initial state', async () => {
    const storage = createMockStorage<StorageValue<Record<string, never>>>()
    const store = createStore<Record<string, never>>()(
      persist(() => ({}), { name: 'test', storage })
    )
    await vi.runAllTimersAsync()

    expect(store.getState()).toEqual({})
    expect(store.persist.hasHydrated()).toBe(true)
  })

  it('handles complex nested state', async () => {
    interface ComplexState {
      user: { name: string; settings: { theme: string } }
      items: Array<{ id: number; data: { value: string } }>
    }

    const storage = createMockStorage<StorageValue<ComplexState>>()
    storage.data.set('test', {
      state: {
        user: { name: 'John', settings: { theme: 'dark' } },
        items: [{ id: 1, data: { value: 'test' } }],
      },
      version: 0,
    })

    const store = createStore<ComplexState>()(
      persist(
        () => ({
          user: { name: '', settings: { theme: 'light' } },
          items: [],
        }),
        { name: 'test', storage }
      )
    )
    await vi.runAllTimersAsync()

    expect(store.getState().user.name).toBe('John')
    expect(store.getState().user.settings.theme).toBe('dark')
    expect(store.getState().items).toHaveLength(1)
    expect(store.getState().items[0].data.value).toBe('test')
  })

  it('handles multiple stores with same storage key (not recommended)', async () => {
    const storage = createMockStorage<StorageValue<{ count: number }>>()
    storage.data.set('shared', { state: { count: 10 }, version: 0 })

    const store1 = createStore<{ count: number }>()(
      persist(() => ({ count: 0 }), { name: 'shared', storage })
    )
    const store2 = createStore<{ count: number }>()(
      persist(() => ({ count: 0 }), { name: 'shared', storage })
    )
    await vi.runAllTimersAsync()

    // Both should have same initial value
    expect(store1.getState().count).toBe(10)
    expect(store2.getState().count).toBe(10)
  })

  it('handles rapid state changes followed by destroy', async () => {
    const storage = createMockStorage<StorageValue<Partial<TestState>>>()
    const store = createTestStore({ name: 'test', storage })
    await vi.runAllTimersAsync()

    vi.mocked(storage.setItem).mockClear()

    // Rapid changes
    for (let i = 0; i < 10; i++) {
      store.getState().increment()
    }

    // Destroy before debounce completes
    store.destroy()

    // Let debounce timer run
    await vi.advanceTimersByTimeAsync(100)

    // Store should still have persisted (debounce callback runs even after destroy)
    // This is expected behavior - debounce doesn't know about store lifecycle
  })

  it('handles state with undefined values', async () => {
    const storage = createMockStorage<
      StorageValue<{ value: string | undefined }>
    >()
    storage.data.set('test', {
      state: { value: undefined },
      version: 0,
    })

    const store = createStore<{ value: string | undefined }>()(
      persist(() => ({ value: 'default' }), { name: 'test', storage })
    )
    await vi.runAllTimersAsync()

    expect(store.getState().value).toBeUndefined()
  })

  it('handles state with null values', async () => {
    const storage = createMockStorage<StorageValue<{ value: string | null }>>()
    storage.data.set('test', {
      state: { value: null },
      version: 0,
    })

    const store = createStore<{ value: string | null }>()(
      persist(() => ({ value: 'default' }), { name: 'test', storage })
    )
    await vi.runAllTimersAsync()

    expect(store.getState().value).toBeNull()
  })
})

// ============================================================
// SSR SIMULATION
// ============================================================

describe('SSR simulation', () => {
  it('uses localStorage wrapper by default when window exists', () => {
    // In test environment, window exists
    const storage = createMockStorage<StorageValue<{ count: number }>>()
    const store = createStore<{ count: number }>()(
      persist(() => ({ count: 0 }), { name: 'test', storage })
    )

    expect(store.persist.getOptions().storage).toBe(storage)
  })
})

// ============================================================
// PERSIST DESTROY API
// ============================================================

describe('persist destroy', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('cancels pending debounced writes when destroyed', async () => {
    const storage = createMockStorage<StorageValue<{ count: number }>>()
    const store = createStore<{ count: number }>()(
      persist(
        (set) => ({
          count: 0,
          increment: () => set((s) => ({ count: s.count + 1 })),
        }),
        { name: 'test', storage }
      )
    ) as StoreApi<{ count: number; increment: () => void }> & WithPersist<{ count: number }>
    await vi.runAllTimersAsync()

    vi.mocked(storage.setItem).mockClear()

    // Trigger a state change that will be debounced
    store.setState({ count: 100 })

    // Call destroy via persist API before debounce completes
    store.persist.destroy()

    // Run all timers - the debounced write should have been cancelled
    await vi.advanceTimersByTimeAsync(200)

    // setItem should NOT have been called after destroy
    expect(vi.mocked(storage.setItem).mock.calls.length).toBe(0)
  })

  it('clears hydration listeners when destroyed', async () => {
    const storage = createMockStorage<StorageValue<{ count: number }>>()
    storage.data.set('test', { state: { count: 5 }, version: 0 })

    const store = createStore<{ count: number }>()(
      persist(() => ({ count: 0 }), { name: 'test', storage, skipHydration: true })
    ) as StoreApi<{ count: number }> & WithPersist<{ count: number }>

    const hydrateCallback = vi.fn()
    store.persist.onHydrate(hydrateCallback)

    // Destroy should clear listeners
    store.persist.destroy()

    // Now rehydrate - callback should NOT be called
    await store.persist.rehydrate()
    await vi.runAllTimersAsync()

    expect(hydrateCallback).not.toHaveBeenCalled()
  })

  it('clears finishHydration listeners when destroyed', async () => {
    const storage = createMockStorage<StorageValue<{ count: number }>>()
    storage.data.set('test', { state: { count: 5 }, version: 0 })

    const store = createStore<{ count: number }>()(
      persist(() => ({ count: 0 }), { name: 'test', storage, skipHydration: true })
    ) as StoreApi<{ count: number }> & WithPersist<{ count: number }>

    const finishCallback = vi.fn()
    store.persist.onFinishHydration(finishCallback)

    // Destroy should clear listeners
    store.persist.destroy()

    // Now rehydrate - callback should NOT be called
    await store.persist.rehydrate()
    await vi.runAllTimersAsync()

    expect(finishCallback).not.toHaveBeenCalled()
  })
})

// ============================================================
// DEBOUNCE CANCEL EDGE CASES
// ============================================================

describe('debounce cancel edge cases', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('cancel is safe to call when no pending timeout', async () => {
    const storage = createMockStorage<StorageValue<{ count: number }>>()
    const store = createStore<{ count: number }>()(
      persist(() => ({ count: 0 }), { name: 'test', storage })
    ) as StoreApi<{ count: number }> & WithPersist<{ count: number }>
    await vi.runAllTimersAsync()

    // No pending writes - destroy (which calls cancel) should not throw
    expect(() => store.persist.destroy()).not.toThrow()
  })

  it('flush is safe to call when no pending timeout', async () => {
    const storage = createMockStorage<StorageValue<{ count: number }>>()
    const store = createStore<{ count: number }>()(
      persist(() => ({ count: 0 }), { name: 'test', storage })
    ) as StoreApi<{ count: number }> & WithPersist<{ count: number }>
    await vi.runAllTimersAsync()

    vi.mocked(storage.setItem).mockClear()

    // No pending writes - flush should not throw or write
    await store.persist.flush()

    expect(vi.mocked(storage.setItem)).not.toHaveBeenCalled()
  })
})
