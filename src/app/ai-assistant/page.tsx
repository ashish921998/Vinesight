'use client';

import React, { useState, useEffect } from 'react';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { ImageAnalysisResult } from '@/lib/ai-service';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AIAssistantPage() {
  const [recentAnalysis] = useState<ImageAnalysisResult[]>([]);

  return (
    <ProtectedRoute>
          <AIAssistant 
            recentAnalysis={recentAnalysis}
            isOpen={true}
          />
    </ProtectedRoute>
  );
}