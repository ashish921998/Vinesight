'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getLatestSoilTest, type LabTestWithRecommendations } from '@/lib/lab-test-integration'
import { FlaskConical, Download, Calendar, X } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

interface SoilTestLoadBannerProps {
  farmId: number
  onLoadTest: (testParameters: Record<string, any>) => void
}

export function SoilTestLoadBanner({ farmId, onLoadTest }: SoilTestLoadBannerProps) {
  const [latestTest, setLatestTest] = useState<LabTestWithRecommendations | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    loadLatestTest()
  }, [farmId])

  const loadLatestTest = async () => {
    setLoading(true)
    try {
      const test = await getLatestSoilTest(farmId)
      setLatestTest(test)
    } catch (error) {
      console.error('Error loading latest soil test:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadTest = () => {
    if (!latestTest) return
    onLoadTest(latestTest.test.parameters)
  }

  // Don't show if dismissed or no test available or loading
  if (dismissed || !latestTest || loading) return null

  // Show warning if test is old (>120 days)
  const testAge = latestTest.age
  const isOld = testAge > 120

  return (
    <Alert
      className={`${isOld ? 'bg-yellow-50 border-yellow-300' : 'bg-blue-50 border-blue-300'} mb-6`}
    >
      <FlaskConical className={`h-4 w-4 ${isOld ? 'text-yellow-600' : 'text-blue-600'}`} />
      <AlertDescription className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground">
              Soil test available from your farm
            </span>
            <Badge variant="outline" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              {format(new Date(latestTest.test.date), 'MMM dd, yyyy')}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {testAge} days ago
            </Badge>
            {isOld && (
              <Badge
                variant="outline"
                className="text-xs bg-yellow-100 border-yellow-400 text-yellow-700"
              >
                ⚠️ Consider new test
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Load test results to pre-fill soil parameters (pH, EC, N, P, K, micronutrients) instead
            of entering manually.
            {isOld &&
              ' Note: This test is over 4 months old. Consider taking a new test for accurate recommendations.'}
          </p>
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={handleLoadTest}
              className="flex items-center gap-2"
              variant={isOld ? 'outline' : 'default'}
            >
              <Download className="h-4 w-4" />
              Load Soil Test Data
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Dismiss
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}
