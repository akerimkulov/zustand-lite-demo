'use client'

import { products } from '@/data/products'
import { ProductCard } from '@/components/ProductCard'
import { StateInspector } from '@/components/StateInspector'
import { ShoppingCart, Database, Bug } from 'lucide-react'

export default function DemoPage() {
  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            E-commerce демо корзины
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Интерактивное демо zustand-lite в действии. Добавляйте товары в корзину,
            наблюдайте за обновлением состояния в реальном времени и испытайте persist middleware.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <div className="flex items-center gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <ShoppingCart className="w-8 h-8 text-primary-600" />
            <div>
              <h3 className="font-medium dark:text-white">Состояние корзины</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Добавление/удаление товаров реактивно
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Database className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-medium dark:text-white">Persist</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Обновите страницу - данные сохранятся!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <Bug className="w-8 h-8 text-purple-600" />
            <div>
              <h3 className="font-medium dark:text-white">DevTools</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Откройте Redux DevTools (F12)
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Products */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold dark:text-white mb-6">
              Товары
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>

          {/* State Inspector */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold dark:text-white mb-6">
              Инспектор состояния
            </h2>
            <StateInspector className="sticky top-24" />

            {/* Tips */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                Попробуйте:
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <li>• Добавить товары в корзину</li>
                <li>• Наблюдать за обновлением состояния</li>
                <li>• Обновить страницу (данные сохранятся!)</li>
                <li>• Открыть DevTools (F12) → вкладка Redux</li>
                <li>• Переключить тёмную тему</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
