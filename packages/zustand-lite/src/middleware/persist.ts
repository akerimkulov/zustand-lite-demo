/**
 * Persist middleware for zustand-lite.
 *
 * Automatically persists store state to storage (localStorage, sessionStorage, etc.).
 * Follows Dependency Inversion Principle - depends on Storage interface, not implementation.
 *
 * @module middleware/persist
 */

import type {
  StateCreator,
  StoreApi,
  StoreMutatorIdentifier,
} from '../types'

// ============================================================
// CONSTANTS
// ============================================================

/** Default debounce time for storage writes (ms) */
const DEFAULT_DEBOUNCE_MS = 100

// ============================================================
// TYPES
// ============================================================

/**
 * Storage interface for persistence.
 * Any storage that implements this interface can be used.
 * (Dependency Inversion Principle)
 *
 * @template T - Type of stored value
 */
export interface PersistStorage<T> {
  getItem: (name: string) => T | null | Promise<T | null>
  setItem: (name: string, value: T) => void | Promise<void>
  removeItem: (name: string) => void | Promise<void>
}

/**
 * Value stored in persistence.
 *
 * @template T - State type
 */
export interface StorageValue<T> {
  state: T
  version?: number
}

/**
 * Configuration options for persist middleware.
 *
 * @template T - Full state type
 * @template PersistedState - Persisted state type (may be partial)
 */
export interface PersistOptions<T, PersistedState = T> {
  /** Unique name for storage key */
  name: string

  /**
   * Storage implementation.
   * Defaults to localStorage wrapper.
   */
  storage?: PersistStorage<StorageValue<PersistedState>>

  /**
   * Filter which parts of state to persist.
   * Useful for excluding transient state like loading flags.
   *
   * @example
   * partialize: (state) => ({ items: state.items }) // Only persist items
   */
  partialize?: (state: T) => PersistedState

  /**
   * Called when rehydration starts.
   * Returns callback for when rehydration finishes.
   */
  onRehydrateStorage?: (
    state: T
  ) => ((state?: T, error?: Error) => void) | void

  /** State version for migrations */
  version?: number

  /**
   * Migration function for version changes.
   *
   * @example
   * migrate: (persisted, version) => {
   *   if (version === 0) {
   *     return { ...persisted, newField: 'default' }
   *   }
   *   return persisted
   * }
   */
  migrate?: (
    persistedState: unknown,
    version: number
  ) => PersistedState | Promise<PersistedState>

  /**
   * Custom merge strategy for rehydration.
   * Defaults to shallow merge.
   */
  merge?: (persistedState: unknown, currentState: T) => T

  /**
   * Skip automatic hydration.
   * Useful for SSR - call rehydrate() manually on client.
   */
  skipHydration?: boolean

  /**
   * Debounce time for storage writes (ms).
   * Prevents excessive writes on rapid state changes.
   * @default 100
   */
  debounceMs?: number
}

/**
 * API added to store by persist middleware.
 */
export interface PersistApi<T> {
  persist: {
    /** Manually trigger rehydration */
    rehydrate: () => Promise<void>
    /** Check if hydration is complete */
    hasHydrated: () => boolean
    /** Subscribe to hydration completion */
    onFinishHydration: (fn: (state: T) => void) => () => void
    /** Subscribe to hydration start */
    onHydrate: (fn: (state: T) => void) => () => void
    /** Get persisted options */
    getOptions: () => PersistOptions<T>
    /** Clear persisted state */
    clearStorage: () => void | Promise<void>
    /** Force sync to storage */
    flush: () => Promise<void>
    /** Cleanup subscriptions and pending operations */
    destroy: () => void
  }
}

// Register mutator type
declare module '../types' {
  interface StoreMutators<S, A> {
    'zustand-lite/persist': S & PersistApi<A>
  }
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Creates a JSON storage wrapper for Web Storage API.
 *
 * @param getStorage - Function returning storage (localStorage, sessionStorage)
 * @returns PersistStorage implementation
 */
export function createJSONStorage<T>(
  getStorage: () => Storage | undefined
): PersistStorage<T> {
  return {
    getItem: (name) => {
      try {
        const storage = getStorage()
        if (!storage) return null

        const str = storage.getItem(name)
        return str ? (JSON.parse(str) as T) : null
      } catch {
        return null
      }
    },
    setItem: (name, value) => {
      try {
        const storage = getStorage()
        storage?.setItem(name, JSON.stringify(value))
      } catch {
        // Ignore storage errors (quota exceeded, etc.)
      }
    },
    removeItem: (name) => {
      try {
        const storage = getStorage()
        storage?.removeItem(name)
      } catch {
        // Ignore storage errors
      }
    },
  }
}

/**
 * Debounce function to prevent excessive storage writes.
 * Optimized to use lastArgs in timeout for consistency.
 */
function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number
): T & { cancel: () => void; flush: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let lastArgs: unknown[] | null = null

  const debounced = ((...args: unknown[]) => {
    lastArgs = args
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      if (lastArgs) {
        fn(...lastArgs)
        lastArgs = null
      }
      timeoutId = null
    }, ms)
  }) as T & { cancel: () => void; flush: () => void }

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    lastArgs = null
  }

  debounced.flush = () => {
    if (lastArgs) {
      if (timeoutId) clearTimeout(timeoutId)
      fn(...lastArgs)
      lastArgs = null
      timeoutId = null
    }
  }

  return debounced
}

// ============================================================
// MIDDLEWARE IMPLEMENTATION
// ============================================================

type Persist = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
  PersistedState = T,
>(
  initializer: StateCreator<T, [...Mps, ['zustand-lite/persist', T]], Mcs>,
  options: PersistOptions<T, PersistedState>
) => StateCreator<T, Mps, [['zustand-lite/persist', T], ...Mcs]>

type PersistImpl = <T, PersistedState = T>(
  initializer: StateCreator<T, [], []>,
  options: PersistOptions<T, PersistedState>
) => StateCreator<T, [], []>

/**
 * Persist middleware implementation.
 */
const persistImpl: PersistImpl = (initializer, options) => (set, get, api) => {
  type State = ReturnType<typeof get>

  const {
    name,
    storage = createJSONStorage<StorageValue<State>>(() =>
      typeof window !== 'undefined' ? localStorage : undefined
    ) as PersistStorage<StorageValue<unknown>>,
    partialize = (state: State) => state as unknown,
    onRehydrateStorage,
    version = 0,
    migrate,
    merge = (persistedState, currentState) => ({
      ...currentState,
      ...(persistedState !== null && typeof persistedState === 'object'
        ? persistedState
        : {}),
    }),
    skipHydration = false,
    debounceMs = DEFAULT_DEBOUNCE_MS,
  } = options as PersistOptions<State, unknown>

  // Hydration state
  let hasHydrated = false
  const hydrateListeners = new Set<(state: unknown) => void>()
  const finishHydrationListeners = new Set<(state: unknown) => void>()

  // Debounced persist function
  const debouncedSetItem = debounce(
    (state: unknown) => {
      const persistedValue: StorageValue<unknown> = {
        state: partialize(state as State),
        version,
      }
      void storage.setItem(name, persistedValue as StorageValue<unknown>)
    },
    debounceMs
  )

  /**
   * Rehydrate state from storage.
   */
  const rehydrate = async (): Promise<void> => {
    // Notify hydration start
    hydrateListeners.forEach((fn) => fn(get()))

    const onRehydrateCallback = onRehydrateStorage?.(get())

    try {
      const storedValue = await storage.getItem(name)

      if (storedValue) {
        let persistedState = storedValue.state

        // Run migration if version changed
        if (storedValue.version !== version && migrate) {
          persistedState = await migrate(
            persistedState,
            storedValue.version ?? 0
          )
        }

        // Merge persisted state with current state
        const mergedState = merge(persistedState, get())
        set(mergedState as never, true)
      }

      onRehydrateCallback?.(get(), undefined)
    } catch (error) {
      onRehydrateCallback?.(undefined, error as Error)
    } finally {
      hasHydrated = true
      finishHydrationListeners.forEach((fn) => fn(get()))
    }
  }

  // Track unsubscribe function (will be set after subscription)
  let storeUnsubscribe: (() => void) | null = null

  // Persist API
  const persistApi: PersistApi<unknown>['persist'] = {
    rehydrate: async () => {
      await rehydrate()
    },
    hasHydrated: () => hasHydrated,
    onFinishHydration: (fn) => {
      finishHydrationListeners.add(fn)
      return () => finishHydrationListeners.delete(fn)
    },
    onHydrate: (fn) => {
      hydrateListeners.add(fn)
      return () => hydrateListeners.delete(fn)
    },
    getOptions: () => options as PersistOptions<unknown>,
    clearStorage: () => Promise.resolve(storage.removeItem(name)),
    flush: async () => {
      debouncedSetItem.flush()
    },
    destroy: () => {
      // Cancel pending debounced writes
      debouncedSetItem.cancel()
      // Unsubscribe from state changes
      storeUnsubscribe?.()
      // Clear hydration listeners
      hydrateListeners.clear()
      finishHydrationListeners.clear()
    },
  }

  // Attach persist API to store
  const storeWithPersist = api as StoreApi<unknown> & PersistApi<unknown>
  storeWithPersist.persist = persistApi

  // Subscribe to state changes and persist
  // Store unsubscribe to prevent memory leaks
  storeUnsubscribe = api.subscribe((state) => {
    if (hasHydrated) {
      debouncedSetItem(state)
    }
  })

  // Initialize state
  const initialState = initializer(set, get, api)

  // Auto-rehydrate unless skipped
  // Use queueMicrotask to ensure state is fully initialized before rehydration
  if (!skipHydration) {
    queueMicrotask(() => {
      void rehydrate()
    })
  }

  return initialState
}

/**
 * Persist middleware.
 *
 * Automatically saves and restores store state to/from storage.
 *
 * @example
 * const useStore = create(
 *   persist(
 *     (set) => ({
 *       count: 0,
 *       increment: () => set((s) => ({ count: s.count + 1 })),
 *     }),
 *     { name: 'counter-storage' }
 *   )
 * )
 *
 * @example
 * // With SSR (Next.js)
 * const useStore = create(
 *   persist(
 *     (set) => ({ ... }),
 *     { name: 'storage', skipHydration: true }
 *   )
 * )
 *
 * // In client component
 * useEffect(() => {
 *   useStore.persist.rehydrate()
 * }, [])
 */
export const persist = persistImpl as unknown as Persist

export type { Persist }
