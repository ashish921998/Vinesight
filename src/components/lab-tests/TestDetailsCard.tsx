'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { TestRecommendations } from './TestRecommendations'
import {
  generateSoilTestRecommendations,
  generatePetioleTestRecommendations
} from '@/lib/lab-test-recommendations'
import { FileText, Edit, Trash2, Calendar, FileCheck, Sprout } from 'lucide-react'
import { format } from 'date-fns'
import { FertilizerPlanGenerator } from './FertilizerPlanGenerator'
// Phase 3A - Commented out for initial launch
// import { DiseaseRiskAlerts } from './DiseaseRiskAlerts'
// import { ROICalculator } from './ROICalculator'
// import { OutcomeTracker } from './OutcomeTracker'
// import { AIIntelligenceService } from '@/lib/ai-intelligence'
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export interface LabTestRecord {
  id: number
  date: string
  date_of_pruning?: string | null
  parameters: Record<string, any>
  notes?: string | null
  report_filename?: string | null
  report_url?: string | null
  report_storage_path?: string | null
  extraction_status?: string | null
  created_at?: string | null
}

interface TestDetailsCardProps {
  test: LabTestRecord
  testType: 'soil' | 'petiole'
  previousTest?: LabTestRecord
  farmId: number
  onEdit: (test: LabTestRecord) => void
  onDelete: (test: LabTestRecord) => void
}

export function TestDetailsCard({
  test,
  testType,
  previousTest,
  farmId,
  onEdit,
  onDelete
}: TestDetailsCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [showReportViewer, setShowReportViewer] = useState(false)
  const [showFertilizerPlan, setShowFertilizerPlan] = useState(false)

  // Phase 3A - Commented out for initial launch
  // const [diseaseRiskAlerts, setDiseaseRiskAlerts] = useState<any[]>([])
  // useEffect(() => {
  //   const loadAlerts = async () => {
  //     const alerts = await AIIntelligenceService.generateDiseaseRiskAlerts(
  //       test.id,
  //       testType,
  //       farmId,
  //       test.parameters
  //     )
  //     setDiseaseRiskAlerts(alerts)
  //   }
  //   loadAlerts()
  // }, [test.id, testType, farmId, test.parameters])

  // Generate recommendations
  const recommendations =
    testType === 'soil'
      ? generateSoilTestRecommendations(test.parameters as any)
      : generatePetioleTestRecommendations(test.parameters as any)

  // Helper to format parameter value
  const formatValue = (value: any, decimals: number = 2): string => {
    if (value === null || value === undefined || value === '') return '—'
    if (typeof value === 'number') return value.toFixed(decimals)
    return String(value)
  }

  // Helper to calculate change from previous test
  const getChange = (
    param: string
  ): { value: number; direction: 'up' | 'down' | 'same' } | null => {
    if (!previousTest || !previousTest.parameters[param] || !test.parameters[param]) return null

    const current = Number(test.parameters[param])
    const previous = Number(previousTest.parameters[param])

    if (isNaN(current) || isNaN(previous)) return null

    const change = current - previous
    if (Math.abs(change) < 0.01) return { value: 0, direction: 'same' }

    return {
      value: change,
      direction: change > 0 ? 'up' : 'down'
    }
  }

  // Get key parameters to display in preview
  const getKeyParameters = () => {
    if (testType === 'soil') {
      return [
        { key: 'ph', label: 'pH', unit: '' },
        { key: 'ec', label: 'EC', unit: 'dS/m' },
        { key: 'nitrogen', label: 'N', unit: 'ppm' },
        { key: 'phosphorus', label: 'P', unit: 'ppm' },
        { key: 'potassium', label: 'K', unit: 'ppm' }
      ]
    } else {
      return [
        { key: 'total_nitrogen', label: 'N', unit: '%' },
        { key: 'phosphorus', label: 'P', unit: '%' },
        { key: 'potassium', label: 'K', unit: '%' },
        { key: 'calcium', label: 'Ca', unit: '%' },
        { key: 'magnesium', label: 'Mg', unit: '%' }
      ]
    }
  }

  const keyParams = getKeyParameters()

  // Get urgency level from recommendations
  const urgencyLevel = recommendations.some((r) => r.priority === 'critical')
    ? 'critical'
    : recommendations.some((r) => r.priority === 'high')
      ? 'high'
      : recommendations.every((r) => r.priority === 'optimal')
        ? 'optimal'
        : 'moderate'

  const urgencyColor = {
    critical: 'border-red-300 bg-red-50',
    high: 'border-orange-300 bg-orange-50',
    optimal: 'border-green-300 bg-green-50',
    moderate: 'border-yellow-300 bg-yellow-50'
  }[urgencyLevel]

  return (
    <>
      <Card className={`${urgencyColor} border-2 hover:shadow-md transition-shadow rounded-2xl`}>
        <CardContent className="p-2.5 sm:p-4">
          <div className="space-y-2 sm:space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5 sm:space-y-1">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <Badge variant="secondary" className="font-semibold text-xs sm:text-sm h-5 sm:h-6">
                    {testType === 'soil' ? '🌱 Soil' : '🍃 Petiole'}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs sm:text-sm h-5 sm:h-6 ${
                      urgencyLevel === 'critical'
                        ? 'border-red-600 text-red-700'
                        : urgencyLevel === 'high'
                          ? 'border-orange-600 text-orange-700'
                          : urgencyLevel === 'optimal'
                            ? 'border-green-600 text-green-700'
                            : 'border-yellow-600 text-yellow-700'
                    }`}
                  >
                    {urgencyLevel === 'critical'
                      ? '🔴 Urgent'
                      : urgencyLevel === 'high'
                        ? '🟡 Action'
                        : urgencyLevel === 'optimal'
                          ? '✅ Good'
                          : '⚠️ Monitor'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(test.date), 'MMM dd, yyyy')}</span>
                </div>
                {test.report_filename && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <FileCheck className="h-3 w-3 text-blue-600" />
                    <span className="text-[10px] sm:text-xs text-blue-700">Report attached</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(test)}
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-2xl"
                >
                  <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(test)}
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 rounded-2xl"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>

            {/* Key Parameters Preview */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
              {keyParams.map((param) => {
                const value = test.parameters[param.key]
                const change = getChange(param.key)

                return (
                  <div key={param.key} className="bg-white/60 rounded-2xl p-1.5 sm:p-2 text-center border">
                    <div className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">{param.label}</div>
                    <div className="text-sm sm:text-lg font-bold text-foreground leading-tight">
                      {formatValue(value)}
                      {value && <span className="text-[10px] sm:text-xs ml-0.5">{param.unit}</span>}
                    </div>
                    {change && change.direction !== 'same' && (
                      <div
                        className={`text-[10px] sm:text-xs ${change.direction === 'up' ? 'text-blue-600' : 'text-orange-600'}`}
                      >
                        {change.direction === 'up' ? '↑' : '↓'} {Math.abs(change.value).toFixed(1)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Recommendations Summary */}
            <div className="space-y-1 sm:space-y-2">
              <div className="text-[11px] sm:text-xs font-semibold text-foreground">Recommendations:</div>
              <div className="space-y-0.5 sm:space-y-1">
                {recommendations.slice(0, 2).map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
                    <span className="text-xs sm:text-sm">{rec.icon}</span>
                    <span className="text-muted-foreground leading-snug sm:leading-relaxed">{rec.simple}</span>
                  </div>
                ))}
                {recommendations.length > 2 && (
                  <div className="text-[11px] sm:text-xs text-blue-600 font-medium">
                    +{recommendations.length - 2} more
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1.5 sm:gap-2 pt-1 sm:pt-2">
              <div className="flex gap-1.5 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(true)}
                  className="flex-1 text-xs sm:text-sm h-7 sm:h-9 rounded-2xl"
                >
                  <span className="hidden sm:inline">View Full Details</span>
                  <span className="sm:hidden">Details</span>
                </Button>
                {test.report_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReportViewer(true)}
                    className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3 rounded-2xl"
                  >
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Report</span>
                  </Button>
                )}
              </div>
              {/* Fertilizer Plan Button - only show if there are actionable recommendations */}
              {recommendations.filter((r) => r.priority === 'critical' || r.priority === 'high')
                .length > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowFertilizerPlan(true)}
                  className="w-full flex items-center gap-1.5 sm:gap-2 bg-green-600 hover:bg-green-700 text-xs sm:text-sm h-7 sm:h-9 rounded-2xl"
                >
                  <Sprout className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Generate Fertilizer Plan</span>
                  <span className="sm:hidden">Fertilizer Plan</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg pr-6">
              {testType === 'soil' ? '🌱 Soil' : '🍃 Petiole'} Test Details -{' '}
              {format(new Date(test.date), 'MMM dd, yyyy')}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Complete test results and recommendations for your farm
            </DialogDescription>
          </DialogHeader>

          {/* Phase 3A tabs (Disease Risks, ROI, Action Tracking) commented out for initial launch */}
          <div className="space-y-6 mt-4">
              {/* All Parameters */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">📊 All Parameters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {Object.entries(test.parameters)
                      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
                      .map(([key, value]) => {
                        const change = getChange(key)
                        return (
                          <div
                            key={key}
                            className="border rounded-lg p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="text-xs text-muted-foreground font-medium capitalize">
                              {key.replace(/_/g, ' ')}
                            </div>
                            <div className="text-base font-semibold text-foreground mt-1">
                              {formatValue(value)}
                            </div>
                            {change && change.direction !== 'same' && (
                              <div
                                className={`text-xs mt-1 ${change.direction === 'up' ? 'text-blue-600' : 'text-orange-600'}`}
                              >
                                {change.direction === 'up' ? '↑' : '↓'}{' '}
                                {Math.abs(change.value).toFixed(2)} from last test
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <TestRecommendations recommendations={recommendations} testType={testType} />

              {/* Notes */}
              {test.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">📝 Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {test.notes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Report Info */}
              {test.report_filename && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">📄 Lab Report</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{test.report_filename}</div>
                        <div className="text-xs text-muted-foreground">
                          {test.extraction_status === 'success'
                            ? '✅ Auto-extracted successfully'
                            : '⚠️ Manual entry'}
                        </div>
                      </div>
                      {test.report_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowReportViewer(true)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Report
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Phase 3A - Commented out for initial launch
            <TabsContent value="disease" className="mt-4">
              <DiseaseRiskAlerts alerts={diseaseRiskAlerts} />
            </TabsContent>

            <TabsContent value="roi" className="mt-4">
              <ROICalculator
                testId={test.id}
                testType={testType}
                farmId={farmId}
                testDate={test.date}
                recommendations={recommendations}
              />
            </TabsContent>

            <TabsContent value="tracking" className="mt-4">
              <OutcomeTracker
                testId={test.id}
                testType={testType}
                farmId={farmId}
                recommendations={recommendations}
              />
            </TabsContent>
            */}
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Viewer Dialog */}
      {test.report_url && (
        <Dialog open={showReportViewer} onOpenChange={setShowReportViewer}>
          <DialogContent className="max-w-5xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Lab Report - {test.report_filename}</DialogTitle>
            </DialogHeader>
            <div className="w-full h-[70vh]">
              {test.report_filename?.toLowerCase().endsWith('.pdf') ? (
                <iframe src={test.report_url} className="w-full h-full border rounded" />
              ) : (
                <img
                  src={test.report_url}
                  alt="Lab Report"
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Fertilizer Plan Generator Dialog */}
      <FertilizerPlanGenerator
        test={test}
        testType={testType}
        recommendations={recommendations}
        farmId={farmId}
        open={showFertilizerPlan}
        onOpenChange={setShowFertilizerPlan}
      />
    </>
  )
}
