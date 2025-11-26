import Link from 'next/link'
import { ArrowRight, Zap, Shield, Code, Package } from 'lucide-react'
import { CodeBlock } from '@/components/CodeBlock'

const features = [
  {
    icon: Zap,
    title: 'Лёгкая',
    description: 'Менее 1KB в сжатом виде. Tree-shakable middleware.',
  },
  {
    icon: Shield,
    title: 'Типобезопасная',
    description: 'Полная поддержка TypeScript с автоматическим выводом типов.',
  },
  {
    icon: Code,
    title: 'Принципы SOLID',
    description: 'Построена по принципам SOLID и практикам чистого кода.',
  },
  {
    icon: Package,
    title: 'Middleware',
    description: 'Композируемые middleware: persist, devtools, immer и другие.',
  },
]

const quickExample = `import { create } from 'zustand-lite'
import { persist, devtools } from 'zustand-lite/middleware'

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
}

const useCartStore = create<CartState>()(
  devtools(
    persist(
      (set) => ({
        items: [],
        addItem: (item) =>
          set((s) => ({ items: [...s.items, item] })),
        removeItem: (id) =>
          set((s) => ({ items: s.items.filter(i => i.id !== id) })),
      }),
      { name: 'cart-storage' }
    )
  )
)

// В вашем компоненте
function Cart() {
  const items = useCartStore((s) => s.items)
  const addItem = useCartStore((s) => s.addItem)

  return <div>{items.length} товаров в корзине</div>
}`

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              Библиотека управления состоянием
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              <span className="text-primary-600">zustand</span>-lite
            </h1>

            {/* Description */}
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
              Лёгкая библиотека управления состоянием для React.
              Вдохновлена Zustand. Создана с TypeScript, принципами SOLID
              и лучшими практиками.
            </p>

            {/* CTA */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                Попробовать демо
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/examples"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
              >
                Смотреть примеры
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-200 dark:bg-primary-900/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary-300 dark:bg-primary-800/20 rounded-full blur-3xl opacity-50" />
      </section>

      {/* Features */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Ключевые возможности
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl hover:shadow-lg transition-shadow"
              >
                <feature.icon className="w-10 h-10 text-primary-600 mb-4" />
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Быстрый старт
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Начните за минуты с этого простого примера
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <CodeBlock code={quickExample} title="cart-store.ts" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-600 dark:bg-primary-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Готовы изучить?
          </h2>
          <p className="text-primary-100 mb-8 max-w-xl mx-auto">
            Посмотрите интерактивное демо, чтобы увидеть zustand-lite в действии.
            Изучите принципы SOLID и чистый код на примерах.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              E-commerce демо
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/principles/solid"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-400 transition-colors"
            >
              Принципы SOLID
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-gray-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p>Создано для аттестационного проекта. Вдохновлено Zustand.</p>
          <p className="text-sm mt-2">
            TypeScript • React • Next.js • SOLID • Clean Code
          </p>
        </div>
      </footer>
    </div>
  )
}
