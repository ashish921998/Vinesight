'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertTriangle,
  TrendingUp,
  Clock,
  Shield,
  ChevronRight,
  Bug,
  Zap,
  Calendar,
  MapPin,
  CheckCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PestPredictionService } from '@/lib/pest-prediction-service'
import type { PestDiseasePrediction } from '@/types/ai'

interface PestAlertsHorizontalProps {
  farmId: number
  className?: string
}

export function PestAlertsHorizontal({ farmId, className }: PestAlertsHorizontalProps) {
  const [predictions, setPredictions] = useState<PestDiseasePrediction[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const loadPredictions = useCallback(async () => {
    try {
      setLoading(true)
      const activePredictions = await PestPredictionService.getActivePredictions(farmId)
      setPredictions(activePredictions)
    } catch (error) {
      // Log error for debugging in development only
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error loading pest predictions:', error)
      }
    } finally {
      setLoading(false)
    }
  }, [farmId])

  useEffect(() => {
    loadPredictions()
  }, [loadPredictions])

  const handleActionTaken = async (predictionId: string, action: string) => {
    try {
      await PestPredictionService.updatePredictionOutcome(predictionId, action, 'action_taken')
      await loadPredictions() // Refresh the list
    } catch (error) {
      // Log error for debugging in development only
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error updating prediction:', error)
      }
    }
  }

  const formatPestName = (pestType: string) => {
    return pestType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'border-red-500 bg-red-50'
      case 'high':
        return 'border-orange-500 bg-orange-50'
      case 'medium':
        return 'border-yellow-500 bg-yellow-50'
      case 'low':
        return 'border-green-500 bg-green-50'
      default:
        return 'border-gray-500 bg-gray-50'
    }
  }

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'high':
        return <TrendingUp className="h-4 w-4 text-orange-600" />
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'low':
        return <Shield className="h-4 w-4 text-green-600" />
      default:
        return <Bug className="h-4 w-4 text-gray-600" />
    }
  }

  const getDaysUntilOnset = (onsetDate: Date) => {
    const now = new Date()
    const diffTime = onsetDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleViewAll = () => {
    router.push(`/farms/${farmId}/pest-alerts`)
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
              className="flex-shrink-0 w-72 h-40 bg-gray-200 rounded-lg animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    )
  }

  if (predictions.length === 0) {
    return (
      <div className={className}>
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <h3 className="text-sm font-semibold">AI Pest Alerts</h3>
            </div>
            <Badge variant="outline" className="text-xs">
              All Clear
            </Badge>
          </div>
        </div>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h4 className="text-sm font-medium text-green-800 mb-1">No Threats Detected</h4>
            <p className="text-xs text-green-600">AI monitoring active 24/7</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Sort by urgency: critical > high > medium > low, then by probability
  const sortedPredictions = [...predictions].sort((a, b) => {
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    const aUrgency = urgencyOrder[a.riskLevel as keyof typeof urgencyOrder] ?? 4
    const bUrgency = urgencyOrder[b.riskLevel as keyof typeof urgencyOrder] ?? 4

    if (aUrgency !== bUrgency) return aUrgency - bUrgency
    return b.probabilityScore - a.probabilityScore
  })

  // Show top 3 most urgent alerts
  const topAlerts = sortedPredictions.slice(0, 3)
  const totalCount = predictions.length

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <h3 className="text-sm font-semibold">AI Pest Alerts</h3>
          </div>
          <div className="flex items-center gap-2">
            {totalCount > 3 && (
              <Badge variant="outline" className="text-xs">
                +{totalCount - 3} more
              </Badge>
            )}
            <Button
              onClick={handleViewAll}
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
            >
              View All
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Horizontal Scroll Cards */}
      <div
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {topAlerts.map((prediction) => {
          const daysUntilOnset = getDaysUntilOnset(prediction.predictedOnsetDate)
          const isUrgent =
            prediction.riskLevel === 'critical' ||
            (prediction.riskLevel === 'high' && daysUntilOnset <= 3)

          return (
            <Card
              key={prediction.id}
              className={`flex-shrink-0 w-72 border-l-4 snap-start ${getRiskColor(prediction.riskLevel)} ${
                isUrgent ? 'ring-1 ring-red-100' : ''
              }`}
            >
              <CardHeader className="pb-2 px-3 pt-3">
                <div className="flex items-start gap-2">
                  {getRiskIcon(prediction.riskLevel)}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold truncate mb-1">
                      {formatPestName(prediction.pestDiseaseType)}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{prediction.region}</span>
                      </div>
                      <Badge
                        variant={
                          prediction.riskLevel === 'critical'
                            ? 'destructive'
                            : prediction.riskLevel === 'high'
                              ? 'secondary'
                              : 'outline'
                        }
                        className="text-xs px-1.5 py-0.5"
                      >
                        {prediction.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-3 pb-3 pt-0">
                <div className="space-y-3">
                  {/* Risk Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600">Risk Probability</span>
                      <span className="font-medium">
                        {Math.round(prediction.probabilityScore * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={prediction.probabilityScore * 100}
                      className="h-1.5"
                      indicatorClassName={
                        prediction.riskLevel === 'critical'
                          ? 'bg-red-500'
                          : prediction.riskLevel === 'high'
                            ? 'bg-orange-500'
                            : prediction.riskLevel === 'medium'
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                      }
                    />
                  </div>

                  {/* Timeline */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Calendar className="h-3 w-3" />
                      <span>Until onset</span>
                    </div>
                    <span
                      className={`font-medium ${
                        daysUntilOnset <= 2
                          ? 'text-red-600'
                          : daysUntilOnset <= 5
                            ? 'text-orange-600'
                            : 'text-gray-600'
                      }`}
                    >
                      {daysUntilOnset > 0 ? `${daysUntilOnset} days` : 'Immediate'}
                    </span>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleActionTaken(prediction.id, 'preventive_spray')}
                      className="flex-1 h-7 text-xs"
                      variant={isUrgent ? 'default' : 'outline'}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Apply Treatment
                    </Button>
                  </div>

                  {/* Community Alert */}
                  {prediction.communityReports > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded px-2 py-1">
                      <div className="flex items-center gap-1 text-amber-800">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="text-xs font-medium">
                          {prediction.communityReports} nearby report
                          {prediction.communityReports !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
