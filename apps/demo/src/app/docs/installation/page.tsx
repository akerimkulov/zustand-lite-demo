import { CodeBlock } from '@/components/CodeBlock'

const pnpmInstall = `pnpm add zustand-lite`

const npmInstall = `npm install zustand-lite`

const yarnInstall = `yarn add zustand-lite`

const immerInstall = `# Для использования immer middleware
pnpm add immer`

const peerDeps = `// peer dependencies (должны быть установлены)
"react": ">=18.0.0"
"react-dom": ">=18.0.0"`

export default function InstallationPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        Установка
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
        Добавьте zustand-lite в ваш React проект.
      </p>

      {/* Package Manager */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Пакетный менеджер
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Выберите предпочитаемый пакетный менеджер:
        </p>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              pnpm (рекомендуется)
            </h3>
            <CodeBlock code={pnpmInstall} language="bash" title="terminal" showLineNumbers={false} />
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              npm
            </h3>
            <CodeBlock code={npmInstall} language="bash" title="terminal" showLineNumbers={false} />
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              yarn
            </h3>
            <CodeBlock code={yarnInstall} language="bash" title="terminal" showLineNumbers={false} />
          </div>
        </div>
      </section>

      {/* Peer Dependencies */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Peer Dependencies
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          zustand-lite требует React 18 или выше:
        </p>
        <CodeBlock code={peerDeps} title="package.json" showLineNumbers={false} />
      </section>

      {/* Optional Dependencies */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Опциональные зависимости
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Для использования <code className="text-primary-600 dark:text-primary-400">immer</code> middleware,
          установите библиотеку immer:
        </p>
        <CodeBlock code={immerInstall} language="bash" title="terminal" showLineNumbers={false} />
      </section>

      {/* TypeScript */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          TypeScript
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          zustand-lite написана на TypeScript и включает все необходимые типы из коробки.
          Никакой дополнительной установки <code className="text-primary-600 dark:text-primary-400">@types/*</code> не требуется.
        </p>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-200 text-sm">
            ✓ Типы включены в пакет
          </p>
        </div>
      </section>

      {/* Imports */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Импорты
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          После установки вы можете импортировать функции из разных точек входа:
        </p>
        <CodeBlock
          code={`// Core API
import { create, useStore, createStore, shallow } from 'zustand-lite'

// Middleware
import { persist, devtools, immer, combine, subscribeWithSelector } from 'zustand-lite/middleware'

// SSR utilities
import { useHydration, createStoreContext, HydrationBoundary } from 'zustand-lite/ssr'`}
          title="imports.ts"
        />
      </section>
    </div>
  )
}
