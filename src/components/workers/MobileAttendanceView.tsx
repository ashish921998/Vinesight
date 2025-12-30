'use client'

import * as React from 'react'
import {
  format,
  addDays,
  startOfWeek,
  isSameDay,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  endOfWeek
} from 'date-fns'
import { ChevronLeft, ChevronRight, Loader2, User, Check, Calendar, Edit3 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { formatCurrency } from '@/lib/currency-utils'
import { LaborService } from '@/lib/labor-service'
import type { Worker, WorkStatus, WorkerAttendance } from '@/lib/supabase'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Farm {
  id: number
  name: string
}

interface MobileAttendanceViewProps {
  farms: Farm[]
  workers: Worker[]
  onAttendanceSaved: () => void
}

type AttendanceStatus = WorkStatus | null

interface CellData {
  workerId: number
  date: string
  status: AttendanceStatus
  workType: string | null
  farmIds: number[]
  existingRecordId?: number
  isModified: boolean
}

const STATUS_CYCLE: AttendanceStatus[] = ['full_day', 'half_day', 'absent', null]

const getStatusDisplay = (status: AttendanceStatus) => {
  switch (status) {
    case 'full_day':
      return { label: 'F', bgClass: 'bg-green-500 text-white', fullLabel: 'Full Day' }
    case 'half_day':
      return { label: 'H', bgClass: 'bg-amber-500 text-white', fullLabel: 'Half Day' }
    case 'absent':
      return { label: 'A', bgClass: 'bg-red-500 text-white', fullLabel: 'Absent' }
    default:
      return { label: '-', bgClass: 'bg-gray-200 text-gray-500', fullLabel: 'Not Set' }
  }
}

export function MobileAttendanceView({
  farms,
  workers,
  onAttendanceSaved
}: MobileAttendanceViewProps) {
  const { user } = useSupabaseAuth()
  const { preferences } = useUserPreferences(user?.id)
  // Tab state
  const [activeTab, setActiveTab] = React.useState<'mark' | 'calendar'>('mark')

  // Mark attendance state
  const defaultWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const [weekStart, setWeekStart] = React.useState(defaultWeekStart)
  const [selectedWorkerIndex, setSelectedWorkerIndex] = React.useState(0)
  const [cellData, setCellData] = React.useState<Map<string, CellData>>(new Map())
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [selectedFarmIds, setSelectedFarmIds] = React.useState<number[]>([])
  const prevWorkerIdRef = React.useRef<number | undefined>(undefined)

  // Calendar view state
  const [calendarMonth, setCalendarMonth] = React.useState(new Date())
  const [calendarWorkerId, setCalendarWorkerId] = React.useState<number | null>(null)
  const [calendarAttendance, setCalendarAttendance] = React.useState<WorkerAttendance[]>([])
  const [calendarLoading, setCalendarLoading] = React.useState(false)

  const activeWorkers = React.useMemo(() => workers.filter((w) => w.is_active), [workers])

  // Clamp selectedWorkerIndex when activeWorkers shrinks to prevent out-of-range access
  React.useEffect(() => {
    if (activeWorkers.length > 0 && selectedWorkerIndex >= activeWorkers.length) {
      setSelectedWorkerIndex(Math.max(0, activeWorkers.length - 1))
    }
  }, [activeWorkers.length, selectedWorkerIndex])

  // Safe access to selectedWorker with clamped index
  const clampedIndex = Math.min(selectedWorkerIndex, Math.max(0, activeWorkers.length - 1))
  const selectedWorker = activeWorkers[clampedIndex]

  // Generate 6 days (Mon-Sat)
  const dateRange = React.useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => addDays(weekStart, i))
  }, [weekStart])

  const getCellKey = (workerId: number, date: string) => `${workerId}-${date}`

  // Load existing attendance data
  React.useEffect(() => {
    if (!selectedWorker || dateRange.length === 0) return

    let isCancelled = false
    const loadAttendance = async () => {
      setLoading(true)
      try {
        const newCellData = new Map<string, CellData>()
        const startDate = format(dateRange[0], 'yyyy-MM-dd')
        const endDate = format(dateRange[dateRange.length - 1], 'yyyy-MM-dd')

        // Initialize cells
        for (const date of dateRange) {
          const dateStr = format(date, 'yyyy-MM-dd')
          const key = getCellKey(selectedWorker.id, dateStr)
          newCellData.set(key, {
            workerId: selectedWorker.id,
            date: dateStr,
            status: null,
            workType: null,
            farmIds: [],
            isModified: false
          })
        }

        // Load existing records
        const records = await LaborService.getAttendanceByWorkerIds(
          [selectedWorker.id],
          startDate,
          endDate
        )

        for (const record of records) {
          const key = getCellKey(record.worker_id, record.date)
          newCellData.set(key, {
            workerId: record.worker_id,
            date: record.date,
            status: record.work_status as AttendanceStatus,
            workType: record.work_type,
            farmIds: record.farm_ids || [],
            existingRecordId: record.id,
            isModified: false
          })
        }

        // Set farm selection from first record with farms, or default to first farm
        // Only reset farm selection when worker changes (not on week navigation)
        const workerChanged = prevWorkerIdRef.current !== selectedWorker.id
        if (workerChanged && !isCancelled) {
          const recordWithFarms = records.find((r) => r.farm_ids && r.farm_ids.length > 0)
          if (recordWithFarms) {
            setSelectedFarmIds(recordWithFarms.farm_ids || [])
          } else if (farms.length > 0) {
            // Default to first farm when current worker has no records with farms
            setSelectedFarmIds([farms[0].id])
          }
          prevWorkerIdRef.current = selectedWorker.id
        }

        if (!isCancelled) {
          setCellData(newCellData)
        }
      } catch (error) {
        console.error('Error loading attendance:', error)
        toast.error('Failed to load attendance data')
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    loadAttendance()
    return () => {
      isCancelled = true
    }
  }, [selectedWorker?.id, weekStart, dateRange, farms])

  // Load calendar attendance data
  React.useEffect(() => {
    if (activeTab !== 'calendar' || !calendarWorkerId) return

    let isCancelled = false
    const loadCalendarAttendance = async () => {
      setCalendarLoading(true)
      try {
        const monthStart = startOfMonth(calendarMonth)
        const monthEnd = endOfMonth(calendarMonth)
        const startDate = format(monthStart, 'yyyy-MM-dd')
        const endDate = format(monthEnd, 'yyyy-MM-dd')

        const records = await LaborService.getAttendanceByWorkerIds(
          [calendarWorkerId],
          startDate,
          endDate
        )

        if (!isCancelled) {
          setCalendarAttendance(records)
        }
      } catch (error) {
        console.error('Error loading calendar attendance:', error)
      } finally {
        if (!isCancelled) {
          setCalendarLoading(false)
        }
      }
    }

    loadCalendarAttendance()
    return () => {
      isCancelled = true
    }
  }, [activeTab, calendarWorkerId, calendarMonth])

  // Set default calendar worker when workers load
  React.useEffect(() => {
    if (activeWorkers.length > 0 && calendarWorkerId === null) {
      setCalendarWorkerId(activeWorkers[0].id)
    }
  }, [activeWorkers, calendarWorkerId])

  // Generate calendar days for the month
  const calendarDays = React.useMemo(() => {
    const monthStart = startOfMonth(calendarMonth)
    const monthEnd = endOfMonth(calendarMonth)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // Sunday start
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [calendarMonth])

  // Get attendance status for a specific date in calendar view
  const getCalendarDayStatus = (date: Date): AttendanceStatus => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const record = calendarAttendance.find((r) => r.date === dateStr)
    return record ? (record.work_status as AttendanceStatus) : null
  }

  const handleDayCellClick = (date: Date) => {
    if (!selectedWorker) return
    const dateStr = format(date, 'yyyy-MM-dd')
    const key = getCellKey(selectedWorker.id, dateStr)

    setCellData((prev) => {
      const current = prev.get(key)
      if (!current) return prev

      // Cycle through statuses
      const currentIndex = STATUS_CYCLE.indexOf(current.status)
      const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length
      const nextStatus = STATUS_CYCLE[nextIndex]

      const newMap = new Map(prev)
      newMap.set(key, {
        ...current,
        status: nextStatus,
        farmIds: selectedFarmIds,
        isModified: true
      })
      return newMap
    })
  }

  const handleQuickAction = (status: AttendanceStatus) => {
    if (!selectedWorker) return

    setCellData((prev) => {
      const newMap = new Map(prev)
      for (const date of dateRange) {
        const dateStr = format(date, 'yyyy-MM-dd')
        const key = getCellKey(selectedWorker.id, dateStr)
        const current = newMap.get(key)
        if (current) {
          newMap.set(key, {
            ...current,
            status,
            farmIds: selectedFarmIds,
            isModified: true
          })
        }
      }
      return newMap
    })
  }

  const hasModifications = React.useMemo(() => {
    return Array.from(cellData.values()).some((cell) => cell.isModified)
  }, [cellData])

  const handleSaveAndNext = async () => {
    if (!hasModifications) {
      // Just go to next worker
      goToNextWorker()
      return
    }

    // Validate farm selection
    const modifiedCells = Array.from(cellData.values()).filter((cell) => cell.isModified)
    const invalidCells = modifiedCells.filter(
      (cell) => cell.status !== null && cell.farmIds.length === 0
    )
    if (invalidCells.length > 0) {
      toast.error('Please select at least one farm')
      return
    }

    setSaving(true)
    const errors: Array<{ date: string; error: unknown }> = []

    for (const cell of modifiedCells) {
      try {
        if (cell.existingRecordId) {
          if (cell.status === null) {
            await LaborService.deleteAttendance(cell.existingRecordId)
          } else {
            await LaborService.updateAttendance(cell.existingRecordId, {
              work_status: cell.status as WorkStatus,
              work_type: cell.workType || 'other',
              farm_ids: cell.farmIds,
              daily_rate_override: cell.status === 'absent' ? 0 : undefined
            })
          }
        } else if (cell.status !== null && cell.farmIds.length > 0) {
          await LaborService.createAttendance({
            worker_id: cell.workerId,
            farm_ids: cell.farmIds,
            date: cell.date,
            work_status: cell.status as WorkStatus,
            work_type: cell.workType || 'other',
            daily_rate_override: cell.status === 'absent' ? 0 : undefined
          })
        }
      } catch (error) {
        errors.push({ date: cell.date, error })
      }
    }

    if (errors.length > 0) {
      console.error('Attendance save partial failures:', errors)
      toast.error(`Saved with ${errors.length} error(s). Reloading...`)
      // Reset the ref to force a reload when we re-enter the effect
      prevWorkerIdRef.current = undefined
      setSaving(false)
      return
    }

    toast.success(`Saved attendance for ${selectedWorker?.name}`)
    onAttendanceSaved()

    // Clear modified flags
    setCellData((prev) => {
      const newMap = new Map(prev)
      for (const [key, cell] of newMap) {
        if (cell.isModified) {
          newMap.set(key, { ...cell, isModified: false })
        }
      }
      return newMap
    })

    // Go to next worker
    goToNextWorker()
    setSaving(false)
  }

  const goToNextWorker = () => {
    if (selectedWorkerIndex < activeWorkers.length - 1) {
      setSelectedWorkerIndex(selectedWorkerIndex + 1)
    } else {
      toast.success('All workers completed!')
    }
  }

  const goToPrevWorker = () => {
    if (selectedWorkerIndex > 0) {
      setSelectedWorkerIndex(selectedWorkerIndex - 1)
    }
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setWeekStart(subDays(weekStart, 7))
    } else {
      setWeekStart(addDays(weekStart, 7))
    }
  }

  if (activeWorkers.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No active workers found</div>
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'mark' | 'calendar')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mark" className="gap-2">
            <Edit3 className="h-4 w-4" />
            Mark
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
        </TabsList>

        {/* Mark Attendance Tab */}
        <TabsContent value="mark" className="mt-4 space-y-4">
          {/* Week Navigation */}
          <div className="flex items-center justify-between gap-2 bg-muted/50 rounded-lg p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateWeek('prev')}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <div className="text-sm font-medium">
                {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 5), 'MMM d, yyyy')}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateWeek('next')}
              className="h-9 w-9"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Worker Card */}
          <Card className="border-accent/20">
            <CardContent className="p-4 space-y-4">
              {/* Worker Selector */}
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <Select
                    value={selectedWorker?.id.toString() || ''}
                    onValueChange={(v) => {
                      const index = activeWorkers.findIndex((w) => w.id === parseInt(v, 10))
                      if (index >= 0) setSelectedWorkerIndex(index)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select worker" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeWorkers.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id.toString()}>
                          {worker.name} -{' '}
                          {formatCurrency(worker.daily_rate, preferences.currencyPreference)}/day
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Farm Selection - Compact Multi-select */}
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground shrink-0">Farms:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex-1 h-9 px-3 text-sm bg-white border rounded-lg text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
                      <span
                        className={
                          selectedFarmIds.length > 0 ? 'text-foreground' : 'text-muted-foreground'
                        }
                      >
                        {selectedFarmIds.length === 0
                          ? 'Select farms'
                          : selectedFarmIds.length === farms.length
                            ? 'All farms'
                            : `${selectedFarmIds.length} farm${selectedFarmIds.length > 1 ? 's' : ''} selected`}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="start">
                    <div className="space-y-1" role="menu">
                      {/* Select All */}
                      <button
                        type="button"
                        role="menuitemcheckbox"
                        aria-checked={selectedFarmIds.length === farms.length && farms.length > 0}
                        onClick={() => {
                          if (selectedFarmIds.length === farms.length) {
                            setSelectedFarmIds([])
                          } else {
                            setSelectedFarmIds(farms.map((f) => f.id))
                          }
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                      >
                        <Checkbox
                          checked={selectedFarmIds.length === farms.length && farms.length > 0}
                          aria-hidden="true"
                          tabIndex={-1}
                        />
                        <span className="font-medium">Select All</span>
                      </button>
                      <div className="border-b my-1" role="separator" />
                      {farms.map((farm) => {
                        const isSelected = selectedFarmIds.includes(farm.id)
                        return (
                          <button
                            type="button"
                            key={farm.id}
                            role="menuitemcheckbox"
                            aria-checked={isSelected}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedFarmIds(selectedFarmIds.filter((id) => id !== farm.id))
                              } else {
                                setSelectedFarmIds([...selectedFarmIds, farm.id])
                              }
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                          >
                            <Checkbox checked={isSelected} aria-hidden="true" tabIndex={-1} />
                            <span>{farm.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Day Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-6 gap-1.5">
                  {dateRange.map((date) => {
                    const dateStr = format(date, 'yyyy-MM-dd')
                    const key = getCellKey(selectedWorker?.id || 0, dateStr)
                    const cell = cellData.get(key)
                    const statusInfo = getStatusDisplay(cell?.status ?? null)
                    const isToday = isSameDay(date, new Date())
                    const isModified = cell?.isModified ?? false

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => handleDayCellClick(date)}
                        className={cn(
                          'flex flex-col items-center p-2 rounded-lg transition-all',
                          'active:scale-95',
                          isToday && 'ring-2 ring-primary ring-offset-1',
                          isModified && 'ring-2 ring-blue-400 ring-offset-1'
                        )}
                      >
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {format(date, 'EEE')}
                        </span>
                        <span className="text-xs text-muted-foreground mb-1">
                          {format(date, 'd')}
                        </span>
                        <div
                          className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold transition-colors',
                            statusInfo.bgClass
                          )}
                        >
                          {statusInfo.label}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('full_day')}
                  className="flex-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  All Full
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('half_day')}
                  className="flex-1 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                >
                  All Half
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('absent')}
                  className="flex-1 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                >
                  All Off
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save & Next Button */}
          <Button
            onClick={handleSaveAndNext}
            disabled={saving}
            className="w-full h-12 text-base font-semibold"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Saving...
              </>
            ) : hasModifications ? (
              selectedWorkerIndex < activeWorkers.length - 1 ? (
                'Save & Next Worker'
              ) : (
                'Save & Finish'
              )
            ) : selectedWorkerIndex < activeWorkers.length - 1 ? (
              'Next Worker'
            ) : (
              'Done'
            )}
          </Button>
        </TabsContent>

        {/* Calendar View Tab */}
        <TabsContent value="calendar" className="mt-4 space-y-4">
          {/* Worker Selector */}
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground shrink-0">Worker:</Label>
            <Select
              value={calendarWorkerId?.toString() || ''}
              onValueChange={(v) => setCalendarWorkerId(parseInt(v, 10))}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select worker" />
              </SelectTrigger>
              <SelectContent>
                {activeWorkers.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id.toString()}>
                    {worker.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h3 className="text-lg font-semibold">{format(calendarMonth, 'MMMM yyyy')}</h3>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCalendarMonth(new Date())}
                className="text-xs"
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                className="h-9 w-9"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <Card>
            <CardContent className="p-3">
              {calendarLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div
                        key={day}
                        className="text-center text-xs font-medium text-muted-foreground py-1"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day) => {
                      const status = getCalendarDayStatus(day)
                      const isCurrentMonth = isSameMonth(day, calendarMonth)
                      const isToday = isSameDay(day, new Date())
                      const statusInfo = getStatusDisplay(status)

                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            'aspect-square flex flex-col items-center justify-center rounded-lg text-sm',
                            !isCurrentMonth && 'opacity-30',
                            isToday && 'ring-2 ring-primary ring-offset-1'
                          )}
                        >
                          <span
                            className={cn(
                              'text-xs',
                              isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                            )}
                          >
                            {format(day, 'd')}
                          </span>
                          {status && isCurrentMonth && (
                            <span
                              className={cn(
                                'text-[10px] font-bold mt-0.5',
                                status === 'full_day' && 'text-green-600',
                                status === 'half_day' && 'text-amber-600',
                                status === 'absent' && 'text-red-600'
                              )}
                            >
                              {statusInfo.label}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Full Day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Half Day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Absent</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
