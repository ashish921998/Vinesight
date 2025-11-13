'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'

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

import { SupabaseService } from '@/lib/supabase-service'
import { getActivityDisplayData } from '@/lib/activity-display-utils'
import { getLogTypeIcon, getLogTypeBgColor, getLogTypeColor } from '@/lib/log-type-config'
import { cn, capitalize } from '@/lib/utils'
import { toast } from 'sonner'
import { parseFarmId, handleDailyNotesAndPhotosAfterLogs } from '@/lib/daily-note-utils'
import { searchLogs } from '@/actions/search-logs'

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
  Scissors
} from 'lucide-react'

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

const getDaysAfterPruning = (
  farmPruningDate?: Date | string | null,
  logCreatedAt?: string
): number | null => {
  if (!farmPruningDate || !logCreatedAt) return null

  try {
    // Convert string date to Date object if needed
    const pruningDate =
      typeof farmPruningDate === 'string' ? new Date(farmPruningDate) : farmPruningDate
    const createdDate = new Date(logCreatedAt)

    if (!pruningDate || isNaN(pruningDate.getTime()) || isNaN(createdDate.getTime())) {
      return null
    }

    const diffMs = createdDate.getTime() - pruningDate.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    return diffDays >= 0 ? diffDays : null
  } catch (error) {
    return null
  }
}

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

export default function FarmLogsPage() {
  const params = useParams()
  const router = useRouter()
  const farmId = params.id as string

  const [selectedFarm, setSelectedFarm] = useState<string>(farmId)
  const [farms, setFarms] = useState<Farm[]>([])
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalLogs, setTotalLogs] = useState(0)
  const [currentFarm, setCurrentFarm] = useState<Farm | null>(null)

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
  const [searchLoading, setSearchLoading] = useState(false)

  const totalPages = Math.ceil(totalLogs / itemsPerPage)

  const loadFarms = useCallback(async () => {
    try {
      const farmsList = await SupabaseService.getAllFarms()
      setFarms(farmsList)

      const current = farmsList.find((f) => f.id?.toString() === selectedFarm)
      setCurrentFarm(current || null)
    } catch (error) {
      console.error('Error loading farms:', error)
    }
  }, [selectedFarm])

  const performSearch = useCallback(
    async (page: number = 1) => {
      if (!selectedFarm) return

      try {
        setSearchLoading(true)
        const farmIdNum = parseInt(selectedFarm)

        const result = await searchLogs({
          farmId: farmIdNum,
          searchQuery,
          selectedActivityTypes,
          dateFrom,
          dateTo,
          currentPage: page,
          itemsPerPage
        })

        setLogs(result.logs)
        setTotalLogs(result.totalCount)
      } catch (error) {
        console.error('Error searching logs:', error)
        toast.error('Failed to search logs')
      } finally {
        setSearchLoading(false)
      }
    },
    [selectedFarm, searchQuery, selectedActivityTypes, dateFrom, dateTo, itemsPerPage]
  )

  // Load logs on farm change
  useEffect(() => {
    if (!selectedFarm) return

    const loadLogsOnChange = async () => {
      try {
        setLoading(true)
        await performSearch(1)
      } catch (error) {
        console.error('Error loading logs:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLogsOnChange()
  }, [selectedFarm])

  // Search when filters change (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(1)
    }, 300) // Debounce search

    return () => clearTimeout(timer)
  }, [searchQuery, selectedActivityTypes, dateFrom, dateTo, itemsPerPage, performSearch])

  useEffect(() => {
    loadFarms()
  }, [loadFarms])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedActivityTypes([])
    setDateFrom('')
    setDateTo('')
    setCurrentPage(1)
  }

  const activityTypes = [
    { value: 'irrigation', label: 'Irrigation' },
    { value: 'spray', label: 'Spray' },
    { value: 'harvest', label: 'Harvest' },
    { value: 'expense', label: 'Expense' },
    { value: 'fertigation', label: 'Fertigation' },
    { value: 'soil_test', label: 'Soil Test' },
    { value: 'petiole_test', label: 'Petiole Test' },
    { value: 'daily_note', label: 'Daily Note' }
  ]

  const handleActivityTypeToggle = (activityType: string, checked: boolean) => {
    if (checked) {
      setSelectedActivityTypes((prev) => [...prev, activityType])
    } else {
      setSelectedActivityTypes((prev) => prev.filter((type) => type !== activityType))
    }
    setCurrentPage(1)
  }

  const handleFarmChange = (farmId: string) => {
    setSelectedFarm(farmId)
    setCurrentPage(1)
    router.push(`/farms/${farmId}/logs`)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    performSearch(page)
    window.scrollTo(0, 0)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
    // Search will be triggered by the useEffect watching itemsPerPage
  }

  const saveLogEntry = async (logEntry: any, date: string, dayNotes: string) => {
    const { type, data } = logEntry
    let record

    // Create a single parsed farmId with explicit radix
    const farmIdNum = parseFarmId(selectedFarm)

    switch (type) {
      case 'irrigation':
        record = await SupabaseService.addIrrigationRecord({
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

        record = await SupabaseService.addSprayRecord(sprayData)
        break
      }

      case 'harvest':
        record = await SupabaseService.addHarvestRecord({
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
        record = await SupabaseService.addExpenseRecord({
          farm_id: farmIdNum,
          date: date,
          type: data.type || 'other',
          description: data.description || '',
          cost: parseFloat(data.cost || '0'),
          remarks: data.notes || '',
          date_of_pruning: currentFarm?.dateOfPruning
        })
        break

      case 'fertigation':
        record = await SupabaseService.addFertigationRecord({
          farm_id: farmIdNum,
          date: date,
          fertilizers: data.fertilizers,
          notes: data.notes || '',
          date_of_pruning: data.date_of_pruning || currentFarm?.dateOfPruning
        })
        break

      case 'soil_test':
        record = await SupabaseService.addSoilTestRecord({
          farm_id: farmIdNum,
          date,
          parameters: {},
          notes: data.notes || '',
          date_of_pruning: currentFarm?.dateOfPruning
        })
        break

      case 'petiole_test':
        record = await SupabaseService.addPetioleTestRecord({
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
    logs: any[],
    date: string,
    dayNotes: string,
    dayPhotos: File[],
    existingDailyNoteId?: number | null
  ) => {
    setIsSubmitting(true)
    try {
      const farmIdNum = parseFarmId(selectedFarm)
      let firstRecordId: number | null = null

      for (let i = 0; i < logs.length; i++) {
        const logEntry = logs[i]
        const record = await saveLogEntry(logEntry, date, dayNotes)

        if (i === 0 && record?.id) {
          firstRecordId = record.id
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

      await performSearch(1)
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

  const handleEditRecord = (log: ActivityLog) => {
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
  }

  const handleDeleteRecord = (log: ActivityLog) => {
    setDeletingRecord(log)
    setShowDeleteDialog(true)
  }

  const [editingRecord, setEditingRecord] = useState<ActivityLog | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

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
        default:
          throw new Error(`Unsupported record type: ${deletingRecord.type}`)
      }

      await performSearch(1)
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
  }

  if (loading && logs.length === 0) {
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
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg h-14 animate-pulse"
                  >
                    <div className="w-6 h-6 bg-gray-200 rounded flex-shrink-0" />
                    <div className="flex-1">
                      <div className="w-32 h-3 bg-gray-200 rounded mb-1" />
                      <div className="w-24 h-3 bg-gray-200 rounded" />
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
        </div>

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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
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
                          <CommandList>
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
                                      ? 'bg-primary border-primary'
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
          <CardContent className="px-2 sm:px-3 pb-3">
            {logs.length > 0 ? (
              <div className="space-y-2">
                {logs.map((log) => {
                  const Icon = getLogTypeIcon(log.type)
                  const daysAfterPruning = getDaysAfterPruning(currentFarm?.dateOfPruning, log.date)

                  return (
                    <div
                      key={`${log.type}-${log.id}`}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-100"
                      role="button"
                      tabIndex={0}
                      aria-label={`Edit ${log.type} log from ${log.date}`}
                      onClick={() => handleEditRecord(log)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleEditRecord(log)
                        }
                      }}
                      onKeyUp={(e) => {
                        if (e.key === ' ') {
                          e.preventDefault()
                          handleEditRecord(log)
                        }
                      }}
                    >
                      <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-start">
                        <div
                          className={`p-2 ${getLogTypeBgColor(log.type)} rounded-md flex-shrink-0`}
                        >
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
                          {daysAfterPruning !== null && daysAfterPruning >= 0 && (
                            <div className="mt-2">
                              <div className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full cursor-help">
                                <Scissors className="h-3 w-3" />
                                {daysAfterPruning}d
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
                              handleEditRecord(log)
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
                              handleDeleteRecord(log)
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

        <Card>
          <CardContent className="px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Show</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => handleItemsPerPageChange(parseInt(value))}
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
          farmId={Number.parseInt(selectedFarm, 10)}
          mode={'add'}
          existingLogs={existingLogsForEdit}
          selectedDate={selectedDate}
          existingDayNote={existingDayNoteForEdit?.notes}
          existingDayNoteId={existingDayNoteForEdit?.id ?? null}
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
              performSearch(1) // Reload logs after editing
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
