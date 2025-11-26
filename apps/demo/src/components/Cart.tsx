'use client'

import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useCartStore,
  selectCartTotal,
  selectCartItemCount,
} from '@/stores/cart-store'

export function Cart() {
  const isOpen = useCartStore((s) => s.isOpen)
  const closeCart = useCartStore((s) => s.closeCart)
  const items = useCartStore((s) => s.items)
  const total = useCartStore(selectCartTotal)
  const itemCount = useCartStore(selectCartItemCount)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const clearCart = useCartStore((s) => s.clearCart)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Cart panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary-600" />
                <h2 className="font-semibold text-lg dark:text-white">
                  Корзина ({itemCount})
                </h2>
              </div>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Ваша корзина пуста
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Добавьте товары для начала
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <motion.div
                      key={item.product.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="flex gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
                    >
                      {/* Image */}
                      <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm dark:text-white truncate">
                          {item.product.name}
                        </h3>
                        <p className="text-primary-600 dark:text-primary-400 font-semibold">
                          ${item.product.price}
                        </p>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.quantity - 1
                              )
                            }
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.quantity + 1
                              )
                            }
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="ml-auto p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-800 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Итого</span>
                  <span className="text-xl font-bold dark:text-white">
                    ${total.toFixed(2)}
                  </span>
                </div>

                <button className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors">
                  Оформить заказ
                </button>

                <button
                  onClick={clearCart}
                  className="w-full py-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
                >
                  Очистить корзину
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
