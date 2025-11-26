import { Zap, Shield, Code, Package, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { CodeBlock } from '@/components/CodeBlock'

const features = [
  {
    icon: Zap,
    title: 'Легковесная',
    description: 'Менее 1KB в сжатом виде. Никаких лишних зависимостей.',
  },
  {
    icon: Shield,
    title: 'TypeScript-first',
    description: 'Полная типобезопасность из коробки с отличным выводом типов.',
  },
  {
    icon: Code,
    title: 'SOLID принципы',
    description: 'Чистая архитектура с разделением ответственности.',
  },
  {
    icon: Package,
    title: 'Middleware',
    description: 'Расширяемая система: persist, devtools, immer и другие.',
  },
]

const quickExample = `import { create } from 'zustand-lite'

const useStore = create((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}))

function Counter() {
  const count = useStore((s) => s.count)
  const increment = useStore((s) => s.increment)
  return <button onClick={increment}>{count}</button>
}`

export default function DocsPage() {
  return (
    <div>
      {/* Hero */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          zustand-lite
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
          Легковесная библиотека управления состоянием для React, вдохновлённая Zustand.
          Построена на TypeScript, принципах SOLID и чистом коде.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/docs/quick-start"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Быстрый старт
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/docs/api"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            API Reference
          </Link>
        </div>
      </div>

      {/* Features */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Почему zustand-lite?
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <feature.icon className="w-6 h-6 text-primary-600 mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Example */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Быстрый пример
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Создайте store и используйте его в компоненте — всего несколько строк кода:
        </p>
        <CodeBlock code={quickExample} title="counter.tsx" />
      </section>

      {/* What's Included */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Что включено
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Core API
            </h3>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
              <li>
                <code className="text-primary-600 dark:text-primary-400">create</code> — создание React store
              </li>
              <li>
                <code className="text-primary-600 dark:text-primary-400">createStore</code> — vanilla store без React
              </li>
              <li>
                <code className="text-primary-600 dark:text-primary-400">useStore</code> — хук для работы со store
              </li>
              <li>
                <code className="text-primary-600 dark:text-primary-400">shallow</code> — поверхностное сравнение
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Middleware
            </h3>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
              <li>
                <code className="text-primary-600 dark:text-primary-400">persist</code> — сохранение в localStorage
              </li>
              <li>
                <code className="text-primary-600 dark:text-primary-400">devtools</code> — интеграция с Redux DevTools
              </li>
              <li>
                <code className="text-primary-600 dark:text-primary-400">immer</code> — мутабельный синтаксис
              </li>
              <li>
                <code className="text-primary-600 dark:text-primary-400">subscribeWithSelector</code> — подписка на части состояния
              </li>
              <li>
                <code className="text-primary-600 dark:text-primary-400">combine</code> — разделение state и actions
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              SSR
            </h3>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
              <li>
                <code className="text-primary-600 dark:text-primary-400">useHydration</code> — хук для гидратации
              </li>
              <li>
                <code className="text-primary-600 dark:text-primary-400">createStoreContext</code> — контекст для SSR
              </li>
              <li>
                <code className="text-primary-600 dark:text-primary-400">HydrationBoundary</code> — компонент-обёртка
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Следующие шаги
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            href="/docs/installation"
            className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors group"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400">
              Установка →
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Как добавить zustand-lite в проект
            </p>
          </Link>
          <Link
            href="/docs/quick-start"
            className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors group"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400">
              Быстрый старт →
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Создайте первый store за 5 минут
            </p>
          </Link>
        </div>
      </section>
    </div>
  )
}
