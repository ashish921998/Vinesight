'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { SupabaseService } from '@/lib/supabase-service'
import { PhotoService } from '@/lib/photo-service'
import { FarmHeader } from '@/components/farm-details/FarmHeader'
import { FarmOverview } from '@/components/farm-details/FarmOverview'
import { QuickActions } from '@/components/farm-details/QuickActions'
import { ActivityFeed } from '@/components/farm-details/ActivityFeed'
import { SimpleWeatherCard } from '@/components/dashboard/SimpleWeatherCard'
import { RemainingWaterCard } from '@/components/farm-details/RemainingWaterCard'
import { UnifiedDataLogsModal } from '@/components/farm-details/UnifiedDataLogsModal'
import type { ReportAttachmentMeta } from '@/types/reports'
import { WaterCalculationModal } from '@/components/farm-details/WaterCalculationModal'
import { EditRecordModal } from '@/components/journal/EditRecordModal'
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
import { AIInsightsCarousel } from '@/components/ai/AIInsightsCarousel'
import { PestPredictionService } from '@/lib/pest-prediction-service'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Farm } from '@/types/types'
import { capitalize } from '@/lib/utils'
import { transformActivitiesToLogEntries } from '@/lib/activity-display-utils'

interface DashboardData {
  farm: Farm | null
  pendingTasksCount: number
  recentIrrigations: any[]
  recentActivities: any[]
  totalHarvest: number
  totalWaterUsage: number
  pendingTasks: any[]
  recordCounts: {
    irrigation: number
    spray: number
    fertigation: number
    harvest: number
    expense: number
    soilTest: number
  }
}

export default function FarmDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const farmId = params.id as string
  const { user } = useSupabaseAuth()

  const [dashboardData, setDashboardData] = useState<DashboardData>()
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Modal states
  const [showDataLogsModal, setShowDataLogsModal] = useState(false)
  const [showWaterCalculationModal, setShowWaterCalculationModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deletingRecord, setDeletingRecord] = useState<any>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Edit mode state for UnifiedDataLogsModal
  const [editModeLogs, setEditModeLogs] = useState<any[]>([])
  const [editModeDate, setEditModeDate] = useState<string>('')
  const [editMode, setEditMode] = useState<'add' | 'edit'>('add')

  // Farm edit modal states
  const [showFarmModal, setShowFarmModal] = useState(false)
  const [farmSubmitLoading, setFarmSubmitLoading] = useState(false)

  // AI Features state
  const [aiPredictionsGenerated, setAiPredictionsGenerated] = useState(false)

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await SupabaseService.getDashboardSummary(parseInt(farmId))
      setDashboardData({
        ...data,
        farm: data.farm
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [farmId])

  useEffect(() => {
    if (farmId) {
      loadDashboardData()
    }
  }, [farmId, loadDashboardData])

  // Handle edit parameters from logs page
  useEffect(() => {
    const action = searchParams.get('action')
    const date = searchParams.get('date')
    const activitiesParam = searchParams.get('activities')

    if (action === 'edit' && date && activitiesParam) {
      try {
        const activities = JSON.parse(decodeURIComponent(activitiesParam))
        const existingLogs = transformActivitiesToLogEntries(activities)

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
        console.error('Error parsing edit parameters:', error)
      }
    }
  }, [searchParams, farmId, router])

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

  const completeTask = async (taskId: number) => {
    try {
      await SupabaseService.completeTask(taskId)
      await loadDashboardData()
    } catch (error) {
      console.error('Error completing task:', error)
    }
  }

  // Unified handler for all data logs
  const handleDataLogsSubmit = async (
    logs: any[],
    date: string,
    dayNotes: string,
    dayPhotos: File[]
  ) => {
    setIsSubmitting(true)
    try {
      let firstRecordId: number | null = null

      for (let i = 0; i < logs.length; i++) {
        const logEntry = logs[i]
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
      }

      // Upload day photos only once, associated with the first record
      if (firstRecordId && dayPhotos && dayPhotos.length > 0) {
        for (const photo of dayPhotos) {
          try {
            await PhotoService.uploadPhoto(photo, 'day_photos', firstRecordId)
          } catch (photoError) {
            console.error('Error uploading day photo:', photoError)
          }
        }
      }

      setShowDataLogsModal(false)
      await loadDashboardData()
    } catch (error) {
      console.error('Error saving data logs:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const saveLogEntry = async (logEntry: any, date: string, dayNotes: string) => {
    const { type, data } = logEntry
    let record

    switch (type) {
      case 'irrigation':
        record = await SupabaseService.addIrrigationRecord({
          farm_id: parseInt(farmId),
          date: date,
          duration: parseFloat(data.duration || '0'),
          area: parseFloat(data.area || '0') || dashboardData?.farm?.area || 0,
          growth_stage: 'Active',
          moisture_status: 'Good',
          system_discharge: dashboardData?.farm?.systemDischarge || 100,
          notes: dayNotes || '',
          date_of_pruning: dashboardData?.farm?.dateOfPruning
        })

        // Update soil water level when irrigation is added
        if (record && dashboardData?.farm) {
          const duration = parseFloat(data.duration || '0')
          const systemDischarge = dashboardData.farm.systemDischarge || 100

          if (duration > 0 && systemDischarge > 0) {
            // Calculate water added from this irrigation (in mm)
            const waterAdded = duration * systemDischarge
            const currentWaterLevel = dashboardData.farm.remainingWater || 0
            const newWaterLevel = currentWaterLevel + waterAdded

            await SupabaseService.updateFarm(parseInt(farmId), {
              remainingWater: newWaterLevel,
              waterCalculationUpdatedAt: new Date().toISOString()
            })

            // Check if new water level needs alert
            const { NotificationService } = await import('@/lib/notification-service')
            const notificationService = NotificationService.getInstance()
            notificationService.checkWaterLevelAndAlert(
              capitalize(dashboardData.farm.name),
              newWaterLevel
            )
          }
        }
        break

      case 'spray': {
        // Handle spray record with chemicals array (new format) or single chemical (old format)
        const sprayData: any = {
          farm_id: parseInt(farmId),
          date: date,
          chemicals: data.chemicals || [],
          area: dashboardData?.farm?.area || 0,
          weather: 'Clear',
          operator: 'Farm Owner',
          notes: dayNotes || '',
          date_of_pruning: dashboardData?.farm?.dateOfPruning
        }

        // Only add water_volume if it's a valid positive number
        const waterVolume = parseFloat(data.water_volume ?? '')
        if (Number.isFinite(waterVolume) && waterVolume > 0) {
          sprayData.water_volume = waterVolume
        }

        // Handle legacy single chemical format for backward compatibility
        if (data.chemicals && Array.isArray(data.chemicals) && data.chemicals.length > 0) {
          // New format: use chemicals array, set first chemical as primary for backward compatibility
          const firstChemical = data.chemicals[0]
          sprayData.chemical = firstChemical.name || 'Unknown'
          sprayData.quantity_amount = firstChemical.quantity || 0
          sprayData.quantity_unit = firstChemical.unit || 'gm/L'
          sprayData.dose = `${firstChemical.quantity || 0}${firstChemical.unit || 'gm/L'}`
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
          notes: dayNotes || '',
          date_of_pruning: dashboardData?.farm?.dateOfPruning
        })
        break

      case 'expense':
        record = await SupabaseService.addExpenseRecord({
          farm_id: parseInt(farmId),
          date: date,
          type: data.type || 'other',
          description: data.description || '',
          cost: parseFloat(data.cost || '0'),
          remarks: dayNotes || '',
          date_of_pruning: dashboardData?.farm?.dateOfPruning
        })
        break

      case 'fertigation':
        record = await SupabaseService.addFertigationRecord({
          farm_id: parseInt(farmId),
          date: date,
          fertilizer: data.fertilizer?.trim() || 'Unknown',
          quantity: data.quantity || 0,
          unit: data.unit || 'kg/acre',
          area: dashboardData?.farm?.area || 0,
          purpose: data.purpose || 'General',
          notes: dayNotes || '',
          date_of_pruning: dashboardData?.farm?.dateOfPruning
        })
        break

      case 'soil_test': {
        const reportMeta = (logEntry.meta?.report || null) as ReportAttachmentMeta | null

        const combineNotes = [dayNotes]
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

        const combineNotes = [dayNotes]
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
        pushParameter('ammonium_nitrogen', data.ammonical_nitrogen)

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
      case 'irrigation':
        record = await SupabaseService.updateIrrigationRecord(originalId, {
          farm_id: parseInt(farmId),
          date: originalDate,
          duration: parseFloat(data.duration || '0'),
          area: parseFloat(data.area || '0') || dashboardData?.farm?.area || 0,
          growth_stage: 'Active',
          moisture_status: 'Good',
          system_discharge: dashboardData?.farm?.systemDischarge || 100,
          notes: dayNotes || '',
          date_of_pruning: dashboardData?.farm?.dateOfPruning
        })
        break

      case 'spray': {
        // Handle spray record with chemicals array (new format) or single chemical (old format)
        const sprayData: any = {
          farm_id: parseInt(farmId),
          date: originalDate,
          chemicals: data.chemicals || [],
          area: dashboardData?.farm?.area || 0,
          weather: 'Clear',
          operator: 'Farm Owner',
          notes: dayNotes || '',
          date_of_pruning: dashboardData?.farm?.dateOfPruning
        }

        // Only add water_volume if it's a valid positive number
        const waterVolume = parseFloat(data.water_volume ?? '')
        if (Number.isFinite(waterVolume) && waterVolume > 0) {
          sprayData.water_volume = waterVolume
        }

        // Handle legacy single chemical format for backward compatibility
        if (data.chemicals && Array.isArray(data.chemicals) && data.chemicals.length > 0) {
          // New format: use chemicals array, set first chemical as primary for backward compatibility
          const firstChemical = data.chemicals[0]
          sprayData.chemical = firstChemical.name || 'Unknown'
          sprayData.quantity_amount = firstChemical.quantity || 0
          sprayData.quantity_unit = firstChemical.unit || 'gm/L'
          sprayData.dose = `${firstChemical.quantity || 0}${firstChemical.unit || 'gm/L'}`
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
          notes: dayNotes || '',
          date_of_pruning: dashboardData?.farm?.dateOfPruning
        })
        break

      case 'expense':
        record = await SupabaseService.updateExpenseRecord(originalId, {
          farm_id: parseInt(farmId),
          date: originalDate,
          type: data.type || 'other',
          description: data.description || '',
          cost: parseFloat(data.cost || '0'),
          remarks: dayNotes || '',
          date_of_pruning: dashboardData?.farm?.dateOfPruning
        })
        break

      case 'fertigation':
        record = await SupabaseService.updateFertigationRecord(originalId, {
          farm_id: parseInt(farmId),
          date: originalDate,
          fertilizer: data.fertilizer?.trim() || 'Unknown',
          quantity: data.quantity || 0,
          unit: data.unit || 'kg/acre',
          area: data.area || dashboardData?.farm?.area || 0,
          purpose: data.purpose || 'General',
          notes: dayNotes || '',
          date_of_pruning: dashboardData?.farm?.dateOfPruning
        })
        break

      case 'soil_test': {
        const reportMeta = (logEntry.meta?.report || null) as ReportAttachmentMeta | null

        const combineNotes = [dayNotes]
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

        const combineNotes = [dayNotes]
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
        pushParameter('ammonium_nitrogen', data.ammonical_nitrogen)

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

  const handleEditRecord = (record: any) => {
    setEditingRecord(record)
    setShowEditModal(true)
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

    // Check if there's only one activity - if so, use the dedicated edit modal
    if (activities.length === 1) {
      const activity = activities[0]

      // Transform activity to record format for EditRecordModal
      // Only include fields that EditRecordModal expects
      const record = {
        id: activity.id,
        type: activity.type,
        date: activity.date,
        notes: activity.notes || '',
        // Include type-specific fields that EditRecordModal handles
        ...(activity.type === 'irrigation' && {
          duration: activity.duration,
          area: activity.area,
          growth_stage: activity.growth_stage,
          moisture_status: activity.moisture_status,
          system_discharge: activity.system_discharge
        }),
        ...(activity.type === 'spray' && {
          chemical: activity.chemical,
          chemicals: activity.chemicals,
          water_volume: activity.water_volume,
          dose: activity.dose,
          quantity_amount: activity.quantity_amount,
          quantity_unit: activity.quantity_unit
        }),
        ...(activity.type === 'harvest' && {
          quantity: activity.quantity,
          grade: activity.grade,
          price: activity.price,
          buyer: activity.buyer
        }),
        ...(activity.type === 'fertigation' && {
          fertilizer: activity.fertilizer,
          quantity: activity.quantity,
          unit: activity.unit,
          purpose: activity.purpose,
          area: activity.area
        }),
        ...(activity.type === 'expense' && {
          type: activity.type,
          description: activity.description,
          cost: activity.cost,
          remarks: activity.remarks
        }),
        ...(activity.type === 'soil_test' && {
          parameters: activity.parameters,
          recommendations: activity.recommendations,
          report_url: activity.report_url,
          report_storage_path: activity.report_storage_path,
          report_filename: activity.report_filename,
          report_type: activity.report_type,
          extraction_status: activity.extraction_status,
          extraction_error: activity.extraction_error,
          parsed_parameters: activity.parsed_parameters,
          raw_notes: activity.raw_notes
        }),
        ...(activity.type === 'petiole_test' && {
          sample_id: activity.sample_id,
          parameters: activity.parameters,
          recommendations: activity.recommendations,
          report_url: activity.report_url,
          report_storage_path: activity.report_storage_path,
          report_filename: activity.report_filename,
          report_type: activity.report_type,
          extraction_status: activity.extraction_status,
          extraction_error: activity.extraction_error,
          parsed_parameters: activity.parsed_parameters,
          raw_notes: activity.raw_notes
        })
      }

      handleEditRecord(record)
    } else {
      // Multiple activities - use UnifiedDataLogsModal
      const existingLogs = transformActivitiesToLogEntries(activities)

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
        }
      }

      await loadDashboardData()
    } catch (error) {
      console.error('Error deleting date group:', error)
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
      }

      await loadDashboardData()
      setShowDeleteDialog(false)
      setDeletingRecord(null)
    } catch (error) {
      console.error('Error deleting record:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSaveRecord = () => {
    setShowEditModal(false)
    setEditingRecord(null)
    loadDashboardData()
  }

  // Farm edit and delete handlers
  const handleEditFarm = (farm: Farm) => {
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
        console.error('Error deleting farm:', error)
      }
    }
  }

  const handleFarmSubmit = async (farmData: any) => {
    try {
      setFarmSubmitLoading(true)
      await SupabaseService.updateFarm(parseInt(farmId), farmData)
      await loadDashboardData()
      setShowFarmModal(false)
    } catch (error) {
      console.error('Error updating farm:', error)
      throw error
    } finally {
      setFarmSubmitLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Farm Header */}
        {dashboardData?.farm && (
          <FarmHeader
            farm={dashboardData?.farm}
            loading={loading}
            onEdit={handleEditFarm}
            onDelete={handleDeleteFarm}
          />
        )}

        {/* Farm Overview */}
        <FarmOverview loading={loading} />

        {/* Weather Card */}
        {dashboardData?.farm && (
          <div className="px-4 mt-6 mb-4">
            <SimpleWeatherCard farm={dashboardData.farm} />
          </div>
        )}

        {/* Phase 3A: AI-Powered Features */}
        {/* {(dashboardData?.farm || process.env.NEXT_PUBLIC_BYPASS_AUTH) && (
          <div className="px-4 mb-6 space-y-4">
            <AIInsightsCarousel farmId={parseInt(farmId)} className="w-full" />
          </div>
        )} */}

        {/* Water Level Card - Only show if farm has irrigation records */}
        {dashboardData?.farm && dashboardData.recordCounts.irrigation > 0 && (
          <div className="px-4 mb-4">
            <RemainingWaterCard
              farm={dashboardData.farm}
              onCalculateClick={() => setShowWaterCalculationModal(true)}
            />
          </div>
        )}

        {/* Quick Actions */}
        <QuickActions
          onDataLogsClick={() => {
            // Reset edit mode state before opening modal for adding new logs
            setEditMode('add')
            setEditModeLogs([])
            setEditModeDate('')
            setShowDataLogsModal(true)
          }}
        />

        {/* Activity Feed */}
        <ActivityFeed
          recentActivities={dashboardData?.recentActivities || []}
          pendingTasks={dashboardData?.pendingTasks || []}
          loading={loading}
          onCompleteTask={completeTask}
          onEditRecord={handleEditRecord}
          onDeleteRecord={handleDeleteRecord}
          onEditDateGroup={handleEditDateGroup}
          onDeleteDateGroup={handleDeleteDateGroup}
          farmId={farmId}
        />

        {/* Unified Data Logs Modal */}
        <UnifiedDataLogsModal
          isOpen={showDataLogsModal}
          onClose={() => {
            setShowDataLogsModal(false)
            setEditMode('add')
            setEditModeLogs([])
            setEditModeDate('')
          }}
          onSubmit={handleDataLogsSubmit}
          isSubmitting={isSubmitting}
          farmId={parseInt(farmId)}
          mode={editMode}
          existingLogs={editModeLogs}
          selectedDate={editModeDate}
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

        {/* Edit Record Modal */}
        {editingRecord && (
          <EditRecordModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false)
              setEditingRecord(null)
            }}
            onSave={handleSaveRecord}
            record={editingRecord}
            recordType={
              editingRecord.type as
                | 'irrigation'
                | 'spray'
                | 'harvest'
                | 'fertigation'
                | 'expense'
                | 'soil_test'
            }
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

        {/* Farm Edit Modal */}
        {dashboardData?.farm && (
          <FarmModal
            isOpen={showFarmModal}
            onClose={() => setShowFarmModal(false)}
            onSubmit={handleFarmSubmit}
            editingFarm={dashboardData.farm}
            isSubmitting={farmSubmitLoading}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}
