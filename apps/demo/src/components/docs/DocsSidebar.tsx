'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export interface NavItem {
  title: string
  href: string
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const docsNavigation: NavSection[] = [
  {
    title: 'Начало работы',
    items: [
      { title: 'Введение', href: '/docs' },
      { title: 'Установка', href: '/docs/installation' },
      { title: 'Быстрый старт', href: '/docs/quick-start' },
    ],
  },
  {
    title: 'Core API',
    items: [
      { title: 'Обзор', href: '/docs/api' },
      { title: 'create', href: '/docs/api/create' },
      { title: 'useStore', href: '/docs/api/use-store' },
      { title: 'createStore', href: '/docs/api/create-store' },
      { title: 'shallow', href: '/docs/api/shallow' },
    ],
  },
  {
    title: 'Middleware',
    items: [
      { title: 'Обзор', href: '/docs/middleware' },
      { title: 'persist', href: '/docs/middleware/persist' },
      { title: 'devtools', href: '/docs/middleware/devtools' },
      { title: 'immer', href: '/docs/middleware/immer' },
      { title: 'subscribeWithSelector', href: '/docs/middleware/subscribe-with-selector' },
      { title: 'combine', href: '/docs/middleware/combine' },
    ],
  },
  {
    title: 'Продвинутое',
    items: [
      { title: 'SSR', href: '/docs/ssr' },
      { title: 'Тестирование', href: '/docs/testing' },
    ],
  },
]

interface DocsSidebarProps {
  className?: string
  onNavigate?: () => void
}

export function DocsSidebar({ className, onNavigate }: DocsSidebarProps) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    // Expand all sections by default
    const initial: Record<string, boolean> = {}
    docsNavigation.forEach((section) => {
      initial[section.title] = true
    })
    return initial
  })

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  const isActive = (href: string) => {
    if (href === '/docs') {
      return pathname === '/docs'
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className={cn('w-64 pr-4', className)}>
      {docsNavigation.map((section) => (
        <div key={section.title} className="mb-6">
          <button
            onClick={() => toggleSection(section.title)}
            className="flex items-center justify-between w-full text-sm font-semibold text-gray-900 dark:text-white mb-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            {section.title}
            {expandedSections[section.title] ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {expandedSections[section.title] && (
            <ul className="space-y-1 ml-2 border-l border-gray-200 dark:border-gray-700">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      'block pl-4 py-1.5 text-sm transition-colors border-l -ml-px',
                      isActive(item.href)
                        ? 'text-primary-600 dark:text-primary-400 border-primary-600 dark:border-primary-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </nav>
  )
}
