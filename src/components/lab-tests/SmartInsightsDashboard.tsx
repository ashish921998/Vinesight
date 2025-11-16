'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SupabaseService } from '@/lib/supabase-service'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  CheckCircle2,
  Star,
  Lightbulb,
  Loader2
} from 'lucide-react'

interface SmartInsightsDashboardProps {
  farmId: number
}

export function SmartInsightsDashboard({ farmId }: SmartInsightsDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState<any>(null)

  useEffect(() => {
    loadInsights()
  }, [farmId])

  const loadInsights = async () => {
    setLoading(true)
    try {
      const data = await SupabaseService.getFarmInsights(farmId)
      setInsights(data)
    } catch (error) {
      console.error('Error loading insights:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (!insights) return null

  const getTrendIcon = () => {
    switch (insights.soil_health_trend) {
      case 'improving':
        return <TrendingUp className="h-5 w-5 text-green-600" />
      case 'declining':
        return <TrendingDown className="h-5 w-5 text-red-600" />
      case 'stable':
        return <Minus className="h-5 w-5 text-blue-600" />
      default:
        return <Lightbulb className="h-5 w-5 text-gray-600" />
    }
  }

  const getTrendColor = () => {
    switch (insights.soil_health_trend) {
      case 'improving':
        return 'border-green-200 bg-green-50'
      case 'declining':
        return 'border-red-200 bg-red-50'
      case 'stable':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getTrendText = () => {
    switch (insights.soil_health_trend) {
      case 'improving':
        return 'Improving'
      case 'declining':
        return 'Needs Attention'
      case 'stable':
        return 'Stable'
      default:
        return 'Unknown'
    }
  }

  const hasData = insights.recommendations_total > 0 || insights.total_roi !== 0

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            Smart Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-blue-50 border-blue-300">
            <AlertDescription className="text-sm text-blue-900">
              <strong>Start tracking your progress!</strong> Once you track recommendations and ROI
              for your lab tests, you'll see personalized insights here about your farm's soil
              health trends, savings, and more.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-blue-600" />
          💡 Smart Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Soil Health Trend */}
          <Card className={getTrendColor()}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {getTrendIcon()}
                <div className="text-xs font-medium text-muted-foreground">Soil Health</div>
              </div>
              <div className="text-lg font-bold">{getTrendText()}</div>
            </CardContent>
          </Card>

          {/* Total ROI */}
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <div className="text-xs font-medium text-emerald-600">Total ROI</div>
              </div>
              <div className="text-lg font-bold text-emerald-700">
                ₹{Math.round(insights.total_roi).toLocaleString('en-IN')}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations Followed */}
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
                <div className="text-xs font-medium text-purple-600">Followed</div>
              </div>
              <div className="text-lg font-bold text-purple-700">
                {insights.recommendations_total > 0
                  ? `${Math.round((insights.recommendations_followed / insights.recommendations_total) * 100)}%`
                  : '—'}
              </div>
            </CardContent>
          </Card>

          {/* Average Satisfaction */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-5 w-5 text-yellow-600" />
                <div className="text-xs font-medium text-yellow-600">Satisfaction</div>
              </div>
              <div className="text-lg font-bold text-yellow-700">
                {insights.avg_satisfaction > 0 ? `${insights.avg_satisfaction.toFixed(1)}/5` : '—'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Insights */}
        {insights.key_insights && insights.key_insights.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              Key Insights:
            </div>
            <div className="space-y-2">
              {insights.key_insights.map((insight: string, idx: number) => (
                <Alert key={idx} className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-sm text-blue-900 flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span className="flex-1">{insight}</span>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="border rounded-lg p-3 bg-muted/30">
            <div className="text-xs text-muted-foreground font-medium mb-1">
              Recommendations Tracked
            </div>
            <div className="text-base font-semibold">
              {insights.recommendations_followed}/{insights.recommendations_total}
            </div>
          </div>

          <div className="border rounded-lg p-3 bg-muted/30">
            <div className="text-xs text-muted-foreground font-medium mb-1">
              Active Recommendations
            </div>
            <div className="text-base font-semibold">
              {insights.recommendations_total - insights.recommendations_followed} pending
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
