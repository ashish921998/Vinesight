'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SupabaseService } from '@/lib/supabase-service'
import { type Farm } from '@/types/types'
import { getActivityDisplayData } from '@/lib/activity-display-utils'
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
import { cn, capitalize } from '@/lib/utils'
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
import { getLogTypeIcon, getLogTypeBgColor, getLogTypeColor } from '@/lib/log-type-config'
import { transformActivitiesToLogEntries } from '@/lib/activity-display-utils'
import { PhotoService } from '@/lib/photo-service'

// Utility function for date formatting with blue-600 color
const formatLogDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    // Ensure we handle invalid dates
    if (isNaN(date.getTime())) {
      return 'Invalid date'
    }

    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const isYesterday =
      new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === date.toDateString()

    if (isToday) {
      return `today, ${date
        .toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
        .toLowerCase()
        .replace(' ', '')}`
    } else if (isYesterday) {
      return `yesterday, ${date
        .toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
        .toLowerCase()
        .replace(' ', '')}`
    } else {
      return date
        .toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
        .replace(',', ',')
        .replace(/\s+/g, ' ')
    }
  } catch (error) {
    return 'Invalid date'
  }
}

// Calculate days after pruning from farm's pruning date and log created date
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
  const [allLogs, setAllLogs] = useState<ActivityLog[]>([])
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
  const [editMode, setEditMode] = useState<'add' | 'edit'>('add')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [existingLogsForEdit, setExistingLogsForEdit] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingRecord, setDeletingRecord] = useState<ActivityLog | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const loadLogs = useCallback(async () => {
    if (!selectedFarm) return

    try {
      setLoading(true)

      // Get all activity logs for the selected farm
      const farmIdNum = parseInt(selectedFarm)

      // Load different types of logs
      const [irrigation, spray, harvest, expenses, fertigation, soilTests, petioleTests] =
        await Promise.all([
          SupabaseService.getIrrigationRecords(farmIdNum),
          SupabaseService.getSprayRecords(farmIdNum),
          SupabaseService.getHarvestRecords(farmIdNum),
          SupabaseService.getExpenseRecords(farmIdNum),
          SupabaseService.getFertigationRecords(farmIdNum),
          SupabaseService.getSoilTestRecords(farmIdNum),
          SupabaseService.getPetioleTestRecords(farmIdNum)
        ])

      // Combine and format all logs, filtering out records without valid IDs
      const combinedLogs: ActivityLog[] = [
        ...irrigation
          .filter((log) => log.id != null)
          .map((log) => ({
            id: log.id!,
            type: 'irrigation',
            date: log.date,
            notes: log.notes,
            duration: log.duration,
            created_at: log.created_at || log.date
          })),
        ...spray
          .filter((log) => log.id != null)
          .map((log) => ({
            id: log.id!,
            type: 'spray',
            date: log.date,
            notes: log.notes,
            chemical: log.chemical,
            chemicals: log.chemicals,
            created_at: log.created_at || log.date
          })),
        ...harvest
          .filter((log) => log.id != null)
          .map((log) => ({
            id: log.id!,
            type: 'harvest',
            date: log.date,
            notes: log.notes,
            quantity: log.quantity,
            created_at: log.created_at || log.date
          })),
        ...expenses
          .filter((log) => log.id != null)
          .map((log) => ({
            id: log.id!,
            type: 'expense',
            date: log.date,
            notes: log.remarks,
            cost: log.cost,
            created_at: log.created_at || log.date
          })),
        ...fertigation
          .filter((log) => log.id != null)
          .map((log) => ({
            id: log.id!,
            type: 'fertigation',
            date: log.date,
            notes: log.notes,
            fertilizer: log.fertilizer,
            created_at: log.created_at || log.date
          })),
        ...soilTests
          .filter((log) => log.id != null)
          .map((log) => ({
            id: log.id!,
            type: 'soil_test',
            date: log.date,
            notes: log.notes,
            created_at: log.created_at || log.date
          })),
        ...petioleTests
          .filter((log) => log.id != null)
          .map((log) => ({
            id: log.id!,
            type: 'petiole_test',
            date: log.date,
            notes: log.notes,
            created_at: log.created_at || log.date
          }))
      ]

      // Sort by date (newest first)
      const sortedLogs = combinedLogs.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setAllLogs(sortedLogs)
    } catch (error) {
      console.error('Error loading logs:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedFarm])

  // Filter logs based on search query, activity type, and date range
  const filteredLogs = useMemo(() => {
    let filtered = [...allLogs]

    // Filter by activity types (multiple selection)
    if (selectedActivityTypes.length > 0) {
      filtered = filtered.filter((log) => selectedActivityTypes.includes(log.type))
    }

    // Filter by search query (search in notes)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (log) => log.notes?.toLowerCase().includes(query) || log.type.toLowerCase().includes(query)
      )
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter((log) => new Date(log.date) >= new Date(dateFrom))
    }
    if (dateTo) {
      filtered = filtered.filter((log) => new Date(log.date) <= new Date(dateTo))
    }

    return filtered
  }, [allLogs, selectedActivityTypes, searchQuery, dateFrom, dateTo])

  // Paginate individual logs
  const paginatedLogs = useMemo(() => {
    const offset = (currentPage - 1) * itemsPerPage
    return filteredLogs.slice(offset, offset + itemsPerPage)
  }, [filteredLogs, currentPage, itemsPerPage])

  // Update logs and total count when filters change
  useEffect(() => {
    setLogs(paginatedLogs)
    setTotalLogs(filteredLogs.length)
    // Reset to page 1 when filters change
    if (currentPage > 1 && paginatedLogs.length === 0 && filteredLogs.length > 0) {
      setCurrentPage(1)
    }
  }, [paginatedLogs, filteredLogs.length, currentPage])

  useEffect(() => {
    loadFarms()
  }, [loadFarms])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  // Clear filters function
  const clearFilters = () => {
    setSearchQuery('')
    setSelectedActivityTypes([])
    setDateFrom('')
    setDateTo('')
    setCurrentPage(1)
  }

  // Activity type options
  const activityTypes = [
    { value: 'irrigation', label: 'Irrigation' },
    { value: 'spray', label: 'Spray' },
    { value: 'harvest', label: 'Harvest' },
    { value: 'expense', label: 'Expense' },
    { value: 'fertigation', label: 'Fertigation' },
    { value: 'soil_test', label: 'Soil Test' },
    { value: 'petiole_test', label: 'Petiole Test' }
  ]

  // Handle activity type checkbox toggle
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
    window.scrollTo(0, 0)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page
  }

  const handleEditDateGroup = (date: string, activities: any[]) => {
    // Transform activities to the format expected by UnifiedDataLogsModal
    const existingLogs = transformActivitiesToLogEntries(activities)

    // Convert date to ISO format (YYYY-MM-DD) for proper handling
    const isoDate = date
      ? new Date(date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]

    setSelectedDate(isoDate)
    setExistingLogsForEdit(existingLogs)
    setEditMode('edit')
    setShowUnifiedModal(true)
  }

  // Helper function to save log entries
  const saveLogEntry = async (logEntry: any, date: string, dayNotes: string) => {
    const { type, data } = logEntry
    let record

    switch (type) {
      case 'irrigation':
        record = await SupabaseService.addIrrigationRecord({
          farm_id: parseInt(selectedFarm),
          date: date,
          duration: parseFloat(data.duration || '0'),
          area: parseFloat(data.area || '0') || currentFarm?.area || 0,
          growth_stage: 'Active',
          moisture_status: 'Good',
          system_discharge: currentFarm?.systemDischarge || 100,
          notes: dayNotes || '',
          date_of_pruning: currentFarm?.dateOfPruning
        })
        break

      case 'spray': {
        const sprayData: any = {
          farm_id: parseInt(selectedFarm),
          date: date,
          water_volume: data.water_volume ? parseFloat(data.water_volume) : 0,
          chemicals: data.chemicals || [],
          area: currentFarm?.area || 0,
          weather: 'Clear',
          operator: 'Farm Owner',
          notes: dayNotes || '',
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
          farm_id: parseInt(selectedFarm),
          date: date,
          quantity: parseFloat(data.quantity || '0'),
          grade: data.grade || 'Standard',
          price: data.price ? parseFloat(data.price) : undefined,
          buyer: data.buyer?.trim() || undefined,
          notes: dayNotes || '',
          date_of_pruning: currentFarm?.dateOfPruning
        })
        break

      case 'expense':
        record = await SupabaseService.addExpenseRecord({
          farm_id: parseInt(selectedFarm),
          date: date,
          type: data.type || 'other',
          description: data.description || '',
          cost: parseFloat(data.cost || '0'),
          remarks: dayNotes || '',
          date_of_pruning: currentFarm?.dateOfPruning
        })
        break

      case 'fertigation':
        record = await SupabaseService.addFertigationRecord({
          farm_id: parseInt(selectedFarm),
          date: date,
          fertilizer: data.fertilizer?.trim() || 'Unknown',
          quantity: data.quantity || 0,
          unit: data.unit || 'kg/acre',
          notes: dayNotes || '',
          date_of_pruning: currentFarm?.dateOfPruning
        })
        break

      case 'soil_test':
        record = await SupabaseService.addSoilTestRecord({
          farm_id: parseInt(selectedFarm),
          date,
          parameters: {},
          notes: dayNotes || '',
          date_of_pruning: currentFarm?.dateOfPruning
        })
        break

      case 'petiole_test':
        record = await SupabaseService.addPetioleTestRecord({
          farm_id: parseInt(selectedFarm),
          date,
          sample_id: data.sample_id || '',
          parameters: {},
          notes: dayNotes || '',
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
    dayPhotos: File[]
  ) => {
    setIsSubmitting(true)
    try {
      let firstRecordId: number | null = null

      // Save all log entries
      for (let i = 0; i < logs.length; i++) {
        const logEntry = logs[i]
        const record = await saveLogEntry(logEntry, date, dayNotes)

        // Store first record ID for photo upload
        if (i === 0 && record?.id) {
          firstRecordId = record.id
        }
      }

      // Upload day photos if any
      if (firstRecordId && dayPhotos && dayPhotos.length > 0) {
        for (const photo of dayPhotos) {
          try {
            await PhotoService.uploadPhoto(photo, 'day_photos', firstRecordId)
          } catch (photoError) {
            console.error('Error uploading day photo:', photoError)
          }
        }
      }

      // Reload logs after saving
      await loadLogs()
      setShowUnifiedModal(false)
      setExistingLogsForEdit([])
      setSelectedDate('')
    } catch (error) {
      console.error('Error saving logs:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditRecord = (log: ActivityLog) => {
    setEditingRecord(log)
    setShowEditModal(true)
  }

  const handleDeleteRecord = (log: ActivityLog) => {
    setDeletingRecord(log)
    setShowDeleteDialog(true)
  }

  // Edit modal state
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
        default:
          throw new Error(`Unsupported record type: ${deletingRecord.type}`)
      }

      // Reload logs after deletion
      await loadLogs()

      // Close dialog
      setShowDeleteDialog(false)
      setDeletingRecord(null)
    } catch (error) {
      console.error('Error deleting record:', error)
      // You might want to show a toast notification here
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="h-8 px-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Farm Logs</h1>
          </div>
        </div>

        {/* Farm Selector */}
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

        {/* Search and Filters */}
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
            {/* Search Bar */}
            <div>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search in notes..."
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

            {/* Filters */}
            {showFilters && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                {/* Activity Type Multi-Select */}
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

                {/* Date Range Filters */}
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

                {/* Clear Filters */}
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

        {/* Logs List */}
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
            {paginatedLogs.length > 0 ? (
              <div className="space-y-2">
                {paginatedLogs.map((log) => {
                  const Icon = getLogTypeIcon(log.type)
                  const daysAfterPruning = getDaysAfterPruning(
                    currentFarm?.dateOfPruning,
                    log.created_at
                  )

                  return (
                    <div
                      key={`${log.type}-${log.id}`}
                      className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Log Type Icon */}
                          <div
                            className={`p-2 ${getLogTypeBgColor(log.type)} rounded-md flex-shrink-0`}
                          >
                            <Icon className={`h-4 w-4 ${getLogTypeColor(log.type)}`} />
                          </div>

                          {/* Log Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-sm text-gray-900 capitalize">
                                {log.type.replace('_', ' ')}
                              </h3>
                              <span className="text-blue-600 text-xs font-medium">
                                {formatLogDate(log.date)}
                              </span>
                            </div>

                            {/* Log-specific details */}
                            <div className="text-xs text-gray-600 space-y-1">
                              {log.type === 'spray' && (
                                <>
                                  {log.chemicals &&
                                    Array.isArray(log.chemicals) &&
                                    log.chemicals.length > 0 && (
                                      <p>
                                        <span className="font-medium">Chemicals:</span>{' '}
                                        {log.chemicals.map((chem, idx) => (
                                          <span key={idx}>
                                            {chem.name} ({chem.quantity} {chem.unit})
                                            {idx < (log.chemicals?.length || 0) - 1 && ', '}
                                          </span>
                                        ))}
                                      </p>
                                    )}
                                </>
                              )}

                              {log.type === 'harvest' && log.quantity && (
                                <p>
                                  <span className="font-medium">Quantity:</span> {log.quantity}{' '}
                                  units
                                </p>
                              )}

                              {log.type === 'expense' && log.cost && (
                                <p>
                                  <span className="font-medium">Cost:</span> ${log.cost}
                                </p>
                              )}

                              {log.type === 'fertigation' && log.fertilizer && (
                                <p>
                                  <span className="font-medium">Fertilizer:</span> {log.fertilizer}
                                </p>
                              )}

                              {log.type === 'irrigation' && log.duration && (
                                <p>
                                  <span className="font-medium">Duration:</span> {log.duration}{' '}
                                  minutes
                                </p>
                              )}

                              {log.notes && (
                                <p className="text-gray-700">
                                  <span className="font-medium">Notes:</span> {log.notes}
                                </p>
                              )}
                            </div>

                            {/* Days after pruning indicator */}
                            {daysAfterPruning !== null && daysAfterPruning >= 0 && (
                              <div className="mt-2">
                                <div className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full cursor-help">
                                  <Scissors className="h-3 w-3" />
                                  {daysAfterPruning}d
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRecord(log)}
                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            title="Edit this log"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRecord(log)}
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

        {/* Pagination & Records Per Page */}
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

        {/* Unified Data Logs Modal */}
        <UnifiedDataLogsModal
          isOpen={showUnifiedModal}
          onClose={() => {
            setShowUnifiedModal(false)
            setExistingLogsForEdit([])
            setSelectedDate('')
          }}
          onSubmit={handleSubmitLogs}
          isSubmitting={isSubmitting}
          farmId={parseInt(selectedFarm)}
          mode={editMode}
          existingLogs={existingLogsForEdit}
          selectedDate={selectedDate}
        />

        {/* Edit Record Modal */}
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
              loadLogs() // Reload logs after editing
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

        {/* Delete Confirmation Dialog */}
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
