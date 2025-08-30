'use client';

import React, { useState, useEffect } from 'react';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { ImageAnalysisResult } from '@/lib/ai-service';
import { cn } from '@/lib/utils';

export default function AIAssistantPage() {
  const [recentAnalysis] = useState<ImageAnalysisResult[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    // <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <AIAssistant 
          recentAnalysis={recentAnalysis}
          isOpen={true}
          isMobile={isMobile}
        />
      </div>
    // </ProtectedRoute>
  );
}