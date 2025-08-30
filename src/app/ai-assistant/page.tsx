'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Camera, 
  MessageCircle, 
  BarChart3, 
  Eye,
  Lightbulb,
  Zap,
  TrendingUp
} from 'lucide-react';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ImageAnalysisResult } from '@/lib/ai-service';
import { cn } from '@/lib/utils';

export default function AIAssistantPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [recentAnalysis, setRecentAnalysis] = useState<ImageAnalysisResult[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile and set default tab
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // Default to chat tab on mobile for better UX
      if (mobile && activeTab === 'overview') {
        setActiveTab('chat');
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleAnalysisComplete = (result: ImageAnalysisResult) => {
    setRecentAnalysis(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 analyses
  };

  const features = [
    {
      icon: <Camera className="w-6 h-6" />,
      title: t('disease_detection', 'Disease Detection'),
      description: t('disease_detection_desc', 'AI-powered plant disease identification using your camera'),
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      tab: 'detection'
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: t('smart_assistant', 'Smart Assistant'),
      description: t('smart_assistant_desc', 'Chat with AI for farming advice and recommendations'),
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      tab: 'chat'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: t('analytics_insights', 'Analytics & Insights'),
      description: t('analytics_desc', 'AI-driven farm analytics and performance insights'),
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      tab: 'analytics'
    }
  ];

  const benefits = [
    {
      icon: <Eye className="w-5 h-5" />,
      title: t('early_detection', 'Early Detection'),
      description: t('early_detection_desc', 'Identify diseases before they spread')
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: t('increased_yield', 'Increased Yield'),
      description: t('increased_yield_desc', '15-20% improvement in crop yield')
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: t('resource_optimization', 'Resource Optimization'),
      description: t('resource_optimization_desc', 'Reduce water and fertilizer usage by 25%')
    },
    {
      icon: <Lightbulb className="w-5 h-5" />,
      title: t('smart_recommendations', 'Smart Recommendations'),
      description: t('smart_recommendations_desc', 'Personalized farming advice based on your data')
    }
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className={cn(
          "h-[600px]",
          isMobile && "h-[calc(100vh-240px)]"
        )}>
          <AIAssistant 
            recentAnalysis={recentAnalysis}
            isOpen={true}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}