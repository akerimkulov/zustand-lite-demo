import { CodeBlock } from '@/components/CodeBlock'

const basicExample = `import { create } from 'zustand-lite'
import { combine } from 'zustand-lite/middleware'

const useStore = create(
  combine(
    // Начальное состояние — типы выводятся автоматически
    { count: 0, name: 'Counter' },

    // Действия — получают set, get
    (set, get) => ({
      increment: () => set({ count: get().count + 1 }),
      decrement: () => set({ count: get().count - 1 }),
      reset: () => set({ count: 0 }),
    })
  )
)

// Результирующий тип:
// {
//   count: number
//   name: string
//   increment: () => void
//   decrement: () => void
//   reset: () => void
// }`

const comparisonExample = `// ❌ Без combine — нужно явно указывать тип
interface State {
  count: number
  name: string
  increment: () => void
  decrement: () => void
}

const useStore = create<State>()((set, get) => ({
  count: 0,
  name: 'Counter',
  increment: () => set({ count: get().count + 1 }),
  decrement: () => set({ count: get().count - 1 }),
}))

// ✅ С combine — типы выводятся из начального состояния
const useStore = create(
  combine(
    { count: 0, name: 'Counter' },
    (set, get) => ({
      increment: () => set({ count: get().count + 1 }),
      decrement: () => set({ count: get().count - 1 }),
    })
  )
)`

const withMiddlewareExample = `import { create } from 'zustand-lite'
import { devtools, persist, combine } from 'zustand-lite/middleware'

const useStore = create(
  devtools(
    persist(
      combine(
        { user: null, token: null },
        (set) => ({
          login: (user, token) => set({ user, token }),
          logout: () => set({ user: null, token: null }),
        })
      ),
      { name: 'auth' }
    ),
    { name: 'AuthStore' }
  )
)`

const complexExample = `// Для сложных типов combine менее полезен
interface User {
  id: string
  name: string
  email: string
}

// Лучше использовать явную типизацию
interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  token: null,
  isLoading: false,
  login: async (email, password) => {
    set({ isLoading: true })
    const { user, token } = await api.login(email, password)
    set({ user, token, isLoading: false })
  },
  logout: () => set({ user: null, token: null }),
}))`

export default function CombinePage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        combine
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
        Разделяет начальное состояние и действия для автоматического вывода типов.
      </p>

      {/* Basic Usage */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Базовое использование
        </h2>
        <CodeBlock code={basicExample} title="basic.ts" />
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-200 text-sm">
            <strong>Преимущество:</strong> Типы <code>count</code> и <code>name</code> выводятся
            из литералов объекта автоматически.
          </p>
        </div>
      </section>

      {/* Comparison */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Сравнение
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          <code className="text-primary-600 dark:text-primary-400">combine</code> избавляет
          от необходимости писать интерфейс вручную:
        </p>
        <CodeBlock code={comparisonExample} title="comparison.ts" />
      </section>

      {/* How It Works */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Как работает
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          <code className="text-primary-600 dark:text-primary-400">combine</code> принимает два аргумента:
        </p>
        <ol className="list-decimal list-inside text-gray-600 dark:text-gray-400 space-y-2 mb-4">
          <li>
            <strong>Начальное состояние</strong> — объект с данными. TypeScript выводит типы из значений.
          </li>
          <li>
            <strong>Функция действий</strong> — получает <code>(set, get, api)</code> и возвращает методы.
          </li>
        </ol>
        <p className="text-gray-600 dark:text-gray-400">
          Результат — объединение состояния и действий с правильными типами.
        </p>
      </section>

      {/* With Middleware */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          С другими middleware
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          <code className="text-primary-600 dark:text-primary-400">combine</code> работает
          с другими middleware:
        </p>
        <CodeBlock code={withMiddlewareExample} title="with-middleware.ts" />
      </section>

      {/* When to Use */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Когда использовать
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              ✓ Хорошо подходит
            </h3>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>• Простые stores с примитивами</li>
              <li>• Прототипирование</li>
              <li>• Когда лень писать типы</li>
              <li>• Небольшие stores</li>
            </ul>
          </div>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              ⚠ Лучше явные типы
            </h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Сложные вложенные типы</li>
              <li>• Union types, generics</li>
              <li>• Nullable поля</li>
              <li>• Документируемый API</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Complex Types */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Сложные типы
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Для сложных типов <code className="text-primary-600 dark:text-primary-400">combine</code> менее
          полезен — лучше использовать явную типизацию:
        </p>
        <CodeBlock code={complexExample} title="complex-types.ts" />
      </section>

      {/* See Also */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          См. также
        </h2>
        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
          <li>
            <a href="/docs/api/create" className="text-primary-600 dark:text-primary-400 hover:underline">
              create
            </a> — типизация без combine
          </li>
          <li>
            <a href="/docs/middleware" className="text-primary-600 dark:text-primary-400 hover:underline">
              Middleware
            </a> — другие middleware
          </li>
        </ul>
      </section>
    </div>
  )
}
