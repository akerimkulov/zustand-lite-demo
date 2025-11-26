'use client'

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  code: string
  language?: string
  title?: string
  showLineNumbers?: boolean
  className?: string
}

export function CodeBlock({
  code,
  language = 'typescript',
  title,
  showLineNumbers = true,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          {title && (
            <span className="ml-2 text-sm text-gray-400 font-mono">{title}</span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-gray-700 rounded transition-colors"
          title="Скопировать код"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      {/* Code */}
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        showLineNumbers={showLineNumbers}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '0.875rem',
        }}
      >
        {code.trim()}
      </SyntaxHighlighter>
    </div>
  )
}
