'use client'

import { CodeBlock } from '@/components/CodeBlock'
import { cn } from '@/lib/utils'
import { RotateCcw } from 'lucide-react'

interface LiveDemoProps {
  title: string
  description?: string
  children: React.ReactNode
  code: string
  codeTitle?: string
  onReset?: () => void
  className?: string
}

export function LiveDemo({
  title,
  description,
  children,
  code,
  codeTitle = 'example.tsx',
  onReset,
  className,
}: LiveDemoProps) {
  return (
    <div className={cn('my-8', className)}>
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Interactive demo panel */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
              {description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {description}
                </p>
              )}
            </div>
            {onReset && (
              <button
                onClick={onReset}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Сбросить"
              >
                <RotateCcw className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>
          <div className="demo-content">{children}</div>
        </div>

        {/* Code display */}
        <CodeBlock code={code} title={codeTitle} />
      </div>
    </div>
  )
}
