import { CodeBlock } from '@/components/CodeBlock'
import { PropsTable, type PropDefinition } from '@/components/docs/PropsTable'

const signatureCode = `function create<T>(): <Mos extends [StoreMutatorIdentifier, unknown][] = []>(
  initializer: StateCreator<T, [], Mos>
) => UseBoundStore<Mutate<StoreApi<T>, Mos>>

// Или напрямую
function create<T>(
  initializer: StateCreator<T>
): UseBoundStore<StoreApi<T>>`

const basicExample = `import { create } from 'zustand-lite'

const useStore = create((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}))`

const typedExample = `import { create } from 'zustand-lite'

interface BearState {
  bears: number
  increase: (by: number) => void
  reset: () => void
}

const useBearStore = create<BearState>()((set) => ({
  bears: 0,
  increase: (by) => set((s) => ({ bears: s.bears + by })),
  reset: () => set({ bears: 0 }),
}))`

const selectorExample = `// Получить всё состояние (ререндер при любом изменении)
const state = useStore()

// Получить часть состояния (ререндер только при изменении count)
const count = useStore((s) => s.count)

// Получить несколько значений с shallow сравнением
import { shallow } from 'zustand-lite'
const { count, name } = useStore(
  (s) => ({ count: s.count, name: s.name }),
  shallow
)`

const apiAccessExample = `const useStore = create((set) => ({ count: 0 }))

// Доступ к store API вне компонентов
useStore.getState()           // { count: 0 }
useStore.setState({ count: 1 })
useStore.subscribe((state) => console.log(state))
useStore.getInitialState()    // { count: 0 }
useStore.destroy()            // Очистка подписок`

const setStateParams: PropDefinition[] = [
  {
    name: 'partial',
    type: 'Partial<T> | ((state: T) => Partial<T>)',
    required: true,
    description: 'Частичное обновление или функция-обновитель',
  },
  {
    name: 'replace',
    type: 'boolean',
    default: 'false',
    description: 'Заменить состояние целиком вместо слияния',
  },
]

const returnedHookParams: PropDefinition[] = [
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

export default function CreatePage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        create
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
        Создаёт React store с хуком для использования в компонентах.
      </p>

      {/* Signature */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Сигнатура
        </h2>
        <CodeBlock code={signatureCode} title="types.ts" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Функция <code className="text-primary-600 dark:text-primary-400">create</code> поддерживает
          два паттерна вызова: каррированный для явного указания типов и прямой с выводом типов.
        </p>
      </section>

      {/* Basic Usage */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Базовое использование
        </h2>
        <CodeBlock code={basicExample} title="store.ts" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Функция <code className="text-primary-600 dark:text-primary-400">set</code> принимает
          объект или функцию-обновитель. При передаче функции она получает текущее состояние
          и должна вернуть объект с обновлёнными полями.
        </p>
      </section>

      {/* With TypeScript */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          С TypeScript
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Для явного указания типа состояния используйте каррированный паттерн{' '}
          <code className="text-primary-600 dark:text-primary-400">create&lt;T&gt;()()</code>:
        </p>
        <CodeBlock code={typedExample} title="typed-store.ts" />
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            <strong>Важно:</strong> Обратите внимание на двойной вызов <code>create&lt;BearState&gt;()()</code>.
            Это необходимо для корректного вывода типов при использовании middleware.
          </p>
        </div>
      </section>

      {/* Selectors */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Селекторы
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Хук принимает селектор для выбора части состояния. Это оптимизирует ререндеры:
        </p>
        <CodeBlock code={selectorExample} title="selectors.ts" />
        <PropsTable props={returnedHookParams} title="Параметры хука" />
      </section>

      {/* setState */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          setState
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Функция <code className="text-primary-600 dark:text-primary-400">set</code> в инициализаторе
          это алиас для <code>setState</code>:
        </p>
        <PropsTable props={setStateParams} title="Параметры setState" />
      </section>

      {/* API Access */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Доступ к Store API
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Возвращённый хук также предоставляет методы для работы со store вне React:
        </p>
        <CodeBlock code={apiAccessExample} title="api-access.ts" />
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
            </a> — vanilla store без React
          </li>
          <li>
            <a href="/docs/api/use-store" className="text-primary-600 dark:text-primary-400 hover:underline">
              useStore
            </a> — хук для работы с внешним store
          </li>
          <li>
            <a href="/docs/middleware" className="text-primary-600 dark:text-primary-400 hover:underline">
              Middleware
            </a> — расширение функциональности store
          </li>
        </ul>
      </section>
    </div>
  )
}
