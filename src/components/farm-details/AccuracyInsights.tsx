/**
 * Accuracy Insights Component
 *
 * Shows farmers:
 * 1. Current ETo accuracy level
 * 2. Progress towards better accuracy
 * 3. Recommendations for improvement
 * 4. Historical validation results
 * 5. Regional calibration status
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Target,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Info,
  Lightbulb,
  Award,
  LineChart,
  Activity,
  RefreshCw
} from 'lucide-react'
import type { Farm } from '@/types/types'
import type { WeatherProvider } from '@/lib/weather-providers/types'
import { AccuracyEnhancementService } from '@/lib/weather-providers/eto-accuracy-enhancement-service'
import { EToAccuracyService } from '@/lib/services/eto-accuracy-service'

interface AccuracyInsightsProps {
  farm: Farm
  currentProvider: WeatherProvider
}

interface AccuracyLevel {
  level: 'basic' | 'good' | 'excellent' | 'professional'
  errorRange: string
  description: string
  color: string
  icon: typeof Target
}

const ACCURACY_LEVELS: Record<string, AccuracyLevel> = {
  basic: {
    level: 'basic',
    errorRange: '±15-20%',
    description: 'Standard API accuracy',
    color: 'text-gray-600',
    icon: Activity
  },
  good: {
    level: 'good',
    errorRange: '±8-12%',
    description: 'Multiple providers + validation',
    color: 'text-blue-600',
    icon: TrendingUp
  },
  excellent: {
    level: 'excellent',
    errorRange: '±5-8%',
    description: 'Local sensors + calibration',
    color: 'text-green-600',
    icon: CheckCircle2
  },
  professional: {
    level: 'professional',
    errorRange: '±3-5%',
    description: 'Full weather station',
    color: 'text-purple-600',
    icon: Award
  }
}

export function AccuracyInsights({ farm, currentProvider }: AccuracyInsightsProps) {
  const [currentLevel, setCurrentLevel] = useState<AccuracyLevel>(ACCURACY_LEVELS.basic)
  const [validationCount, setValidationCount] = useState(0)
  const [hasLocalSensors, setHasLocalSensors] = useState(false)
  const [useMultipleProviders, setUseMultipleProviders] = useState(false)
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    assessCurrentAccuracy()
  }, [farm.id, currentProvider])

  const assessCurrentAccuracy = async () => {
    setLoading(true)

    try {
      if (!farm.id) {
        console.error('Farm ID is required')
        setLoading(false)
        return
      }

      // Load accuracy level from service
      const accuracyData = await EToAccuracyService.AccuracyInsights.getAccuracyLevel(farm.id)

      setValidationCount(accuracyData.validationCount)
      setHasLocalSensors(accuracyData.hasSensorData)

      // Set accuracy level
      const level = ACCURACY_LEVELS[accuracyData.level]
      setCurrentLevel(level)

      // Check if using multiple providers (from localStorage)
      const multiProvider = false // TODO: Implement multi-provider setting check
      setUseMultipleProviders(multiProvider)

      // Generate recommendations
      generateRecommendations(
        level,
        accuracyData.validationCount,
        accuracyData.hasSensorData,
        multiProvider
      )
    } catch (error) {
      console.error('Error assessing accuracy:', error)
      // Keep default values on error
    } finally {
      setLoading(false)
    }
  }

  const generateRecommendations = (
    level: AccuracyLevel,
    validations: number,
    sensors: boolean,
    multiProvider: boolean
  ) => {
    const recs: string[] = []

    if (!multiProvider) {
      recs.push('Enable multiple weather providers for instant ±3% improvement')
    }

    if (validations < 5) {
      recs.push('Add 5 validations this month to unlock regional calibration')
    }

    if (!sensors && validations >= 5) {
      recs.push('Consider adding a ₹500 thermometer for ±5% accuracy')
    }

    if (sensors && validations < 20) {
      recs.push('Continue monthly validations to reach professional accuracy')
    }

    if (level.level === 'professional') {
      recs.push('Excellent! You have achieved professional-grade accuracy.')
    }

    setRecommendations(recs)
  }

  const getProgressToNext = (): number => {
    return EToAccuracyService.AccuracyInsights.getProgressToNextLevel(
      currentLevel.level,
      validationCount,
      hasLocalSensors
    )
  }

  const getNextLevelName = (): string => {
    const levels = ['basic', 'good', 'excellent', 'professional']
    const currentIndex = levels.indexOf(currentLevel.level)
    const nextIndex = Math.min(currentIndex + 1, levels.length - 1)
    return levels[nextIndex]
  }

  const getWaterSavingsEstimate = (): string => {
    // Estimate water savings from improved accuracy
    const errorReduction = {
      basic: 0,
      good: 5,
      excellent: 10,
      professional: 15
    }

    const savings = errorReduction[currentLevel.level]
    return `${savings}%`
  }

  const Icon = currentLevel.icon

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Accuracy Insights</CardTitle>
          <CardDescription>Loading your accuracy data...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-muted-foreground">Analyzing accuracy metrics...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Current Accuracy Level */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${currentLevel.color}`} />
              Current Accuracy:{' '}
              {currentLevel.level.charAt(0).toUpperCase() + currentLevel.level.slice(1)}
            </div>
            <Badge variant="outline" className={currentLevel.color}>
              {currentLevel.errorRange}
            </Badge>
          </CardTitle>
          <CardDescription>{currentLevel.description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress to Next Level */}
          {currentLevel.level !== 'professional' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Progress to {getNextLevelName()} accuracy
                </span>
                <span className="font-medium">{getProgressToNext().toFixed(0)}%</span>
              </div>
              <Progress value={getProgressToNext()} className="h-2" />
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-2xl font-bold">{validationCount}</p>
              <p className="text-xs text-muted-foreground">Validations</p>
            </div>

            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-2xl font-bold">{hasLocalSensors ? 'Yes' : 'No'}</p>
              <p className="text-xs text-muted-foreground">Local Sensors</p>
            </div>

            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-2xl font-bold">{getWaterSavingsEstimate()}</p>
              <p className="text-xs text-muted-foreground">Water Savings</p>
            </div>
          </div>

          {/* Accuracy Milestones */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Accuracy Milestones
            </h3>

            <div className="space-y-2">
              {/* Basic */}
              <div className="flex items-center gap-3">
                <CheckCircle2
                  className={`h-5 w-5 ${
                    currentLevel.level !== 'basic' ? 'text-green-600' : 'text-gray-300'
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Basic Accuracy</p>
                  <p className="text-xs text-muted-foreground">
                    Single weather provider • ±15-20% error
                  </p>
                </div>
              </div>

              {/* Good */}
              <div className="flex items-center gap-3">
                <CheckCircle2
                  className={`h-5 w-5 ${
                    ['good', 'excellent', 'professional'].includes(currentLevel.level)
                      ? 'text-green-600'
                      : 'text-gray-300'
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Good Accuracy</p>
                  <p className="text-xs text-muted-foreground">
                    Multiple providers + 5 validations • ±8-12% error
                  </p>
                </div>
                {!['good', 'excellent', 'professional'].includes(currentLevel.level) && (
                  <Badge variant="outline" className="text-xs">
                    {validationCount}/5
                  </Badge>
                )}
              </div>

              {/* Excellent */}
              <div className="flex items-center gap-3">
                <CheckCircle2
                  className={`h-5 w-5 ${
                    ['excellent', 'professional'].includes(currentLevel.level)
                      ? 'text-green-600'
                      : 'text-gray-300'
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Excellent Accuracy</p>
                  <p className="text-xs text-muted-foreground">
                    Local sensors OR 10+ validations • ±5-8% error
                  </p>
                </div>
                {!['excellent', 'professional'].includes(currentLevel.level) && (
                  <Badge variant="outline" className="text-xs">
                    {hasLocalSensors ? 'Sensors needed' : `${validationCount}/10`}
                  </Badge>
                )}
              </div>

              {/* Professional */}
              <div className="flex items-center gap-3">
                <CheckCircle2
                  className={`h-5 w-5 ${
                    currentLevel.level === 'professional' ? 'text-green-600' : 'text-gray-300'
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Professional Accuracy</p>
                  <p className="text-xs text-muted-foreground">
                    Sensors + 20+ validations • ±3-5% error
                  </p>
                </div>
                {currentLevel.level !== 'professional' && (
                  <Badge variant="outline" className="text-xs">
                    {!hasLocalSensors ? 'Sensors needed' : `${validationCount}/20`}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Recommendations to Improve Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((rec, idx) => (
              <Alert key={idx}>
                <Info className="h-4 w-4" />
                <AlertDescription>{rec}</AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full justify-start" variant="outline">
            <Target className="h-4 w-4 mr-2" />
            Add Local Sensor Reading
          </Button>

          <Button className="w-full justify-start" variant="outline">
            <LineChart className="h-4 w-4 mr-2" />
            View Validation History
          </Button>

          <Button className="w-full justify-start" variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Compare Weather Providers
          </Button>
        </CardContent>
      </Card>

      {/* Educational Content */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Why Accuracy Matters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <strong>Over-irrigation (when ETo is overestimated):</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
            <li>Water waste and higher costs</li>
            <li>Nutrient leaching from soil</li>
            <li>Increased disease risk</li>
            <li>Reduced oxygen in root zone</li>
          </ul>

          <p className="mt-3">
            <strong>Under-irrigation (when ETo is underestimated):</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
            <li>Crop water stress</li>
            <li>Reduced yield and quality</li>
            <li>Poor fruit development</li>
            <li>Heat stress damage</li>
          </ul>

          <Alert className="mt-4 bg-white dark:bg-gray-900">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Bottom line:</strong> Improving from ±20% to ±5% accuracy can save 10-15%
              water while maintaining or improving yield.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
