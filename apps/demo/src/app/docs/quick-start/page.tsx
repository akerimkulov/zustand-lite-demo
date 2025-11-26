'use client'

import { CodeBlock } from '@/components/CodeBlock'
import { LiveDemo } from '@/components/docs/LiveDemo'
import { CounterDemo, useResetCounterDemo } from '@/components/docs/demos/CounterDemo'

const step1Code = `import { create } from 'zustand-lite'

// Создаём store с типами
interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
  decrement: () => set((s) => ({ count: s.count - 1 })),
  reset: () => set({ count: 0 }),
}))`

const step2Code = `function Counter() {
  // Используем селектор для оптимизации ререндеров
  const count = useCounterStore((s) => s.count)
  const increment = useCounterStore((s) => s.increment)
  const decrement = useCounterStore((s) => s.decrement)

  return (
    <div>
      <span>{count}</span>
      <button onClick={decrement}>-</button>
      <button onClick={increment}>+</button>
    </div>
  )
}`

const fullCode = `import { create } from 'zustand-lite'

interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
  decrement: () => set((s) => ({ count: s.count - 1 })),
  reset: () => set({ count: 0 }),
}))

function Counter() {
  const count = useCounterStore((s) => s.count)
  const increment = useCounterStore((s) => s.increment)
  const decrement = useCounterStore((s) => s.decrement)
  const reset = useCounterStore((s) => s.reset)

  return (
    <div className="text-center">
      <div className="text-5xl font-bold">{count}</div>
      <div className="flex gap-2 justify-center mt-4">
        <button onClick={decrement}>−</button>
        <button onClick={reset}>Сброс</button>
        <button onClick={increment}>+</button>
      </div>
    </div>
  )
}`

const selectorsCode = `// ❌ Плохо: компонент ререндерится при любом изменении
const state = useCounterStore()

// ✅ Хорошо: ререндер только при изменении count
const count = useCounterStore((s) => s.count)

// ✅ Хорошо: несколько селекторов
const count = useCounterStore((s) => s.count)
const increment = useCounterStore((s) => s.increment)`

const actionsCode = `const useCounterStore = create((set, get) => ({
  count: 0,

  // Простое обновление
  increment: () => set((state) => ({ count: state.count + 1 })),

  // Использование get() для доступа к текущему состоянию
  double: () => set({ count: get().count * 2 }),

  // Полная замена состояния
  reset: () => set({ count: 0 }, true), // true = replace
}))`

export default function QuickStartPage() {
  const resetCounter = useResetCounterDemo()

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        Быстрый старт
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
        Создайте свой первый store за 5 минут.
      </p>

      {/* Step 1 */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Шаг 1: Создайте store
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Store — это объект, содержащий состояние и действия для его изменения.
          Используйте функцию <code className="text-primary-600 dark:text-primary-400">create</code> для создания store:
        </p>
        <CodeBlock code={step1Code} title="store.ts" />
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            <strong>Совет:</strong> Функция <code>set</code> принимает функцию-обновитель,
            которая получает текущее состояние и возвращает частичное обновление.
          </p>
        </div>
      </section>

      {/* Step 2 */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Шаг 2: Используйте store в компоненте
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Store возвращает хук, который можно использовать в любом компоненте.
          Передайте селектор для выбора нужной части состояния:
        </p>
        <CodeBlock code={step2Code} title="Counter.tsx" />
      </section>

      {/* Live Demo */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Результат
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Вот рабочий пример счётчика. Попробуйте нажать на кнопки:
        </p>
        <LiveDemo
          title="Живой пример"
          description="Интерактивный счётчик на zustand-lite"
          code={fullCode}
          codeTitle="Counter.tsx"
          onReset={resetCounter}
        >
          <CounterDemo />
        </LiveDemo>
      </section>

      {/* Selectors */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Селекторы
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Селекторы — ключ к производительности. Компонент перерендерится только
          при изменении выбранной части состояния:
        </p>
        <CodeBlock code={selectorsCode} title="selectors.ts" />
      </section>

      {/* Actions */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Обновление состояния
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Функция <code className="text-primary-600 dark:text-primary-400">set</code> предоставляет
          несколько способов обновления состояния:
        </p>
        <CodeBlock code={actionsCode} title="actions.ts" />
      </section>

      {/* Next Steps */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Что дальше?
        </h2>
        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
          <li>
            Изучите <a href="/docs/api/create" className="text-primary-600 dark:text-primary-400 hover:underline">API Reference</a> для
            подробной документации
          </li>
          <li>
            Добавьте <a href="/docs/middleware/persist" className="text-primary-600 dark:text-primary-400 hover:underline">persist middleware</a> для
            сохранения состояния
          </li>
          <li>
            Включите <a href="/docs/middleware/devtools" className="text-primary-600 dark:text-primary-400 hover:underline">devtools</a> для
            отладки через Redux DevTools
          </li>
          <li>
            Посмотрите <a href="/demo" className="text-primary-600 dark:text-primary-400 hover:underline">демо e-commerce приложения</a>
          </li>
        </ul>
      </section>
    </div>
  )
}
