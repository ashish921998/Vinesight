'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Brain, 
  Camera, 
  MessageCircle, 
  BarChart3, 
  Eye,
  Lightbulb,
  Zap,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DiseaseDetection } from '@/components/ai/DiseaseDetection';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { AIAnalyticsDashboard } from '@/components/ai/AIAnalyticsDashboard';
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
      {/* Header */}
      <div className={cn(
        "bg-white shadow-sm border-b",
        isMobile ? "py-3" : "py-6"
      )}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 bg-green-100 rounded-lg",
              isMobile && "p-1.5"
            )}>
              <Brain className={cn(
                "text-green-600",
                isMobile ? "w-5 h-5" : "w-6 h-6"
              )} />
            </div>
            <div>
              <h1 className={cn(
                "font-bold text-gray-900",
                isMobile ? "text-lg" : "text-2xl"
              )}>
                {isMobile ? t('ai_assistant', 'AI Assistant') : t('ai_farming_assistant', 'AI Farming Assistant')}
              </h1>
              {!isMobile && (
                <p className="text-gray-600 text-sm sm:text-base">
                  {t('ai_subtitle', 'Revolutionize your farming with artificial intelligence')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={cn(
        "max-w-7xl mx-auto px-4",
        isMobile ? "py-2" : "py-6"
      )}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {!isMobile && (
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">
                {t('overview', 'Overview')}
              </TabsTrigger>
              <TabsTrigger value="detection" className="text-xs sm:text-sm">
                {t('detection', 'Detection')}
              </TabsTrigger>
              <TabsTrigger value="chat" className="text-xs sm:text-sm">
                {t('chat', 'Chat')}
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs sm:text-sm">
                {t('analytics', 'Analytics')}
              </TabsTrigger>
            </TabsList>
          )}
          
          {isMobile && (
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat" className="text-xs">
                {t('chat', 'Chat')}
              </TabsTrigger>
              <TabsTrigger value="detection" className="text-xs">
                {t('detection', 'Scan')}
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs">
                {t('insights', 'Insights')}
              </TabsTrigger>
            </TabsList>
          )}

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Hero Section */}
            <Card className="border-gray-200 bg-gradient-to-r from-purple-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl sm:text-2xl font-bold mb-2">
                      {t('welcome_ai', 'Welcome to the Future of Farming')}
                    </h2>
                    <p className="text-purple-100 mb-4">
                      {t('ai_intro', 'Our AI-powered tools help you make smarter decisions, detect diseases early, and optimize your farming operations.')}
                    </p>
                    <Button 
                      variant="secondary" 
                      onClick={() => setActiveTab('detection')}
                      className="bg-white text-purple-600 hover:bg-gray-100"
                    >
                      {t('get_started', 'Get Started')}
                    </Button>
                  </div>
                  <div className="hidden sm:block">
                    <Brain className="w-24 h-24 text-purple-200" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature, index) => (
                <Card 
                  key={index}
                  className="border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setActiveTab(feature.tab)}
                >
                  <CardContent className="p-6">
                    <div className={`inline-flex p-3 rounded-lg ${feature.bgColor} mb-4`}>
                      <div className={feature.color}>
                        {feature.icon}
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Benefits Section */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>{t('key_benefits', 'Key Benefits')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                        <div className="text-blue-600">
                          {benefit.icon}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">{benefit.title}</h4>
                        <p className="text-gray-600 text-sm">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Analysis */}
            {recentAnalysis.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('recent_analysis', 'Recent Analysis')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentAnalysis.slice(0, 3).map((analysis, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Camera className="w-5 h-5 text-gray-400" />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">
                            {analysis.diseaseDetection?.disease || 'Plant Analysis'}
                          </h4>
                          <p className="text-gray-500 text-xs">
                            {analysis.diseaseDetection && 
                              `${(analysis.diseaseDetection.confidence * 100).toFixed(0)}% confidence`
                            }
                          </p>
                        </div>
                        <div className="text-right">
                          {analysis.plantHealth && (
                            <div className="text-sm font-medium">
                              {analysis.plantHealth.overallHealth.toFixed(0)}% health
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Disease Detection Tab */}
          <TabsContent value="detection">
            <DiseaseDetection onAnalysisComplete={handleAnalysisComplete} />
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <div className={cn(
              "h-[600px]",
              isMobile && "h-[calc(100vh-140px)]"
            )}>
              <AIAssistant 
                recentAnalysis={recentAnalysis}
                isOpen={true}
              />
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AIAnalyticsDashboard 
              recentAnalysis={recentAnalysis}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Chat Floating Button */}
      {isMobile && !isChatOpen && activeTab !== 'chat' && (
        <AIAssistant 
          recentAnalysis={recentAnalysis}
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(!isChatOpen)}
        />
      )}

      {/* Mobile Chat Modal */}
      {isMobile && isChatOpen && (
        <div className="fixed inset-0 z-50">
          <AIAssistant 
            recentAnalysis={recentAnalysis}
            isOpen={isChatOpen}
            onToggle={() => setIsChatOpen(false)}
          />
        </div>
      )}
      </div>
    </ProtectedRoute>
  );
}