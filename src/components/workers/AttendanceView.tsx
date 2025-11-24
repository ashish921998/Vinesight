'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Loader2, Check, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
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

  const activeWorkers = workers.filter((worker) => worker.is_active)
  if (activeWorkers.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No active workers available. Add workers to start recording attendance.
        </CardContent>
      </Card>
    )
  }

  const selectedHistoryWorker = activeWorkers.find(
    (worker) => worker.id === attendanceHistoryWorkerId
  )
  const sortedAttendance = [...attendanceHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const farmNameLookup = new Map(farms.map((farm) => [farm.id, farm.name]))

  const latestAttendanceLabel =
    sortedAttendance.length > 0
      ? format(new Date(sortedAttendance[0].date), 'dd MMM, yyyy')
      : 'No records yet'

  return (
    <div className="space-y-4 pb-32">
      <Card className="border-none bg-gradient-to-br from-primary/10 via-white to-white shadow-sm">
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Worker focus
              </p>
              <h3 className="text-xl font-semibold mt-1">
                {selectedHistoryWorker ? selectedHistoryWorker.name : 'Choose a worker'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Review attendance history or record a fresh entry for any farm and day.
              </p>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-white px-4 py-3 text-sm shadow-sm">
              <p className="text-xs uppercase text-muted-foreground">Last recorded</p>
              <p className="font-semibold text-primary">{latestAttendanceLabel}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase">Worker</Label>
            <Select
              value={attendanceHistoryWorkerId?.toString() || ''}
              onValueChange={(value) => onAttendanceHistoryWorkerChange(parseInt(value, 10))}
            >
              <SelectTrigger className="h-12 rounded-2xl border-primary/20 bg-white">
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
          <Button
            onClick={onOpenAttendanceModal}
            className="w-full rounded-full bg-primary hover:bg-primary/90 text-white"
            size="lg"
          >
            <Check className="h-4 w-4 mr-2" />
            Record Attendance
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Past attendance</h3>
            <p className="text-sm text-muted-foreground">
              {selectedHistoryWorker
                ? `Showing recent records for ${selectedHistoryWorker.name}`
                : 'Select a worker to view their attendance history'}
            </p>
          </div>

          {attendanceHistoryLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !selectedHistoryWorker ? (
            <p className="text-center text-muted-foreground py-6">
              Choose a worker to see attendance.
            </p>
          ) : sortedAttendance.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No attendance recorded yet.</p>
          ) : (
            <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-1">
              {sortedAttendance.slice(0, 50).map((record) => {
                const baseRate =
                  record.daily_rate_override ?? selectedHistoryWorker?.daily_rate ?? 0
                const computedAmount =
                  baseRate *
                  (record.work_status === 'full_day'
                    ? 1
                    : record.work_status === 'half_day'
                      ? 0.5
                      : 0)
                return (
                  <div
                    key={record.id}
                    className="rounded-2xl border border-muted bg-white/90 shadow-sm p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {format(new Date(record.date), 'EEE, MMM d')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {record.farm_id
                            ? farmNameLookup.get(record.farm_id) || `Farm #${record.farm_id}`
                            : 'Multiple farms'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            'px-3 py-1 rounded-full',
                            record.work_status === 'full_day' && 'bg-green-50 text-green-700',
                            record.work_status === 'half_day' && 'bg-amber-50 text-amber-700',
                            record.work_status === 'absent' && 'bg-muted text-muted-foreground'
                          )}
                        >
                          {record.work_status === 'full_day'
                            ? 'Full day'
                            : record.work_status === 'half_day'
                              ? 'Half day'
                              : 'Absent'}
                        </Badge>
                        <span className="text-sm font-medium capitalize text-muted-foreground">
                          {record.work_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground"
                          onClick={() => onOpenEditAttendance(record)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500"
                          onClick={() => onRequestDeleteAttendance(record)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t pt-3">
                      <div>
                        {record.notes ? (
                          <p className="text-sm text-muted-foreground">{record.notes}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">No notes added.</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-primary">
                          ₹{computedAmount.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-muted-foreground">Recorded amount</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
