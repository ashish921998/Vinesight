'use client'

import React, { useState, useEffect, useCallback, useMemo, useId, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/Skeleton'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { UnifiedDataLogsModal } from '@/components/farm-details/UnifiedDataLogsModal'
import { EditRecordModal } from '@/components/journal/EditRecordModal'

import { useFarms, useLogs } from '@/hooks/farms/useFarmQueries'
import { useFarmLogMutations } from '@/hooks/farms/useFarmLogMutations'
import { farmKeys, type LogFilters } from '@/lib/farm-query-keys'
import { getActivityDisplayData } from '@/lib/activity-display-utils'
import { getLogTypeIcon, getLogTypeBgColor, getLogTypeColor } from '@/lib/log-type-config'
import { cn, capitalize, calculateDaysAfterPruning } from '@/lib/utils'
import { toast } from 'sonner'
import { parseFarmId, handleDailyNotesAndPhotosAfterLogs } from '@/lib/daily-note-utils'

import { type Farm } from '@/types/types'

import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  X,
  Check,
  ChevronsUpDown,
  Scissors,
  Droplets
} from 'lucide-react'
import { useUserPreferences } from '@/hooks/useUserPreferences'

/* ---------- Helpers (moved out of component) ---------- */

const formatLogDate = (dateString: string): string => {
  if (!dateString) return 'Invalid date'

  const [datePart] = dateString.split('T')
  const [yearStr, monthStr, dayStr] = (datePart || '').split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)

  if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const fallback = new Date(dateString)
  if (Number.isNaN(fallback.getTime())) {
    return 'Invalid date'
  }

  return fallback.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// Using calculateDaysAfterPruning from utils with referenceDate parameter

/* ---------- small debounce hook ---------- */
function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState<T>(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

/* ---------- Types ---------- */

interface ActivityLog {
  id: number
  type: string
  date: string
  notes?: string
  duration?: number
  chemical?: string
  chemicals?: Array<{ name: string; quantity: number; unit: string }>
  quantity?: number
  cost?: number
  fertilizer?: string
  unit?: string
  created_at: string
}

const ITEMS_PER_PAGE_OPTIONS = [10, 50, 100]
const DEFAULT_ITEMS_PER_PAGE = 10

/* ---------- Memoized Logs List to avoid unnecessary re-renders ---------- */
const LogsList = React.memo(function LogsList({
  logs,
  onEdit,
  onDelete,
  currentFarm
}: {
  logs: ActivityLog[]
  onEdit: (log: ActivityLog) => void
  onDelete: (log: ActivityLog) => void
  currentFarm: Farm | null
}) {
  return (
    <div className="space-y-2">
      {logs.map((log) => {
        const Icon = getLogTypeIcon(log.type)
        const daysAfterPruning = calculateDaysAfterPruning(currentFarm?.dateOfPruning, log.date)

        return (
          <div
            key={`${log.type}-${log.id}`}
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-100"
            role="button"
            tabIndex={0}
            aria-label={`Edit ${log.type} log from ${log.date}`}
            onClick={() => onEdit(log)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onEdit(log)
              }
            }}
            onKeyUp={(e) => {
              if (e.key === ' ') {
                e.preventDefault()
                onEdit(log)
              }
            }}
          >
            <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-start">
              <div className={`p-2 ${getLogTypeBgColor(log.type)} rounded-md flex-shrink-0`}>
                <Icon className={`h-4 w-4 ${getLogTypeColor(log.type)}`} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                  <h3 className="font-medium text-sm text-gray-900 capitalize truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
                    {getActivityDisplayData(log)}
                  </h3>
                  <span className="text-blue-600 text-xs font-medium">
                    {formatLogDate(log.date)}
                  </span>
                </div>
                {daysAfterPruning !== null && (
                  <div className="mt-2">
                    <div
                      className={`inline-flex items-center gap-1 text-white text-xs font-medium px-2 py-1 rounded-full cursor-help ${
                        daysAfterPruning >= 0 ? 'bg-green-500' : 'bg-orange-500'
                      }`}
                    >
                      <Scissors className="h-3 w-3" />
                      {daysAfterPruning >= 0 ? `${daysAfterPruning}d` : `${daysAfterPruning}d`}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(log)
                  }}
                  className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  title="Edit this log"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(log)
                  }}
                  className="h-7 w-7 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                  title="Delete this log"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
})

/* ---------- Component ---------- */
export default function FarmLogsPage() {
  const params = useParams()
  const router = useRouter()
  const farmId = params.id as string

  const [selectedFarm, setSelectedFarm] = useState<string>(farmId)
  const [currentPage, setCurrentPage] = useState(1)

  const queryClient = useQueryClient()
  const selectedFarmIdNum = Number.parseInt(selectedFarm, 10)
  const selectedFarmIdValid = Number.isFinite(selectedFarmIdNum)

  // Farm list + the active farm come from the shared cache (no standalone fetch).
  const farmsQuery = useFarms()
  const farms = useMemo<Farm[]>(() => farmsQuery.data ?? [], [farmsQuery.data])
  const currentFarm = useMemo<Farm | null>(
    () => farms.find((f) => f.id?.toString() === selectedFarm) ?? null,
    [farms, selectedFarm]
  )

  // Reused journal mutation hooks: every add/delete invalidates logs + summary.
  const logMutations = useFarmLogMutations(selectedFarmIdNum)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [multiSelectOpen, setMultiSelectOpen] = useState(false)
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE)
  const [showUnifiedModal, setShowUnifiedModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [existingLogsForEdit, setExistingLogsForEdit] = useState<any[]>([])
  const [existingDayNoteForEdit, setExistingDayNoteForEdit] = useState<{
    id: number | null
    notes: string
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingRecord, setDeletingRecord] = useState<ActivityLog | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [editingRecord, setEditingRecord] = useState<ActivityLog | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const { preferences: userPreferences } = useUserPreferences(currentFarm?.userId)

  const activityTypeListboxId = useId()

  // debounce filters — these feed the query key, so the list re-fetches when a
  // debounced value changes rather than via an imperative search call.
  const debouncedQuery = useDebounced(searchQuery, 300)
  const debouncedDateFrom = useDebounced(dateFrom, 300)
  const debouncedDateTo = useDebounced(dateTo, 300)
  const debouncedActivityTypes = useDebounced(selectedActivityTypes, 300)

  const logFilters = useMemo<LogFilters>(
    () => ({
      searchQuery: debouncedQuery,
      // Sort + dedupe so semantically identical selections (same types, any
      // order) map to one cache entry instead of spawning redundant fetches.
      selectedActivityTypes: [...new Set(debouncedActivityTypes)].toSorted(),
      dateFrom: debouncedDateFrom,
      dateTo: debouncedDateTo,
      page: currentPage,
      itemsPerPage
    }),
    [
      debouncedQuery,
      debouncedActivityTypes,
      debouncedDateFrom,
      debouncedDateTo,
      currentPage,
      itemsPerPage
    ]
  )

  const logsQuery = useLogs(selectedFarmIdValid ? selectedFarmIdNum : null, logFilters)
  const logs = logsQuery.data?.logs ?? []
  const totalLogs = logsQuery.data?.totalCount ?? 0

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalLogs / itemsPerPage)),
    [totalLogs, itemsPerPage]
  )

  // Surface fetch failures (the imperative version toasted on catch). Guard with
  // a ref so a background refetch failure (e.g. on window refocus over a flaky
  // connection) toasts only once per failure cycle and re-arms after a success,
  // rather than spamming a new toast for every fresh Error instance.
  const loggedLogsErrorRef = useRef(false)
  useEffect(() => {
    if (logsQuery.isError && !loggedLogsErrorRef.current) {
      loggedLogsErrorRef.current = true
      console.error('Error searching logs:', logsQuery.error)
      toast.error('Failed to search logs')
    } else if (logsQuery.isSuccess) {
      loggedLogsErrorRef.current = false
    }
  }, [logsQuery.isError, logsQuery.isSuccess, logsQuery.error])

  // The farm dropdown depends on this list, so surface a load failure instead of
  // leaving the user with a silently empty selector. Same once-per-cycle guard.
  const loggedFarmsErrorRef = useRef(false)
  useEffect(() => {
    if (farmsQuery.isError && !loggedFarmsErrorRef.current) {
      loggedFarmsErrorRef.current = true
      console.error('Error loading farms:', farmsQuery.error)
      toast.error('Failed to load farms')
    } else if (farmsQuery.isSuccess) {
      loggedFarmsErrorRef.current = false
    }
  }, [farmsQuery.isError, farmsQuery.isSuccess, farmsQuery.error])

  // Refresh the logs list + dashboard summary after writes that don't already
  // flow through the journal mutation hooks (daily-note save, record edit).
  const invalidateFarmLogs = useCallback(() => {
    if (!selectedFarmIdValid) return
    queryClient.invalidateQueries({ queryKey: farmKeys.logs(selectedFarmIdNum) })
    queryClient.invalidateQueries({ queryKey: farmKeys.summary(selectedFarmIdNum) })
    queryClient.invalidateQueries({ queryKey: farmKeys.records(selectedFarmIdNum) })
    // EditRecordModal can update soil/petiole tests, so refresh lab-test surfaces
    // (lab workspace, consultant farm detail) that read farmKeys.labTests too.
    queryClient.invalidateQueries({ queryKey: farmKeys.labTests(selectedFarmIdNum) })
  }, [queryClient, selectedFarmIdNum, selectedFarmIdValid])

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedActivityTypes([])
    setDateFrom('')
    setDateTo('')
    setCurrentPage(1)
  }, [])

  const activityTypes = useMemo(
    () => [
      { value: 'irrigation', label: 'Irrigation' },
      { value: 'spray', label: 'Spray' },
      { value: 'harvest', label: 'Harvest' },
      { value: 'expense', label: 'Expense' },
      { value: 'fertigation', label: 'Fertigation' },
      { value: 'soil_test', label: 'Soil Test' },
      { value: 'petiole_test', label: 'Petiole Test' },
      { value: 'daily_note', label: 'Daily Note' }
    ],
    []
  )

  const handleActivityTypeToggle = useCallback((activityType: string, checked: boolean) => {
    setSelectedActivityTypes((prev) =>
      checked ? [...prev, activityType] : prev.filter((t) => t !== activityType)
    )
    setCurrentPage(1)
  }, [])

  const handleFarmChange = useCallback(
    (farmId: string) => {
      setSelectedFarm(farmId)
      setCurrentPage(1)
      router.push(`/farms/${farmId}/logs`)
    },
    [router]
  )

  const handlePageChange = useCallback(
    (page: number) => {
      if (page < 1) return
      if (page > totalPages) return
      // currentPage is part of the query key, so this swaps to the page's cache entry.
      setCurrentPage(page)
      window.scrollTo(0, 0)
    },
    [totalPages]
  )

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
    // The query re-fetches off the changed key; no imperative search needed.
  }, [])

  /* ---------- saveLogEntry / handleSubmitLogs / edit / delete ---------- */
  // Writes go through the reused journal mutation hooks so each one invalidates
  // the logs list + dashboard summary; the per-type field mapping is unchanged.
  const saveLogEntry = async (logEntry: any, date: string, dayNotes: string) => {
    const { type, data } = logEntry
    let record
    const farmIdNum = parseFarmId(selectedFarm)

    switch (type) {
      case 'irrigation':
        record = await logMutations.irrigation.add.mutateAsync({
          farm_id: farmIdNum,
          date: date,
          duration: parseFloat(data.duration || '0'),
          area: parseFloat(data.area || '0') || currentFarm?.area || 0,
          growth_stage: 'Active',
          moisture_status: 'Good',
          system_discharge: currentFarm?.systemDischarge || 100,
          notes: data.notes || '',
          date_of_pruning: currentFarm?.dateOfPruning
        })
        break

      case 'spray': {
        const sprayData: any = {
          farm_id: farmIdNum,
          date: date,
          water_volume: data.water_volume ? parseFloat(data.water_volume) : 0,
          chemicals: data.chemicals || [],
          area: currentFarm?.area || 0,
          weather: 'Clear',
          operator: 'Farm Owner',
          notes: data.notes || '',
          date_of_pruning: currentFarm?.dateOfPruning
        }

        if (data.chemicals && Array.isArray(data.chemicals) && data.chemicals.length > 0) {
          const firstChemical = data.chemicals[0]
          sprayData.chemical = firstChemical.name || 'Unknown'
          sprayData.quantity_amount = firstChemical.quantity || 0
          sprayData.quantity_unit = firstChemical.unit || 'gm/L'
          sprayData.dose = `${firstChemical.quantity || 0}${firstChemical.unit || 'gm/L'}`
        } else {
          sprayData.chemical = data.chemical?.trim() || 'Unknown'
          sprayData.quantity_amount = data.quantity_amount ? parseFloat(data.quantity_amount) : 0
          sprayData.quantity_unit = data.quantity_unit || 'gm/L'
          sprayData.dose =
            data.quantity_amount && data.quantity_unit
              ? `${data.quantity_amount}${data.quantity_unit}`
              : 'As per label'
        }

        record = await logMutations.spray.add.mutateAsync(sprayData)
        break
      }

      case 'harvest':
        record = await logMutations.harvest.add.mutateAsync({
          farm_id: farmIdNum,
          date: date,
          quantity: parseFloat(data.quantity || '0'),
          grade: data.grade || 'Standard',
          price: data.price ? parseFloat(data.price) : undefined,
          buyer: data.buyer?.trim() || undefined,
          notes: data.notes || '',
          date_of_pruning: currentFarm?.dateOfPruning
        })
        break

      case 'expense':
        record = await logMutations.expense.add.mutateAsync({
          farm_id: farmIdNum,
          date: date,
          type: data.type || 'other',
          cost: parseFloat(data.cost || '0'),
          remarks: data.notes || '',
          date_of_pruning: currentFarm?.dateOfPruning
        })
        break

      case 'fertigation':
        record = await logMutations.fertigation.add.mutateAsync({
          farm_id: farmIdNum,
          date: date,
          fertilizers: data.fertilizers,
          notes: data.notes || '',
          date_of_pruning: data.date_of_pruning || currentFarm?.dateOfPruning
        })
        break

      case 'soil_test':
        record = await logMutations.soilTest.add.mutateAsync({
          farm_id: farmIdNum,
          date,
          parameters: {},
          notes: data.notes || '',
          date_of_pruning: currentFarm?.dateOfPruning
        })
        break

      case 'petiole_test':
        record = await logMutations.petioleTest.add.mutateAsync({
          farm_id: farmIdNum,
          date,
          sample_id: data.sample_id || '',
          parameters: {},
          notes: data.notes || '',
          date_of_pruning: currentFarm?.dateOfPruning
        })
        break
    }

    return record
  }

  const handleSubmitLogs = async (
    logsToSave: any[],
    date: string,
    dayNotes: string,
    dayPhotos: File[],
    existingDailyNoteId?: number | null
  ) => {
    setIsSubmitting(true)
    try {
      const farmIdNum = parseFarmId(selectedFarm)
      let firstRecordId: number | null = null

      for (let i = 0; i < logsToSave.length; i++) {
        const logEntry = logsToSave[i]
        const record = await saveLogEntry(logEntry, date, dayNotes)

        if (i === 0 && record?.id) {
          firstRecordId = record.id
        }
      }

      await handleDailyNotesAndPhotosAfterLogs({
        logs: logsToSave,
        dayNotes,
        dayPhotos,
        firstRecordId,
        existingDailyNoteId: existingDailyNoteId ?? null,
        farmId: farmIdNum,
        date
      })

      // Record adds already invalidate logs/summary/records via their mutation
      // hooks, so only direct daily-note writes need an explicit refresh here.
      // Photo-only saves attach to an existing/new note without changing log rows.
      const dailyNoteWasWritten = dayNotes.trim().length > 0 || existingDailyNoteId != null
      if (logsToSave.length === 0 || dailyNoteWasWritten) {
        invalidateFarmLogs()
      }
      setCurrentPage(1)
      setShowUnifiedModal(false)
      setExistingLogsForEdit([])
      setSelectedDate('')
      setExistingDayNoteForEdit(null)
    } catch (error) {
      console.error('Error saving logs:', error)
      toast.error('Failed to save logs. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditRecord = useCallback((log: ActivityLog) => {
    if (log.type === 'petiole_test') {
      toast.info('Editing Petiole Test is not supported here.')
      return
    }
    if (log.type === 'daily_note') {
      toast.info('Edit daily notes using the Edit Day action.')
      return
    }
    setEditingRecord(log)
    setShowEditModal(true)
  }, [])

  const handleDeleteRecord = useCallback((log: ActivityLog) => {
    setDeletingRecord(log)
    setShowDeleteDialog(true)
  }, [])

  const confirmDeleteRecord = useCallback(async () => {
    if (!deletingRecord) return

    try {
      setIsDeleting(true)

      // Each remove mutation invalidates the logs list + summary on success.
      switch (deletingRecord.type) {
        case 'irrigation':
          await logMutations.irrigation.remove.mutateAsync(deletingRecord.id)
          break
        case 'spray':
          await logMutations.spray.remove.mutateAsync(deletingRecord.id)
          break
        case 'harvest':
          await logMutations.harvest.remove.mutateAsync(deletingRecord.id)
          break
        case 'fertigation':
          await logMutations.fertigation.remove.mutateAsync(deletingRecord.id)
          break
        case 'expense':
          await logMutations.expense.remove.mutateAsync(deletingRecord.id)
          break
        case 'soil_test':
          await logMutations.soilTest.remove.mutateAsync(deletingRecord.id)
          break
        case 'petiole_test':
          await logMutations.petioleTest.remove.mutateAsync(deletingRecord.id)
          break
        case 'daily_note':
          await logMutations.dailyNote.remove.mutateAsync(deletingRecord.id)
          break
        default:
          throw new Error(`Unsupported record type: ${deletingRecord.type}`)
      }

      // Deleting can empty the current page; reset to page 1 (prior behavior).
      setCurrentPage(1)
      setShowDeleteDialog(false)
      setDeletingRecord(null)
    } catch (error) {
      console.error('Error deleting record:', error)
      toast.error(
        `Failed to delete ${deletingRecord?.type.replace('_', ' ')} record. Please try again.`
      )
    } finally {
      setIsDeleting(false)
    }
  }, [deletingRecord, logMutations])

  /* ---------- Render (kept structure same) ---------- */

  // isLoading is true only on the first fetch for a key (no cached data yet).
  if (logsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="h-8 px-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Farm Logs</h1>
          </div>

          <Card>
            <CardContent className="px-3 py-3">
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg h-14">
                    <Skeleton className="w-6 h-6 flex-shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="w-32 h-3 mb-1" />
                      <Skeleton className="w-24 h-3" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <div className="px-3 py-3 space-y-3 sm:px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="h-8 px-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Farm Logs</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2"
            onClick={() => router.push(`/farms/${farmId}/soil-profiling`)}
          >
            <Droplets className="h-4 w-4" />
            Soil profiling
          </Button>
        </div>

        {/* Select Farm card (unchanged) */}
        <Card>
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-base">Select Farm</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <Select value={selectedFarm} onValueChange={handleFarmChange}>
              <SelectTrigger className="w-full h-9 sm:h-10">
                <SelectValue placeholder="Choose a farm" />
              </SelectTrigger>
              <SelectContent>
                {farms.map((farm) => (
                  <SelectItem key={farm.id} value={farm.id?.toString() || ''}>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{capitalize(farm.name)}</div>
                        <div className="text-xs text-gray-500 truncate">{farm.region}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Search & Filter card (kept same UI but wired to debounced state) */}
        <Card>
          <CardHeader className="pb-2 px-3 pt-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search & Filter
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-7 px-2 text-xs"
              >
                <Filter className="h-3 w-3 mr-1" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-3">
            <div>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs by type, notes, chemicals, amounts..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-8 h-9"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('')
                      setCurrentPage(1)
                    }}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div>
                  <Label className="text-xs font-medium text-gray-700 mb-2 block">
                    Activity Types
                  </Label>
                  <Popover open={multiSelectOpen} onOpenChange={setMultiSelectOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={multiSelectOpen}
                        aria-controls={activityTypeListboxId}
                        className="h-9 w-full justify-between text-xs"
                      >
                        {selectedActivityTypes.length > 0
                          ? `${selectedActivityTypes.length} selected`
                          : 'Select activity types...'}
                        <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search activity types..." className="h-9" />
                        <CommandEmpty>No activity type found.</CommandEmpty>
                        <CommandGroup>
                          <CommandList id={activityTypeListboxId}>
                            {activityTypes.map((activityType) => (
                              <CommandItem
                                key={activityType.value}
                                value={activityType.value}
                                onSelect={() => {
                                  const isSelected = selectedActivityTypes.includes(
                                    activityType.value
                                  )
                                  handleActivityTypeToggle(activityType.value, !isSelected)
                                }}
                                className="cursor-pointer hover:bg-accent"
                              >
                                <div
                                  className={cn(
                                    'mr-2 h-4 w-4 border border-gray-300 rounded flex items-center justify-center',
                                    selectedActivityTypes.includes(activityType.value)
                                      ? 'bg-accent border-accent'
                                      : 'bg-white'
                                  )}
                                >
                                  <Check
                                    className={cn(
                                      'h-3 w-3 text-white',
                                      selectedActivityTypes.includes(activityType.value)
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                    )}
                                  />
                                </div>
                                {activityType.label}
                              </CommandItem>
                            ))}
                          </CommandList>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedActivityTypes.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedActivityTypes.map((type) => {
                        const activityType = activityTypes.find((t) => t.value === type)
                        return (
                          <Badge key={type} variant="secondary" className="text-xs">
                            {activityType?.label}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                              onClick={() => handleActivityTypeToggle(type, false)}
                            >
                              <X className="h-2 w-2" />
                            </Button>
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1 block">
                      From Date
                    </Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => {
                        setDateFrom(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="h-9"
                      max={dateTo || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1 block">To Date</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => {
                        setDateTo(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="h-9"
                      min={dateFrom}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {(searchQuery || selectedActivityTypes.length > 0 || dateFrom || dateTo) && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 px-3 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity logs */}
        <Card>
          <CardHeader className="pb-2 px-3 pt-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <CardTitle className="text-base">Activity Logs</CardTitle>
                {currentFarm && (
                  <Badge variant="outline" className="text-xs">
                    {capitalize(currentFarm.name)}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-gray-500">{totalLogs} logs</span>
            </div>
            <div className="mt-2 text-xs text-gray-600 hidden sm:block">
              <span className="font-medium">Date format:</span> Activity date displayed in blue
              <span className="text-gray-400"> • </span>
              Green badge with scissors shows days after pruning when log was added
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:px-3 pb-3 relative" aria-busy={logsQuery.isFetching}>
            {logs.length > 0 ? (
              // keepPreviousData keeps the rows mounted across filter/page changes
              // and post-write refetches; dim them while fetching instead of
              // swapping to a skeleton, so the list never flashes.
              <div className={cn('transition-opacity', logsQuery.isFetching && 'opacity-60')}>
                {logsQuery.isFetching && (
                  <span className="sr-only" aria-live="polite">
                    Loading activity logs...
                  </span>
                )}
                <LogsList
                  logs={logs}
                  onEdit={handleEditRecord}
                  onDelete={handleDeleteRecord}
                  currentFarm={currentFarm}
                />
              </div>
            ) : logsQuery.isFetching ? (
              // No cached rows yet (e.g. first load for a freshly selected farm).
              <div className="space-y-2" aria-live="polite">
                <span className="sr-only">Loading activity logs...</span>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg h-14">
                    <Skeleton className="w-6 h-6 flex-shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="w-32 h-3 mb-1" />
                      <Skeleton className="w-24 h-3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No activity logs found</p>
                <p className="text-xs text-gray-400 mt-1">
                  Start logging activities to see them here
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination & controls (unchanged logic) */}
        <Card>
          <CardContent className="px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Show</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => handleItemsPerPageChange(parseInt(value, 10))}
                >
                  <SelectTrigger className="h-7 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option.toString()}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-gray-500">records</span>
              </div>

              {totalLogs > 0 && (
                <div className="text-xs text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, totalLogs)} of {totalLogs}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-3 pt-2 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="h-7 w-7 p-0 text-xs"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-7 w-7 p-0"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals & dialogs kept unchanged */}
        <UnifiedDataLogsModal
          isOpen={showUnifiedModal}
          onClose={() => {
            setShowUnifiedModal(false)
            setExistingLogsForEdit([])
            setSelectedDate('')
            setExistingDayNoteForEdit(null)
          }}
          onSubmit={handleSubmitLogs}
          isSubmitting={isSubmitting}
          farmId={selectedFarmIdNum}
          mode={'add'}
          existingLogs={existingLogsForEdit}
          selectedDate={selectedDate}
          existingDayNote={existingDayNoteForEdit?.notes}
          existingDayNoteId={existingDayNoteForEdit?.id ?? null}
          currencyPreference={userPreferences?.currencyPreference}
        />

        {editingRecord && editingRecord.type !== 'petiole_test' && (
          <EditRecordModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false)
              setEditingRecord(null)
            }}
            onSave={() => {
              setShowEditModal(false)
              setEditingRecord(null)
              // EditRecordModal performs the update itself; refresh the cached list.
              invalidateFarmLogs()
            }}
            record={editingRecord as any}
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

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Activity Log</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this {deletingRecord?.type.replace('_', ' ')} record
                from {deletingRecord?.date}? This action cannot be undone.
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
      </div>
    </div>
  )
}
