'use client'

import { CodeBlock } from '@/components/CodeBlock'
import { PropsTable, type PropDefinition } from '@/components/docs/PropsTable'
import { LiveDemo } from '@/components/docs/LiveDemo'
import { create } from 'zustand-lite'
import { useEffect, useState } from 'react'

interface SelectorDemoState {
  count: number
  name: string
  increment: () => void
  setName: (name: string) => void
}

const useSelectorDemoStore = create<SelectorDemoState>()((set) => ({
  count: 0,
  name: 'User',
  increment: () => set((s) => ({ count: s.count + 1 })),
  setName: (name) => set({ name }),
}))

function SelectorDemo() {
  const [logs, setLogs] = useState<string[]>([])
  const count = useSelectorDemoStore((s) => s.count)
  const name = useSelectorDemoStore((s) => s.name)
  const increment = useSelectorDemoStore((s) => s.increment)
  const setName = useSelectorDemoStore((s) => s.setName)

  // Демонстрация подписок через обычный subscribe
  // В реальном приложении с subscribeWithSelector можно использовать
  // расширенный синтаксис: subscribe(selector, listener)
  useEffect(() => {
    let prevCount = useSelectorDemoStore.getState().count
    let prevName = useSelectorDemoStore.getState().name

    const unsub = useSelectorDemoStore.subscribe((state) => {
      if (state.count !== prevCount) {
        setLogs((l) => [...l.slice(-4), `count: ${prevCount} → ${state.count}`])
        prevCount = state.count
      }
      if (state.name !== prevName) {
        setLogs((l) => [...l.slice(-4), `name: "${prevName}" → "${state.name}"`])
        prevName = state.name
      }
    })

    return unsub
  }, [])

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">count</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{count}</div>
          <button
            onClick={increment}
            className="mt-2 px-3 py-1 bg-primary-600 text-white rounded text-sm"
          >
            +1
          </button>
        </div>
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">name</div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>
      <div className="p-3 bg-gray-900 rounded-lg text-sm font-mono">
        <div className="text-gray-500 mb-2">// Лог подписок:</div>
        {logs.length === 0 ? (
          <div className="text-gray-500">Измените значения выше...</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="text-green-400">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const basicExample = `import { create } from 'zustand-lite'
import { subscribeWithSelector } from 'zustand-lite/middleware'

const useStore = create(
  subscribeWithSelector((set) => ({
    count: 0,
    name: 'User',
    increment: () => set((s) => ({ count: s.count + 1 })),
  }))
)`

const demoCode = `const useStore = create(
  subscribeWithSelector((set) => ({
    count: 0,
    name: 'User',
    increment: () => set((s) => ({ count: s.count + 1 })),
    setName: (name) => set({ name }),
  }))
)

// Подписка на изменение count
useStore.subscribe(
  (s) => s.count,
  (count, prevCount) => {
    console.log('count:', prevCount, '→', count)
  }
)

// Подписка на изменение name
useStore.subscribe(
  (s) => s.name,
  (name, prevName) => {
    console.log('name:', prevName, '→', name)
  }
)`

const subscribeExample = `// Стандартная подписка (без middleware)
useStore.subscribe((state) => {
  console.log('State changed:', state)
})

// С subscribeWithSelector — подписка на часть состояния
useStore.subscribe(
  (state) => state.count,           // selector
  (count, prevCount) => {           // listener
    console.log('Count:', prevCount, '→', count)
  }
)`

const optionsExample = `// С опциями
useStore.subscribe(
  (s) => s.items,
  (items, prevItems) => {
    console.log('Items changed:', items)
  },
  {
    // Использовать shallow сравнение
    equalityFn: shallow,

    // Вызвать listener сразу с текущим значением
    fireImmediately: true,
  }
)`

const useCasesExample = `// 1. Аналитика
useStore.subscribe(
  (s) => s.cart.items.length,
  (count) => {
    analytics.track('cart_updated', { itemCount: count })
  }
)

// 2. Синхронизация с внешним API
useStore.subscribe(
  (s) => s.settings,
  async (settings) => {
    await api.saveSettings(settings)
  },
  { equalityFn: shallow }
)

// 3. Логирование для отладки
useStore.subscribe(
  (s) => s,
  (state, prevState) => {
    console.log('State diff:', diff(prevState, state))
  }
)`

const options: PropDefinition[] = [
  {
    name: 'equalityFn',
    type: '(a: U, b: U) => boolean',
    default: 'Object.is',
    description: 'Функция сравнения для определения изменений',
  },
  {
    name: 'fireImmediately',
    type: 'boolean',
    default: 'false',
    description: 'Вызвать listener сразу с текущим значением',
  },
]

export default function SubscribeWithSelectorPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        subscribeWithSelector
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
        Расширяет subscribe() для подписки на конкретные части состояния.
      </p>

      {/* Basic Usage */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Базовое использование
        </h2>
        <CodeBlock code={basicExample} title="basic.ts" />
      </section>

      {/* Live Demo */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Демо
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Подписки срабатывают только при изменении выбранной части состояния:
        </p>
        <LiveDemo
          title="Селективные подписки"
          description="Каждая подписка следит за своим полем"
          code={demoCode}
          codeTitle="selector-demo.ts"
        >
          <SelectorDemo />
        </LiveDemo>
      </section>

      {/* Subscribe Comparison */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Сравнение с обычным subscribe
        </h2>
        <CodeBlock code={subscribeExample} title="comparison.ts" />
      </section>

      {/* Options */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Опции
        </h2>
        <PropsTable props={options} />
        <CodeBlock code={optionsExample} title="options.ts" className="mt-4" />
      </section>

      {/* Use Cases */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Примеры использования
        </h2>
        <CodeBlock code={useCasesExample} title="use-cases.ts" />
      </section>

      {/* When to Use */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Когда использовать
        </h2>
        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
          <li>Аналитика — отслеживание конкретных событий</li>
          <li>Синхронизация — с внешним API или localStorage</li>
          <li>Side effects — реакция на определённые изменения</li>
          <li>Логирование — отладка конкретных частей состояния</li>
          <li>Интеграция — с не-React кодом</li>
        </ul>
      </section>

      {/* Tips */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Советы
        </h2>
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-2">
            <li>
              • Используйте <code>shallow</code> для объектов и массивов
            </li>
            <li>
              • Не забывайте отписываться в cleanup (особенно в useEffect)
            </li>
            <li>
              • Для React-компонентов предпочитайте селекторы в хуке
            </li>
            <li>
              • subscribe возвращает функцию отписки
            </li>
          </ul>
        </div>
      </section>

      {/* See Also */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          См. также
        </h2>
        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
          <li>
            <a href="/docs/api/shallow" className="text-primary-600 dark:text-primary-400 hover:underline">
              shallow
            </a> — поверхностное сравнение
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
