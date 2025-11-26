/**
 * Real-world scenario tests.
 * Tests common use cases like shopping cart, form management, etc.
 */

import React, { useEffect } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { create } from '../../src/react'
import { persist } from '../../src/middleware/persist'
import { immer } from '../../src/middleware/immer'
import { subscribeWithSelector } from '../../src/middleware/subscribeWithSelector'
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
// E-COMMERCE: SHOPPING CART
// ============================================================

describe('E-commerce: Shopping Cart', () => {
  interface CartItem {
    id: string
    name: string
    price: number
    quantity: number
  }

  interface CartState {
    items: CartItem[]
    addItem: (product: Omit<CartItem, 'quantity'>) => void
    removeItem: (id: string) => void
    updateQuantity: (id: string, quantity: number) => void
    clearCart: () => void
    getTotal: () => number
    getItemCount: () => number
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('full cart workflow', async () => {
    const storage = createMockStorage<StorageValue<{ items: CartItem[] }>>()

    const useCart = create<CartState>()(
      persist(
        immer((set, get) => ({
          items: [],
          addItem: (product) =>
            set((draft) => {
              const existing = draft.items.find((i) => i.id === product.id)
              if (existing) {
                existing.quantity++
              } else {
                draft.items.push({ ...product, quantity: 1 })
              }
            }),
          removeItem: (id) =>
            set((draft) => {
              draft.items = draft.items.filter((i) => i.id !== id)
            }),
          updateQuantity: (id, quantity) =>
            set((draft) => {
              const item = draft.items.find((i) => i.id === id)
              if (item) {
                item.quantity = Math.max(0, quantity)
                if (item.quantity === 0) {
                  draft.items = draft.items.filter((i) => i.id !== id)
                }
              }
            }),
          clearCart: () => set({ items: [] }),
          getTotal: () =>
            get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
          getItemCount: () =>
            get().items.reduce((sum, item) => sum + item.quantity, 0),
        })),
        { name: 'cart', storage }
      )
    )

    function CartSummary() {
      const total = useCart((s) => s.getTotal())
      const count = useCart((s) => s.getItemCount())
      return (
        <div>
          <span data-testid="count">{count}</span>
          <span data-testid="total">${total.toFixed(2)}</span>
        </div>
      )
    }

    function CartActions() {
      const addItem = useCart((s) => s.addItem)
      const clearCart = useCart((s) => s.clearCart)
      return (
        <div>
          <button onClick={() => addItem({ id: '1', name: 'Widget', price: 10 })}>
            Add Widget
          </button>
          <button onClick={() => addItem({ id: '2', name: 'Gadget', price: 25 })}>
            Add Gadget
          </button>
          <button onClick={clearCart}>Clear</button>
        </div>
      )
    }

    render(
      <>
        <CartSummary />
        <CartActions />
      </>
    )

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(screen.getByTestId('count').textContent).toBe('0')
    expect(screen.getByTestId('total').textContent).toBe('$0.00')

    // Add items
    act(() => {
      screen.getByText('Add Widget').click()
      screen.getByText('Add Widget').click()
      screen.getByText('Add Gadget').click()
    })

    expect(screen.getByTestId('count').textContent).toBe('3')
    expect(screen.getByTestId('total').textContent).toBe('$45.00')

    // Clear cart
    act(() => {
      screen.getByText('Clear').click()
    })

    expect(screen.getByTestId('count').textContent).toBe('0')
    expect(screen.getByTestId('total').textContent).toBe('$0.00')
  })
})

// ============================================================
// FORM MANAGEMENT
// ============================================================

describe('Form Management', () => {
  interface FormField<T> {
    value: T
    error: string | null
    touched: boolean
  }

  interface LoginFormState {
    email: FormField<string>
    password: FormField<string>
    isSubmitting: boolean
    setField: (field: 'email' | 'password', value: string) => void
    touchField: (field: 'email' | 'password') => void
    validateField: (field: 'email' | 'password') => boolean
    submit: () => Promise<boolean>
    reset: () => void
  }

  it('form validation and submission', async () => {
    const onSubmit = vi.fn()

    const useForm = create<LoginFormState>()(
      immer((set, get) => ({
        email: { value: '', error: null, touched: false },
        password: { value: '', error: null, touched: false },
        isSubmitting: false,
        setField: (field, value) =>
          set((draft) => {
            draft[field].value = value
            draft[field].error = null
          }),
        touchField: (field) =>
          set((draft) => {
            draft[field].touched = true
          }),
        validateField: (field) => {
          const state = get()
          let error: string | null = null

          if (field === 'email') {
            if (!state.email.value) {
              error = 'Email is required'
            } else if (!state.email.value.includes('@')) {
              error = 'Invalid email format'
            }
          }

          if (field === 'password') {
            if (!state.password.value) {
              error = 'Password is required'
            } else if (state.password.value.length < 8) {
              error = 'Password must be at least 8 characters'
            }
          }

          set((draft) => {
            draft[field].error = error
          })

          return error === null
        },
        submit: async () => {
          const state = get()
          const emailValid = state.validateField('email')
          const passwordValid = state.validateField('password')

          if (!emailValid || !passwordValid) {
            return false
          }

          set({ isSubmitting: true })

          try {
            await onSubmit({
              email: state.email.value,
              password: state.password.value,
            })
            return true
          } finally {
            set({ isSubmitting: false })
          }
        },
        reset: () =>
          set({
            email: { value: '', error: null, touched: false },
            password: { value: '', error: null, touched: false },
            isSubmitting: false,
          }),
      }))
    )

    function LoginForm() {
      const email = useForm((s) => s.email)
      const password = useForm((s) => s.password)
      const isSubmitting = useForm((s) => s.isSubmitting)
      const setField = useForm((s) => s.setField)
      const touchField = useForm((s) => s.touchField)
      const submit = useForm((s) => s.submit)

      return (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <div>
            <input
              data-testid="email"
              value={email.value}
              onChange={(e) => setField('email', e.target.value)}
              onBlur={() => touchField('email')}
            />
            {email.error && <span data-testid="email-error">{email.error}</span>}
          </div>
          <div>
            <input
              data-testid="password"
              type="password"
              value={password.value}
              onChange={(e) => setField('password', e.target.value)}
              onBlur={() => touchField('password')}
            />
            {password.error && (
              <span data-testid="password-error">{password.error}</span>
            )}
          </div>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Login'}
          </button>
        </form>
      )
    }

    render(<LoginForm />)

    // Submit empty form
    act(() => {
      screen.getByRole('button').click()
    })

    expect(screen.getByTestId('email-error').textContent).toBe('Email is required')
    expect(screen.getByTestId('password-error').textContent).toBe(
      'Password is required'
    )

    // Fill invalid email
    act(() => {
      const emailInput = screen.getByTestId('email')
      ;(emailInput as HTMLInputElement).value = 'invalid'
      emailInput.dispatchEvent(new Event('input', { bubbles: true }))
    })

    // Fill short password
    act(() => {
      const passwordInput = screen.getByTestId('password')
      ;(passwordInput as HTMLInputElement).value = '123'
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }))
    })

    // Note: We're using the store directly since DOM events don't work well with our setup
    act(() => {
      useForm.getState().setField('email', 'invalid')
      useForm.getState().setField('password', '123')
    })

    act(() => {
      screen.getByRole('button').click()
    })

    expect(screen.getByTestId('email-error').textContent).toBe('Invalid email format')
    expect(screen.getByTestId('password-error').textContent).toBe(
      'Password must be at least 8 characters'
    )

    // Fill valid data
    act(() => {
      useForm.getState().setField('email', 'test@example.com')
      useForm.getState().setField('password', 'password123')
    })

    await act(async () => {
      await useForm.getState().submit()
    })

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })
})

// ============================================================
// TODO APP
// ============================================================

describe('Todo App', () => {
  interface Todo {
    id: number
    text: string
    completed: boolean
  }

  interface TodoState {
    todos: Todo[]
    filter: 'all' | 'active' | 'completed'
    addTodo: (text: string) => void
    toggleTodo: (id: number) => void
    deleteTodo: (id: number) => void
    setFilter: (filter: 'all' | 'active' | 'completed') => void
    getFilteredTodos: () => Todo[]
    getRemainingCount: () => number
  }

  it('complete todo workflow', () => {
    let nextId = 1

    const useTodos = create<TodoState>()(
      subscribeWithSelector(
        immer((set, get) => ({
          todos: [],
          filter: 'all',
          addTodo: (text) =>
            set((draft) => {
              draft.todos.push({ id: nextId++, text, completed: false })
            }),
          toggleTodo: (id) =>
            set((draft) => {
              const todo = draft.todos.find((t) => t.id === id)
              if (todo) todo.completed = !todo.completed
            }),
          deleteTodo: (id) =>
            set((draft) => {
              draft.todos = draft.todos.filter((t) => t.id !== id)
            }),
          setFilter: (filter) =>
            set((draft) => {
              draft.filter = filter
            }),
          getFilteredTodos: () => {
            const { todos, filter } = get()
            switch (filter) {
              case 'active':
                return todos.filter((t) => !t.completed)
              case 'completed':
                return todos.filter((t) => t.completed)
              default:
                return todos
            }
          },
          getRemainingCount: () => get().todos.filter((t) => !t.completed).length,
        }))
      )
    )

    function TodoList() {
      const todos = useTodos((s) => s.getFilteredTodos())
      const toggleTodo = useTodos((s) => s.toggleTodo)
      const deleteTodo = useTodos((s) => s.deleteTodo)

      return (
        <ul>
          {todos.map((todo) => (
            <li key={todo.id} data-testid={`todo-${todo.id}`}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                data-testid={`toggle-${todo.id}`}
              />
              <span>{todo.text}</span>
              <button onClick={() => deleteTodo(todo.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )
    }

    function TodoFooter() {
      const remaining = useTodos((s) => s.getRemainingCount())
      const filter = useTodos((s) => s.filter)
      const setFilter = useTodos((s) => s.setFilter)

      return (
        <div>
          <span data-testid="remaining">{remaining} items left</span>
          <button
            onClick={() => setFilter('all')}
            data-active={filter === 'all'}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            data-active={filter === 'active'}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('completed')}
            data-active={filter === 'completed'}
          >
            Completed
          </button>
        </div>
      )
    }

    function AddTodo() {
      const addTodo = useTodos((s) => s.addTodo)
      return <button onClick={() => addTodo('New Todo')}>Add</button>
    }

    render(
      <>
        <AddTodo />
        <TodoList />
        <TodoFooter />
      </>
    )

    expect(screen.getByTestId('remaining').textContent).toBe('0 items left')

    // Add todos
    act(() => {
      screen.getByText('Add').click()
      screen.getByText('Add').click()
      screen.getByText('Add').click()
    })

    expect(screen.getByTestId('remaining').textContent).toBe('3 items left')
    expect(screen.getAllByRole('listitem')).toHaveLength(3)

    // Complete one todo
    act(() => {
      screen.getByTestId('toggle-1').click()
    })

    expect(screen.getByTestId('remaining').textContent).toBe('2 items left')

    // Filter to active
    act(() => {
      screen.getByText('Active').click()
    })

    expect(screen.getAllByRole('listitem')).toHaveLength(2)

    // Filter to completed
    act(() => {
      screen.getByText('Completed').click()
    })

    expect(screen.getAllByRole('listitem')).toHaveLength(1)

    // Delete completed
    act(() => {
      screen.getByText('Delete').click()
    })

    expect(screen.queryAllByRole('listitem')).toHaveLength(0)

    // Back to all
    act(() => {
      screen.getByText('All').click()
    })

    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })
})

// ============================================================
// AUTHENTICATION STATE
// ============================================================

describe('Authentication State', () => {
  interface User {
    id: string
    email: string
    name: string
  }

  interface AuthState {
    user: User | null
    isLoading: boolean
    error: string | null
    login: (email: string, password: string) => Promise<void>
    logout: () => void
  }

  it('authentication flow', async () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
    }

    const useAuth = create<AuthState>()(
      immer((set) => ({
        user: null,
        isLoading: false,
        error: null,
        login: async (email, password) => {
          set({ isLoading: true, error: null })
          // Simulate API call (synchronous for test simplicity)
          if (email === 'test@example.com' && password === 'password') {
            set({ user: mockUser, isLoading: false })
          } else {
            set({ error: 'Invalid credentials', isLoading: false })
          }
        },
        logout: () => set({ user: null, error: null }),
      }))
    )

    function AuthStatus() {
      const user = useAuth((s) => s.user)
      const isLoading = useAuth((s) => s.isLoading)
      const error = useAuth((s) => s.error)

      if (isLoading) return <div data-testid="loading">Loading...</div>
      if (error) return <div data-testid="error">{error}</div>
      if (user) return <div data-testid="user">Welcome, {user.name}</div>
      return <div data-testid="guest">Please login</div>
    }

    render(<AuthStatus />)

    expect(screen.getByTestId('guest')).toBeDefined()

    // Attempt invalid login
    await act(async () => {
      await useAuth.getState().login('wrong@example.com', 'wrong')
    })

    expect(screen.getByTestId('error').textContent).toBe('Invalid credentials')

    // Valid login
    await act(async () => {
      await useAuth.getState().login('test@example.com', 'password')
    })

    expect(screen.getByTestId('user').textContent).toBe('Welcome, Test User')

    // Logout
    act(() => {
      useAuth.getState().logout()
    })

    expect(screen.getByTestId('guest')).toBeDefined()
  })
})

// ============================================================
// NOTIFICATION SYSTEM
// ============================================================

describe('Notification System', () => {
  interface Notification {
    id: string
    type: 'success' | 'error' | 'info' | 'warning'
    message: string
  }

  interface NotificationState {
    notifications: Notification[]
    nextId: number
    add: (notification: Omit<Notification, 'id'>) => string
    remove: (id: string) => void
    clear: () => void
  }

  it('notification management', () => {
    const useNotifications = create<NotificationState>()(
      immer((set, get) => ({
        notifications: [],
        nextId: 1,
        add: (notification) => {
          const id = `notification-${get().nextId}`
          set((draft) => {
            draft.notifications.push({ ...notification, id })
            draft.nextId++
          })
          return id
        },
        remove: (id) =>
          set((draft) => {
            draft.notifications = draft.notifications.filter((n) => n.id !== id)
          }),
        clear: () => set({ notifications: [] }),
      }))
    )

    function NotificationList() {
      const notifications = useNotifications((s) => s.notifications)
      const remove = useNotifications((s) => s.remove)

      return (
        <ul data-testid="notifications">
          {notifications.map((n) => (
            <li key={n.id} data-testid={n.id}>
              [{n.type}] {n.message}
              <button onClick={() => remove(n.id)}>Dismiss</button>
            </li>
          ))}
        </ul>
      )
    }

    render(<NotificationList />)

    expect(screen.queryAllByRole('listitem')).toHaveLength(0)

    let id1: string

    act(() => {
      id1 = useNotifications.getState().add({ type: 'success', message: 'Saved!' })
    })

    act(() => {
      useNotifications.getState().add({ type: 'error', message: 'Failed!' })
    })

    expect(screen.getAllByRole('listitem')).toHaveLength(2)

    // Remove one
    act(() => {
      useNotifications.getState().remove(id1)
    })

    expect(screen.getAllByRole('listitem')).toHaveLength(1)

    // Clear all
    act(() => {
      useNotifications.getState().clear()
    })

    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })
})

// ============================================================
// THEME/DARK MODE
// ============================================================

describe('Theme/Dark Mode', () => {
  interface ThemeState {
    theme: 'light' | 'dark' | 'system'
    setTheme: (theme: 'light' | 'dark' | 'system') => void
    toggleTheme: () => void
    getEffectiveTheme: () => 'light' | 'dark'
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('theme management with persistence', async () => {
    const storage = createMockStorage<StorageValue<{ theme: 'light' | 'dark' | 'system' }>>()
    storage.data.set('theme', { state: { theme: 'dark' }, version: 0 })

    const useTheme = create<ThemeState>()(
      persist(
        (set, get) => ({
          theme: 'system',
          setTheme: (theme) => set({ theme }),
          toggleTheme: () =>
            set((s) => ({
              theme: s.theme === 'light' ? 'dark' : 'light',
            })),
          getEffectiveTheme: () => {
            const { theme } = get()
            if (theme === 'system') {
              return 'light' // Default for test
            }
            return theme
          },
        }),
        { name: 'theme', storage }
      )
    )

    function ThemeDisplay() {
      const theme = useTheme((s) => s.theme)
      const effective = useTheme((s) => s.getEffectiveTheme())
      const toggleTheme = useTheme((s) => s.toggleTheme)
      const setTheme = useTheme((s) => s.setTheme)

      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <span data-testid="effective">{effective}</span>
          <button onClick={toggleTheme}>Toggle</button>
          <button onClick={() => setTheme('system')}>System</button>
        </div>
      )
    }

    render(<ThemeDisplay />)

    // Initial state before hydration
    expect(screen.getByTestId('theme').textContent).toBe('system')

    // Wait for hydration
    await act(async () => {
      await vi.runAllTimersAsync()
    })

    // After hydration - loaded from storage
    expect(screen.getByTestId('theme').textContent).toBe('dark')
    expect(screen.getByTestId('effective').textContent).toBe('dark')

    // Toggle theme
    act(() => {
      screen.getByText('Toggle').click()
    })

    expect(screen.getByTestId('theme').textContent).toBe('light')

    // Set to system
    act(() => {
      screen.getByText('System').click()
    })

    expect(screen.getByTestId('theme').textContent).toBe('system')
    expect(screen.getByTestId('effective').textContent).toBe('light')
  })
})

// ============================================================
// MULTI-STEP WIZARD
// ============================================================

describe('Multi-step Wizard', () => {
  interface WizardState {
    currentStep: number
    totalSteps: number
    data: Record<string, unknown>
    setStepData: (step: number, data: Record<string, unknown>) => void
    nextStep: () => void
    prevStep: () => void
    goToStep: (step: number) => void
    canGoNext: () => boolean
    canGoPrev: () => boolean
    isComplete: () => boolean
    reset: () => void
  }

  it('multi-step form wizard', () => {
    const useWizard = create<WizardState>()(
      immer((set, get) => ({
        currentStep: 0,
        totalSteps: 3,
        data: {},
        setStepData: (step, data) =>
          set((draft) => {
            draft.data[`step${step}`] = data
          }),
        nextStep: () =>
          set((draft) => {
            if (draft.currentStep < draft.totalSteps - 1) {
              draft.currentStep++
            }
          }),
        prevStep: () =>
          set((draft) => {
            if (draft.currentStep > 0) {
              draft.currentStep--
            }
          }),
        goToStep: (step) =>
          set((draft) => {
            if (step >= 0 && step < draft.totalSteps) {
              draft.currentStep = step
            }
          }),
        canGoNext: () => get().currentStep < get().totalSteps - 1,
        canGoPrev: () => get().currentStep > 0,
        isComplete: () => get().currentStep === get().totalSteps - 1,
        reset: () =>
          set({
            currentStep: 0,
            data: {},
          }),
      }))
    )

    function Wizard() {
      const currentStep = useWizard((s) => s.currentStep)
      const nextStep = useWizard((s) => s.nextStep)
      const prevStep = useWizard((s) => s.prevStep)
      const canGoNext = useWizard((s) => s.canGoNext())
      const canGoPrev = useWizard((s) => s.canGoPrev())
      const isComplete = useWizard((s) => s.isComplete())

      return (
        <div>
          <span data-testid="step">Step {currentStep + 1}</span>
          <span data-testid="complete">{isComplete ? 'Complete' : 'In Progress'}</span>
          <button onClick={prevStep} disabled={!canGoPrev}>
            Back
          </button>
          <button onClick={nextStep} disabled={!canGoNext}>
            Next
          </button>
        </div>
      )
    }

    render(<Wizard />)

    expect(screen.getByTestId('step').textContent).toBe('Step 1')
    expect((screen.getByText('Back') as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByText('Next') as HTMLButtonElement).disabled).toBe(false)

    // Go to step 2
    act(() => {
      screen.getByText('Next').click()
    })

    expect(screen.getByTestId('step').textContent).toBe('Step 2')
    expect((screen.getByText('Back') as HTMLButtonElement).disabled).toBe(false)

    // Go to step 3 (final)
    act(() => {
      screen.getByText('Next').click()
    })

    expect(screen.getByTestId('step').textContent).toBe('Step 3')
    expect(screen.getByTestId('complete').textContent).toBe('Complete')
    expect((screen.getByText('Next') as HTMLButtonElement).disabled).toBe(true)

    // Go back
    act(() => {
      screen.getByText('Back').click()
    })

    expect(screen.getByTestId('step').textContent).toBe('Step 2')
  })
})

// ============================================================
// ASYNC DATA FETCHING
// ============================================================

describe('Async Data Fetching', () => {
  interface DataState<T> {
    data: T | null
    isLoading: boolean
    error: string | null
    fetch: () => Promise<void>
    refresh: () => Promise<void>
    reset: () => void
  }

  it('data fetching with loading and error states', async () => {
    let fetchCount = 0
    const mockFetch = vi.fn().mockImplementation(async () => {
      fetchCount++
      if (fetchCount === 1) {
        return { items: ['a', 'b', 'c'] }
      }
      throw new Error('Network error')
    })

    interface ItemsData {
      items: string[]
    }

    const useData = create<DataState<ItemsData>>()((set) => ({
      data: null,
      isLoading: false,
      error: null,
      fetch: async () => {
        set({ isLoading: true, error: null })
        try {
          const data = await mockFetch()
          set({ data, isLoading: false })
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false })
        }
      },
      refresh: async () => {
        set({ error: null })
        try {
          const data = await mockFetch()
          set({ data })
        } catch (err) {
          set({ error: (err as Error).message })
        }
      },
      reset: () => set({ data: null, error: null, isLoading: false }),
    }))

    function DataDisplay() {
      const data = useData((s) => s.data)
      const isLoading = useData((s) => s.isLoading)
      const error = useData((s) => s.error)

      if (isLoading) return <div data-testid="loading">Loading...</div>
      if (error) return <div data-testid="error">{error}</div>
      if (!data) return <div data-testid="empty">No data</div>
      return <div data-testid="data">{data.items.join(',')}</div>
    }

    render(<DataDisplay />)

    expect(screen.getByTestId('empty')).toBeDefined()

    // Fetch data
    await act(async () => {
      await useData.getState().fetch()
    })

    expect(screen.getByTestId('data').textContent).toBe('a,b,c')

    // Refresh (will fail)
    await act(async () => {
      await useData.getState().refresh()
    })

    expect(screen.getByTestId('error').textContent).toBe('Network error')
  })
})

// ============================================================
// SEARCH AND FILTER
// ============================================================

describe('Search and Filter', () => {
  interface Product {
    id: number
    name: string
    category: string
    price: number
  }

  interface SearchState {
    products: Product[]
    searchQuery: string
    selectedCategory: string | null
    priceRange: { min: number; max: number }
    setSearchQuery: (query: string) => void
    setCategory: (category: string | null) => void
    setPriceRange: (min: number, max: number) => void
    getFilteredProducts: () => Product[]
  }

  it('search and filter products', () => {
    const products: Product[] = [
      { id: 1, name: 'Apple', category: 'fruits', price: 1 },
      { id: 2, name: 'Banana', category: 'fruits', price: 2 },
      { id: 3, name: 'Carrot', category: 'vegetables', price: 1.5 },
      { id: 4, name: 'Apple Pie', category: 'bakery', price: 10 },
    ]

    const useSearch = create<SearchState>()((set, get) => ({
      products,
      searchQuery: '',
      selectedCategory: null,
      priceRange: { min: 0, max: 100 },
      setSearchQuery: (query) => set({ searchQuery: query }),
      setCategory: (category) => set({ selectedCategory: category }),
      setPriceRange: (min, max) => set({ priceRange: { min, max } }),
      getFilteredProducts: () => {
        const { products, searchQuery, selectedCategory, priceRange } = get()
        return products.filter((p) => {
          const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
          const matchesCategory = !selectedCategory || p.category === selectedCategory
          const matchesPrice = p.price >= priceRange.min && p.price <= priceRange.max
          return matchesSearch && matchesCategory && matchesPrice
        })
      },
    }))

    function SearchResults() {
      const filtered = useSearch((s) => s.getFilteredProducts())
      const setSearchQuery = useSearch((s) => s.setSearchQuery)
      const setCategory = useSearch((s) => s.setCategory)
      const setPriceRange = useSearch((s) => s.setPriceRange)

      return (
        <div>
          <span data-testid="count">{filtered.length}</span>
          <span data-testid="names">{filtered.map((p) => p.name).join(',')}</span>
          <button onClick={() => setSearchQuery('apple')}>Search Apple</button>
          <button onClick={() => setCategory('fruits')}>Fruits Only</button>
          <button onClick={() => setPriceRange(0, 5)}>Under $5</button>
          <button onClick={() => setCategory(null)}>Clear Category</button>
        </div>
      )
    }

    render(<SearchResults />)

    expect(screen.getByTestId('count').textContent).toBe('4')

    // Search for apple
    act(() => {
      screen.getByText('Search Apple').click()
    })

    expect(screen.getByTestId('count').textContent).toBe('2')
    expect(screen.getByTestId('names').textContent).toBe('Apple,Apple Pie')

    // Clear search, filter by category
    act(() => {
      useSearch.setState({ searchQuery: '' })
      screen.getByText('Fruits Only').click()
    })

    expect(screen.getByTestId('count').textContent).toBe('2')
    expect(screen.getByTestId('names').textContent).toBe('Apple,Banana')

    // Price filter
    act(() => {
      screen.getByText('Clear Category').click()
      screen.getByText('Under $5').click()
    })

    expect(screen.getByTestId('count').textContent).toBe('3')
    expect(screen.getByTestId('names').textContent).toBe('Apple,Banana,Carrot')
  })
})

// ============================================================
// MODAL/DIALOG MANAGEMENT
// ============================================================

describe('Modal/Dialog Management', () => {
  interface Modal {
    id: string
    type: string
    data?: Record<string, unknown>
  }

  interface ModalState {
    modals: Modal[]
    openModal: (type: string, data?: Record<string, unknown>) => string
    closeModal: (id: string) => void
    closeAllModals: () => void
    getTopModal: () => Modal | undefined
  }

  it('modal stack management', () => {
    let modalId = 0

    const useModals = create<ModalState>()(
      immer((set, get) => ({
        modals: [],
        openModal: (type, data) => {
          const id = `modal-${++modalId}`
          set((draft) => {
            draft.modals.push({ id, type, data })
          })
          return id
        },
        closeModal: (id) =>
          set((draft) => {
            draft.modals = draft.modals.filter((m) => m.id !== id)
          }),
        closeAllModals: () => set({ modals: [] }),
        getTopModal: () => {
          const modals = get().modals
          return modals[modals.length - 1]
        },
      }))
    )

    function ModalContainer() {
      const modals = useModals((s) => s.modals)
      const topModal = useModals((s) => s.getTopModal())
      const closeModal = useModals((s) => s.closeModal)
      const openModal = useModals((s) => s.openModal)

      return (
        <div>
          <span data-testid="count">{modals.length}</span>
          <span data-testid="top">{topModal?.type || 'none'}</span>
          <button onClick={() => openModal('confirm')}>Open Confirm</button>
          <button onClick={() => openModal('alert')}>Open Alert</button>
          {topModal && (
            <button onClick={() => closeModal(topModal.id)}>Close Top</button>
          )}
        </div>
      )
    }

    render(<ModalContainer />)

    expect(screen.getByTestId('count').textContent).toBe('0')
    expect(screen.getByTestId('top').textContent).toBe('none')

    // Open confirm modal
    act(() => {
      screen.getByText('Open Confirm').click()
    })

    expect(screen.getByTestId('count').textContent).toBe('1')
    expect(screen.getByTestId('top').textContent).toBe('confirm')

    // Open alert on top
    act(() => {
      screen.getByText('Open Alert').click()
    })

    expect(screen.getByTestId('count').textContent).toBe('2')
    expect(screen.getByTestId('top').textContent).toBe('alert')

    // Close top
    act(() => {
      screen.getByText('Close Top').click()
    })

    expect(screen.getByTestId('count').textContent).toBe('1')
    expect(screen.getByTestId('top').textContent).toBe('confirm')
  })
})

// ============================================================
// USER PREFERENCES
// ============================================================

describe('User Preferences', () => {
  interface Preferences {
    language: string
    timezone: string
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
    }
  }

  interface PreferencesState {
    preferences: Preferences
    setLanguage: (lang: string) => void
    setTimezone: (tz: string) => void
    toggleNotification: (type: 'email' | 'push' | 'sms') => void
    resetToDefaults: () => void
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('user preferences with persistence', async () => {
    const storage = createMockStorage<StorageValue<{ preferences: Preferences }>>()

    const defaultPrefs: Preferences = {
      language: 'en',
      timezone: 'UTC',
      notifications: { email: true, push: false, sms: false },
    }

    const usePreferences = create<PreferencesState>()(
      persist(
        immer((set) => ({
          preferences: defaultPrefs,
          setLanguage: (language) =>
            set((draft) => {
              draft.preferences.language = language
            }),
          setTimezone: (timezone) =>
            set((draft) => {
              draft.preferences.timezone = timezone
            }),
          toggleNotification: (type) =>
            set((draft) => {
              draft.preferences.notifications[type] = !draft.preferences.notifications[type]
            }),
          resetToDefaults: () => set({ preferences: defaultPrefs }),
        })),
        { name: 'preferences', storage }
      )
    )

    function PreferencesPanel() {
      const prefs = usePreferences((s) => s.preferences)
      const setLanguage = usePreferences((s) => s.setLanguage)
      const toggleNotification = usePreferences((s) => s.toggleNotification)

      return (
        <div>
          <span data-testid="lang">{prefs.language}</span>
          <span data-testid="email">{prefs.notifications.email ? 'on' : 'off'}</span>
          <span data-testid="push">{prefs.notifications.push ? 'on' : 'off'}</span>
          <button onClick={() => setLanguage('es')}>Spanish</button>
          <button onClick={() => toggleNotification('push')}>Toggle Push</button>
        </div>
      )
    }

    render(<PreferencesPanel />)

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(screen.getByTestId('lang').textContent).toBe('en')
    expect(screen.getByTestId('email').textContent).toBe('on')
    expect(screen.getByTestId('push').textContent).toBe('off')

    // Change language
    act(() => {
      screen.getByText('Spanish').click()
    })

    expect(screen.getByTestId('lang').textContent).toBe('es')

    // Toggle push notification
    act(() => {
      screen.getByText('Toggle Push').click()
    })

    expect(screen.getByTestId('push').textContent).toBe('on')

    // Verify persistence
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    const stored = storage.data.get('preferences')
    expect(stored?.state.preferences.language).toBe('es')
    expect(stored?.state.preferences.notifications.push).toBe(true)
  })
})

// ============================================================
// PAGINATION
// ============================================================

describe('Pagination', () => {
  interface PaginationState {
    items: number[]
    currentPage: number
    itemsPerPage: number
    setPage: (page: number) => void
    nextPage: () => void
    prevPage: () => void
    setItemsPerPage: (count: number) => void
    getCurrentItems: () => number[]
    getTotalPages: () => number
  }

  it('pagination controls', () => {
    const allItems = Array.from({ length: 25 }, (_, i) => i + 1)

    const usePagination = create<PaginationState>()((set, get) => ({
      items: allItems,
      currentPage: 1,
      itemsPerPage: 10,
      setPage: (page) => {
        const totalPages = get().getTotalPages()
        if (page >= 1 && page <= totalPages) {
          set({ currentPage: page })
        }
      },
      nextPage: () => {
        const { currentPage, getTotalPages, setPage } = get()
        if (currentPage < getTotalPages()) {
          setPage(currentPage + 1)
        }
      },
      prevPage: () => {
        const { currentPage, setPage } = get()
        if (currentPage > 1) {
          setPage(currentPage - 1)
        }
      },
      setItemsPerPage: (count) => set({ itemsPerPage: count, currentPage: 1 }),
      getCurrentItems: () => {
        const { items, currentPage, itemsPerPage } = get()
        const start = (currentPage - 1) * itemsPerPage
        return items.slice(start, start + itemsPerPage)
      },
      getTotalPages: () => {
        const { items, itemsPerPage } = get()
        return Math.ceil(items.length / itemsPerPage)
      },
    }))

    function PaginatedList() {
      const items = usePagination((s) => s.getCurrentItems())
      const currentPage = usePagination((s) => s.currentPage)
      const totalPages = usePagination((s) => s.getTotalPages())
      const nextPage = usePagination((s) => s.nextPage)
      const prevPage = usePagination((s) => s.prevPage)
      const setItemsPerPage = usePagination((s) => s.setItemsPerPage)

      return (
        <div>
          <span data-testid="items">{items.join(',')}</span>
          <span data-testid="page">{currentPage}/{totalPages}</span>
          <button onClick={prevPage}>Prev</button>
          <button onClick={nextPage}>Next</button>
          <button onClick={() => setItemsPerPage(5)}>5 per page</button>
        </div>
      )
    }

    render(<PaginatedList />)

    expect(screen.getByTestId('items').textContent).toBe('1,2,3,4,5,6,7,8,9,10')
    expect(screen.getByTestId('page').textContent).toBe('1/3')

    // Go to next page
    act(() => {
      screen.getByText('Next').click()
    })

    expect(screen.getByTestId('items').textContent).toBe('11,12,13,14,15,16,17,18,19,20')
    expect(screen.getByTestId('page').textContent).toBe('2/3')

    // Go to last page
    act(() => {
      screen.getByText('Next').click()
    })

    expect(screen.getByTestId('items').textContent).toBe('21,22,23,24,25')
    expect(screen.getByTestId('page').textContent).toBe('3/3')

    // Change items per page
    act(() => {
      screen.getByText('5 per page').click()
    })

    expect(screen.getByTestId('page').textContent).toBe('1/5')
    expect(screen.getByTestId('items').textContent).toBe('1,2,3,4,5')
  })
})

// ============================================================
// UNDO/REDO HISTORY
// ============================================================

describe('Undo/Redo History', () => {
  interface HistoryState<T> {
    present: T
    past: T[]
    future: T[]
    set: (value: T) => void
    undo: () => void
    redo: () => void
    canUndo: () => boolean
    canRedo: () => boolean
    clear: () => void
  }

  it('undo/redo text editing', () => {
    const useHistory = create<HistoryState<string>>()(
      immer((set, get) => ({
        present: '',
        past: [],
        future: [],
        set: (value) =>
          set((draft) => {
            draft.past.push(draft.present)
            draft.present = value
            draft.future = []
          }),
        undo: () =>
          set((draft) => {
            if (draft.past.length > 0) {
              draft.future.unshift(draft.present)
              draft.present = draft.past.pop()!
            }
          }),
        redo: () =>
          set((draft) => {
            if (draft.future.length > 0) {
              draft.past.push(draft.present)
              draft.present = draft.future.shift()!
            }
          }),
        canUndo: () => get().past.length > 0,
        canRedo: () => get().future.length > 0,
        clear: () => set({ present: '', past: [], future: [] }),
      }))
    )

    function TextEditor() {
      const text = useHistory((s) => s.present)
      const setText = useHistory((s) => s.set)
      const undo = useHistory((s) => s.undo)
      const redo = useHistory((s) => s.redo)
      const canUndo = useHistory((s) => s.canUndo())
      const canRedo = useHistory((s) => s.canRedo())

      return (
        <div>
          <span data-testid="text">{text || '(empty)'}</span>
          <button onClick={() => setText(text + 'a')}>Type A</button>
          <button onClick={() => setText(text + 'b')}>Type B</button>
          <button onClick={undo} disabled={!canUndo}>Undo</button>
          <button onClick={redo} disabled={!canRedo}>Redo</button>
        </div>
      )
    }

    render(<TextEditor />)

    expect(screen.getByTestId('text').textContent).toBe('(empty)')
    expect((screen.getByText('Undo') as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByText('Redo') as HTMLButtonElement).disabled).toBe(true)

    // Type some characters (must be separate acts to get updated state)
    act(() => {
      screen.getByText('Type A').click()
    })
    act(() => {
      screen.getByText('Type A').click()
    })
    act(() => {
      screen.getByText('Type B').click()
    })

    expect(screen.getByTestId('text').textContent).toBe('aab')
    expect((screen.getByText('Undo') as HTMLButtonElement).disabled).toBe(false)

    // Undo
    act(() => {
      screen.getByText('Undo').click()
    })

    expect(screen.getByTestId('text').textContent).toBe('aa')
    expect((screen.getByText('Redo') as HTMLButtonElement).disabled).toBe(false)

    // Undo again
    act(() => {
      screen.getByText('Undo').click()
    })

    expect(screen.getByTestId('text').textContent).toBe('a')

    // Redo
    act(() => {
      screen.getByText('Redo').click()
    })

    expect(screen.getByTestId('text').textContent).toBe('aa')

    // Type new character (clears redo history)
    act(() => {
      screen.getByText('Type B').click()
    })

    expect(screen.getByTestId('text').textContent).toBe('aab')
    expect((screen.getByText('Redo') as HTMLButtonElement).disabled).toBe(true)
  })
})

// ============================================================
// FEATURE FLAGS
// ============================================================

describe('Feature Flags', () => {
  interface FeatureFlagsState {
    flags: Record<string, boolean>
    isEnabled: (flag: string) => boolean
    enable: (flag: string) => void
    disable: (flag: string) => void
    toggle: (flag: string) => void
    setFlags: (flags: Record<string, boolean>) => void
  }

  it('feature flag management', () => {
    const useFeatureFlags = create<FeatureFlagsState>()(
      immer((set, get) => ({
        flags: {
          darkMode: false,
          newCheckout: true,
          betaFeatures: false,
        },
        isEnabled: (flag) => get().flags[flag] ?? false,
        enable: (flag) =>
          set((draft) => {
            draft.flags[flag] = true
          }),
        disable: (flag) =>
          set((draft) => {
            draft.flags[flag] = false
          }),
        toggle: (flag) =>
          set((draft) => {
            draft.flags[flag] = !draft.flags[flag]
          }),
        setFlags: (flags) => set({ flags }),
      }))
    )

    function FeaturePanel() {
      const darkMode = useFeatureFlags((s) => s.isEnabled('darkMode'))
      const newCheckout = useFeatureFlags((s) => s.isEnabled('newCheckout'))
      const toggle = useFeatureFlags((s) => s.toggle)

      return (
        <div>
          <span data-testid="dark">{darkMode ? 'on' : 'off'}</span>
          <span data-testid="checkout">{newCheckout ? 'on' : 'off'}</span>
          <button onClick={() => toggle('darkMode')}>Toggle Dark</button>
          <button onClick={() => toggle('newCheckout')}>Toggle Checkout</button>
        </div>
      )
    }

    render(<FeaturePanel />)

    expect(screen.getByTestId('dark').textContent).toBe('off')
    expect(screen.getByTestId('checkout').textContent).toBe('on')

    // Toggle dark mode on
    act(() => {
      screen.getByText('Toggle Dark').click()
    })

    expect(screen.getByTestId('dark').textContent).toBe('on')

    // Toggle checkout off
    act(() => {
      screen.getByText('Toggle Checkout').click()
    })

    expect(screen.getByTestId('checkout').textContent).toBe('off')
  })
})

// ============================================================
// REAL-TIME UPDATES (WebSocket Simulation)
// ============================================================

describe('Real-time Updates', () => {
  interface Message {
    id: string
    text: string
    timestamp: number
  }

  interface ChatState {
    messages: Message[]
    isConnected: boolean
    addMessage: (text: string) => void
    receiveMessage: (message: Message) => void
    setConnected: (connected: boolean) => void
    clearMessages: () => void
  }

  it('chat message handling', () => {
    let msgId = 0

    const useChat = create<ChatState>()(
      subscribeWithSelector(
        immer((set) => ({
          messages: [],
          isConnected: false,
          addMessage: (text) =>
            set((draft) => {
              draft.messages.push({
                id: `msg-${++msgId}`,
                text,
                timestamp: Date.now(),
              })
            }),
          receiveMessage: (message) =>
            set((draft) => {
              draft.messages.push(message)
            }),
          setConnected: (connected) => set({ isConnected: connected }),
          clearMessages: () => set({ messages: [] }),
        }))
      )
    )

    // Simulate subscription for new messages
    const messageListener = vi.fn()
    useChat.subscribe(
      (state) => state.messages.length,
      (newLength) => messageListener(newLength)
    )

    function ChatRoom() {
      const messages = useChat((s) => s.messages)
      const isConnected = useChat((s) => s.isConnected)
      const addMessage = useChat((s) => s.addMessage)
      const setConnected = useChat((s) => s.setConnected)

      return (
        <div>
          <span data-testid="status">{isConnected ? 'Connected' : 'Disconnected'}</span>
          <span data-testid="count">{messages.length}</span>
          <ul>
            {messages.map((m) => (
              <li key={m.id} data-testid={m.id}>{m.text}</li>
            ))}
          </ul>
          <button onClick={() => setConnected(true)}>Connect</button>
          <button onClick={() => addMessage('Hello')}>Send</button>
        </div>
      )
    }

    render(<ChatRoom />)

    expect(screen.getByTestId('status').textContent).toBe('Disconnected')
    expect(screen.getByTestId('count').textContent).toBe('0')

    // Connect
    act(() => {
      screen.getByText('Connect').click()
    })

    expect(screen.getByTestId('status').textContent).toBe('Connected')

    // Send messages
    act(() => {
      screen.getByText('Send').click()
      screen.getByText('Send').click()
    })

    expect(screen.getByTestId('count').textContent).toBe('2')
    expect(messageListener).toHaveBeenCalledWith(1)
    expect(messageListener).toHaveBeenCalledWith(2)

    // Simulate receiving external message
    act(() => {
      useChat.getState().receiveMessage({
        id: 'external-1',
        text: 'External message',
        timestamp: Date.now(),
      })
    })

    expect(screen.getByTestId('count').textContent).toBe('3')
    expect(screen.getByTestId('external-1').textContent).toBe('External message')
  })
})

// ============================================================
// COMPLEX STATE SLICE
// ============================================================

describe('Complex State Slice', () => {
  interface User {
    id: string
    name: string
  }

  interface AppState {
    // Auth slice
    user: User | null
    isAuthenticated: boolean

    // UI slice
    sidebarOpen: boolean
    activeTab: string

    // Data slice
    items: string[]

    // Auth actions
    login: (user: User) => void
    logout: () => void

    // UI actions
    toggleSidebar: () => void
    setActiveTab: (tab: string) => void

    // Data actions
    addItem: (item: string) => void
  }

  it('manages multiple state slices', () => {
    const useApp = create<AppState>()(
      immer((set) => ({
        // Auth slice initial state
        user: null,
        isAuthenticated: false,

        // UI slice initial state
        sidebarOpen: true,
        activeTab: 'home',

        // Data slice initial state
        items: [],

        // Auth actions
        login: (user) =>
          set((draft) => {
            draft.user = user
            draft.isAuthenticated = true
          }),
        logout: () =>
          set((draft) => {
            draft.user = null
            draft.isAuthenticated = false
          }),

        // UI actions
        toggleSidebar: () =>
          set((draft) => {
            draft.sidebarOpen = !draft.sidebarOpen
          }),
        setActiveTab: (tab) =>
          set((draft) => {
            draft.activeTab = tab
          }),

        // Data actions
        addItem: (item) =>
          set((draft) => {
            draft.items.push(item)
          }),
      }))
    )

    function App() {
      const isAuth = useApp((s) => s.isAuthenticated)
      const userName = useApp((s) => s.user?.name)
      const sidebarOpen = useApp((s) => s.sidebarOpen)
      const activeTab = useApp((s) => s.activeTab)
      const items = useApp((s) => s.items)
      const login = useApp((s) => s.login)
      const logout = useApp((s) => s.logout)
      const toggleSidebar = useApp((s) => s.toggleSidebar)
      const setActiveTab = useApp((s) => s.setActiveTab)
      const addItem = useApp((s) => s.addItem)

      return (
        <div>
          <span data-testid="auth">{isAuth ? userName : 'Guest'}</span>
          <span data-testid="sidebar">{sidebarOpen ? 'open' : 'closed'}</span>
          <span data-testid="tab">{activeTab}</span>
          <span data-testid="items">{items.length}</span>

          <button onClick={() => login({ id: '1', name: 'John' })}>Login</button>
          <button onClick={logout}>Logout</button>
          <button onClick={toggleSidebar}>Toggle Sidebar</button>
          <button onClick={() => setActiveTab('settings')}>Settings Tab</button>
          <button onClick={() => addItem('new')}>Add Item</button>
        </div>
      )
    }

    render(<App />)

    // Initial state
    expect(screen.getByTestId('auth').textContent).toBe('Guest')
    expect(screen.getByTestId('sidebar').textContent).toBe('open')
    expect(screen.getByTestId('tab').textContent).toBe('home')
    expect(screen.getByTestId('items').textContent).toBe('0')

    // Login
    act(() => {
      screen.getByText('Login').click()
    })
    expect(screen.getByTestId('auth').textContent).toBe('John')

    // Toggle sidebar
    act(() => {
      screen.getByText('Toggle Sidebar').click()
    })
    expect(screen.getByTestId('sidebar').textContent).toBe('closed')

    // Change tab
    act(() => {
      screen.getByText('Settings Tab').click()
    })
    expect(screen.getByTestId('tab').textContent).toBe('settings')

    // Add items
    act(() => {
      screen.getByText('Add Item').click()
      screen.getByText('Add Item').click()
    })
    expect(screen.getByTestId('items').textContent).toBe('2')

    // Logout
    act(() => {
      screen.getByText('Logout').click()
    })
    expect(screen.getByTestId('auth').textContent).toBe('Guest')
  })
})

// ============================================================
// OPTIMISTIC UPDATES
// ============================================================

describe('Optimistic Updates', () => {
  interface Post {
    id: string
    title: string
    likes: number
  }

  interface PostsState {
    posts: Post[]
    optimisticLike: (postId: string) => void
    confirmLike: (postId: string) => void
    revertLike: (postId: string) => void
  }

  it('optimistic like with rollback', async () => {
    const usePosts = create<PostsState>()(
      immer((set) => ({
        posts: [
          { id: '1', title: 'Post 1', likes: 10 },
          { id: '2', title: 'Post 2', likes: 5 },
        ],
        optimisticLike: (postId) =>
          set((draft) => {
            const post = draft.posts.find((p) => p.id === postId)
            if (post) post.likes++
          }),
        confirmLike: () => {
          // In real app, this would be called after API success
        },
        revertLike: (postId) =>
          set((draft) => {
            const post = draft.posts.find((p) => p.id === postId)
            if (post) post.likes--
          }),
      }))
    )

    function PostList() {
      const posts = usePosts((s) => s.posts)
      const optimisticLike = usePosts((s) => s.optimisticLike)
      const revertLike = usePosts((s) => s.revertLike)

      return (
        <ul>
          {posts.map((post) => (
            <li key={post.id}>
              <span data-testid={`likes-${post.id}`}>{post.likes}</span>
              <button onClick={() => optimisticLike(post.id)}>Like {post.id}</button>
              <button onClick={() => revertLike(post.id)}>Revert {post.id}</button>
            </li>
          ))}
        </ul>
      )
    }

    render(<PostList />)

    expect(screen.getByTestId('likes-1').textContent).toBe('10')

    // Optimistic like
    act(() => {
      screen.getByText('Like 1').click()
    })

    expect(screen.getByTestId('likes-1').textContent).toBe('11')

    // Simulate API failure - revert
    act(() => {
      screen.getByText('Revert 1').click()
    })

    expect(screen.getByTestId('likes-1').textContent).toBe('10')
  })
})

// ============================================================
// DEBOUNCED SEARCH
// ============================================================

describe('Debounced Search', () => {
  interface SearchState {
    query: string
    results: string[]
    isSearching: boolean
    setQuery: (query: string) => void
    search: () => Promise<void>
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounced search input', async () => {
    const mockSearch = vi.fn().mockResolvedValue(['result1', 'result2'])

    const useSearch = create<SearchState>()((set, get) => ({
      query: '',
      results: [],
      isSearching: false,
      setQuery: (query) => set({ query }),
      search: async () => {
        const query = get().query
        if (!query) {
          set({ results: [] })
          return
        }
        set({ isSearching: true })
        const results = await mockSearch(query)
        set({ results, isSearching: false })
      },
    }))

    function SearchBox() {
      const query = useSearch((s) => s.query)
      const results = useSearch((s) => s.results)
      const isSearching = useSearch((s) => s.isSearching)
      const setQuery = useSearch((s) => s.setQuery)
      const search = useSearch((s) => s.search)

      // Debounce effect simulation
      useEffect(() => {
        const timer = setTimeout(() => {
          search()
        }, 300)
        return () => clearTimeout(timer)
      }, [query, search])

      return (
        <div>
          <span data-testid="query">{query}</span>
          <span data-testid="results">{results.join(',')}</span>
          <span data-testid="searching">{isSearching ? 'yes' : 'no'}</span>
          <button onClick={() => setQuery('test')}>Search Test</button>
          <button onClick={() => setQuery('another')}>Search Another</button>
        </div>
      )
    }

    render(<SearchBox />)

    expect(screen.getByTestId('results').textContent).toBe('')

    // Type search query
    act(() => {
      screen.getByText('Search Test').click()
    })

    expect(screen.getByTestId('query').textContent).toBe('test')
    expect(mockSearch).not.toHaveBeenCalled()

    // Wait for debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350)
    })

    expect(mockSearch).toHaveBeenCalledWith('test')
    expect(screen.getByTestId('results').textContent).toBe('result1,result2')
  })
})
