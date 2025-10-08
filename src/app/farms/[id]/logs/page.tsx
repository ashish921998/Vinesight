'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SupabaseService } from '@/lib/supabase-service'
import { type Farm } from '@/types/types'
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
import { EditRecordModal } from '@/components/journal/EditRecordModal'
import { cn, capitalize } from '@/lib/utils'
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Droplets,
  SprayCan,
  Scissors,
  DollarSign,
  TestTube,
  Beaker,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  X,
  Check,
  ChevronsUpDown
} from 'lucide-react'

interface ActivityLog {
  id: number
  type: string
  date: string
  notes?: string
  duration?: number
  chemical?: string
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
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [editRecordType, setEditRecordType] = useState<
    'irrigation' | 'spray' | 'harvest' | 'fertigation' | 'expense' | 'soil_test'
  >('irrigation')
  const [showEditModal, setShowEditModal] = useState(false)
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

  // Paginate filtered logs
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'irrigation':
        return Droplets
      case 'spray':
        return SprayCan
      case 'harvest':
        return Scissors
      case 'expense':
        return DollarSign
      case 'fertigation':
        return Beaker
      case 'soil_test':
        return TestTube
      case 'petiole_test':
        return TestTube
      default:
        return CalendarIcon
    }
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

  const handleEditRecord = async (log: ActivityLog) => {
    try {
      let recordData
      if (log.type === 'irrigation') {
        const records = await SupabaseService.getIrrigationRecords(parseInt(selectedFarm))
        recordData = records.find((r) => r.id === log.id)
        setEditRecordType('irrigation')
      } else if (log.type === 'spray') {
        const records = await SupabaseService.getSprayRecords(parseInt(selectedFarm))
        recordData = records.find((r) => r.id === log.id)
        setEditRecordType('spray')
      } else if (log.type === 'harvest') {
        const records = await SupabaseService.getHarvestRecords(parseInt(selectedFarm))
        recordData = records.find((r) => r.id === log.id)
        setEditRecordType('harvest')
      } else if (log.type === 'fertigation') {
        const records = await SupabaseService.getFertigationRecords(parseInt(selectedFarm))
        recordData = records.find((r) => r.id === log.id)
        setEditRecordType('fertigation')
      } else if (log.type === 'expense') {
        const records = await SupabaseService.getExpenseRecords(parseInt(selectedFarm))
        recordData = records.find((r) => r.id === log.id)
        setEditRecordType('expense')
      } else if (log.type === 'soil_test') {
        const records = await SupabaseService.getSoilTestRecords(parseInt(selectedFarm))
        recordData = records.find((r) => r.id === log.id)
        setEditRecordType('soil_test')
      } else if (log.type === 'petiole_test') {
        const records = await SupabaseService.getPetioleTestRecords(parseInt(selectedFarm))
        recordData = records.find((r) => r.id === log.id)
        setEditRecordType('soil_test') // Reuse soil test modal for petiole tests
      }

      if (recordData) {
        setEditingRecord(recordData)
        setShowEditModal(true)
      }
    } catch (error) {
      console.error('Error loading record for editing:', error)
    }
  }

  const handleSaveRecord = () => {
    setShowEditModal(false)
    setEditingRecord(null)
    loadLogs() // Reload logs after editing
  }

  const handleDeleteRecord = (log: ActivityLog) => {
    setDeletingRecord(log)
    setShowDeleteDialog(true)
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
      <div className="px-4 py-3 space-y-3">
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
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Choose a farm" />
              </SelectTrigger>
              <SelectContent>
                {farms.map((farm) => (
                  <SelectItem key={farm.id} value={farm.id?.toString() || ''}>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium text-sm">{capitalize(farm.name)}</div>
                        <div className="text-xs text-gray-500">{farm.region}</div>
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Activity Logs
                {currentFarm && (
                  <Badge variant="outline" className="text-xs">
                    {capitalize(currentFarm.name)}
                  </Badge>
                )}
              </CardTitle>
              <span className="text-xs text-gray-500">{totalLogs} logs</span>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {logs.length > 0 ? (
              <div className="space-y-2">
                {logs.map((log, index) => {
                  const Icon = getActivityIcon(log.type)

                  return (
                    <div
                      key={`${log.type}-${log.id}-${index}`}
                      className="flex items-start justify-between gap-2 p-2 bg-gray-50 rounded-lg h-14"
                    >
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div className="p-1 bg-green-100 rounded-md flex-shrink-0 mt-0.5">
                          <Icon className="h-3 w-3 text-green-600" />
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900 text-sm capitalize truncate">
                              {log.type.replace('_', ' ')}
                            </p>
                            <span className="text-xs text-gray-500">
                              {new Date(log.date).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="h-4">
                            {log.notes ? (
                              <p className="text-xs text-gray-600 break-words line-clamp-1">
                                {log.notes.length > 60
                                  ? `${log.notes.substring(0, 60)}...`
                                  : log.notes}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-400 italic">No notes added</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 h-full">
                        {(log.type === 'irrigation' ||
                          log.type === 'spray' ||
                          log.type === 'harvest' ||
                          log.type === 'fertigation' ||
                          log.type === 'expense' ||
                          log.type === 'soil_test' ||
                          log.type === 'petiole_test') && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditRecord(log)}
                              className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100 flex-shrink-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRecord(log)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-100 flex-shrink-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
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
            recordType={editRecordType}
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
