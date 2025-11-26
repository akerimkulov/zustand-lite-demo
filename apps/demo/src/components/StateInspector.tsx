'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '@/stores/cart-store'
import { cn } from '@/lib/utils'

interface StateInspectorProps {
  className?: string
}

export function StateInspector({ className }: StateInspectorProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    items: true,
  })
  const [updateCount, setUpdateCount] = useState(0)

  // Get entire cart state
  const state = useCartStore((s) => ({
    items: s.items,
    isOpen: s.isOpen,
  }))

  // Track updates
  useEffect(() => {
    const unsubscribe = useCartStore.subscribe(() => {
      setUpdateCount((c) => c + 1)
    })
    return unsubscribe
  }, [])

  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const renderValue = (value: unknown, key: string, depth = 0): JSX.Element => {
    if (value === null) {
      return <span className="text-gray-400">null</span>
    }

    if (value === undefined) {
      return <span className="text-gray-400">undefined</span>
    }

    if (typeof value === 'boolean') {
      return (
        <span className={value ? 'text-green-500' : 'text-red-500'}>
          {String(value)}
        </span>
      )
    }

    if (typeof value === 'number') {
      return <span className="text-blue-500">{value}</span>
    }

    if (typeof value === 'string') {
      return <span className="text-amber-500">"{value}"</span>
    }

    if (Array.isArray(value)) {
      const isExpanded = expanded[key]
      return (
        <div>
          <button
            onClick={() => toggleExpand(key)}
            className="flex items-center gap-1 hover:bg-gray-700 rounded px-1 -ml-1"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            <span className="text-gray-400">Array({value.length})</span>
          </button>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="ml-4 border-l border-gray-700 pl-2 overflow-hidden"
              >
                {value.map((item, index) => (
                  <div key={index} className="flex">
                    <span className="text-gray-500 mr-2">[{index}]:</span>
                    {renderValue(item, `${key}.${index}`, depth + 1)}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )
    }

    if (typeof value === 'object') {
      const isExpanded = expanded[key]
      const entries = Object.entries(value)
      return (
        <div>
          <button
            onClick={() => toggleExpand(key)}
            className="flex items-center gap-1 hover:bg-gray-700 rounded px-1 -ml-1"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            <span className="text-gray-400">{`{...}`}</span>
          </button>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="ml-4 border-l border-gray-700 pl-2 overflow-hidden"
              >
                {entries.map(([k, v]) => (
                  <div key={k} className="flex">
                    <span className="text-purple-400 mr-2">{k}:</span>
                    {renderValue(v, `${key}.${k}`, depth + 1)}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )
    }

    return <span>{String(value)}</span>
  }

  return (
    <div
      className={cn(
        'bg-gray-900 rounded-lg overflow-hidden font-mono text-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-white font-semibold">Инспектор состояния</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Обновлений: {updateCount}
          </span>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-gray-700 rounded"
          >
            {isOpen ? (
              <EyeOff className="w-4 h-4 text-gray-400" />
            ) : (
              <Eye className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 text-gray-300 max-h-80 overflow-y-auto">
              <div className="text-cyan-400 mb-2">CartStore</div>
              {Object.entries(state).map(([key, value]) => (
                <div key={key} className="flex">
                  <span className="text-purple-400 mr-2">{key}:</span>
                  {renderValue(value, key)}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
