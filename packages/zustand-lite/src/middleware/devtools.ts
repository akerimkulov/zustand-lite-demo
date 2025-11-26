/**
 * Redux DevTools middleware for zustand-lite.
 *
 * Integrates with Redux DevTools browser extension for debugging.
 * Follows Graceful Degradation - works without the extension installed.
 *
 * @module middleware/devtools
 */

import type {
  StateCreator,
  StoreApi,
  StoreMutatorIdentifier,
} from '../types'

// ============================================================
// TYPES
// ============================================================

/**
 * Redux DevTools Extension interface.
 */
interface ReduxDevToolsExtension {
  connect: (options?: DevtoolsOptions) => ReduxDevToolsConnection
  disconnect: () => void
}

/**
 * Redux DevTools Connection interface.
 */
interface ReduxDevToolsConnection {
  init: (state: unknown) => void
  send: (action: { type: string; payload?: unknown }, state: unknown) => void
  subscribe: (
    listener: (message: { type: string; state?: string; payload?: { type: string } }) => void
  ) => (() => void) | undefined
  unsubscribe: () => void
  error: (message: string) => void
}

/**
 * DevTools configuration options.
 */
export interface DevtoolsOptions {
  /** Name shown in DevTools */
  name?: string

  /** Enable/disable DevTools (defaults to true in development) */
  enabled?: boolean

  /** Action type for anonymous state changes */
  anonymousActionType?: string

  /** Custom serialization options */
  serialize?:
    | boolean
    | {
        options?:
          | boolean
          | {
              date?: boolean
              regex?: boolean
              undefined?: boolean
              nan?: boolean
              infinity?: boolean
              error?: boolean
              symbol?: boolean
              map?: boolean
              set?: boolean
            }
      }

  /** Max number of actions to keep in history */
  maxAge?: number

  /** Latency for batching actions (ms) */
  latency?: number

  /** Pre-action state transformer */
  stateSanitizer?: (state: unknown) => unknown

  /** Action transformer */
  actionSanitizer?: (action: { type: string; payload?: unknown }) => { type: string; payload?: unknown }
}

/**
 * API added to store by devtools middleware.
 */
export interface DevtoolsApi {
  devtools: {
    /** Send a named action to DevTools */
    send: (actionType: string, payload?: unknown) => void
    /** Check if DevTools is connected */
    isConnected: () => boolean
    /** Disconnect from DevTools and cleanup subscriptions */
    disconnect: () => void
  }
}

// Register mutator type
declare module '../types' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface StoreMutators<S, A> {
    'zustand-lite/devtools': S & DevtoolsApi
  }
}

// ============================================================
// CONSTANTS
// ============================================================

/** Default maximum number of actions to keep in DevTools history */
const DEFAULT_MAX_AGE = 50

/** Default latency for batching actions (ms) */
const DEFAULT_LATENCY = 500

// ============================================================
// HELPERS
// ============================================================

/**
 * Get Redux DevTools Extension from window.
 */
const getExtension = (): ReduxDevToolsExtension | undefined => {
  if (typeof window === 'undefined') return undefined
  return (window as { __REDUX_DEVTOOLS_EXTENSION__?: ReduxDevToolsExtension })
    .__REDUX_DEVTOOLS_EXTENSION__
}

// ============================================================
// MIDDLEWARE IMPLEMENTATION
// ============================================================

type Devtools = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initializer: StateCreator<T, [...Mps, ['zustand-lite/devtools', never]], Mcs>,
  options?: DevtoolsOptions
) => StateCreator<T, Mps, [['zustand-lite/devtools', never], ...Mcs]>

type DevtoolsImpl = <T>(
  initializer: StateCreator<T, [], []>,
  options?: DevtoolsOptions
) => StateCreator<T, [], []>

/**
 * Devtools middleware implementation.
 */
const devtoolsImpl: DevtoolsImpl = (initializer, options = {}) => (set, get, api) => {
  const {
    name = 'zustand-lite',
    enabled = process.env['NODE_ENV'] !== 'production',
    anonymousActionType = 'anonymous',
    maxAge = DEFAULT_MAX_AGE,
    latency = DEFAULT_LATENCY,
    stateSanitizer,
    actionSanitizer,
  } = options

  // Get extension
  const extension = enabled ? getExtension() : undefined

  // If no extension or disabled, just run initializer
  if (!extension) {
    const devtoolsApi: DevtoolsApi = {
      devtools: {
        send: () => {
          // No-op when DevTools not available
        },
        isConnected: () => false,
        disconnect: () => {
          // No-op when DevTools not available
        },
      },
    }

    const storeWithDevtools = api as StoreApi<unknown> & DevtoolsApi
    Object.assign(storeWithDevtools, devtoolsApi)

    return initializer(set, get, api)
  }

  // Connect to DevTools
  // Spread options first so explicit values take precedence
  const devtools = extension.connect({
    ...options,
    name,
    maxAge,
    latency,
  })

  let isInitialized = false
  let isUpdatingFromDevtools = false

  /**
   * Send action to DevTools.
   */
  const sendAction = (actionType: string, payload?: unknown): void => {
    if (isUpdatingFromDevtools) return

    let action: { type: string; payload?: unknown } = { type: actionType, payload }
    if (actionSanitizer) {
      action = actionSanitizer(action)
    }

    let state = get()
    if (stateSanitizer) {
      state = stateSanitizer(state) as typeof state
    }

    devtools.send(action as { type: string; payload: unknown }, state)
  }

  // Track unsubscribe function for cleanup
  let devtoolsUnsubscribe: (() => void) | undefined

  // DevTools API
  const devtoolsApi: DevtoolsApi = {
    devtools: {
      send: sendAction,
      isConnected: () => true,
      disconnect: () => {
        // Unsubscribe from DevTools messages
        devtoolsUnsubscribe?.()
        // Disconnect from DevTools extension
        devtools.unsubscribe()
        // Restore original setState to prevent memory leaks
        api.setState = originalSetState
      },
    },
  }

  // Attach to store
  const storeWithDevtools = api as StoreApi<unknown> & DevtoolsApi
  Object.assign(storeWithDevtools, devtoolsApi)

  // Wrap setState to track actions
  const originalSetState = api.setState.bind(api)
  api.setState = ((partial: unknown, replace?: boolean) => {
    if (replace === true) {
      const setStateReplace = originalSetState as (state: unknown, replace: true) => void
      setStateReplace(partial, true)
    } else {
      const setStatePartial = originalSetState as (partial: unknown, replace?: false) => void
      setStatePartial(partial, replace as false | undefined)
    }

    if (!isUpdatingFromDevtools) {
      // Use anonymousActionType for all unnamed setState calls
      sendAction(anonymousActionType)
    }
  }) as typeof api.setState

  // Subscribe to DevTools messages (time-travel, etc.)
  // Store unsubscribe to prevent memory leaks
  devtoolsUnsubscribe = devtools.subscribe((message) => {
    // Handle DISPATCH messages (time travel, reset, etc.)
    if (message.type === 'DISPATCH') {
      switch (message.payload?.type) {
        case 'RESET':
          // Reset to initial state
          originalSetState(api.getInitialState() as never, true)
          devtools.init(api.getState())
          break

        case 'COMMIT':
          // Commit current state
          devtools.init(api.getState())
          break

        case 'ROLLBACK':
          // Rollback to previous state
          if (message.state) {
            try {
              isUpdatingFromDevtools = true
              const state = JSON.parse(message.state)
              originalSetState(state, true)
            } catch (error) {
              devtools.error(`Failed to parse state: ${error instanceof Error ? error.message : 'Unknown error'}`)
            } finally {
              isUpdatingFromDevtools = false
            }
          }
          break

        case 'JUMP_TO_STATE':
        case 'JUMP_TO_ACTION':
          // Jump to specific state
          if (message.state) {
            try {
              isUpdatingFromDevtools = true
              const state = JSON.parse(message.state)
              originalSetState(state, true)
            } catch (error) {
              devtools.error(`Failed to parse state: ${error instanceof Error ? error.message : 'Unknown error'}`)
            } finally {
              isUpdatingFromDevtools = false
            }
          }
          break
      }
    }
  })

  // Initialize state
  const initialState = initializer(set, get, api)

  // Send initial state to DevTools
  if (!isInitialized) {
    isInitialized = true
    let state = get()
    if (stateSanitizer) {
      state = stateSanitizer(state) as typeof state
    }
    devtools.init(state)
  }

  return initialState
}

/**
 * Redux DevTools middleware.
 *
 * Enables debugging with Redux DevTools browser extension.
 *
 * @example
 * const useStore = create(
 *   devtools(
 *     (set) => ({
 *       count: 0,
 *       increment: () => set((s) => ({ count: s.count + 1 })),
 *     }),
 *     { name: 'CounterStore' }
 *   )
 * )
 *
 * @example
 * // Sending named actions
 * const useStore = create(
 *   devtools((set, get, api) => ({
 *     count: 0,
 *     increment: () => {
 *       set((s) => ({ count: s.count + 1 }))
 *       api.devtools.send('increment', { amount: 1 })
 *     },
 *   }))
 * )
 */
export const devtools = devtoolsImpl as unknown as Devtools

export type { Devtools }
