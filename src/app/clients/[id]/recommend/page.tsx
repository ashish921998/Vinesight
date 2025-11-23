'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Send,
  Clipboard,
  Sprout,
  FileText,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { ConsultantService } from '@/lib/consultant-service'
import type {
  ConsultantClient,
  ClientFarm,
  ClientLabReport,
  FertilizerRecommendationInsert,
  FertilizerRecommendationItemInsert
} from '@/types/consultant'
import {
  FERTILIZER_UNITS,
  APPLICATION_METHODS,
  GROWTH_STAGES,
  RECOMMENDATION_STATUS_OPTIONS
} from '@/types/consultant'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

interface FertilizerItemForm {
  tempId: string
  fertilizerName: string
  quantity: string
  unit: string
  brand: string
  applicationMethod: string
  frequency: string
  timing: string
  estimatedCost: string
  notes: string
}

const createEmptyItem = (): FertilizerItemForm => ({
  tempId: crypto.randomUUID(),
  fertilizerName: '',
  quantity: '',
  unit: 'kg',
  brand: '',
  applicationMethod: '',
  frequency: '',
  timing: '',
  estimatedCost: '',
  notes: ''
})

export default function CreateRecommendationPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = parseInt(params.id as string)

  // Client data
  const [client, setClient] = useState<ConsultantClient | null>(null)
  const [farms, setFarms] = useState<ClientFarm[]>([])
  const [labReports, setLabReports] = useState<ClientLabReport[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFarmId, setSelectedFarmId] = useState<string>('')
  const [growthStage, setGrowthStage] = useState<string>('')
  const [daysAfterPruningStart, setDaysAfterPruningStart] = useState('')
  const [daysAfterPruningEnd, setDaysAfterPruningEnd] = useState('')
  const [basedOnSoilReportId, setBasedOnSoilReportId] = useState<string>('')
  const [basedOnPetioleReportId, setBasedOnPetioleReportId] = useState<string>('')
  const [notes, setNotes] = useState('')

  // Fertilizer items
  const [items, setItems] = useState<FertilizerItemForm[]>([createEmptyItem()])

  // Confirmation dialog
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [pendingRecommendationId, setPendingRecommendationId] = useState<number | null>(null)

  const loadClientData = useCallback(async () => {
    try {
      setLoading(true)
      const [clientData, farmsData, reportsData] = await Promise.all([
        ConsultantService.getClientById(clientId),
        ConsultantService.getClientFarms(clientId),
        ConsultantService.getClientLabReports(clientId)
      ])

      if (!clientData) {
        toast.error('Client not found')
        router.push('/clients')
        return
      }

      setClient(clientData)
      setFarms(farmsData)
      setLabReports(reportsData)
    } catch (error) {
      logger.error('Error loading client data:', error)
      toast.error('Failed to load client data')
    } finally {
      setLoading(false)
    }
  }, [clientId, router])

  useEffect(() => {
    loadClientData()
  }, [loadClientData])

  const addItem = () => {
    setItems([...items, createEmptyItem()])
  }

  const removeItem = (tempId: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.tempId !== tempId))
    }
  }

  const updateItem = (tempId: string, field: keyof FertilizerItemForm, value: string) => {
    setItems(items.map((item) => (item.tempId === tempId ? { ...item, [field]: value } : item)))
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= items.length) return

    const newItems = [...items]
    const temp = newItems[index]
    newItems[index] = newItems[newIndex]
    newItems[newIndex] = temp
    setItems(newItems)
  }

  const validateForm = (): boolean => {
    if (!title.trim()) {
      toast.error('Please enter a title for the recommendation')
      return false
    }

    const validItems = items.filter(
      (item) => item.fertilizerName.trim() && item.quantity && parseFloat(item.quantity) > 0
    )

    if (validItems.length === 0) {
      toast.error('Please add at least one fertilizer item with name and quantity')
      return false
    }

    return true
  }

  const handleSave = async (sendImmediately: boolean = false) => {
    if (!validateForm()) return

    try {
      setIsSubmitting(true)

      // Create recommendation
      const recommendationData: FertilizerRecommendationInsert = {
        clientId,
        clientFarmId: selectedFarmId ? parseInt(selectedFarmId) : undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        growthStage: growthStage || undefined,
        daysAfterPruningStart: daysAfterPruningStart ? parseInt(daysAfterPruningStart) : undefined,
        daysAfterPruningEnd: daysAfterPruningEnd ? parseInt(daysAfterPruningEnd) : undefined,
        basedOnSoilReportId: basedOnSoilReportId ? parseInt(basedOnSoilReportId) : undefined,
        basedOnPetioleReportId: basedOnPetioleReportId ? parseInt(basedOnPetioleReportId) : undefined,
        notes: notes.trim() || undefined,
        status: 'draft'
      }

      const recommendation = await ConsultantService.createRecommendation(recommendationData)

      // Create fertilizer items
      const validItems = items.filter(
        (item) => item.fertilizerName.trim() && item.quantity && parseFloat(item.quantity) > 0
      )

      const itemsToCreate: Omit<FertilizerRecommendationItemInsert, 'recommendationId'>[] =
        validItems.map((item, index) => ({
          fertilizerName: item.fertilizerName.trim(),
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          brand: item.brand.trim() || undefined,
          applicationMethod: item.applicationMethod || undefined,
          frequency: item.frequency.trim() || undefined,
          timing: item.timing.trim() || undefined,
          estimatedCost: item.estimatedCost ? parseFloat(item.estimatedCost) : undefined,
          sortOrder: index,
          notes: item.notes.trim() || undefined
        }))

      await ConsultantService.bulkCreateRecommendationItems(recommendation.id, itemsToCreate)

      if (sendImmediately) {
        setPendingRecommendationId(recommendation.id)
        setShowSendDialog(true)
      } else {
        toast.success('Recommendation saved as draft')
        router.push(`/clients/${clientId}`)
      }
    } catch (error) {
      logger.error('Error saving recommendation:', error)
      toast.error('Failed to save recommendation')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendConfirm = async () => {
    if (!pendingRecommendationId) return

    try {
      setIsSubmitting(true)
      await ConsultantService.sendRecommendation(pendingRecommendationId)
      toast.success('Recommendation sent to client')
      setShowSendDialog(false)
      router.push(`/clients/${clientId}`)
    } catch (error) {
      logger.error('Error sending recommendation:', error)
      toast.error('Failed to send recommendation')
    } finally {
      setIsSubmitting(false)
    }
  }

  const soilReports = labReports.filter((r) => r.reportType === 'soil')
  const petioleReports = labReports.filter((r) => r.reportType === 'petiole')

  const calculateTotalCost = () => {
    return items.reduce((sum, item) => {
      const cost = parseFloat(item.estimatedCost) || 0
      return sum + cost
    }, 0)
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Clipboard className="h-5 w-5 text-primary" />
                  <h1 className="text-xl font-bold text-gray-900">Create Fertilizer Recommendation</h1>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  For {client?.clientName}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recommendation Details</CardTitle>
              <CardDescription>Basic information about this fertilizer plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Pre-Flowering Nutrition Plan"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this recommendation..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="farm">Farm (Optional)</Label>
                  <Select value={selectedFarmId} onValueChange={setSelectedFarmId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select farm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Farms</SelectItem>
                      {farms.map((farm) => (
                        <SelectItem key={farm.id} value={farm.id.toString()}>
                          {farm.farmName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="growthStage">Growth Stage</Label>
                  <Select value={growthStage} onValueChange={setGrowthStage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {GROWTH_STAGES.map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="daysStart">Days After Pruning (From)</Label>
                  <Input
                    id="daysStart"
                    type="number"
                    placeholder="e.g., 30"
                    value={daysAfterPruningStart}
                    onChange={(e) => setDaysAfterPruningStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="daysEnd">Days After Pruning (To)</Label>
                  <Input
                    id="daysEnd"
                    type="number"
                    placeholder="e.g., 45"
                    value={daysAfterPruningEnd}
                    onChange={(e) => setDaysAfterPruningEnd(e.target.value)}
                  />
                </div>
              </div>

              {/* Based on Reports */}
              {(soilReports.length > 0 || petioleReports.length > 0) && (
                <div className="pt-2 border-t">
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    Based on Lab Reports (Optional)
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {soilReports.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="soilReport" className="text-sm text-gray-500">
                          Soil Test Report
                        </Label>
                        <Select value={basedOnSoilReportId} onValueChange={setBasedOnSoilReportId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select report" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {soilReports.map((report) => (
                              <SelectItem key={report.id} value={report.id.toString()}>
                                {new Date(report.testDate).toLocaleDateString()} - {report.labName || 'Lab Report'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {petioleReports.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="petioleReport" className="text-sm text-gray-500">
                          Petiole Test Report
                        </Label>
                        <Select value={basedOnPetioleReportId} onValueChange={setBasedOnPetioleReportId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select report" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {petioleReports.map((report) => (
                              <SelectItem key={report.id} value={report.id.toString()}>
                                {new Date(report.testDate).toLocaleDateString()} - {report.labName || 'Lab Report'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fertilizer Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Fertilizer Items</CardTitle>
                  <CardDescription>Add fertilizers with quantities and application details</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.tempId}
                  className="border rounded-lg p-4 bg-gray-50/50 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="h-6 w-6 flex items-center justify-center p-0">
                        {index + 1}
                      </Badge>
                      <span className="text-sm font-medium text-gray-700">
                        {item.fertilizerName || 'New Fertilizer'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveItem(index, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveItem(index, 'down')}
                        disabled={index === items.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        onClick={() => removeItem(item.tempId)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Item Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-sm">Fertilizer Name *</Label>
                      <Input
                        placeholder="e.g., 19:19:19 NPK"
                        value={item.fertilizerName}
                        onChange={(e) => updateItem(item.tempId, 'fertilizerName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Brand (Optional)</Label>
                      <Input
                        placeholder="e.g., IFFCO"
                        value={item.brand}
                        onChange={(e) => updateItem(item.tempId, 'brand', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Quantity *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g., 5"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.tempId, 'quantity', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Unit</Label>
                      <Select
                        value={item.unit}
                        onValueChange={(value) => updateItem(item.tempId, 'unit', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FERTILIZER_UNITS.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Method</Label>
                      <Select
                        value={item.applicationMethod}
                        onValueChange={(value) => updateItem(item.tempId, 'applicationMethod', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {APPLICATION_METHODS.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Est. Cost (₹)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g., 500"
                        value={item.estimatedCost}
                        onChange={(e) => updateItem(item.tempId, 'estimatedCost', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Frequency</Label>
                      <Input
                        placeholder="e.g., Once / Weekly / Every 10 days"
                        value={item.frequency}
                        onChange={(e) => updateItem(item.tempId, 'frequency', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Timing</Label>
                      <Input
                        placeholder="e.g., Morning / Before irrigation"
                        value={item.timing}
                        onChange={(e) => updateItem(item.tempId, 'timing', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Notes</Label>
                    <Input
                      placeholder="Any specific instructions for this fertilizer..."
                      value={item.notes}
                      onChange={(e) => updateItem(item.tempId, 'notes', e.target.value)}
                    />
                  </div>
                </div>
              ))}

              {/* Summary */}
              {calculateTotalCost() > 0 && (
                <div className="flex justify-end pt-4 border-t">
                  <div className="text-right">
                    <span className="text-sm text-gray-500">Estimated Total Cost:</span>
                    <span className="ml-2 text-lg font-semibold text-gray-900">
                      ₹{calculateTotalCost().toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Any general notes or instructions for the client..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pb-6">
            <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save & Send to Client'}
            </Button>
          </div>
        </main>

        {/* Send Confirmation Dialog */}
        <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Send Recommendation?</DialogTitle>
              <DialogDescription>
                This will mark the recommendation as sent and notify {client?.clientName}.
                They will be able to view this fertilizer plan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSendDialog(false)
                  router.push(`/clients/${clientId}`)
                }}
              >
                Keep as Draft
              </Button>
              <Button
                onClick={handleSendConfirm}
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Sending...' : 'Send Now'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
