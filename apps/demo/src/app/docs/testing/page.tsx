import { CodeBlock } from '@/components/CodeBlock'

const setupExample = `// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})`

const basicTestExample = `import { describe, it, expect, beforeEach } from 'vitest'
import { createStore } from 'zustand-lite'

// Создаём store для тестирования
const createCounterStore = () =>
  createStore((set) => ({
    count: 0,
    increment: () => set((s) => ({ count: s.count + 1 })),
    decrement: () => set((s) => ({ count: s.count - 1 })),
    reset: () => set({ count: 0 }),
  }))

describe('CounterStore', () => {
  let store: ReturnType<typeof createCounterStore>

  beforeEach(() => {
    // Свежий store для каждого теста
    store = createCounterStore()
  })

  it('should have initial count of 0', () => {
    expect(store.getState().count).toBe(0)
  })

  it('should increment count', () => {
    store.getState().increment()
    expect(store.getState().count).toBe(1)
  })

  it('should decrement count', () => {
    store.getState().increment()
    store.getState().increment()
    store.getState().decrement()
    expect(store.getState().count).toBe(1)
  })

  it('should reset count', () => {
    store.getState().increment()
    store.getState().reset()
    expect(store.getState().count).toBe(0)
  })
})`

const resetStoreExample = `import { create } from 'zustand-lite'
import { beforeEach } from 'vitest'

// Store с методом сброса
interface StoreState {
  count: number
  items: string[]
  increment: () => void
}

const initialState = {
  count: 0,
  items: [],
}

const useStore = create<StoreState>((set) => ({
  ...initialState,
  increment: () => set((s) => ({ count: s.count + 1 })),
}))

// Сброс перед каждым тестом
beforeEach(() => {
  useStore.setState(initialState, true) // true = replace
})`

const componentTestExample = `import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { create } from 'zustand-lite'

// Store
interface CounterState {
  count: number
  increment: () => void
}

const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}))

// Компонент
function Counter() {
  const count = useCounterStore((s) => s.count)
  const increment = useCounterStore((s) => s.increment)
  return (
    <div>
      <span data-testid="count">{count}</span>
      <button onClick={increment}>+</button>
    </div>
  )
}

// Тесты
describe('Counter Component', () => {
  beforeEach(() => {
    useCounterStore.setState({ count: 0 }, true)
  })

  it('renders count', () => {
    render(<Counter />)
    expect(screen.getByTestId('count')).toHaveTextContent('0')
  })

  it('increments on click', () => {
    render(<Counter />)
    fireEvent.click(screen.getByText('+'))
    expect(screen.getByTestId('count')).toHaveTextContent('1')
  })
})`

const mockPersistExample = `import { describe, it, expect, beforeEach, vi } from 'vitest'
import { create } from 'zustand-lite'
import { persist, createJSONStorage } from 'zustand-lite/middleware'

// Mock localStorage
const mockStorage: Record<string, string> = {}

const storageMock = {
  getItem: vi.fn((key) => mockStorage[key] || null),
  setItem: vi.fn((key, value) => { mockStorage[key] = value }),
  removeItem: vi.fn((key) => { delete mockStorage[key] }),
}

// Store с persist
const useStore = create(
  persist(
    (set) => ({
      count: 0,
      increment: () => set((s) => ({ count: s.count + 1 })),
    }),
    {
      name: 'test-store',
      storage: createJSONStorage(() => storageMock as Storage),
    }
  )
)

describe('Persist Store', () => {
  beforeEach(() => {
    // Очистка
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])
    vi.clearAllMocks()
    useStore.setState({ count: 0 }, true)
  })

  it('should persist state', async () => {
    useStore.getState().increment()

    // Дождаться debounce
    await new Promise(resolve => setTimeout(resolve, 150))

    expect(storageMock.setItem).toHaveBeenCalled()
  })

  it('should restore state from storage', async () => {
    // Pre-fill storage
    mockStorage['test-store'] = JSON.stringify({
      state: { count: 5 },
      version: 0,
    })

    // Rehydrate
    await useStore.persist.rehydrate()

    expect(useStore.getState().count).toBe(5)
  })
})`

const asyncActionsExample = `import { describe, it, expect, vi } from 'vitest'
import { createStore } from 'zustand-lite'

// Store с async actions
const createUserStore = () =>
  createStore((set) => ({
    user: null,
    isLoading: false,
    error: null,
    fetchUser: async (id: string) => {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch(\`/api/users/\${id}\`)
        const user = await response.json()
        set({ user, isLoading: false })
      } catch (error) {
        set({ error: 'Failed to fetch', isLoading: false })
      }
    },
  }))

describe('UserStore', () => {
  it('should fetch user', async () => {
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ id: '1', name: 'John' }),
    })

    const store = createUserStore()

    await store.getState().fetchUser('1')

    expect(store.getState().user).toEqual({ id: '1', name: 'John' })
    expect(store.getState().isLoading).toBe(false)
  })

  it('should handle error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const store = createUserStore()

    await store.getState().fetchUser('1')

    expect(store.getState().error).toBe('Failed to fetch')
    expect(store.getState().isLoading).toBe(false)
  })
})`

const subscriptionTestExample = `import { describe, it, expect, vi } from 'vitest'
import { createStore } from 'zustand-lite'

describe('Store subscriptions', () => {
  it('should notify subscribers', () => {
    const store = createStore((set) => ({
      count: 0,
      increment: () => set((s) => ({ count: s.count + 1 })),
    }))

    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)

    store.getState().increment()

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(
      { count: 1, increment: expect.any(Function) },
      { count: 0, increment: expect.any(Function) }
    )

    unsubscribe()
  })

  it('should not notify after unsubscribe', () => {
    const store = createStore((set) => ({
      count: 0,
      increment: () => set((s) => ({ count: s.count + 1 })),
    }))

    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)

    unsubscribe()
    store.getState().increment()

    expect(listener).not.toHaveBeenCalled()
  })
})`

export default function TestingPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        Тестирование
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
        Как тестировать stores и компоненты с zustand-lite.
      </p>

      {/* Setup */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Настройка
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Рекомендуем использовать <strong>Vitest</strong> с <strong>@testing-library/react</strong>:
        </p>
        <CodeBlock
          code="pnpm add -D vitest @testing-library/react @vitejs/plugin-react jsdom"
          language="bash"
          title="terminal"
          showLineNumbers={false}
        />
        <CodeBlock code={setupExample} title="vitest.config.ts" className="mt-4" />
      </section>

      {/* Basic Store Testing */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Тестирование store
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Создавайте свежий store для каждого теста:
        </p>
        <CodeBlock code={basicTestExample} title="counter.test.ts" />
      </section>

      {/* Reset Store */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Сброс между тестами
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Для глобального store используйте <code className="text-primary-600 dark:text-primary-400">setState</code> с{' '}
          <code className="text-primary-600 dark:text-primary-400">replace: true</code>:
        </p>
        <CodeBlock code={resetStoreExample} title="reset-store.ts" />
      </section>

      {/* Component Testing */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Тестирование компонентов
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Используйте <code className="text-primary-600 dark:text-primary-400">@testing-library/react</code>:
        </p>
        <CodeBlock code={componentTestExample} title="Counter.test.tsx" />
      </section>

      {/* Mock Persist */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Мокирование persist
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Создайте mock storage для тестирования persist:
        </p>
        <CodeBlock code={mockPersistExample} title="persist.test.ts" />
      </section>

      {/* Async Actions */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Async actions
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Тестирование асинхронных действий:
        </p>
        <CodeBlock code={asyncActionsExample} title="async.test.ts" />
      </section>

      {/* Subscriptions */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Тестирование подписок
        </h2>
        <CodeBlock code={subscriptionTestExample} title="subscriptions.test.ts" />
      </section>

      {/* Tips */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Советы
        </h2>
        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
          <li>
            <strong>Изолируйте тесты</strong> — создавайте store в beforeEach или используйте setState
          </li>
          <li>
            <strong>Тестируйте поведение</strong>, а не реализацию
          </li>
          <li>
            <strong>Мокируйте внешние зависимости</strong> (fetch, localStorage)
          </li>
          <li>
            <strong>Используйте factory functions</strong> для создания stores в тестах
          </li>
          <li>
            <strong>Не забывайте про cleanup</strong> — отписывайтесь от подписок
          </li>
        </ul>
      </section>

      {/* See Also */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          См. также
        </h2>
        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
          <li>
            <a href="/docs/api/create-store" className="text-primary-600 dark:text-primary-400 hover:underline">
              createStore
            </a> — создание vanilla store для тестов
          </li>
          <li>
            <a href="/docs/middleware/persist" className="text-primary-600 dark:text-primary-400 hover:underline">
              persist
            </a> — тестирование persist middleware
          </li>
          <li>
            <a
              href="https://vitest.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              Vitest Documentation ↗
            </a>
          </li>
        </ul>
      </section>
    </div>
  )
}
