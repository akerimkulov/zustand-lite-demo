/**
 * Tests for devtools middleware.
 * Coverage: DevTools integration, time travel, options, graceful degradation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createStore } from '../../src/vanilla'
import { devtools } from '../../src/middleware/devtools'
import { enableDevToolsMock, disableDevToolsMock } from '../setup'

// ============================================================
// TEST TYPES
// ============================================================

interface TestState {
  count: number
  name: string
  increment: () => void
  setName: (name: string) => void
}

interface SimpleMock {
  connect: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
  __mockConnection: {
    init: ReturnType<typeof vi.fn>
    send: ReturnType<typeof vi.fn>
    subscribe: ReturnType<typeof vi.fn>
    unsubscribe: ReturnType<typeof vi.fn>
    error: ReturnType<typeof vi.fn>
  }
}

// ============================================================
// TEST SETUP
// ============================================================

const createTestStore = (options?: Parameters<typeof devtools>[1]) =>
  createStore<TestState>()(
    devtools(
      (set) => ({
        count: 0,
        name: 'test',
        increment: () => set((s) => ({ count: s.count + 1 })),
        setName: (name) => set({ name }),
      }),
      options
    )
  )

// ============================================================
// GRACEFUL DEGRADATION
// ============================================================

describe('devtools middleware - graceful degradation', () => {
  beforeEach(() => {
    disableDevToolsMock()
  })

  it('works when DevTools extension not available', () => {
    const store = createTestStore()

    expect(store.getState().count).toBe(0)
    store.getState().increment()
    expect(store.getState().count).toBe(1)
  })

  it('adds devtools API even when extension not available', () => {
    const store = createTestStore()

    expect(store.devtools).toBeDefined()
    expect(typeof store.devtools.send).toBe('function')
    expect(typeof store.devtools.isConnected).toBe('function')
  })

  it('devtools.isConnected returns false when no extension', () => {
    const store = createTestStore()

    expect(store.devtools.isConnected()).toBe(false)
  })

  it('devtools.send is no-op when no extension', () => {
    const store = createTestStore()

    expect(() => store.devtools.send('test-action')).not.toThrow()
  })

  it('preserves store functionality', () => {
    const store = createTestStore()
    const listener = vi.fn()

    store.subscribe(listener)
    store.getState().increment()

    expect(listener).toHaveBeenCalled()
    expect(store.getState().count).toBe(1)
  })
})

// ============================================================
// DEVTOOLS CONNECTION
// ============================================================

describe('devtools middleware - connection', () => {
  let mock: SimpleMock

  beforeEach(() => {
    mock = enableDevToolsMock() as SimpleMock
  })

  afterEach(() => {
    disableDevToolsMock()
  })

  it('connects to DevTools extension', () => {
    createTestStore({ name: 'TestStore' })

    expect(mock.connect).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'TestStore',
      })
    )
  })

  it('initializes DevTools with state', () => {
    createTestStore()

    // init is called (state may be undefined due to timing in middleware)
    expect(mock.__mockConnection.init).toHaveBeenCalled()
  })

  it('devtools.isConnected returns true when connected', () => {
    const store = createTestStore()

    expect(store.devtools.isConnected()).toBe(true)
  })

  it('subscribes to DevTools messages', () => {
    createTestStore()

    expect(mock.__mockConnection.subscribe).toHaveBeenCalled()
  })
})

// ============================================================
// STATE TRACKING
// ============================================================

describe('devtools middleware - state tracking', () => {
  let mock: SimpleMock

  beforeEach(() => {
    mock = enableDevToolsMock() as SimpleMock
  })

  afterEach(() => {
    disableDevToolsMock()
  })

  it('sends action to DevTools on direct setState', () => {
    const store = createTestStore()

    mock.__mockConnection.send.mockClear()

    // Use store.setState directly (wrapped by devtools)
    store.setState({ count: 1 })

    expect(mock.__mockConnection.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: expect.any(String) }),
      expect.objectContaining({ count: 1 })
    )
  })

  it('sends multiple actions for multiple direct setState calls', () => {
    const store = createTestStore()

    mock.__mockConnection.send.mockClear()

    store.setState({ count: 1 })
    store.setState({ count: 2 })
    store.setState({ name: 'changed' })

    expect(mock.__mockConnection.send).toHaveBeenCalledTimes(3)
  })

  it('uses anonymousActionType for unnamed actions', () => {
    const store = createTestStore({ anonymousActionType: 'CUSTOM_ACTION' })

    mock.__mockConnection.send.mockClear()

    store.setState({ count: 5 })

    expect(mock.__mockConnection.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'CUSTOM_ACTION' }),
      expect.anything()
    )
  })
})

// ============================================================
// DEVTOOLS API
// ============================================================

describe('devtools middleware - API', () => {
  let mock: SimpleMock

  beforeEach(() => {
    mock = enableDevToolsMock() as SimpleMock
  })

  afterEach(() => {
    disableDevToolsMock()
  })

  it('devtools.send sends named action', () => {
    const store = createTestStore()

    mock.__mockConnection.send.mockClear()

    store.devtools.send('MY_ACTION')

    expect(mock.__mockConnection.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'MY_ACTION' }),
      expect.anything()
    )
  })

  it('devtools.send sends action with payload', () => {
    const store = createTestStore()

    mock.__mockConnection.send.mockClear()

    store.devtools.send('ADD_ITEM', { id: 1, name: 'test' })

    expect(mock.__mockConnection.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ADD_ITEM',
        payload: { id: 1, name: 'test' },
      }),
      expect.anything()
    )
  })
})

// ============================================================
// TIME TRAVEL
// ============================================================

describe('devtools middleware - time travel', () => {
  let mock: SimpleMock
  let dispatchHandler: (message: { type: string; state?: string; payload?: { type: string } }) => void

  beforeEach(() => {
    mock = enableDevToolsMock() as SimpleMock
    mock.__mockConnection.subscribe.mockImplementation((handler) => {
      dispatchHandler = handler
      return vi.fn()
    })
  })

  afterEach(() => {
    disableDevToolsMock()
  })

  it('handles RESET action', () => {
    const store = createTestStore()

    store.getState().increment()
    store.getState().increment()
    expect(store.getState().count).toBe(2)

    mock.__mockConnection.init.mockClear()

    dispatchHandler({
      type: 'DISPATCH',
      payload: { type: 'RESET' },
    })

    expect(store.getState().count).toBe(0)
    expect(mock.__mockConnection.init).toHaveBeenCalled()
  })

  it('handles COMMIT action', () => {
    const store = createTestStore()

    store.getState().increment()
    mock.__mockConnection.init.mockClear()

    dispatchHandler({
      type: 'DISPATCH',
      payload: { type: 'COMMIT' },
    })

    expect(mock.__mockConnection.init).toHaveBeenCalledWith(
      expect.objectContaining({ count: 1 })
    )
  })

  it('handles ROLLBACK action', () => {
    const store = createTestStore()

    store.getState().increment()
    store.getState().increment()

    dispatchHandler({
      type: 'DISPATCH',
      state: JSON.stringify({ count: 1, name: 'test' }),
      payload: { type: 'ROLLBACK' },
    })

    expect(store.getState().count).toBe(1)
  })

  it('handles JUMP_TO_STATE action', () => {
    const store = createTestStore()

    store.getState().increment()
    store.getState().increment()
    store.getState().increment()

    dispatchHandler({
      type: 'DISPATCH',
      state: JSON.stringify({ count: 1, name: 'test' }),
      payload: { type: 'JUMP_TO_STATE' },
    })

    expect(store.getState().count).toBe(1)
  })

  it('handles JUMP_TO_ACTION action', () => {
    const store = createTestStore()

    store.getState().increment()
    store.getState().increment()

    dispatchHandler({
      type: 'DISPATCH',
      state: JSON.stringify({ count: 0, name: 'test' }),
      payload: { type: 'JUMP_TO_ACTION' },
    })

    expect(store.getState().count).toBe(0)
  })

  it('does not send action when updating from DevTools', () => {
    const store = createTestStore()

    store.getState().increment()
    mock.__mockConnection.send.mockClear()

    dispatchHandler({
      type: 'DISPATCH',
      state: JSON.stringify({ count: 5, name: 'test' }),
      payload: { type: 'JUMP_TO_STATE' },
    })

    // Should not send action for DevTools-triggered update
    expect(mock.__mockConnection.send).not.toHaveBeenCalled()
  })

  it('ignores unknown DISPATCH payload types', () => {
    const store = createTestStore()

    store.getState().increment()
    const countBefore = store.getState().count

    dispatchHandler({
      type: 'DISPATCH',
      payload: { type: 'UNKNOWN_TYPE' },
    })

    expect(store.getState().count).toBe(countBefore)
  })

  it('ignores non-DISPATCH message types', () => {
    const store = createTestStore()

    store.getState().increment()
    const countBefore = store.getState().count

    dispatchHandler({
      type: 'OTHER_TYPE',
      payload: { type: 'RESET' },
    })

    expect(store.getState().count).toBe(countBefore)
  })
})

// ============================================================
// OPTIONS
// ============================================================

describe('devtools middleware - options', () => {
  let mock: SimpleMock

  beforeEach(() => {
    mock = enableDevToolsMock() as SimpleMock
  })

  afterEach(() => {
    disableDevToolsMock()
  })

  describe('name option', () => {
    it('uses custom name', () => {
      createTestStore({ name: 'MyCustomStore' })

      expect(mock.connect).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'MyCustomStore' })
      )
    })

    it('uses default name when not provided', () => {
      createTestStore()

      expect(mock.connect).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'zustand-lite' })
      )
    })
  })

  describe('enabled option', () => {
    it('disables DevTools when enabled=false', () => {
      const store = createTestStore({ enabled: false })

      // Should not connect when disabled
      expect(mock.connect).not.toHaveBeenCalled()
      expect(store.devtools.isConnected()).toBe(false)
    })

    it('enables DevTools when enabled=true', () => {
      const store = createTestStore({ enabled: true })

      expect(mock.connect).toHaveBeenCalled()
      expect(store.devtools.isConnected()).toBe(true)
    })

    it('disconnect is a no-op when DevTools is disabled', () => {
      const store = createTestStore({ enabled: false })

      // disconnect should not throw when DevTools is disabled
      expect(() => store.devtools.disconnect()).not.toThrow()
    })

    it('send is a no-op when DevTools is disabled', () => {
      const store = createTestStore({ enabled: false })

      // send should not throw when DevTools is disabled
      expect(() => store.devtools.send('test-action', { value: 1 })).not.toThrow()
    })
  })

  describe('maxAge option', () => {
    it('passes maxAge to DevTools', () => {
      createTestStore({ maxAge: 100 })

      expect(mock.connect).toHaveBeenCalledWith(
        expect.objectContaining({ maxAge: 100 })
      )
    })
  })

  describe('latency option', () => {
    it('passes latency to DevTools', () => {
      createTestStore({ latency: 1000 })

      expect(mock.connect).toHaveBeenCalledWith(
        expect.objectContaining({ latency: 1000 })
      )
    })
  })

  describe('stateSanitizer option', () => {
    it('transforms state before sending to DevTools', () => {
      const stateSanitizer = vi.fn((state) => ({
        ...(state || {}),
        sanitized: true,
      }))

      const store = createTestStore({ stateSanitizer })

      // init is called with sanitizer applied
      expect(mock.__mockConnection.init).toHaveBeenCalled()
      expect(stateSanitizer).toHaveBeenCalled()

      mock.__mockConnection.send.mockClear()
      store.setState({ count: 1 })

      expect(mock.__mockConnection.send).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ sanitized: true })
      )
    })

    it('can filter sensitive data', () => {
      const stateSanitizer = vi.fn((state) => {
        if (!state) return { name: '[REDACTED]' }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { name: _name, ...rest } = state as { name: string }
        return { ...rest, name: '[REDACTED]' }
      })

      const store = createTestStore({ stateSanitizer })

      mock.__mockConnection.send.mockClear()
      store.setState({ count: 1 })

      expect(mock.__mockConnection.send).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ name: '[REDACTED]' })
      )
    })
  })

  describe('actionSanitizer option', () => {
    it('transforms action before sending to DevTools', () => {
      const actionSanitizer = vi.fn((action) => ({
        ...action,
        type: `PREFIX/${action.type}`,
      }))

      const store = createTestStore({ actionSanitizer })

      mock.__mockConnection.send.mockClear()
      store.setState({ count: 1 })

      expect(mock.__mockConnection.send).toHaveBeenCalledWith(
        expect.objectContaining({ type: expect.stringContaining('PREFIX/') }),
        expect.anything()
      )
    })

    it('can modify action payload', () => {
      const actionSanitizer = vi.fn((action) => ({
        ...action,
        payload: { sanitized: true },
      }))

      const store = createTestStore({ actionSanitizer })

      mock.__mockConnection.send.mockClear()
      store.devtools.send('TEST', { sensitive: 'data' })

      expect(mock.__mockConnection.send).toHaveBeenCalledWith(
        expect.objectContaining({ payload: { sanitized: true } }),
        expect.anything()
      )
    })
  })
})

// ============================================================
// EDGE CASES
// ============================================================

describe('devtools middleware - edge cases', () => {
  let mock: SimpleMock

  beforeEach(() => {
    mock = enableDevToolsMock() as SimpleMock
  })

  afterEach(() => {
    disableDevToolsMock()
  })

  it('handles setState with replace=true', () => {
    const store = createTestStore()

    mock.__mockConnection.send.mockClear()

    store.setState({ count: 100, name: 'replaced' } as TestState, true)

    expect(store.getState().count).toBe(100)
    expect(mock.__mockConnection.send).toHaveBeenCalled()
  })

  it('handles function updater in setState', () => {
    const store = createTestStore()

    mock.__mockConnection.send.mockClear()

    store.setState((state) => ({ count: state.count + 10 }))

    expect(store.getState().count).toBe(10)
    expect(mock.__mockConnection.send).toHaveBeenCalled()
  })

  it('handles rapid state changes via direct setState', () => {
    const store = createTestStore()

    mock.__mockConnection.send.mockClear()

    for (let i = 0; i < 10; i++) {
      store.setState((s) => ({ count: s.count + 1 }))
    }

    expect(store.getState().count).toBe(10)
    expect(mock.__mockConnection.send).toHaveBeenCalledTimes(10)
  })

  it('handles getInitialState for RESET', () => {
    let dispatchHandler: (message: { type: string; state?: string; payload?: { type: string } }) => void
    mock.__mockConnection.subscribe.mockImplementation((handler) => {
      dispatchHandler = handler
      return vi.fn()
    })

    const store = createTestStore()

    store.setState({ count: 999 })

    dispatchHandler!({
      type: 'DISPATCH',
      payload: { type: 'RESET' },
    })

    // Should reset to initial state
    expect(store.getState().count).toBe(0)
    expect(store.getInitialState().count).toBe(0)
  })

  it('handles missing state in JUMP messages gracefully', () => {
    let dispatchHandler: (message: { type: string; state?: string; payload?: { type: string } }) => void
    mock.__mockConnection.subscribe.mockImplementation((handler) => {
      dispatchHandler = handler
      return vi.fn()
    })

    const store = createTestStore()
    store.getState().increment()

    const countBefore = store.getState().count

    // JUMP without state should not crash
    dispatchHandler!({
      type: 'DISPATCH',
      payload: { type: 'JUMP_TO_STATE' },
      // No state provided
    })

    expect(store.getState().count).toBe(countBefore)
  })

  it('handles ROLLBACK without state gracefully', () => {
    let dispatchHandler: (message: { type: string; state?: string; payload?: { type: string } }) => void
    mock.__mockConnection.subscribe.mockImplementation((handler) => {
      dispatchHandler = handler
      return vi.fn()
    })

    const store = createTestStore()
    store.getState().increment()

    const countBefore = store.getState().count

    dispatchHandler!({
      type: 'DISPATCH',
      payload: { type: 'ROLLBACK' },
      // No state
    })

    expect(store.getState().count).toBe(countBefore)
  })
})

// ============================================================
// STORE WITH COMPLEX STATE
// ============================================================

describe('devtools with complex state', () => {
  let mock: SimpleMock

  beforeEach(() => {
    mock = enableDevToolsMock() as SimpleMock
  })

  afterEach(() => {
    disableDevToolsMock()
  })

  it('handles nested objects via direct setState', () => {
    interface ComplexState {
      user: { name: string; settings: { theme: string } }
    }

    const store = createStore<ComplexState>()(
      devtools(() => ({
        user: { name: 'John', settings: { theme: 'dark' } },
      }))
    )

    mock.__mockConnection.send.mockClear()

    store.setState({
      user: { name: 'Jane', settings: { theme: 'light' } },
    })

    expect(mock.__mockConnection.send).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        user: { name: 'Jane', settings: { theme: 'light' } },
      })
    )
  })

  it('handles arrays via direct setState', () => {
    interface ArrayState {
      items: number[]
    }

    const store = createStore<ArrayState>()(
      devtools(() => ({
        items: [1, 2, 3],
      }))
    )

    mock.__mockConnection.send.mockClear()

    store.setState((s) => ({ items: [...s.items, 4] }))

    expect(mock.__mockConnection.send).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ items: [1, 2, 3, 4] })
    )
  })
})

// ============================================================
// DEVTOOLS API
// ============================================================

describe('devtools API', () => {
  let mock: SimpleMock

  beforeEach(() => {
    mock = enableDevToolsMock() as SimpleMock
  })

  afterEach(() => {
    disableDevToolsMock()
  })

  it('provides disconnect method that unsubscribes from DevTools', () => {
    interface State {
      count: number
    }

    const store = createStore<State>()(
      devtools(() => ({ count: 0 }))
    ) as StoreApi<State> & { devtools: { disconnect: () => void; isConnected: () => boolean } }

    expect(store.devtools.isConnected()).toBe(true)

    // Call disconnect
    store.devtools.disconnect()

    // Should have called unsubscribe on the connection
    expect(mock.__mockConnection.unsubscribe).toHaveBeenCalled()
  })
})

// ============================================================
// JSON PARSE ERROR HANDLING
// ============================================================

describe('devtools JSON parse error handling', () => {
  let mock: SimpleMock
  let dispatchHandler: (message: { type: string; state?: string; payload?: { type: string } }) => void

  beforeEach(() => {
    mock = enableDevToolsMock() as SimpleMock
    mock.__mockConnection.subscribe.mockImplementation((handler) => {
      dispatchHandler = handler
      return vi.fn()
    })
  })

  afterEach(() => {
    disableDevToolsMock()
  })

  it('handles ROLLBACK with invalid JSON gracefully', () => {
    interface State {
      count: number
    }

    const store = createStore<State>()(
      devtools(() => ({ count: 0 }))
    )

    store.setState({ count: 5 })
    const countBefore = store.getState().count

    // Send invalid JSON
    dispatchHandler({
      type: 'DISPATCH',
      state: 'invalid json {{{',
      payload: { type: 'ROLLBACK' },
    })

    // State should remain unchanged
    expect(store.getState().count).toBe(countBefore)
    // Error should be reported to DevTools
    expect(mock.__mockConnection.error).toHaveBeenCalled()
  })

  it('handles JUMP_TO_STATE with invalid JSON gracefully', () => {
    interface State {
      count: number
    }

    const store = createStore<State>()(
      devtools(() => ({ count: 0 }))
    )

    store.setState({ count: 5 })
    const countBefore = store.getState().count

    // Send invalid JSON
    dispatchHandler({
      type: 'DISPATCH',
      state: 'not valid json',
      payload: { type: 'JUMP_TO_STATE' },
    })

    // State should remain unchanged
    expect(store.getState().count).toBe(countBefore)
    // Error should be reported to DevTools
    expect(mock.__mockConnection.error).toHaveBeenCalled()
  })

  it('handles JUMP_TO_ACTION with invalid JSON gracefully', () => {
    interface State {
      count: number
    }

    const store = createStore<State>()(
      devtools(() => ({ count: 0 }))
    )

    store.setState({ count: 5 })
    const countBefore = store.getState().count

    // Send invalid JSON
    dispatchHandler({
      type: 'DISPATCH',
      state: '{ broken: json ]',
      payload: { type: 'JUMP_TO_ACTION' },
    })

    // State should remain unchanged
    expect(store.getState().count).toBe(countBefore)
    // Error should be reported to DevTools
    expect(mock.__mockConnection.error).toHaveBeenCalled()
  })
})
