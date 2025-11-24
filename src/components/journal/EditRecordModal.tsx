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
  CheckCircle,
  Plus,
  X
} from 'lucide-react'
import { SupabaseService } from '@/lib/supabase-service'
import { toast } from 'sonner'
import type { ReportAttachmentMeta } from '@/types/reports'
import { logTypeConfigs, type LogType, type FormField } from '@/lib/log-type-config'
import type {
  IrrigationRecord,
  SprayRecord,
  HarvestRecord,
  FertigationRecord,
  ExpenseRecord,
  SoilTestRecord,
  PetioleTestRecord
} from '@/lib/supabase'

// Type for spray data update
interface SprayDataUpdate {
  date: string
  notes?: string
  water_volume?: number
  chemicals?: Array<{ name: string; quantity: number; unit: 'gm/L' | 'ml/L' | 'ppm' }>
  chemical?: string
  dose?: string
}

// Type predicate function to distinguish PetioleTestRecord from SoilTestRecord
function isPetioleRecord(record: SoilTestRecord | PetioleTestRecord): record is PetioleTestRecord {
  return 'sample_id' in record
}

// Local field configs for soil and petiole tests (separate from main log types)
const soilTestFields: FormField[] = [
  { name: 'pH', type: 'number', label: 'pH', required: false, min: 0, max: 14, step: 0.1 },
  { name: 'ec', type: 'number', label: 'EC (mS/cm)', required: false, min: 0, step: 0.01 },
  {
    name: 'nitrogen',
    type: 'number',
    label: 'Nitrogen (kg/ha)',
    required: false,
    min: 0,
    step: 0.1
  },
  {
    name: 'phosphorus',
    type: 'number',
    label: 'Phosphorus (kg/ha)',
    required: false,
    min: 0,
    step: 0.1
  },
  {
    name: 'potassium',
    type: 'number',
    label: 'Potassium (kg/ha)',
    required: false,
    min: 0,
    step: 0.1
  },
  {
    name: 'organic_carbon',
    type: 'number',
    label: 'Organic Carbon (%)',
    required: false,
    min: 0,
    max: 100,
    step: 0.01
  }
]

const petioleTestFields: FormField[] = [
  {
    name: 'nitrogen',
    type: 'number',
    label: 'Nitrogen (%)',
    required: false,
    min: 0,
    max: 100,
    step: 0.01
  },
  {
    name: 'phosphorus',
    type: 'number',
    label: 'Phosphorus (%)',
    required: false,
    min: 0,
    max: 100,
    step: 0.01
  },
  {
    name: 'potassium',
    type: 'number',
    label: 'Potassium (%)',
    required: false,
    min: 0,
    max: 100,
    step: 0.01
  },
  {
    name: 'calcium',
    type: 'number',
    label: 'Calcium (%)',
    required: false,
    min: 0,
    max: 100,
    step: 0.01
  },
  {
    name: 'magnesium',
    type: 'number',
    label: 'Magnesium (%)',
    required: false,
    min: 0,
    max: 100,
    step: 0.01
  },
  { name: 'boron', type: 'number', label: 'Boron (ppm)', required: false, min: 0, step: 0.1 },
  { name: 'zinc', type: 'number', label: 'Zinc (ppm)', required: false, min: 0, step: 0.1 },
  { name: 'iron', type: 'number', label: 'Iron (ppm)', required: false, min: 0, step: 0.1 }
]

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
  water_volume: string
  chemicals: Array<{ id: string; name: string; quantity: number; unit: string }>
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
  fertilizers: Array<{ id: string; name: string; quantity: number; unit: string }>
}

type ExpenseCategory = 'labor' | 'materials' | 'equipment' | 'fuel' | 'other'

export interface ExpenseFormData extends BaseFormData {
  recordType: 'expense'
  type: ExpenseCategory
  description: string
  cost: string
  remarks: string
  // Labor-specific fields
  num_workers: string
  hours_worked: string
  work_type: string
  rate_per_unit: string
  worker_names: string
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

  // Helper function to safely convert string to number, returning undefined for empty/invalid strings
  const toNum = (s: string) => {
    const n = parseFloat(s)
    return Number.isFinite(n) ? n : undefined
  }

  // Format number string - removes leading zeros (e.g., "0400" -> "400")
  const formatNumberString = (value: string): string => {
    if (!value) return value
    // Only format if it's a valid number and not just a decimal point or minus sign
    if (/^-?\d*\.?\d*$/.test(value) && value !== '.' && value !== '-' && value !== '-.') {
      const num = parseFloat(value)
      if (!isNaN(num)) {
        return num.toString()
      }
    }
    return value
  }

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
        duration:
          irrigationRecord.duration !== undefined && irrigationRecord.duration !== null
            ? irrigationRecord.duration.toString()
            : '',
        area: irrigationRecord.area?.toString() || '',
        growth_stage: irrigationRecord.growth_stage || '',
        moisture_status: irrigationRecord.moisture_status || '',
        system_discharge: irrigationRecord.system_discharge?.toString() || ''
      })
    } else if (recordType === 'spray') {
      const sprayRecord = record as SprayRecord
      // Helper function to ensure spray chemicals format consistency
      const ensureSprayChemicalsFormat = (sprayRecord: SprayRecord) => {
        const generateChemicalId = () => {
          return `chem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }

        let chemicals: Array<{ id: string; name: string; quantity: number; unit: string }> = []

        if (
          sprayRecord.chemicals &&
          Array.isArray(sprayRecord.chemicals) &&
          sprayRecord.chemicals.length > 0
        ) {
          // Has chemicals array - use it (new format or partially migrated)
          chemicals = sprayRecord.chemicals.map((chem) => ({
            id: chem.id || generateChemicalId(),
            name: chem.name || '',
            quantity: chem.quantity,
            unit: chem.unit || 'gm/L'
          }))
        } else {
          // Old format - convert to new format
          chemicals = [
            {
              id: generateChemicalId(),
              name: sprayRecord.chemical || '',
              quantity: +(sprayRecord.dose?.match(/(\d+)(?!gm\/L)/g)?.pop() ?? '') || 0,
              unit: 'gm/L'
            }
          ]
        }

        // Ensure at least one chemical
        if (chemicals.length === 0) {
          chemicals.push({
            id: generateChemicalId(),
            name: '',
            quantity: 0,
            unit: 'gm/L'
          })
        }

        return chemicals
      }

      const chemicals = ensureSprayChemicalsFormat(sprayRecord)

      setFormData({
        recordType: 'spray',
        date: sprayRecord.date,
        notes: sprayRecord.notes || '',
        water_volume: sprayRecord.water_volume?.toString() || '',
        chemicals: chemicals
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
      // Helper function to ensure fertigation fertilizers format consistency
      const ensureFertigationFertilizersFormat = (fertigationRecord: FertigationRecord) => {
        const generateFertilizerId = () => {
          return `fert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }

        let fertilizers: Array<{ id: string; name: string; quantity: number; unit: string }> = []

        if (
          fertigationRecord.fertilizers &&
          Array.isArray(fertigationRecord.fertilizers) &&
          fertigationRecord.fertilizers.length > 0
        ) {
          // Has fertilizers array - use it (new format)
          fertilizers = fertigationRecord.fertilizers.map((fert) => ({
            id: generateFertilizerId(),
            name: fert.name || '',
            quantity: fert.quantity,
            unit: fert.unit || 'kg/acre'
          }))
        }

        // Ensure at least one fertilizer
        if (fertilizers.length === 0) {
          fertilizers.push({
            id: generateFertilizerId(),
            name: '',
            quantity: 0,
            unit: 'kg/acre'
          })
        }

        return fertilizers
      }

      const fertilizers = ensureFertigationFertilizersFormat(fertigationRecord)

      setFormData({
        recordType: 'fertigation',
        date: fertigationRecord.date,
        notes: fertigationRecord.notes || '',
        fertilizers: fertilizers
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
        remarks: expenseRecord.remarks || '',
        // Labor-specific fields
        num_workers: expenseRecord.num_workers?.toString() || '',
        hours_worked: expenseRecord.hours_worked?.toString() || '',
        work_type: expenseRecord.work_type || '',
        rate_per_unit: expenseRecord.rate_per_unit?.toString() || '',
        worker_names: expenseRecord.worker_names || ''
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
          summary: undefined,
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

    const isPetiole = record && isPetioleRecord(record)

    updateFormData('soil_test', (current) => {
      const nextParameters: Record<string, number> = { ...current.parameters }

      if (isPetiole) {
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
      formDataPayload.append('testType', record && isPetioleRecord(record) ? 'petiole' : 'soil')
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    if (!record) return

    setIsSubmitting(true)
    try {
      if (recordType === 'irrigation') {
        if (!irrigationForm) throw new Error('Irrigation form is not ready')
        await SupabaseService.updateIrrigationRecord(record.id!, {
          date: irrigationForm.date,
          duration: toNum(irrigationForm.duration),
          area: toNum(irrigationForm.area),
          growth_stage: irrigationForm.growth_stage,
          moisture_status: irrigationForm.moisture_status,
          system_discharge: toNum(irrigationForm.system_discharge),
          notes: irrigationForm.notes
        })
      } else if (recordType === 'spray') {
        if (!sprayForm) throw new Error('Spray form is not ready')

        // Convert form data to the expected format
        const validChemicals = sprayForm.chemicals.filter(
          (chem) => chem.name.trim() !== '' && chem.quantity > 0
        )
        const sprayData: SprayDataUpdate = {
          date: sprayForm.date,
          notes: sprayForm.notes
        }

        // Always include water_volume if provided
        if (sprayForm.water_volume) {
          sprayData.water_volume = toNum(sprayForm.water_volume)
        }

        // Handle new format with chemicals array
        if (validChemicals.length > 0) {
          const processedChemicals = validChemicals
            .map((chem) => ({
              name: chem.name.trim(),
              quantity: chem.quantity,
              unit: chem.unit as 'gm/L' | 'ml/L' | 'ppm'
            }))
            .filter(
              (chem): chem is { name: string; quantity: number; unit: 'gm/L' | 'ml/L' | 'ppm' } =>
                chem.quantity !== undefined && chem.quantity > 0
            )

          if (processedChemicals.length > 0) {
            sprayData.chemicals = processedChemicals
          }
        } else {
          // Fallback to old format for backward compatibility
          const firstChemical = sprayForm.chemicals[0]
          if (firstChemical && firstChemical.name.trim()) {
            sprayData.chemical = firstChemical.name.trim()
            sprayData.dose = firstChemical.quantity.toString()
          }
        }

        await SupabaseService.updateSprayRecord(record.id!, sprayData)
      } else if (recordType === 'harvest') {
        if (!harvestForm) throw new Error('Harvest form is not ready')
        await SupabaseService.updateHarvestRecord(record.id!, {
          date: harvestForm.date,
          quantity: toNum(harvestForm.quantity),
          grade: harvestForm.grade,
          price: toNum(harvestForm.price),
          buyer: harvestForm.buyer || undefined,
          notes: harvestForm.notes
        })
      } else if (recordType === 'fertigation') {
        if (!fertigationForm) throw new Error('Fertigation form is not ready')

        // Convert form data to the expected format
        const validFertilizers = fertigationForm.fertilizers.filter(
          (fert) => fert.name.trim() !== '' && fert.quantity > 0
        )

        if (validFertilizers.length === 0) {
          throw new Error('At least one fertilizer with valid name and quantity is required')
        }

        const normalizeUnit = (unit: string): 'kg/acre' | 'liter/acre' | null => {
          if (!unit) return null
          const normalized = unit.trim().toLowerCase().replace(/\s+/g, '')
          if (normalized.includes('kg') && normalized.includes('acre')) {
            return 'kg/acre'
          } else if (normalized.includes('liter') && normalized.includes('acre')) {
            return 'liter/acre'
          }
          return null
        }

        const processedFertilizers = validFertilizers
          .map((fert) => {
            const normalizedUnit = normalizeUnit(fert.unit)
            return normalizedUnit
              ? {
                  name: fert.name.trim(),
                  quantity: fert.quantity,
                  unit: normalizedUnit
                }
              : null
          })
          .filter((fert) => fert !== null) as Array<{
          name: string
          quantity: number
          unit: 'kg/acre' | 'liter/acre'
        }>

        if (processedFertilizers.length === 0) {
          throw new Error(
            'No valid fertilizers with recognized units (kg/acre or liter/acre) found'
          )
        }

        await SupabaseService.updateFertigationRecord(record.id!, {
          date: fertigationForm.date,
          fertilizers: processedFertilizers,
          notes: fertigationForm.notes
        })
      } else if (recordType === 'expense') {
        if (!expenseForm) throw new Error('Expense form is not ready')
        await SupabaseService.updateExpenseRecord(record.id!, {
          date: expenseForm.date,
          type: expenseForm.type,
          description: expenseForm.description,
          cost: toNum(expenseForm.cost),
          remarks: expenseForm.remarks,
          // Labor-specific fields (only include if type is 'labor')
          ...(expenseForm.type === 'labor' && {
            num_workers: toNum(expenseForm.num_workers),
            hours_worked: toNum(expenseForm.hours_worked),
            work_type: expenseForm.work_type || undefined,
            rate_per_unit: toNum(expenseForm.rate_per_unit),
            worker_names: expenseForm.worker_names || undefined
          }),
          // Clear labor fields if switching away from labor
          ...(expenseForm.type !== 'labor' && {
            num_workers: undefined,
            hours_worked: undefined,
            work_type: undefined,
            rate_per_unit: undefined,
            worker_names: undefined
          })
        })
      } else if (recordType === 'soil_test') {
        if (!soilTestForm) throw new Error('Soil test form is not ready')
        const isPetiole = record && isPetioleRecord(record)

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

        // Build base payload with common fields
        const payload: any = {
          date: soilTestForm.date,
          recommendations: soilTestForm.recommendations,
          notes: soilTestForm.notes,
          ...metadata
        }

        // Only include parameters for soil tests or when petiole has non-empty parameters
        if (!isPetiole || Object.keys(soilTestForm.parameters).length > 0) {
          payload.parameters = soilTestForm.parameters
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
        return record && isPetioleRecord(record)
          ? 'Edit Petiole Test Record'
          : 'Edit Soil Test Record'
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
      <DialogContent className="max-w-lg sm:max-w-2xl mx-auto max-h-[85vh] sm:max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className={`flex items-center gap-3 ${getColor().split(' ')[0]}`}>
            <div className={`p-2 rounded-xl ${getColor()}`}>{getIcon()}</div>
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form id="edit-record-form" className="space-y-4 pr-2">
            <div>
              <Label htmlFor="date" className="text-sm font-medium text-gray-700">
                Date *
              </Label>
              {recordType === 'irrigation' ? (
                <Input
                  id="date"
                  type="date"
                  value={formData?.date ?? ''}
                  disabled
                  className="mt-1 bg-gray-50 text-gray-600"
                  readOnly
                />
              ) : (
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
              )}
            </div>

            {recordType === 'irrigation' && (
              <>
                <div>
                  <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
                    Duration (hours) *
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    step="0.01"
                    min={0.01}
                    max={24}
                    value={irrigationForm?.duration || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      updateFormData('irrigation', (current) => ({
                        ...current,
                        duration: value
                      }))
                    }}
                    onFocus={(e) => {
                      // Select all text on focus for easy editing
                      e.target.select()
                    }}
                    className="mt-1"
                    required
                  />
                </div>
              </>
            )}

            {recordType === 'spray' && (
              <>
                {/* Water Volume Field */}
                <div>
                  <Label htmlFor="water_volume" className="text-sm font-medium text-gray-700">
                    Water Volume (L) *
                  </Label>
                  <Input
                    id="water_volume"
                    type="number"
                    value={sprayForm?.water_volume ?? ''}
                    onChange={(e) =>
                      updateFormData('spray', (current) => ({
                        ...current,
                        water_volume: e.target.value
                      }))
                    }
                    placeholder="e.g., 1000"
                    min={0.1}
                    step={0.1}
                    className="mt-1"
                    required
                  />
                </div>

                {/* Chemicals Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700">Chemical Elements *</Label>
                    <Badge variant="outline" className="text-xs">
                      {sprayForm?.chemicals?.length || 0}/10
                    </Badge>
                  </div>

                  {sprayForm?.chemicals?.map((chemical, index) => (
                    <div
                      key={chemical.id}
                      className="space-y-2 p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Chemical {index + 1}
                        </span>
                        {sprayForm.chemicals.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              updateFormData('spray', (current) => ({
                                ...current,
                                chemicals: current.chemicals.filter((c) => c.id !== chemical.id)
                              }))
                            }}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs font-medium text-gray-600">
                            Chemical Name *
                          </Label>
                          <Input
                            value={chemical.name}
                            onChange={(e) => {
                              updateFormData('spray', (current) => ({
                                ...current,
                                chemicals: current.chemicals.map((c) =>
                                  c.id === chemical.id ? { ...c, name: e.target.value } : c
                                )
                              }))
                            }}
                            placeholder="e.g., Sulfur fungicide"
                            className="h-8 text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs font-medium text-gray-600">Quantity *</Label>
                            <Input
                              type="number"
                              value={chemical.quantity}
                              onChange={(e) => {
                                updateFormData('spray', (current) => ({
                                  ...current,
                                  chemicals: current.chemicals.map((c) =>
                                    c.id === chemical.id
                                      ? { ...c, quantity: parseFloat(e.target.value) || 0 }
                                      : c
                                  )
                                }))
                              }}
                              placeholder="e.g., 500"
                              min={0.1}
                              step={0.1}
                              className="h-8 text-sm"
                            />
                          </div>

                          <div>
                            <Label className="text-xs font-medium text-gray-600">Unit *</Label>
                            <Select
                              value={chemical.unit}
                              onValueChange={(value) => {
                                updateFormData('spray', (current) => ({
                                  ...current,
                                  chemicals: current.chemicals.map((c) =>
                                    c.id === chemical.id ? { ...c, unit: value } : c
                                  )
                                }))
                              }}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="gm/L">gm/L</SelectItem>
                                <SelectItem value="ml/L">ml/L</SelectItem>
                                <SelectItem value="ppm">ppm</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {sprayForm && sprayForm.chemicals.length < 10 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateFormData('spray', (current) => ({
                          ...current,
                          chemicals: [
                            ...current.chemicals,
                            {
                              id: `${Date.now()}_${current.chemicals.length}`,
                              name: '',
                              quantity: 0,
                              unit: 'gm/L'
                            }
                          ]
                        }))
                      }}
                      className="w-full border-dashed"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Another Chemical
                    </Button>
                  )}
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
                {/* Fertilizers Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700">Fertilizers *</Label>
                    <Badge variant="outline" className="text-xs">
                      {fertigationForm?.fertilizers?.length || 0}/10
                    </Badge>
                  </div>

                  {fertigationForm?.fertilizers?.map((fertilizer, index) => (
                    <div
                      key={fertilizer.id}
                      className="space-y-2 p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Fertilizer {index + 1}
                        </span>
                        {fertigationForm.fertilizers.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              updateFormData('fertigation', (current) => ({
                                ...current,
                                fertilizers: current.fertilizers.filter(
                                  (f) => f.id !== fertilizer.id
                                )
                              }))
                            }}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs font-medium text-gray-600">
                            Fertilizer Name *
                          </Label>
                          <Input
                            value={fertilizer.name}
                            onChange={(e) => {
                              updateFormData('fertigation', (current) => ({
                                ...current,
                                fertilizers: current.fertilizers.map((f) =>
                                  f.id === fertilizer.id ? { ...f, name: e.target.value } : f
                                )
                              }))
                            }}
                            placeholder="e.g., NPK 19-19-19"
                            className="h-8 text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs font-medium text-gray-600">Quantity *</Label>
                            <Input
                              type="number"
                              value={fertilizer.quantity}
                              onChange={(e) => {
                                updateFormData('fertigation', (current) => ({
                                  ...current,
                                  fertilizers: current.fertilizers.map((f) =>
                                    f.id === fertilizer.id
                                      ? { ...f, quantity: parseFloat(e.target.value) || 0 }
                                      : f
                                  )
                                }))
                              }}
                              placeholder="e.g., 50"
                              min={0.1}
                              step={0.1}
                              className="h-8 text-sm"
                            />
                          </div>

                          <div>
                            <Label className="text-xs font-medium text-gray-600">Unit *</Label>
                            <Select
                              value={fertilizer.unit}
                              onValueChange={(value) => {
                                updateFormData('fertigation', (current) => ({
                                  ...current,
                                  fertilizers: current.fertilizers.map((f) =>
                                    f.id === fertilizer.id ? { ...f, unit: value } : f
                                  )
                                }))
                              }}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="kg/acre">kg/acre</SelectItem>
                                <SelectItem value="liter/acre">liter/acre</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {fertigationForm && fertigationForm.fertilizers.length < 10 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateFormData('fertigation', (current) => ({
                          ...current,
                          fertilizers: [
                            ...current.fertilizers,
                            {
                              id: `${Date.now()}_${current.fertilizers.length}`,
                              name: '',
                              quantity: 0,
                              unit: 'kg/acre'
                            }
                          ]
                        }))
                      }}
                      className="w-full border-dashed"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Another Fertilizer
                    </Button>
                  )}
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
                      <SelectItem value="fuel">Fuel</SelectItem>
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
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\\.?[0-9]*"
                    value={expenseForm?.cost ?? ''}
                    onChange={(e) =>
                      updateFormData('expense', (current) => ({
                        ...current,
                        cost: e.target.value
                      }))
                    }
                    onBlur={(e) =>
                      updateFormData('expense', (current) => ({
                        ...current,
                        cost: formatNumberString(e.target.value)
                      }))
                    }
                    className="mt-1"
                    required
                  />
                </div>

                {/* Labor-specific fields - shown only when category is 'labor' */}
                {expenseForm?.type === 'labor' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="num_workers" className="text-sm font-medium text-gray-700">
                          Number of Workers
                        </Label>
                        <Input
                          id="num_workers"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={expenseForm?.num_workers ?? ''}
                          onChange={(e) =>
                            updateFormData('expense', (current) => ({
                              ...current,
                              num_workers: e.target.value
                            }))
                          }
                          onBlur={(e) =>
                            updateFormData('expense', (current) => ({
                              ...current,
                              num_workers: formatNumberString(e.target.value)
                            }))
                          }
                          placeholder="e.g., 5"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hours_worked" className="text-sm font-medium text-gray-700">
                          Hours Worked
                        </Label>
                        <Input
                          id="hours_worked"
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*\\.?[0-9]*"
                          value={expenseForm?.hours_worked ?? ''}
                          onChange={(e) =>
                            updateFormData('expense', (current) => ({
                              ...current,
                              hours_worked: e.target.value
                            }))
                          }
                          onBlur={(e) =>
                            updateFormData('expense', (current) => ({
                              ...current,
                              hours_worked: formatNumberString(e.target.value)
                            }))
                          }
                          placeholder="e.g., 8"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="work_type" className="text-sm font-medium text-gray-700">
                          Type of Work
                        </Label>
                        <Select
                          value={expenseForm?.work_type ?? ''}
                          onValueChange={(value) =>
                            updateFormData('expense', (current) => ({
                              ...current,
                              work_type: value
                            }))
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select work type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pruning">Pruning</SelectItem>
                            <SelectItem value="harvesting">Harvesting</SelectItem>
                            <SelectItem value="spraying">Spraying</SelectItem>
                            <SelectItem value="weeding">Weeding</SelectItem>
                            <SelectItem value="planting">Planting</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label
                          htmlFor="rate_per_unit"
                          className="text-sm font-medium text-gray-700"
                        >
                          Rate (₹/day or ₹/hour)
                        </Label>
                        <Input
                          id="rate_per_unit"
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*\\.?[0-9]*"
                          value={expenseForm?.rate_per_unit ?? ''}
                          onChange={(e) =>
                            updateFormData('expense', (current) => ({
                              ...current,
                              rate_per_unit: e.target.value
                            }))
                          }
                          onBlur={(e) =>
                            updateFormData('expense', (current) => ({
                              ...current,
                              rate_per_unit: formatNumberString(e.target.value)
                            }))
                          }
                          placeholder="e.g., 500"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="worker_names" className="text-sm font-medium text-gray-700">
                        Worker Names (optional)
                      </Label>
                      <Input
                        id="worker_names"
                        value={expenseForm?.worker_names ?? ''}
                        onChange={(e) =>
                          updateFormData('expense', (current) => ({
                            ...current,
                            worker_names: e.target.value
                          }))
                        }
                        placeholder="e.g., Ram, Shyam, Mohan"
                        className="mt-1"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {recordType === 'soil_test' && (
              <>
                {/* Dynamic Soil Test Fields */}
                <div
                  className={`space-y-3 ${(record && isPetioleRecord(record) ? petioleTestFields : soilTestFields).length > 1 ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : ''}`}
                >
                  {(record && isPetioleRecord(record) ? petioleTestFields : soilTestFields).map(
                    (field) => (
                      <div key={field.name}>
                        <Label htmlFor={field.name} className="text-sm font-medium text-gray-700">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Input
                          id={field.name}
                          type="number"
                          step={field.step}
                          min={field.min}
                          max={field.max}
                          value={soilTestForm?.parameters?.[field.name] ?? ''}
                          onChange={(e) => {
                            const parsed = parseFloat(e.target.value)
                            updateFormData('soil_test', (current) => ({
                              ...current,
                              parameters: {
                                ...current.parameters,
                                [field.name]: Number.isNaN(parsed) ? 0 : parsed
                              }
                            }))
                          }}
                          className="mt-1"
                        />
                      </div>
                    )
                  )}
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
                    <div className="space-y-1 rounded-md p-2 text-xs text-gray-700">
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
              </>
            )}

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
          </form>
        </div>

        {/* Sticky Footer with Action Buttons */}
        <div className="flex-shrink-0 border-t p-4">
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                handleSubmit()
              }}
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
