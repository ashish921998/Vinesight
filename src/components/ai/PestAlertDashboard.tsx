'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertTriangle,
  Bug,
  Calendar,
  Shield,
  TrendingUp,
  Clock,
  MapPin,
  Zap,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { PestPredictionService } from '@/lib/pest-prediction-service'
import type { PestDiseasePrediction } from '@/types/ai'

interface PestAlertDashboardProps {
  farmId: number
  className?: string
}

export function PestAlertDashboard({ farmId, className }: PestAlertDashboardProps) {
  const [predictions, setPredictions] = useState<PestDiseasePrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPrediction, setSelectedPrediction] = useState<PestDiseasePrediction | null>(null)

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

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'high':
        return <TrendingUp className="h-5 w-5 text-orange-600" />
      case 'medium':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'low':
        return <Shield className="h-5 w-5 text-green-600" />
      default:
        return <Bug className="h-5 w-5 text-gray-600" />
    }
  }

  const formatPestName = (pestType: string) => {
    return pestType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getDaysUntilOnset = (onsetDate: Date) => {
    const now = new Date()
    const diffTime = onsetDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getTreatmentPriority = (prediction: PestDiseasePrediction) => {
    const daysUntilOnset = getDaysUntilOnset(prediction.predictedOnsetDate)
    if (prediction.riskLevel === 'critical' && daysUntilOnset <= 2) return 'immediate'
    if (prediction.riskLevel === 'high' && daysUntilOnset <= 3) return 'urgent'
    return 'planned'
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (predictions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Pest & Disease Alerts
          </CardTitle>
          <CardDescription>AI-powered early warning system for your vineyard</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-center py-6">
            <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-green-800 mb-2">All Clear!</h3>
            <p className="text-sm text-green-600 leading-relaxed mb-2">
              No immediate threats detected for your vineyard.
            </p>
            <p className="text-xs text-gray-500">AI monitoring continues 24/7</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const criticalAlerts = predictions.filter((p) => p.riskLevel === 'critical')
  const highAlerts = predictions.filter((p) => p.riskLevel === 'high')

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Summary Header */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <Zap className="h-4 w-4 text-yellow-500 flex-shrink-0" />
              <span className="text-base font-semibold truncate">AI Pest Alerts</span>
            </div>
            <Badge
              variant={
                criticalAlerts.length > 0
                  ? 'destructive'
                  : highAlerts.length > 0
                    ? 'secondary'
                    : 'outline'
              }
              className="text-xs flex-shrink-0"
            >
              {predictions.length} Alert{predictions.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 leading-relaxed">
            AI monitoring for pest & disease threats
          </CardDescription>
        </CardHeader>
        {(criticalAlerts.length > 0 || highAlerts.length > 0) && (
          <CardContent className="pt-0">
            <div className="flex items-center gap-4 text-sm">
              {criticalAlerts.length > 0 && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{criticalAlerts.length} Critical</span>
                </div>
              )}
              {highAlerts.length > 0 && (
                <div className="flex items-center gap-1 text-orange-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>{highAlerts.length} High Risk</span>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Alert Cards */}
      <div className="space-y-3">
        {predictions.map((prediction) => {
          const daysUntilOnset = getDaysUntilOnset(prediction.predictedOnsetDate)
          const treatmentPriority = getTreatmentPriority(prediction)
          const isUrgent = treatmentPriority === 'immediate' || treatmentPriority === 'urgent'

          return (
            <Card
              key={prediction.id}
              className={`border-l-4 ${getRiskColor(prediction.riskLevel)} transition-all duration-200 ${
                isUrgent ? 'ring-1 ring-red-100' : ''
              }`}
            >
              <CardHeader className="pb-2 px-4 pt-3">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    {getRiskIcon(prediction.riskLevel)}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base leading-tight mb-1">
                        {formatPestName(prediction.pestDiseaseType)}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="text-xs">{prediction.region}</span>
                        </div>
                        <Badge
                          variant={
                            prediction.riskLevel === 'critical'
                              ? 'destructive'
                              : prediction.riskLevel === 'high'
                                ? 'secondary'
                                : 'outline'
                          }
                          className="text-xs"
                        >
                          {prediction.riskLevel.toUpperCase()} RISK
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Risk Score and Timeline */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Risk Probability</span>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {Math.round(prediction.probabilityScore * 100)}%
                          </div>
                        </div>
                      </div>
                      <Progress
                        value={prediction.probabilityScore * 100}
                        className="h-2"
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
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Until onset</span>
                        <span className="font-medium">
                          {daysUntilOnset > 0 ? `${daysUntilOnset} days` : 'Immediate'}
                        </span>
                      </div>
                    </div>

                    {/* Treatment Window */}
                    <div
                      className={`p-3 rounded-lg border-l-4 ${
                        isUrgent ? 'bg-red-50 border-l-red-500' : 'bg-blue-50 border-l-blue-500'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span className="font-medium text-sm">Treatment Window</span>
                          </div>
                          {isUrgent && (
                            <Badge variant="destructive" className="text-xs">
                              {treatmentPriority.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {prediction.preventionWindow.startDate.toLocaleDateString()} -{' '}
                          {prediction.preventionWindow.endDate.toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {prediction.preventionWindow.optimalTiming}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 px-4 pb-4">
                {/* Treatment Options */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4 flex-shrink-0" />
                      <span>Treatments</span>
                    </h4>

                    {/* Chemical Treatments */}
                    {prediction.recommendedTreatments.chemical.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs font-medium text-gray-600 mb-1">
                          CHEMICAL CONTROL
                        </div>
                        <div className="space-y-2">
                          {prediction.recommendedTreatments.chemical
                            .slice(0, 2)
                            .map((treatment, idx) => (
                              <div key={idx} className="bg-gray-50 p-3 rounded-lg space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">
                                      {treatment.product}
                                    </div>
                                    <div className="text-xs text-gray-500">{treatment.dosage}</div>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <div className="text-xs text-gray-500">₹{treatment.cost}</div>
                                    <div className="text-xs text-green-600">
                                      {Math.round(treatment.effectiveness * 100)}%
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Organic Treatments */}
                    {prediction.recommendedTreatments.organic.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs font-medium text-gray-600 mb-1">
                          ORGANIC CONTROL
                        </div>
                        <div className="space-y-2">
                          {prediction.recommendedTreatments.organic
                            .slice(0, 2)
                            .map((treatment, idx) => (
                              <div key={idx} className="bg-green-50 p-3 rounded-lg">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="font-medium text-sm truncate">
                                    {treatment.method}
                                  </div>
                                  <div className="text-xs text-green-600 flex-shrink-0">
                                    {Math.round(treatment.effectiveness * 100)}%
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Cultural Practices */}
                    {prediction.recommendedTreatments.cultural.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">
                          CULTURAL PRACTICES
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {prediction.recommendedTreatments.cultural
                            .slice(0, 3)
                            .map((practice, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {practice}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
                    <Button
                      size="sm"
                      onClick={() => handleActionTaken(prediction.id, 'preventive_spray')}
                      className="w-full h-9"
                      variant={isUrgent ? 'default' : 'outline'}
                    >
                      <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">Applied Treatment</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleActionTaken(prediction.id, 'monitoring')}
                      className="w-full h-9"
                    >
                      <Bug className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">Continue Monitoring</span>
                    </Button>
                  </div>
                </div>

                {/* Community Intelligence */}
                {prediction.communityReports > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">Community Alert</span>
                    </div>
                    <div className="text-sm text-amber-700 mt-1">
                      {prediction.communityReports} nearby farm
                      {prediction.communityReports !== 1 ? 's have' : ' has'} reported similar
                      conditions in the past week.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Footer */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-blue-800 mb-2">
            <Zap className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">AI Predictions</span>
          </div>
          <div className="text-xs text-blue-700 leading-relaxed">
            Based on weather, patterns & community data. Typically 85%+ accurate.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
