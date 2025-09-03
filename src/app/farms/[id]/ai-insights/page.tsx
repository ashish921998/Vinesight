"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  MessageCircle, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  DollarSign,
  Sprout,
  CloudRain,
  Calendar,
  Target,
  Filter,
  Zap
} from "lucide-react";
import { AIInsightsService, type AIInsight } from "@/lib/ai-insights-service";
import { SupabaseService } from "@/lib/supabase-service";
import { type Farm } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function AIInsightsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useSupabaseAuth();
  const farmId = params.id as string;
  
  const [farm, setFarm] = useState<Farm | null>(null);
  const [insightsByCategory, setInsightsByCategory] = useState<Record<string, AIInsight[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [farmId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load farm data
      const farmData = await SupabaseService.getDashboardSummary(parseInt(farmId));
      setFarm(farmData.farm);

      // Load insights by category
      const insights = await AIInsightsService.getInsightsByCategory(
        parseInt(farmId), 
        user?.id || 'demo-user'
      );
      setInsightsByCategory(insights);

    } catch (error) {
      console.error("Error loading AI insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push(`/farms/${farmId}`);
  };

  const handleInsightAction = async (insight: AIInsight) => {
    try {
      if (insight.actionType === 'navigate' && insight.actionData?.route) {
        router.push(insight.actionData.route);
      } else {
        const result = await AIInsightsService.executeInsightAction(insight);
        if (result.success) {
          console.log(result.message);
          // Refresh insights after execution
          await loadData();
        }
      }
    } catch (error) {
      console.error('Error handling insight action:', error);
    }
  };

  const getCategoryInfo = (categoryKey: string) => {
    const categories = {
      pest_alert: {
        name: 'Pest & Disease',
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      },
      task_recommendation: {
        name: 'Smart Tasks',
        icon: CheckCircle,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      },
      weather_advisory: {
        name: 'Weather Alerts',
        icon: CloudRain,
        color: 'text-sky-600',
        bgColor: 'bg-sky-50',
        borderColor: 'border-sky-200'
      },
      financial_insight: {
        name: 'Financial',
        icon: DollarSign,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200'
      },
      growth_optimization: {
        name: 'Growth Tips',
        icon: Sprout,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200'
      },
      market_intelligence: {
        name: 'Market Intel',
        icon: TrendingUp,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      }
    };

    return categories[categoryKey as keyof typeof categories] || {
      name: 'Other',
      icon: Target,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getAllInsights = () => {
    return Object.values(insightsByCategory).flat().sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder];
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder];
      return aPriority - bPriority;
    });
  };

  const getInsightsToShow = () => {
    if (selectedCategory === 'all') {
      return getAllInsights();
    }
    return insightsByCategory[selectedCategory] || [];
  };

  const totalInsights = getAllInsights().length;
  const criticalInsights = getAllInsights().filter(i => i.priority === 'critical').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-48 h-5 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-500" />
                AI Insights
              </h1>
              <p className="text-sm text-gray-600">
                {farm?.name || `Farm ${farmId}`} • Intelligent Recommendations
              </p>
            </div>
            {criticalInsights > 0 && (
              <Badge variant="destructive" className="text-xs">
                {criticalInsights} Critical
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Overview Stats */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Insights Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{totalInsights}</div>
                <div className="text-xs text-gray-600">Total Insights</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{criticalInsights}</div>
                <div className="text-xs text-gray-600">Critical</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {getAllInsights().filter(i => i.timeRelevant).length}
                </div>
                <div className="text-xs text-gray-600">Time Sensitive</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-9">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              {Object.keys(insightsByCategory).slice(0, 5).map((categoryKey) => {
                const category = getCategoryInfo(categoryKey);
                const count = insightsByCategory[categoryKey].length;
                return (
                  <TabsTrigger key={categoryKey} value={categoryKey} className="text-xs relative">
                    {category.name}
                    {count > 0 && (
                      <Badge variant="secondary" className="ml-1 text-[10px] h-4 w-4 p-0">
                        {count}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Insights Content */}
          <TabsContent value={selectedCategory} className="space-y-3">
            {getInsightsToShow().length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-green-800 mb-2">All Clear!</h3>
                  <p className="text-gray-600">
                    {selectedCategory === 'all' 
                      ? 'No insights available at this time. Your farm is operating optimally.'
                      : 'No insights in this category right now.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              getInsightsToShow().map((insight) => {
                const categoryInfo = getCategoryInfo(insight.type);
                const IconComponent = categoryInfo.icon;

                return (
                  <Card 
                    key={insight.id} 
                    className={`border-l-4 ${getPriorityColor(insight.priority)} ${
                      insight.priority === 'critical' ? 'ring-1 ring-red-100' : ''
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${categoryInfo.bgColor}`}>
                            <IconComponent className={`h-5 w-5 ${categoryInfo.color}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-base">{insight.title}</h3>
                              <Badge 
                                variant={insight.priority === 'critical' ? 'destructive' : 
                                        insight.priority === 'high' ? 'secondary' : 'outline'} 
                                className="text-xs"
                              >
                                {insight.priority.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{insight.subtitle}</p>
                            {insight.description && (
                              <p className="text-xs text-gray-500">{insight.description}</p>
                            )}
                          </div>
                        </div>
                        {insight.timeRelevant && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Time Sensitive
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0 space-y-3">
                      {/* Confidence Score */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600">AI Confidence</span>
                          <span className="font-medium">{Math.round(insight.confidence * 100)}%</span>
                        </div>
                        <Progress value={insight.confidence * 100} className="h-2" />
                      </div>

                      {/* Tags */}
                      {insight.tags && insight.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {insight.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs px-2 py-0.5">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button 
                          onClick={() => handleInsightAction(insight)}
                          size="sm" 
                          className={`flex-1 ${
                            insight.priority === 'critical' ? '' : 'variant-outline'
                          }`}
                          variant={insight.priority === 'critical' ? 'default' : 'outline'}
                        >
                          {insight.actionLabel}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="px-3"
                          onClick={() => {
                            console.log('Mark as read');
                          }}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}