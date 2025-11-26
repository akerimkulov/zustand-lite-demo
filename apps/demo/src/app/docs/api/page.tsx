import Link from 'next/link'
import { CodeBlock } from '@/components/CodeBlock'

const apiItems = [
  {
    name: 'create',
    href: '/docs/api/create',
    description: 'Создаёт React store с хуком для использования в компонентах.',
    signature: 'create<T>()(initializer) => UseBoundStore<StoreApi<T>>',
  },
  {
    name: 'useStore',
    href: '/docs/api/use-store',
    description: 'Хук для подключения к любому store API.',
    signature: 'useStore(api, selector?, equalityFn?) => SelectedState',
  },
  {
    name: 'createStore',
    href: '/docs/api/create-store',
    description: 'Создаёт vanilla store без привязки к React.',
    signature: 'createStore<T>()(initializer) => StoreApi<T>',
  },
  {
    name: 'shallow',
    href: '/docs/api/shallow',
    description: 'Функция поверхностного сравнения для оптимизации ререндеров.',
    signature: 'shallow(a, b) => boolean',
  },
]

const importExample = `import { create, useStore, createStore, shallow } from 'zustand-lite'`

export default function ApiPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        Core API
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
        Основные функции для работы с zustand-lite.
      </p>

      {/* Import */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Импорт
        </h2>
        <CodeBlock code={importExample} title="import.ts" showLineNumbers={false} />
      </section>

      {/* API List */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Функции
        </h2>
        <div className="space-y-4">
          {apiItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="block p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {item.description}
                  </p>
                  <code className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                    {item.signature}
                  </code>
                </div>
                <span className="text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
