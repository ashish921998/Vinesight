'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { SupabaseService } from '@/lib/supabase-service'
import { Loader2, Upload, X, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface LabTestModalProps {
  isOpen: boolean
  onClose: () => void
  testType: 'soil' | 'petiole'
  farmId: number
  mode: 'add' | 'edit'
  existingTest?: {
    id: number
    date: string
    date_of_pruning?: string | null
    parameters: Record<string, any>
    notes?: string | null
  }
}

export function LabTestModal({
  isOpen,
  onClose,
  testType,
  farmId,
  mode,
  existingTest
}: LabTestModalProps) {
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState('')
  const [dateOfPruning, setDateOfPruning] = useState('')
  const [notes, setNotes] = useState('')
  const [reportFile, setReportFile] = useState<File | null>(null)
  const [parameters, setParameters] = useState<Record<string, string>>({})

  // Initialize form when modal opens or existingTest changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && existingTest) {
        setDate(existingTest.date)
        setDateOfPruning(existingTest.date_of_pruning || '')
        setNotes(existingTest.notes || '')

        // Convert parameters to strings for form inputs
        const params: Record<string, string> = {}
        Object.entries(existingTest.parameters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            params[key] = String(value)
          }
        })
        setParameters(params)
      } else {
        // Reset for add mode
        setDate(new Date().toISOString().split('T')[0])
        setDateOfPruning('')
        setNotes('')
        setParameters({})
        setReportFile(null)
      }
    }
  }, [isOpen, mode, existingTest])

  // Field definitions for soil tests
  const soilFields = [
    { key: 'ph', label: 'pH', type: 'number', step: '0.1' },
    { key: 'ec', label: 'EC (dS/m)', type: 'number', step: '0.1' },
    { key: 'organic_carbon', label: 'Organic Carbon (%)', type: 'number', step: '0.1' },
    { key: 'nitrogen', label: 'Nitrogen (ppm)', type: 'number', step: '1' },
    { key: 'phosphorus', label: 'Phosphorus (ppm)', type: 'number', step: '1' },
    { key: 'potassium', label: 'Potassium (ppm)', type: 'number', step: '1' },
    { key: 'calcium', label: 'Calcium (ppm)', type: 'number', step: '1' },
    { key: 'magnesium', label: 'Magnesium (ppm)', type: 'number', step: '1' },
    { key: 'sulfur', label: 'Sulfur (ppm)', type: 'number', step: '1' },
    { key: 'iron', label: 'Iron (ppm)', type: 'number', step: '0.1' },
    { key: 'manganese', label: 'Manganese (ppm)', type: 'number', step: '0.1' },
    { key: 'zinc', label: 'Zinc (ppm)', type: 'number', step: '0.1' },
    { key: 'copper', label: 'Copper (ppm)', type: 'number', step: '0.1' },
    { key: 'boron', label: 'Boron (ppm)', type: 'number', step: '0.1' }
  ]

  // Field definitions for petiole tests
  const petioleFields = [
    { key: 'total_nitrogen', label: 'Total Nitrogen (%)', type: 'number', step: '0.01' },
    { key: 'phosphorus', label: 'Phosphorus (%)', type: 'number', step: '0.01' },
    { key: 'potassium', label: 'Potassium (%)', type: 'number', step: '0.01' },
    { key: 'calcium', label: 'Calcium (%)', type: 'number', step: '0.01' },
    { key: 'magnesium', label: 'Magnesium (%)', type: 'number', step: '0.01' },
    { key: 'sulfur', label: 'Sulfur (%)', type: 'number', step: '0.01' },
    { key: 'iron', label: 'Iron (ppm)', type: 'number', step: '1' },
    { key: 'manganese', label: 'Manganese (ppm)', type: 'number', step: '1' },
    { key: 'zinc', label: 'Zinc (ppm)', type: 'number', step: '1' },
    { key: 'copper', label: 'Copper (ppm)', type: 'number', step: '1' },
    { key: 'boron', label: 'Boron (ppm)', type: 'number', step: '1' }
  ]

  const fields = testType === 'soil' ? soilFields : petioleFields

  const handleParameterChange = (key: string, value: string) => {
    setParameters((prev) => ({
      ...prev,
      [key]: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a PDF or image file (JPG, PNG)')
        return
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      setReportFile(file)
    }
  }

  const handleSubmit = async () => {
    // Validation
    if (!date) {
      toast.error('Please select a test date')
      return
    }

    // Convert string parameters to numbers
    const numericParams: Record<string, number | null> = {}
    Object.entries(parameters).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        const num = parseFloat(value)
        if (!isNaN(num)) {
          numericParams[key] = num
        }
      } else {
        numericParams[key] = null
      }
    })

    // Check if at least one parameter is filled
    const hasData = Object.values(numericParams).some((v) => v !== null)
    if (!hasData && !reportFile && mode === 'add') {
      toast.error('Please fill in at least one test parameter or upload a report')
      return
    }

    setLoading(true)
    try {
      if (mode === 'edit' && existingTest) {
        // Update existing test
        const updateData: any = {
          date,
          parameters: numericParams,
          notes: notes.trim() || null
        }

        if (dateOfPruning.trim()) {
          updateData.date_of_pruning = dateOfPruning
        }

        if (testType === 'soil') {
          await SupabaseService.updateSoilTestRecord(existingTest.id, updateData)
          toast.success('Soil test updated successfully')
        } else {
          await SupabaseService.updatePetioleTestRecord(existingTest.id, updateData)
          toast.success('Petiole test updated successfully')
        }
      } else {
        // Create new test
        const testData: any = {
          farm_id: farmId,
          date,
          parameters: numericParams,
          notes: notes.trim() || null
        }

        if (dateOfPruning.trim()) {
          testData.date_of_pruning = dateOfPruning
        }

        if (reportFile) {
          testData.report = reportFile
        }

        if (testType === 'soil') {
          await SupabaseService.createSoilTestRecord(testData)
          toast.success('Soil test added successfully')
        } else {
          await SupabaseService.createPetioleTestRecord(testData)
          toast.success('Petiole test added successfully')
        }
      }

      onClose()
    } catch (error) {
      console.error('Error saving lab test:', error)
      toast.error('Failed to save test. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit' : 'Add'} {testType === 'soil' ? 'Soil' : 'Petiole'} Test
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-date">
                Test Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="test-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pruning-date">Date of Pruning (Optional)</Label>
              <Input
                id="pruning-date"
                type="date"
                value={dateOfPruning}
                onChange={(e) => setDateOfPruning(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Report Upload (only for add mode) */}
          {mode === 'add' && (
            <Card className="border-dashed border-2">
              <CardContent className="p-4">
                <Label htmlFor="report-upload" className="text-sm font-semibold mb-2 block">
                  Upload Lab Report (Optional)
                </Label>
                <div className="space-y-2">
                  {reportFile ? (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium text-blue-900">{reportFile.name}</div>
                          <div className="text-xs text-blue-600">
                            {(reportFile.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReportFile(null)}
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-6 hover:bg-muted/50 transition-colors">
                      <label
                        htmlFor="report-upload"
                        className="flex flex-col items-center gap-2 cursor-pointer"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Click to upload PDF or image
                        </span>
                        <span className="text-xs text-muted-foreground">Max 10MB</span>
                      </label>
                      <input
                        id="report-upload"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={loading}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Parameters */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Test Parameters</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key} className="text-sm">
                    {field.label}
                  </Label>
                  <Input
                    id={field.key}
                    type={field.type}
                    step={field.step}
                    value={parameters[field.key] || ''}
                    onChange={(e) => handleParameterChange(field.key, e.target.value)}
                    disabled={loading}
                    placeholder="Enter value"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              placeholder="Add any additional observations or notes..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>{mode === 'edit' ? 'Update' : 'Save'} Test</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
