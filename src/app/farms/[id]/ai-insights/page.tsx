'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Sprout,
  CloudRain,
  Calendar,
  Target,
  Zap,
  Bug,
  Brain,
  Eye,
  BarChart3,
  RefreshCw,
  Activity
} from 'lucide-react'
import { AIInsightsService, type AIInsight } from '@/lib/ai-insights-service'
import { SupabaseService } from '@/lib/supabase-service'
import { PestPredictionService } from '@/lib/pest-prediction-service'
import { farmerLearningService } from '@/lib/farmer-learning-service'
import { CriticalAlertsBanner } from '@/components/farm/CriticalAlertsBanner'
import { type Farm } from '@/types/types'
import { type CriticalAlert, type PestDiseasePrediction, type FarmerAIProfile } from '@/types/ai'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { capitalize } from '@/lib/utils'

export default function AIInsightsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useSupabaseAuth()
  const farmId = params.id as string

  const [farm, setFarm] = useState<Farm | null>(null)
  const [insightsByCategory, setInsightsByCategory] = useState<Record<string, AIInsight[]>>({})
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlert[]>([])
  const [pestPredictions, setPestPredictions] = useState<PestDiseasePrediction[]>([])
  const [farmerProfile, setFarmerProfile] = useState<FarmerAIProfile | null>(null)
  // TODO: AI insights are still being developed. Set to false for now to show empty state instead of indefinite loading
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const loadInsights = useCallback(async () => {
    try {
      const insights = await AIInsightsService.getInsightsByCategory(
        parseInt(farmId),
        user?.id || null
      )
      setInsightsByCategory(insights)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error loading AI insights:', error)
      }
      // Initialize with empty categories instead of mock data
      setInsightsByCategory({})
    }
  }, [farmId, user?.id])

  const loadCriticalAlerts = useCallback(async () => {
    try {
      // Generate critical alerts from pest predictions
      const predictions = await PestPredictionService.getActivePredictions(parseInt(farmId))
      const criticalPredictions = predictions.filter(
        (p) => p.riskLevel === 'critical' || p.riskLevel === 'high'
      )

      const alerts: CriticalAlert[] = criticalPredictions.map((prediction) => ({
        id: `pest_${prediction.id}`,
        type: 'pest_prediction' as const,
        severity: prediction.riskLevel === 'critical' ? ('critical' as const) : ('high' as const),
        title: `${prediction.pestDiseaseType.replace('_', ' ').toUpperCase()} Risk Alert`,
        message: `${Math.round(prediction.probabilityScore * 100)}% probability of outbreak. ${prediction.preventionWindow.optimalTiming}`,
        icon: prediction.pestDiseaseType.includes('mildew') ? 'fungus' : 'pest',
        actionRequired: true,
        timeWindow: {
          start: prediction.preventionWindow.startDate,
          end: prediction.preventionWindow.endDate,
          urgency: prediction.preventionWindow.optimalTiming
        },
        actions: [
          {
            label: 'View Treatment Plan',
            type: 'primary' as const,
            action: 'navigate' as const,
            actionData: {
              route: `/farms/${farmId}/pest-management/${prediction.pestDiseaseType}`,
              predictionId: prediction.id
            }
          },
          {
            label: 'Acknowledge Alert',
            type: 'secondary' as const,
            action: 'execute' as const,
            actionData: { action: 'acknowledge', predictionId: prediction.id }
          }
        ],
        farmId: parseInt(farmId),
        createdAt: prediction.createdAt
      }))

      setCriticalAlerts(alerts)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error loading critical alerts:', error)
      }
    }
  }, [farmId])

  const loadPestPredictions = useCallback(async () => {
    try {
      const predictions = await PestPredictionService.getActivePredictions(parseInt(farmId))
      setPestPredictions(predictions)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error loading pest predictions:', error)
      }
    }
  }, [farmId])

  const loadFarmerProfile = useCallback(async () => {
    try {
      const profile = await farmerLearningService.getFarmerProfile(
        user?.id || null,
        parseInt(farmId)
      )
      setFarmerProfile(profile)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error loading farmer profile:', error)
      }
    }
  }, [farmId, user?.id])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)

      // Load farm data first (essential for context)
      const farmData = await SupabaseService.getDashboardSummary(parseInt(farmId))
      setFarm(farmData.farm)

      // Load critical data first for immediate display
      await loadCriticalAlerts()

      // Load remaining data with staggered loading for better perceived performance
      setTimeout(async () => {
        await Promise.all([loadInsights(), loadPestPredictions(), loadFarmerProfile()])
      }, 100)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error loading AI insights:', error)
      }
    } finally {
      setLoading(false)
    }
  }, [farmId, loadInsights, loadCriticalAlerts, loadPestPredictions, loadFarmerProfile])

  useEffect(() => {
    loadData()
  }, [loadData])

  // These functions are now defined as useCallback above

  const handleBack = () => {
    router.push(`/farms/${farmId}`)
  }

  const handleInsightAction = async (insight: AIInsight) => {
    try {
      if (insight.actionType === 'navigate' && insight.actionData?.route) {
        router.push(insight.actionData.route)
      } else {
        const result = await AIInsightsService.executeInsightAction(insight)
        if (result.success) {
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
          }
          // Refresh insights after execution
          await loadData()
        }
      }

      // Track farmer action for learning
      if (user?.id) {
        await farmerLearningService.trackFarmerAction(
          user.id,
          parseInt(farmId),
          'accept_recommendation',
          {
            originalSuggestion: insight,
            reasoning: 'User clicked on insight action'
          }
        )
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error handling insight action:', error)
      }
    }
  }

  const handleAlertAction = async (
    alertId: string,
    action: string,
    actionData?: Record<string, any>
  ) => {
    try {
      if (action === 'navigate' && actionData?.route) {
        router.push(actionData.route)
      } else if (action === 'execute' && actionData?.action === 'acknowledge') {
        // Mark alert as acknowledged
        const predictionId = actionData.predictionId
        if (predictionId) {
          await PestPredictionService.updatePredictionOutcome(
            predictionId,
            'acknowledged',
            'farmer_acknowledged'
          )

          // Remove from critical alerts
          setCriticalAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
        }
      }

      // Track farmer action
      if (user?.id) {
        await farmerLearningService.trackFarmerAction(
          user.id,
          parseInt(farmId),
          action === 'acknowledge' ? 'accept_recommendation' : 'reject_recommendation',
          actionData || {}
        )
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error handling alert action:', error)
      }
    }
  }

  const getCategoryInfo = (categoryKey: string) => {
    const categories = {
      // Phase 3A Categories
      pest_prediction: {
        name: 'Pest Predictions',
        icon: Bug,
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
      profitability_insight: {
        name: 'Profitability',
        icon: BarChart3,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200'
      },
      weather_alert: {
        name: 'Weather Alerts',
        icon: CloudRain,
        color: 'text-sky-600',
        bgColor: 'bg-sky-50',
        borderColor: 'border-sky-200'
      },
      // Legacy Categories
      pest_alert: {
        name: 'Pest & Disease',
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
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
    }

    return (
      categories[categoryKey as keyof typeof categories] || {
        name: 'Other',
        icon: Target,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      }
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default:
        return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  const getAllInsights = () => {
    return Object.values(insightsByCategory)
      .flat()
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder]
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder]
        return aPriority - bPriority
      })
  }

  const getInsightsToShow = () => {
    if (selectedCategory === 'all') {
      return getAllInsights()
    }
    return insightsByCategory[selectedCategory] || []
  }

  const totalInsights = getAllInsights().length
  const criticalInsights = getAllInsights().filter((i) => i.priority === 'critical').length

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
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div>
                    <div className="w-12 h-6 bg-gray-200 rounded mb-1"></div>
                    <div className="w-24 h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Overview Card Skeleton */}
          <div className="bg-white rounded-lg p-6 mb-6 animate-pulse">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 bg-gray-200 rounded"></div>
              <div className="w-32 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="w-8 h-8 bg-gray-200 rounded mx-auto mb-2"></div>
                  <div className="w-16 h-3 bg-gray-200 rounded mx-auto"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Tab Skeleton */}
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-20 h-9 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>

          {/* Insight Cards Skeleton */}
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-l-4 border-l-gray-300 animate-pulse"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-32 h-4 bg-gray-200 rounded"></div>
                        <div className="w-16 h-5 bg-gray-200 rounded"></div>
                      </div>
                      <div className="w-48 h-3 bg-gray-200 rounded mb-1"></div>
                      <div className="w-64 h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded mb-3"></div>
                  <div className="flex gap-2">
                    <div className="w-24 h-8 bg-gray-200 rounded"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBack} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-500" />
                AI Intelligence Center
              </h1>
              <p className="text-sm text-gray-600">
                {farm?.name ? capitalize(farm.name) : `Farm ${farmId}`} • Phase 3A Advanced AI
              </p>
            </div>
            <div className="flex items-center gap-2">
              {criticalAlerts.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {criticalAlerts.length} Critical Alerts
                </Badge>
              )}
              {criticalInsights > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {criticalInsights} High Priority
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Critical Alerts Banner */}
        {criticalAlerts.length > 0 && (
          <div className="mb-6">
            <CriticalAlertsBanner alerts={criticalAlerts} onAlertAction={handleAlertAction} />
          </div>
        )}

        {/* Phase 3A AI Intelligence Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{totalInsights}</div>
                  <div className="text-sm text-gray-600">Total AI Insights</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Bug className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{pestPredictions.length}</div>
                  <div className="text-sm text-gray-600">Active Pest Predictions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {farmerProfile ? Math.round(farmerProfile.riskTolerance * 100) : 50}%
                  </div>
                  <div className="text-sm text-gray-600">AI Learning Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
                  {getAllInsights().filter((i) => i.timeRelevant).length}
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
              <TabsTrigger value="all" className="text-xs">
                All
              </TabsTrigger>
              {Object.keys(insightsByCategory)
                .slice(0, 5)
                .map((categoryKey) => {
                  const category = getCategoryInfo(categoryKey)
                  const count = insightsByCategory[categoryKey].length
                  return (
                    <TabsTrigger key={categoryKey} value={categoryKey} className="text-xs relative">
                      {category.name}
                      {count > 0 && (
                        <Badge variant="secondary" className="ml-1 text-[10px] h-4 w-4 p-0">
                          {count}
                        </Badge>
                      )}
                    </TabsTrigger>
                  )
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
                const categoryInfo = getCategoryInfo(insight.type)
                const IconComponent = categoryInfo.icon

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
                                variant={
                                  insight.priority === 'critical'
                                    ? 'destructive'
                                    : insight.priority === 'high'
                                      ? 'secondary'
                                      : 'outline'
                                }
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
                          <span className="font-medium">
                            {Math.round(insight.confidence * 100)}%
                          </span>
                        </div>
                        <Progress value={insight.confidence * 100} className="h-2" />
                      </div>

                      {/* Tags */}
                      {insight.tags && insight.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {insight.tags.map((tag: string) => (
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
                            if (process.env.NODE_ENV === 'development') {
                              // eslint-disable-next-line no-console
                            }
                          }}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
