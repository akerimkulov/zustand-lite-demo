import Link from 'next/link'
import { CodeBlock } from '@/components/CodeBlock'

const middlewareItems = [
  {
    name: 'persist',
    href: '/docs/middleware/persist',
    description: 'Сохраняет состояние в localStorage или другое хранилище.',
    badge: 'Популярный',
    badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    name: 'devtools',
    href: '/docs/middleware/devtools',
    description: 'Интеграция с Redux DevTools для отладки.',
    badge: 'DevEx',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    name: 'immer',
    href: '/docs/middleware/immer',
    description: 'Позволяет использовать мутабельный синтаксис для обновлений.',
    badge: 'Опционально',
    badgeColor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  {
    name: 'subscribeWithSelector',
    href: '/docs/middleware/subscribe-with-selector',
    description: 'Подписка на изменения конкретных частей состояния.',
    badge: null,
    badgeColor: '',
  },
  {
    name: 'combine',
    href: '/docs/middleware/combine',
    description: 'Разделяет начальное состояние и действия для лучшего вывода типов.',
    badge: null,
    badgeColor: '',
  },
]

const importExample = `import { persist, devtools, immer, combine, subscribeWithSelector } from 'zustand-lite/middleware'`

const compositionExample = `import { create } from 'zustand-lite'
import { devtools, persist, immer } from 'zustand-lite/middleware'

const useStore = create<State>()(
  devtools(          // 3. Внешний - отправляет в DevTools
    persist(         // 2. Средний - сохраняет в storage
      immer(         // 1. Внутренний - включает мутации
        (set) => ({
          count: 0,
          increment: () => set((draft) => {
            draft.count++  // Мутабельный синтаксис благодаря immer
          }),
        })
      ),
      { name: 'my-store' }
    ),
    { name: 'MyStore' }
  )
)`

const orderExplanation = `// Middleware оборачивают друг друга:
//
// devtools( ... )      ← Внешний, получает финальное состояние
//   persist( ... )     ← Средний, сохраняет после изменений
//     immer( ... )     ← Внутренний, обрабатывает set() первым
//       initializer
//
// Порядок выполнения при вызове set():
// 1. immer преобразует мутации в иммутабельное обновление
// 2. persist сохраняет новое состояние
// 3. devtools отправляет action в расширение`

export default function MiddlewarePage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        Middleware
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
        Расширения для добавления функциональности к store.
      </p>

      {/* Import */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Импорт
        </h2>
        <CodeBlock code={importExample} title="import.ts" showLineNumbers={false} />
      </section>

      {/* Middleware List */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Доступные middleware
        </h2>
        <div className="space-y-4">
          {middlewareItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="block p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                      {item.name}
                    </h3>
                    {item.badge && (
                      <span className={`text-xs px-2 py-0.5 rounded ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
                <span className="text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Composition */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Композиция middleware
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Middleware можно комбинировать, оборачивая их друг в друга.
          <strong> Порядок важен</strong> — внутренний middleware обрабатывает <code>set()</code> первым:
        </p>
        <CodeBlock code={compositionExample} title="composition.ts" />
      </section>

      {/* Order Explanation */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Порядок выполнения
        </h2>
        <CodeBlock code={orderExplanation} title="order.ts" />
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            <strong>Рекомендуемый порядок:</strong> devtools → persist → immer → initializer.
            Это обеспечивает корректную отладку и сохранение состояния.
          </p>
        </div>
      </section>

      {/* TypeScript Note */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          TypeScript
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          При использовании middleware с TypeScript используйте каррированный паттерн{' '}
          <code className="text-primary-600 dark:text-primary-400">create&lt;State&gt;()()</code> для
          корректного вывода типов:
        </p>
        <CodeBlock
          code={`// ✅ Корректно - типы выводятся правильно
const useStore = create<State>()(
  persist((set) => ({ ... }), { name: 'key' })
)

// ❌ Может быть проблема с типами
const useStore = create(
  persist<State>((set) => ({ ... }), { name: 'key' })
)`}
          title="typescript.ts"
        />
      </section>
    </div>
  )
}
