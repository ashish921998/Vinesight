'use client'

import { useState, useEffect, useMemo, useCallback, type ChangeEvent } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ReportAttachmentMeta } from '@/types/reports'
import {
  Upload,
  X,
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle,
  Paperclip,
  FileWarning,
  RefreshCcw
} from 'lucide-react'
import { toast } from 'sonner'
import { logTypeConfigs, type LogType, type FormField } from '@/lib/log-type-config'
import { SprayChemicalUnit } from '@/lib/supabase'
import { ErrorHandler, ErrorContexts, useErrorHandler } from '@/lib/error-handler'
import { MAX_CHEMICALS_PER_SPRAY } from '@/lib/constants'
import React from 'react'

interface LogEntry {
  id: string // temporary ID for session
  type: LogType
  data: Record<string, unknown>
  isValid: boolean
  meta?: {
    report?: ReportAttachmentMeta | null
  }
}

const formatLogPreview = (log: LogEntry): string => {
  const data = log.data as Record<string, unknown>

  if (log.type === 'spray') {
    const chemicals = Array.isArray(data.chemicals)
      ? (data.chemicals as Array<Record<string, unknown>>)
      : []

    const chemicalSummary = chemicals
      .map((chem) => {
        const name = typeof chem.name === 'string' ? chem.name : undefined
        if (!name) return null

        const quantityCandidate = chem.quantity ?? chem.quantity_amount ?? chem.quantityAmount
        const quantity =
          typeof quantityCandidate === 'number'
            ? quantityCandidate
            : typeof quantityCandidate === 'string'
              ? quantityCandidate
              : undefined

        const unitCandidate = chem.unit ?? chem.quantity_unit ?? chem.quantityUnit
        const unit = typeof unitCandidate === 'string' ? unitCandidate : undefined

        if (quantity !== undefined && unit && unit !== '') {
          return `${name} (${quantity} ${unit})`
        }
        if (quantity !== undefined) {
          return `${name} (${quantity})`
        }
        return name
      })
      .filter(Boolean)
      .slice(0, 2)
      .join(', ')

    if (chemicalSummary) {
      return chemicalSummary
    }
  }

  const primitiveEntries = Object.entries(data).filter(([, value]) => {
    if (value === null || value === undefined || value === '') return false
    if (Array.isArray(value)) return false
    if (typeof value === 'object') return false
    return true
  })

  const summary = primitiveEntries
    .map(([key, value]) => `${key}: ${value}`)
    .slice(0, 2)
    .join(', ')

  return summary || 'Details captured'
}

const toStringValue = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  return ''
}

interface UnifiedDataLogsModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (logs: LogEntry[], date: string, dayNotes: string, dayPhotos: File[]) => void
  isSubmitting: boolean
  farmId?: number
}

// Use centralized logTypeConfigs from @/lib/log-type-config

// Helper function to get log type labels from centralized config
const getLogTypeLabel = (type: LogType): string => {
  return logTypeConfigs[type]?.label || type.replace(/_/g, ' ')
}

export function UnifiedDataLogsModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  farmId
}: UnifiedDataLogsModalProps) {
  const { handleError, handleSuccess } = useErrorHandler()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [currentLogType, setCurrentLogType] = useState<LogType | null>(null)
  const [currentFormData, setCurrentFormData] = useState<Record<string, unknown>>({})
  const [sessionLogs, setSessionLogs] = useState<LogEntry[]>([])
  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const [currentReport, setCurrentReport] = useState<ReportAttachmentMeta | null>(null)
  const [isUploadingReport, setIsUploadingReport] = useState(false)
  const [reportUploadError, setReportUploadError] = useState<string | null>(null)

  // Shared day-level data
  const [dayNotes, setDayNotes] = useState('')
  const [dayPhotos, setDayPhotos] = useState<File[]>([])

  const [chemicalEntries, setChemicalEntries] = useState<
    Array<{
      id: string
      name: string
      quantity: string
      unit: SprayChemicalUnit | ''
      isValid: boolean
      errors: string[]
      warnings: string[]
    }>
  >([])

  // Multiple fertigation entries state
  const [multipleFertigationMode, setMultipleFertigationMode] = useState(false)
  const [fertigationEntries, setFertigationEntries] = useState<
    Array<{ id: string; data: Record<string, unknown>; isValid: boolean }>
  >([])

  // Reset modal state when opened/closed
  useEffect(() => {
    if (!isOpen) {
      setCurrentLogType(null)
      setCurrentFormData({})
      setSessionLogs([])
      setEditingLogId(null)
      setSelectedDate(new Date().toISOString().split('T')[0])
      setDayNotes('')
      setDayPhotos([])
      setChemicalEntries([])
      setMultipleFertigationMode(false)
      setFertigationEntries([])
      setCurrentReport(null)
      setReportUploadError(null)
      setIsUploadingReport(false)
    }
  }, [isOpen])

  // Reset current form when log type changes
  useEffect(() => {
    if (currentLogType && !editingLogId) {
      setCurrentFormData({})
      if (currentLogType === 'spray') {
        setChemicalEntries([
          {
            id: Date.now().toString(),
            name: '',
            quantity: '',
            unit: SprayChemicalUnit.GramPerLiter,
            isValid: false,
            errors: [],
            warnings: []
          }
        ])
        setMultipleFertigationMode(false)
        setFertigationEntries([])
      } else if (currentLogType === 'fertigation') {
        setFertigationEntries([{ id: Date.now().toString(), data: {}, isValid: false }])
        setMultipleFertigationMode(true)
        setChemicalEntries([])
      } else {
        setChemicalEntries([])
        setMultipleFertigationMode(false)
        setFertigationEntries([])
      }
    }
  }, [currentLogType, editingLogId])

  useEffect(() => {
    if (!currentLogType || (currentLogType !== 'soil_test' && currentLogType !== 'petiole_test')) {
      setCurrentReport(null)
      setReportUploadError(null)
    }
  }, [currentLogType])

  const validateCurrentForm = (): boolean => {
    if (!currentLogType) return false

    if (currentLogType === 'spray') {
      return chemicalEntries.some((entry) => entry.isValid)
    }

    if (currentLogType === 'fertigation' && multipleFertigationMode) {
      return fertigationEntries.some((entry) => entry.isValid)
    }

    const config = logTypeConfigs[currentLogType]
    for (const field of config.fields) {
      if (field.required && !currentFormData[field.name]) {
        return false
      }
    }
    return true
  }

  const applyParsedParameters = (parameters?: Record<string, number>) => {
    if (!parameters || !currentLogType) return

    const canonicalize = (key: string) => {
      const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (normalized.includes('soilph') || normalized === 'ph') return 'ph'
      if (
        normalized.includes('electricalconductivity') ||
        normalized === 'ec' ||
        normalized === 'soilec'
      )
        return 'ec'
      if (normalized.includes('organiccarbon') || normalized === 'oc') return 'organicCarbon'
      if (normalized.includes('organicmatter')) return 'organicMatter'
      if (normalized.includes('nitrogen') || normalized === 'n') return 'nitrogen'
      if (normalized.includes('phosphorus') || normalized === 'p') return 'phosphorus'
      if (normalized.includes('potassium') || normalized === 'k') return 'potassium'
      if (normalized.includes('calciumcarbonate') || normalized.includes('caco3'))
        return 'calciumCarbonate'
      if (normalized.includes('calcium') || normalized === 'ca') return 'calcium'
      if (normalized.includes('magnesium') || normalized === 'mg') return 'magnesium'
      if (normalized.includes('sulphur') || normalized.includes('sulfur') || normalized === 's')
        return 'sulfur'
      if (normalized.includes('iron') || normalized.includes('ferrous') || normalized === 'fe')
        return 'iron'
      if (normalized.includes('manganese') || normalized === 'mn') return 'manganese'
      if (normalized.includes('zinc') || normalized === 'zn') return 'zinc'
      if (normalized.includes('copper') || normalized === 'cu') return 'copper'
      if (normalized.includes('boron') || normalized === 'b') return 'boron'
      if (normalized.includes('molybdenum') || normalized === 'mo') return 'molybdenum'
      if (normalized.includes('sodium') || normalized === 'na') return 'sodium'
      if (normalized.includes('chloride') || normalized === 'cl') return 'chloride'
      if (normalized.includes('bicarbonate') || normalized.includes('hco3')) return 'bicarbonate'
      if (normalized.includes('carbonate') || normalized === 'co3') return 'carbonate'
      return normalized
    }

    const canonicalParameters = Object.entries(parameters).reduce<Record<string, number>>(
      (acc, [key, rawValue]) => {
        let value = rawValue
        if (typeof value === 'string') {
          const parsed = parseFloat(value)
          value = Number.isFinite(parsed) ? parsed : NaN
        }
        if (typeof value !== 'number' || !Number.isFinite(value)) return acc
        acc[canonicalize(key)] = value
        return acc
      },
      {}
    )

    setCurrentFormData((prev) => {
      const updated = { ...prev }

      logTypeConfigs[currentLogType].fields.forEach((field) => {
        const canonicalFieldKey = canonicalize(field.name)
        const value =
          canonicalParameters[canonicalFieldKey] ??
          parameters[field.name] ??
          parameters[field.name.replace(/([A-Z])/g, '_$1').toLowerCase()]

        if (value !== undefined) {
          updated[field.name] = Number.isFinite(value) ? value.toString() : ''
        }
      })

      return updated
    })
  }

  const handleReportFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!currentLogType || (currentLogType !== 'soil_test' && currentLogType !== 'petiole_test')) {
      event.target.value = ''
      return
    }

    const file = event.target.files?.[0]
    if (!file) return

    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size exceeds 10 MB limit')
      event.target.value = ''
      return
    }

    if (!farmId) {
      toast.error('Select a farm before uploading reports')
      event.target.value = ''
      return
    }
    // …rest of function…

    setIsUploadingReport(true)
    setReportUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('testType', currentLogType === 'soil_test' ? 'soil' : 'petiole')
      formData.append('farmId', farmId.toString())
      if (currentReport?.storagePath) {
        formData.append('existingPath', currentReport.storagePath)
      }

      const response = await fetch('/api/test-reports/parse', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Failed to process report')
      }

      const payload = await response.json()
      const reportMeta: ReportAttachmentMeta = {
        storagePath: payload.report.storagePath,
        signedUrl: payload.report.signedUrl,
        filename: payload.report.filename,
        mimeType: payload.report.mimeType,
        reportType: payload.report.reportType,
        extractionStatus: payload.extraction?.status || 'failed',
        extractionError: payload.extraction?.error,
        parsedParameters: payload.extraction?.parameters || undefined,
        rawNotes: payload.extraction?.rawNotes,
        summary: payload.extraction?.summary,
        confidence: payload.extraction?.confidence
      }

      setCurrentReport(reportMeta)

      if (reportMeta.extractionStatus === 'success') {
        applyParsedParameters(reportMeta.parsedParameters)
        toast.success('Report uploaded and values auto-filled')
      } else {
        toast.warning('Report uploaded. Review fields and enter values manually.')
      }
    } catch (error) {
      const message = ErrorHandler.getErrorMessage(error)
      setReportUploadError(message)
      handleError(error, ErrorContexts.FILE_UPLOAD)
    } finally {
      setIsUploadingReport(false)
      event.target.value = ''
    }
  }

  interface ChemicalValidationResult {
    isValid: boolean
    errors: string[]
    warnings: string[]
  }

  const validateChemicalEntry = useCallback(
    (entry: {
      name: string
      quantity: string
      unit: SprayChemicalUnit | ''
    }): ChemicalValidationResult => {
      const errors: string[] = []
      const warnings: string[] = []

      // Validate name
      if (!entry.name.trim()) {
        errors.push('Chemical name is required')
      } else if (entry.name.trim().length < 2) {
        errors.push('Chemical name must be at least 2 characters')
      } else if (entry.name.trim().length > 100) {
        errors.push('Chemical name is too long (max 100 characters)')
      }

      // Validate quantity
      const value = Number(entry.quantity)
      if (!Number.isFinite(value) || value <= 0) {
        errors.push('Quantity must be a positive number')
      } else if (value > 1000) {
        warnings.push('High concentration detected - please verify dosage')
      } else if (value < 0.1) {
        warnings.push('Very low concentration - verify if this is correct')
      }

      // Validate unit
      if (!entry.unit) {
        errors.push('Unit is required')
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      }
    },
    []
  )

  const handleAddChemical = () => {
    setChemicalEntries((prev) => {
      if (prev.length >= MAX_CHEMICALS_PER_SPRAY) return prev
      const newEntry = {
        id: Date.now().toString(),
        name: '',
        quantity: '',
        unit: SprayChemicalUnit.GramPerLiter,
        isValid: false,
        errors: [],
        warnings: []
      }
      return [...prev, newEntry]
    })
  }

  const handleRemoveChemical = (entryId: string) => {
    setChemicalEntries((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((entry) => entry.id !== entryId)
    })
  }

  const handleChemicalChange = (
    entryId: string,
    field: 'name' | 'quantity' | 'unit',
    value: string | SprayChemicalUnit | ''
  ) => {
    setChemicalEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== entryId) return entry
        const updated = { ...entry, [field]: value }
        const validation = validateChemicalEntry(updated)
        return {
          ...updated,
          isValid: validation.isValid,
          errors: validation.errors,
          warnings: validation.warnings
        }
      })
    )
  }

  const validateFertigationEntry = (data: Record<string, unknown>): boolean => {
    const config = logTypeConfigs['fertigation']
    for (const field of config.fields) {
      if (field.required && !data[field.name]) {
        return false
      }
    }
    return true
  }

  const handleAddFertigationEntry = () => {
    if (fertigationEntries.length >= 10) return

    const newEntry = {
      id: Date.now().toString(),
      data: {},
      isValid: false
    }
    setFertigationEntries((prev) => [...prev, newEntry])
  }

  const handleRemoveFertigationEntry = (entryId: string) => {
    if (fertigationEntries.length === 1) return
    setFertigationEntries((prev) => prev.filter((entry) => entry.id !== entryId))
  }

  const handleFertigationEntryChange = (entryId: string, field: string, value: any) => {
    setFertigationEntries((prev) =>
      prev.map((entry) => {
        if (entry.id === entryId) {
          const newData = { ...entry.data, [field]: value }
          return {
            ...entry,
            data: newData,
            isValid: validateFertigationEntry(newData)
          }
        }
        return entry
      })
    )
  }

  const handleAddLogEntry = () => {
    if (!currentLogType || !validateCurrentForm()) return

    if (currentLogType === 'spray') {
      const validChemicals = chemicalEntries.filter((entry) => entry.isValid)
      if (validChemicals.length === 0) return

      const logEntry: LogEntry = {
        id: editingLogId || Date.now().toString(),
        type: 'spray',
        data: {
          ...currentFormData,
          chemicals: validChemicals,
          legacy_chemical: validChemicals[0]?.name || null,
          legacy_dose:
            validChemicals[0]?.quantity != null &&
            validChemicals[0]?.unit != null &&
            validChemicals[0]?.unit !== ''
              ? `${validChemicals[0].quantity} ${validChemicals[0].unit}`
              : validChemicals[0]?.quantity != null
                ? `${validChemicals[0].quantity} gm/L`
                : null
        },
        isValid: true
      }

      if (editingLogId) {
        setSessionLogs((prev) => prev.map((log) => (log.id === editingLogId ? logEntry : log)))
        handleSuccess(`Spray record updated with ${validChemicals.length} chemical(s)`)
        setEditingLogId(null)
      } else {
        setSessionLogs((prev) => [...prev, logEntry])
        handleSuccess(`Spray record added with ${validChemicals.length} chemical(s)`)
      }

      setCurrentLogType(null)
      setCurrentFormData({})
      setChemicalEntries([])
      return
    }

    if (currentLogType === 'fertigation' && multipleFertigationMode) {
      // Handle multiple fertigation entries
      const validFertigationEntries = fertigationEntries.filter((entry) => entry.isValid)

      const newFertigationLogs: LogEntry[] = validFertigationEntries.map((entry) => ({
        id: entry.id + '_fertigation',
        type: 'fertigation',
        data: { ...entry.data },
        isValid: true
      }))

      setSessionLogs((prev) => [...prev, ...newFertigationLogs])

      // Reset fertigation mode
      setCurrentLogType(null)
      setMultipleFertigationMode(false)
      setFertigationEntries([])
      return
    }

    const logEntry: LogEntry = {
      id: editingLogId || Date.now().toString(),
      type: currentLogType,
      data: {
        ...currentFormData
      },
      isValid: true,
      meta:
        currentLogType === 'soil_test' || currentLogType === 'petiole_test'
          ? { report: currentReport }
          : undefined
    }

    if (editingLogId) {
      // Update existing log
      setSessionLogs((prev) => prev.map((log) => (log.id === editingLogId ? logEntry : log)))
      setEditingLogId(null)
    } else {
      // Add new log
      setSessionLogs((prev) => [...prev, logEntry])
    }

    // Reset form
    setCurrentLogType(null)
    setCurrentFormData({})
    setCurrentReport(null)
    setReportUploadError(null)
  }

  const handleEditLog = (logId: string) => {
    const log = sessionLogs.find((l) => l.id === logId)
    if (!log) return

    setEditingLogId(logId)
    setCurrentLogType(log.type)
    setCurrentFormData({ ...log.data })
    setCurrentReport(log.meta?.report || null)
    setReportUploadError(null)

    // Handle spray log chemical entries restoration
    if (log.type === 'spray' && log.data.chemicals) {
      const chemicals = log.data.chemicals as Array<{
        id: string
        name: string
        quantity: string
        unit: SprayChemicalUnit
        isValid: boolean
      }>

      if (chemicals.length > 0) {
        // Add missing errors and warnings properties for backward compatibility
        const updatedChemicals = chemicals.map((chem) => ({
          ...chem,
          errors: [],
          warnings: []
        }))
        setChemicalEntries(updatedChemicals)
      }
    }
  }

  const handleRemoveLog = (logId: string) => {
    setSessionLogs((prev) => prev.filter((log) => log.id !== logId))
  }

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setDayPhotos((prev) => [...prev, ...files])
  }

  const handlePhotoRemove = (index: number) => {
    setDayPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSaveAllLogs = () => {
    if (sessionLogs.length === 0) return
    onSubmit(sessionLogs, selectedDate, dayNotes, dayPhotos)
  }

  const renderFertigationEntryField = (
    entry: { id: string; data: Record<string, unknown>; isValid: boolean },
    field: FormField
  ) => {
    const value = toStringValue(entry.data[field.name])

    switch (field.type) {
      case 'select':
        return (
          <div key={field.name} className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(newValue) =>
                handleFertigationEntryChange(entry.id, field.name, newValue)
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'number':
        return (
          <div key={field.name} className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type="number"
              value={value}
              onChange={(e) => handleFertigationEntryChange(entry.id, field.name, e.target.value)}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              step={field.step}
              className="h-9"
            />
          </div>
        )

      default:
        return (
          <div key={field.name} className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type="text"
              value={value}
              onChange={(e) => handleFertigationEntryChange(entry.id, field.name, e.target.value)}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              className="h-9"
            />
          </div>
        )
    }
  }

  const renderFormField = (field: FormField) => {
    const value = toStringValue(currentFormData[field.name])

    switch (field.type) {
      case 'select':
        return (
          <div key={field.name} className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(newValue) =>
                setCurrentFormData((prev) => ({
                  ...prev,
                  [field.name]: newValue
                }))
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'number':
        return (
          <div key={field.name} className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type="number"
              value={value}
              onChange={(e) =>
                setCurrentFormData((prev) => ({
                  ...prev,
                  [field.name]: e.target.value
                }))
              }
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              step={field.step}
              className="h-9"
            />
          </div>
        )

      case 'textarea':
        return (
          <div key={field.name} className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              value={value}
              onChange={(e) =>
                setCurrentFormData((prev) => ({
                  ...prev,
                  [field.name]: e.target.value
                }))
              }
              placeholder={field.placeholder}
              className="min-h-[80px]"
            />
          </div>
        )

      default:
        return (
          <div key={field.name} className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type="text"
              value={value}
              onChange={(e) =>
                setCurrentFormData((prev) => ({
                  ...prev,
                  [field.name]: e.target.value
                }))
              }
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              className="h-9"
            />
          </div>
        )
    }
  }

  const renderReportAttachmentSection = () => {
    if (!currentLogType || (currentLogType !== 'soil_test' && currentLogType !== 'petiole_test')) {
      return null
    }

    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Label htmlFor="lab-report-upload" className="text-sm font-medium text-gray-700">
              Attach Lab Report
            </Label>
            <p className="text-xs text-gray-500">
              Upload PDF or image (max 10 MB) to auto-fill nutrient values.
            </p>
          </div>
          {currentReport?.extractionStatus === 'success' && (
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
              Auto parsed
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Input
            id="lab-report-upload"
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
          {currentReport && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentReport(null)
                setReportUploadError(null)
              }}
              className="h-8 text-xs"
            >
              <RefreshCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>

        {isUploadingReport && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Processing report, please wait...
          </p>
        )}

        {currentReport && (
          <div className="space-y-1 rounded-md bg-gray-50 p-2 text-xs text-gray-700">
            <div className="flex flex-wrap items-center gap-2">
              <Paperclip className="h-3 w-3" />
              <span className="font-medium truncate max-w-[160px]">{currentReport.filename}</span>
              <Badge variant="outline" className="capitalize">
                {currentReport.reportType}
              </Badge>
              <Button
                variant="link"
                size="sm"
                onClick={() => window.open(currentReport.signedUrl, '_blank', 'noopener')}
                className="h-auto p-0 text-xs"
              >
                View report
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {currentReport.extractionStatus === 'success' ? (
                <>
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                  <span className="text-emerald-700">Parsed successfully</span>
                  {typeof currentReport.confidence === 'number' && (
                    <span className="text-gray-500">
                      Confidence {(currentReport.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </>
              ) : (
                <>
                  <FileWarning className="h-3 w-3 text-amber-500" />
                  <span className="text-amber-600">
                    {currentReport.extractionError ||
                      'Automatic parsing failed. Enter values manually.'}
                  </span>
                </>
              )}
            </div>
            {currentReport.summary && (
              <p className="text-gray-600">Summary: {currentReport.summary}</p>
            )}
            {currentReport.rawNotes && (
              <p className="text-gray-500">Notes: {currentReport.rawNotes}</p>
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
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Add Data Logs
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date Selector */}
          <div className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">Date</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="h-9"
            />
          </div>

          {/* Current Session Logs */}
          {sessionLogs.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Added Logs ({sessionLogs.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sessionLogs.map((log) => {
                  const config = logTypeConfigs[log.type]
                  const Icon = config.icon

                  return (
                    <div
                      key={log.id}
                      className={`flex items-center justify-between p-2 rounded-lg border ${config.bgColor} ${config.borderColor}`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        <div>
                          <p className="font-medium text-sm">{getLogTypeLabel(log.type)}</p>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {formatLogPreview(log)}
                          </p>
                          {log.meta?.report && (
                            <div className="flex items-center gap-1 text-[0.65rem] text-emerald-600 mt-1">
                              <Paperclip className="h-3 w-3" />
                              Test report attached
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditLog(log.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLog(log.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Log Type Selector */}
          <div className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">
              {editingLogId ? 'Editing Log Type' : 'Select Log Type'}
            </Label>
            <Select
              value={currentLogType || ''}
              onValueChange={(value) => setCurrentLogType(value as LogType)}
              disabled={!!editingLogId}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Choose a log type to add..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(logTypeConfigs).map(([type, config]) => {
                  const Icon = config.icon
                  return (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        {config.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Form Fields */}
          {currentLogType && (
            <Card
              className={`${logTypeConfigs[currentLogType].bgColor} ${logTypeConfigs[currentLogType].borderColor} border`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {(() => {
                    const Icon = logTypeConfigs[currentLogType].icon
                    return <Icon className={`h-4 w-4 ${logTypeConfigs[currentLogType].color}`} />
                  })()}
                  {getLogTypeLabel(currentLogType)} Details
                  {currentLogType === 'spray' && (
                    <Badge variant="outline" className="ml-2">
                      {chemicalEntries.filter((entry) => entry.isValid).length}/10 chemicals
                    </Badge>
                  )}
                  {currentLogType === 'fertigation' && multipleFertigationMode && (
                    <Badge variant="outline" className="ml-2">
                      {fertigationEntries.length}/10 entries
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Multiple Spray Entries */}
                {currentLogType === 'spray' ? (
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-700">Water Volume (L)</Label>
                    <Input
                      type="number"
                      value={toStringValue(currentFormData.water_volume) || ''}
                      onChange={(e) =>
                        setCurrentFormData((prev) => ({
                          ...prev,
                          water_volume: e.target.value
                        }))
                      }
                      placeholder="Total water used"
                      min={0}
                      step={0.1}
                      className="h-10"
                    />

                    {chemicalEntries.map((entry, index) => (
                      <Card
                        key={entry.id}
                        className="bg-white border-2 border-dashed border-gray-200"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              {(() => {
                                const Icon = logTypeConfigs['spray'].icon
                                return (
                                  <Icon className={`h-4 w-4 ${logTypeConfigs['spray'].color}`} />
                                )
                              })()}
                              Spray {index + 1}
                              {entry.isValid && <CheckCircle className="h-4 w-4 text-green-600" />}
                            </CardTitle>
                            {chemicalEntries.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveChemical(entry.id)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium text-gray-700">
                              Chemical Name<span className="text-red-500 ml-1">*</span>
                            </Label>
                            <Input
                              value={entry.name}
                              onChange={(e) =>
                                handleChemicalChange(entry.id, 'name', e.target.value)
                              }
                              placeholder="e.g., Imidacloprid"
                              className="h-10"
                              aria-label="Chemical name for spray application"
                            />
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1 space-y-1 min-w-[0]">
                              <Label className="text-sm font-medium text-gray-700">Quantity</Label>
                              <Input
                                type="number"
                                value={entry.quantity}
                                onChange={(e) =>
                                  handleChemicalChange(entry.id, 'quantity', e.target.value)
                                }
                                placeholder="e.g., 1.5"
                                min={0}
                                step={0.1}
                                className="h-10 rounded-md"
                                aria-label="Chemical quantity amount"
                              />
                            </div>
                            <div className="w-[100px] space-y-1">
                              <Label className="text-sm font-medium text-gray-700">Unit</Label>
                              <Select
                                value={entry.unit}
                                onValueChange={(value) =>
                                  handleChemicalChange(entry.id, 'unit', value as SprayChemicalUnit)
                                }
                              >
                                <SelectTrigger
                                  className="border-gray-300 focus:border-primary focus:ring-primary rounded-md flex items-center px-3 py-2"
                                  aria-label="Select chemical unit for measurement concentration"
                                >
                                  <SelectValue placeholder="Unit" />
                                </SelectTrigger>
                                <SelectContent className="min-w-[7rem]">
                                  <SelectItem value={SprayChemicalUnit.GramPerLiter}>
                                    gm/L
                                  </SelectItem>
                                  <SelectItem value={SprayChemicalUnit.MilliliterPerLiter}>
                                    ml/L
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {index === chemicalEntries.length - 1 &&
                            chemicalEntries.length < MAX_CHEMICALS_PER_SPRAY && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAddChemical}
                                className="w-full mt-2 border-dashed"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Another Chemical
                              </Button>
                            )}
                        </CardContent>
                      </Card>
                    ))}

                    <Button
                      onClick={handleAddLogEntry}
                      disabled={!validateCurrentForm()}
                      className="w-full"
                    >
                      Save Spray Log ({chemicalEntries.filter((entry) => entry.isValid).length})
                    </Button>
                  </div>
                ) : currentLogType === 'fertigation' && multipleFertigationMode ? (
                  <div className="space-y-4">
                    {fertigationEntries.map((entry, index) => (
                      <Card
                        key={entry.id}
                        className="bg-white border-2 border-dashed border-gray-200"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              {(() => {
                                const Icon = logTypeConfigs['fertigation'].icon
                                return (
                                  <Icon
                                    className={`h-4 w-4 ${logTypeConfigs['fertigation'].color}`}
                                  />
                                )
                              })()}
                              Fertigation {index + 1}
                              {entry.isValid && <CheckCircle className="h-4 w-4 text-green-600" />}
                            </CardTitle>
                            {fertigationEntries.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFertigationEntry(entry.id)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {logTypeConfigs[currentLogType].fields.map((field) =>
                            renderFertigationEntryField(entry, field)
                          )}

                          {/* Add button after last field */}
                          {index === fertigationEntries.length - 1 &&
                            fertigationEntries.length < 10 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAddFertigationEntry}
                                className="w-full mt-2 border-dashed"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Another Fertigation
                              </Button>
                            )}
                        </CardContent>
                      </Card>
                    ))}

                    {/* Save Multiple Fertigation Entries Button */}
                    <Button
                      onClick={handleAddLogEntry}
                      disabled={!validateCurrentForm()}
                      className="w-full"
                    >
                      Save All Fertigation Entries (
                      {fertigationEntries.filter((e) => e.isValid).length})
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Dynamic fields for non-spray logs */}
                    {logTypeConfigs[currentLogType].fields.map(renderFormField)}

                    {renderReportAttachmentSection()}

                    {/* Add Entry Button */}
                    <Button
                      onClick={handleAddLogEntry}
                      disabled={!validateCurrentForm()}
                      className="w-full"
                    >
                      {editingLogId ? 'Update Log Entry' : 'Add Log Entry'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Add More Button */}
          {!currentLogType && sessionLogs.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setCurrentLogType(null)}
              className="w-full flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Another Log Entry
            </Button>
          )}

          {/* Day-level Notes and Photos */}
          {sessionLogs.length > 0 && (
            <Card className="border-2 border-dashed border-gray-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  📝 Day Notes & Photos
                  <Badge variant="outline" className="ml-2">
                    Shared for all logs
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Day Notes */}
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700">Notes for the Day</Label>
                  <Textarea
                    value={dayNotes}
                    onChange={(e) => setDayNotes(e.target.value)}
                    placeholder="Add general notes for all activities on this date..."
                    className="min-h-[80px]"
                  />
                </div>

                {/* Day Photos */}
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700">Photos for the Day</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoAdd}
                        className="h-9"
                      />
                      <Upload className="h-4 w-4 text-gray-400" />
                    </div>
                    {dayPhotos.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {dayPhotos.map((photo, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {photo.name.slice(0, 10)}...
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePhotoRemove(index)}
                              className="h-3 w-3 p-0 ml-1"
                            >
                              <X className="h-2 w-2" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-500">
            {sessionLogs.length} log{sessionLogs.length !== 1 ? 's' : ''} ready to save
            {dayNotes && <span className="ml-2">• Notes included</span>}
            {dayPhotos.length > 0 && (
              <span className="ml-2">
                • {dayPhotos.length} photo{dayPhotos.length !== 1 ? 's' : ''} included
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveAllLogs}
              disabled={sessionLogs.length === 0 || isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save All Logs ({sessionLogs.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
