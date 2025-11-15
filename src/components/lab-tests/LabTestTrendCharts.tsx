'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp } from 'lucide-react'
import { type LabTestRecord } from './TestDetailsCard'

interface LabTestTrendChartsProps {
  soilTests: LabTestRecord[]
  petioleTests: LabTestRecord[]
}

export function LabTestTrendCharts({ soilTests, petioleTests }: LabTestTrendChartsProps) {
  // Check if we have enough data for trends
  const hasSoilTrends = soilTests.length >= 2
  const hasPetioleTrends = petioleTests.length >= 2

  if (!hasSoilTrends && !hasPetioleTrends) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Trend charts coming soon</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add at least 2 tests to see parameter trends over time
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // TODO: Once Victory charts library is installed, implement actual trend charts here
  // Charts to show:
  // - Soil: pH trend, EC trend, NPK trends
  // - Petiole: N, P, K trends, Ca, Mg trends
  // Features:
  // - Color-coded zones (optimal/watch/action ranges)
  // - Hover tooltips with exact values
  // - Toggle between soil and petiole
  // - Download chart as image

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">📈 Parameter Trends</CardTitle>
            <Badge variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-700">
              Charts Coming Soon
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-8 text-center border-2 border-dashed">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Interactive Charts Coming Soon</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              We're building interactive trend charts to visualize how your soil and plant health
              parameters change over time. This will include pH, EC, NPK levels, and more with
              color-coded optimal ranges.
            </p>
            <div className="mt-4 text-xs text-muted-foreground">
              <strong>Available data:</strong>{' '}
              {hasSoilTrends && `${soilTests.length} soil tests`}
              {hasSoilTrends && hasPetioleTrends && ', '}
              {hasPetioleTrends && `${petioleTests.length} petiole tests`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview of what's coming */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {hasSoilTrends && (
          <Card className="bg-gradient-to-br from-green-50 to-blue-50">
            <CardHeader>
              <CardTitle className="text-sm">🌱 Soil Trends</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              • pH levels over time
              <br />
              • EC (salinity) trends
              <br />
              • NPK nutrient changes
              <br />
              • Micronutrient tracking
              <br />
            </CardContent>
          </Card>
        )}
        {hasPetioleTrends && (
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardHeader>
              <CardTitle className="text-sm">🍃 Petiole Trends</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              • Nitrogen uptake trends
              <br />
              • P, K absorption patterns
              <br />
              • Ca, Mg balance tracking
              <br />
              • Growth stage correlations
              <br />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
