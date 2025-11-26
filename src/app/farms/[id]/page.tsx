'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MouseEvent } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { SupabaseService } from '@/lib/supabase-service'
import { FarmHeader, type FarmWeatherSummary } from '@/components/farm-details/FarmHeader'
import { ActivityFeed } from '@/components/farm-details/ActivityFeed'
import { UnifiedDataLogsModal } from '@/components/farm-details/UnifiedDataLogsModal'
import type { ReportAttachmentMeta } from '@/types/reports'
import { WaterCalculationModal } from '@/components/farm-details/WaterCalculationModal'
import { FarmModal } from '@/components/farm-details/forms/FarmModal'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import type { Farm, TaskReminder } from '@/types/types'
import { capitalize, cn } from '@/lib/utils'
import { transformActivitiesToLogEntries } from '@/lib/activity-display-utils'
import { logger } from '@/lib/logger'
import { OpenMeteoWeatherService } from '@/lib/open-meteo-weather'
import { WEATHER_THRESHOLDS } from '@/constants/weather'
import { toast } from 'sonner'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Brain,
  ChevronDown,
  Droplets,
  FlaskConical,
  NotebookText,
  X
} from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { checkTestReminders } from '@/lib/lab-test-integration'
import {
  parseFarmId,
  shouldUseSingleEditModal,
  extractDailyNoteFromActivities,
  handleDailyNotesAndPhotosAfterLogs
} from '@/lib/daily-note-utils'
import { TasksOverviewCard } from '@/components/tasks/TasksOverviewCard'

interface DashboardData {
  farm: Farm | null
  pendingTasksCount: number
  recentIrrigations: any[]
  recentActivities: any[]
  totalHarvest: number
  totalWaterUsage: number
  pendingTasks: TaskReminder[]
  recordCounts: {
    irrigation: number
    spray: number
    fertigation: number
    harvest: number
    expense: number
    soilTest: number
    petioleTest: number
    dailyNotes: number
  }
}

export default function FarmDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const farmId = params.id as string

  const [dashboardData, setDashboardData] = useState<DashboardData>()
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [weatherSummary, setWeatherSummary] = useState<FarmWeatherSummary | null>(null)
  const [allFarms, setAllFarms] = useState<Farm[]>([])
  const [insightsOpen, setInsightsOpen] = useState(true)
  const [readinessOpen, setReadinessOpen] = useState(true)
  const [labTestSignal, setLabTestSignal] = useState<{
    status: string
    message: string
    pill?: string
  } | null>(null)
  const dismissalStorageKey = `field-signal-dismissals:${farmId}`
  const [dismissedSignals, setDismissedSignals] = useState<Record<string, number>>({})
  const updateDismissedSignals = useCallback(
    (updater: (prev: Record<string, number>) => Record<string, number>) => {
      setDismissedSignals((prev) => {
        const next = updater(prev)
        if (next === prev) return prev
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(dismissalStorageKey, JSON.stringify(next))
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Failed to persist field signal dismissals', error)
            }
          }
        }
        return next
      })
    },
    [dismissalStorageKey]
  )

  const handleDismissSignal = useCallback(
    (label: string) => {
      updateDismissedSignals((prev) => {
        if (prev[label]) return prev
        return { ...prev, [label]: Date.now() }
      })
    },
    [updateDismissedSignals]
  )

  const resetDismissedSignal = useCallback(
    (label: string) => {
      updateDismissedSignals((prev) => {
        if (!prev[label]) return prev
        const next = { ...prev }
        delete next[label]
        return next
      })
    },
    [updateDismissedSignals]
  )

  // Modal states
  const [showDataLogsModal, setShowDataLogsModal] = useState(false)
  const [showWaterCalculationModal, setShowWaterCalculationModal] = useState(false)
  const [deletingRecord, setDeletingRecord] = useState<any>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Edit mode state for UnifiedDataLogsModal
  const [editModeLogs, setEditModeLogs] = useState<any[]>([])
  const [editModeDate, setEditModeDate] = useState<string>('')
  const [editMode, setEditMode] = useState<'add' | 'edit'>('add')
  const [editModeDayNote, setEditModeDayNote] = useState<{
    id: number | null
    notes: string
  } | null>(null)

  // Farm edit modal states
  const [showFarmModal, setShowFarmModal] = useState(false)
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null)
  const [farmSubmitLoading, setFarmSubmitLoading] = useState(false)

  // AI Features state
  const [aiPredictionsGenerated, setAiPredictionsGenerated] = useState(false)
  const isMobile = useIsMobile()

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await SupabaseService.getDashboardSummary(parseInt(farmId))
      setDashboardData({
        ...data,
        farm: data.farm
      })
    } catch (error) {
      logger.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [farmId])

  // Load all farms for farm switcher
  useEffect(() => {
    let isMounted = true

    const loadAllFarms = async () => {
      try {
        const farms = await SupabaseService.getAllFarms()
        if (isMounted) {
          setAllFarms(farms)
        }
      } catch (error) {
        logger.error('Error loading all farms:', error)
      }
    }

    loadAllFarms()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (isMobile) {
      setInsightsOpen(false)
      setReadinessOpen(false)
    } else {
      setInsightsOpen(true)
      setReadinessOpen(true)
    }
  }, [isMobile])

  useEffect(() => {
    let isMounted = true

    const fetchLabTestSignal = async () => {
      try {
        const farmIdNum = Number.parseInt(farmId, 10)
        if (!Number.isFinite(farmIdNum)) return
        const reminders = await checkTestReminders(farmIdNum)
        if (!isMounted) return

        if (reminders.soilTestNeeded || reminders.petioleTestNeeded) {
          const isSoil = reminders.soilTestNeeded
          const age = isSoil ? reminders.soilTestAge : reminders.petioleTestAge
          const status = isSoil ? 'Soil test due' : 'Petiole test due'
          const ageText = age
            ? `${age} days ago`
            : isSoil
              ? 'over 2 years ago'
              : 'over 3 months ago'
          setLabTestSignal({
            status,
            message: `Last test ${ageText}`,
            pill: 'Due'
          })
        } else {
          setLabTestSignal(null)
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Lab test reminder signal error:', error)
        }
        if (isMounted) {
          setLabTestSignal(null)
        }
      }
    }

    fetchLabTestSignal()

    return () => {
      isMounted = false
    }
  }, [farmId])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = window.localStorage.getItem(dismissalStorageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && typeof parsed === 'object') {
          setDismissedSignals(parsed)
          return
        }
      }
      setDismissedSignals({})
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load field signal dismissals', error)
      }
      setDismissedSignals({})
    }
  }, [dismissalStorageKey])

  useEffect(() => {
    if (farmId) {
      loadDashboardData()
    }
  }, [farmId, loadDashboardData])

  // Handle edit parameters from logs page
  useEffect(() => {
    const action = searchParams.get('action')
    const logIdParam = searchParams.get('logId')
    const date = searchParams.get('date')
    const activitiesParam = searchParams.get('activities')

    // Guard clause: Only proceed if we have the necessary data
    if ((action === 'edit-log' || action === 'delete-log') && logIdParam) {
      // For edit-log and delete-log actions, we need recentActivities to be available
      if (dashboardData?.recentActivities === undefined) {
        // Data not yet available, return early to let the effect re-run when data arrives
        return
      }
    }

    // Additional guard clause: Prevent router.replace() from clearing action parameters until dashboardData.recentActivities is loaded
    if (dashboardData?.recentActivities === undefined) {
      // Data not yet available, return early to let the effect re-run when data arrives
      return
    }

    if (action === 'edit' && date && activitiesParam) {
      try {
        const activities = JSON.parse(decodeURIComponent(activitiesParam))
        const dayNoteActivity = activities.find((act: any) => act.type === 'daily_note')
        if (dayNoteActivity) {
          setEditModeDayNote({
            id: dayNoteActivity.id ?? null,
            notes: dayNoteActivity.notes || ''
          })
        } else {
          setEditModeDayNote(null)
        }
        const logActivities = activities.filter((act: any) => act.type !== 'daily_note')
        const existingLogs = transformActivitiesToLogEntries(logActivities)

        // Normalize date to ISO format (YYYY-MM-DD) for proper handling
        const normalizedDate = date
          ? new Date(date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]

        // Set up the edit modal with existing logs
        setEditModeLogs(existingLogs)
        setEditModeDate(normalizedDate)
        setEditMode('edit')
        setShowDataLogsModal(true)

        // Clear the URL parameters
        router.replace(`/farms/${farmId}`, { scroll: false })
      } catch (error) {
        logger.error('Error parsing edit parameters:', error)
      }
    } else if (action === 'add-log') {
      const today = new Date().toISOString().split('T')[0]
      setEditModeLogs([])
      setEditModeDate(today)
      setEditMode('add')
      setEditModeDayNote(null)
      setShowDataLogsModal(true)
      router.replace(`/farms/${farmId}`, { scroll: false })
    } else if (action === 'edit-log' && logIdParam) {
      const logId = Number.parseInt(logIdParam, 10)
      if (Number.isFinite(logId)) {
        const activity = dashboardData?.recentActivities?.find((act: any) => act.id === logId)
        if (activity) {
          // Open the unified modal with the single activity
          handleEditDateGroup(activity.date, [activity])
          // Only clear URL parameters after successfully processing the action
          router.replace(`/farms/${farmId}`, { scroll: false })
        } else {
          // Activity not found, log warning and clear URL parameters to prevent infinite loop
          console.warn(`Activity with ID ${logId} not found`)
          router.replace(`/farms/${farmId}`, { scroll: false })
        }
      } else {
        // Invalid logId, clear URL parameters
        console.warn(`Invalid logId: ${logIdParam}`)
        router.replace(`/farms/${farmId}`, { scroll: false })
      }
    } else if (action === 'delete-log' && logIdParam) {
      const logId = Number.parseInt(logIdParam, 10)
      if (Number.isFinite(logId)) {
        const activity = dashboardData?.recentActivities?.find((act: any) => act.id === logId)
        if (activity) {
          handleDeleteRecord(activity as any)
          // Only clear URL parameters after successfully processing the action
          router.replace(`/farms/${farmId}`, { scroll: false })
        } else {
          // Activity not found, log warning and clear URL parameters to prevent infinite loop
          console.warn(`Activity with ID ${logId} not found`)
          router.replace(`/farms/${farmId}`, { scroll: false })
        }
      } else {
        // Invalid logId, clear URL parameters
        console.warn(`Invalid logId: ${logIdParam}`)
        router.replace(`/farms/${farmId}`, { scroll: false })
      }
    }
  }, [searchParams, farmId, router, dashboardData])

  // Generate AI predictions when farm data is loaded
  // useEffect(() => {
  //   const generateAIPredictions = async () => {
  //     if (dashboardData?.farm && user && !aiPredictionsGenerated) {
  //       try {
  //         await PestPredictionService.generatePredictions(parseInt(farmId), dashboardData.farm)
  //         setAiPredictionsGenerated(true)
  //       } catch (error) {
  //         console.error('Error generating AI predictions:', error)
  //       }
  //     }
  //   }

  //   generateAIPredictions()
  // }, [dashboardData, farmId, user, aiPredictionsGenerated])

  // Unified handler for all data logs
  const handleDataLogsSubmit = async (
    logs: any[],
    date: string,
    dayNotes: string,
    dayPhotos: File[],
    existingDailyNoteId?: number | null
  ) => {
    setIsSubmitting(true)
    try {
      const farmIdNum = parseFarmId(farmId)
      let firstRecordId: number | null = null

      for (let i = 0; i < logs.length; i++) {
        const logEntry = logs[i]
        try {
          // For edit mode, use the original date from the log entry data to preserve it
          const dateToUse = editMode === 'edit' ? logEntry.data?.date || date : date
          const record =
            editMode === 'edit'
              ? await updateLogEntry(logEntry, dateToUse, dayNotes)
              : await saveLogEntry(logEntry, dateToUse, dayNotes)

          // Store first record ID for photo upload
          if (i === 0 && record?.id) {
            firstRecordId = record.id
          }
        } catch (logError) {
          logger.error(`Error saving ${logEntry.type} log entry:`, logError)
          const errorMsg = logError instanceof Error ? logError.message : 'Unknown error'
          const logTypeLabel = logEntry.type.replace(/_/g, ' ')
          throw new Error(`Failed to save ${logTypeLabel} record: ${errorMsg}`)
        }
      }

      // Handle daily notes and photos based on whether logs exist
      await handleDailyNotesAndPhotosAfterLogs({
        logs,
        dayNotes,
        dayPhotos,
        firstRecordId,
        existingDailyNoteId: existingDailyNoteId ?? null,
        farmId: farmIdNum,
        date
      })

      await loadDashboardData()
      toast.success('Data logs saved successfully')
      setShowDataLogsModal(false)
      setEditModeDayNote(null)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Error saving data logs: ${errorMsg}`)
      logger.error('Error saving data logs:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const saveLogEntry = async (logEntry: any, date: string, dayNotes: string) => {
    const { type, data } = logEntry
    let record

    switch (type) {
      case 'irrigation': {
        // Validate required farm data is available
        if (!dashboardData?.farm) {
          throw new Error('Farm data not loaded. Please refresh the page and try again.')
        }

        const duration = parseFloat(data.duration || '')
        if (!Number.isFinite(duration) || duration <= 0) {
          throw new Error('Irrigation duration is required and must be greater than 0')
        }

        const area = parseFloat(data.area || '') || dashboardData.farm.area
        if (!Number.isFinite(area) || area <= 0) {
          throw new Error('Irrigation area must be greater than 0')
        }

        record = await SupabaseService.addIrrigationRecord({
          farm_id: parseInt(farmId),
          date: date,
          duration: duration,
          area: area,
          growth_stage: 'Active',
          moisture_status: 'Good',
          system_discharge: dashboardData?.farm?.systemDischarge || 100,
          notes: data.notes || '',
          date_of_pruning: dashboardData.farm.dateOfPruning
        })

        if (record && dashboardData?.farm) {
          try {
            const duration = parseFloat(data.duration || '0')
            const systemDischarge = Number(
              record.system_discharge ?? dashboardData.farm.systemDischarge ?? 100
            )
            const waterAdded = duration * systemDischarge
            const currentWaterLevel = Number(dashboardData.farm.remainingWater ?? 0)
            const newWaterLevel = currentWaterLevel + waterAdded

            await SupabaseService.updateFarm(parseInt(farmId), {
              remainingWater: newWaterLevel,
              waterCalculationUpdatedAt: new Date().toISOString()
            })

            logger.info('Water level updated successfully', {
              farmId,
              duration,
              systemDischarge,
              waterAdded,
              currentWaterLevel,
              newWaterLevel
            })
          } catch (waterError) {
            logger.error('Failed to update soil water level:', {
              error: waterError,
              farmId,
              irrigationRecord: record
            })
            toast.error(
              'Irrigation saved but failed to update soil water level. Please report this issue.'
            )
          }
        } else {
          logger.error('Cannot update soil water level - missing record or farm data', {
            hasRecord: !!record,
            hasFarm: !!dashboardData?.farm,
            farmId
          })
          toast.error(
            'Irrigation saved but soil water level was not updated. Please report this issue.'
          )
        }
        break
      }

      case 'spray': {
        if (!dashboardData?.farm) {
          throw new Error('Farm data not loaded. Please refresh the page and try again.')
        }

        // Handle spray record with chemicals array (new format) or single chemical (old format)
        const sprayData: any = {
          farm_id: parseInt(farmId),
          date: date,
          chemicals: [],
          area: dashboardData.farm.area,
          weather: 'Clear',
          operator: 'Farm Owner',
          notes: data.notes || '',
          date_of_pruning: dashboardData.farm.dateOfPruning
        }

        // Only add water_volume if it's a valid positive number
        const waterVolume = parseFloat(data.water_volume ?? '')
        if (Number.isFinite(waterVolume) && waterVolume > 0) {
          sprayData.water_volume = waterVolume
        }

        // Handle legacy single chemical format for backward compatibility
        if (data.chemicals && Array.isArray(data.chemicals) && data.chemicals.length > 0) {
          // New format: use chemicals array, ensure quantities are numbers
          sprayData.chemicals = data.chemicals.map((chem: any) => {
            const isString = typeof chem.quantity === 'string'
            const qty = isString ? parseFloat(chem.quantity) : chem.quantity

            if (!Number.isFinite(qty) || qty <= 0) {
              const chemName = chem.name || 'Unknown'
              const msg = `Chemical "${chemName}" quantity must be a valid number greater than 0`
              throw new Error(msg)
            }

            return {
              name: chem.name,
              quantity: qty,
              unit: chem.unit
            }
          })

          // Set first chemical as primary for backward compatibility
          const firstChemical = sprayData.chemicals[0]
          sprayData.chemical = firstChemical.name || 'Unknown'
          sprayData.quantity_amount = firstChemical.quantity
          sprayData.quantity_unit = firstChemical.unit || 'gm/L'
          sprayData.dose = `${firstChemical.quantity}${firstChemical.unit || 'gm/L'}`
        } else {
          // Old format: single chemical
          sprayData.chemical = data.chemical?.trim() || 'Unknown'
          sprayData.quantity_amount = data.quantity_amount ? parseFloat(data.quantity_amount) : 0
          sprayData.quantity_unit = data.quantity_unit || 'gm/L'
          sprayData.dose =
            data.quantity_amount && data.quantity_unit
              ? `${data.quantity_amount}${data.quantity_unit}`
              : 'As per label'
        }

        record = await SupabaseService.addSprayRecord(sprayData)
        break
      }

      case 'harvest':
        record = await SupabaseService.addHarvestRecord({
          farm_id: parseInt(farmId),
          date: date,
          quantity: parseFloat(data.quantity || '0'),
          grade: data.grade || 'Standard',
          price: 0,
          buyer: '',
          notes: data.notes || '',
          date_of_pruning: dashboardData?.farm?.dateOfPruning
        })
        break

      case 'expense':
        record = await SupabaseService.addExpenseRecord({
          farm_id: parseInt(farmId),
          date: date,
          type: data.type || 'other',
          cost: parseFloat(data.cost || '0'),
          remarks: data.remarks || data.notes || '',
          date_of_pruning: dashboardData?.farm?.dateOfPruning
        })
        break

      case 'fertigation': {
        // Whitelist of allowed units for fertigation (defense-in-depth)
        const ALLOWED_FERTIGATION_UNITS = ['kg/acre', 'liter/acre'] as const

        const validateFertigationUnit = (unit: string): 'kg/acre' | 'liter/acre' => {
          const normalized = unit.trim().toLowerCase()

          // Find matching allowed unit (case-insensitive)
          for (const allowedUnit of ALLOWED_FERTIGATION_UNITS) {
            if (allowedUnit.toLowerCase() === normalized) {
              // Return the canonical allowed unit
              return allowedUnit
            }
          }

          // If no match found, throw error
          throw new Error(`Invalid fertigation unit: "${unit}". Allowed units: kg/acre, liter/acre`)
        }

        // Validate all fertilizers before creating the record
        const validatedFertilizers = data.fertilizers.map(
          (fertilizer: { name: string; quantity: number; unit: string }) => {
            // Validate unit against whitelist
            const validatedUnit = validateFertigationUnit(fertilizer.unit || 'kg/acre')

            return {
              name: fertilizer.name?.trim() || 'Unknown',
              quantity: fertilizer.quantity || 0,
              unit: validatedUnit
            }
          }
        )

        // Create a single fertigation record with the fertilizers array
        // Only include area if it's a valid positive number
        const farmArea = dashboardData?.farm?.area
        const payload: any = {
          farm_id: parseInt(farmId),
          date: date,
          fertilizers: validatedFertilizers,
          notes: data.notes || '',
          date_of_pruning: dashboardData?.farm?.dateOfPruning
        }

        // Only include area if it's a valid positive number
        if (typeof farmArea === 'number' && farmArea > 0) {
          payload.area = farmArea
        }

        record = await SupabaseService.addFertigationRecord(payload)
        break
      }

      case 'soil_test': {
        const reportMeta = (logEntry.meta?.report || null) as ReportAttachmentMeta | null

        const combineNotes = [data.notes || '']
        if (reportMeta?.summary) combineNotes.push(reportMeta.summary)

        const parsedParameters = reportMeta?.parsedParameters || {}
        const combinedParameters: Record<string, number> = {}

        const mapSoilKey = (key: string) => {
          const normalized = key.toLowerCase()
          // Create stripped version by removing separators for compound name matching
          const stripped = normalized.replace(/[_\-\s]/g, '')

          if (normalized === 'ph' || normalized === 'soilph') return 'pH'

          if (normalized === 'nitrogen' || normalized === 'n') return 'nitrogen'
          if (normalized === 'phosphorus' || normalized === 'p') return 'phosphorus'
          if (normalized === 'potassium' || normalized === 'k') return 'potassium'

          if (
            normalized === 'ec' ||
            stripped === 'electricalconductivity' ||
            normalized === 'soilec'
          )
            return 'ec'

          if (stripped === 'calciumcarbonate' || stripped === 'caco3') return 'calciumCarbonate'
          if (stripped === 'organiccarbon' || normalized === 'oc') return 'organicCarbon'
          if (stripped === 'organicmatter') return 'organicMatter'

          if (stripped === 'calcium') return 'calcium'
          if (stripped === 'magnesium') return 'magnesium'
          if (stripped === 'sulphur' || stripped === 'sulfur' || normalized === 's') return 'sulfur'
          if (stripped === 'iron' || stripped === 'ferrous') return 'iron'
          if (stripped === 'manganese') return 'manganese'
          if (stripped === 'zinc') return 'zinc'
          if (stripped === 'copper') return 'copper'
          if (stripped === 'boron') return 'boron'
          if (stripped === 'molybdenum') return 'molybdenum'
          if (stripped === 'sodium') return 'sodium'
          if (stripped === 'chloride') return 'chloride'

          if (stripped === 'bicarbonate' || normalized === 'hco3') return 'bicarbonate'
          if (stripped === 'carbonate' || normalized === 'co3') return 'carbonate'

          return key
        }

        Object.entries(parsedParameters).forEach(([key, value]) => {
          let numericValue: number | undefined
          if (typeof value === 'number') {
            numericValue = Number.isFinite(value) ? value : undefined
          } else if (typeof value === 'string') {
            const parsed = parseFloat(value)
            numericValue = Number.isFinite(parsed) ? parsed : undefined
          }

          if (numericValue === undefined) return
          const mappedKey = mapSoilKey(key)
          combinedParameters[mappedKey] = numericValue
        })

        const manualEntries: Array<[string, number]> = [
          ['pH', parseFloat(data.ph ?? '')],
          ['ec', parseFloat(data.ec ?? '')],
          ['organicCarbon', parseFloat(data.organicCarbon ?? '')],
          ['organicMatter', parseFloat(data.organicMatter ?? '')],
          ['nitrogen', parseFloat(data.nitrogen ?? '')],
          ['phosphorus', parseFloat(data.phosphorus ?? '')],
          ['potassium', parseFloat(data.potassium ?? '')]
        ]

        const additionalEntries: Array<[string, number]> = [
          ['calcium', parseFloat(data.calcium ?? '')],
          ['magnesium', parseFloat(data.magnesium ?? '')],
          ['sulfur', parseFloat(data.sulfur ?? data.sulphur ?? '')],
          ['iron', parseFloat(data.iron ?? data.ferrous ?? '')],
          ['manganese', parseFloat(data.manganese ?? '')],
          ['zinc', parseFloat(data.zinc ?? '')],
          ['copper', parseFloat(data.copper ?? '')],
          ['boron', parseFloat(data.boron ?? '')],
          ['molybdenum', parseFloat(data.molybdenum ?? '')],
          ['sodium', parseFloat(data.sodium ?? '')],
          ['chloride', parseFloat(data.chloride ?? '')],
          ['calciumCarbonate', parseFloat(data.calciumCarbonate ?? '')],
          ['carbonate', parseFloat(data.carbonate ?? '')],
          ['bicarbonate', parseFloat(data.bicarbonate ?? '')]
        ]

        additionalEntries.forEach(([key, value]) => {
          if (Number.isFinite(value)) {
            combinedParameters[key] = value
          }
        })

        manualEntries.forEach(([key, value]) => {
          if (Number.isFinite(value)) {
            combinedParameters[key] = value
          }
        })

        record = await SupabaseService.addSoilTestRecord({
          farm_id: parseInt(farmId),
          date,
          parameters: combinedParameters,
          notes: combineNotes.filter(Boolean).join(' | ') || '',
          report_url: reportMeta?.signedUrl,
          report_storage_path: reportMeta?.storagePath,
          report_filename: reportMeta?.filename,
          report_type: reportMeta?.reportType,
          extraction_status: reportMeta?.extractionStatus,
          extraction_error: reportMeta?.extractionError,
          parsed_parameters: reportMeta?.parsedParameters,
          raw_notes: reportMeta?.rawNotes ?? undefined,
          date_of_pruning: dashboardData?.farm?.dateOfPruning
        })
        break
      }

      case 'petiole_test': {
        // Create parameters object with all the nutrient values
        const reportMeta = (logEntry.meta?.report || null) as ReportAttachmentMeta | null

        const combineNotes = [data.notes || '']
        if (reportMeta?.summary) combineNotes.push(reportMeta.summary)

        const parameters: Record<string, number> = { ...(reportMeta?.parsedParameters || {}) }

        const pushParameter = (key: string, rawValue: unknown) => {
          const numericValue =
            typeof rawValue === 'string' ? parseFloat(rawValue) : Number(rawValue)
          if (Number.isFinite(numericValue)) {
            parameters[key] = numericValue
          }
        }

        pushParameter('total_nitrogen', data.total_nitrogen)
        pushParameter('phosphorus', data.phosphorus)
        pushParameter('potassium', data.potassium)
        pushParameter('calcium', data.calcium)
        pushParameter('magnesium', data.magnesium)
        pushParameter('sulfur', data.sulphur)
        pushParameter('iron', data.ferrous)
        pushParameter('manganese', data.manganese)
        pushParameter('zinc', data.zinc)
        pushParameter('copper', data.copper)
        pushParameter('boron', data.boron)
        pushParameter('nitrate_nitrogen', data.nitrate_nitrogen)
        pushParameter('ammonical_nitrogen', data.ammonical_nitrogen)

        record = await SupabaseService.addPetioleTestRecord({
          farm_id: parseInt(farmId),
          date,
          sample_id: data.sample_id || '',
          parameters,
          notes: combineNotes.filter(Boolean).join(' | ') || '',
          report_url: reportMeta?.signedUrl,
          report_storage_path: reportMeta?.storagePath,
          report_filename: reportMeta?.filename,
          report_type: reportMeta?.reportType,
          extraction_status: reportMeta?.extractionStatus,
          extraction_error: reportMeta?.extractionError,
          parsed_parameters: reportMeta?.parsedParameters,
          raw_notes: reportMeta?.rawNotes ?? undefined,
          date_of_pruning: dashboardData?.farm?.dateOfPruning
        })
        break
      }
    }

    return record
  }

  const updateLogEntry = async (logEntry: any, date: string, dayNotes: string) => {
    const { type, data, id } = logEntry
    let record

    // Extract the original record ID from the log entry
    const originalId = parseInt(id.toString())

    // Preserve the original date from the log entry data
    const originalDate = data.date || date

    switch (type) {
      case 'irrigation': {
        // Validate required farm data is available
        if (!dashboardData?.farm) {
          throw new Error('Farm data not loaded. Please refresh the page and try again.')
        }

        const duration = parseFloat(data.duration || '')
        if (!Number.isFinite(duration) || duration <= 0) {
          throw new Error('Irrigation duration is required and must be greater than 0')
        }

        const area = parseFloat(data.area || '') || dashboardData.farm.area
        if (!Number.isFinite(area) || area <= 0) {
          throw new Error('Irrigation area must be greater than 0')
        }

        record = await SupabaseService.updateIrrigationRecord(originalId, {
          farm_id: parseInt(farmId),
          date: originalDate,
          duration: duration,
          area: area,
          growth_stage: 'Active',
          moisture_status: 'Good',
          system_discharge: dashboardData.farm.systemDischarge,
          notes: data.notes || '',
          date_of_pruning: dashboardData.farm.dateOfPruning
        })
        break
      }

      case 'spray': {
        // Validate required farm data is available
        if (!dashboardData?.farm) {
          throw new Error('Farm data not loaded. Please refresh the page and try again.')
        }

        // Handle spray record with chemicals array (new format) or single chemical (old format)
        const sprayData: any = {
          farm_id: parseInt(farmId),
          date: originalDate,
          chemicals: [],
          area: dashboardData.farm.area,
          weather: 'Clear',
          operator: 'Farm Owner',
          notes: data.notes || '',
          date_of_pruning: dashboardData.farm.dateOfPruning
        }

        // Only add water_volume if it's a valid positive number
        const waterVolume = parseFloat(data.water_volume ?? '')
        if (Number.isFinite(waterVolume) && waterVolume > 0) {
          sprayData.water_volume = waterVolume
        }

        // Handle legacy single chemical format for backward compatibility
        if (data.chemicals && Array.isArray(data.chemicals) && data.chemicals.length > 0) {
          // New format: use chemicals array, ensure quantities are numbers
          sprayData.chemicals = data.chemicals.map((chem: any) => {
            const isString = typeof chem.quantity === 'string'
            const qty = isString ? parseFloat(chem.quantity) : chem.quantity

            if (!Number.isFinite(qty) || qty <= 0) {
              const chemName = chem.name || 'Unknown'
              const msg = `Chemical "${chemName}" quantity must be a valid number greater than 0`
              throw new Error(msg)
            }

            return {
              name: chem.name,
              quantity: qty,
              unit: chem.unit
            }
          })

          // Set first chemical as primary for backward compatibility
          const firstChemical = sprayData.chemicals[0]
          sprayData.chemical = firstChemical.name || 'Unknown'
          sprayData.quantity_amount = firstChemical.quantity
          sprayData.quantity_unit = firstChemical.unit || 'gm/L'
          sprayData.dose = `${firstChemical.quantity}${firstChemical.unit || 'gm/L'}`
        } else {
          // Old format: single chemical
          sprayData.chemical = data.chemical?.trim() || 'Unknown'
          sprayData.quantity_amount = data.quantity_amount ? parseFloat(data.quantity_amount) : 0
          sprayData.quantity_unit = data.quantity_unit || 'gm/L'
          sprayData.dose =
            data.quantity_amount && data.quantity_unit
              ? `${data.quantity_amount}${data.quantity_unit}`
              : 'As per label'
        }

        record = await SupabaseService.updateSprayRecord(originalId, sprayData)
        break
      }

      case 'harvest':
        record = await SupabaseService.updateHarvestRecord(originalId, {
          farm_id: parseInt(farmId),
          date: originalDate,
          quantity: parseFloat(data.quantity || '0'),
          grade: data.grade || 'Standard',
          price:
            data.price !== undefined
              ? parseFloat(data.price.toString())
              : logEntry.data?.price || 0,
          buyer: data.buyer !== undefined ? data.buyer : logEntry.data?.buyer || '',
          notes: data.notes || '',
          date_of_pruning: dashboardData?.farm?.dateOfPruning
        })
        break

      case 'expense':
        record = await SupabaseService.updateExpenseRecord(originalId, {
          farm_id: parseInt(farmId),
          date: originalDate,
          type: data.type || 'other',
          cost: parseFloat(data.cost || '0'),
          remarks: data.notes || '',
          date_of_pruning: dashboardData?.farm?.dateOfPruning
        })
        break

      case 'fertigation': {
        // Whitelist of allowed units for fertigation (defense-in-depth)
        const ALLOWED_FERTIGATION_UNITS = ['kg/acre', 'liter/acre'] as const

        const validateFertigationUnit = (unit: string): 'kg/acre' | 'liter/acre' => {
          const normalized = unit.trim().toLowerCase()

          // Find matching allowed unit (case-insensitive)
          for (const allowedUnit of ALLOWED_FERTIGATION_UNITS) {
            if (allowedUnit.toLowerCase() === normalized) {
              // Return the canonical allowed unit
              return allowedUnit
            }
          }

          // If no match found, throw error
          throw new Error(`Invalid fertigation unit: "${unit}". Allowed units: kg/acre, liter/acre`)
        }

        // Validate all fertilizers before updating the record
        const validatedFertilizers = data.fertilizers.map(
          (fertilizer: { name: string; quantity: number; unit: string }) => {
            // Validate unit against whitelist
            const validatedUnit = validateFertigationUnit(fertilizer.unit || 'kg/acre')

            // Validate fertilizer name
            if (!fertilizer.name || !fertilizer.name.trim()) {
              throw new Error('Fertilizer name cannot be empty')
            }

            // Validate quantity
            if (!fertilizer.quantity || fertilizer.quantity <= 0) {
              throw new Error(`Invalid quantity for fertilizer "${fertilizer.name}"`)
            }

            return {
              name: fertilizer.name.trim(),
              quantity: fertilizer.quantity,
              unit: validatedUnit
            }
          }
        )

        // Update the single fertigation record with the fertilizers array
        // Only include area if it's a valid positive number
        const updateFarmArea = dashboardData?.farm?.area
        const updatePayload: any = {
          farm_id: parseInt(farmId),
          date: originalDate,
          fertilizers: validatedFertilizers,
          notes: data.notes || '',
          date_of_pruning: dashboardData?.farm?.dateOfPruning
        }

        // Only include area if it's a valid positive number
        if (typeof updateFarmArea === 'number' && updateFarmArea > 0) {
          updatePayload.area = updateFarmArea
        }

        record = await SupabaseService.updateFertigationRecord(originalId, updatePayload)
        break
      }

      case 'soil_test': {
        const reportMeta = (logEntry.meta?.report || null) as ReportAttachmentMeta | null

        const combineNotes = [data.notes || '']
        if (reportMeta?.summary) combineNotes.push(reportMeta.summary)

        const parsedParameters = reportMeta?.parsedParameters || {}
        const combinedParameters: Record<string, number> = {}

        const mapSoilKey = (key: string) => {
          const normalized = key.toLowerCase()
          // Create stripped version by removing separators for compound name matching
          const stripped = normalized.replace(/[_\-\s]/g, '')

          if (normalized === 'ph' || normalized === 'soilph') return 'pH'

          if (normalized === 'nitrogen' || normalized === 'n') return 'nitrogen'
          if (normalized === 'phosphorus' || normalized === 'p') return 'phosphorus'
          if (normalized === 'potassium' || normalized === 'k') return 'potassium'

          if (
            normalized === 'ec' ||
            stripped === 'electricalconductivity' ||
            normalized === 'soilec'
          )
            return 'ec'

          if (stripped === 'calciumcarbonate' || stripped === 'caco3') return 'calciumCarbonate'
          if (stripped === 'organiccarbon' || normalized === 'oc') return 'organicCarbon'
          if (stripped === 'organicmatter') return 'organicMatter'

          if (stripped === 'calcium') return 'calcium'
          if (stripped === 'magnesium') return 'magnesium'
          if (stripped === 'sulphur' || stripped === 'sulfur' || normalized === 's') return 'sulfur'
          if (stripped === 'iron' || stripped === 'ferrous') return 'iron'
          if (stripped === 'manganese') return 'manganese'
          if (stripped === 'zinc') return 'zinc'
          if (stripped === 'copper') return 'copper'
          if (stripped === 'boron') return 'boron'
          if (stripped === 'molybdenum') return 'molybdenum'
          if (stripped === 'sodium') return 'sodium'
          if (stripped === 'chloride') return 'chloride'

          if (stripped === 'bicarbonate' || normalized === 'hco3') return 'bicarbonate'
          if (stripped === 'carbonate' || normalized === 'co3') return 'carbonate'

          return key
        }

        Object.entries(parsedParameters).forEach(([key, value]) => {
          let numericValue: number | undefined
          if (typeof value === 'number') {
            numericValue = Number.isFinite(value) ? value : undefined
          } else if (typeof value === 'string') {
            const parsed = parseFloat(value)
            numericValue = Number.isFinite(parsed) ? parsed : undefined
          }

          if (numericValue === undefined) return
          const mappedKey = mapSoilKey(key)
          combinedParameters[mappedKey] = numericValue
        })

        const manualEntries: Array<[string, number]> = [
          ['pH', parseFloat(data.ph ?? '')],
          ['ec', parseFloat(data.ec ?? '')],
          ['organicCarbon', parseFloat(data.organicCarbon ?? '')],
          ['organicMatter', parseFloat(data.organicMatter ?? '')],
          ['nitrogen', parseFloat(data.nitrogen ?? '')],
          ['phosphorus', parseFloat(data.phosphorus ?? '')],
          ['potassium', parseFloat(data.potassium ?? '')]
        ]

        const additionalEntries: Array<[string, number]> = [
          ['calcium', parseFloat(data.calcium ?? '')],
          ['magnesium', parseFloat(data.magnesium ?? '')],
          ['sulfur', parseFloat(data.sulfur ?? data.sulphur ?? '')],
          ['iron', parseFloat(data.iron ?? data.ferrous ?? '')],
          ['manganese', parseFloat(data.manganese ?? '')],
          ['zinc', parseFloat(data.zinc ?? '')],
          ['copper', parseFloat(data.copper ?? '')],
          ['boron', parseFloat(data.boron ?? '')],
          ['molybdenum', parseFloat(data.molybdenum ?? '')],
          ['sodium', parseFloat(data.sodium ?? '')],
          ['chloride', parseFloat(data.chloride ?? '')],
          ['calciumCarbonate', parseFloat(data.calciumCarbonate ?? '')],
          ['carbonate', parseFloat(data.carbonate ?? '')],
          ['bicarbonate', parseFloat(data.bicarbonate ?? '')]
        ]

        additionalEntries.forEach(([key, value]) => {
          if (Number.isFinite(value)) {
            combinedParameters[key] = value
          }
        })

        manualEntries.forEach(([key, value]) => {
          if (Number.isFinite(value)) {
            combinedParameters[key] = value
          }
        })

        record = await SupabaseService.updateSoilTestRecord(originalId, {
          farm_id: parseInt(farmId),
          date: originalDate,
          parameters: combinedParameters,
          notes: combineNotes.filter(Boolean).join(' | ') || '',
          report_url: reportMeta?.signedUrl,
          report_storage_path: reportMeta?.storagePath,
          report_filename: reportMeta?.filename,
          report_type: reportMeta?.reportType,
          extraction_status: reportMeta?.extractionStatus,
          extraction_error: reportMeta?.extractionError,
          parsed_parameters: reportMeta?.parsedParameters,
          raw_notes: reportMeta?.rawNotes ?? undefined,
          date_of_pruning: dashboardData?.farm?.dateOfPruning
        })
        break
      }

      case 'petiole_test': {
        // Create parameters object with all the nutrient values
        const reportMeta = (logEntry.meta?.report || null) as ReportAttachmentMeta | null

        const combineNotes = [data.notes || '']
        if (reportMeta?.summary) combineNotes.push(reportMeta.summary)

        const parameters: Record<string, number> = { ...(reportMeta?.parsedParameters || {}) }

        const pushParameter = (key: string, rawValue: unknown) => {
          const numericValue =
            typeof rawValue === 'string' ? parseFloat(rawValue) : Number(rawValue)
          if (Number.isFinite(numericValue)) {
            parameters[key] = numericValue
          }
        }

        pushParameter('total_nitrogen', data.total_nitrogen)
        pushParameter('phosphorus', data.phosphorus)
        pushParameter('potassium', data.potassium)
        pushParameter('calcium', data.calcium)
        pushParameter('magnesium', data.magnesium)
        pushParameter('sulfur', data.sulphur)
        pushParameter('iron', data.ferrous)
        pushParameter('manganese', data.manganese)
        pushParameter('zinc', data.zinc)
        pushParameter('copper', data.copper)
        pushParameter('boron', data.boron)
        pushParameter('nitrate_nitrogen', data.nitrate_nitrogen)
        pushParameter('ammonical_nitrogen', data.ammonical_nitrogen)

        record = await SupabaseService.updatePetioleTestRecord(originalId, {
          farm_id: parseInt(farmId),
          date: originalDate,
          sample_id: data.sample_id || '',
          parameters,
          notes: combineNotes.filter(Boolean).join(' | ') || '',
          report_url: reportMeta?.signedUrl,
          report_storage_path: reportMeta?.storagePath,
          report_filename: reportMeta?.filename,
          report_type: reportMeta?.reportType,
          extraction_status: reportMeta?.extractionStatus,
          extraction_error: reportMeta?.extractionError,
          parsed_parameters: reportMeta?.parsedParameters,
          raw_notes: reportMeta?.rawNotes ?? undefined,
          date_of_pruning: dashboardData?.farm?.dateOfPruning
        })
        break
      }
    }

    return record
  }

  const handleDeleteRecord = (record: any) => {
    setDeletingRecord(record)
    setShowDeleteDialog(true)
  }

  // New handler for editing date groups
  const handleEditDateGroup = (date: string, activities: any[]) => {
    // Normalize date to ISO format (YYYY-MM-DD) for proper handling
    const normalizedDate = date
      ? new Date(date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]

    // Extract daily note using utility function
    const dailyNote = extractDailyNoteFromActivities(activities)
    setEditModeDayNote(dailyNote)

    // Check if should use single edit modal using utility function
    if (shouldUseSingleEditModal(activities)) {
      // Single non-note activity - open UnifiedDataLogsModal
      const nonNoteActivities = activities.filter((activity) => activity.type !== 'daily_note')
      const existingLogs = transformActivitiesToLogEntries(nonNoteActivities)

      setEditModeLogs(existingLogs)
      setEditModeDate(normalizedDate)
      setEditMode('edit')
      setShowDataLogsModal(true)
    } else {
      // Multiple activities - use UnifiedDataLogsModal
      const nonNoteActivities = activities.filter((activity) => activity.type !== 'daily_note')
      const existingLogs = transformActivitiesToLogEntries(nonNoteActivities)

      // Set up the edit modal with existing logs
      setEditModeLogs(existingLogs)
      setEditModeDate(normalizedDate)
      setEditMode('edit')
      setShowDataLogsModal(true)
    }
  }

  // New handler for deleting date groups
  const handleDeleteDateGroup = async (date: string, activities: any[]) => {
    if (
      !confirm(
        `Are you sure you want to delete all ${activities.length} logs from ${date}? This action cannot be undone.`
      )
    ) {
      return
    }

    try {
      setIsDeleting(true)

      // Delete each activity in the group
      for (const activity of activities) {
        switch (activity.type) {
          case 'irrigation':
            await SupabaseService.deleteIrrigationRecord(activity.id)
            break
          case 'spray':
            await SupabaseService.deleteSprayRecord(activity.id)
            break
          case 'harvest':
            await SupabaseService.deleteHarvestRecord(activity.id)
            break
          case 'fertigation':
            await SupabaseService.deleteFertigationRecord(activity.id)
            break
          case 'expense':
            await SupabaseService.deleteExpenseRecord(activity.id)
            break
          case 'soil_test':
            await SupabaseService.deleteSoilTestRecord(activity.id)
            break
          case 'petiole_test':
            await SupabaseService.deletePetioleTestRecord(activity.id)
            break
          case 'daily_note':
            await SupabaseService.deleteDailyNote(activity.id)
            break
        }
      }

      await loadDashboardData()
    } catch (error) {
      logger.error('Error deleting date group:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const confirmDeleteRecord = async () => {
    if (!deletingRecord) return

    try {
      setIsDeleting(true)

      switch (deletingRecord.type) {
        case 'irrigation':
          await SupabaseService.deleteIrrigationRecord(deletingRecord.id)
          break
        case 'spray':
          await SupabaseService.deleteSprayRecord(deletingRecord.id)
          break
        case 'harvest':
          await SupabaseService.deleteHarvestRecord(deletingRecord.id)
          break
        case 'fertigation':
          await SupabaseService.deleteFertigationRecord(deletingRecord.id)
          break
        case 'expense':
          await SupabaseService.deleteExpenseRecord(deletingRecord.id)
          break
        case 'soil_test':
          await SupabaseService.deleteSoilTestRecord(deletingRecord.id)
          break
        case 'petiole_test':
          await SupabaseService.deletePetioleTestRecord(deletingRecord.id)
          break
        case 'daily_note':
          await SupabaseService.deleteDailyNote(deletingRecord.id)
          break
      }

      await loadDashboardData()
      setShowDeleteDialog(false)
      setDeletingRecord(null)
    } catch (error) {
      logger.error('Error deleting record:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Farm edit and delete handlers
  const handleEditFarm = (farm: Farm) => {
    setEditingFarm(farm)
    setShowFarmModal(true)
  }

  const handleDeleteFarm = async (farmId: number) => {
    if (
      confirm(
        'Are you sure you want to delete this farm? This will also delete all associated records.'
      )
    ) {
      try {
        await SupabaseService.deleteFarm(farmId)
        router.push('/farms') // Navigate back to farms list
      } catch (error) {
        logger.error('Error deleting farm:', error)
      }
    }
  }

  const handleFarmChange = (newFarmId: number) => {
    if (!Number.isFinite(newFarmId)) {
      logger.error('Invalid farm id selected in farm switcher', { newFarmId })
      return
    }
    router.push(`/farms/${newFarmId}`)
  }

  const handleAddFarm = () => {
    setEditingFarm(null)
    setShowFarmModal(true)
  }

  const handleFarmSubmit = async (farmData: any) => {
    try {
      setFarmSubmitLoading(true)

      if (editingFarm) {
        // Edit mode: update existing farm
        await SupabaseService.updateFarm(parseInt(farmId), farmData)
        await loadDashboardData()
        setShowFarmModal(false)
        setEditingFarm(null)
      } else {
        // Create mode: add new farm and navigate to it
        const newFarm = await SupabaseService.createFarm(farmData)
        setShowFarmModal(false)
        setEditingFarm(null)

        // Navigate to the newly created farm's details page
        if (newFarm && newFarm.id) {
          router.push(`/farms/${newFarm.id}`)
        }
      }
    } catch (error) {
      logger.error(editingFarm ? 'Error updating farm:' : 'Error creating farm:', error)
      throw error
    } finally {
      setFarmSubmitLoading(false)
    }
  }

  const farm = dashboardData?.farm

  useEffect(() => {
    let isMounted = true

    const fetchWeatherSummary = async () => {
      if (farm?.latitude == null || farm?.longitude == null) {
        if (isMounted) {
          setWeatherSummary(null)
        }
        return
      }

      try {
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]
        const dayAfterTomorrow = new Date(today)
        dayAfterTomorrow.setDate(today.getDate() + 2)
        const endDateStr = dayAfterTomorrow.toISOString().split('T')[0]

        const weatherDataArray = await OpenMeteoWeatherService.getWeatherData(
          farm.latitude,
          farm.longitude,
          todayStr,
          endDateStr
        )

        if (!isMounted) return

        if (weatherDataArray.length > 0) {
          const todayWeather = weatherDataArray[0]
          const temperature =
            typeof todayWeather.temperatureMean === 'number'
              ? Math.round(todayWeather.temperatureMean)
              : null
          const humidity =
            typeof todayWeather.relativeHumidityMean === 'number'
              ? Math.round(todayWeather.relativeHumidityMean)
              : null
          const precipitation =
            typeof todayWeather.precipitationSum === 'number'
              ? Number(todayWeather.precipitationSum.toFixed(1))
              : null

          const condition: FarmWeatherSummary['condition'] =
            precipitation !== null && precipitation > WEATHER_THRESHOLDS.RAIN_MM
              ? 'rain'
              : humidity !== null && humidity > WEATHER_THRESHOLDS.HIGH_HUMIDITY_PERCENT
                ? 'humid'
                : 'clear'

          setWeatherSummary({
            temperature,
            humidity,
            precipitation,
            condition
          })
        } else {
          setWeatherSummary(null)
        }
      } catch (error) {
        logger.error('Error fetching weather summary:', error)
        if (isMounted) {
          setWeatherSummary(null)
        }
      }
    }

    fetchWeatherSummary()

    return () => {
      isMounted = false
    }
  }, [farm?.latitude, farm?.longitude])

  const openDataLogsModal = async () => {
    const today = new Date().toISOString().split('T')[0]
    setEditMode('add')
    setEditModeLogs([])
    setEditModeDate(today)

    // Check if there's already a daily note for today
    try {
      const existingDailyNote = await SupabaseService.getDailyNoteByDate(parseFarmId(farmId), today)
      if (existingDailyNote) {
        setEditModeDayNote({
          id: existingDailyNote.id ?? null,
          notes: existingDailyNote.notes || ''
        })
      } else {
        setEditModeDayNote(null)
      }
    } catch (error) {
      console.error('Error fetching existing daily note:', error)
      setEditModeDayNote(null)
    }

    setShowDataLogsModal(true)
  }

  const recordCounts: DashboardData['recordCounts'] = dashboardData?.recordCounts ?? {
    irrigation: 0,
    spray: 0,
    fertigation: 0,
    harvest: 0,
    expense: 0,
    soilTest: 0,
    petioleTest: 0,
    dailyNotes: 0
  }

  const totalLogs = Object.values(recordCounts).reduce((sum, count) => sum + count, 0)

  const integerFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

  const pendingHighPriority =
    dashboardData?.pendingTasks?.filter((task) => task.priority === 'high' && !task.completed)
      .length ?? 0

  const irrigationPerAcre =
    dashboardData?.totalWaterUsage && farm?.area
      ? Number((dashboardData.totalWaterUsage / farm.area).toFixed(1))
      : null

  const harvestDisplay =
    typeof dashboardData?.totalHarvest === 'number' && dashboardData.totalHarvest > 0
      ? dashboardData.totalHarvest >= 1000
        ? `${(dashboardData.totalHarvest / 1000).toFixed(1)} t`
        : `${integerFormatter.format(dashboardData.totalHarvest)} kg`
      : '—'

  const trackedCategories = Object.values(recordCounts).filter(
    (count) => typeof count === 'number' && count > 0
  ).length

  const sprayAndFertCount = (recordCounts.spray ?? 0) + (recordCounts.fertigation ?? 0)
  const observationCount =
    (recordCounts.dailyNotes ?? 0) + (recordCounts.soilTest ?? 0) + (recordCounts.petioleTest ?? 0)

  const todayIso = new Date().toISOString().split('T')[0]
  const lastWaterUpdate = dashboardData?.farm?.waterCalculationUpdatedAt
    ? new Date(dashboardData.farm.waterCalculationUpdatedAt).toISOString().split('T')[0]
    : null
  const needsWaterUpdate = !lastWaterUpdate || lastWaterUpdate !== todayIso

  useEffect(() => {
    if (!needsWaterUpdate) {
      resetDismissedSignal('Water level')
    }
  }, [needsWaterUpdate, resetDismissedSignal])

  type FieldSignal = {
    icon: LucideIcon
    label: string
    status: string
    message: string
    pill?: string
    emphasis?: 'callout' | 'default'
    actionLabel?: string
    interactive?: boolean
    action?: () => void
  }

  const waterSignal: FieldSignal | null = needsWaterUpdate
    ? {
        icon: Droplets,
        label: 'Water level',
        status: 'Update required',
        message: 'Tap to log today’s irrigation.',
        interactive: true,
        action: () => setShowWaterCalculationModal(true)
      }
    : null

  useEffect(() => {
    if (!labTestSignal) {
      resetDismissedSignal('Lab tests')
    }
  }, [labTestSignal, resetDismissedSignal])

  const readinessSignals: FieldSignal[] = [
    ...(labTestSignal
      ? [
          {
            icon: FlaskConical,
            label: 'Lab tests',
            status: labTestSignal.status,
            message: `${labTestSignal.message} Tap to open lab workspace.`,
            pill: labTestSignal.pill,
            interactive: true,
            action: () => router.push(`/farms/${farmId}/lab-tests`)
          }
        ]
      : [])
  ]
  const activeFieldSignals = (
    waterSignal ? [waterSignal, ...readinessSignals] : readinessSignals
  ).filter((signal) => !dismissedSignals[signal.label])
  const hasActiveFieldSignals = activeFieldSignals.length > 0
  const showFieldSignalSections = loading || hasActiveFieldSignals
  const moduleShortcuts = [
    { label: 'Logs', icon: NotebookText, href: `/farms/${farmId}/logs` },
    { label: 'AI', icon: Brain, href: '/ai-assistant' },
    { label: 'Lab tests', icon: FlaskConical, href: `/farms/${farmId}/lab-tests` },
    { label: 'Reports', icon: BarChart3, href: '/reports' }
  ]

  const renderWorkTabs = () => (
    <section className="rounded-3xl border border-border/70 bg-card/95 p-5 shadow-sm">
      <Tabs defaultValue="tasks" className="w-full space-y-4">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Workboard
            </p>
            <p className="text-xs text-muted-foreground">
              Switch between today’s plan and recent logs.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-1.5 rounded-2xl border border-border/60 bg-muted/20 p-1.5">
            {moduleShortcuts.map((link) => {
              const Icon = link.icon
              return (
                <button
                  key={link.label}
                  type="button"
                  className="group flex flex-col items-center gap-1 rounded-xl border border-border/40 bg-card px-1.5 py-2.5 shadow-sm transition active:scale-95 active:shadow-none hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  onClick={() => router.push(link.href)}
                  aria-label={`Open ${link.label}`}
                >
                  <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  <span className="text-[11px] font-medium text-foreground">{link.label}</span>
                </button>
              )
            })}
          </div>
          <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-muted/30 p-1 sm:w-auto sm:min-w-[260px]">
            <TabsTrigger
              value="tasks"
              className="rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Tasks
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Activity
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="tasks" className="mt-4">
          <TasksOverviewCard
            farmId={Number.parseInt(farmId, 10)}
            tasks={dashboardData?.pendingTasks || []}
            farmName={farm?.name ? capitalize(farm.name) : undefined}
            loading={loading}
            onTasksUpdated={loadDashboardData}
            className="border-none bg-transparent p-0 shadow-none"
          />
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <ActivityFeed
            recentActivities={dashboardData?.recentActivities || []}
            loading={loading}
            onEditDateGroup={handleEditDateGroup}
            onDeleteDateGroup={handleDeleteDateGroup}
            farmId={farmId}
            variant="plain"
            hideHeader
            className="space-y-3"
          />
        </TabsContent>
      </Tabs>
    </section>
  )

  const readinessPanel = (
    <section className="rounded-3xl border border-border/70 bg-card/95 p-6 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Field readiness
          </p>
          <h3 className="mt-1 text-base font-semibold text-foreground">
            Know what needs attention
          </h3>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Keep irrigation, weather windows, and priority work visible for the crew.
          </p>
          <p className="text-xs text-muted-foreground sm:hidden">
            Track water, weather, and the next urgent job.
          </p>
        </div>
        {needsWaterUpdate ? (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-border/70 text-foreground"
            onClick={() => setShowWaterCalculationModal(true)}
          >
            Update water
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">Water logged for today</span>
        )}
      </div>

      <Collapsible open={readinessOpen} onOpenChange={setReadinessOpen}>
        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground sm:hidden">
            {readinessOpen ? 'Signals expanded' : 'Tap to view signals'}
          </p>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto flex items-center gap-2 rounded-full border border-border/60 px-3 text-xs font-medium text-foreground"
            >
              {readinessOpen ? 'Hide signals' : 'Show signals'}
              <ChevronDown className={`h-4 w-4 transition ${readinessOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="space-y-4 pt-4 data-[state=closed]:animate-none">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={`readiness-skeleton-${index}`}
                  className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4"
                >
                  <div className="h-11 w-11 rounded-2xl bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-20 rounded-full bg-muted animate-pulse" />
                    <div className="h-4 w-36 rounded-full bg-muted animate-pulse" />
                    <div className="h-3 w-48 rounded-full bg-muted animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {activeFieldSignals.map((signal) => {
                  const Icon = signal.icon
                  const isCallout = signal.emphasis === 'callout'
                  const handleClick = () => {
                    signal.action?.()
                  }
                  const handleDismissClick = (event: MouseEvent) => {
                    event.preventDefault()
                    event.stopPropagation()
                    handleDismissSignal(signal.label)
                  }

                  const card = (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                            isCallout
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-card text-primary'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="flex items-center gap-1">
                          {signal.pill && (
                            <span className="rounded-full bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                              {signal.pill}
                            </span>
                          )}
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={handleDismissClick}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                handleDismissClick(event as unknown as MouseEvent)
                              }
                            }}
                            aria-label={`Dismiss ${signal.label} alert`}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                          >
                            <X className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          {signal.label}
                        </p>
                        <p className="text-sm font-semibold text-foreground">{signal.status}</p>
                        <p className="text-xs text-muted-foreground">{signal.message}</p>
                        {signal.emphasis === 'callout' && signal.actionLabel && (
                          <div className="mt-3">
                            <Button size="sm" className="w-full sm:w-auto" onClick={handleClick}>
                              {signal.actionLabel}
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )

                  if (!(signal.interactive || signal.action)) {
                    return (
                      <div
                        key={signal.label}
                        className={`flex items-start gap-3 rounded-2xl border ${
                          isCallout
                            ? 'border-primary/50 bg-primary/10'
                            : 'border-border/60 bg-muted/20'
                        } p-4 text-left`}
                      >
                        {card}
                      </div>
                    )
                  }

                  return (
                    <button
                      type="button"
                      onClick={handleClick}
                      key={signal.label}
                      className={`flex items-start gap-3 rounded-2xl border ${
                        isCallout
                          ? 'border-primary/50 bg-primary/10'
                          : 'border-border/60 bg-muted/20'
                      } p-4 text-left transition hover:border-primary/60`}
                    >
                      {card}
                    </button>
                  )
                })}
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Keep these signals green by logging irrigation and tracking weather.</p>
                <p>Wrap work promptly once tasks are completed.</p>
              </div>
            </>
          )}
        </CollapsibleContent>
      </Collapsible>
    </section>
  )

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <FarmHeader
          farm={farm || ({} as Farm)}
          loading={loading || !farm}
          pendingTasksCount={dashboardData?.pendingTasksCount}
          totalLogs={totalLogs}
          totalHarvest={dashboardData?.totalHarvest}
          totalWaterUsage={dashboardData?.totalWaterUsage}
          onAddLogs={openDataLogsModal}
          onOpenWaterCalculator={() => setShowWaterCalculationModal(true)}
          onViewLogEntries={() => router.push(`/farms/${farmId}/logs`)}
          weatherSummary={weatherSummary}
          onOpenWeatherDetails={() => router.push('/weather')}
          onEditFarm={handleEditFarm}
          onDeleteFarm={handleDeleteFarm}
          allFarms={allFarms}
          onFarmChange={handleFarmChange}
          onAddFarm={handleAddFarm}
        />

        <main className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          {isMobile ? (
            <div className="space-y-6">
              {showFieldSignalSections && (
                <section className="rounded-3xl border border-border/70 bg-card/95 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Field signals
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Only the actions that need your attention right now.
                      </p>
                    </div>
                  </div>
                  {loading ? (
                    <div className="mt-4 flex gap-3 overflow-hidden pb-2">
                      {Array.from({ length: 2 }).map((_, index) => (
                        <div
                          key={`field-signal-skeleton-${index}`}
                          className="min-w-[190px] rounded-2xl border border-border/60 bg-muted/30 p-3"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted animate-pulse" />
                            <span className="h-3 w-10 rounded-full bg-muted animate-pulse" />
                          </div>
                          <div className="mt-2 space-y-2">
                            <div className="h-3 w-20 rounded-full bg-muted animate-pulse" />
                            <div className="h-4 w-28 rounded-full bg-muted animate-pulse" />
                            <div className="h-3 w-36 rounded-full bg-muted animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none]">
                      {activeFieldSignals.map((signal) => {
                        const Icon = signal.icon
                        const isCallout = signal.emphasis === 'callout'
                        const handleClick = () => signal.action?.()
                        const handleDismissClick = (event: MouseEvent) => {
                          event.preventDefault()
                          event.stopPropagation()
                          handleDismissSignal(signal.label)
                        }

                        const baseCardClasses = cn(
                          'min-w-[190px] rounded-2xl border text-left',
                          isCallout
                            ? 'border-primary/50 bg-primary/10 p-3.5'
                            : 'border-border/60 bg-muted/30 p-3'
                        )
                        const iconWrapperClasses = cn(
                          'flex h-8 w-8 items-center justify-center rounded-xl',
                          isCallout ? 'bg-primary text-primary-foreground' : 'bg-card text-primary'
                        )
                        const labelClass = cn(
                          'text-[10px]',
                          'uppercase',
                          'tracking-wide',
                          'text-muted-foreground'
                        )
                        const statusClass = cn(
                          'text-sm',
                          'font-semibold',
                          'text-foreground',
                          'leading-tight'
                        )
                        const messageClass = cn(
                          'text-[11px]',
                          'text-muted-foreground',
                          'leading-snug'
                        )
                        const isInteractive = Boolean(signal.interactive || signal.action)

                        const cardContent = (
                          <>
                            <div className="flex items-center justify-between gap-1">
                              <span className={iconWrapperClasses}>
                                <Icon className="h-3.5 w-3.5" />
                              </span>
                              <div className="flex items-center gap-1">
                                {signal.pill && (
                                  <span className="text-[10px] font-semibold text-muted-foreground">
                                    {signal.pill}
                                  </span>
                                )}
                                <div
                                  role="button"
                                  tabIndex={0}
                                  onClick={handleDismissClick}
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                      event.preventDefault()
                                      handleDismissClick(event as unknown as MouseEvent)
                                    }
                                  }}
                                  aria-label={`Dismiss ${signal.label} alert`}
                                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </div>
                              </div>
                            </div>
                            <p className={`mt-2 ${labelClass}`}>{signal.label}</p>
                            <p className={statusClass}>{signal.status}</p>
                            <p className={messageClass}>{signal.message}</p>
                            {signal.emphasis === 'callout' && signal.actionLabel && (
                              <div className="mt-2">
                                <Button
                                  size="sm"
                                  className="h-8 w-full text-xs"
                                  onClick={handleClick}
                                >
                                  {signal.actionLabel}
                                </Button>
                              </div>
                            )}
                          </>
                        )

                        if (!isInteractive) {
                          return (
                            <div
                              key={signal.label}
                              className={`${baseCardClasses} ${isCallout ? 'border-primary/50 bg-primary/10' : ''}`}
                            >
                              {cardContent}
                            </div>
                          )
                        }

                        return (
                          <button
                            key={signal.label}
                            type="button"
                            className={`${baseCardClasses} transition hover:border-primary/60`}
                            onClick={handleClick}
                          >
                            {cardContent}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </section>
              )}

              {renderWorkTabs()}
            </div>
          ) : (
            <div className="space-y-10">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(260px,1.2fr)]">
                <div className="space-y-6">{renderWorkTabs()}</div>

                {readinessPanel && <aside className="space-y-6">{readinessPanel}</aside>}
              </div>
            </div>
          )}
        </main>

        {/* Unified Data Logs Modal */}
        <UnifiedDataLogsModal
          isOpen={showDataLogsModal}
          onClose={() => {
            setShowDataLogsModal(false)
            setEditMode('add')
            setEditModeLogs([])
            setEditModeDate('')
            setEditModeDayNote(null)
          }}
          onSubmit={handleDataLogsSubmit}
          isSubmitting={isSubmitting}
          farmId={parseInt(farmId)}
          mode={editMode}
          existingLogs={editModeLogs}
          selectedDate={editModeDate}
          existingDayNote={editModeDayNote?.notes}
          existingDayNoteId={editModeDayNote?.id ?? null}
        />

        {/* Water Calculation Modal */}
        {dashboardData?.farm && (
          <WaterCalculationModal
            isOpen={showWaterCalculationModal}
            onClose={() => setShowWaterCalculationModal(false)}
            farm={dashboardData.farm}
            onCalculationComplete={loadDashboardData}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Activity Log</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this {deletingRecord?.type?.replace('_', ' ')}{' '}
                record from {deletingRecord?.date}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false)
                  setDeletingRecord(null)
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteRecord} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Farm Modal (Create/Edit) */}
        <FarmModal
          isOpen={showFarmModal}
          onClose={() => {
            setShowFarmModal(false)
            setEditingFarm(null)
          }}
          onSubmit={handleFarmSubmit}
          editingFarm={editingFarm}
          isSubmitting={farmSubmitLoading}
        />
      </div>
    </ProtectedRoute>
  )
}
