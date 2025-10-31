'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CalendarClock, CheckCircle2, ListChecks, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { UnifiedDataLogsModal } from '@/components/farm-details/UnifiedDataLogsModal'
import { ActivityLogRow } from '@/components/activity/ActivityLogRow'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { SupabaseService } from '@/lib/supabase-service'
import { PhotoService } from '@/lib/photo-service'
import { capitalize } from '@/lib/utils'
import { getActivityDisplayData } from '@/lib/activity-display-utils'
import { EmptyStateDashboard } from './EmptyStateDashboard'
import { toast } from 'sonner'
import {
  mapSoilKey,
  normalizeParsedParameters,
  createParameterEntries,
  addValidEntries
} from '@/lib/soil-test-utils'
import type { Farm, TaskReminder } from '@/types/types'
import type { ReportAttachmentMeta } from '@/types/reports'
import type { AggregatedActivity, ActivityType } from '@/types/activities'
import { isExpenseActivity } from '@/types/activities'

interface FarmerDashboardProps {
  className?: string
}

interface DashboardSummary {
  farm: Farm | null
  pendingTasksCount: number
  recentIrrigations: any[]
  recentActivities: ActivityRecord[]
  totalHarvest: number
  totalWaterUsage: number
  pendingTasks: TaskReminder[]
  recordCounts: Record<string, number>
}

interface ActivityRecord {
  id?: number
  type: string
  date?: string
  created_at?: string
  farm_id?: number
  quantity?: number
  cost?: number
  description?: string | null
  notes?: string | null
  [key: string]: unknown
}

type AggregatedTask = TaskReminder & { farmId: number; farmName: string }

type ActivityFilter = 'today' | 'week' | 'all'

const ACTIVITY_LIMIT = 8

const formatDate = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short'
  }).format(date)
}

const formatDateTime = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const getActivityDate = (activity: ActivityRecord | AggregatedActivity) => {
  if (activity.date) return new Date(activity.date)
  if (activity.created_at) return new Date(activity.created_at)
  return undefined
}

const getTaskDueDate = (task: TaskReminder) => {
  if (!task.dueDate) return undefined
  const date = new Date(task.dueDate)
  if (Number.isNaN(date.getTime())) return undefined
  return date
}

/**
 * Generate a stable, deterministic key for activities without IDs
 * Uses stable activity properties to create reproducible keys across renders
 */
const generateStableActivityKey = (activity: ActivityRecord | AggregatedActivity): string => {
  const activityDate = getActivityDate(activity as ActivityRecord)
  const dateStr = activityDate?.toISOString() ?? ''
  const farmName = activity.farmName || ''
  const notes = activity.notes || ''

  // Create a simple hash from stable properties
  const keyString = `${activity.type}-${dateStr}-${farmName}-${notes}`

  // Simple hash function to generate a stable key
  let hash = 0
  for (let i = 0; i < keyString.length; i++) {
    const char = keyString.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  return `${activity.type}-${Math.abs(hash)}`
}

// TYPE DEFINITIONS FOR ACTIVITY HANDLERS
// ============================================================================

/**
 * Union type for all possible activity record return shapes
 */
type ActivityRecordResult =
  | { type: 'irrigation'; record: any }
  | { type: 'spray'; record: any }
  | { type: 'harvest'; record: any }
  | { type: 'expense'; record: any }
  | { type: 'fertigation'; record: any }
  | { type: 'soil_test'; record: any }
  | { type: 'petiole_test'; record: any }

/**
 * Interface for activity handler function parameters
 */
interface ActivityHandlerParams {
  data: any
  date: string
  dayNotes: string
  farm: Farm
}

// ACTIVITY HANDLER FUNCTIONS (to be defined inside component)
// ============================================================================

const getGreeting = (displayName: string) => {
  const hour = new Date().getHours()
  if (hour < 12) return `Good morning, ${displayName}!`
  if (hour < 18) return `Good afternoon, ${displayName}!`
  return `Good evening, ${displayName}!`
}

const priorityBadgeVariant = (priority: string | null | undefined) => {
  switch (priority) {
    case 'high':
      return 'destructive'
    case 'medium':
      return 'secondary'
    default:
      return 'outline'
  }
}

export function FarmerDashboard({ className }: FarmerDashboardProps) {
  const { user, loading: authLoading } = useSupabaseAuth()
  const [initializing, setInitializing] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [farms, setFarms] = useState<Farm[]>([])
  const [allActivities, setAllActivities] = useState<AggregatedActivity[]>([])
  const [allTasks, setAllTasks] = useState<AggregatedTask[]>([])
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('today')
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null)
  const [showAddLogsModal, setShowAddLogsModal] = useState(false)
  const [addLogFarmId, setAddLogFarmId] = useState<number | null>(null)
  const [isSubmittingLogs, setIsSubmittingLogs] = useState(false)

  useEffect(() => {
    const loadDashboard = async () => {
      if (authLoading) return

      if (!user) {
        setError('Please sign in to view your dashboard')
        setInitializing(false)
        return
      }

      setLoading(true)

      try {
        const fetchedFarms = await SupabaseService.getAllFarms()
        setFarms(fetchedFarms)

        if (fetchedFarms.length === 0) {
          setAllActivities([])
          setAllTasks([])
          setError(null)
          return
        }

        const perFarm = await Promise.all(
          fetchedFarms
            .filter((farm): farm is Farm & { id: number } => typeof farm.id === 'number')
            .map(async (farm) => {
              const [summary, tasks] = await Promise.all([
                SupabaseService.getDashboardSummary(farm.id!),
                SupabaseService.getPendingTasks(farm.id!)
              ])
              return { farm, summary: summary as DashboardSummary, tasks }
            })
        )

        const activityList: AggregatedActivity[] = []
        const taskList: AggregatedTask[] = []

        perFarm.forEach(({ farm, summary, tasks }) => {
          const farmId = farm.id as number

          const farmName = capitalize(farm.name)

          ;(summary.recentActivities || []).forEach((activity) => {
            activityList.push({
              id: activity.id, // Preserve original id (allowing undefined)
              ...activity,
              type: activity.type as ActivityType, // Cast to proper ActivityType
              date: activity.date || '', // Ensure date is present
              farmId,
              farmName
            })
          })

          tasks.forEach((task) => {
            taskList.push({ ...task, farmId, farmName })
          })
        })

        activityList.sort((a, b) => {
          const aDate = getActivityDate(a)?.getTime() || 0
          const bDate = getActivityDate(b)?.getTime() || 0
          return bDate - aDate
        })

        taskList.sort((a, b) => {
          const aDate = getTaskDueDate(a)?.getTime() || Number.POSITIVE_INFINITY
          const bDate = getTaskDueDate(b)?.getTime() || Number.POSITIVE_INFINITY
          return aDate - bDate
        })

        setAllActivities(activityList)
        setAllTasks(taskList)
        setError(null)
      } catch (err) {
        setError('Unable to load dashboard data right now')
      } finally {
        setLoading(false)
        setInitializing(false)
      }
    }

    void loadDashboard()
  }, [authLoading, user])

  const refreshFarmData = async (farmId?: number | null) => {
    if (!farmId) {
      setInitializing(true)
      setLoading(true)
      try {
        const fetchedFarms = await SupabaseService.getAllFarms()
        setFarms(fetchedFarms)
      } finally {
        setLoading(false)
        setInitializing(false)
      }
      return
    }

    try {
      const [summary, tasks] = await Promise.all([
        SupabaseService.getDashboardSummary(farmId),
        SupabaseService.getPendingTasks(farmId)
      ])

      const farmName = capitalize(farms.find((farm) => farm.id === farmId)?.name || 'Farm')

      setAllActivities((prev) => {
        const others = prev.filter((activity) => activity.farmId !== farmId)
        const updated = ((summary as DashboardSummary).recentActivities || []).map((activity) => ({
          id: activity.id, // Preserve original id (allowing undefined)
          ...activity,
          type: activity.type as ActivityType, // Cast to proper type
          date: activity.date || '', // Ensure date is present
          farmId,
          farmName
        }))
        const merged = [...others, ...updated]
        merged.sort((a, b) => {
          const aDate = getActivityDate(a)?.getTime() || 0
          const bDate = getActivityDate(b)?.getTime() || 0
          return bDate - aDate
        })
        return merged
      })

      setAllTasks((prev) => {
        const others = prev.filter((task) => task.farmId !== farmId)
        const updated = tasks.map((task) => ({ ...task, farmId, farmName }))
        const merged = [...others, ...updated]
        merged.sort((a, b) => {
          const aDate = getTaskDueDate(a)?.getTime() || Number.POSITIVE_INFINITY
          const bDate = getTaskDueDate(b)?.getTime() || Number.POSITIVE_INFINITY
          return aDate - bDate
        })
        return merged
      })
      setError(null)
    } catch (err) {
      setError('Unable to refresh farm data right now.')
    }
  }

  const openAddLogsModal = (farmId?: number | null | object) => {
    if (farms.length === 0) return

    const defaultFarmId = farms.find((farm) => typeof farm.id === 'number')?.id ?? null
    const explicitFarmId = typeof farmId === 'number' ? farmId : undefined
    const nextFarmId = explicitFarmId ?? addLogFarmId ?? defaultFarmId

    setAddLogFarmId(nextFarmId ?? null)
    setShowAddLogsModal(true)
  }

  const closeAddLogsModal = () => {
    setShowAddLogsModal(false)
    setIsSubmittingLogs(false)
  }

  // ACTIVITY HANDLER FUNCTIONS
  // ==========================================================================

  /**
   * Save irrigation record with proper error handling
   */
  const saveIrrigationRecord = async ({
    data,
    date,
    dayNotes,
    farm
  }: ActivityHandlerParams): Promise<{ type: 'irrigation'; record: any }> => {
    const farmId = farm.id
    if (!farmId) throw new Error('Invalid farm selected')

    // Safe numeric parsing with defaults
    const duration = Number.isFinite(parseFloat(data.duration)) ? parseFloat(data.duration) : 0
    const area = Number.isFinite(parseFloat(data.area)) ? parseFloat(data.area) : farm.area || 0
    const systemDischarge =
      farm.systemDischarge && Number.isFinite(farm.systemDischarge) ? farm.systemDischarge : 100

    const record = await SupabaseService.addIrrigationRecord({
      farm_id: farmId,
      date,
      duration,
      area,
      growth_stage: 'Active',
      moisture_status: 'Good',
      system_discharge: systemDischarge,
      notes: dayNotes || '',
      date_of_pruning: farm.dateOfPruning
    })

    if (record && duration > 0 && systemDischarge > 0) {
      const waterAdded = duration * systemDischarge
      const currentWaterLevel = Number.isFinite(farm.remainingWater || 0)
        ? farm.remainingWater || 0
        : 0
      const newWaterLevel = currentWaterLevel + waterAdded

      // Take snapshot of previous farms state for potential rollback
      const previousFarmsSnapshot = [...farms]

      // Perform optimistic local update using functional setFarms for atomic updates
      setFarms((prevFarms) =>
        prevFarms.map((item) =>
          item.id === farmId ? { ...item, remainingWater: newWaterLevel } : item
        )
      )

      try {
        // Update database after optimistic update
        await SupabaseService.updateFarm(farmId, {
          remainingWater: newWaterLevel,
          waterCalculationUpdatedAt: new Date().toISOString()
        })

        // Send notifications after successful DB update
        try {
          const { NotificationService } = await import('@/lib/notification-service')
          const notificationService = NotificationService.getInstance()
          notificationService.checkWaterLevelAndAlert(capitalize(farm.name), newWaterLevel)
        } catch (notificationError) {
          console.error(
            'Notification service failed:',
            notificationError instanceof Error
              ? notificationError.message
              : 'Unknown notification error'
          )
        }
      } catch (dbError) {
        // Revert to snapshot if DB call fails
        setFarms(previousFarmsSnapshot)
        const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error'
        console.error('Failed to update water level in database:', errorMessage)
        throw new Error(`Failed to update water level: ${errorMessage}`)
      }
    }

    return { type: 'irrigation', record }
  }

  /**
   * Save spray record
   */
  const saveSprayRecord = async ({
    data,
    date,
    dayNotes,
    farm
  }: ActivityHandlerParams): Promise<{ type: 'spray'; record: any }> => {
    const farmId = farm.id
    if (!farmId) throw new Error('Invalid farm selected')

    const sprayData: any = {
      farm_id: farmId,
      date,
      chemicals: data.chemicals || [],
      area: farm.area || 0,
      weather: 'Clear',
      operator: 'Farm Owner',
      notes: dayNotes || '',
      date_of_pruning: farm.dateOfPruning
    }

    const waterVolume = parseFloat(data.water_volume ?? '')
    if (Number.isFinite(waterVolume) && waterVolume > 0) {
      sprayData.water_volume = waterVolume
    }

    if (data.chemicals && Array.isArray(data.chemicals) && data.chemicals.length > 0) {
      sprayData.chemicals = data.chemicals
        .map((chemical: any) => {
          // Validate and normalize the unit to ensure it's one of the allowed values
          const allowedUnits = ['gm/L', 'ml/L', 'ppm']
          const trimmedUnit = (chemical.unit || '').trim()

          // Require units - no default fallback
          if (!trimmedUnit) {
            toast.error('Chemical unit cannot be empty')
            throw new Error('Empty chemical unit')
          }

          // Validate unit is in allowed set
          if (!allowedUnits.includes(trimmedUnit)) {
            toast.error(`Invalid chemical unit. Allowed units: ${allowedUnits.join(', ')}`)
            throw new Error(`Invalid chemical unit: ${trimmedUnit}`)
          }

          // Validate and coerce quantity to number, preserve 0, convert invalid to null
          const q = Number(chemical.quantity)
          const validatedQuantity = Number.isFinite(q) && q > 0 ? q : null

          // Skip chemicals with invalid quantities
          if (validatedQuantity === null) {
            console.warn(`Skipping chemical "${chemical.name}" with invalid quantity`)
            return null
          }

          const trimmedName = (chemical.name || '').trim()

          if (!trimmedName) {
            toast.error('Chemical name cannot be empty')
            throw new Error('Empty chemical name')
          }

          return {
            name: trimmedName,
            quantity: validatedQuantity,
            unit: trimmedUnit
          }
        })
        .filter(Boolean)
    }

    const record = await SupabaseService.addSprayRecord(sprayData)
    return { type: 'spray', record }
  }

  /**
   * Save harvest record
   */
  const saveHarvestRecord = async ({
    data,
    date,
    dayNotes,
    farm
  }: ActivityHandlerParams): Promise<{ type: 'harvest'; record: any }> => {
    const farmId = farm.id
    if (!farmId) throw new Error('Invalid farm selected')

    const harvestData: any = {
      farm_id: farmId,
      date,
      quantity: parseFloat(data.quantity || '0'),
      grade: data.grade || 'Good',
      buyer: data.buyer || '',
      price: parseFloat(data.price || '0'),
      notes: dayNotes || ''
    }

    const record = await SupabaseService.addHarvestRecord(harvestData)
    return { type: 'harvest', record }
  }

  /**
   * Save expense record
   */
  const saveExpenseRecord = async ({
    data,
    date,
    dayNotes,
    farm
  }: ActivityHandlerParams): Promise<{ type: 'expense'; record: any }> => {
    const farmId = farm.id
    if (!farmId) throw new Error('Invalid farm selected')

    const expenseData: any = {
      farm_id: farmId,
      date,
      cost: parseFloat(data.cost || '0'),
      type: data.category || 'other',
      description: data.description || dayNotes || '',
      remarks: dayNotes || ''
    }

    const record = await SupabaseService.addExpenseRecord(expenseData)
    return { type: 'expense', record }
  }

  /**
   * Save fertigation record
   */
  const saveFertigationRecord = async ({
    data,
    date,
    dayNotes,
    farm
  }: ActivityHandlerParams): Promise<{ type: 'fertigation'; record: any }> => {
    const farmId = farm.id
    if (!farmId) throw new Error('Invalid farm selected')

    const fertigationData: any = {
      farm_id: farmId,
      date,
      fertilizer: data.fertilizer || '',
      quantity: parseFloat(data.quantity || '0'),
      area: farm.area || 0,
      notes: dayNotes || ''
    }

    const record = await SupabaseService.addFertigationRecord(fertigationData)
    return { type: 'fertigation', record }
  }

  /**
   * Save soil test record
   */
  const saveSoilTestRecord = async ({
    data,
    date,
    dayNotes,
    farm
  }: ActivityHandlerParams): Promise<{ type: 'soil_test'; record: any }> => {
    const farmId = farm.id
    if (!farmId) throw new Error('Invalid farm selected')

    const testData: any = {
      farm_id: farmId,
      date,
      test_type: 'soil',
      ph: parseFloat(data.ph || '0'),
      nitrogen: parseFloat(data.nitrogen || '0'),
      phosphorus: parseFloat(data.phosphorus || '0'),
      potassium: parseFloat(data.potassium || '0'),
      notes: dayNotes || ''
    }

    const record = await SupabaseService.addSoilTestRecord(testData)
    return { type: 'soil_test', record }
  }

  /**
   * Save petiole test record
   */
  const savePetioleTestRecord = async ({
    data,
    date,
    dayNotes,
    farm
  }: ActivityHandlerParams): Promise<{ type: 'petiole_test'; record: any }> => {
    const farmId = farm.id
    if (!farmId) throw new Error('Invalid farm selected')

    const testData: any = {
      farm_id: farmId,
      date,
      test_type: 'petiole',
      nitrogen: parseFloat(data.nitrogen || '0'),
      phosphorus: parseFloat(data.phosphorus || '0'),
      potassium: parseFloat(data.potassium || '0'),
      notes: dayNotes || ''
    }

    const record = await SupabaseService.addPetioleTestRecord(testData)
    return { type: 'petiole_test', record }
  }

  const saveLogEntryForFarm = async (
    logEntry: any,
    date: string,
    dayNotes: string,
    farm: Farm
  ): Promise<any> => {
    const { type, data } = logEntry

    // Use handler functions for basic activity types
    switch (type) {
      case 'irrigation':
        return await saveIrrigationRecord({ data, date, dayNotes, farm })

      case 'spray':
        return await saveSprayRecord({ data, date, dayNotes, farm })

      case 'harvest':
        return await saveHarvestRecord({ data, date, dayNotes, farm })

      case 'expense':
        return await saveExpenseRecord({ data, date, dayNotes, farm })

      case 'fertigation':
        return await saveFertigationRecord({ data, date, dayNotes, farm })

      case 'soil_test':
        return await saveSoilTestRecordWithReport({ logEntry, data, date, dayNotes, farm })

      case 'petiole_test':
        return await savePetioleTestRecordWithReport({ logEntry, data, date, dayNotes, farm })

      default:
        throw new Error(`Unsupported activity type: ${type}`)
    }
  }

  /**
   * Save soil test record with report handling (complex case)
   */
  const saveSoilTestRecordWithReport = async ({
    logEntry,
    data,
    date,
    dayNotes,
    farm
  }: {
    logEntry: any
    data: any
    date: string
    dayNotes: string
    farm: Farm
  }): Promise<{ type: 'soil_test'; record: any }> => {
    const farmId = farm.id
    if (!farmId) throw new Error('Invalid farm selected')

    const reportMeta = (logEntry.meta?.report || null) as ReportAttachmentMeta | null

    const combineNotes = [dayNotes]
    if (reportMeta?.summary) combineNotes.push(reportMeta.summary)

    const combinedParameters = normalizeParsedParameters(reportMeta?.parsedParameters || {})

    // Manual entries (higher priority - will override parsed parameters)
    const manualEntries = createParameterEntries(data, [
      ['pH'],
      ['ec'],
      ['organicCarbon'],
      ['organicMatter'],
      ['nitrogen'],
      ['phosphorus'],
      ['potassium']
    ])

    // Additional entries with alternative field names
    const additionalEntries = createParameterEntries(data, [
      ['calcium'],
      ['magnesium'],
      ['sulfur', 'sulphur'],
      ['iron', 'ferrous'],
      ['manganese'],
      ['zinc'],
      ['copper'],
      ['boron'],
      ['molybdenum'],
      ['sodium'],
      ['chloride'],
      ['calciumCarbonate'],
      ['carbonate'],
      ['bicarbonate']
    ])

    // Add entries with validation (manual entries override additional entries)
    addValidEntries(combinedParameters, additionalEntries)
    addValidEntries(combinedParameters, manualEntries)

    const record = await SupabaseService.addSoilTestRecord({
      farm_id: farmId,
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
      date_of_pruning: farm.dateOfPruning
    })

    return { type: 'soil_test', record }
  }

  /**
   * Save petiole test record with report handling (complex case)
   */
  const savePetioleTestRecordWithReport = async ({
    logEntry,
    data,
    date,
    dayNotes,
    farm
  }: {
    logEntry: any
    data: any
    date: string
    dayNotes: string
    farm: Farm
  }): Promise<{ type: 'petiole_test'; record: any }> => {
    const farmId = farm.id
    if (!farmId) throw new Error('Invalid farm selected')

    const reportMeta = (logEntry.meta?.report || null) as ReportAttachmentMeta | null

    const combineNotes = [dayNotes]
    if (reportMeta?.summary) combineNotes.push(reportMeta.summary)

    const parameters: Record<string, number> = { ...(reportMeta?.parsedParameters || {}) }

    const pushParameter = (key: string, rawValue: unknown) => {
      const numericValue = typeof rawValue === 'string' ? parseFloat(rawValue) : Number(rawValue)
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
    pushParameter('ammonium_nitrogen', data.ammonical_nitrogen)

    const record = await SupabaseService.addPetioleTestRecord({
      farm_id: farmId,
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
      date_of_pruning: farm.dateOfPruning
    })

    return { type: 'petiole_test', record }
  }

  const handleDashboardLogsSubmit = async (
    logs: any[],
    date: string,
    dayNotes: string,
    dayPhotos: File[]
  ) => {
    if (!addLogFarmId) {
      setError('Select a farm before saving logs')
      return
    }

    const targetFarm = farms.find((farm) => farm.id === addLogFarmId)
    if (!targetFarm) {
      setError('Selected farm not found')
      return
    }

    setIsSubmittingLogs(true)

    try {
      let firstRecordId: number | null = null
      let photoUploadFailed = false

      for (let i = 0; i < logs.length; i++) {
        const logEntry = logs[i]
        const res = await saveLogEntryForFarm(logEntry, date, dayNotes, targetFarm)
        const { record } = res

        if (i === 0 && record?.id) {
          firstRecordId = record.id
        }
      }

      if (firstRecordId && dayPhotos && dayPhotos.length > 0) {
        for (const photo of dayPhotos) {
          try {
            await PhotoService.uploadPhoto(photo, 'day_photos', firstRecordId)
          } catch {
            photoUploadFailed = true
          }
        }
      }

      closeAddLogsModal()
      setError(photoUploadFailed ? 'Unable to upload some photos right now.' : null)
      await refreshFarmData(addLogFarmId)
    } catch {
      setError('Unable to add data logs right now.')
    } finally {
      setIsSubmittingLogs(false)
    }
  }

  const handleTaskComplete = async (task: AggregatedTask) => {
    try {
      setCompletingTaskId(task.id)
      await SupabaseService.completeTask(task.id)
      await refreshFarmData(task.farmId)
      setError(null)
    } catch (err) {
      setError('Unable to complete task right now.')
    } finally {
      setCompletingTaskId(null)
    }
  }

  const now = useMemo(() => new Date(), [])
  const weekAgo = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() - 7)
    return date
  }, [])

  const filteredActivities = useMemo(() => {
    return allActivities
      .filter((activity) => {
        const activityDate = getActivityDate(activity)
        if (!activityDate) return false

        if (activityFilter === 'today') {
          return activityDate.toDateString() === now.toDateString()
        }

        if (activityFilter === 'week') {
          return activityDate >= weekAgo
        }

        return true
      })
      .slice(0, ACTIVITY_LIMIT)
  }, [allActivities, activityFilter, now, weekAgo])

  const overdueTasks = useMemo(
    () =>
      allTasks.filter((task) => {
        const dueDate = getTaskDueDate(task)
        return dueDate ? dueDate < now : false
      }),
    [allTasks, now]
  )

  const upcomingTasks = useMemo(() => {
    return allTasks.filter((task) => {
      const dueDate = getTaskDueDate(task)
      if (!dueDate) return false
      const difference = dueDate.getTime() - now.getTime()
      const days = difference / (1000 * 60 * 60 * 24)
      return days >= -1 && days <= 7
    })
  }, [allTasks, now])

  const metrics = useMemo(() => {
    let weeklyExpense = 0

    allActivities.forEach((activity) => {
      const activityDate = getActivityDate(activity)
      if (!activityDate || activityDate < weekAgo) return

      if (isExpenseActivity(activity)) {
        weeklyExpense += Number(activity.expense?.cost || 0)
      }
    })

    const insights: Array<{
      id: string
      title: string
      description: string
      severity: 'high' | 'medium' | 'low' | 'suggestion'
    }> = []

    if (overdueTasks.length > 0) {
      insights.push({
        id: 'overdue',
        title: `${overdueTasks.length} task${overdueTasks.length > 1 ? 's' : ''} overdue`,
        description: 'Prioritize these items to keep field work on track.',
        severity: 'high'
      })
    }

    if (weeklyExpense === 0) {
      insights.push({
        id: 'expense-gap',
        title: 'Expenses missing',
        description: 'Record costs to keep profitability analysis current.',
        severity: 'low'
      })
    }

    return {
      weeklyExpense,
      totalFarms: farms.length,
      insights
    }
  }, [allActivities, allTasks.length, farms.length, overdueTasks.length, weekAgo])

  const aiRecommendationCount = metrics.insights.length

  const displayName = useMemo(() => {
    const name =
      (user?.user_metadata?.full_name as string | undefined) ||
      (user?.email ? user.email.split('@')[0] : 'Farmer')
    return capitalize(name)
  }, [user?.email, user?.user_metadata?.full_name])

  const insightCards = metrics.insights

  const farmOptions = useMemo(
    () =>
      farms
        .filter((farm): farm is Farm & { id: number } => typeof farm.id === 'number')
        .map((farm) => ({ id: farm.id, name: capitalize(farm.name) })),
    [farms]
  )

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Preparing your command center…</p>
        </div>
      </div>
    )
  }

  if (error && farms.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <Card className="w-full max-w-sm">
          <CardHeader className="items-center text-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <CardTitle className="text-base">Dashboard unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (farms.length === 0) {
    return (
      <EmptyStateDashboard
        userName={displayName}
        onCreateFarm={() => window.location.assign('/farms')}
      />
    )
  }

  return (
    <div className={`min-h-screen bg-background pb-24 ${className} overflow-x-hidden`}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 pt-6 sm:px-6">
        <section className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">Dashboard</p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
            {getGreeting(displayName)}
          </h1>
          <p className="text-sm text-muted-foreground">
            Unified snapshot across all your farms. Focus on what needs attention today.
          </p>
        </section>

        {error && farms.length > 0 ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        ) : null}

        <section>
          <div className="flex flex-row flex-wrap gap-3 md:flex-nowrap">
            <Link href="/farms" className="group flex min-w-[200px] flex-1">
              <Card className="flex w-full items-center justify-between gap-4 rounded-2xl border-none bg-primary text-primary-foreground shadow-md transition hover:bg-primary/90">
                <CardHeader className="space-y-1 p-4">
                  <CardTitle className="text-sm font-medium">Total farms</CardTitle>
                  <p className="text-xs text-primary-foreground/80 transition group-hover:text-primary-foreground/90">
                    Tap to manage farms
                  </p>
                </CardHeader>
                <CardContent className="p-4 text-right">
                  <p className="text-3xl font-semibold">{metrics.totalFarms}</p>
                </CardContent>
              </Card>
            </Link>

            <Card className="flex min-w-[200px] flex-1 items-center justify-between gap-4 rounded-2xl border border-border shadow-sm">
              <CardHeader className="space-y-1 p-4">
                <CardTitle className="text-sm font-medium">AI recommendations</CardTitle>
                <p className="text-xs text-muted-foreground">Insights generated just now</p>
              </CardHeader>
              <CardContent className="p-4 text-right">
                <p className="text-3xl font-semibold">{aiRecommendationCount}</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent activity</h2>
            <div className="inline-flex rounded-full border border-border p-1">
              {(
                [
                  { label: 'Today', value: 'today' },
                  { label: 'This week', value: 'week' },
                  { label: 'All', value: 'all' }
                ] as Array<{ label: string; value: ActivityFilter }>
              ).map((option) => (
                <button
                  key={option.value}
                  onClick={() => setActivityFilter(option.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    option.value === activityFilter
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <Card className="rounded-2xl border border-border shadow-sm">
            <CardContent className="space-y-2 p-4">
              {loading && allActivities.length === 0 ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : filteredActivities.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
                  <CalendarClock className="h-10 w-10 text-muted-foreground/50" />
                  <p>No activity logged for this period yet.</p>
                </div>
              ) : (
                filteredActivities.map((activity) => {
                  const activityDate = getActivityDate(activity)
                  const formattedTimestamp = activityDate
                    ? formatDateTime(activityDate.toISOString())
                    : 'Just now'
                  const supportingText = activity.farmName || undefined

                  return (
                    <ActivityLogRow
                      key={
                        activity.id
                          ? `${activity.type}-${activity.id}`
                          : generateStableActivityKey(activity)
                      }
                      activityType={activity.type}
                      title={getActivityDisplayData(activity)}
                      topRight={formattedTimestamp}
                      supportingText={supportingText}
                      variant="default"
                    />
                  )
                })
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tasks (next 7 days)</h2>
            <Button asChild size="sm" variant="outline">
              <Link href="/reminders/new">+ New task</Link>
            </Button>
          </div>

          <Card className="rounded-2xl border border-border shadow-sm">
            <CardContent className="space-y-3 p-4">
              {upcomingTasks.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
                  <ListChecks className="h-10 w-10 text-muted-foreground/50" />
                  <p>Nothing scheduled for the next few days. Great job staying ahead!</p>
                </div>
              ) : (
                upcomingTasks.map((task) => {
                  const dueDate = getTaskDueDate(task)
                  const isOverdue = dueDate ? dueDate < now : false
                  const dueLabel = dueDate
                    ? `${isOverdue ? 'Overdue • ' : ''}${formatDate(dueDate.toISOString())}`
                    : 'No due date'

                  return (
                    <div
                      key={task.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {task.title || 'Untitled task'}
                          </p>
                          <Badge variant={priorityBadgeVariant(task.priority)}>
                            {task.priority ? capitalize(task.priority) : 'Normal'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {task.farmName} • {dueLabel}
                        </p>
                        {task.description ? (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {task.description}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0 text-xs"
                        onClick={() => handleTaskComplete(task)}
                        disabled={completingTaskId === task.id}
                      >
                        {completingTaskId === task.id ? 'Completing…' : 'Done'}
                      </Button>
                    </div>
                  )
                })
              )}

              {overdueTasks.length > 0 && (
                <div className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
                  {overdueTasks.length} task{overdueTasks.length > 1 ? 's' : ''} overdue. Address
                  these first to avoid production delays.
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Insights & alerts</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {insightCards.length === 0 ? (
              <Card className="rounded-2xl border border-dashed border-border bg-muted/30">
                <CardContent className="flex flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 text-muted-foreground/50" />
                  <p>All clear for now. We will surface new insights here when data changes.</p>
                </CardContent>
              </Card>
            ) : (
              insightCards.map((insight) => (
                <Card key={insight.id} className="rounded-2xl border border-border shadow-sm">
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-center gap-2">
                      {insight.severity === 'high' ? (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-primary" />
                      )}
                      <p className="text-sm font-semibold text-foreground">{insight.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Quick actions</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                { title: 'Add log', onClick: () => openAddLogsModal() },
                { title: 'Performance', href: '/performance' },
                { title: 'AI assistant', href: '/ai-assistant' },
                { title: 'Fertilizer calc', href: '/calculators/fertilizer' }
              ] as Array<{ title: string; href?: string; onClick?: () => void }>
            ).map((shortcut) =>
              shortcut.href ? (
                <Link
                  key={shortcut.title}
                  href={shortcut.href}
                  className="rounded-2xl border border-border bg-muted/40 p-4 text-center text-sm font-medium text-foreground transition hover:bg-muted"
                >
                  {shortcut.title}
                </Link>
              ) : (
                <button
                  key={shortcut.title}
                  type="button"
                  onClick={shortcut.onClick}
                  className="rounded-2xl border border-border bg-muted/40 p-4 text-center text-sm font-medium text-foreground transition hover:bg-muted"
                >
                  {shortcut.title}
                </button>
              )
            )}
          </div>
        </section>
      </div>

      <UnifiedDataLogsModal
        isOpen={showAddLogsModal}
        onClose={closeAddLogsModal}
        onSubmit={handleDashboardLogsSubmit}
        isSubmitting={isSubmittingLogs}
        farmId={addLogFarmId ?? undefined}
        mode="add"
        farmOptions={farmOptions}
        selectedFarmId={addLogFarmId ?? undefined}
        onFarmChange={(farmId) => setAddLogFarmId(farmId)}
      />
    </div>
  )
}
