'use client'

import { useCounterDemoStore } from '@/stores/docs/counter-demo-store'

export function CounterDemo() {
  const count = useCounterDemoStore((s) => s.count)
  const increment = useCounterDemoStore((s) => s.increment)
  const decrement = useCounterDemoStore((s) => s.decrement)
  const reset = useCounterDemoStore((s) => s.reset)

  return (
    <div className="text-center">
      <div className="text-5xl font-bold text-primary-600 mb-6">{count}</div>
      <div className="flex gap-2 justify-center">
        <button
          onClick={decrement}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-gray-900 dark:text-white"
        >
          −
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-gray-900 dark:text-white"
        >
          Сброс
        </button>
        <button
          onClick={increment}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  )
}

export function useResetCounterDemo() {
  return useCounterDemoStore((s) => s.reset)
}
