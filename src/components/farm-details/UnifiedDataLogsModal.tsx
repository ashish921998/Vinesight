'use client'

import { useState, useEffect, useMemo, type ChangeEvent } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
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
import { formatChemicalsArray, type Chemical } from '@/lib/chemical-formatter'
import { SupabaseService } from '@/lib/supabase-service'

interface LogEntry {
  id: string // temporary ID for session
  type: LogType
  data: Record<string, any>
  isValid: boolean
  meta?: {
    report?: ReportAttachmentMeta | null
  }
}

interface UnifiedDataLogsModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (logs: LogEntry[], date: string, dayNotes: string, dayPhotos: File[]) => void
  isSubmitting: boolean
  farmId?: number
  mode?: 'add' | 'edit'
  existingLogs?: LogEntry[]
  selectedDate?: string
  farmOptions?: Array<{ id: number; name: string }>
  selectedFarmId?: number
  onFarmChange?: (farmId: number) => void
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
  farmId,
  mode = 'add',
  existingLogs,
  selectedDate,
  farmOptions,
  selectedFarmId,
  onFarmChange
}: UnifiedDataLogsModalProps) {
  const normalizedExistingLogs = useMemo<LogEntry[]>(() => existingLogs ?? [], [existingLogs])
  const [internalSelectedDate, setInternalSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  // Helper function to normalize date to local YYYY-MM-DD format
  const toISO = (dateStr?: string) => {
    if (!dateStr) {
      const now = new Date()
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    }
    const d = new Date(dateStr)
    if (!Number.isFinite(d.getTime())) return dateStr
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  // In edit mode, use the original date from the first log entry's data to preserve it
  const selectedDateToUse = toISO(
    mode === 'edit' && normalizedExistingLogs.length > 0
      ? normalizedExistingLogs[0]?.data?.date || selectedDate || internalSelectedDate
      : selectedDate || internalSelectedDate
  )
  const setSelectedDate =
    selectedDate || (mode === 'edit' && normalizedExistingLogs.length > 0)
      ? () => {}
      : (v: string) => setInternalSelectedDate(toISO(v))
  const [currentLogType, setCurrentLogType] = useState<LogType | null>(null)
  const [currentFormData, setCurrentFormData] = useState<Record<string, any>>({})
  const [sessionLogs, setSessionLogs] = useState<LogEntry[]>([])
  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const [currentReport, setCurrentReport] = useState<ReportAttachmentMeta | null>(null)
  const [isUploadingReport, setIsUploadingReport] = useState(false)
  const [reportUploadError, setReportUploadError] = useState<string | null>(null)

  // Shared day-level data
  const [dayNotes, setDayNotes] = useState('')
  const [dayPhotos, setDayPhotos] = useState<File[]>([])

  // Multiple spray entries state
  const [multipleSprayMode, setMultipleSprayMode] = useState(false)
  const [sprayEntries, setSprayEntries] = useState<
    Array<{ id: string; data: Record<string, any>; isValid: boolean }>
  >([])

  // Water volume and chemicals state for spray
  const [waterVolume, setWaterVolume] = useState('')

  // Helper to create a blank chemical row with stable ID (pure function)
  // Moved before state declarations to avoid TDZ issues
  const makeEmptyChemical = (): { id: string; name: string; quantity: string; unit: string } => {
    // Generate stable unique ID without referencing external state
    return {
      id:
        globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: '',
      quantity: '',
      unit: 'gm/L'
    }
  }
  const [chemicals, setChemicals] = useState<
    Array<{ id: string; name: string; quantity: string; unit: string }>
  >([makeEmptyChemical()])

  // Multiple fertigation entries state
  const [multipleFertigationMode, setMultipleFertigationMode] = useState(false)
  const [fertigationEntries, setFertigationEntries] = useState<
    Array<{ id: string; data: Record<string, any>; isValid: boolean }>
  >([])

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    logId: string | null
    logType: LogType | null
    isLoading: boolean
  }>({
    isOpen: false,
    logId: null,
    logType: null,
    isLoading: false
  })

  // Initialize modal state when opened or when mode/existingLogs change
  useEffect(() => {
    if (isOpen) {
      // First, completely reset all state to prevent any leakage
      const resetState = () => {
        setCurrentLogType(null)
        setCurrentFormData({})
        setSessionLogs([])
        setEditingLogId(null)
        setDayNotes('')
        setDayPhotos([])
        setMultipleSprayMode(false)
        setSprayEntries([])
        setWaterVolume('')
        setChemicals([makeEmptyChemical()])
        setMultipleFertigationMode(false)
        setFertigationEntries([])
        setCurrentReport(null)
        setReportUploadError(null)
        setIsUploadingReport(false)
      }

      // Reset state immediately
      resetState()

      // Then initialize based on mode after a brief delay to ensure reset is complete
      const timer = setTimeout(() => {
        if (mode === 'edit' && normalizedExistingLogs.length > 0) {
          // Initialize with existing logs for edit mode
          setSessionLogs(normalizedExistingLogs)
          // Extract day notes from the first log if available
          const firstLog = normalizedExistingLogs[0]
          if (firstLog?.data?.notes) {
            setDayNotes(firstLog.data.notes)
          }
          // Set the internal date if selectedDate is provided
          if (selectedDate) {
            setInternalSelectedDate(selectedDate)
          }
        } else {
          // For add mode, ensure we have a fresh date
          if (!selectedDate) {
            setInternalSelectedDate(new Date().toISOString().split('T')[0])
          }
        }
      }, 0) // Use setTimeout to ensure state reset completes before initialization

      return () => clearTimeout(timer)
    } else {
      // Reset state when closing
      setCurrentLogType(null)
      setCurrentFormData({})
      setSessionLogs([])
      setEditingLogId(null)
      if (!selectedDate) {
        setInternalSelectedDate(new Date().toISOString().split('T')[0])
      }
      setDayNotes('')
      setDayPhotos([])
      setMultipleSprayMode(false)
      setSprayEntries([])
      setWaterVolume('')
      setChemicals([makeEmptyChemical()])
      setMultipleFertigationMode(false)
      setFertigationEntries([])
      setCurrentReport(null)
      setReportUploadError(null)
      setIsUploadingReport(false)
    }
  }, [isOpen, mode, normalizedExistingLogs, selectedDate])

  // Reset current form when log type changes
  useEffect(() => {
    if (currentLogType && !editingLogId) {
      setCurrentFormData({})
      if (currentLogType === 'spray') {
        setSprayEntries([{ id: Date.now().toString(), data: {}, isValid: false }])
        setMultipleSprayMode(true)
        setMultipleFertigationMode(false)
        setFertigationEntries([])
        setWaterVolume('')
        setChemicals([makeEmptyChemical()])
      } else if (currentLogType === 'fertigation') {
        setFertigationEntries([
          { id: Date.now().toString(), data: { unit: 'kg/acre' }, isValid: false }
        ])
        setMultipleFertigationMode(true)
        setMultipleSprayMode(false)
        setSprayEntries([])
      } else {
        setMultipleSprayMode(false)
        setSprayEntries([])
        setWaterVolume('')
        setChemicals([makeEmptyChemical()])
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

    if (currentLogType === 'spray' && multipleSprayMode) {
      // Validate water volume with stronger checks
      const water = parseFloat(waterVolume || '')
      if (!Number.isFinite(water) || water <= 0) return false

      // Validate at least one chemical with name
      const validChemicals = chemicals.filter(
        (chem: { id: string; name: string; quantity: string; unit: string }) =>
          chem.name.trim() !== ''
      )
      if (validChemicals.length === 0) return false

      // Validate each chemical has required fields with stronger checks
      for (const chemical of validChemicals) {
        // Name validation
        if (!chemical.name || chemical.name.trim() === '') {
          return false
        }

        // Quantity validation
        const qty = parseFloat(chemical.quantity || '')
        if (!Number.isFinite(qty) || qty <= 0) return false

        // Unit validation with trimming
        if (!chemical.unit || typeof chemical.unit !== 'string' || chemical.unit.trim() === '') {
          return false
        }
      }

      return true
    }

    if (currentLogType === 'fertigation' && multipleFertigationMode) {
      return fertigationEntries.some((entry) => entry.isValid)
    }

    const config = logTypeConfigs[currentLogType]
    for (const field of config.fields) {
      if (field.required) {
        const value = currentFormData[field.name]
        // Check for explicit emptiness instead of truthiness
        if (
          value === undefined ||
          value === null ||
          (typeof value === 'string' && value.trim() === '')
        ) {
          return false
        }

        // Additional validation for numeric fields
        if (field.type === 'number') {
          const numValue = parseFloat(value)
          if (!Number.isFinite(numValue)) return false
          if (field.min !== undefined && numValue < field.min) return false
          if (field.max !== undefined && numValue > field.max) return false
        }
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
      const message = error instanceof Error ? error.message : 'Failed to upload report'
      setReportUploadError(message)
      toast.error(message)
    } finally {
      setIsUploadingReport(false)
      event.target.value = ''
    }
  }

  const validateSprayEntry = (data: Record<string, any>): boolean => {
    const config = logTypeConfigs['spray']
    for (const field of config.fields) {
      if (field.required) {
        const value = data[field.name]
        // Check for explicit emptiness instead of truthiness
        if (
          value === undefined ||
          value === null ||
          (typeof value === 'string' && value.trim() === '')
        ) {
          return false
        }

        // Additional validation for numeric fields
        if (field.type === 'number') {
          const numValue = parseFloat(value)
          if (!Number.isFinite(numValue)) return false
          if (field.min !== undefined && numValue < field.min) return false
          if (field.max !== undefined && numValue > field.max) return false
        }
      }
    }
    return true
  }

  const handleAddSprayEntry = () => {
    if (sprayEntries.length >= 10) return

    const newEntry = {
      id: Date.now().toString(),
      data: {},
      isValid: false
    }
    setSprayEntries((prev) => [...prev, newEntry])
  }

  const handleRemoveSprayEntry = (entryId: string) => {
    if (sprayEntries.length === 1) return
    setSprayEntries((prev) => prev.filter((entry) => entry.id !== entryId))
  }

  const handleSprayEntryChange = (entryId: string, field: string, value: any) => {
    setSprayEntries((prev) =>
      prev.map((entry) => {
        if (entry.id === entryId) {
          const newData = { ...entry.data, [field]: value }
          return {
            ...entry,
            data: newData,
            isValid: validateSprayEntry(newData)
          }
        }
        return entry
      })
    )
  }

  // Chemical management functions
  const handleAddChemical = () => {
    if (chemicals.length >= 10) return
    // Add new chemical and derive display number from current array length
    setChemicals((prev) => [...prev, makeEmptyChemical()])
  }

  const handleRemoveChemical = (id: string) => {
    if (chemicals.length === 1) return
    setChemicals((prev) => prev.filter((chem) => chem.id !== id))
  }

  const handleChemicalChange = (id: string, field: 'name' | 'quantity' | 'unit', value: string) => {
    setChemicals((prev) =>
      prev.map((chem) => {
        if (chem.id === id) {
          return { ...chem, [field]: value }
        }
        return chem
      })
    )
  }

  const validateFertigationEntry = (data: Record<string, any>): boolean => {
    const config = logTypeConfigs['fertigation']
    for (const field of config.fields) {
      if (field.required) {
        const value = data[field.name]
        // Check for explicit emptiness instead of truthiness
        if (
          value === undefined ||
          value === null ||
          (typeof value === 'string' && value.trim() === '')
        ) {
          return false
        }

        // Additional validation for numeric fields
        if (field.type === 'number') {
          const numValue = parseFloat(value)
          if (!Number.isFinite(numValue)) return false
          if (field.min !== undefined && numValue < field.min) return false
          if (field.max !== undefined && numValue > field.max) return false
        }
      }
    }
    return true
  }

  const handleAddFertigationEntry = () => {
    if (fertigationEntries.length >= 10) return

    const newEntry = {
      id: Date.now().toString(),
      data: { unit: 'kg/acre' }, // Set default unit to kg/acre
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

    if (currentLogType === 'spray' && multipleSprayMode) {
      // Handle spray with water volume and multiple chemicals
      const validChemicals = chemicals.filter(
        (chem: { id: string; name: string; quantity: string; unit: string }) =>
          chem.name.trim() !== ''
      )

      type SprayData = {
        water_volume: number
        chemicals: { name: string; quantity: number; unit: string }[]
      }

      // Validate water volume again before processing
      const water = parseFloat(waterVolume || '')
      if (!Number.isFinite(water) || water <= 0) {
        toast.error('Water volume must be a valid number greater than 0')
        return
      }

      const sprayData: SprayData = {
        water_volume: water,
        chemicals: validChemicals.map(
          (chem: { id: string; name: string; quantity: string; unit: string }) => {
            const qty = parseFloat(chem.quantity || '')
            if (!Number.isFinite(qty) || qty <= 0) {
              toast.error(
                `Chemical quantity for "${chem.name}" must be a valid number greater than 0`
              )
              throw new Error(`Invalid chemical quantity: ${chem.quantity}`)
            }

            const trimmedName = chem.name.trim()
            const trimmedUnit = chem.unit.trim()

            if (!trimmedName) {
              toast.error('Chemical name cannot be empty')
              throw new Error('Empty chemical name')
            }

            if (!trimmedUnit) {
              toast.error('Chemical unit cannot be empty')
              throw new Error('Empty chemical unit')
            }

            return {
              name: trimmedName,
              quantity: qty,
              unit: trimmedUnit
            }
          }
        )
      }

      const newSprayLog: LogEntry = {
        id: editingLogId || Date.now().toString() + '_spray',
        type: 'spray',
        data: sprayData,
        isValid: true
      }

      if (editingLogId) {
        // Update existing spray log
        setSessionLogs((prev) => prev.map((log) => (log.id === editingLogId ? newSprayLog : log)))
        setEditingLogId(null)
      } else {
        // Add new spray log
        setSessionLogs((prev) => [...prev, newSprayLog])
      }

      // Reset spray mode
      setCurrentLogType(null)
      setMultipleSprayMode(false)
      setSprayEntries([])
      setWaterVolume('')
      setChemicals([makeEmptyChemical()])
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

    // Handle spray records with chemicals array
    if (log.type === 'spray' && log.data.chemicals && Array.isArray(log.data.chemicals)) {
      // Set water volume
      setWaterVolume(log.data.water_volume?.toString() || '')

      // Convert chemicals array to form format
      const formChemicals = (log.data.chemicals as Chemical[]).map((chem) => ({
        id:
          globalThis.crypto?.randomUUID?.() ??
          `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        name: chem.name || '',
        quantity: chem.quantity?.toString() || '',
        unit: chem.unit || 'gm/L'
      }))
      setChemicals(formChemicals)
      setMultipleSprayMode(true)
    } else {
      setCurrentFormData({ ...log.data })
    }

    setCurrentReport(log.meta?.report || null)
    setReportUploadError(null)
  }

  const handleRemoveLog = (logId: string) => {
    const log = sessionLogs.find((l) => l.id === logId)
    if (!log) return

    // Check if this is an existing log (has a real database ID)
    const isExistingLog =
      mode === 'edit' && normalizedExistingLogs.some((existingLog) => existingLog.id === logId)

    if (isExistingLog) {
      // Show confirmation dialog for existing logs
      setDeleteConfirm({
        isOpen: true,
        logId,
        logType: log.type,
        isLoading: false
      })
    } else {
      // Remove new logs immediately without confirmation
      setSessionLogs((prev) => prev.filter((l) => l.id !== logId))
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.logId || !deleteConfirm.logType || !farmId) return

    setDeleteConfirm((prev) => ({ ...prev, isLoading: true }))

    try {
      // Extract the real database ID from the log ID
      const realLogId = deleteConfirm.logId.replace(/_spray$|_fertigation$/, '')

      // Use the unified deletion helper
      await SupabaseService.deleteLogByType(deleteConfirm.logType, parseInt(realLogId))

      // Remove from local state
      setSessionLogs((prev) => prev.filter((log) => log.id !== deleteConfirm.logId))

      // Close confirmation dialog
      setDeleteConfirm({
        isOpen: false,
        logId: null,
        logType: null,
        isLoading: false
      })

      toast.success(`${getLogTypeLabel(deleteConfirm.logType)} record deleted successfully`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete record'
      toast.error(message)
      setDeleteConfirm((prev) => ({ ...prev, isLoading: false }))
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirm({
      isOpen: false,
      logId: null,
      logType: null,
      isLoading: false
    })
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
    if (farmOptions !== undefined && farmOptions.length > 0 && !farmId) {
      toast.error('Select a farm before saving logs')
      return
    }
    onSubmit(sessionLogs, selectedDateToUse, dayNotes, dayPhotos)
  }

  const renderSprayEntryField = (
    entry: { id: string; data: Record<string, any>; isValid: boolean },
    field: FormField
  ) => {
    const value = entry.data[field.name] || ''

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
              onValueChange={(newValue) => handleSprayEntryChange(entry.id, field.name, newValue)}
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
              onChange={(e) => handleSprayEntryChange(entry.id, field.name, e.target.value)}
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
              onChange={(e) => handleSprayEntryChange(entry.id, field.name, e.target.value)}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              className="h-9"
            />
          </div>
        )
    }
  }

  const renderFertigationEntryField = (
    entry: { id: string; data: Record<string, any>; isValid: boolean },
    field: FormField
  ) => {
    const value = entry.data[field.name] || ''

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
              onChange={(e) => {
                const inputValue = e.target.value
                // For quantity field, allow empty string to be stored as is
                if (field.name === 'quantity') {
                  handleFertigationEntryChange(entry.id, field.name, inputValue)
                } else {
                  // For other number fields, convert empty to 0
                  handleFertigationEntryChange(
                    entry.id,
                    field.name,
                    inputValue === '' ? '0' : inputValue
                  )
                }
              }}
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
    const value = currentFormData[field.name] || ''

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
              type={field.name === 'duration' ? 'text' : 'number'}
              value={value}
              onChange={(e) => {
                const inputValue = e.target.value

                // Special handling for duration field to prevent zero insertion bug
                if (field.name === 'duration') {
                  // Allow empty input or valid numbers
                  if (
                    inputValue === '' ||
                    (!isNaN(parseFloat(inputValue)) &&
                      parseFloat(inputValue) > 0 &&
                      (field.max === undefined || parseFloat(inputValue) <= field.max))
                  ) {
                    setCurrentFormData((prev) => ({
                      ...prev,
                      [field.name]: inputValue
                    }))
                  }
                } else {
                  // For quantity field, allow empty string to be stored as is
                  if (field.name === 'quantity') {
                    setCurrentFormData((prev) => ({
                      ...prev,
                      [field.name]: inputValue
                    }))
                  } else {
                    // For other number fields, convert empty to 0
                    setCurrentFormData((prev) => ({
                      ...prev,
                      [field.name]: inputValue === '' ? '0' : inputValue
                    }))
                  }
                }
              }}
              onBlur={(e) => {
                const inputValue = e.target.value

                // Special validation for duration field on blur
                if (field.name === 'duration') {
                  if (
                    inputValue === '' ||
                    (!isNaN(parseFloat(inputValue)) &&
                      parseFloat(inputValue) > 0 &&
                      (field.max === undefined || parseFloat(inputValue) <= field.max))
                  ) {
                    setCurrentFormData((prev) => ({
                      ...prev,
                      [field.name]: inputValue
                    }))
                  }
                }
              }}
              onFocus={(e) => {
                // Select all text on focus for duration field to make editing easier
                if (field.name === 'duration') {
                  e.target.select()
                }
              }}
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
      <div className="rounded-lg border border-dashed border-gray-300 p-3 space-y-2">
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
      <DialogContent
        className="max-w-2xl max-h-[90vh] md:max-h-[85vh] flex flex-col touch-auto"
        style={{
          WebkitOverflowScrolling: 'touch',
          userSelect: 'auto',
          WebkitUserSelect: 'auto',
          touchAction: 'pan-y'
        }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            {mode === 'edit' ? 'Edit Data Logs' : 'Add Data Logs'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {farmOptions?.length ? (
            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-700">Farm</Label>
              <Select
                value={(farmId ?? selectedFarmId)?.toString() || ''}
                onValueChange={(value) => onFarmChange?.(parseInt(value, 10))}
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select farm" />
                </SelectTrigger>
                <SelectContent>
                  {farmOptions.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id.toString()}>
                      {farm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {/* Date Selector */}
          <div className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">Date</Label>
            <Input
              type="date"
              value={selectedDateToUse}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="h-9"
              disabled={mode === 'edit'}
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
                          <p className="font-medium text-sm">
                            {(() => {
                              // Handle spray records with meaningful display
                              if (log.type === 'spray') {
                                const chemicals = log.data.chemicals as Chemical[]
                                if (chemicals && Array.isArray(chemicals) && chemicals.length > 0) {
                                  const chemicalNames = chemicals
                                    .filter((chem) => chem.name && chem.name.trim())
                                    .map((chem) => chem.name.trim())
                                  if (chemicalNames.length > 0) {
                                    // Show 1-2 chemicals with truncation for mobile
                                    const displayChemicals = chemicalNames.slice(0, 2)
                                    let chemicalDisplay = displayChemicals.join(', ')

                                    // Add indicator if there are more chemicals
                                    if (chemicalNames.length > 2) {
                                      chemicalDisplay += ` +${chemicalNames.length - 2}`
                                    }

                                    // Truncate if too long for mobile
                                    const maxLength = 25 // Mobile-friendly length
                                    if (chemicalDisplay.length > maxLength) {
                                      chemicalDisplay =
                                        chemicalDisplay.substring(0, maxLength - 3) + '...'
                                    }

                                    return chemicalDisplay
                                  }
                                }
                                // Fallback for old format
                                if (log.data.chemical && log.data.chemical.trim()) {
                                  let chemicalDisplay = log.data.chemical.trim()
                                  // Truncate if too long for mobile
                                  const maxLength = 25 // Mobile-friendly length
                                  if (chemicalDisplay.length > maxLength) {
                                    chemicalDisplay =
                                      chemicalDisplay.substring(0, maxLength - 3) + '...'
                                  }
                                  return chemicalDisplay
                                }
                              }

                              // For other log types, use the standard label
                              return getLogTypeLabel(log.type)
                            })()}
                          </p>
                          <p className="text-xs text-gray-600">
                            {(() => {
                              // Handle spray records with additional details
                              if (log.type === 'spray') {
                                const chemicals = log.data.chemicals as Chemical[]
                                const waterVolume = log.data.water_volume
                                const parts = []

                                if (chemicals && Array.isArray(chemicals) && chemicals.length > 0) {
                                  const validChemicals = chemicals.filter(
                                    (chem) => chem.name && chem.name.trim()
                                  )
                                  if (validChemicals.length > 0) {
                                    // Show quantities for the first chemical only to save space
                                    const firstChem = validChemicals[0]
                                    parts.push(`${firstChem.quantity} ${firstChem.unit}`)
                                    if (validChemicals.length > 1) {
                                      parts.push(`${validChemicals.length} chemicals`)
                                    }
                                  }
                                } else if (log.data.chemical && log.data.chemical.trim()) {
                                  parts.push(log.data.chemical.trim())
                                }

                                if (waterVolume && waterVolume > 0) {
                                  parts.push(`${waterVolume}L water`)
                                }

                                return parts.join(' • ') || 'Spray record'
                              }

                              // Handle other log types
                              const entries = Object.entries(log.data).filter(([, value]) => value)
                              return entries
                                .map(([key, value]) => {
                                  // Skip technical fields
                                  if (
                                    [
                                      'id',
                                      'farm_id',
                                      'created_at',
                                      'updated_at',
                                      'chemicals',
                                      'chemical',
                                      'water_volume'
                                    ].includes(key)
                                  ) {
                                    return null
                                  }
                                  if (key === 'fertilizer') return `Fertilizer: ${value}`
                                  if (key === 'duration') return `Duration: ${value} hrs`
                                  if (key === 'quantity') return `Quantity: ${value} kg`
                                  if (key === 'cost') return `Cost: ₹${value}`
                                  return `${key.replace(/_/g, ' ')}: ${value}`
                                })
                                .filter(Boolean)
                                .slice(0, 2)
                                .join(', ')
                            })()}
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

          {/* Empty State - When all logs are deleted */}
          {sessionLogs.length === 0 && mode === 'edit' && (
            <Card className="border-2 border-dashed border-amber-300 bg-amber-50">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <Trash2 className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-amber-800">All Logs Deleted</h3>
                    <p className="text-xs text-amber-600 mt-1">
                      You&apos;ve removed all logs for this date. You can add new logs or close this
                      modal.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentLogType(null)}
                      className="border-amber-200 text-amber-700 hover:bg-amber-100"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add New Log
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="text-amber-700 hover:bg-amber-100"
                    >
                      Close Modal
                    </Button>
                  </div>
                </div>
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
                  {currentLogType === 'spray' && multipleSprayMode && (
                    <Badge variant="outline" className="ml-2">
                      {chemicals.length}/10 chemicals
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
                {currentLogType === 'spray' && multipleSprayMode ? (
                  <div className="space-y-4">
                    {/* Water Volume Field */}
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-700">
                          Water Volume (L)
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          type="number"
                          value={waterVolume}
                          onChange={(e) => setWaterVolume(e.target.value)}
                          placeholder="e.g., 1000"
                          min={0.1}
                          step={0.1}
                          className="h-9"
                        />
                        {waterVolume &&
                          (!Number.isFinite(parseFloat(waterVolume)) ||
                            parseFloat(waterVolume) <= 0) && (
                            <p className="text-xs text-red-600 mt-1">
                              Water volume must be a valid number greater than 0
                            </p>
                          )}
                      </div>
                    </div>

                    {/* Chemicals Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-gray-700">
                          Chemical Elements
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Badge variant="outline" className="text-xs">
                          {chemicals.length}/10
                        </Badge>
                      </div>

                      {chemicals.map(
                        (
                          chemical: { id: string; name: string; quantity: string; unit: string },
                          index: number
                        ) => (
                          <Card
                            key={chemical.id}
                            className="bg-gray-50 border-2 border-dashed border-gray-200"
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <span className="text-green-600">🧪</span>
                                  Chemical {index + 1}
                                  {chemical.name.trim() && chemical.quantity && (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  )}
                                </CardTitle>
                                {chemicals.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveChemical(chemical.id)}
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              {/* Chemical Name */}
                              <div className="space-y-1">
                                <Label className="text-xs font-medium text-gray-600">
                                  Chemical Name
                                  <span className="text-red-500 ml-1">*</span>
                                </Label>
                                <Input
                                  type="text"
                                  value={chemical.name}
                                  onChange={(e) =>
                                    handleChemicalChange(chemical.id, 'name', e.target.value)
                                  }
                                  placeholder="e.g., Sulfur fungicide"
                                  maxLength={1000}
                                  className="h-8 text-sm"
                                />
                                {chemical.name && chemical.name.trim() === '' && (
                                  <p className="text-xs text-red-600 mt-1">
                                    Chemical name cannot be empty
                                  </p>
                                )}
                              </div>

                              {/* Quantity and Unit Row */}
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium text-gray-600">
                                    Quantity
                                    <span className="text-red-500 ml-1">*</span>
                                  </Label>
                                  <Input
                                    type="number"
                                    value={chemical.quantity}
                                    onChange={(e) =>
                                      handleChemicalChange(chemical.id, 'quantity', e.target.value)
                                    }
                                    placeholder="e.g., 500"
                                    min={0.1}
                                    step={0.1}
                                    className="h-8 text-sm"
                                  />
                                  {chemical.quantity &&
                                    (!Number.isFinite(parseFloat(chemical.quantity)) ||
                                      parseFloat(chemical.quantity) <= 0) && (
                                      <p className="text-xs text-red-600 mt-1">
                                        Quantity must be a valid number greater than 0
                                      </p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-xs font-medium text-gray-600">
                                    Unit
                                    <span className="text-red-500 ml-1">*</span>
                                  </Label>
                                  <Select
                                    value={chemical.unit}
                                    onValueChange={(value) =>
                                      handleChemicalChange(chemical.id, 'unit', value)
                                    }
                                  >
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="gm/L">gm/L</SelectItem>
                                      <SelectItem value="ml/L">ml/L</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      )}

                      {/* Add Chemical Button */}
                      {chemicals.length < 10 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddChemical}
                          className="w-full border-dashed"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Another Chemical
                        </Button>
                      )}
                    </div>

                    {/* Save Spray Button */}
                    <Button
                      onClick={handleAddLogEntry}
                      disabled={!validateCurrentForm()}
                      className="w-full"
                    >
                      Save Spray Record ({chemicals.filter((c) => c.name.trim() !== '').length}{' '}
                      chemicals)
                    </Button>
                  </div>
                ) : currentLogType === 'fertigation' && multipleFertigationMode ? (
                  <div className="space-y-4">
                    {fertigationEntries.map((entry, index) => (
                      <Card
                        key={entry.id}
                        className="bg-gray-50 border-2 border-dashed border-gray-200"
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
        <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t">
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
              disabled={
                sessionLogs.length === 0 ||
                isSubmitting ||
                (farmOptions !== undefined && farmOptions.length > 0 && !farmId)
              }
              className="flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save All Logs ({sessionLogs.length})
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.isOpen} onOpenChange={(open) => !open && handleCancelDelete()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {deleteConfirm.logType ? getLogTypeLabel(deleteConfirm.logType) : 'Record'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this{' '}
              {deleteConfirm.logType ? getLogTypeLabel(deleteConfirm.logType) : 'record'}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={deleteConfirm.isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteConfirm.isLoading}
            >
              {deleteConfirm.isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
