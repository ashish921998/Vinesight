'use client'

import { useState, useEffect, type ChangeEvent } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  Droplets,
  SprayCan,
  Scissors,
  Loader2,
  DollarSign,
  Beaker,
  TestTube,
  Upload,
  Paperclip,
  FileWarning,
  RefreshCcw,
  CheckCircle
} from 'lucide-react'
import { SupabaseService } from '@/lib/supabase-service'
import { toast } from 'sonner'
import type { ReportAttachmentMeta } from '@/types/reports'
import type {
  IrrigationRecord,
  SprayRecord,
  HarvestRecord,
  FertigationRecord,
  ExpenseRecord,
  SoilTestRecord,
  PetioleTestRecord
} from '@/lib/supabase'

export type EditRecordType =
  | 'irrigation'
  | 'spray'
  | 'harvest'
  | 'fertigation'
  | 'expense'
  | 'soil_test'

interface BaseFormData {
  recordType: EditRecordType
  date: string
  notes: string
}

export interface IrrigationFormData extends BaseFormData {
  recordType: 'irrigation'
  duration: string
  area: string
  growth_stage: string
  moisture_status: string
  system_discharge: string
}

export interface SprayFormData extends BaseFormData {
  recordType: 'spray'
  chemical: string
  dose: string
  area: string
  weather: string
  operator: string
  pest_disease?: string
}

export interface HarvestFormData extends BaseFormData {
  recordType: 'harvest'
  quantity: string
  grade: string
  price: string
  buyer: string
}

export interface FertigationFormData extends BaseFormData {
  recordType: 'fertigation'
  fertilizer: string
  dose: string
  purpose: string
  area: string
}

type ExpenseCategory = 'labor' | 'materials' | 'equipment' | 'other'

export interface ExpenseFormData extends BaseFormData {
  recordType: 'expense'
  type: ExpenseCategory
  description: string
  cost: string
  remarks: string
}

export interface SoilTestFormData extends BaseFormData {
  recordType: 'soil_test'
  parameters: Record<string, number>
  recommendations: string
}

export type EditRecordFormData =
  | IrrigationFormData
  | SprayFormData
  | HarvestFormData
  | FertigationFormData
  | ExpenseFormData
  | SoilTestFormData

interface EditRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  record:
    | IrrigationRecord
    | SprayRecord
    | HarvestRecord
    | FertigationRecord
    | ExpenseRecord
    | SoilTestRecord
    | PetioleTestRecord
    | null
  recordType: EditRecordType
}

export function EditRecordModal({
  isOpen,
  onClose,
  onSave,
  record,
  recordType
}: EditRecordModalProps) {
  const [formData, setFormData] = useState<EditRecordFormData | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reportMeta, setReportMeta] = useState<ReportAttachmentMeta | null>(null)
  const [isUploadingReport, setIsUploadingReport] = useState(false)
  const [reportUploadError, setReportUploadError] = useState<string | null>(null)
  const [isFetchingReportUrl, setIsFetchingReportUrl] = useState(false)

  type FormByType<T extends EditRecordType> = Extract<EditRecordFormData, { recordType: T }>

  const updateFormData = <T extends EditRecordType>(
    type: T,
    updater: (current: FormByType<T>) => FormByType<T>
  ) => {
    setFormData((prev) => {
      if (!prev || prev.recordType !== type) {
        return prev
      }

      return updater(prev as FormByType<T>)
    })
  }

  useEffect(() => {
    if (!record) {
      setFormData(undefined)
      setReportMeta(null)
      return
    }

    setReportUploadError(null)

    // Initialize form data based on record type
    if (recordType === 'irrigation') {
      const irrigationRecord = record as IrrigationRecord
      setFormData({
        recordType: 'irrigation',
        date: irrigationRecord.date,
        notes: irrigationRecord.notes || '',
        duration: irrigationRecord.duration?.toString() || '',
        area: irrigationRecord.area?.toString() || '',
        growth_stage: irrigationRecord.growth_stage || '',
        moisture_status: irrigationRecord.moisture_status || '',
        system_discharge: irrigationRecord.system_discharge?.toString() || ''
      })
    } else if (recordType === 'spray') {
      const sprayRecord = record as SprayRecord
      const pestDisease =
        'pest_disease' in sprayRecord && typeof (sprayRecord as Record<string, unknown>).pest_disease === 'string'
          ? (sprayRecord as Record<string, unknown>).pest_disease
          : ''
      setFormData({
        recordType: 'spray',
        date: sprayRecord.date,
        notes: sprayRecord.notes || '',
        chemical: sprayRecord.chemical || '',
        dose: sprayRecord.dose || '',
        area: sprayRecord.area?.toString() || '',
        weather: sprayRecord.weather || '',
        operator: sprayRecord.operator || '',
        pest_disease: pestDisease
      })
    } else if (recordType === 'harvest') {
      const harvestRecord = record as HarvestRecord
      setFormData({
        recordType: 'harvest',
        date: harvestRecord.date,
        notes: harvestRecord.notes || '',
        quantity: harvestRecord.quantity?.toString() || '',
        grade: harvestRecord.grade || '',
        price: harvestRecord.price?.toString() || '',
        buyer: harvestRecord.buyer || ''
      })
    } else if (recordType === 'fertigation') {
      const fertigationRecord = record as FertigationRecord
      setFormData({
        recordType: 'fertigation',
        date: fertigationRecord.date,
        notes: fertigationRecord.notes || '',
        fertilizer: fertigationRecord.fertilizer || '',
        dose: fertigationRecord.dose || '',
        purpose: fertigationRecord.purpose || '',
        area: fertigationRecord.area?.toString() || ''
      })
    } else if (recordType === 'expense') {
      const expenseRecord = record as ExpenseRecord
      setFormData({
        recordType: 'expense',
        date: expenseRecord.date,
        notes: '',
        type: (expenseRecord.type as ExpenseCategory) || 'other',
        description: expenseRecord.description || '',
        cost: expenseRecord.cost?.toString() || '',
        remarks: expenseRecord.remarks || ''
      })
    } else if (recordType === 'soil_test') {
      const soilTestRecord = record as SoilTestRecord
      setFormData({
        recordType: 'soil_test',
        date: soilTestRecord.date,
        notes: soilTestRecord.notes || '',
        parameters: soilTestRecord.parameters || {},
        recommendations: soilTestRecord.recommendations || ''
      })

      if (soilTestRecord.report_storage_path) {
        setReportMeta({
          storagePath: soilTestRecord.report_storage_path,
          signedUrl: soilTestRecord.report_url || '',
          filename: soilTestRecord.report_filename || 'test-report',
          mimeType:
            soilTestRecord.report_type === 'image'
              ? 'image/*'
              : soilTestRecord.report_type === 'pdf'
                ? 'application/pdf'
                : soilTestRecord.report_type || 'application/octet-stream',
          reportType: (soilTestRecord.report_type as 'image' | 'pdf') || 'pdf',
          extractionStatus:
            (soilTestRecord.extraction_status as 'pending' | 'success' | 'failed') || 'pending',
          extractionError: soilTestRecord.extraction_error || undefined,
          parsedParameters: soilTestRecord.parsed_parameters || undefined,
          rawNotes: soilTestRecord.raw_notes || null,
          summary: soilTestRecord.raw_notes || undefined,
          confidence: undefined
        })
      } else {
        setReportMeta(null)
      }
    } else {
      setFormData(undefined)
      setReportMeta(null)
    }
  }, [record, recordType])

  const applyParsedParameters = (parameters?: Record<string, number>) => {
    if (!parameters || recordType !== 'soil_test') return

    const isPetioleRecord = record && 'sample_id' in (record as PetioleTestRecord)

    updateFormData('soil_test', (current) => {
      const nextParameters: Record<string, number> = { ...current.parameters }

      if (isPetioleRecord) {
        Object.entries(parameters).forEach(([key, value]) => {
          if (typeof value === 'number' && Number.isFinite(value)) {
            nextParameters[key] = value
          }
        })
      } else {
        const mapSoilKey = (key: string) => {
          const normalized = key.toLowerCase()
          if (normalized === 'ph' || normalized === 'soilph') return 'pH'
          if (normalized === 'nitrogen' || normalized === 'n') return 'nitrogen'
          if (normalized === 'phosphorus' || normalized === 'p') return 'phosphorus'
          if (normalized === 'potassium' || normalized === 'k') return 'potassium'
          return key
        }

        Object.entries(parameters).forEach(([key, value]) => {
          if (typeof value !== 'number' || !Number.isFinite(value)) return
          const mappedKey = mapSoilKey(key)
          nextParameters[mappedKey] = value
        })
      }

      return {
        ...current,
        parameters: nextParameters
      }
    })
  }

  const irrigationForm = formData?.recordType === 'irrigation' ? formData : undefined
  const sprayForm = formData?.recordType === 'spray' ? formData : undefined
  const harvestForm = formData?.recordType === 'harvest' ? formData : undefined
  const fertigationForm = formData?.recordType === 'fertigation' ? formData : undefined
  const expenseForm = formData?.recordType === 'expense' ? formData : undefined
  const soilTestForm = formData?.recordType === 'soil_test' ? formData : undefined

  const handleReportFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || recordType !== 'soil_test') return

    const farmId = (record as SoilTestRecord | PetioleTestRecord | undefined)?.farm_id
    if (!farmId) {
      toast.error('Farm ID missing for this record')
      event.target.value = ''
      return
    }

    setIsUploadingReport(true)
    setReportUploadError(null)

    try {
      const formDataPayload = new FormData()
      formDataPayload.append('file', file)
      formDataPayload.append('testType', record && 'sample_id' in record ? 'petiole' : 'soil')
      formDataPayload.append('farmId', farmId.toString())
      if (reportMeta?.storagePath) {
        formDataPayload.append('existingPath', reportMeta.storagePath)
      }

      const response = await fetch('/api/test-reports/parse', {
        method: 'POST',
        body: formDataPayload
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Failed to process report')
      }

      const payload = await response.json()
      const newMeta: ReportAttachmentMeta = {
        storagePath: payload.report.storagePath,
        signedUrl: payload.report.signedUrl,
        filename: payload.report.filename,
        mimeType: payload.report.mimeType,
        reportType: payload.report.reportType,
        extractionStatus: payload.extraction?.status || 'failed',
        extractionError: payload.extraction?.error,
        parsedParameters: payload.extraction?.parameters || undefined,
        rawNotes: payload.extraction?.rawNotes || null,
        summary: payload.extraction?.summary || undefined,
        confidence: payload.extraction?.confidence || null
      }

      setReportMeta(newMeta)
      applyParsedParameters(newMeta.parsedParameters)

      if (newMeta.extractionStatus === 'success') {
        toast.success('Report uploaded and values updated')
      } else {
        toast.warning('Report uploaded. Please verify nutrient values manually.')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload report'
      setReportUploadError(message)
      toast.error(message)
    } finally {
      setIsUploadingReport(false)
      event.target.value = ''
    }
  }

  const handleViewReport = async () => {
    if (!reportMeta?.storagePath) return

    if (reportMeta.signedUrl) {
      window.open(reportMeta.signedUrl, '_blank', 'noopener')
      return
    }

    setIsFetchingReportUrl(true)
    try {
      const response = await fetch('/api/test-reports/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: reportMeta.storagePath })
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Unable to generate download link')
      }

      const { signedUrl } = await response.json()
      setReportMeta((prev) => (prev ? { ...prev, signedUrl } : prev))
      window.open(signedUrl, '_blank', 'noopener')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to open report'
      toast.error(message)
    } finally {
      setIsFetchingReportUrl(false)
    }
  }

  const handleResetReport = () => {
    setReportMeta(null)
    setReportUploadError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!record) return

    setIsSubmitting(true)
    try {
      if (recordType === 'irrigation') {
        if (!irrigationForm) throw new Error('Irrigation form is not ready')
        await SupabaseService.updateIrrigationRecord(record.id!, {
          date: irrigationForm.date,
          duration: parseFloat(irrigationForm.duration),
          area: parseFloat(irrigationForm.area),
          growth_stage: irrigationForm.growth_stage,
          moisture_status: irrigationForm.moisture_status,
          system_discharge: parseFloat(irrigationForm.system_discharge),
          notes: irrigationForm.notes
        })
      } else if (recordType === 'spray') {
        if (!sprayForm) throw new Error('Spray form is not ready')
        await SupabaseService.updateSprayRecord(record.id!, {
          date: sprayForm.date,
          chemical: sprayForm.chemical,
          dose: sprayForm.dose,
          area: parseFloat(sprayForm.area),
          weather: sprayForm.weather,
          operator: sprayForm.operator,
          notes: sprayForm.notes
        })
      } else if (recordType === 'harvest') {
        if (!harvestForm) throw new Error('Harvest form is not ready')
        await SupabaseService.updateHarvestRecord(record.id!, {
          date: harvestForm.date,
          quantity: parseFloat(harvestForm.quantity),
          grade: harvestForm.grade,
          price: harvestForm.price ? parseFloat(harvestForm.price) : undefined,
          buyer: harvestForm.buyer || undefined,
          notes: harvestForm.notes
        })
      } else if (recordType === 'fertigation') {
        if (!fertigationForm) throw new Error('Fertigation form is not ready')
        await SupabaseService.updateFertigationRecord(record.id!, {
          date: fertigationForm.date,
          fertilizer: fertigationForm.fertilizer,
          dose: fertigationForm.dose,
          purpose: fertigationForm.purpose,
          area: parseFloat(fertigationForm.area),
          notes: fertigationForm.notes
        })
      } else if (recordType === 'expense') {
        if (!expenseForm) throw new Error('Expense form is not ready')
        await SupabaseService.updateExpenseRecord(record.id!, {
          date: expenseForm.date,
          type: expenseForm.type,
          description: expenseForm.description,
          cost: parseFloat(expenseForm.cost),
          remarks: expenseForm.remarks
        })
      } else if (recordType === 'soil_test') {
        if (!soilTestForm) throw new Error('Soil test form is not ready')
        const isPetiole = record && 'sample_id' in (record as PetioleTestRecord)

        const metadata = reportMeta
          ? {
              report_url: reportMeta.signedUrl,
              report_storage_path: reportMeta.storagePath,
              report_filename: reportMeta.filename,
              report_type: reportMeta.reportType,
              extraction_status: reportMeta.extractionStatus,
              extraction_error: reportMeta.extractionError,
              parsed_parameters: reportMeta.parsedParameters,
              raw_notes: reportMeta.rawNotes
            }
          : {
              report_url: null,
              report_storage_path: null,
              report_filename: null,
              report_type: null,
              extraction_status: null,
              extraction_error: null,
              parsed_parameters: null,
              raw_notes: null
            }

        const payload = {
          date: soilTestForm.date,
          parameters: soilTestForm.parameters,
          recommendations: soilTestForm.recommendations,
          notes: soilTestForm.notes,
          ...metadata
        }

        if (isPetiole) {
          await SupabaseService.updatePetioleTestRecord(record.id!, payload)
        } else {
          await SupabaseService.updateSoilTestRecord(record.id!, payload)
        }
      }

      onSave()
      onClose()
    } catch (error) {
      console.error('Error updating record:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getIcon = () => {
    switch (recordType) {
      case 'irrigation':
        return <Droplets className="h-5 w-5" />
      case 'spray':
        return <SprayCan className="h-5 w-5" />
      case 'harvest':
        return <Scissors className="h-5 w-5" />
      case 'fertigation':
        return <Beaker className="h-5 w-5" />
      case 'expense':
        return <DollarSign className="h-5 w-5" />
      case 'soil_test':
        return <TestTube className="h-5 w-5" />
      default:
        return <Droplets className="h-5 w-5" />
    }
  }

  const getTitle = () => {
    switch (recordType) {
      case 'irrigation':
        return 'Edit Irrigation Record'
      case 'spray':
        return 'Edit Spray Record'
      case 'harvest':
        return 'Edit Harvest Record'
      case 'fertigation':
        return 'Edit Fertigation Record'
      case 'expense':
        return 'Edit Expense Record'
      case 'soil_test':
        return 'Edit Soil Test Record'
      default:
        return 'Edit Record'
    }
  }

  const getColor = () => {
    switch (recordType) {
      case 'irrigation':
        return 'text-blue-700 bg-blue-100'
      case 'spray':
        return 'text-green-700 bg-green-100'
      case 'harvest':
        return 'text-purple-700 bg-purple-100'
      case 'fertigation':
        return 'text-emerald-700 bg-emerald-100'
      case 'expense':
        return 'text-orange-700 bg-orange-100'
      case 'soil_test':
        return 'text-teal-700 bg-teal-100'
      default:
        return 'text-blue-700 bg-blue-100'
    }
  }

  if (!record) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-3 ${getColor().split(' ')[0]}`}>
            <div className={`p-2 rounded-xl ${getColor()}`}>{getIcon()}</div>
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Input */}
          <div>
            <Label htmlFor="date" className="text-sm font-medium text-gray-700">
              Date *
            </Label>
            <Input
              id="date"
              type="date"
              value={formData?.date ?? ''}
              onChange={(e) =>
                setFormData((prev) => (prev ? { ...prev, date: e.target.value } : prev))
              }
              max={new Date().toISOString().split('T')[0]}
              className="mt-1"
              required
            />
          </div>

          {/* Record type specific fields */}
          {recordType === 'irrigation' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
                    Duration (hours) *
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    step="0.1"
                    min="0"
                    value={irrigationForm?.duration ?? ''}
                    onChange={(e) =>
                      updateFormData('irrigation', (current) => ({
                        ...current,
                        duration: e.target.value
                      }))
                    }
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="area" className="text-sm font-medium text-gray-700">
                    Area (acres)
                  </Label>
                  <Input
                    id="area"
                    type="number"
                    step="0.1"
                    min="0"
                    value={irrigationForm?.area ?? ''}
                    onChange={(e) =>
                      updateFormData('irrigation', (current) => ({
                        ...current,
                        area: e.target.value
                      }))
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="growth_stage" className="text-sm font-medium text-gray-700">
                    Growth Stage
                  </Label>
                  <Input
                    id="growth_stage"
                    value={irrigationForm?.growth_stage ?? ''}
                    onChange={(e) =>
                      updateFormData('irrigation', (current) => ({
                        ...current,
                        growth_stage: e.target.value
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="system_discharge" className="text-sm font-medium text-gray-700">
                    System Discharge
                  </Label>
                  <Input
                    id="system_discharge"
                    type="number"
                    step="0.1"
                    min="0"
                    value={irrigationForm?.system_discharge ?? ''}
                    onChange={(e) =>
                      updateFormData('irrigation', (current) => ({
                        ...current,
                        system_discharge: e.target.value
                      }))
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </>
          )}

          {recordType === 'spray' && (
            <>
              <div>
                <Label htmlFor="chemical" className="text-sm font-medium text-gray-700">
                  Chemical/Product *
                </Label>
                <Input
                  id="chemical"
                  value={sprayForm?.chemical ?? ''}
                  onChange={(e) =>
                    updateFormData('spray', (current) => ({
                      ...current,
                      chemical: e.target.value
                    }))
                  }
                  className="mt-1"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="pest_disease" className="text-sm font-medium text-gray-700">
                    Target Pest/Disease
                  </Label>
                  <Input
                    id="pest_disease"
                    value={sprayForm?.pest_disease ?? ''}
                    onChange={(e) =>
                      updateFormData('spray', (current) => ({
                        ...current,
                        pest_disease: e.target.value
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="dose" className="text-sm font-medium text-gray-700">
                    Dose
                  </Label>
                  <Input
                    id="dose"
                    value={sprayForm?.dose ?? ''}
                    onChange={(e) =>
                      updateFormData('spray', (current) => ({
                        ...current,
                        dose: e.target.value
                      }))
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </>
          )}

          {recordType === 'harvest' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                    Quantity (kg) *
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.1"
                    min="0"
                    value={harvestForm?.quantity ?? ''}
                    onChange={(e) =>
                      updateFormData('harvest', (current) => ({
                        ...current,
                        quantity: e.target.value
                      }))
                    }
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="grade" className="text-sm font-medium text-gray-700">
                    Grade *
                  </Label>
                  <Select
                    value={harvestForm?.grade ?? ''}
                    onValueChange={(value) =>
                      updateFormData('harvest', (current) => ({
                        ...current,
                        grade: value
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Premium">Premium</SelectItem>
                      <SelectItem value="Grade A">Grade A</SelectItem>
                      <SelectItem value="Grade B">Grade B</SelectItem>
                      <SelectItem value="Grade C">Grade C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="price" className="text-sm font-medium text-gray-700">
                    Price per kg (₹)
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={harvestForm?.price ?? ''}
                    onChange={(e) =>
                      updateFormData('harvest', (current) => ({
                        ...current,
                        price: e.target.value
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="buyer" className="text-sm font-medium text-gray-700">
                    Buyer
                  </Label>
                  <Input
                    id="buyer"
                    value={harvestForm?.buyer ?? ''}
                    onChange={(e) =>
                      updateFormData('harvest', (current) => ({
                        ...current,
                        buyer: e.target.value
                      }))
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </>
          )}

          {recordType === 'fertigation' && (
            <>
              <div>
                <Label htmlFor="fertilizer" className="text-sm font-medium text-gray-700">
                  Fertilizer *
                </Label>
                <Input
                  id="fertilizer"
                  value={fertigationForm?.fertilizer ?? ''}
                  onChange={(e) =>
                    updateFormData('fertigation', (current) => ({
                      ...current,
                      fertilizer: e.target.value
                    }))
                  }
                  className="mt-1"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="dose" className="text-sm font-medium text-gray-700">
                    Dose *
                  </Label>
                  <Input
                    id="dose"
                    value={fertigationForm?.dose ?? ''}
                    onChange={(e) =>
                      updateFormData('fertigation', (current) => ({
                        ...current,
                        dose: e.target.value
                      }))
                    }
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="area" className="text-sm font-medium text-gray-700">
                    Area (acres)
                  </Label>
                  <Input
                    id="area"
                    type="number"
                    step="0.1"
                    min="0"
                    value={fertigationForm?.area ?? ''}
                    onChange={(e) =>
                      updateFormData('fertigation', (current) => ({
                        ...current,
                        area: e.target.value
                      }))
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="purpose" className="text-sm font-medium text-gray-700">
                  Purpose
                </Label>
                <Input
                  id="purpose"
                  value={fertigationForm?.purpose ?? ''}
                  onChange={(e) =>
                    updateFormData('fertigation', (current) => ({
                      ...current,
                      purpose: e.target.value
                    }))
                  }
                  className="mt-1"
                />
              </div>
            </>
          )}

          {recordType === 'expense' && (
            <>
              <div>
                <Label htmlFor="type" className="text-sm font-medium text-gray-700">
                  Category *
                </Label>
                <Select
                  value={expenseForm?.type ?? 'other'}
                  onValueChange={(value) =>
                    updateFormData('expense', (current) => ({
                      ...current,
                      type: value as ExpenseCategory
                    }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="labor">Labor</SelectItem>
                    <SelectItem value="materials">Materials</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Description *
                </Label>
                <Input
                  id="description"
                  value={expenseForm?.description ?? ''}
                  onChange={(e) =>
                    updateFormData('expense', (current) => ({
                      ...current,
                      description: e.target.value
                    }))
                  }
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="cost" className="text-sm font-medium text-gray-700">
                  Cost (₹) *
                </Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={expenseForm?.cost ?? ''}
                  onChange={(e) =>
                    updateFormData('expense', (current) => ({
                      ...current,
                      cost: e.target.value
                    }))
                  }
                  className="mt-1"
                  required
                />
              </div>
            </>
          )}

          {recordType === 'soil_test' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="ph" className="text-sm font-medium text-gray-700">
                    pH Level
                  </Label>
                  <Input
                    id="ph"
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    value={soilTestForm?.parameters?.pH ?? ''}
                    onChange={(e) => {
                      const parsed = parseFloat(e.target.value)
                      updateFormData('soil_test', (current) => ({
                        ...current,
                        parameters: {
                          ...current.parameters,
                          pH: Number.isNaN(parsed) ? 0 : parsed
                        }
                      }))
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="nitrogen" className="text-sm font-medium text-gray-700">
                    Nitrogen (ppm)
                  </Label>
                  <Input
                    id="nitrogen"
                    type="number"
                    step="0.1"
                    min="0"
                    value={soilTestForm?.parameters?.nitrogen ?? ''}
                    onChange={(e) => {
                      const parsed = parseFloat(e.target.value)
                      updateFormData('soil_test', (current) => ({
                        ...current,
                        parameters: {
                          ...current.parameters,
                          nitrogen: Number.isNaN(parsed) ? 0 : parsed
                        }
                      }))
                    }}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="phosphorus" className="text-sm font-medium text-gray-700">
                    Phosphorus (ppm)
                  </Label>
                  <Input
                    id="phosphorus"
                    type="number"
                    step="0.1"
                    min="0"
                    value={soilTestForm?.parameters?.phosphorus ?? ''}
                    onChange={(e) => {
                      const parsed = parseFloat(e.target.value)
                      updateFormData('soil_test', (current) => ({
                        ...current,
                        parameters: {
                          ...current.parameters,
                          phosphorus: Number.isNaN(parsed) ? 0 : parsed
                        }
                      }))
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="potassium" className="text-sm font-medium text-gray-700">
                    Potassium (ppm)
                  </Label>
                  <Input
                    id="potassium"
                    type="number"
                    step="0.1"
                    min="0"
                    value={soilTestForm?.parameters?.potassium ?? ''}
                    onChange={(e) => {
                      const parsed = parseFloat(e.target.value)
                      updateFormData('soil_test', (current) => ({
                        ...current,
                        parameters: {
                          ...current.parameters,
                          potassium: Number.isNaN(parsed) ? 0 : parsed
                        }
                      }))
                    }}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Lab Report Attachment
                    </Label>
                    <p className="text-xs text-gray-500">
                      Upload a PDF or image report to refresh nutrient values.
                    </p>
                  </div>
                  {reportMeta?.extractionStatus === 'success' && (
                    <Badge
                      variant="outline"
                      className="border-emerald-200 bg-emerald-50 text-emerald-700"
                    >
                      Auto parsed
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={handleReportFileChange}
                    disabled={isUploadingReport}
                    className="h-9"
                  />
                  {isUploadingReport ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  ) : (
                    <Upload className="h-4 w-4 text-gray-400" />
                  )}
                  {reportMeta && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetReport}
                      className="h-8 text-xs"
                    >
                      <RefreshCcw className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>

                {reportMeta && (
                  <div className="space-y-1 rounded-md bg-white p-2 text-xs text-gray-700">
                    <div className="flex flex-wrap items-center gap-2">
                      <Paperclip className="h-3 w-3" />
                      <span className="font-medium truncate max-w-[180px]">
                        {reportMeta.filename}
                      </span>
                      <Badge variant="outline" className="capitalize">
                        {reportMeta.reportType}
                      </Badge>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={handleViewReport}
                        disabled={isFetchingReportUrl}
                        className="h-auto p-0 text-xs"
                      >
                        {isFetchingReportUrl ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : null}
                        View report
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {reportMeta.extractionStatus === 'success' ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-emerald-500" />
                          <span className="text-emerald-700">Parsed successfully</span>
                          {typeof reportMeta.confidence === 'number' && (
                            <span className="text-gray-500">
                              Confidence {(reportMeta.confidence * 100).toFixed(0)}%
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <FileWarning className="h-3 w-3 text-amber-500" />
                          <span className="text-amber-600">
                            {reportMeta.extractionError ||
                              'Automatic parsing failed. Please verify values.'}
                          </span>
                        </>
                      )}
                    </div>
                    {reportMeta.summary && (
                      <p className="text-gray-600">Summary: {reportMeta.summary}</p>
                    )}
                    {reportMeta.rawNotes && (
                      <p className="text-gray-500">Notes: {reportMeta.rawNotes}</p>
                    )}
                  </div>
                )}

                {reportUploadError && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <FileWarning className="h-3 w-3" />
                    {reportUploadError}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="recommendations" className="text-sm font-medium text-gray-700">
                  Recommendations
                </Label>
                <Textarea
                  id="recommendations"
                  value={soilTestForm?.recommendations ?? ''}
                  onChange={(e) =>
                    updateFormData('soil_test', (current) => ({
                      ...current,
                      recommendations: e.target.value
                    }))
                  }
                  className="mt-1 resize-none"
                  rows={3}
                />
              </div>
            </>
          )}

          {/* Notes/Remarks */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
              {recordType === 'expense' ? 'Remarks' : 'Notes'}
            </Label>
            <Textarea
              id="notes"
              value={
                recordType === 'expense' ? (expenseForm?.remarks ?? '') : (formData?.notes ?? '')
              }
              onChange={(e) => {
                const value = e.target.value
                if (recordType === 'expense') {
                  updateFormData('expense', (current) => ({ ...current, remarks: value }))
                } else {
                  setFormData((prev) => (prev ? { ...prev, notes: value } : prev))
                }
              }}
              placeholder="Any additional notes..."
              className="mt-1 resize-none"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
