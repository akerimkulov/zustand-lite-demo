import { CodeBlock } from '@/components/CodeBlock'
import { PropsTable, type PropDefinition } from '@/components/docs/PropsTable'

const signatureCode = `function useStore<S extends StoreApi<unknown>>(
  api: S
): ExtractState<S>

function useStore<S extends StoreApi<unknown>, U>(
  api: S,
  selector: (state: ExtractState<S>) => U
): U

function useStore<S extends StoreApi<unknown>, U>(
  api: S,
  selector: (state: ExtractState<S>) => U,
  equalityFn: (a: U, b: U) => boolean
): U`

const basicExample = `import { useStore, createStore } from 'zustand-lite'

// Создаём vanilla store
const store = createStore((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}))

function Counter() {
  // Используем store в компоненте
  const count = useStore(store, (s) => s.count)
  const increment = useStore(store, (s) => s.increment)

  return <button onClick={increment}>{count}</button>
}`

const withoutSelectorExample = `// Получить всё состояние (ререндер при любом изменении)
const state = useStore(store)

// Эквивалентно:
const state = useStore(store, (s) => s)`

const customEqualityExample = `import { useStore, shallow } from 'zustand-lite'

// Выбрать несколько полей с shallow сравнением
const { count, name } = useStore(
  store,
  (s) => ({ count: s.count, name: s.name }),
  shallow
)

// Кастомная функция сравнения
const items = useStore(
  store,
  (s) => s.items,
  (a, b) => a.length === b.length
)`

const multipleStoresExample = `import { useStore, createStore } from 'zustand-lite'

const userStore = createStore((set) => ({
  name: 'John',
  setName: (name) => set({ name }),
}))

const settingsStore = createStore((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
}))

function UserSettings() {
  const name = useStore(userStore, (s) => s.name)
  const theme = useStore(settingsStore, (s) => s.theme)

  return (
    <div>
      <p>User: {name}</p>
      <p>Theme: {theme}</p>
    </div>
  )
}`

const params: PropDefinition[] = [
  {
    name: 'api',
    type: 'StoreApi<T>',
    required: true,
    description: 'Store API, созданный через createStore',
  },
  {
    name: 'selector',
    type: '(state: T) => U',
    description: 'Функция для выбора части состояния',
  },
  {
    name: 'equalityFn',
    type: '(a: U, b: U) => boolean',
    default: 'Object.is',
    description: 'Функция сравнения для определения необходимости ререндера',
  },
]

export default function UseStorePage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        useStore
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
        Хук для подключения React-компонента к vanilla store.
      </p>

      {/* Signature */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Сигнатура
        </h2>
        <CodeBlock code={signatureCode} title="types.ts" />
      </section>

      {/* Parameters */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Параметры
        </h2>
        <PropsTable props={params} />
      </section>

      {/* Basic Usage */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Базовое использование
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          <code className="text-primary-600 dark:text-primary-400">useStore</code> подключает
          React-компонент к store, созданному через{' '}
          <code className="text-primary-600 dark:text-primary-400">createStore</code>:
        </p>
        <CodeBlock code={basicExample} title="example.tsx" />
      </section>

      {/* Without Selector */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Без селектора
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Если не передать селектор, возвращается всё состояние:
        </p>
        <CodeBlock code={withoutSelectorExample} title="no-selector.ts" />
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            <strong>Внимание:</strong> Без селектора компонент будет перерендериваться
            при любом изменении состояния. Используйте селекторы для оптимизации.
          </p>
        </div>
      </section>

      {/* Custom Equality */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Кастомное сравнение
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Используйте <code className="text-primary-600 dark:text-primary-400">shallow</code> или
          кастомную функцию для сравнения объектов:
        </p>
        <CodeBlock code={customEqualityExample} title="custom-equality.ts" />
      </section>

      {/* Multiple Stores */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Несколько stores
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          <code className="text-primary-600 dark:text-primary-400">useStore</code> позволяет
          использовать несколько stores в одном компоненте:
        </p>
        <CodeBlock code={multipleStoresExample} title="multiple-stores.tsx" />
      </section>

      {/* When to Use */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Когда использовать
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Используйте <code className="text-primary-600 dark:text-primary-400">useStore</code> когда:
        </p>
        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
          <li>Store создаётся динамически (например, в контексте)</li>
          <li>Нужно подключиться к vanilla store без хука</li>
          <li>Store передаётся как prop</li>
          <li>Работаете с SSR и нужен per-request store</li>
        </ul>
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
            </a> — создаёт store с встроенным хуком
          </li>
          <li>
            <a href="/docs/api/create-store" className="text-primary-600 dark:text-primary-400 hover:underline">
              createStore
            </a> — создаёт vanilla store
          </li>
          <li>
            <a href="/docs/ssr" className="text-primary-600 dark:text-primary-400 hover:underline">
              SSR
            </a> — использование с серверным рендерингом
          </li>
        </ul>
      </section>
    </div>
  )
}
