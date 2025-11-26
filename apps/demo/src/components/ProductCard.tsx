'use client'

import Image from 'next/image'
import { Plus, Check } from 'lucide-react'
import { useCartStore, selectIsInCart } from '@/stores/cart-store'
import type { Product } from '@/data/products'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const isInCart = useCartStore(selectIsInCart(product.id))

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute top-2 right-2">
          <span className="px-2 py-1 bg-white/90 dark:bg-gray-800/90 text-xs rounded-full">
            {product.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
            ${product.price}
          </span>

          <button
            onClick={() => addItem(product)}
            className={cn(
              'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all',
              isInCart
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            )}
          >
            {isInCart ? (
              <>
                <Check className="w-4 h-4" />
                В корзине
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Добавить
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
