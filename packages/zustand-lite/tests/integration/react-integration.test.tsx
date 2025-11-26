/**
 * Integration tests for React with middleware.
 * Tests React hooks with various middleware combinations.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { create } from '../../src/react'
import { createStore } from '../../src/vanilla'
import { useStore } from '../../src/react'
import { persist } from '../../src/middleware/persist'
import { immer } from '../../src/middleware/immer'
import { subscribeWithSelector } from '../../src/middleware/subscribeWithSelector'
import { devtools } from '../../src/middleware/devtools'
import { shallow } from '../../src/utils/shallow'
import { enableDevToolsMock, disableDevToolsMock } from '../setup'
import type { PersistStorage, StorageValue } from '../../src/middleware/persist'

// ============================================================
// TEST SETUP
// ============================================================

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
// CREATE WITH MIDDLEWARE
// ============================================================

describe('create() with middleware', () => {
  describe('with immer', () => {
    it('updates state with mutable syntax', () => {
      interface State {
        items: string[]
        addItem: (item: string) => void
      }

      const useStore = create<State>()(
        immer((set) => ({
          items: [],
          addItem: (item) =>
            set((draft) => {
              draft.items.push(item)
            }),
        }))
      )

      function TestComponent() {
        const items = useStore((s) => s.items)
        const addItem = useStore((s) => s.addItem)

        return (
          <div>
            <span data-testid="count">{items.length}</span>
            <button onClick={() => addItem('new')}>Add</button>
          </div>
        )
      }

      render(<TestComponent />)

      expect(screen.getByTestId('count').textContent).toBe('0')

      act(() => {
        screen.getByRole('button').click()
      })

      expect(screen.getByTestId('count').textContent).toBe('1')
    })
  })

  describe('with persist', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('hydrates state from storage', async () => {
      const storage = createMockStorage<StorageValue<{ count: number }>>()
      storage.data.set('test', { state: { count: 42 }, version: 0 })

      interface State {
        count: number
        increment: () => void
      }

      const useStore = create<State>()(
        persist(
          (set) => ({
            count: 0,
            increment: () => set((s) => ({ count: s.count + 1 })),
          }),
          { name: 'test', storage }
        )
      )

      function TestComponent() {
        const count = useStore((s) => s.count)
        return <span data-testid="count">{count}</span>
      }

      render(<TestComponent />)

      // Initially shows default
      expect(screen.getByTestId('count').textContent).toBe('0')

      // Wait for hydration
      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(screen.getByTestId('count').textContent).toBe('42')
    })
  })

  describe('with subscribeWithSelector', () => {
    it('re-renders only when selected state changes', () => {
      interface State {
        count: number
        name: string
        incrementCount: () => void
        setName: (name: string) => void
      }

      const useStore = create<State>()(
        subscribeWithSelector((set) => ({
          count: 0,
          name: 'test',
          incrementCount: () => set((s) => ({ count: s.count + 1 })),
          setName: (name) => set({ name }),
        }))
      )

      const countRenders = vi.fn()
      const nameRenders = vi.fn()

      function CountComponent() {
        const count = useStore((s) => s.count)
        countRenders()
        return <span data-testid="count">{count}</span>
      }

      function NameComponent() {
        const name = useStore((s) => s.name)
        nameRenders()
        return <span data-testid="name">{name}</span>
      }

      function Buttons() {
        const incrementCount = useStore((s) => s.incrementCount)
        const setName = useStore((s) => s.setName)
        return (
          <div>
            <button onClick={incrementCount}>Inc</button>
            <button onClick={() => setName('changed')}>Change Name</button>
          </div>
        )
      }

      render(
        <>
          <CountComponent />
          <NameComponent />
          <Buttons />
        </>
      )

      expect(countRenders).toHaveBeenCalledTimes(1)
      expect(nameRenders).toHaveBeenCalledTimes(1)

      act(() => {
        screen.getByText('Inc').click()
      })

      expect(screen.getByTestId('count').textContent).toBe('1')
      // Only CountComponent should re-render
      expect(countRenders).toHaveBeenCalledTimes(2)
      expect(nameRenders).toHaveBeenCalledTimes(1)

      act(() => {
        screen.getByText('Change Name').click()
      })

      expect(screen.getByTestId('name').textContent).toBe('changed')
      // Only NameComponent should re-render
      expect(countRenders).toHaveBeenCalledTimes(2)
      expect(nameRenders).toHaveBeenCalledTimes(2)
    })
  })

  describe('with devtools', () => {
    beforeEach(() => {
      enableDevToolsMock()
    })

    afterEach(() => {
      disableDevToolsMock()
    })

    it('adds devtools API to store', () => {
      interface State {
        value: number
        increment: () => void
      }

      const useStore = create<State>()(
        devtools(
          (set) => ({
            value: 0,
            increment: () => set((s) => ({ value: s.value + 1 })),
          }),
          { name: 'TestStore' }
        )
      )

      expect(useStore.devtools).toBeDefined()
      expect(useStore.devtools.isConnected()).toBe(true)
    })
  })
})

// ============================================================
// USE STORE WITH MIDDLEWARE STORES
// ============================================================

describe('useStore with middleware stores', () => {
  describe('with immer store', () => {
    it('subscribes to immer-enabled store', () => {
      interface State {
        todos: Array<{ id: number; text: string; done: boolean }>
        addTodo: (text: string) => void
        toggleTodo: (id: number) => void
      }

      let nextId = 1

      const store = createStore<State>()(
        immer((set) => ({
          todos: [],
          addTodo: (text) =>
            set((draft) => {
              draft.todos.push({ id: nextId++, text, done: false })
            }),
          toggleTodo: (id) =>
            set((draft) => {
              const todo = draft.todos.find((t) => t.id === id)
              if (todo) todo.done = !todo.done
            }),
        }))
      )

      function TodoList() {
        const todos = useStore(store, (s) => s.todos)
        const addTodo = useStore(store, (s) => s.addTodo)
        const toggleTodo = useStore(store, (s) => s.toggleTodo)

        return (
          <div>
            <button onClick={() => addTodo('New Todo')}>Add</button>
            <ul>
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  data-testid={`todo-${todo.id}`}
                  onClick={() => toggleTodo(todo.id)}
                >
                  {todo.done ? '✓' : '○'} {todo.text}
                </li>
              ))}
            </ul>
            <span data-testid="count">{todos.length}</span>
          </div>
        )
      }

      render(<TodoList />)

      expect(screen.getByTestId('count').textContent).toBe('0')

      act(() => {
        screen.getByText('Add').click()
      })

      expect(screen.getByTestId('count').textContent).toBe('1')
      expect(screen.getByTestId('todo-1').textContent).toContain('New Todo')

      act(() => {
        screen.getByTestId('todo-1').click()
      })

      expect(screen.getByTestId('todo-1').textContent).toContain('✓')
    })
  })
})

// ============================================================
// SHALLOW EQUALITY WITH SELECTORS
// ============================================================

describe('shallow equality with selectors', () => {
  it('prevents unnecessary re-renders with shallow', () => {
    interface State {
      user: { name: string; age: number }
      settings: { theme: string }
      updateUser: (user: Partial<{ name: string; age: number }>) => void
      updateSettings: (settings: Partial<{ theme: string }>) => void
    }

    const useStore = create<State>()((set) => ({
      user: { name: 'John', age: 30 },
      settings: { theme: 'dark' },
      updateUser: (user) =>
        set((s) => ({ user: { ...s.user, ...user } })),
      updateSettings: (settings) =>
        set((s) => ({ settings: { ...s.settings, ...settings } })),
    }))

    const userRenders = vi.fn()

    function UserComponent() {
      // Select multiple fields with shallow comparison
      const { name, age } = useStore(
        (s) => ({ name: s.user.name, age: s.user.age }),
        shallow
      )
      userRenders()
      return (
        <div data-testid="user">
          {name}, {age}
        </div>
      )
    }

    function SettingsButton() {
      const updateSettings = useStore((s) => s.updateSettings)
      return (
        <button onClick={() => updateSettings({ theme: 'light' })}>
          Change Theme
        </button>
      )
    }

    render(
      <>
        <UserComponent />
        <SettingsButton />
      </>
    )

    expect(userRenders).toHaveBeenCalledTimes(1)

    // Change settings (not user)
    act(() => {
      screen.getByRole('button').click()
    })

    // UserComponent should NOT re-render
    expect(userRenders).toHaveBeenCalledTimes(1)
  })
})

// ============================================================
// MULTIPLE COMPONENTS SHARING STORE
// ============================================================

describe('multiple components sharing store', () => {
  it('all components update when state changes', () => {
    interface State {
      count: number
      increment: () => void
    }

    const useStore = create<State>()((set) => ({
      count: 0,
      increment: () => set((s) => ({ count: s.count + 1 })),
    }))

    function Display1() {
      const count = useStore((s) => s.count)
      return <span data-testid="display1">{count}</span>
    }

    function Display2() {
      const count = useStore((s) => s.count)
      return <span data-testid="display2">{count}</span>
    }

    function IncrementButton() {
      const increment = useStore((s) => s.increment)
      return <button onClick={increment}>Inc</button>
    }

    render(
      <>
        <Display1 />
        <Display2 />
        <IncrementButton />
      </>
    )

    expect(screen.getByTestId('display1').textContent).toBe('0')
    expect(screen.getByTestId('display2').textContent).toBe('0')

    act(() => {
      screen.getByRole('button').click()
    })

    expect(screen.getByTestId('display1').textContent).toBe('1')
    expect(screen.getByTestId('display2').textContent).toBe('1')
  })

  it('components can use different selectors', () => {
    interface State {
      count: number
      name: string
    }

    const useStore = create<State>()(() => ({
      count: 10,
      name: 'test',
    }))

    function CountDisplay() {
      const count = useStore((s) => s.count)
      return <span data-testid="count">{count}</span>
    }

    function NameDisplay() {
      const name = useStore((s) => s.name)
      return <span data-testid="name">{name}</span>
    }

    function FullDisplay() {
      const state = useStore()
      return (
        <span data-testid="full">
          {state.name}: {state.count}
        </span>
      )
    }

    render(
      <>
        <CountDisplay />
        <NameDisplay />
        <FullDisplay />
      </>
    )

    expect(screen.getByTestId('count').textContent).toBe('10')
    expect(screen.getByTestId('name').textContent).toBe('test')
    expect(screen.getByTestId('full').textContent).toBe('test: 10')
  })
})

// ============================================================
// STORE API ACCESS
// ============================================================

describe('store API access', () => {
  it('can access store API directly', () => {
    interface State {
      count: number
      increment: () => void
    }

    const useStore = create<State>()((set) => ({
      count: 0,
      increment: () => set((s) => ({ count: s.count + 1 })),
    }))

    function TestComponent() {
      const count = useStore((s) => s.count)
      return <span data-testid="count">{count}</span>
    }

    render(<TestComponent />)

    expect(screen.getByTestId('count').textContent).toBe('0')

    // Update via store API directly
    act(() => {
      useStore.setState({ count: 100 })
    })

    expect(screen.getByTestId('count').textContent).toBe('100')

    // Use action via store
    act(() => {
      useStore.getState().increment()
    })

    expect(screen.getByTestId('count').textContent).toBe('101')
  })

  it('getInitialState returns initial state', () => {
    interface State {
      value: number
    }

    const useStore = create<State>()(() => ({
      value: 42,
    }))

    expect(useStore.getInitialState().value).toBe(42)

    act(() => {
      useStore.setState({ value: 100 })
    })

    expect(useStore.getState().value).toBe(100)
    expect(useStore.getInitialState().value).toBe(42)
  })

  it('subscribe works outside React', () => {
    interface State {
      count: number
    }

    const useStore = create<State>()(() => ({
      count: 0,
    }))

    const listener = vi.fn()
    const unsubscribe = useStore.subscribe(listener)

    act(() => {
      useStore.setState({ count: 1 })
    })

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ count: 1 }),
      expect.objectContaining({ count: 0 })
    )

    unsubscribe()

    act(() => {
      useStore.setState({ count: 2 })
    })

    expect(listener).toHaveBeenCalledTimes(1) // No more calls
  })
})

// ============================================================
// CONDITIONAL RENDERING
// ============================================================

describe('conditional rendering', () => {
  it('handles component mount/unmount', () => {
    interface State {
      showChild: boolean
      count: number
      toggleChild: () => void
      increment: () => void
    }

    const useStore = create<State>()((set) => ({
      showChild: true,
      count: 0,
      toggleChild: () => set((s) => ({ showChild: !s.showChild })),
      increment: () => set((s) => ({ count: s.count + 1 })),
    }))

    function ChildComponent() {
      const count = useStore((s) => s.count)
      return <span data-testid="child">{count}</span>
    }

    function ParentComponent() {
      const showChild = useStore((s) => s.showChild)
      const toggleChild = useStore((s) => s.toggleChild)
      const increment = useStore((s) => s.increment)

      return (
        <div>
          {showChild && <ChildComponent />}
          <button onClick={toggleChild}>Toggle</button>
          <button onClick={increment}>Inc</button>
        </div>
      )
    }

    render(<ParentComponent />)

    expect(screen.queryByTestId('child')).not.toBeNull()
    expect(screen.getByTestId('child').textContent).toBe('0')

    // Unmount child
    act(() => {
      screen.getByText('Toggle').click()
    })

    expect(screen.queryByTestId('child')).toBeNull()

    // Update state while unmounted
    act(() => {
      screen.getByText('Inc').click()
    })

    // Mount child again
    act(() => {
      screen.getByText('Toggle').click()
    })

    expect(screen.queryByTestId('child')).not.toBeNull()
    expect(screen.getByTestId('child').textContent).toBe('1')
  })
})
