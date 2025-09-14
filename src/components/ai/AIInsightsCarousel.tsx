'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AIInsightsService } from '@/lib/ai-insights-service'
import {
  AlertTriangle,
  TrendingUp,
  Clock,
  Shield,
  ChevronRight,
  Droplets,
  SprayCan,
  Zap,
  CheckCircle,
  DollarSign,
  Sprout,
  CloudRain,
  Wind,
  MessageCircle,
  Scissors,
  Calendar,
  Target,
  Bug,
  Leaf,
  TreePine,
  Flame,
  Activity,
  BarChart3,
  TrendingDown,
  Eye,
  AlertCircle,
  Users,
  Lightbulb,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type AIInsight } from '@/types/ai'
import { motion } from 'framer-motion'

interface AIInsightsCarouselProps {
  farmId: number
  className?: string
}

export function AIInsightsCarousel({ farmId, className }: AIInsightsCarouselProps) {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const loadInsights = useCallback(async () => {
    try {
      setLoading(true)

      // Call the API route instead of direct service
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          farmId,
          limit: 8,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch AI insights')
      }

      const data = await response.json()
      setInsights(data.insights || [])
    } catch (error) {
      // Log error for debugging in development only
      if (process.env.NODE_ENV === 'development') {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('Error loading AI insights:', error)
        }
      }
      // Set empty insights array on error
      setInsights([])
    } finally {
      setLoading(false)
    }
  }, [farmId])

  useEffect(() => {
    loadInsights()
  }, [loadInsights])

  const handleInsightAction = async (insight: AIInsight) => {
    try {
      if (insight.actionType === 'navigate' && insight.actionData?.route) {
        router.push(insight.actionData.route)
      } else if (insight.actionType === 'execute') {
        const result = await AIInsightsService.executeInsightAction(insight)
        if (result.success) {
          // Show success feedback - can be removed in production as it's debug logging
          if (process.env.NODE_ENV === 'development') {
            if (process.env.NODE_ENV === 'development') {
              // eslint-disable-next-line no-console
              console.log(result.message)
            }
          }
          // Refresh insights after execution
          await loadInsights()
        }
      }
    } catch (error) {
      // Log error for debugging in development only
      if (process.env.NODE_ENV === 'development') {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('Error handling insight action:', error)
        }
      }
    }
  }

  const handleViewAllInsights = () => {
    router.push(`/farms/${farmId}/ai-insights`)
  }

  const getIcon = (iconName: string) => {
    const iconMap = {
      AlertTriangle: AlertTriangle,
      TrendingUp: TrendingUp,
      Clock: Clock,
      Shield: Shield,
      Droplets: Droplets,
      SprayCan: SprayCan,
      Zap: Zap,
      CheckCircle: CheckCircle,
      DollarSign: DollarSign,
      Sprout: Sprout,
      CloudRain: CloudRain,
      Wind: Wind,
      Scissors: Scissors,
      Calendar: Calendar,
      Target: Target,
      Bug: Bug,
      Leaf: Leaf,
      TreePine: TreePine,
      Flame: Flame,
      Activity: Activity,
      BarChart3: BarChart3,
      TrendingDown: TrendingDown,
      Eye: Eye,
      AlertCircle: AlertCircle,
      Users: Users,
      Lightbulb: Lightbulb,
      // Pest-specific icons
      fungus: Leaf,
      pest: Bug,
      mildew: Sprout,
      disease: AlertCircle,
    }
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Target
    return <IconComponent className="h-5 w-5" />
  }

  const getPriorityColor = (priority: string, type: string) => {
    if (priority === 'critical') {
      return 'bg-red-100 text-red-900 border-red-300'
    }
    if (priority === 'high') {
      return 'bg-orange-100 text-orange-900 border-orange-300'
    }

    // Phase 3A specific insight types
    if (type === 'pest_prediction') {
      return 'bg-yellow-100 text-yellow-900 border-yellow-300'
    }
    if (type === 'task_recommendation') {
      return 'bg-indigo-100 text-indigo-900 border-indigo-300'
    }
    if (type === 'profitability_insight') {
      return 'bg-emerald-100 text-emerald-900 border-emerald-300'
    }
    if (type === 'weather_alert') {
      return 'bg-sky-100 text-sky-900 border-sky-300'
    }

    // Legacy types
    if (type === 'financial_insight') {
      return 'bg-emerald-100 text-emerald-900 border-emerald-300'
    }
    if (type === 'growth_optimization') {
      return 'bg-purple-100 text-purple-900 border-purple-300'
    }
    return 'bg-blue-100 text-blue-900 border-blue-300'
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return (
          <Badge variant="destructive" className="text-xs px-2 py-0.5">
            URGENT
          </Badge>
        )
      case 'high':
        return (
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            HIGH
          </Badge>
        )
      case 'medium':
        return (
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            MEDIUM
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            LOW
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className={className}>
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-32 h-5 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-80 h-36 bg-gray-200 rounded-2xl animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <div className={className}>
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-semibold">AI Insights</h3>
            </div>
            <Badge variant="outline" className="text-xs">
              All Optimized
            </Badge>
          </div>
        </div>
        <Card className="border-green-200 bg-green-50 rounded-2xl">
          <CardContent className="p-4 text-center">
            <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h4 className="text-sm font-medium text-green-800 mb-1">Farm Operating Optimally</h4>
            <p className="text-xs text-green-600">AI monitoring all aspects 24/7</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show top 6 insights in carousel, with "View All" for more
  const displayInsights = insights.slice(0, 6)
  const hasMore = insights.length > 6

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-semibold">Today&apos;s AI Insights</h3>
          </div>
          <div className="flex items-center gap-2">
            {hasMore && (
              <Badge variant="outline" className="text-xs">
                +{insights.length - 6} more
              </Badge>
            )}
            <Button
              onClick={handleViewAllInsights}
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs rounded-full"
            >
              View All
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Insights Carousel */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {displayInsights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            className="min-w-[85%] sm:min-w-[320px] snap-start"
          >
            <Card
              className={`rounded-2xl border-l-4 shadow-sm ${getPriorityColor(insight.priority, insight.type)} ${
                insight.priority === 'critical' ? 'ring-1 ring-red-100' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="shrink-0 mt-0.5">{getIcon(insight.icon)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm leading-tight mb-0.5">
                          {insight.title}
                        </div>
                        <div className="text-xs opacity-80 leading-relaxed">{insight.subtitle}</div>
                      </div>
                    </div>
                    {getPriorityBadge(insight.priority)}
                  </div>

                  {/* Description for high priority insights */}
                  {insight.description && insight.priority !== 'low' && (
                    <div className="text-xs text-gray-600 bg-white/50 rounded-lg p-2">
                      {insight.description}
                    </div>
                  )}

                  {/* Pest Prediction Specific Details */}
                  {insight.type === 'pest_prediction' && insight.pestDetails && (
                    <div className="bg-white/60 rounded-lg p-2 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Risk Level:</span>
                        <Badge
                          variant={
                            insight.pestDetails.riskLevel === 'critical'
                              ? 'destructive'
                              : insight.pestDetails.riskLevel === 'high'
                                ? 'secondary'
                                : 'outline'
                          }
                          className="text-xs px-2 py-0.5"
                        >
                          {insight.pestDetails.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Prevention Window:</span>
                        <span className="font-medium">
                          {insight.pestDetails.preventionWindow.start} -{' '}
                          {insight.pestDetails.preventionWindow.end}
                        </span>
                      </div>
                      {insight.pestDetails.treatments &&
                        insight.pestDetails.treatments.length > 0 && (
                          <div className="flex justify-between">
                            <span>Best Treatment:</span>
                            <span className="font-medium">
                              {insight.pestDetails.treatments[0].name}
                            </span>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Task Recommendation Specific Details */}
                  {insight.type === 'task_recommendation' && insight.taskDetails && (
                    <div className="bg-white/60 rounded-lg p-2 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Task Type:</span>
                        <span className="font-medium capitalize">
                          {insight.taskDetails.taskType.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Recommended Date:</span>
                        <span className="font-medium">{insight.taskDetails.recommendedDate}</span>
                      </div>
                      {insight.taskDetails.duration && (
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span className="font-medium">{insight.taskDetails.duration} min</span>
                        </div>
                      )}
                      {insight.taskDetails.weatherDependent && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <CloudRain className="h-3 w-3" />
                          <span>Weather dependent</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Profitability Insight Specific Details */}
                  {insight.type === 'profitability_insight' && insight.profitabilityDetails && (
                    <div className="bg-white/60 rounded-lg p-2 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Category:</span>
                        <span className="font-medium capitalize">
                          {insight.profitabilityDetails.category}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Potential Savings:</span>
                        <span className="font-medium text-green-700">
                          ₹{insight.profitabilityDetails.potentialSavings.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>ROI Improvement:</span>
                        <span className="font-medium text-green-700">
                          +{insight.profitabilityDetails.roiImprovement}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Implementation:</span>
                        <Badge
                          variant={
                            insight.profitabilityDetails.implementationEffort === 'low'
                              ? 'default'
                              : insight.profitabilityDetails.implementationEffort === 'medium'
                                ? 'secondary'
                                : 'outline'
                          }
                          className="text-xs px-2 py-0.5"
                        >
                          {insight.profitabilityDetails.implementationEffort}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Confidence & Time Info */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="opacity-70">Confidence:</span>
                      <div className="flex items-center gap-1">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all"
                            style={{ width: `${insight.confidence * 100}%` }}
                          ></div>
                        </div>
                        <span className="font-medium">{Math.round(insight.confidence * 100)}%</span>
                      </div>
                    </div>
                    {insight.timeRelevant && (
                      <div className="flex items-center gap-1 text-orange-600">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs font-medium">Time sensitive</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      onClick={() => handleInsightAction(insight)}
                      size="sm"
                      className={`flex-1 h-8 text-xs rounded-full ${
                        insight.priority === 'critical' ? '' : 'variant-outline'
                      }`}
                      variant={insight.priority === 'critical' ? 'default' : 'outline'}
                    >
                      {insight.actionLabel}
                    </Button>
                    {insight.priority === 'critical' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 rounded-full"
                        onClick={() => {
                          // Mark as acknowledged - TODO: implement actual acknowledgment logic
                          if (process.env.NODE_ENV === 'development') {
                            if (process.env.NODE_ENV === 'development') {
                              // eslint-disable-next-line no-console
                              console.log('Insight acknowledged')
                            }
                          }
                        }}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Tags */}
                  {insight.tags && insight.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {insight.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
