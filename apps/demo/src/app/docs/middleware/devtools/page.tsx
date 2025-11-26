import { CodeBlock } from '@/components/CodeBlock'
import { PropsTable, type PropDefinition } from '@/components/docs/PropsTable'

const basicExample = `import { create } from 'zustand-lite'
import { devtools } from 'zustand-lite/middleware'

const useStore = create(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((s) => ({ count: s.count + 1 })),
    }),
    { name: 'CounterStore' }
  )
)`

const namedActionsExample = `const useStore = create(
  devtools(
    (set) => ({
      count: 0,
      // Именованные actions для лучшей читаемости в DevTools
      increment: () => set(
        (s) => ({ count: s.count + 1 }),
        false,          // replace = false
        'increment'     // action name
      ),
      decrement: () => set(
        (s) => ({ count: s.count - 1 }),
        false,
        'decrement'
      ),
      reset: () => set(
        { count: 0 },
        true,           // replace = true (полная замена)
        'reset'
      ),
    }),
    { name: 'CounterStore' }
  )
)`

const withMiddlewareExample = `import { create } from 'zustand-lite'
import { devtools, persist, immer } from 'zustand-lite/middleware'

// devtools должен быть снаружи для корректной работы
const useStore = create<State>()(
  devtools(
    persist(
      immer((set) => ({
        todos: [],
        addTodo: (text) => set((draft) => {
          draft.todos.push({ id: Date.now(), text, done: false })
        }),
      })),
      { name: 'todos' }
    ),
    { name: 'TodoStore' }
  )
)`

const conditionalExample = `const useStore = create(
  devtools(
    (set) => ({ ... }),
    {
      name: 'MyStore',
      // Включаем только в development
      enabled: process.env.NODE_ENV !== 'production',
    }
  )
)`

const sendExample = `const useStore = create(
  devtools(
    (set, get, api) => ({
      items: [],
      fetchItems: async () => {
        // Отправить кастомный action в DevTools
        api.devtools?.send('fetchItems/pending', { loading: true })

        const items = await fetch('/api/items').then(r => r.json())

        set({ items })
        api.devtools?.send('fetchItems/fulfilled', { items })
      },
    }),
    { name: 'ItemsStore' }
  )
)`

const options: PropDefinition[] = [
  {
    name: 'name',
    type: 'string',
    default: 'anonymous',
    description: 'Имя store в DevTools',
  },
  {
    name: 'enabled',
    type: 'boolean',
    default: 'true (dev)',
    description: 'Включить/выключить интеграцию',
  },
  {
    name: 'anonymousActionType',
    type: 'string',
    default: 'anonymous',
    description: 'Имя для action без явного имени',
  },
  {
    name: 'maxAge',
    type: 'number',
    default: '50',
    description: 'Максимальное количество actions в истории',
  },
  {
    name: 'latency',
    type: 'number',
    default: '500',
    description: 'Задержка батчинга actions (мс)',
  },
  {
    name: 'serialize',
    type: 'object',
    description: 'Настройки сериализации (для Map, Set и т.д.)',
  },
  {
    name: 'stateSanitizer',
    type: '(state) => state',
    description: 'Трансформация состояния перед отправкой',
  },
  {
    name: 'actionSanitizer',
    type: '(action) => action',
    description: 'Трансформация action перед отправкой',
  },
]

export default function DevtoolsPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        devtools
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
        Интеграция с Redux DevTools для отладки состояния.
      </p>

      {/* Prerequisites */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Требования
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Установите расширение Redux DevTools для вашего браузера:
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Chrome
          </a>
          <a
            href="https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Firefox
          </a>
          <a
            href="https://microsoftedge.microsoft.com/addons/detail/redux-devtools/nnkgneoiohoecpdiaponcejilbhhikei"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Edge
          </a>
        </div>
      </section>

      {/* Basic Usage */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Базовое использование
        </h2>
        <CodeBlock code={basicExample} title="basic.ts" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          После этого вы увидите store в Redux DevTools с именем "CounterStore".
        </p>
      </section>

      {/* Options */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Опции
        </h2>
        <PropsTable props={options} />
      </section>

      {/* Named Actions */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Именованные actions
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Для лучшей читаемости истории передавайте имя action третьим аргументом в{' '}
          <code className="text-primary-600 dark:text-primary-400">set()</code>:
        </p>
        <CodeBlock code={namedActionsExample} title="named-actions.ts" />
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            <strong>Совет:</strong> Именованные actions помогают понять, какое действие
            изменило состояние при просмотре истории в DevTools.
          </p>
        </div>
      </section>

      {/* With Other Middleware */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          С другими middleware
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          <code className="text-primary-600 dark:text-primary-400">devtools</code> должен быть
          <strong> внешним</strong> middleware для корректной работы:
        </p>
        <CodeBlock code={withMiddlewareExample} title="with-middleware.ts" />
      </section>

      {/* Conditional */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Условное включение
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Отключайте DevTools в production для безопасности и производительности:
        </p>
        <CodeBlock code={conditionalExample} title="conditional.ts" />
      </section>

      {/* Custom Actions */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Кастомные actions
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Используйте <code className="text-primary-600 dark:text-primary-400">api.devtools?.send()</code> для
          отправки кастомных actions:
        </p>
        <CodeBlock code={sendExample} title="custom-actions.ts" />
      </section>

      {/* Features */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Возможности DevTools
        </h2>
        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
          <li>
            <strong>Time-travel debugging</strong> — переходите между состояниями
          </li>
          <li>
            <strong>Jump to action</strong> — прыгайте к конкретному action
          </li>
          <li>
            <strong>State inspection</strong> — просматривайте состояние в реальном времени
          </li>
          <li>
            <strong>Action replay</strong> — воспроизводите последовательность actions
          </li>
          <li>
            <strong>Commit/Reset</strong> — фиксируйте текущее состояние или сбрасывайте
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
            <a href="/docs/middleware" className="text-primary-600 dark:text-primary-400 hover:underline">
              Middleware
            </a> — композиция middleware
          </li>
          <li>
            <a href="/docs/middleware/persist" className="text-primary-600 dark:text-primary-400 hover:underline">
              persist
            </a> — сохранение состояния
          </li>
        </ul>
      </section>
    </div>
  )
}
