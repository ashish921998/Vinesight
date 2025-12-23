'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2,
  Pencil,
  Trash2,
  Calendar,
  List,
  BarChart3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek
} from 'date-fns'
import { cn } from '@/lib/utils'
import type { Worker, WorkerAttendance } from '@/lib/supabase'

interface Farm {
  id: number
  name: string
}

interface AttendanceViewProps {
  farms: Farm[]
  workers: Worker[]
  attendanceHistoryWorkerId: number | null
  attendanceHistory: WorkerAttendance[]
  attendanceHistoryLoading: boolean
  onFarmNavigation: () => void
  onAttendanceHistoryWorkerChange: (workerId: number) => void
  onOpenAttendanceModal: () => void
  onOpenEditAttendance: (record: WorkerAttendance) => void
  onRequestDeleteAttendance: (record: WorkerAttendance) => void
}

export function AttendanceView({
  farms,
  workers,
  attendanceHistoryWorkerId,
  attendanceHistory,
  attendanceHistoryLoading,
  onFarmNavigation,
  onAttendanceHistoryWorkerChange,
  onOpenAttendanceModal,
  onOpenEditAttendance,
  onRequestDeleteAttendance
}: AttendanceViewProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [viewMode, setViewMode] = React.useState<'calendar' | 'list' | 'stats'>('list')

  // Calculate derived data (must be before early returns)
  const activeWorkers = workers.filter((worker) => worker.is_active)
  const selectedHistoryWorker = activeWorkers.find(
    (worker) => worker.id === attendanceHistoryWorkerId
  )
  const sortedAttendance = React.useMemo(
    () =>
      [...attendanceHistory].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [attendanceHistory]
  )
  const farmNameLookup = React.useMemo(
    () => new Map(farms.map((farm) => [farm.id, farm.name])),
    [farms]
  )

  const latestAttendanceLabel =
    sortedAttendance.length > 0
      ? format(new Date(`${sortedAttendance[0].date}T00:00:00`), 'dd MMM, yyyy')
      : 'No records yet'

  // Calculate statistics
  const stats = React.useMemo(() => {
    const fullDays = sortedAttendance.filter((a) => a.work_status === 'full_day').length
    const halfDays = sortedAttendance.filter((a) => a.work_status === 'half_day').length
    const absences = sortedAttendance.filter((a) => a.work_status === 'absent').length
    const totalAmount = sortedAttendance.reduce((sum, record) => {
      const baseRate = record.daily_rate_override ?? selectedHistoryWorker?.daily_rate ?? 0
      const amount =
        baseRate *
        (record.work_status === 'full_day' ? 1 : record.work_status === 'half_day' ? 0.5 : 0)
      return sum + amount
    }, 0)

    return { fullDays, halfDays, absences, totalAmount, totalRecords: sortedAttendance.length }
  }, [sortedAttendance, selectedHistoryWorker])

  // Early returns after all hooks
  if (farms.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">No farms found. Create a farm first.</p>
          <Button onClick={onFarmNavigation}>Go to Farms</Button>
        </CardContent>
      </Card>
    )
  }

  if (activeWorkers.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No active workers available. Add workers to start recording attendance.
        </CardContent>
      </Card>
    )
  }

  // Get attendance for calendar view
  const getAttendanceForDate = (date: Date) => {
    return sortedAttendance.find((record) => isSameDay(new Date(`${record.date}T00:00:00`), date))
  }

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const renderCalendarView = () => (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base md:text-lg font-semibold">{format(currentMonth, 'MMM yyyy')}</h3>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
            className="h-8 px-2 text-xs"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
          <div
            key={i}
            className="text-center text-[10px] md:text-xs font-medium text-muted-foreground py-1"
          >
            {day}
          </div>
        ))}
        {calendarDays.map((day) => {
          const attendance = getAttendanceForDate(day)
          const isCurrentMonth =
            day.getMonth() === currentMonth.getMonth() &&
            day.getFullYear() === currentMonth.getFullYear()
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'aspect-square p-1 border rounded text-center flex flex-col items-center justify-center',
                !isCurrentMonth && 'opacity-30',
                isToday && 'border-accent border-2',
                !attendance && isCurrentMonth && 'bg-gray-50',
                attendance?.work_status === 'full_day' && 'bg-green-50 border-green-300',
                attendance?.work_status === 'half_day' && 'bg-amber-50 border-amber-300',
                attendance?.work_status === 'absent' && 'bg-red-50 border-red-300'
              )}
            >
              <div className="text-xs md:text-sm font-medium">{format(day, 'd')}</div>
              {attendance && (
                <div className="text-[10px] font-bold mt-0.5">
                  {attendance.work_status === 'full_day'
                    ? 'F'
                    : attendance.work_status === 'half_day'
                      ? 'H'
                      : 'A'}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 md:gap-4 text-[10px] md:text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-50 border border-green-300 rounded" />
          <span>Full</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-amber-50 border border-amber-300 rounded" />
          <span>Half</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-50 border border-red-300 rounded" />
          <span>Absent</span>
        </div>
      </div>
    </div>
  )

  const renderListView = () => (
    <div className="space-y-2 md:space-y-3 max-h-[32rem] overflow-y-auto pr-1">
      {sortedAttendance.slice(0, 50).map((record) => {
        const baseRate = record.daily_rate_override ?? selectedHistoryWorker?.daily_rate ?? 0
        const computedAmount =
          baseRate *
          (record.work_status === 'full_day' ? 1 : record.work_status === 'half_day' ? 0.5 : 0)
        return (
          <div key={record.id} className="rounded-lg border bg-white shadow-sm p-3 md:p-4">
            {/* Mobile Layout */}
            <div className="space-y-2">
              {/* Date and Actions Row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {format(new Date(`${record.date}T00:00:00`), 'EEE, MMM d')}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {record.farm_ids && record.farm_ids.length > 0
                      ? record.farm_ids
                          .map((id) => farmNameLookup.get(id) || `Farm #${id}`)
                          .join(', ')
                      : 'No farms'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground"
                    onClick={() => onOpenEditAttendance(record)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-500"
                    onClick={() => onRequestDeleteAttendance(record)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Status and Amount Row */}
              <div className="flex items-center justify-between gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'px-2 py-0.5 text-xs rounded-full',
                    record.work_status === 'full_day' &&
                      'bg-green-50 text-green-700 border-green-200',
                    record.work_status === 'half_day' &&
                      'bg-amber-50 text-amber-700 border-amber-200',
                    record.work_status === 'absent' && 'bg-red-50 text-red-600 border-red-200'
                  )}
                >
                  {record.work_status === 'full_day'
                    ? 'Full'
                    : record.work_status === 'half_day'
                      ? 'Half'
                      : 'Absent'}
                </Badge>
                <div className="text-right">
                  <p className="text-base md:text-lg font-bold text-primary">
                    ₹{computedAmount.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Notes (if any) */}
              {record.notes && (
                <p className="text-xs text-muted-foreground line-clamp-2">{record.notes}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderStatsView = () => (
    <div className="space-y-3 md:space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="text-xl md:text-2xl font-bold text-green-600">{stats.fullDays}</div>
            <div className="text-[10px] md:text-xs text-muted-foreground">Full Days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xl md:text-2xl font-bold text-amber-600">{stats.halfDays}</div>
            <div className="text-[10px] md:text-xs text-muted-foreground">Half Days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xl md:text-2xl font-bold text-red-600">{stats.absences}</div>
            <div className="text-[10px] md:text-xs text-muted-foreground">Absences</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xl md:text-2xl font-bold text-primary">
              ₹{Math.round(stats.totalAmount / 1000)}k
            </div>
            <div className="text-[10px] md:text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card>
        <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
          <h4 className="text-sm md:text-base font-semibold">Summary</h4>
          <div className="space-y-2 md:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm text-muted-foreground">Total Records</span>
              <span className="text-sm md:text-base font-semibold">{stats.totalRecords}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm text-muted-foreground">Effective Attendance</span>
              <span className="text-sm md:text-base font-semibold">
                {stats.totalRecords > 0
                  ? (((stats.fullDays + stats.halfDays * 0.5) / stats.totalRecords) * 100).toFixed(
                      1
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm text-muted-foreground">Avg. Daily Rate</span>
              <span className="text-sm md:text-base font-semibold">
                ₹
                {stats.fullDays + stats.halfDays * 0.5 > 0
                  ? (stats.totalAmount / (stats.fullDays + stats.halfDays * 0.5)).toFixed(0)
                  : 0}
              </span>
            </div>
          </div>

          {/* Visual Progress Bars */}
          <div className="space-y-2 pt-3 md:pt-4 border-t">
            <div>
              <div className="flex justify-between text-[10px] md:text-xs mb-1">
                <span>Full Days</span>
                <span>
                  {stats.totalRecords > 0
                    ? ((stats.fullDays / stats.totalRecords) * 100).toFixed(0)
                    : 0}
                  %
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${stats.totalRecords > 0 ? (stats.fullDays / stats.totalRecords) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] md:text-xs mb-1">
                <span>Half Days</span>
                <span>
                  {stats.totalRecords > 0
                    ? ((stats.halfDays / stats.totalRecords) * 100).toFixed(0)
                    : 0}
                  %
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500"
                  style={{
                    width: `${stats.totalRecords > 0 ? (stats.halfDays / stats.totalRecords) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] md:text-xs mb-1">
                <span>Absences</span>
                <span>
                  {stats.totalRecords > 0
                    ? ((stats.absences / stats.totalRecords) * 100).toFixed(0)
                    : 0}
                  %
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500"
                  style={{
                    width: `${stats.totalRecords > 0 ? (stats.absences / stats.totalRecords) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-3 md:space-y-4 pb-32">
      <Card className="border-none bg-gradient-to-br from-primary/10 via-white to-white shadow-sm">
        <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  Worker
                </p>
                <h3 className="text-base md:text-xl font-semibold mt-0.5 truncate">
                  {selectedHistoryWorker ? selectedHistoryWorker.name : 'Choose a worker'}
                </h3>
              </div>
              <div className="rounded-lg border border-accent/20 bg-white px-3 py-1.5 text-xs shadow-sm">
                <p className="text-[10px] uppercase text-muted-foreground">Last</p>
                <p className="font-semibold text-primary text-xs">{latestAttendanceLabel}</p>
              </div>
            </div>

            <Select
              value={attendanceHistoryWorkerId?.toString() || ''}
              onValueChange={(value) => onAttendanceHistoryWorkerChange(parseInt(value, 10))}
            >
              <SelectTrigger className="h-10 md:h-12 rounded-lg border-accent/20 bg-white">
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
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-base md:text-lg font-semibold">Past Attendance</h3>
                {selectedHistoryWorker && (
                  <p className="text-xs text-muted-foreground">{sortedAttendance.length} records</p>
                )}
              </div>
              {selectedHistoryWorker && sortedAttendance.length > 0 && (
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                  <TabsList className="h-9">
                    <TabsTrigger value="list" className="gap-1 text-xs px-2 md:px-3">
                      <List className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">List</span>
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="gap-1 text-xs px-2 md:px-3">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Cal</span>
                    </TabsTrigger>
                    <TabsTrigger value="stats" className="gap-1 text-xs px-2 md:px-3">
                      <BarChart3 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Stats</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </div>
          </div>

          {attendanceHistoryLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !selectedHistoryWorker ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Choose a worker to see attendance.
            </p>
          ) : sortedAttendance.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              No attendance recorded yet.
            </p>
          ) : (
            <>
              {viewMode === 'list' && renderListView()}
              {viewMode === 'calendar' && renderCalendarView()}
              {viewMode === 'stats' && renderStatsView()}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
