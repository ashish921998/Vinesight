'use client'

import { memo, useEffect, useMemo, useState } from 'react'
import type { Components } from 'react-markdown'
import { cn } from '@/lib/utils'

const skeleton = <div className="animate-pulse bg-muted rounded-md h-20" />

export interface LazyMarkdownProps {
  content: string
  className?: string
}

export const LazyMarkdown = memo(function LazyMarkdown({ content, className }: LazyMarkdownProps) {
  const [Markdown, setMarkdown] = useState<null | (typeof import('react-markdown'))['default']>(
    null
  )
  const [remarkGfm, setRemarkGfm] = useState<any>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const [markdownModule, gfmModule] = await Promise.all([
          import('react-markdown'),
          import('remark-gfm')
        ])

        if (!cancelled) {
          setMarkdown(() => markdownModule.default)
          setRemarkGfm(() => gfmModule.default ?? gfmModule)
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to load markdown dependencies', error)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  const components = useMemo<Components>(
    () => ({
      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
      ul: ({ children, ...props }) => (
        <ul
          {...props}
          className={cn('list-disc list-outside pl-5 mb-2 space-y-1', props.className)}
        >
          {children}
        </ul>
      ),
      ol: ({ children, ...props }) => (
        <ol
          {...props}
          className={cn('list-decimal list-outside pl-5 mb-2 space-y-1', props.className)}
        >
          {children}
        </ol>
      ),
      li: ({ children, ...props }) => (
        <li {...props} className={cn('leading-relaxed', props.className)}>
          {children}
        </li>
      ),
      code: ({ children, ...props }) => {
        const isInline = !props.className?.includes('language-')
        return isInline ? (
          <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
        ) : (
          <pre className="bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto mb-2">
            <code>{children}</code>
          </pre>
        )
      },
      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
      em: ({ children }) => <em className="italic">{children}</em>,
      h1: ({ children }) => <h1 className="text-base font-bold mb-2">{children}</h1>,
      h2: ({ children }) => <h2 className="text-sm font-semibold mb-2">{children}</h2>,
      h3: ({ children }) => <h3 className="text-sm font-medium mb-1">{children}</h3>,
      blockquote: ({ children }) => (
        <blockquote className="border-l-2 border-gray-300 pl-3 ml-2 my-2 text-gray-700">
          {children}
        </blockquote>
      )
    }),
    []
  )

  if (!Markdown || !remarkGfm) {
    return skeleton
  }

  return (
    <div className={className}>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </Markdown>
    </div>
  )
})
