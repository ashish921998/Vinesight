'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import {
  generateFertilizerPlan,
  generateCorrectiveActions,
  type FertilizerPlanItem
} from '@/lib/lab-test-integration'
import { SupabaseService } from '@/lib/supabase-service'
import type { Recommendation } from '@/lib/lab-test-recommendations'
import type { LabTestRecord } from './TestDetailsCard'
import { Calendar, Sprout, DollarSign, CheckCircle, Download, Plus, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface FertilizerPlanGeneratorProps {
  test: LabTestRecord
  testType: 'soil' | 'petiole'
  recommendations: Recommendation[]
  farmId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FertilizerPlanGenerator({
  test,
  testType,
  recommendations,
  farmId,
  open,
  onOpenChange
}: FertilizerPlanGeneratorProps) {
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [creatingTasks, setCreatingTasks] = useState(false)
  const [plan, setPlan] = useState<FertilizerPlanItem[]>([])

  const handleGeneratePlan = () => {
    setGeneratingPlan(true)
    try {
      let generatedPlan: FertilizerPlanItem[]

      if (testType === 'soil') {
        generatedPlan = generateFertilizerPlan(test as any, recommendations)
      } else {
        generatedPlan = generateCorrectiveActions(test as any, recommendations)
      }

      setPlan(generatedPlan)

      if (generatedPlan.length === 0) {
        toast.info('No fertilizer plan needed. All parameters are optimal!')
      } else {
        toast.success(`Generated ${generatedPlan.length} fertilizer plan items`)
      }
    } catch (error) {
      console.error('Error generating plan:', error)
      toast.error('Failed to generate fertilizer plan')
    } finally {
      setGeneratingPlan(false)
    }
  }

  const handleCreateTasks = async () => {
    if (plan.length === 0) return

    setCreatingTasks(true)
    try {
      const tasks = plan.flatMap((item) =>
        item.applications.map((app) => ({
          farm_id: farmId,
          title: `${app.method === 'soil' ? 'Apply' : app.method === 'foliar' ? 'Spray' : 'Add to fertigation'}: ${app.product}`,
          description: `${app.purpose}\n\nDosage: ${app.dosage}\nMethod: ${app.method}\n\nGrowth Stage: ${item.growthStage}\n\nBased on ${testType} test from ${format(new Date(test.date), 'MMM dd, yyyy')}\n\n${item.notes}`,
          due_date: format(item.date, 'yyyy-MM-dd'),
          priority: app.recommendationSource.includes('pH') || app.recommendationSource.includes('EC') ? ('high' as const) : ('medium' as const),
          category: 'fertilization' as const,
          status: 'pending' as const
        }))
      )

      // Create tasks in batch
      for (const task of tasks) {
        await SupabaseService.createTask(task)
      }

      toast.success(`Created ${tasks.length} fertilizer tasks`)
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating tasks:', error)
      toast.error('Failed to create tasks')
    } finally {
      setCreatingTasks(false)
    }
  }

  const exportPlanAsText = () => {
    if (plan.length === 0) return

    const text = `
FERTILIZER PLAN
Based on ${testType === 'soil' ? 'Soil' : 'Petiole'} Test from ${format(new Date(test.date), 'MMMM dd, yyyy')}
Generated on ${format(new Date(), 'MMMM dd, yyyy')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${plan.map((item, idx) => `
${idx + 1}. ${item.month.toUpperCase()} - ${item.growthStage}

${item.applications.map((app, appIdx) => `
   ${idx + 1}.${appIdx + 1} ${app.product}
        • Dosage: ${app.dosage}
        • Method: ${app.method}
        • Purpose: ${app.purpose}
        • Source: ${app.recommendationSource}
`).join('\n')}

   Notes: ${item.notes}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`).join('\n')}

This plan is based on your lab test results and should be adjusted based on:
- Current weather conditions
- Actual vine growth and health
- Local expert advice
- Product availability

Always follow label instructions and safety guidelines when applying fertilizers and chemicals.
`.trim()

    // Download as text file
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fertilizer-plan-${format(new Date(test.date), 'yyyy-MM-dd')}.txt`
    a.click()
    URL.revokeObjectURL(url)

    toast.success('Plan exported as text file')
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'soil':
        return '🌱'
      case 'foliar':
        return '🌿'
      case 'fertigation':
        return '💧'
      default:
        return '📋'
    }
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'soil':
        return 'bg-amber-100 text-amber-700 border-amber-300'
      case 'foliar':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'fertigation':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-green-600" />
            Fertilizer Plan Generator
          </DialogTitle>
          <DialogDescription>
            Generate a season-long fertilizer plan based on your{' '}
            {testType === 'soil' ? 'soil' : 'petiole'} test results
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Test Info */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">
                    {testType === 'soil' ? 'Soil' : 'Petiole'} Test
                  </div>
                  <div className="font-semibold">{format(new Date(test.date), 'MMMM dd, yyyy')}</div>
                </div>
                <div>
                  <Badge variant="secondary">
                    {recommendations.filter((r) => r.priority === 'critical' || r.priority === 'high').length} priority actions
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate Plan Button */}
          {plan.length === 0 ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <Sprout className="h-16 w-16 text-muted-foreground mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Generate Your Fertilizer Plan</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                Based on your test results, we'll create a customized fertilizer application schedule with specific products, dosages, and timing.
              </p>
              <Button onClick={handleGeneratePlan} disabled={generatingPlan} size="lg">
                {generatingPlan ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Plan...
                  </>
                ) : (
                  <>
                    <Sprout className="mr-2 h-4 w-4" />
                    Generate Fertilizer Plan
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              {/* Plan Summary */}
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{plan.length}</div>
                    <div className="text-xs text-muted-foreground">Plan Items</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {plan.reduce((sum, item) => sum + item.applications.length, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Applications</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.ceil((new Date(plan[plan.length - 1].date).getTime() - new Date(plan[0].date).getTime()) / (1000 * 60 * 60 * 24 * 30))}
                    </div>
                    <div className="text-xs text-muted-foreground">Months</div>
                  </CardContent>
                </Card>
              </div>

              {/* Plan Items */}
              <div className="space-y-4">
                {plan.map((item, idx) => (
                  <Card key={idx} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {item.month}
                          </CardTitle>
                          <CardDescription className="mt-1">{item.growthStage}</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {item.applications.length} applications
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Applications */}
                      {item.applications.map((app, appIdx) => (
                        <div
                          key={appIdx}
                          className="border rounded-lg p-3 bg-card hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-2xl mt-1">{getMethodIcon(app.method)}</div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="font-semibold text-sm">{app.product}</div>
                                <Badge className={`text-xs ${getMethodColor(app.method)}`}>
                                  {app.method}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Dosage:</span>{' '}
                                  <span className="font-medium">{app.dosage}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Source:</span>{' '}
                                  <span className="font-medium">{app.recommendationSource}</span>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground leading-relaxed">
                                {app.purpose}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Notes */}
                      {item.notes && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="text-xs font-semibold text-blue-900 mb-1">📝 Notes:</div>
                          <div className="text-xs text-blue-800 leading-relaxed">{item.notes}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Disclaimer */}
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-xl">⚠️</div>
                    <div className="flex-1 text-xs text-yellow-900 leading-relaxed">
                      <strong>Important:</strong> This plan is generated based on your lab test results
                      and general recommendations. Always adjust applications based on current weather
                      conditions, actual vine growth, local expert advice, and product availability.
                      Follow all label instructions and safety guidelines.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {plan.length > 0 && (
            <>
              <Button variant="outline" onClick={exportPlanAsText} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export as Text
              </Button>
              <Button
                onClick={handleCreateTasks}
                disabled={creatingTasks}
                className="flex items-center gap-2"
              >
                {creatingTasks ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Tasks...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Tasks from Plan
                  </>
                )}
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
