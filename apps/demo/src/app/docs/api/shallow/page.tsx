import { CodeBlock } from '@/components/CodeBlock'

const signatureCode = `function shallow<T>(a: T, b: T): boolean`

const basicExample = `import { shallow } from 'zustand-lite'

shallow({ a: 1 }, { a: 1 })           // true
shallow({ a: 1 }, { a: 2 })           // false
shallow({ a: 1, b: 2 }, { a: 1 })     // false (разное количество ключей)

shallow([1, 2, 3], [1, 2, 3])         // true
shallow([1, 2], [1, 2, 3])            // false

shallow(new Map([['a', 1]]), new Map([['a', 1]]))  // true
shallow(new Set([1, 2]), new Set([1, 2]))          // true`

const withSelectorExample = `import { create, shallow } from 'zustand-lite'

interface State {
  user: { name: string; age: number }
  settings: { theme: string }
  updateName: (name: string) => void
}

const useStore = create<State>()((set) => ({
  user: { name: 'John', age: 25 },
  settings: { theme: 'dark' },
  updateName: (name) => set((s) => ({ user: { ...s.user, name } })),
}))

function UserProfile() {
  // ✅ Ререндер только при изменении user
  const { name, age } = useStore(
    (s) => ({ name: s.user.name, age: s.user.age }),
    shallow
  )

  return <div>{name}, {age}</div>
}`

const comparisonExample = `// Без shallow — ререндер при ЛЮБОМ изменении state
const data = useStore((s) => ({ a: s.a, b: s.b }))
// Каждый вызов создаёт новый объект → всегда "изменился"

// С shallow — ререндер только при изменении a или b
const data = useStore(
  (s) => ({ a: s.a, b: s.b }),
  shallow
)
// Сравнивает { a, b } по значениям`

const howItWorksCode = `// Упрощённая реализация
function shallow(a, b) {
  // Проверка примитивов и ссылок
  if (Object.is(a, b)) return true

  // Проверка на объекты
  if (typeof a !== 'object' || typeof b !== 'object') return false
  if (a === null || b === null) return false

  // Специальные случаи: Map и Set
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false
    for (const [key, value] of a) {
      if (!Object.is(value, b.get(key))) return false
    }
    return true
  }

  // Массивы и объекты
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!Object.is(a[key], b[key])) return false
  }

  return true
}`

const useCasesCode = `// 1. Выбор нескольких полей
const { name, email } = useStore(
  (s) => ({ name: s.name, email: s.email }),
  shallow
)

// 2. Массив из store
const items = useStore(
  (s) => s.items.filter(i => i.active),
  shallow // Сравнит массивы поэлементно
)

// 3. Вложенные объекты (только первый уровень!)
const user = useStore((s) => s.user, shallow)
// ⚠️ Если user.profile изменится, shallow это не заметит`

export default function ShallowPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        shallow
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
        Функция поверхностного сравнения для оптимизации ререндеров.
      </p>

      {/* Signature */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Сигнатура
        </h2>
        <CodeBlock code={signatureCode} title="types.ts" showLineNumbers={false} />
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Возвращает <code className="text-primary-600 dark:text-primary-400">true</code> если
          значения равны по первому уровню вложенности.
        </p>
      </section>

      {/* Basic Usage */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Базовое использование
        </h2>
        <CodeBlock code={basicExample} title="shallow-examples.ts" />
      </section>

      {/* With Selectors */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          С селекторами
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Основное применение — оптимизация ререндеров при выборе нескольких полей:
        </p>
        <CodeBlock code={withSelectorExample} title="with-selector.tsx" />
      </section>

      {/* Comparison */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Зачем нужен shallow
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          По умолчанию zustand-lite использует <code className="text-primary-600 dark:text-primary-400">Object.is</code> для
          сравнения. Это быстро, но создаёт проблему с объектами:
        </p>
        <CodeBlock code={comparisonExample} title="comparison.ts" />
      </section>

      {/* How It Works */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Как работает
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          <code className="text-primary-600 dark:text-primary-400">shallow</code> сравнивает
          значения по первому уровню вложенности:
        </p>
        <CodeBlock code={howItWorksCode} title="how-it-works.ts" />
      </section>

      {/* Use Cases */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Примеры использования
        </h2>
        <CodeBlock code={useCasesCode} title="use-cases.ts" />
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            <strong>Важно:</strong> <code>shallow</code> сравнивает только первый уровень.
            Для глубокого сравнения используйте библиотеки типа <code>lodash.isEqual</code>.
          </p>
        </div>
      </section>

      {/* Supported Types */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Поддерживаемые типы
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 pr-4 font-medium">Тип</th>
                <th className="text-left py-3 pr-4 font-medium">Поддержка</th>
                <th className="text-left py-3 font-medium">Как сравнивает</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 dark:text-gray-400">
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-3 pr-4">Примитивы</td>
                <td className="py-3 pr-4 text-green-600">✓</td>
                <td className="py-3">Object.is</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-3 pr-4">Объекты</td>
                <td className="py-3 pr-4 text-green-600">✓</td>
                <td className="py-3">Ключи + Object.is для значений</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-3 pr-4">Массивы</td>
                <td className="py-3 pr-4 text-green-600">✓</td>
                <td className="py-3">Длина + Object.is для элементов</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-3 pr-4">Map</td>
                <td className="py-3 pr-4 text-green-600">✓</td>
                <td className="py-3">Размер + Object.is для значений</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-3 pr-4">Set</td>
                <td className="py-3 pr-4 text-green-600">✓</td>
                <td className="py-3">Размер + наличие элементов</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">Вложенные объекты</td>
                <td className="py-3 pr-4 text-yellow-600">⚠</td>
                <td className="py-3">Только первый уровень</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* See Also */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          См. также
        </h2>
        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
          <li>
            <a href="/docs/api/create" className="text-primary-600 dark:text-primary-400 hover:underline">
              create
            </a> — создание store с селекторами
          </li>
          <li>
            <a href="/docs/middleware/subscribe-with-selector" className="text-primary-600 dark:text-primary-400 hover:underline">
              subscribeWithSelector
            </a> — подписки с shallow
          </li>
        </ul>
      </section>
    </div>
  )
}
