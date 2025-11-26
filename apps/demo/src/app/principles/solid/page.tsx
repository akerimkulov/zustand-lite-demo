'use client'

import { useState } from 'react'
import { CodeBlock } from '@/components/CodeBlock'
import { cn } from '@/lib/utils'
import { CheckCircle } from 'lucide-react'

// ============================================================
// SOLID PRINCIPLES DATA
// ============================================================

const principles = [
  {
    id: 'S',
    title: 'Single Responsibility',
    description:
      'Класс/модуль должен иметь только одну причину для изменения. Каждый модуль выполняет одну конкретную задачу.',
    benefits: [
      'Легко понять и поддерживать',
      'Изменения в одном месте не влияют на другие',
      'Просто тестировать изолированно',
    ],
    codeExample: `// Каждый файл имеет ОДНУ ответственность

// vanilla.ts - ТОЛЬКО создание store
export const createStore = <T>(creator) => {
  let state: T
  const listeners = new Set()
  // ...
}

// react.ts - ТОЛЬКО React биндинги
export const useStore = (api, selector) => {
  return useSyncExternalStore(api.subscribe, /* ... */)
}

// middleware/persist.ts - ТОЛЬКО персистентность
export const persist = (config, options) => {
  // обработка localStorage, регидратации
}

// middleware/devtools.ts - ТОЛЬКО DevTools
export const devtools = (config, options) => {
  // интеграция с Redux DevTools
}`,
    structure: `packages/zustand-lite/src/
├── vanilla.ts      # ТОЛЬКО логика store
├── react.ts        # ТОЛЬКО React хуки
├── types.ts        # ТОЛЬКО определения типов
└── middleware/
    ├── persist.ts  # ТОЛЬКО персистентность
    ├── devtools.ts # ТОЛЬКО DevTools
    └── immer.ts    # ТОЛЬКО иммутабельность`,
  },
  {
    id: 'O',
    title: 'Open/Closed',
    description:
      'Программные сущности должны быть открыты для расширения, но закрыты для модификации.',
    benefits: [
      'Добавление функциональности без изменения существующего кода',
      'Снижает риск поломки',
      'Способствует плагинной архитектуре',
    ],
    codeExample: `// Ядро ЗАКРЫТО для модификации
const createStore = (creator) => {
  // Этот код не меняется при добавлении фич
  const listeners = new Set()
  // ...
}

// Но ОТКРЫТО для расширения через middleware
const logger = (config) => (set, get, api) => {
  const loggedSet = (...args) => {
    console.log('prev:', get())
    set(...args)
    console.log('next:', get())
  }
  return config(loggedSet, get, api)
}

// Добавление middleware не меняет createStore!
const analytics = (config) => (set, get, api) => {
  const trackedSet = (...args) => {
    set(...args)
    trackEvent('state_change', get())
  }
  return config(trackedSet, get, api)
}

// Использование - ядро не изменено, функционал расширен
const useStore = create(
  analytics(
    logger(
      (set) => ({ count: 0 })
    )
  )
)`,
  },
  {
    id: 'L',
    title: 'Liskov Substitution',
    description:
      'Объекты базового класса должны быть заменяемы объектами подклассов без нарушения корректности.',
    benefits: [
      'Согласованное поведение между реализациями',
      'Упрощает рефакторинг и тестирование',
      'Полиморфизм работает корректно',
    ],
    codeExample: `// Все stores реализуют один интерфейс
interface StoreApi<T> {
  getState: () => T
  setState: (partial: Partial<T>) => void
  subscribe: (listener: Listener<T>) => () => void
}

// Vanilla store реализует StoreApi
const vanillaStore = createStore<State>((set) => ({
  count: 0
}))

// Store с middleware ТОЖЕ реализует StoreApi
const persistedStore = createStore<State>(
  persist((set) => ({ count: 0 }), { name: 'store' })
)

// Оба можно использовать взаимозаменяемо!
function useAnyStore(store: StoreApi<State>) {
  const state = store.getState()
  store.subscribe((newState) => {
    console.log('State changed:', newState)
  })
}

// Работает с любым store, реализующим StoreApi
useAnyStore(vanillaStore)
useAnyStore(persistedStore)`,
  },
  {
    id: 'I',
    title: 'Interface Segregation',
    description:
      'Клиенты не должны зависеть от интерфейсов, которые они не используют.',
    benefits: [
      'Маленькие, сфокусированные интерфейсы',
      'Уменьшенная связанность между модулями',
      'Легче реализовывать и мокать',
    ],
    codeExample: `// ПЛОХО: Один большой интерфейс
interface BigStoreApi<T> {
  getState: () => T
  setState: (partial: Partial<T>) => void
  subscribe: (listener: Listener<T>) => () => void
  persist: PersistApi        // Не всем нужно!
  devtools: DevtoolsApi      // Не всем нужно!
  immer: ImmerApi            // Не всем нужно!
}

// ХОРОШО: Маленькие, сфокусированные интерфейсы
interface StoreApi<T> {
  getState: () => T
  setState: (partial: Partial<T>) => void
  subscribe: (listener: Listener<T>) => () => void
}

// Отдельные интерфейсы для middleware
interface WithPersist {
  persist: {
    rehydrate: () => Promise<void>
    hasHydrated: () => boolean
  }
}

interface WithDevtools {
  devtools: {
    send: (action: string) => void
  }
}

// Компонуйте только то, что нужно
type MyStore = StoreApi<State> & WithPersist

// Теперь код, не использующий devtools,
// не зависит от DevtoolsApi вообще`,
  },
  {
    id: 'D',
    title: 'Dependency Inversion',
    description:
      'Модули верхнего уровня не должны зависеть от модулей нижнего уровня. Оба должны зависеть от абстракций.',
    benefits: [
      'Слабая связанность между модулями',
      'Легко менять реализации',
      'Тестируемый код с мок-зависимостями',
    ],
    codeExample: `// ПЛОХО: Прямая зависимость от localStorage
const persist = (config, options) => {
  // Напрямую зависит от localStorage!
  const data = localStorage.getItem(options.name)
  // ...
}

// ХОРОШО: Зависимость от абстракции (интерфейса)
interface Storage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

const persist = (config, options: {
  name: string
  storage?: Storage  // Принимает ЛЮБУЮ реализацию storage
}) => {
  // Используем инжектированный storage или дефолтный
  const storage = options.storage ?? localStorage
  const data = storage.getItem(options.name)
  // ...
}

// Теперь легко тестировать с моком!
const mockStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}

// Тест без реального localStorage
const store = create(
  persist(
    (set) => ({ count: 0 }),
    { name: 'test', storage: mockStorage }
  )
)

// Также легко использовать другой storage
import AsyncStorage from '@react-native-async-storage'

const mobileStore = create(
  persist(
    (set) => ({ count: 0 }),
    { name: 'mobile', storage: AsyncStorage }
  )
)`,
  },
]

export default function SolidPage() {
  const [activePrinciple, setActivePrinciple] = useState('S')

  const principle = principles.find((p) => p.id === activePrinciple)!

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Принципы SOLID
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Как zustand-lite реализует принципы SOLID для поддерживаемого,
            расширяемого и тестируемого кода.
          </p>
        </div>

        {/* Principle tabs */}
        <div className="flex justify-center gap-2 mb-12">
          {principles.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePrinciple(p.id)}
              className={cn(
                'w-12 h-12 rounded-xl font-bold text-lg transition-all',
                activePrinciple === p.id
                  ? 'bg-primary-600 text-white scale-110'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              {p.id}
            </button>
          ))}
        </div>

        {/* Active principle */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Description */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {principle.id} - {principle.title}
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {principle.description}
            </p>

            {/* Benefits */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-green-800 dark:text-green-300 mb-4">
                Преимущества
              </h3>
              <ul className="space-y-2">
                {principle.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-green-700 dark:text-green-400">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Structure (for S principle) */}
            {principle.structure && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                <h3 className="font-semibold dark:text-white mb-4">
                  Структура файлов
                </h3>
                <pre className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                  {principle.structure}
                </pre>
              </div>
            )}
          </div>

          {/* Code example */}
          <div>
            <h3 className="text-lg font-semibold dark:text-white mb-4">
              Пример кода
            </h3>
            <CodeBlock
              code={principle.codeExample}
              title={`${principle.id.toLowerCase()}-principle.ts`}
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          {activePrinciple !== 'S' && (
            <button
              onClick={() => {
                const idx = principles.findIndex((p) => p.id === activePrinciple)
                setActivePrinciple(principles[idx - 1].id)
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-primary-600"
            >
              ← Назад
            </button>
          )}
          <div />
          {activePrinciple !== 'D' && (
            <button
              onClick={() => {
                const idx = principles.findIndex((p) => p.id === activePrinciple)
                setActivePrinciple(principles[idx + 1].id)
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-primary-600"
            >
              Далее →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
