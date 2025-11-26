'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { DocsSidebar } from '@/components/docs/DocsSidebar'
import { cn } from '@/lib/utils'

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto">
            <DocsSidebar />
          </aside>

          {/* Mobile Sidebar Toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden fixed bottom-6 right-6 z-40 p-4 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors"
            aria-label="Открыть меню"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 z-50 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Mobile Sidebar */}
          <aside
            className={cn(
              'lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 transform transition-transform duration-300 ease-in-out overflow-y-auto',
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <span className="font-semibold text-gray-900 dark:text-white">
                Документация
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                aria-label="Закрыть меню"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              <DocsSidebar onNavigate={() => setSidebarOpen(false)} />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <article className="prose prose-gray dark:prose-invert max-w-none">
              {children}
            </article>
          </main>
        </div>
      </div>
    </div>
  )
}
