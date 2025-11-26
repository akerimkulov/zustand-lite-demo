import { CodeBlock } from '@/components/CodeBlock'
import { PropsTable, type PropDefinition } from '@/components/docs/PropsTable'

const problemExample = `// ❌ Проблема: Hydration mismatch
// Сервер рендерит с localStorage данными, которых нет
// Клиент гидратирует с реальными данными
//
// Error: Text content does not match server-rendered HTML`

const skipHydrationExample = `import { create } from 'zustand-lite'
import { persist } from 'zustand-lite/middleware'

const useStore = create(
  persist(
    (set) => ({
      cart: [],
      addItem: (item) => set((s) => ({ cart: [...s.cart, item] })),
    }),
    {
      name: 'cart',
      skipHydration: true,  // ← Ключевая опция
    }
  )
)`

const useHydrationExample = `import { useHydration } from 'zustand-lite/ssr'
import { useStore } from './store'

function Cart() {
  // Возвращает false до гидратации, затем true
  const isHydrated = useHydration(useStore)

  const items = useStore((s) => s.cart)

  if (!isHydrated) {
    return <CartSkeleton />
  }

  return <CartContent items={items} />
}`

const manualRehydrateExample = `'use client'

import { useEffect } from 'react'
import { useStore } from './store'

function CartProvider({ children }) {
  useEffect(() => {
    // Гидратация только на клиенте
    useStore.persist.rehydrate()
  }, [])

  return children
}`

const hydrationBoundaryExample = `import { HydrationBoundary } from 'zustand-lite/ssr'
import { useCartStore } from './store'

function Cart() {
  return (
    <HydrationBoundary
      store={useCartStore}
      fallback={<CartSkeleton />}
    >
      <CartContent />
    </HydrationBoundary>
  )
}

function CartContent() {
  const items = useCartStore((s) => s.cart)
  return <div>{items.length} items</div>
}`

const createStoreContextExample = `import { createStoreContext } from 'zustand-lite/ssr'
import { createStore } from 'zustand-lite'

// Создаём контекст для store
const {
  StoreProvider,
  useStoreContext,
  useStoreApi,
} = createStoreContext(() =>
  createStore((set) => ({
    user: null,
    setUser: (user) => set({ user }),
  }))
)

// В layout или page
export default function Layout({ children }) {
  return (
    <StoreProvider>
      {children}
    </StoreProvider>
  )
}

// В компоненте
function UserProfile() {
  const user = useStoreContext((s) => s.user)
  return <div>{user?.name}</div>
}`

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _perRequestExample = `// app/layout.tsx
import { StoreProvider } from './store-provider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <StoreProvider initialState={{ user: null }}>
          {children}
        </StoreProvider>
      </body>
    </html>
  )
}

// store-provider.tsx
'use client'

import { createStoreContext } from 'zustand-lite/ssr'
import { createStore } from 'zustand-lite'

const { StoreProvider, useStoreContext } = createStoreContext(() =>
  createStore((set) => ({
    user: null,
    setUser: (user) => set({ user }),
  }))
)

export { StoreProvider, useStoreContext }`

const nextjsPatternExample = `// stores/cart-store.ts
import { create } from 'zustand-lite'
import { persist } from 'zustand-lite/middleware'

export const useCartStore = create(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((s) => ({ items: [...s.items, item] })),
    }),
    {
      name: 'cart',
      skipHydration: true,
    }
  )
)

// components/CartProvider.tsx
'use client'

import { useEffect } from 'react'
import { useCartStore } from '@/stores/cart-store'

export function CartProvider({ children }) {
  useEffect(() => {
    useCartStore.persist.rehydrate()
  }, [])

  return <>{children}</>
}

// app/layout.tsx
import { CartProvider } from '@/components/CartProvider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  )
}`

const ssrApiProps: PropDefinition[] = [
  {
    name: 'useHydration',
    type: '(store) => boolean',
    description: 'Хук, возвращающий статус гидратации',
  },
  {
    name: 'HydrationBoundary',
    type: 'Component',
    description: 'Компонент-обёртка с fallback',
  },
  {
    name: 'createStoreContext',
    type: '(createFn) => Context',
    description: 'Создаёт контекст для per-request stores',
  },
  {
    name: 'isServer',
    type: 'boolean',
    description: 'true на сервере',
  },
  {
    name: 'isClient',
    type: 'boolean',
    description: 'true на клиенте',
  },
]

export default function SsrPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        SSR
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
        Работа с серверным рендерингом (Next.js, Remix и др.)
      </p>

      {/* The Problem */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Проблема
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          При SSR состояние на сервере и клиенте может отличаться,
          особенно при использовании <code className="text-primary-600 dark:text-primary-400">persist</code>:
        </p>
        <CodeBlock code={problemExample} title="problem.ts" />
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200 text-sm">
            <strong>Hydration mismatch</strong> происходит когда HTML с сервера не совпадает
            с тем, что рендерит React на клиенте.
          </p>
        </div>
      </section>

      {/* Solution 1: skipHydration */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Решение 1: skipHydration
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Отключите автоматическую гидратацию и выполните её вручную на клиенте:
        </p>
        <CodeBlock code={skipHydrationExample} title="store.ts" />
      </section>

      {/* useHydration */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          useHydration
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Хук для отслеживания статуса гидратации:
        </p>
        <CodeBlock code={useHydrationExample} title="component.tsx" />
      </section>

      {/* Manual Rehydration */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Ручная гидратация
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Вызовите <code className="text-primary-600 dark:text-primary-400">rehydrate()</code> в useEffect:
        </p>
        <CodeBlock code={manualRehydrateExample} title="provider.tsx" />
      </section>

      {/* HydrationBoundary */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          HydrationBoundary
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Компонент-обёртка с fallback во время гидратации:
        </p>
        <CodeBlock code={hydrationBoundaryExample} title="boundary.tsx" />
      </section>

      {/* Solution 2: createStoreContext */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Решение 2: createStoreContext
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Для изоляции состояния между запросами (per-request stores):
        </p>
        <CodeBlock code={createStoreContextExample} title="context-store.tsx" />
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            <strong>Когда использовать:</strong> Когда нужен свежий store для каждого запроса
            (например, для авторизации пользователя).
          </p>
        </div>
      </section>

      {/* API Reference */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          API Reference
        </h2>
        <CodeBlock
          code={`import {
  useHydration,
  HydrationBoundary,
  createStoreContext,
  isServer,
  isClient,
} from 'zustand-lite/ssr'`}
          title="imports.ts"
          showLineNumbers={false}
        />
        <PropsTable props={ssrApiProps} className="mt-4" />
      </section>

      {/* Next.js Pattern */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Next.js App Router
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Рекомендуемый паттерн для Next.js 13+ с App Router:
        </p>
        <CodeBlock code={nextjsPatternExample} title="nextjs-pattern.tsx" />
      </section>

      {/* Best Practices */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Best Practices
        </h2>
        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
          <li>
            Всегда используйте <code className="text-primary-600 dark:text-primary-400">skipHydration: true</code> с{' '}
            <code className="text-primary-600 dark:text-primary-400">persist</code> при SSR
          </li>
          <li>
            Показывайте skeleton или loading state до завершения гидратации
          </li>
          <li>
            Используйте <code className="text-primary-600 dark:text-primary-400">createStoreContext</code> для
            user-specific данных
          </li>
          <li>
            Не храните серверные данные в persist store
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
            <a href="/docs/middleware/persist" className="text-primary-600 dark:text-primary-400 hover:underline">
              persist
            </a> — сохранение состояния
          </li>
          <li>
            <a href="/docs/api/create-store" className="text-primary-600 dark:text-primary-400 hover:underline">
              createStore
            </a> — vanilla store
          </li>
        </ul>
      </section>
    </div>
  )
}
