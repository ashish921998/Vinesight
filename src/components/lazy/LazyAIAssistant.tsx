'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Lazy load the AI Assistant for better initial page load
export const LazyAIAssistant = dynamic(
  () => import('../ai/AIAssistant').then((mod) => ({ default: mod.AIAssistant })),
  {
    ssr: false,
    loading: () => (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-full p-4 shadow-lg">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    )
  }
)
