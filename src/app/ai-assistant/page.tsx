'use client';

import React, { useState, useEffect } from 'react';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { ImageAnalysisResult } from '@/lib/ai-service';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SupabaseService } from '@/lib/supabase-service';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export default function AIAssistantPage() {
  const { user } = useSupabaseAuth();
  const [recentAnalysis, setRecentAnalysis] = useState<ImageAnalysisResult[]>([]);
  const [farmData, setFarmData] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        // Get user's farms to provide context
        const farms = await SupabaseService.getFarmsForUser(user.id);
        if (farms && farms.length > 0) {
          setFarmData(farms[0]); // Use first farm as default context
        }

        // Load recent analysis results from database
        const { data: analysisRecords } = await SupabaseService.supabase
          .from('image_analysis_records')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (analysisRecords) {
          const analysisResults: ImageAnalysisResult[] = analysisRecords.map(record => ({
            id: record.id,
            image: record.image_url,
            results: record.analysis_results,
            confidence: record.confidence_score || 0.8,
            timestamp: new Date(record.created_at)
          }));
          setRecentAnalysis(analysisResults);
        }
      } catch (error) {
        console.error('Error loading AI Assistant data:', error);
      }
    };

    loadData();
  }, [user]);

  return (
    <ProtectedRoute>
      <AIAssistant 
        farmData={farmData}
        recentAnalysis={recentAnalysis}
        isOpen={true}
      />
    </ProtectedRoute>
  );
}