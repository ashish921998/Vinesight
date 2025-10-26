'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  TrendingUp,
  Droplets,
  Bug,
  ChevronRight,
  Sprout,
  IndianRupee,
  Calendar
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface AIInsight {
  id: string
  type:
    | 'pest'
    | 'weather'
    | 'task'
    | 'resource'
    | 'irrigation'
    | 'spray'
    | 'harvest'
    | 'market'
    | 'financial'
  title: string
  description: string
  confidence: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  actionable: boolean
  estimatedImpact?: string // e.g., "Save 500L water" or "Increase yield by 2kg/acre"
  action?: {
    label: string
    onClick: () => void
  }
}

interface AIInsightsCardProps {
  farmId?: number
  loading?: boolean
  className?: string
}

export function AIInsightsCard({ farmId, loading, className }: AIInsightsCardProps) {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loadingInsights, setLoadingInsights] = useState(true)

  useEffect(() => {
    if (!farmId) return

    const fetchInsights = async () => {
      setLoadingInsights(true)
      try {
        // TODO: Replace with actual AI insights API call
        // const data = await SupabaseService.getAIInsights(farmId)

        // Mock data for now - multiple insight types
        const mockInsights: AIInsight[] = [
          {
            id: '1',
            type: 'pest',
            title: 'High Powdery Mildew Risk',
            description:
              'Weather conditions (78% humidity, 24°C) favor powdery mildew development. Preventive spray recommended within 48 hours.',
            confidence: 85,
            priority: 'high',
            actionable: true,
            estimatedImpact: 'Prevent 15-20% yield loss',
            action: {
              label: 'Schedule Spray',
              onClick: () => console.log('Navigate to spray scheduling')
            }
          },
          {
            id: '2',
            type: 'irrigation',
            title: 'Optimize Irrigation Timing',
            description:
              'Soil moisture at 65%. Next irrigation recommended in 2 days (Friday morning) based on weather forecast.',
            confidence: 78,
            priority: 'medium',
            actionable: true,
            estimatedImpact: 'Save 500L water per cycle',
            action: {
              label: 'Schedule Irrigation',
              onClick: () => console.log('Navigate to irrigation')
            }
          },
          {
            id: '3',
            type: 'market',
            title: 'Favorable Market Conditions',
            description:
              'Grape prices up 12% this week. Harvest window Oct 15-20 aligns with peak pricing period.',
            confidence: 72,
            priority: 'medium',
            actionable: true,
            estimatedImpact: 'Potential 10-15% price premium',
            action: {
              label: 'View Market Data',
              onClick: () => console.log('Navigate to market insights')
            }
          }
        ]

        setInsights(mockInsights)
      } catch (error) {
        console.error('Failed to fetch AI insights:', error)
      } finally {
        setLoadingInsights(false)
      }
    }

    fetchInsights()
  }, [farmId])

  const getIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'pest':
        return Bug
      case 'weather':
        return Droplets
      case 'resource':
        return TrendingUp
      case 'task':
        return AlertTriangle
      case 'irrigation':
        return Droplets
      case 'spray':
        return Bug
      case 'harvest':
        return Sprout
      case 'market':
        return IndianRupee
      case 'financial':
        return TrendingUp
      default:
        return AlertTriangle
    }
  }

  const getPriorityColor = (priority: AIInsight['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading || loadingInsights) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">🎯 AI Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!insights.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">🎯 AI Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No insights available yet. Check back later!
          </p>
        </CardContent>
      </Card>
    )
  }

  const topInsight = insights[0]
  const Icon = getIcon(topInsight.type)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          🎯 AI Insights
          {insights.length > 1 && (
            <Badge variant="secondary" className="ml-auto">
              {insights.length} insights
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Top Priority Insight */}
        <div className={`border-2 rounded-lg p-4 ${getPriorityColor(topInsight.priority)}`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm">{topInsight.title}</h4>
              </div>
              <p className="text-sm opacity-90 mb-2">{topInsight.description}</p>

              {/* Estimated Impact */}
              {topInsight.estimatedImpact && (
                <div className="mb-2 text-xs font-semibold opacity-80">
                  💡 {topInsight.estimatedImpact}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs opacity-75">Confidence: {topInsight.confidence}%</span>
                {topInsight.actionable && topInsight.action && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs font-medium"
                    onClick={topInsight.action.onClick}
                  >
                    {topInsight.action.label}
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* View All Link */}
        {insights.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-sm font-medium"
            onClick={() => console.log('Navigate to all insights')}
          >
            View All {insights.length} Insights
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
