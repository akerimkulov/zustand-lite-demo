'use client'

import { CodeBlock } from '@/components/CodeBlock'
import { PropsTable, type PropDefinition } from '@/components/docs/PropsTable'
import { LiveDemo } from '@/components/docs/LiveDemo'
import { create } from 'zustand-lite'
import { persist } from 'zustand-lite/middleware'
import { useEffect, useState } from 'react'

// Demo store
const usePersistDemoStore = create<{
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}>()(
  persist(
    (set) => ({
      count: 0,
      increment: () => set((s) => ({ count: s.count + 1 })),
      decrement: () => set((s) => ({ count: s.count - 1 })),
      reset: () => set({ count: 0 }),
    }),
    { name: 'persist-demo' }
  )
)

function PersistDemo() {
  const [hydrated, setHydrated] = useState(false)
  const count = usePersistDemoStore((s) => s.count)
  const increment = usePersistDemoStore((s) => s.increment)
  const decrement = usePersistDemoStore((s) => s.decrement)

  useEffect(() => {
    setHydrated(true)
  }, [])

  const clearStorage = () => {
    localStorage.removeItem('persist-demo')
    window.location.reload()
  }

  if (!hydrated) {
    return <div className="text-center text-gray-500">Загрузка...</div>
  }

  return (
    <div className="text-center">
      <div className="text-5xl font-bold text-primary-600 mb-4">{count}</div>
      <div className="flex gap-2 justify-center mb-4">
        <button
          onClick={decrement}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          −
        </button>
        <button
          onClick={increment}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          +
        </button>
      </div>
      <button
        onClick={clearStorage}
        className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
      >
        Очистить storage
      </button>
      <p className="mt-2 text-xs text-gray-500">
        Перезагрузите страницу — значение сохранится!
      </p>
    </div>
  )
}

const basicExample = `import { create } from 'zustand-lite'
import { persist } from 'zustand-lite/middleware'

const useStore = create(
  persist(
    (set) => ({
      count: 0,
      increment: () => set((s) => ({ count: s.count + 1 })),
    }),
    { name: 'my-store' } // ключ в localStorage
  )
)`

const demoCode = `const usePersistDemoStore = create(
  persist(
    (set) => ({
      count: 0,
      increment: () => set((s) => ({ count: s.count + 1 })),
      decrement: () => set((s) => ({ count: s.count - 1 })),
    }),
    { name: 'persist-demo' }
  )
)

// Значение автоматически сохраняется в localStorage
// и восстанавливается при загрузке страницы`

const partializeExample = `const useStore = create(
  persist(
    (set) => ({
      user: { name: '', email: '' },
      tempData: null,  // Не хотим сохранять
      setUser: (user) => set({ user }),
    }),
    {
      name: 'user-store',
      // Сохраняем только user
      partialize: (state) => ({ user: state.user }),
    }
  )
)`

const sessionStorageExample = `import { persist, createJSONStorage } from 'zustand-lite/middleware'

const useStore = create(
  persist(
    (set) => ({ count: 0 }),
    {
      name: 'session-store',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)`

const migrationExample = `const useStore = create(
  persist(
    (set) => ({
      user: { firstName: '', lastName: '' },
    }),
    {
      name: 'user-store',
      version: 2,
      migrate: (persistedState, version) => {
        if (version === 1) {
          // Миграция с версии 1: поле name → firstName
          const state = persistedState as { user: { name: string } }
          return {
            user: {
              firstName: state.user.name,
              lastName: '',
            },
          }
        }
        return persistedState
      },
    }
  )
)`

const ssrExample = `const useStore = create(
  persist(
    (set) => ({ count: 0 }),
    {
      name: 'ssr-store',
      skipHydration: true,  // Отключаем автоматическую гидратацию
    }
  )
)

// В компоненте
function Counter() {
  useEffect(() => {
    // Гидратируем вручную на клиенте
    useStore.persist.rehydrate()
  }, [])

  // ...
}`

const persistApiExample = `const useStore = create(persist(...))

// Persist API
useStore.persist.rehydrate()           // Принудительная гидратация
useStore.persist.hasHydrated()         // Проверка статуса
useStore.persist.onFinishHydration(fn) // Колбэк после гидратации
useStore.persist.onHydrate(fn)         // Колбэк перед гидратацией
useStore.persist.getOptions()          // Получить настройки
useStore.persist.clearStorage()        // Очистить storage
useStore.persist.flush()               // Принудительная запись`

const options: PropDefinition[] = [
  {
    name: 'name',
    type: 'string',
    required: true,
    description: 'Ключ для хранения в storage',
  },
  {
    name: 'storage',
    type: 'PersistStorage',
    default: 'localStorage',
    description: 'Хранилище (localStorage, sessionStorage или кастомное)',
  },
  {
    name: 'partialize',
    type: '(state) => Partial<State>',
    default: '(s) => s',
    description: 'Функция для выбора части состояния для сохранения',
  },
  {
    name: 'version',
    type: 'number',
    default: '0',
    description: 'Версия схемы состояния для миграций',
  },
  {
    name: 'migrate',
    type: '(state, version) => State',
    description: 'Функция миграции при изменении версии',
  },
  {
    name: 'merge',
    type: '(persisted, current) => State',
    default: 'shallow merge',
    description: 'Функция слияния сохранённого и начального состояния',
  },
  {
    name: 'skipHydration',
    type: 'boolean',
    default: 'false',
    description: 'Отключить автоматическую гидратацию (для SSR)',
  },
  {
    name: 'onRehydrateStorage',
    type: '(state) => ((state, error) => void)',
    description: 'Колбэк после гидратации',
  },
]

export default function PersistPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        persist
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
        Автоматически сохраняет и восстанавливает состояние store из хранилища.
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
          Измените значение и перезагрузите страницу — оно сохранится:
        </p>
        <LiveDemo
          title="Персистентный счётчик"
          description="Данные сохраняются в localStorage"
          code={demoCode}
          codeTitle="persist-demo.ts"
        >
          <PersistDemo />
        </LiveDemo>
      </section>

      {/* Options */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Опции
        </h2>
        <PropsTable props={options} />
      </section>

      {/* Partialize */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Частичное сохранение
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Используйте <code className="text-primary-600 dark:text-primary-400">partialize</code> чтобы
          сохранять только нужные части состояния:
        </p>
        <CodeBlock code={partializeExample} title="partialize.ts" />
      </section>

      {/* Custom Storage */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Другие хранилища
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          По умолчанию используется <code>localStorage</code>. Можно использовать{' '}
          <code>sessionStorage</code> или любое кастомное хранилище:
        </p>
        <CodeBlock code={sessionStorageExample} title="session-storage.ts" />
      </section>

      {/* Migrations */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Миграции
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          При изменении структуры состояния используйте <code className="text-primary-600 dark:text-primary-400">version</code> и{' '}
          <code className="text-primary-600 dark:text-primary-400">migrate</code>:
        </p>
        <CodeBlock code={migrationExample} title="migration.ts" />
      </section>

      {/* SSR */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          SSR
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Для серверного рендеринга используйте{' '}
          <code className="text-primary-600 dark:text-primary-400">skipHydration</code>:
        </p>
        <CodeBlock code={ssrExample} title="ssr.ts" />
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            Подробнее о работе с SSR читайте в разделе{' '}
            <a href="/docs/ssr" className="underline">SSR</a>.
          </p>
        </div>
      </section>

      {/* Persist API */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Persist API
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Store с persist middleware предоставляет дополнительные методы:
        </p>
        <CodeBlock code={persistApiExample} title="persist-api.ts" />
      </section>

      {/* See Also */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          См. также
        </h2>
        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
          <li>
            <a href="/docs/ssr" className="text-primary-600 dark:text-primary-400 hover:underline">
              SSR
            </a> — серверный рендеринг с persist
          </li>
          <li>
            <a href="/docs/middleware" className="text-primary-600 dark:text-primary-400 hover:underline">
              Middleware
            </a> — композиция с другими middleware
          </li>
        </ul>
      </section>
    </div>
  )
}
