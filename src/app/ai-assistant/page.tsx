'use client'

import React, { useState } from 'react'
import { LazyAIAssistant } from '@/components/lazy/LazyAIAssistant'
import { ImageAnalysisResult } from '@/lib/ai-service'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function AIAssistantPage() {
  const [recentAnalysis] = useState<ImageAnalysisResult[]>([])

  return (
    <ProtectedRoute>
      <LazyAIAssistant recentAnalysis={recentAnalysis} isOpen={true} />
    </ProtectedRoute>
  )
}
