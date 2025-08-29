'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Eye,
  Droplets,
  Zap,
  DollarSign,
  Calendar,
  MapPin,
  Thermometer,
  Cloud
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AIService, AIRecommendation, ImageAnalysisResult } from '@/lib/ai-service';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface AIAnalyticsDashboardProps {
  farmData?: any;
  weatherData?: any;
  recentAnalysis?: ImageAnalysisResult[];
  className?: string;
}

interface AnalyticsData {
  farmHealth: {
    score: number;
    trend: 'up' | 'down' | 'stable';
    factors: { name: string; impact: number; status: 'good' | 'warning' | 'critical' }[];
  };
  predictions: {
    yield: { value: number; confidence: number; trend: 'up' | 'down' | 'stable' };
    harvest: { date: string; quality: 'excellent' | 'good' | 'average' | 'poor' };
    weather: { risk: 'low' | 'medium' | 'high'; forecast: string };
  };
  recommendations: AIRecommendation[];
  insights: {
    type: 'success' | 'warning' | 'info' | 'error';
    title: string;
    description: string;
    action?: string;
  }[];
}

const AIAnalyticsDashboard = memo(function AIAnalyticsDashboard({ 
  farmData, 
  weatherData, 
  recentAnalysis, 
  className 
}: AIAnalyticsDashboardProps) {
  const { t, i18n } = useTranslation();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const generateAnalytics = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Simulate AI analytics generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockAnalytics: AnalyticsData = {
        farmHealth: {
          score: 78 + Math.random() * 15,
          trend: Math.random() > 0.5 ? 'up' : 'stable',
          factors: [
            { name: 'Soil Health', impact: 85, status: 'good' },
            { name: 'Disease Pressure', impact: 65, status: 'warning' },
            { name: 'Irrigation Efficiency', impact: 90, status: 'good' },
            { name: 'Nutrient Levels', impact: 75, status: 'good' },
            { name: 'Weather Impact', impact: 60, status: 'warning' }
          ]
        },
        predictions: {
          yield: {
            value: 12500 + Math.random() * 2000,
            confidence: 78 + Math.random() * 15,
            trend: 'up'
          },
          harvest: {
            date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            quality: 'good'
          },
          weather: {
            risk: 'medium',
            forecast: 'Moderate rainfall expected in next 7 days'
          }
        },
        recommendations: await AIService.generateRecommendations(
          farmData,
          weatherData,
          recentAnalysis?.map(r => r.diseaseDetection).filter((d): d is NonNullable<typeof d> => d !== undefined) || []
        ),
        insights: [
          {
            type: 'success',
            title: 'Irrigation Optimization',
            description: 'Your current irrigation schedule is 15% more efficient than regional average',
            action: 'Continue current schedule'
          },
          {
            type: 'warning',
            title: 'Disease Risk Alert',
            description: 'Weather conditions favor fungal diseases in next 5 days',
            action: 'Consider preventive treatment'
          },
          {
            type: 'info',
            title: 'Market Opportunity',
            description: 'Premium grape prices are 20% higher this season',
            action: 'Focus on quality improvements'
          }
        ]
      };
      
      setAnalytics(mockAnalytics);
    } catch (error) {
      // Handle error silently in production
      if (process.env.NODE_ENV === 'development') {
        console.error('Analytics generation failed:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [farmData, weatherData, recentAnalysis, selectedTimeframe]);

  useEffect(() => {
    generateAnalytics();
  }, [generateAnalytics]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 60) return 'bg-orange-100 border-gray-200';
    return 'bg-red-100 border-red-200';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <div className="w-4 h-4 rounded-full bg-gray-400" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Eye className="w-4 h-4 text-blue-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className={cn("space-y-4 sm:space-y-6", className)}>
      {/* Timeframe Selector */}
      <div className="flex justify-end">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['7d', '30d', '90d'] as const).map((timeframe) => (
            <Button
              key={timeframe}
              variant={selectedTimeframe === timeframe ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedTimeframe(timeframe)}
              className="text-xs"
            >
              {timeframe === '7d' ? '7 Days' : timeframe === '30d' ? '30 Days' : '90 Days'}
            </Button>
          ))}
        </div>
      </div>

      {/* Farm Health Overview */}
      <Card className={cn("border-2", getHealthBgColor(analytics.farmHealth.score))}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg sm:text-xl flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {t('farm_health_score', 'Farm Health Score')}
            </span>
            <div className="flex items-center gap-2">
              {getTrendIcon(analytics.farmHealth.trend)}
              <span className={cn("text-2xl sm:text-3xl font-bold", getHealthColor(analytics.farmHealth.score))}>
                {analytics.farmHealth.score.toFixed(0)}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {analytics.farmHealth.factors.map((factor, index) => (
              <div key={index} className="bg-white rounded-lg p-3 border">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium">{factor.name}</span>
                  <Badge 
                    variant={factor.status === 'good' ? 'default' : 
                            factor.status === 'warning' ? 'secondary' : 'destructive'}
                    className="text-xs"
                  >
                    {factor.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={cn(
                        "h-2 rounded-full",
                        factor.status === 'good' ? 'bg-green-500' :
                        factor.status === 'warning' ? 'bg-orange-500' : 'bg-red-500'
                      )}
                      style={{ width: `${factor.impact}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{factor.impact}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Predictions Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Yield Prediction */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {t('yield_prediction', 'Yield Prediction')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {(analytics.predictions.yield.value / 1000).toFixed(1)}t/ha
                </span>
                {getTrendIcon(analytics.predictions.yield.trend)}
              </div>
              <Badge variant="outline" className="text-xs">
                {analytics.predictions.yield.confidence.toFixed(0)}% confidence
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Harvest Timing */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {t('harvest_prediction', 'Harvest Timing')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                {new Date(analytics.predictions.harvest.date).toLocaleDateString()}
              </div>
              <Badge 
                variant={analytics.predictions.harvest.quality === 'excellent' ? 'default' : 'secondary'}
              >
                {analytics.predictions.harvest.quality} quality
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Weather Risk */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              {t('weather_risk', 'Weather Risk')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge 
                variant={analytics.predictions.weather.risk === 'low' ? 'default' : 
                        analytics.predictions.weather.risk === 'medium' ? 'secondary' : 'destructive'}
              >
                {analytics.predictions.weather.risk} risk
              </Badge>
              <p className="text-sm text-gray-600">
                {analytics.predictions.weather.forecast}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      {analytics.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              {t('ai_recommendations', 'AI Recommendations')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.recommendations.slice(0, isMobile ? 2 : 3).map((rec, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {rec.category === 'irrigation' && <Droplets className="w-4 h-4 text-blue-500" />}
                      {rec.category === 'fertilization' && <Zap className="w-4 h-4 text-green-500" />}
                      {rec.category === 'pest_control' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                      {rec.category === 'harvest' && <Calendar className="w-4 h-4 text-purple-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-sm">{rec.title}</h4>
                        <Badge 
                          variant={rec.priority === 'critical' ? 'destructive' : 
                                  rec.priority === 'high' ? 'destructive' :
                                  rec.priority === 'medium' ? 'secondary' : 'default'}
                          className="text-xs flex-shrink-0"
                        >
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                      {rec.actions.length > 0 && (
                        <ul className="space-y-1">
                          {rec.actions.slice(0, 2).map((action, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Insights */}
      {analytics.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {t('key_insights', 'Key Insights')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                    <p className="text-sm text-gray-600">{insight.description}</p>
                    {insight.action && (
                      <p className="text-sm font-medium text-blue-600 mt-1">
                        {insight.action}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <Thermometer className="w-6 h-6 mx-auto mb-2 text-orange-500" />
            <div className="text-lg font-bold">
              {weatherData?.temperature || '24'}°C
            </div>
            <div className="text-xs text-gray-500">Temperature</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <Droplets className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <div className="text-lg font-bold">
              {weatherData?.humidity || '65'}%
            </div>
            <div className="text-xs text-gray-500">Humidity</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <div className="text-lg font-bold">₹45/kg</div>
            <div className="text-xs text-gray-500">Market Price</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <MapPin className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <div className="text-lg font-bold">
              {farmData?.area || '2.5'}ha
            </div>
            <div className="text-xs text-gray-500">Farm Area</div>
          </div>
        </Card>
      </div>
    </div>
  );
});

export { AIAnalyticsDashboard };