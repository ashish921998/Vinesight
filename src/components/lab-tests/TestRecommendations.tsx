'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  type Recommendation,
  getPriorityColor,
  getPriorityLabel
} from '@/lib/lab-test-recommendations'
import { AlertCircle, TrendingUp, CheckCircle2, DollarSign } from 'lucide-react'

interface TestRecommendationsProps {
  recommendations: Recommendation[]
  testType: 'soil' | 'petiole'
}

export function TestRecommendations({ recommendations, testType }: TestRecommendationsProps) {
  if (recommendations.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">All parameters look good!</p>
              <p className="text-sm text-green-700">
                No specific recommendations at this time. Continue current practices.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Group recommendations by priority
  const criticalAndHigh = recommendations.filter(
    (r) => r.priority === 'critical' || r.priority === 'high'
  )
  const moderateAndLow = recommendations.filter(
    (r) => r.priority === 'moderate' || r.priority === 'low'
  )
  const optimal = recommendations.filter((r) => r.priority === 'optimal')
  const savings = recommendations.filter((r) => r.type === 'savings')

  const getIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'action':
        return <AlertCircle className="h-5 w-5" />
      case 'watch':
        return <TrendingUp className="h-5 w-5" />
      case 'optimal':
        return <CheckCircle2 className="h-5 w-5" />
      case 'savings':
        return <DollarSign className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            📋 Recommendations for {testType === 'soil' ? 'Soil' : 'Petiole'} Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Critical & High Priority Actions */}
          {criticalAndHigh.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                Priority Actions
              </h3>
              <div className="space-y-3">
                {criticalAndHigh.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border p-4 ${getPriorityColor(rec.priority)}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{rec.icon}</span>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="border-current">
                            {rec.parameter}
                          </Badge>
                          <Badge variant="outline" className="border-current text-xs">
                            {getPriorityLabel(rec.priority)}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-relaxed">{rec.simple}</p>
                          <details className="text-sm opacity-90">
                            <summary className="cursor-pointer text-xs font-semibold hover:underline">
                              Technical Details
                            </summary>
                            <p className="mt-2 text-xs leading-relaxed bg-white/50 p-2 rounded">
                              {rec.technical}
                            </p>
                          </details>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cost Savings Opportunities */}
          {savings.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Cost Savings Opportunities
              </h3>
              <div className="space-y-3">
                {savings.map((rec, idx) => (
                  <div key={idx} className="rounded-lg border p-4 bg-green-50 border-green-200">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{rec.icon}</span>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="border-green-600 text-green-700">
                            {rec.parameter}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-green-600 text-green-700 text-xs"
                          >
                            Save Money
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-relaxed text-green-900">
                            {rec.simple}
                          </p>
                          <details className="text-sm text-green-800">
                            <summary className="cursor-pointer text-xs font-semibold hover:underline">
                              Technical Details
                            </summary>
                            <p className="mt-2 text-xs leading-relaxed bg-white/50 p-2 rounded">
                              {rec.technical}
                            </p>
                          </details>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Watch Items & Moderate Priority */}
          {moderateAndLow.length > 0 && (
            <details className="space-y-3">
              <summary className="cursor-pointer font-semibold text-foreground flex items-center gap-2 hover:underline">
                <TrendingUp className="h-4 w-4 text-yellow-600" />
                Monitor These Parameters ({moderateAndLow.length})
              </summary>
              <div className="space-y-3 mt-3">
                {moderateAndLow.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border p-4 ${getPriorityColor(rec.priority)}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{rec.icon}</span>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="border-current">
                            {rec.parameter}
                          </Badge>
                          <Badge variant="outline" className="border-current text-xs">
                            {getPriorityLabel(rec.priority)}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-relaxed">{rec.simple}</p>
                          <details className="text-sm opacity-90">
                            <summary className="cursor-pointer text-xs font-semibold hover:underline">
                              Technical Details
                            </summary>
                            <p className="mt-2 text-xs leading-relaxed bg-white/50 p-2 rounded">
                              {rec.technical}
                            </p>
                          </details>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Optimal Parameters */}
          {optimal.length > 0 && (
            <details className="space-y-3">
              <summary className="cursor-pointer font-semibold text-foreground flex items-center gap-2 hover:underline">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Optimal Parameters ({optimal.length})
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {optimal.map((rec, idx) => (
                  <div key={idx} className="rounded-lg border p-3 bg-green-50 border-green-200">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{rec.icon}</span>
                      <div className="flex-1">
                        <Badge variant="outline" className="border-green-600 text-green-700 mb-1">
                          {rec.parameter}
                        </Badge>
                        <p className="text-xs text-green-800 leading-relaxed">{rec.simple}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-700">
              {criticalAndHigh.filter((r) => r.priority === 'critical').length}
            </div>
            <div className="text-xs text-red-600 font-medium">Urgent</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-700">
              {criticalAndHigh.filter((r) => r.priority === 'high').length}
            </div>
            <div className="text-xs text-orange-600 font-medium">High Priority</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{optimal.length}</div>
            <div className="text-xs text-green-600 font-medium">Optimal</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{savings.length}</div>
            <div className="text-xs text-blue-600 font-medium">Savings</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
