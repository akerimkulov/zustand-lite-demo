import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// Cleanup React components after each test
afterEach(() => {
  cleanup()
})

// Mock localStorage
const createMockStorage = () => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  }
}

const localStorageMock = createMockStorage()
const sessionStorageMock = createMockStorage()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock })

// Reset storage and mocks before each test
beforeEach(() => {
  localStorageMock.clear()
  sessionStorageMock.clear()
  vi.clearAllMocks()
})

// Mock Redux DevTools Extension
const createMockDevToolsExtension = () => {
  const mockConnection = {
    init: vi.fn(),
    send: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    unsubscribe: vi.fn(),
    error: vi.fn(),
  }

  return {
    connect: vi.fn(() => mockConnection),
    disconnect: vi.fn(),
    __mockConnection: mockConnection,
  }
}

// Add devtools to window (disabled by default, enable in specific tests)
Object.defineProperty(window, '__REDUX_DEVTOOLS_EXTENSION__', {
  value: undefined,
  writable: true,
  configurable: true,
})

// Helper to enable devtools mock in tests
export const enableDevToolsMock = () => {
  const mock = createMockDevToolsExtension()
  ;(window as any).__REDUX_DEVTOOLS_EXTENSION__ = mock
  return mock
}

// Helper to disable devtools mock
export const disableDevToolsMock = () => {
  (window as any).__REDUX_DEVTOOLS_EXTENSION__ = undefined
}

// Helper to create fresh mock storage for tests
export { createMockStorage }

// Helper to wait for async operations (like debounced persist)
export const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

// Helper to flush all pending timers
export const flushTimers = () => vi.runAllTimers()

// Helper to advance timers by specific amount
export const advanceTimers = (ms: number) => vi.advanceTimersByTime(ms)
