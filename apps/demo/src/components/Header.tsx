'use client'

import Link from 'next/link'
import { ShoppingCart, Moon, Sun, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCartStore, selectCartItemCount } from '@/stores/cart-store'
import { useThemeStore } from '@/stores/theme-store'
import { useHydration } from 'zustand-lite/ssr'

const navigation = [
  { name: 'Главная', href: '/' },
  { name: 'Документация', href: '/docs' },
  { name: 'Демо', href: '/demo' },
  { name: 'Примеры', href: '/examples' },
  { name: 'SOLID', href: '/principles/solid' },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Hydration for SSR
  const cartHydrated = useHydration(useCartStore)
  const themeHydrated = useHydration(useThemeStore)

  // Cart state
  const itemCount = useCartStore(selectCartItemCount)
  const openCart = useCartStore((s) => s.openCart)

  // Theme state
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)

  // Rehydrate stores on client
  useEffect(() => {
    // Type assertions needed due to middleware type complexity
    (useCartStore as unknown as { persist: { rehydrate: () => void } }).persist.rehydrate()
    ;(useThemeStore as unknown as { persist: { rehydrate: () => void } }).persist.rehydrate()
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm">ZL</span>
              </div>
              <span className="font-semibold text-lg dark:text-white">
                zustand-lite
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Переключить тему"
            >
              {themeHydrated && resolvedTheme === 'dark' ? (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>

            {/* Cart button */}
            <button
              onClick={openCart}
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Открыть корзину"
            >
              <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              {cartHydrated && itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center animate-fade-in">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Открыть меню"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800 animate-slide-down">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block py-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  )
}
