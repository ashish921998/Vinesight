'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SupabaseService } from '@/lib/supabase-service'
import { Loader2, Upload, X, FileText, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'
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
  const [parsing, setParsing] = useState(false)
  const [date, setDate] = useState('')
  const [dateOfPruning, setDateOfPruning] = useState('')
  const [notes, setNotes] = useState('')
  const [reportFile, setReportFile] = useState<File | null>(null)
  const [reportPath, setReportPath] = useState<string | null>(null)
  const [parameters, setParameters] = useState<Record<string, string>>({})
  const [parseConfidence, setParseConfidence] = useState<number | null>(null)
  const [parseStatus, setParseStatus] = useState<'idle' | 'success' | 'failed'>('idle')
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set())
  const [fieldWarnings, setFieldWarnings] = useState<Record<string, string>>({})

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
        setReportPath(null)
        setParseConfidence(null)
        setParseStatus('idle')
        setAutoFilledFields(new Set())
        setFieldWarnings({})
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
    // Major Nutrients
    { key: 'total_nitrogen', label: 'Total Nitrogen (%)', type: 'number', step: '0.01' },
    { key: 'nitrate_nitrogen', label: 'Nitrate Nitrogen (ppm)', type: 'number', step: '1' },
    { key: 'ammonical_nitrogen', label: 'Ammonical Nitrogen (ppm)', type: 'number', step: '1' },
    { key: 'phosphorus', label: 'Phosphorus (%)', type: 'number', step: '0.01' },
    { key: 'potassium', label: 'Potassium (%)', type: 'number', step: '0.01' },
    // Secondary Nutrients
    { key: 'calcium', label: 'Calcium (%)', type: 'number', step: '0.01' },
    { key: 'magnesium', label: 'Magnesium (%)', type: 'number', step: '0.01' },
    { key: 'sulfur', label: 'Sulfur (%)', type: 'number', step: '0.01' },
    // Micro Nutrients
    { key: 'iron', label: 'Iron (ppm)', type: 'number', step: '1' },
    { key: 'manganese', label: 'Manganese (ppm)', type: 'number', step: '1' },
    { key: 'zinc', label: 'Zinc (ppm)', type: 'number', step: '1' },
    { key: 'copper', label: 'Copper (ppm)', type: 'number', step: '1' },
    { key: 'boron', label: 'Boron (ppm)', type: 'number', step: '1' },
    { key: 'molybdenum', label: 'Molybdenum (ppm)', type: 'number', step: '0.01' },
    // Other Elements
    { key: 'sodium', label: 'Sodium (%)', type: 'number', step: '0.01' },
    { key: 'chloride', label: 'Chloride (%)', type: 'number', step: '0.01' }
  ]

  const fields = testType === 'soil' ? soilFields : petioleFields

  // Validation ranges for parameters
  const soilRanges: Record<string, { min: number; max: number }> = {
    ph: { min: 4.0, max: 10.0 },
    ec: { min: 0.1, max: 5.0 },
    organic_carbon: { min: 0.1, max: 10.0 },
    nitrogen: { min: 1, max: 500 },
    phosphorus: { min: 1, max: 100 },
    potassium: { min: 10, max: 500 },
    calcium: { min: 100, max: 20000 },
    magnesium: { min: 50, max: 5000 },
    sulfur: { min: 1, max: 100 },
    iron: { min: 0.5, max: 50 },
    manganese: { min: 0.5, max: 50 },
    zinc: { min: 0.1, max: 10 },
    copper: { min: 0.1, max: 20 },
    boron: { min: 0.1, max: 5 }
  }

  const petioleRanges: Record<string, { min: number; max: number }> = {
    // Major Nutrients
    total_nitrogen: { min: 0.5, max: 5.0 },
    nitrate_nitrogen: { min: 100, max: 5000 },
    ammonical_nitrogen: { min: 100, max: 5000 },
    phosphorus: { min: 0.1, max: 1.0 },
    potassium: { min: 0.5, max: 5.0 },
    // Secondary Nutrients
    calcium: { min: 0.5, max: 5.0 },
    magnesium: { min: 0.1, max: 2.0 },
    sulfur: { min: 0.05, max: 1.0 },
    // Micro Nutrients
    iron: { min: 20, max: 300 },
    manganese: { min: 10, max: 200 },
    zinc: { min: 10, max: 200 },
    copper: { min: 2, max: 50 },
    boron: { min: 10, max: 100 },
    molybdenum: { min: 0.05, max: 2.0 },
    // Other Elements
    sodium: { min: 0.05, max: 2.0 },
    chloride: { min: 0.05, max: 2.0 }
  }

  const ranges = testType === 'soil' ? soilRanges : petioleRanges

  const validateParameterValue = (key: string, value: string): string | null => {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return null

    const range = ranges[key]
    if (!range) return null

    if (numValue < range.min || numValue > range.max) {
      return `Unusual value (expected ${range.min}-${range.max})`
    }
    return null
  }

  const handleParameterChange = (key: string, value: string) => {
    setParameters((prev) => ({
      ...prev,
      [key]: value
    }))

    // Remove from auto-filled fields when manually edited
    if (autoFilledFields.has(key)) {
      setAutoFilledFields((prev) => {
        const newSet = new Set(prev)
        newSet.delete(key)
        return newSet
      })
    }

    // Validate value
    const warning = validateParameterValue(key, value)
    setFieldWarnings((prev) => {
      const newWarnings = { ...prev }
      if (warning) {
        newWarnings[key] = warning
      } else {
        delete newWarnings[key]
      }
      return newWarnings
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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
    setParsing(true)
    setParseStatus('idle')

    try {
      // Call parse API
      const formData = new FormData()
      formData.append('file', file)
      formData.append('testType', testType)
      formData.append('farmId', String(farmId))

      const response = await fetch('/api/test-reports/parse', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to parse report')
      }

      const result = await response.json()

      // Store report path for saving later
      if (result.report?.storagePath) {
        setReportPath(result.report.storagePath)
      }

      // Check if extraction was successful
      if (result.extraction?.status === 'success' && result.extraction.parameters) {
        // Key mapping to normalize API response keys to our field keys
        // Note: Soil tests use 'nitrogen', petiole tests use 'total_nitrogen'
        const keyMapping: Record<string, string> = {
          // Organic carbon variations (soil only)
          organiccarbon: 'organic_carbon',
          organicCarbon: 'organic_carbon',
          organic_carbon_percent: 'organic_carbon',
          'organic carbon': 'organic_carbon',
          // Nitrogen variations - keep as total_nitrogen for petiole, nitrogen for soil
          totalnitrogen: 'total_nitrogen',
          total_nitrogen: 'total_nitrogen',
          'total nitrogen': 'total_nitrogen',
          nitrogen_n: testType === 'soil' ? 'nitrogen' : 'total_nitrogen',
          // Phosphorus variations
          phosphorus_p: 'phosphorus',
          phosphorusp: 'phosphorus',
          // Potassium variations
          potassium_k: 'potassium',
          potassiumk: 'potassium',
          // Calcium variations
          calcium_ca: 'calcium',
          calciumca: 'calcium',
          // Magnesium variations
          magnesium_mg: 'magnesium',
          magnesiummg: 'magnesium',
          // Sulfur variations (both spellings)
          sulphur_s: 'sulfur',
          sulphurs: 'sulfur',
          sulfur_s: 'sulfur',
          sulfurs: 'sulfur',
          // Iron variations (ferrous)
          ferrous_fe: 'iron',
          ferrousfe: 'iron',
          iron_fe: 'iron',
          ironfe: 'iron',
          // Manganese variations
          manganese_mn: 'manganese',
          manganesemn: 'manganese',
          // Zinc variations
          zinc_zn: 'zinc',
          zinczn: 'zinc',
          // Copper variations
          copper_cu: 'copper',
          coppercu: 'copper',
          // Boron variations
          boron_b: 'boron',
          boronb: 'boron'
        }

        // Auto-fill form fields with extracted parameters
        const extractedParams: Record<string, string> = {}
        Object.entries(result.extraction.parameters).forEach(([key, value]) => {
          if (typeof value === 'number' && !isNaN(value)) {
            // Normalize the key using mapping, or use as-is if no mapping exists
            const normalizedKey = keyMapping[key.toLowerCase()] || key.toLowerCase()
            extractedParams[normalizedKey] = String(value)
          }
        })

        // Track which fields were auto-filled
        setAutoFilledFields(new Set(Object.keys(extractedParams)))

        // Validate extracted parameters and set warnings
        const warnings: Record<string, string> = {}
        Object.entries(extractedParams).forEach(([key, value]) => {
          const warning = validateParameterValue(key, value)
          if (warning) {
            warnings[key] = warning
          }
        })
        setFieldWarnings(warnings)

        setParameters(extractedParams)
        setParseConfidence(result.extraction.confidence || null)
        setParseStatus('success')

        // Auto-fill test date if available from extraction
        if (result.extraction.testDate) {
          setDate(result.extraction.testDate)
        }

        // Auto-fill notes if available
        if (result.extraction.summary) {
          setNotes(result.extraction.summary)
        }

        const warningCount = Object.keys(warnings).length
        if (warningCount > 0) {
          toast.success(
            `Report parsed! ${Object.keys(extractedParams).length} parameters extracted (${warningCount} unusual values detected).`,
            { duration: 5000 }
          )
        } else {
          toast.success(
            `Report parsed successfully! ${Object.keys(extractedParams).length} parameters extracted.`
          )
        }
      } else {
        setParseStatus('failed')
        toast.warning('Report uploaded but extraction failed. Please fill in the values manually.')
      }
    } catch (error) {
      console.error('Error parsing report:', error)
      setParseStatus('failed')
      toast.error('Failed to parse report. Please fill in the values manually.')
    } finally {
      setParsing(false)
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

        // If report was already uploaded via parse API, use the path
        // Otherwise pass the file for direct upload
        if (reportPath) {
          testData.report_path = reportPath
        } else if (reportFile) {
          testData.report = reportFile
        }

        if (testType === 'soil') {
          await SupabaseService.addSoilTestRecord(testData)
          toast.success('Soil test added successfully')
        } else {
          await SupabaseService.addPetioleTestRecord(testData)
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
      <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg pr-6">
            {mode === 'edit' ? 'Edit' : 'Add'} {testType === 'soil' ? 'Soil' : 'Petiole'} Test
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-6 py-2 sm:py-4">
          {/* Date Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="test-date" className="text-xs sm:text-sm">
                Test Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="test-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={loading}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="pruning-date" className="text-xs sm:text-sm">
                Date of Pruning (Optional)
              </Label>
              <Input
                id="pruning-date"
                type="date"
                value={dateOfPruning}
                onChange={(e) => setDateOfPruning(e.target.value)}
                disabled={loading}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Report Upload (only for add mode) */}
          {mode === 'add' && (
            <Card className="border-dashed border-2 rounded-2xl">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="report-upload" className="text-sm font-semibold">
                    Upload Lab Report (Optional)
                  </Label>
                  {parseStatus === 'success' && parseConfidence && (
                    <Badge variant="secondary" className="gap-1 rounded-2xl">
                      <Sparkles className="h-3 w-3" />
                      {Math.round(parseConfidence * 100)}% confidence
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  {reportFile ? (
                    <div className="space-y-2">
                      <div
                        className={`flex items-center justify-between p-3 rounded-2xl border ${
                          parseStatus === 'success'
                            ? 'bg-green-50 border-green-200'
                            : parseStatus === 'failed'
                              ? 'bg-amber-50 border-amber-200'
                              : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <FileText
                            className={`h-5 w-5 ${
                              parseStatus === 'success'
                                ? 'text-green-600'
                                : parseStatus === 'failed'
                                  ? 'text-amber-600'
                                  : 'text-blue-600'
                            }`}
                          />
                          <div className="flex-1">
                            <div
                              className={`text-sm font-medium ${
                                parseStatus === 'success'
                                  ? 'text-green-900'
                                  : parseStatus === 'failed'
                                    ? 'text-amber-900'
                                    : 'text-blue-900'
                              }`}
                            >
                              {reportFile.name}
                            </div>
                            <div className="flex items-center gap-2">
                              <div
                                className={`text-xs ${
                                  parseStatus === 'success'
                                    ? 'text-green-600'
                                    : parseStatus === 'failed'
                                      ? 'text-amber-600'
                                      : 'text-blue-600'
                                }`}
                              >
                                {(reportFile.size / 1024).toFixed(1)} KB
                              </div>
                              {parseStatus === 'success' && (
                                <div className="flex items-center gap-1 text-xs text-green-600">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Parsed successfully
                                </div>
                              )}
                              {parseStatus === 'failed' && (
                                <div className="flex items-center gap-1 text-xs text-amber-600">
                                  <AlertCircle className="h-3 w-3" />
                                  Manual entry needed
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setReportFile(null)
                              setReportPath(null)
                              setParseStatus('idle')
                              setParseConfidence(null)
                              setAutoFilledFields(new Set())
                              setFieldWarnings({})
                              setParameters({})
                            }}
                            disabled={loading || parsing}
                            className="rounded-2xl"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {parsing && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground px-3">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analyzing report with AI...
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center border-2 border-dashed rounded-2xl p-6 hover:bg-muted/50 transition-colors">
                      <label
                        htmlFor="report-upload"
                        className="flex flex-col items-center gap-2 cursor-pointer"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Click to upload PDF or image
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Max 10MB • AI will auto-fill values
                        </span>
                      </label>
                      <input
                        id="report-upload"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={loading || parsing}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Parameters */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs sm:text-sm font-semibold">Test Parameters</Label>
              {autoFilledFields.size > 0 && (
                <Badge variant="secondary" className="gap-1 h-5 text-xs rounded-2xl">
                  <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  {autoFilledFields.size} AI
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {fields.map((field) => {
                const isAutoFilled = autoFilledFields.has(field.key)
                const hasWarning = !!fieldWarnings[field.key]
                const hasValue = !!parameters[field.key]

                return (
                  <div key={field.key} className="space-y-1 sm:space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={field.key} className="text-xs sm:text-sm">
                        {field.label}
                      </Label>
                      {isAutoFilled && (
                        <Badge
                          variant="outline"
                          className="h-4 sm:h-5 text-[10px] sm:text-xs gap-0.5 sm:gap-1 border-green-300 bg-green-50 text-green-700 rounded-2xl"
                        >
                          <Sparkles className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                          AI
                        </Badge>
                      )}
                    </div>
                    <Input
                      id={field.key}
                      type={field.type}
                      step={field.step}
                      value={parameters[field.key] || ''}
                      onChange={(e) => handleParameterChange(field.key, e.target.value)}
                      disabled={loading || parsing}
                      placeholder="Enter value"
                      className={`h-9 text-sm ${
                        isAutoFilled && !hasWarning && hasValue
                          ? 'border-green-300 bg-green-50/50 focus-visible:ring-green-500'
                          : hasWarning && hasValue
                            ? 'border-amber-400 bg-amber-50/50 focus-visible:ring-amber-500'
                            : ''
                      }`}
                    />
                    {hasWarning && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {fieldWarnings[field.key]}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="notes" className="text-xs sm:text-sm">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              placeholder="Add any additional observations or notes..."
              rows={3}
              className="text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto rounded-2xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full sm:w-auto rounded-2xl"
            >
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
