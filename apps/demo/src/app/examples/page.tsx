'use client'

import { useState } from 'react'
import { CodeBlock } from '@/components/CodeBlock'
import { create } from 'zustand-lite'
import { cn } from '@/lib/utils'

// ============================================================
// EXAMPLE STORES
// ============================================================

// Basic counter store
const useCounterStore = create<{
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}>((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
  decrement: () => set((s) => ({ count: s.count - 1 })),
  reset: () => set({ count: 0 }),
}))

// ============================================================
// CODE EXAMPLES
// ============================================================

const basicExample = `import { create } from 'zustand-lite'

const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
  decrement: () => set((s) => ({ count: s.count - 1 })),
  reset: () => set({ count: 0 }),
}))

// В компоненте
function Counter() {
  const count = useCounterStore((s) => s.count)
  const increment = useCounterStore((s) => s.increment)

  return (
    <button onClick={increment}>
      Счёт: {count}
    </button>
  )
}`

const persistExample = `import { create } from 'zustand-lite'
import { persist } from 'zustand-lite/middleware'

const useSettingsStore = create(
  persist(
    (set) => ({
      theme: 'light',
      language: 'en',
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'settings-storage', // ключ localStorage
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
      }),
    }
  )
)`

const devtoolsExample = `import { create } from 'zustand-lite'
import { devtools } from 'zustand-lite/middleware'

const useStore = create(
  devtools(
    (set) => ({
      users: [],
      addUser: (user) =>
        set(
          (s) => ({ users: [...s.users, user] }),
          false // не заменять
        ),
    }),
    {
      name: 'UserStore', // имя в DevTools
      enabled: process.env.NODE_ENV !== 'production',
    }
  )
)`

const immerExample = `import { create } from 'zustand-lite'
import { immer } from 'zustand-lite/middleware'

const useTodoStore = create(
  immer((set) => ({
    todos: [],
    addTodo: (text) =>
      set((draft) => {
        // Мутабельный синтаксис благодаря Immer!
        draft.todos.push({
          id: Date.now(),
          text,
          done: false,
        })
      }),
    toggleTodo: (id) =>
      set((draft) => {
        const todo = draft.todos.find((t) => t.id === id)
        if (todo) {
          todo.done = !todo.done
        }
      }),
  }))
)`

const selectorExample = `import { create } from 'zustand-lite'
import { subscribeWithSelector } from 'zustand-lite/middleware'

const useStore = create(
  subscribeWithSelector((set) => ({
    count: 0,
    name: 'test',
    increment: () => set((s) => ({ count: s.count + 1 })),
  }))
)

// Подписка на конкретную часть состояния
useStore.subscribe(
  (state) => state.count, // селектор
  (count, prevCount) => {
    console.log('Счёт изменился:', prevCount, '->', count)
  },
  { fireImmediately: true }
)`

const combineExample = `import { create } from 'zustand-lite'
import { combine } from 'zustand-lite/middleware'

// Типы выводятся из начального состояния!
const useStore = create(
  combine(
    // Начальное состояние
    { count: 0, name: 'counter' },
    // Действия
    (set, get) => ({
      increment: () => set({ count: get().count + 1 }),
      setName: (name: string) => set({ name }),
    })
  )
)

// Результирующий тип:
// {
//   count: number
//   name: string
//   increment: () => void
//   setName: (name: string) => void
// }`

// ============================================================
// COMPONENT
// ============================================================

const examples = [
  { id: 'basic', title: 'Базовое использование', code: basicExample },
  { id: 'persist', title: 'Persist Middleware', code: persistExample },
  { id: 'devtools', title: 'DevTools', code: devtoolsExample },
  { id: 'immer', title: 'Immer Middleware', code: immerExample },
  { id: 'selector', title: 'Подписка с селектором', code: selectorExample },
  { id: 'combine', title: 'Combine', code: combineExample },
]

export default function ExamplesPage() {
  const [activeExample, setActiveExample] = useState('basic')

  // For live demo
  const count = useCounterStore((s) => s.count)
  const increment = useCounterStore((s) => s.increment)
  const decrement = useCounterStore((s) => s.decrement)
  const reset = useCounterStore((s) => s.reset)

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Примеры кода
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Интерактивные примеры, демонстрирующие возможности zustand-lite
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Example tabs */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold dark:text-white mb-4">
              Примеры
            </h2>
            <div className="space-y-2">
              {examples.map((example) => (
                <button
                  key={example.id}
                  onClick={() => setActiveExample(example.id)}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-lg transition-colors',
                    activeExample === example.id
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  )}
                >
                  {example.title}
                </button>
              ))}
            </div>

            {/* Live demo */}
            {activeExample === 'basic' && (
              <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <h3 className="font-semibold dark:text-white mb-4">Живой пример</h3>
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary-600 mb-4">
                    {count}
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={decrement}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      -
                    </button>
                    <button
                      onClick={reset}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Сброс
                    </button>
                    <button
                      onClick={increment}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Code display */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold dark:text-white mb-4">
              {examples.find((e) => e.id === activeExample)?.title}
            </h2>
            <CodeBlock
              code={examples.find((e) => e.id === activeExample)?.code ?? ''}
              title={`${activeExample}.ts`}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
