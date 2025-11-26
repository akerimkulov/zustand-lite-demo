import { CodeBlock } from '@/components/CodeBlock'
import { PropsTable, type PropDefinition } from '@/components/docs/PropsTable'

const signatureCode = `function createStore<T>(): <Mos extends [StoreMutatorIdentifier, unknown][] = []>(
  initializer: StateCreator<T, [], Mos>
) => Mutate<StoreApi<T>, Mos>

// Или напрямую
function createStore<T>(
  initializer: StateCreator<T>
): StoreApi<T>`

const basicExample = `import { createStore } from 'zustand-lite'

const store = createStore((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}))

// Использование
store.getState()     // { count: 0, increment: fn }
store.setState({ count: 5 })
store.subscribe((state) => console.log('Changed:', state))`

const withReactExample = `import { createStore, useStore } from 'zustand-lite'

// Создаём vanilla store
const counterStore = createStore((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}))

// Используем в React через useStore
function Counter() {
  const count = useStore(counterStore, (s) => s.count)
  const increment = useStore(counterStore, (s) => s.increment)
  return <button onClick={increment}>{count}</button>
}`

const subscribeExample = `const store = createStore((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}))

// Подписка на изменения
const unsubscribe = store.subscribe((state, prevState) => {
  console.log('State changed from', prevState, 'to', state)
})

// Отписка
unsubscribe()`

const outsideReactExample = `// store.ts
import { createStore } from 'zustand-lite'

export const authStore = createStore((set) => ({
  token: null,
  setToken: (token) => set({ token }),
  logout: () => set({ token: null }),
}))

// api.ts - использование вне React
import { authStore } from './store'

export async function fetchWithAuth(url: string) {
  const { token } = authStore.getState()
  return fetch(url, {
    headers: { Authorization: \`Bearer \${token}\` }
  })
}

// При логине
authStore.getState().setToken('jwt-token')`

const storeApiProps: PropDefinition[] = [
  {
    name: 'getState',
    type: '() => T',
    required: true,
    description: 'Возвращает текущее состояние',
  },
  {
    name: 'getInitialState',
    type: '() => T',
    required: true,
    description: 'Возвращает начальное состояние',
  },
  {
    name: 'setState',
    type: '(partial, replace?) => void',
    required: true,
    description: 'Обновляет состояние',
  },
  {
    name: 'subscribe',
    type: '(listener) => unsubscribe',
    required: true,
    description: 'Подписывается на изменения состояния',
  },
  {
    name: 'destroy',
    type: '() => void',
    required: true,
    description: 'Удаляет все подписки',
  },
]

export default function CreateStorePage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        createStore
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
        Создаёт vanilla store без привязки к React.
      </p>

      {/* Signature */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Сигнатура
        </h2>
        <CodeBlock code={signatureCode} title="types.ts" />
      </section>

      {/* Basic Usage */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Базовое использование
        </h2>
        <CodeBlock code={basicExample} title="vanilla-store.ts" />
      </section>

      {/* Store API */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Store API
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Возвращаемый объект <code className="text-primary-600 dark:text-primary-400">StoreApi</code>:
        </p>
        <PropsTable props={storeApiProps} title="Методы StoreApi" />
      </section>

      {/* With React */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          С React
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Используйте <code className="text-primary-600 dark:text-primary-400">useStore</code> для
          подключения vanilla store к React-компонентам:
        </p>
        <CodeBlock code={withReactExample} title="with-react.tsx" />
      </section>

      {/* Subscribe */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Подписки
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Метод <code className="text-primary-600 dark:text-primary-400">subscribe</code> позволяет
          отслеживать изменения состояния:
        </p>
        <CodeBlock code={subscribeExample} title="subscribe.ts" />
      </section>

      {/* Outside React */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Вне React
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Главное преимущество <code className="text-primary-600 dark:text-primary-400">createStore</code> —
          возможность работать со store из любого места приложения:
        </p>
        <CodeBlock code={outsideReactExample} title="outside-react.ts" />
      </section>

      {/* When to Use */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Когда использовать
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              ✓ Используйте createStore
            </h3>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>• Нужен доступ к store вне React</li>
              <li>• Работа с SSR (per-request stores)</li>
              <li>• Интеграция с не-React кодом</li>
              <li>• Store создаётся динамически</li>
            </ul>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              → Используйте create
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Простое React-приложение</li>
              <li>• Store используется только в компонентах</li>
              <li>• Не нужен доступ вне React</li>
            </ul>
          </div>
        </div>
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
            <a href="/docs/api/use-store" className="text-primary-600 dark:text-primary-400 hover:underline">
              useStore
            </a> — хук для подключения к vanilla store
          </li>
          <li>
            <a href="/docs/ssr" className="text-primary-600 dark:text-primary-400 hover:underline">
              SSR
            </a> — серверный рендеринг
          </li>
        </ul>
      </section>
    </div>
  )
}
