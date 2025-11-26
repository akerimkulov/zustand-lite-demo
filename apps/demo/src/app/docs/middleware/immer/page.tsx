'use client'

import { CodeBlock } from '@/components/CodeBlock'
import { LiveDemo } from '@/components/docs/LiveDemo'
import { create } from 'zustand-lite'
import { useState } from 'react'

interface Todo {
  id: number
  text: string
  done: boolean
}

interface TodoStore {
  todos: Todo[]
  addTodo: (text: string) => void
  toggleTodo: (id: number) => void
  removeTodo: (id: number) => void
}

// Note: immer middleware изменяет сигнатуру set для поддержки мутаций
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useTodoDemoStore = create<TodoStore>()((set: any) => ({
  todos: [
    { id: 1, text: 'Изучить zustand-lite', done: true },
    { id: 2, text: 'Попробовать immer middleware', done: false },
  ],
  addTodo: (text: string) => {
    set((state: TodoStore) => ({
      todos: [...state.todos, { id: Date.now(), text, done: false }],
    }))
  },
  toggleTodo: (id: number) => {
    set((state: TodoStore) => ({
      todos: state.todos.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t
      ),
    }))
  },
  removeTodo: (id: number) => {
    set((state: TodoStore) => ({
      todos: state.todos.filter((t) => t.id !== id),
    }))
  },
}))

function TodoDemo() {
  const [newTodo, setNewTodo] = useState('')
  const todos = useTodoDemoStore((s) => s.todos)
  const addTodo = useTodoDemoStore((s) => s.addTodo)
  const toggleTodo = useTodoDemoStore((s) => s.toggleTodo)
  const removeTodo = useTodoDemoStore((s) => s.removeTodo)

  const handleAdd = () => {
    if (newTodo.trim()) {
      addTodo(newTodo.trim())
      setNewTodo('')
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Новая задача..."
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          +
        </button>
      </div>
      <ul className="space-y-2">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className="flex items-center gap-3 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
          >
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
              className="w-5 h-5 accent-primary-600"
            />
            <span
              className={`flex-1 ${
                todo.done ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'
              }`}
            >
              {todo.text}
            </span>
            <button
              onClick={() => removeTodo(todo.id)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

const basicExample = `import { create } from 'zustand-lite'
import { immer } from 'zustand-lite/middleware'

const useStore = create(
  immer((set) => ({
    items: [],
    addItem: (item) => set((draft) => {
      // Мутабельный синтаксис!
      draft.items.push(item)
    }),
  }))
)`

const demoCode = `const useTodoStore = create(
  immer((set) => ({
    todos: [],
    addTodo: (text) => set((draft) => {
      draft.todos.push({ id: Date.now(), text, done: false })
    }),
    toggleTodo: (id) => set((draft) => {
      const todo = draft.todos.find(t => t.id === id)
      if (todo) todo.done = !todo.done
    }),
    removeTodo: (id) => set((draft) => {
      const index = draft.todos.findIndex(t => t.id === id)
      if (index !== -1) draft.todos.splice(index, 1)
    }),
  }))
)`

const comparisonExample = `// ❌ Без immer — иммутабельные обновления вручную
const useStore = create((set) => ({
  user: { profile: { name: '', settings: { theme: 'light' } } },
  updateTheme: (theme) => set((state) => ({
    user: {
      ...state.user,
      profile: {
        ...state.user.profile,
        settings: {
          ...state.user.profile.settings,
          theme,
        },
      },
    },
  })),
}))

// ✅ С immer — простой мутабельный синтаксис
const useStore = create(
  immer((set) => ({
    user: { profile: { name: '', settings: { theme: 'light' } } },
    updateTheme: (theme) => set((draft) => {
      draft.user.profile.settings.theme = theme
    }),
  }))
)`

const withMiddlewareExample = `import { create } from 'zustand-lite'
import { devtools, persist, immer } from 'zustand-lite/middleware'

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

const installExample = `# immer — опциональная зависимость
pnpm add immer`

export default function ImmerPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        immer
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
        Позволяет использовать мутабельный синтаксис для иммутабельных обновлений.
      </p>

      {/* Installation */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Установка
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          <code className="text-primary-600 dark:text-primary-400">immer</code> — опциональная
          peer dependency:
        </p>
        <CodeBlock code={installExample} language="bash" title="terminal" showLineNumbers={false} />
      </section>

      {/* Basic Usage */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Базовое использование
        </h2>
        <CodeBlock code={basicExample} title="basic.ts" />
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-200 text-sm">
            Внутри <code>set()</code> вы работаете с <strong>draft</strong> — черновиком состояния.
            Immer автоматически создаёт иммутабельное обновление.
          </p>
        </div>
      </section>

      {/* Live Demo */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Демо
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Todo-список с мутабельными обновлениями:
        </p>
        <LiveDemo
          title="Todo List"
          description="Добавление, переключение, удаление задач"
          code={demoCode}
          codeTitle="todo-store.ts"
        >
          <TodoDemo />
        </LiveDemo>
      </section>

      {/* Comparison */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Сравнение
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Immer особенно полезен для глубоко вложенных структур:
        </p>
        <CodeBlock code={comparisonExample} title="comparison.ts" />
      </section>

      {/* With Middleware */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          С другими middleware
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          <code className="text-primary-600 dark:text-primary-400">immer</code> должен быть{' '}
          <strong>внутренним</strong> middleware:
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
              ✓ Рекомендуется
            </h3>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>• Глубоко вложенные объекты</li>
              <li>• Работа с массивами (push, splice)</li>
              <li>• Сложные обновления состояния</li>
              <li>• Когда иммутабельность утомляет</li>
            </ul>
          </div>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              ⚠ Не обязательно
            </h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Простое плоское состояние</li>
              <li>• Когда важен размер бандла</li>
              <li>• Примитивные обновления</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Советы
        </h2>
        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
          <li>
            Можно <strong>мутировать</strong> draft или <strong>вернуть</strong> новое состояние,
            но не оба сразу
          </li>
          <li>
            Используйте <code className="text-primary-600 dark:text-primary-400">draft.items.push()</code> вместо
            <code className="text-primary-600 dark:text-primary-400">[...items, newItem]</code>
          </li>
          <li>
            Для удаления используйте <code className="text-primary-600 dark:text-primary-400">splice()</code> вместо
            <code className="text-primary-600 dark:text-primary-400">filter()</code>
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
            <a
              href="https://immerjs.github.io/immer/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              Документация Immer ↗
            </a>
          </li>
        </ul>
      </section>
    </div>
  )
}
