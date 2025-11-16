'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SupabaseService } from '@/lib/supabase-service'
import { AIIntelligenceService } from '@/lib/ai-intelligence'
import type { Recommendation } from '@/lib/lab-test-recommendations'
import { TrendingUp, TrendingDown, DollarSign, Loader2, Save, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface ROICalculatorProps {
  testId: number
  testType: 'soil' | 'petiole'
  farmId: number
  testDate: string
  recommendations: Recommendation[]
}

export function ROICalculator({
  testId,
  testType,
  farmId,
  testDate,
  recommendations
}: ROICalculatorProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [roiData, setRoiData] = useState<any>(null)
  const [editing, setEditing] = useState(false)

  // Form state for actual outcomes
  const [actualData, setActualData] = useState({
    fertilizer_savings: '',
    yield_increase_kg: '',
    yield_increase_value: '',
    disease_prevention_savings: '',
    water_savings: ''
  })

  // Load existing ROI data
  useEffect(() => {
    loadROIData()
  }, [testId])

  const loadROIData = async () => {
    setLoading(true)
    try {
      const existingROI = await SupabaseService.getTestROI(testId)

      if (existingROI) {
        setRoiData(existingROI)
        setActualData({
          fertilizer_savings: existingROI.fertilizer_savings?.toString() || '',
          yield_increase_kg: existingROI.yield_increase_kg?.toString() || '',
          yield_increase_value: existingROI.yield_increase_value?.toString() || '',
          disease_prevention_savings: existingROI.disease_prevention_savings?.toString() || '',
          water_savings: existingROI.water_savings?.toString() || ''
        })
      } else {
        // Generate estimated ROI if no data exists
        const estimated = AIIntelligenceService.calculateEstimatedROI(1000, recommendations, 1)

        // Create initial ROI record with estimates
        const newROI = await SupabaseService.createTestROI({
          test_id: testId,
          test_type: testType,
          farm_id: farmId,
          test_date: testDate,
          test_cost: 1000,
          fertilizer_savings: 0,
          yield_increase_kg: 0,
          yield_increase_value: 0,
          disease_prevention_savings: 0,
          water_savings: 0,
          total_benefit: 0,
          roi_percentage: 0
        })
        setRoiData(newROI)
      }
    } catch (error) {
      console.error('Error loading ROI data:', error)
      toast.error('Failed to load ROI data')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveActual = async () => {
    setSaving(true)
    try {
      const fertilizer_savings = parseFloat(actualData.fertilizer_savings) || 0
      const yield_increase_kg = parseFloat(actualData.yield_increase_kg) || 0
      const yield_increase_value = parseFloat(actualData.yield_increase_value) || 0
      const disease_prevention_savings = parseFloat(actualData.disease_prevention_savings) || 0
      const water_savings = parseFloat(actualData.water_savings) || 0

      const total_benefit =
        fertilizer_savings + yield_increase_value + disease_prevention_savings + water_savings

      const roi_percentage = ((total_benefit - roiData.test_cost) / roiData.test_cost) * 100

      const updated = await SupabaseService.updateTestROI(roiData.id, {
        fertilizer_savings,
        yield_increase_kg,
        yield_increase_value,
        disease_prevention_savings,
        water_savings,
        total_benefit,
        roi_percentage,
        outcome_measured_date: new Date().toISOString().split('T')[0]
      })

      setRoiData(updated)
      setEditing(false)
      toast.success('ROI data saved successfully!')
    } catch (error) {
      console.error('Error saving ROI data:', error)
      toast.error('Failed to save ROI data')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '—'
    return `₹${Math.round(value).toLocaleString('en-IN')}`
  }

  const formatKg = (value: number | null | undefined) => {
    if (value === null || value === undefined || value === 0) return '—'
    return `${value.toFixed(1)} kg`
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

  // Calculate estimated ROI for comparison
  const estimated = AIIntelligenceService.calculateEstimatedROI(
    roiData.test_cost,
    recommendations,
    1
  )

  const hasActualData =
    roiData.fertilizer_savings > 0 ||
    roiData.yield_increase_value > 0 ||
    roiData.disease_prevention_savings > 0 ||
    roiData.water_savings > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          💰 Return on Investment (ROI) Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 text-center">
              <div className="text-sm text-blue-600 font-medium mb-1">Test Cost</div>
              <div className="text-2xl font-bold text-blue-700">
                {formatCurrency(roiData.test_cost)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <div className="text-sm text-green-600 font-medium mb-1">Total Benefit</div>
              <div className="text-2xl font-bold text-green-700">
                {formatCurrency(roiData.total_benefit)}
              </div>
            </CardContent>
          </Card>

          <Card
            className={`${
              roiData.roi_percentage >= 0
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-red-200 bg-red-50'
            }`}
          >
            <CardContent className="p-4 text-center">
              <div
                className={`text-sm font-medium mb-1 ${
                  roiData.roi_percentage >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                ROI
              </div>
              <div
                className={`text-2xl font-bold flex items-center justify-center gap-1 ${
                  roiData.roi_percentage >= 0 ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {roiData.roi_percentage >= 0 ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
                {Math.round(roiData.roi_percentage)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estimated vs Actual */}
        {!hasActualData && (
          <Alert className="bg-amber-50 border-amber-300">
            <AlertDescription className="text-sm text-amber-900">
              <strong>Estimated Savings:</strong> Based on recommendations, you could save{' '}
              <strong>{formatCurrency(estimated.estimated_savings)}</strong> and improve yield by{' '}
              <strong>{estimated.estimated_yield_impact}%</strong>. Track actual outcomes below to
              measure real ROI.
            </AlertDescription>
          </Alert>
        )}

        {/* Input Form for Actual Outcomes */}
        {!editing && !hasActualData && (
          <div className="flex justify-center">
            <Button onClick={() => setEditing(true)} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Track Actual Outcomes
            </Button>
          </div>
        )}

        {!editing && hasActualData && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Actual Outcomes</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
                className="flex items-center gap-2"
              >
                Update Outcomes
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border rounded-lg p-3 bg-muted/30">
                <div className="text-xs text-muted-foreground font-medium">Fertilizer Savings</div>
                <div className="text-lg font-semibold text-foreground mt-1">
                  {formatCurrency(roiData.fertilizer_savings)}
                </div>
              </div>

              <div className="border rounded-lg p-3 bg-muted/30">
                <div className="text-xs text-muted-foreground font-medium">Yield Increase</div>
                <div className="text-lg font-semibold text-foreground mt-1">
                  {formatKg(roiData.yield_increase_kg)}
                  {roiData.yield_increase_value > 0 && (
                    <span className="text-sm ml-2 text-green-600">
                      ({formatCurrency(roiData.yield_increase_value)})
                    </span>
                  )}
                </div>
              </div>

              <div className="border rounded-lg p-3 bg-muted/30">
                <div className="text-xs text-muted-foreground font-medium">
                  Disease Prevention Savings
                </div>
                <div className="text-lg font-semibold text-foreground mt-1">
                  {formatCurrency(roiData.disease_prevention_savings)}
                </div>
              </div>

              <div className="border rounded-lg p-3 bg-muted/30">
                <div className="text-xs text-muted-foreground font-medium">Water Savings</div>
                <div className="text-lg font-semibold text-foreground mt-1">
                  {formatCurrency(roiData.water_savings)}
                </div>
              </div>
            </div>

            {roiData.outcome_measured_date && (
              <div className="text-xs text-muted-foreground text-center">
                Last updated: {new Date(roiData.outcome_measured_date).toLocaleDateString('en-IN')}
              </div>
            )}
          </div>
        )}

        {editing && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Enter Actual Outcomes</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fertilizer_savings">
                  Fertilizer Savings (₹)
                  <span className="text-xs text-muted-foreground ml-2">
                    Money saved by following recommendations
                  </span>
                </Label>
                <Input
                  id="fertilizer_savings"
                  type="number"
                  placeholder="0"
                  value={actualData.fertilizer_savings}
                  onChange={(e) =>
                    setActualData({ ...actualData, fertilizer_savings: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yield_increase_kg">
                  Yield Increase (kg)
                  <span className="text-xs text-muted-foreground ml-2">
                    Additional harvest yield
                  </span>
                </Label>
                <Input
                  id="yield_increase_kg"
                  type="number"
                  placeholder="0"
                  value={actualData.yield_increase_kg}
                  onChange={(e) =>
                    setActualData({ ...actualData, yield_increase_kg: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yield_increase_value">
                  Yield Increase Value (₹)
                  <span className="text-xs text-muted-foreground ml-2">
                    Market value of extra yield
                  </span>
                </Label>
                <Input
                  id="yield_increase_value"
                  type="number"
                  placeholder="0"
                  value={actualData.yield_increase_value}
                  onChange={(e) =>
                    setActualData({ ...actualData, yield_increase_value: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="disease_prevention_savings">
                  Disease Prevention Savings (₹)
                  <span className="text-xs text-muted-foreground ml-2">
                    Saved by preventing diseases
                  </span>
                </Label>
                <Input
                  id="disease_prevention_savings"
                  type="number"
                  placeholder="0"
                  value={actualData.disease_prevention_savings}
                  onChange={(e) =>
                    setActualData({ ...actualData, disease_prevention_savings: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="water_savings">
                  Water/Irrigation Savings (₹)
                  <span className="text-xs text-muted-foreground ml-2">
                    Money saved on water usage
                  </span>
                </Label>
                <Input
                  id="water_savings"
                  type="number"
                  placeholder="0"
                  value={actualData.water_savings}
                  onChange={(e) => setActualData({ ...actualData, water_savings: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSaveActual}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Outcomes
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* ROI Explanation */}
        <div className="bg-muted/30 rounded-lg p-4 text-sm space-y-2">
          <div className="font-semibold text-foreground">How ROI is calculated:</div>
          <ul className="space-y-1 text-muted-foreground">
            <li>
              • <strong>Total Benefit</strong> = Fertilizer Savings + Yield Value + Disease
              Prevention + Water Savings
            </li>
            <li>
              • <strong>ROI %</strong> = (Total Benefit - Test Cost) ÷ Test Cost × 100
            </li>
            <li>• Track actual outcomes to measure real impact of test recommendations</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
