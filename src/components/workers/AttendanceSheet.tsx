'use client'

import * as React from 'react'
import { format, addDays, startOfWeek, isSameDay, differenceInDays, subDays } from 'date-fns'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { LaborService } from '@/lib/labor-service'
import type { Worker, WorkStatus, WorkType } from '@/lib/supabase'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'

interface Farm {
  id: number
  name: string
}

interface AttendanceSheetProps {
  farms: Farm[]
  workers: Worker[]
  onAttendanceSaved: () => void
  onSaveFunction?: (saveFn: () => Promise<void>, hasChanges: boolean, isSaving: boolean) => void
}

type AttendanceStatus = WorkStatus | null

interface CellData {
  workerId: number
  date: string
  status: AttendanceStatus
  workType: string | null // null means not set
  farmIds: number[] // Farm IDs selected for this specific cell
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
      return { label: '-', bgClass: 'bg-gray-100 text-gray-400', fullLabel: 'Not Set' }
  }
}

export function AttendanceSheet({
  farms,
  workers,
  onAttendanceSaved,
  onSaveFunction
}: AttendanceSheetProps) {
  // Initialize with current week by default
  const defaultWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const [startDate, setStartDate] = React.useState(() => format(defaultWeekStart, 'yyyy-MM-dd'))
  const [endDate, setEndDate] = React.useState(() =>
    format(addDays(defaultWeekStart, 6), 'yyyy-MM-dd')
  )
  const [cellData, setCellData] = React.useState<Map<string, CellData>>(new Map())
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [workTypes, setWorkTypes] = React.useState<WorkType[]>([])

  const activeWorkers = React.useMemo(() => workers.filter((w) => w.is_active), [workers])

  // Generate dates array from startDate to endDate
  const dateRange = React.useMemo(() => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = differenceInDays(end, start) + 1

    if (days <= 0 || days > 31) {
      // Invalid range or too large
      return []
    }

    return Array.from({ length: days }, (_, i) => addDays(start, i))
  }, [startDate, endDate])

  // Stable identifier for worker IDs to prevent unnecessary effect re-runs
  const activeWorkerIds = React.useMemo(
    () => activeWorkers.map((w) => w.id).join(','),
    [activeWorkers]
  )

  const getCellKey = (workerId: number, date: string) => `${workerId}-${date}`

  // Load work types on mount
  React.useEffect(() => {
    const loadWorkTypes = async () => {
      try {
        const types = await LaborService.getWorkTypes()
        setWorkTypes(types)
      } catch (error) {
        console.error('Error loading work types:', error)
        toast.error('Failed to load work types')
      }
    }
    loadWorkTypes()
  }, [])

  // Load existing attendance data for the date range - single batch query
  React.useEffect(() => {
    let isCancelled = false

    const loadAttendance = async () => {
      if (activeWorkers.length === 0 || dateRange.length === 0) {
        if (!isCancelled) {
          setCellData(new Map())
          setLoading(false)
        }
        return
      }

      if (!isCancelled) {
        setLoading(true)
      }

      try {
        const newCellData = new Map<string, CellData>()

        // Initialize all cells with empty farm selection
        for (const worker of activeWorkers) {
          for (const date of dateRange) {
            const dateStr = format(date, 'yyyy-MM-dd')
            const key = getCellKey(worker.id, dateStr)
            newCellData.set(key, {
              workerId: worker.id,
              date: dateStr,
              status: null,
              workType: null,
              farmIds: [], // Empty by default
              isModified: false
            })
          }
        }

        // Batch load attendance for all workers in a single query
        const workerIds = activeWorkers.map((w) => w.id)

        const records = await LaborService.getAttendanceByWorkerIds(workerIds, startDate, endDate)

        for (const record of records) {
          const key = getCellKey(record.worker_id, record.date)
          newCellData.set(key, {
            workerId: record.worker_id,
            date: record.date,
            status: record.work_status as AttendanceStatus,
            workType: record.work_type,
            farmIds: record.farm_ids || [], // Load existing farm IDs
            existingRecordId: record.id,
            isModified: false
          })
        }

        if (!isCancelled) {
          setCellData(newCellData)
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Error loading attendance:', error)
          toast.error('Failed to load attendance data')
        }
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
    // Using activeWorkerIds (string) as stable dependency to prevent re-runs when worker array reference changes
  }, [startDate, endDate, activeWorkerIds, farms.length, activeWorkers, dateRange])

  const handleCellClick = (workerId: number, date: string) => {
    const key = getCellKey(workerId, date)
    const current = cellData.get(key)

    if (!current) {
      return
    }

    // Cycle through statuses: null -> full_day -> half_day -> absent -> null
    const currentIndex = STATUS_CYCLE.indexOf(current.status)
    const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length
    const nextStatus = STATUS_CYCLE[nextIndex]

    setCellData((prev) => {
      const newMap = new Map(prev)
      newMap.set(key, {
        ...current,
        status: nextStatus,
        isModified: true
      })
      return newMap
    })
  }

  const handleWorkTypeChange = (workerId: number, date: string, workType: string) => {
    const key = getCellKey(workerId, date)
    const current = cellData.get(key)

    if (!current) return

    setCellData((prev) => {
      const newMap = new Map(prev)
      newMap.set(key, {
        ...current,
        workType: workType === 'none' ? null : workType,
        isModified: true
      })
      return newMap
    })
  }

  const handleFarmSelectionChange = (workerId: number, date: string, farmIds: number[]) => {
    const key = getCellKey(workerId, date)
    const current = cellData.get(key)

    if (!current) return

    setCellData((prev) => {
      const newMap = new Map(prev)
      newMap.set(key, {
        ...current,
        farmIds,
        isModified: true
      })
      return newMap
    })
  }

  const handleSave = React.useCallback(async () => {
    const modifiedCells = Array.from(cellData.values()).filter((cell) => cell.isModified)

    if (modifiedCells.length === 0) {
      toast.info('No changes to save')
      return
    }

    // Validate that cells with status have at least one farm selected
    const invalidCells = modifiedCells.filter(
      (cell) => cell.status !== null && cell.farmIds.length === 0
    )
    if (invalidCells.length > 0) {
      toast.error('Please select at least one farm for all attendance records')
      return
    }

    setSaving(true)
    try {
      const BATCH_SIZE = 10 // Process 10 records concurrently
      const errors: string[] = []
      const successfulCellKeys = new Set<string>()

      // Split modified cells into batches
      const batches: (typeof modifiedCells)[] = []
      for (let i = 0; i < modifiedCells.length; i += BATCH_SIZE) {
        batches.push(modifiedCells.slice(i, i + BATCH_SIZE))
      }

      // Process each batch in parallel
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex]

        await Promise.all(
          batch.map(async (cell) => {
            try {
              const worker = workers.find((w) => w.id === cell.workerId)
              if (!worker) return

              if (cell.existingRecordId) {
                // Update existing record
                if (cell.status === null) {
                  // Delete the record if status is cleared
                  await LaborService.deleteAttendance(cell.existingRecordId)
                } else {
                  // Update record (work type is optional)
                  await LaborService.updateAttendance(cell.existingRecordId, {
                    work_status: cell.status as WorkStatus,
                    work_type: cell.workType || 'other', // Default to 'other' if not set
                    daily_rate_override: cell.status === 'absent' ? 0 : undefined,
                    farm_ids: cell.farmIds // Update with cell's selected farms
                  })
                }
              } else if (cell.status !== null && cell.farmIds.length > 0) {
                // Create attendance if status is set and farms are selected
                // Create a single record with farm_ids array
                const createdRecord = await LaborService.createAttendance({
                  worker_id: cell.workerId,
                  farm_ids: cell.farmIds, // Use cell's selected farm IDs
                  date: cell.date,
                  work_status: cell.status as WorkStatus,
                  work_type: cell.workType || 'other', // Default to 'other' if not set
                  daily_rate_override: cell.status === 'absent' ? 0 : undefined
                })

                // Store the created record's ID so future edits update instead of creating duplicates
                const key = `${cell.workerId}-${cell.date}`
                successfulCellKeys.add(key)
                setCellData((prev) => {
                  const newMap = new Map(prev)
                  const cellEntry = newMap.get(key)
                  if (cellEntry) {
                    newMap.set(key, {
                      ...cellEntry,
                      existingRecordId: createdRecord.id,
                      isModified: false
                    })
                  }
                  return newMap
                })
                return
              }

              // Only mark as successful if no exception was thrown
              const key = `${cell.workerId}-${cell.date}`
              successfulCellKeys.add(key)
            } catch (error) {
              console.error(`Error saving attendance for worker ${cell.workerId}:`, error)
              errors.push(`Worker ${cell.workerId} on ${cell.date}`)
            }
          })
        )
      }

      if (errors.length > 0) {
        toast.error(`Failed to save ${errors.length} record(s). Check console for details.`)
      } else {
        toast.success(`Saved ${modifiedCells.length} attendance record(s)`)
      }
      onAttendanceSaved()

      // Only mark successfully saved cells as not modified
      setCellData((prev) => {
        const newMap = new Map(prev)
        for (const [key, cell] of newMap) {
          if (cell.isModified && successfulCellKeys.has(key)) {
            newMap.set(key, { ...cell, isModified: false })
          }
        }
        return newMap
      })
    } catch (error) {
      console.error('Error saving attendance:', error)
      toast.error('Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }, [cellData, workers, onAttendanceSaved])

  const hasModifications = React.useMemo(() => {
    const values = Array.from(cellData.values())
    const modifiedCells = values.filter((cell) => cell.isModified)
    return modifiedCells.length > 0
  }, [cellData])

  const navigateDateRange = (direction: 'prev' | 'next') => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = differenceInDays(end, start) + 1

    if (direction === 'prev') {
      setStartDate(format(subDays(start, days), 'yyyy-MM-dd'))
      setEndDate(format(subDays(end, days), 'yyyy-MM-dd'))
    } else {
      setStartDate(format(addDays(start, days), 'yyyy-MM-dd'))
      setEndDate(format(addDays(end, days), 'yyyy-MM-dd'))
    }
  }

  // Expose save function to parent
  React.useEffect(() => {
    if (onSaveFunction) {
      onSaveFunction(handleSave, hasModifications, saving)
    }
  }, [handleSave, hasModifications, saving, onSaveFunction])

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => navigateDateRange('prev')}
              title="Previous period"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => navigateDateRange('next')}
              title="Next period"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Label htmlFor="start-date" className="text-sm whitespace-nowrap">
                From:
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[150px] h-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="end-date" className="text-sm whitespace-nowrap">
                To:
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[150px] h-9"
              />
            </div>
          </div>
        </div>

        {dateRange.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Showing {dateRange.length} day{dateRange.length !== 1 ? 's' : ''} (
            {format(new Date(startDate), 'MMM d')} - {format(new Date(endDate), 'MMM d, yyyy')})
          </div>
        )}

        {dateRange.length === 0 && (
          <div className="text-xs text-red-600">
            Invalid date range. Please ensure start date is before or equal to end date, and range
            is not more than 31 days.
          </div>
        )}
      </div>

      {/* Attendance Grid */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : activeWorkers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No active workers found</div>
        ) : (
          <>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-green-500 text-white flex items-center justify-center text-xs font-medium">
                  F
                </div>
                <span>Full Day</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-amber-500 text-white flex items-center justify-center text-xs font-medium">
                  H
                </div>
                <span>Half Day</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-red-500 text-white flex items-center justify-center text-xs font-medium">
                  A
                </div>
                <span>Absent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-gray-100 text-gray-400 flex items-center justify-center text-xs font-medium">
                  -
                </div>
                <span>Not Set</span>
              </div>
            </div>

            {/* Spreadsheet */}
            <div className="overflow-auto max-h-[60vh] border rounded-lg">
              <table className="w-full border-collapse min-w-[600px]">
                <thead className="sticky top-0 z-20">
                  <tr>
                    <th className="text-left py-2 px-3 bg-gray-50 border border-gray-200 font-medium text-sm sticky left-0 z-30 min-w-[140px] w-[140px]">
                      Worker
                    </th>
                    {dateRange.map((date) => {
                      const dateStr = format(date, 'yyyy-MM-dd')
                      return (
                        <th
                          key={date.toISOString()}
                          className={cn(
                            'py-2 px-2 bg-gray-50 border border-gray-200 font-medium text-xs text-center min-w-[200px]',
                            isSameDay(date, new Date()) && 'bg-primary/10 !bg-primary/20'
                          )}
                        >
                          <div>{format(date, 'EEE')}</div>
                          <div className="text-muted-foreground font-normal">
                            {format(date, 'd MMM')}
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {activeWorkers.map((worker) => (
                    <tr key={worker.id}>
                      <td className="py-2 px-3 border border-gray-200 font-medium text-sm sticky left-0 bg-white z-10 min-w-[140px] w-[140px]">
                        <div className="truncate max-w-[140px]">{worker.name}</div>
                        <div className="text-xs text-muted-foreground font-normal">
                          Rs.{worker.daily_rate}/day
                        </div>
                      </td>
                      {dateRange.map((date) => {
                        const dateStr = format(date, 'yyyy-MM-dd')
                        const key = getCellKey(worker.id, dateStr)
                        const cell = cellData.get(key)
                        const statusInfo = getStatusDisplay(cell?.status ?? null)
                        const isModified = cell?.isModified ?? false

                        return (
                          <td
                            key={dateStr}
                            className={cn(
                              'py-2 px-2 border border-gray-200',
                              isSameDay(date, new Date()) && 'bg-primary/5',
                              isModified && 'ring-2 ring-inset ring-blue-400'
                            )}
                          >
                            <div className="flex flex-col gap-1.5 items-center">
                              {/* Attendance Status Button */}
                              <button
                                type="button"
                                onClick={() => handleCellClick(worker.id, dateStr)}
                                className={cn(
                                  'w-8 h-8 rounded-md flex items-center justify-center text-sm font-medium transition-all hover:opacity-80',
                                  statusInfo.bgClass
                                )}
                                title={`${worker.name} - ${format(date, 'EEE, MMM d')}: ${statusInfo.fullLabel}. Click to change.`}
                              >
                                {statusInfo.label}
                              </button>

                              {/* Work Type Selector */}
                              <Select
                                value={cell?.workType ?? 'none'}
                                onValueChange={(value) =>
                                  handleWorkTypeChange(worker.id, dateStr, value)
                                }
                              >
                                <SelectTrigger className="h-7 text-[10px] bg-white w-full">
                                  <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none" className="text-xs">
                                    Not set
                                  </SelectItem>
                                  {workTypes.map((type) => (
                                    <SelectItem key={type.id} value={type.name} className="text-xs">
                                      {type.name.charAt(0).toUpperCase() + type.name.slice(1)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {/* Farm Selection Popover */}
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className={cn(
                                      'h-7 px-2 text-[10px] bg-white border rounded-md w-full text-left hover:bg-gray-50 transition-colors',
                                      cell?.farmIds && cell.farmIds.length > 0
                                        ? 'border-primary text-primary'
                                        : 'border-gray-200 text-gray-500'
                                    )}
                                  >
                                    {cell?.farmIds && cell.farmIds.length > 0
                                      ? `${cell.farmIds.length} farm${cell.farmIds.length > 1 ? 's' : ''}`
                                      : 'Select farms'}
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 p-3" align="start">
                                  <div className="space-y-2">
                                    <div className="text-xs font-medium text-gray-700 mb-2">
                                      Select Farms
                                    </div>

                                    {/* Select All Option */}
                                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                                      <Checkbox
                                        id={`farm-all-${worker.id}-${dateStr}`}
                                        checked={
                                          cell?.farmIds?.length === farms.length && farms.length > 0
                                        }
                                        onCheckedChange={(checked) => {
                                          const newFarmIds = checked ? farms.map((f) => f.id) : []
                                          handleFarmSelectionChange(worker.id, dateStr, newFarmIds)
                                        }}
                                      />
                                      <Label
                                        htmlFor={`farm-all-${worker.id}-${dateStr}`}
                                        className="text-xs cursor-pointer flex-1 font-semibold"
                                      >
                                        Select All
                                      </Label>
                                    </div>

                                    {/* Individual Farm Options */}
                                    {farms.map((farm) => {
                                      const isSelected = cell?.farmIds?.includes(farm.id) ?? false
                                      return (
                                        <div key={farm.id} className="flex items-center gap-2">
                                          <Checkbox
                                            id={`farm-${worker.id}-${dateStr}-${farm.id}`}
                                            checked={isSelected}
                                            onCheckedChange={(checked) => {
                                              const currentFarmIds = cell?.farmIds ?? []
                                              const newFarmIds = checked
                                                ? [...currentFarmIds, farm.id]
                                                : currentFarmIds.filter((id) => id !== farm.id)
                                              handleFarmSelectionChange(
                                                worker.id,
                                                dateStr,
                                                newFarmIds
                                              )
                                            }}
                                          />
                                          <Label
                                            htmlFor={`farm-${worker.id}-${dateStr}-${farm.id}`}
                                            className="text-xs cursor-pointer flex-1"
                                          >
                                            {farm.name}
                                          </Label>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-y-1">
              <p className="text-xs text-muted-foreground">
                <strong>Attendance:</strong> Click the status button (F/H/A/-) to cycle through: Not
                Set &rarr; Full Day &rarr; Half Day &rarr; Absent
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>Work Type:</strong> Select work type for each worker and day separately.
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>Farms:</strong> Click &ldquo;Select farms&rdquo; to choose which farm(s) the
                worker was present at. At least one farm must be selected for each attendance
                record.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
