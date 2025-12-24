'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import type {
  Worker,
  WorkerAttendance,
  WorkerTransaction,
  TemporaryWorkerEntry
} from '@/lib/supabase'

interface Farm {
  id: number
  name: string
}

interface FixedAnalytics {
  salaryTotal: number
  advanceRecovered: number
  byWorker: Array<{
    worker_id: number
    worker_name: string
    salary: number
    days: number
    advance: number
  }>
  attendanceRecords: WorkerAttendance[]
  advanceTransactions: WorkerTransaction[]
}

interface TempAnalytics {
  totalPaid: number
  byWorker: Array<{ name: string; totalPaid: number; hours: number }>
  entries: TemporaryWorkerEntry[]
}

interface AnalyticsViewProps {
  farms: Farm[]
  analyticsLoading: boolean
  analyticsStartDate: string
  analyticsEndDate: string
  analyticsFarmId: number | null
  fixedAnalytics: FixedAnalytics
  tempAnalytics: TempAnalytics
  showFixedDetails: boolean
  selectedFixedWorker: number | 'all'
  showTempDetails: boolean
  selectedTempWorker: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onFarmIdChange: (farmId: number | null) => void
  onToggleFixedDetails: () => void
  onSelectedFixedWorkerChange: (workerId: number | 'all') => void
  onToggleTempDetails: () => void
  onSelectedTempWorkerChange: (workerName: string) => void
}

export function AnalyticsView({
  farms,
  analyticsLoading,
  analyticsStartDate,
  analyticsEndDate,
  analyticsFarmId,
  fixedAnalytics,
  tempAnalytics,
  showFixedDetails,
  selectedFixedWorker,
  showTempDetails,
  selectedTempWorker,
  onStartDateChange,
  onEndDateChange,
  onFarmIdChange,
  onToggleFixedDetails,
  onSelectedFixedWorkerChange,
  onToggleTempDetails,
  onSelectedTempWorkerChange
}: AnalyticsViewProps) {
  return (
    <div className="space-y-4 pb-32">
      <Card className="border-none bg-gradient-to-br from-primary/10 via-white to-white shadow-sm rounded-3xl">
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent/10 text-primary flex items-center justify-center font-semibold">
                AI
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                  Analytics
                </p>
                <h3 className="text-xl font-semibold text-foreground">Labor cost insights</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Choose a date range and farm to understand salaries, advances, and temporary payouts.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase">From</Label>
              <Input
                type="date"
                value={analyticsStartDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="h-12 rounded-2xl border-accent/20 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase">To</Label>
              <Input
                type="date"
                value={analyticsEndDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="h-12 rounded-2xl border-accent/20 bg-white"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase">Farm</Label>
              <Select
                value={analyticsFarmId?.toString() || 'all'}
                onValueChange={(value) =>
                  onFarmIdChange(value === 'all' ? null : parseInt(value, 10))
                }
              >
                <SelectTrigger className="h-12 rounded-2xl border-accent/20 bg-white">
                  <SelectValue placeholder="All farms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All farms</SelectItem>
                  {farms.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id.toString()}>
                      {farm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-2xl border border-dashed border-accent/30 bg-white/70 p-4 text-sm text-muted-foreground">
              Filters are applied automatically. Adjust the range or farm and the analytics refresh
              instantly.
            </div>
          </div>
        </CardContent>
      </Card>

      {analyticsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="rounded-2xl border-none bg-white shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-primary">Fixed workers</p>
                  <p className="text-3xl font-bold mt-1">
                    ₹{fixedAnalytics.salaryTotal.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Advance recovered: ₹{fixedAnalytics.advanceRecovered.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="rounded-full bg-accent/10 text-primary px-3 py-1 text-xs font-semibold">
                  Fixed
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none bg-white shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-amber-600">
                    Temporary workers
                  </p>
                  <p className="text-3xl font-bold mt-1">
                    ₹{tempAnalytics.totalPaid.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total hours:{' '}
                    {tempAnalytics.byWorker.reduce((sum, entry) => sum + entry.hours, 0).toFixed(1)}
                  </p>
                </div>
                <div className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-semibold">
                  Temp
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none rounded-3xl shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    Fixed worker breakdown
                  </p>
                  <h3 className="text-lg font-semibold">Salaries vs. recovered advances</h3>
                </div>
                <div className="inline-flex rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold text-primary">
                  {fixedAnalytics.byWorker.length} workers
                </div>
              </div>

              {fixedAnalytics.byWorker.length === 0 ? (
                <p className="text-sm text-muted-foreground">No records for this range.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {fixedAnalytics.byWorker.map((entry) => (
                    <div key={entry.worker_id} className="rounded-2xl border border-muted p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{entry.worker_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.days.toFixed(1)} days · ₹{entry.advance.toLocaleString('en-IN')}{' '}
                            recovered
                          </p>
                        </div>
                        <p className="text-base font-semibold">
                          ₹{entry.salary.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-2xl border border-dashed border-accent/30 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Drill down</p>
                    <h4 className="text-base font-semibold">Detailed salary & advance logs</h4>
                  </div>
                  <Button variant="outline" size="sm" onClick={onToggleFixedDetails}>
                    {showFixedDetails ? 'Hide Details' : 'View Details'}
                  </Button>
                </div>

                {showFixedDetails && fixedAnalytics.byWorker.length > 0 && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Worker</Label>
                      <Select
                        value={
                          selectedFixedWorker === 'all' ? 'all' : selectedFixedWorker.toString()
                        }
                        onValueChange={(value) =>
                          onSelectedFixedWorkerChange(value === 'all' ? 'all' : parseInt(value, 10))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose worker" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All workers</SelectItem>
                          {fixedAnalytics.byWorker.map((entry) => (
                            <SelectItem key={entry.worker_id} value={entry.worker_id.toString()}>
                              {entry.worker_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <Card>
                        <CardContent className="p-3 space-y-2">
                          <p className="text-xs text-muted-foreground uppercase">Salary timeline</p>
                          <div className="h-48 overflow-y-auto pr-2 space-y-1">
                            {fixedAnalytics.attendanceRecords
                              .filter((record) =>
                                selectedFixedWorker === 'all'
                                  ? true
                                  : record.worker_id === selectedFixedWorker
                              )
                              .map((record) => {
                                const worker = (record as any).worker as Worker
                                const rate = record.daily_rate_override ?? worker?.daily_rate ?? 0
                                const amount = rate * (record.work_status === 'full_day' ? 1 : 0.5)
                                return (
                                  <div
                                    key={`${record.worker_id}-${record.date}-${record.work_type}`}
                                    className="flex items-center justify-between text-xs border-b py-1"
                                  >
                                    <span>
                                      {format(new Date(record.date), 'MMM d')} – {record.work_type}
                                    </span>
                                    <span>₹{amount.toLocaleString('en-IN')}</span>
                                  </div>
                                )
                              })}
                            {fixedAnalytics.attendanceRecords.filter((record) =>
                              selectedFixedWorker === 'all'
                                ? true
                                : record.worker_id === selectedFixedWorker
                            ).length === 0 && (
                              <p className="text-xs text-muted-foreground">No salary entries</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-3 space-y-2">
                          <p className="text-xs text-muted-foreground uppercase">
                            Advance deductions
                          </p>
                          <div className="h-48 overflow-y-auto pr-2 space-y-1">
                            {fixedAnalytics.advanceTransactions
                              .filter((tx) =>
                                selectedFixedWorker === 'all'
                                  ? true
                                  : tx.worker_id === selectedFixedWorker
                              )
                              .map((tx) => (
                                <div
                                  key={tx.id}
                                  className="flex items-center justify-between text-xs border-b py-1"
                                >
                                  <span>{format(new Date(tx.date), 'MMM d')}</span>
                                  <span>₹{tx.amount.toLocaleString('en-IN')}</span>
                                </div>
                              ))}
                            {fixedAnalytics.advanceTransactions.filter((tx) =>
                              selectedFixedWorker === 'all'
                                ? true
                                : tx.worker_id === selectedFixedWorker
                            ).length === 0 && (
                              <p className="text-xs text-muted-foreground">No deductions</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none rounded-3xl shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
                    Temporary workers
                  </p>
                  <h3 className="text-lg font-semibold">Payments to short-term labor</h3>
                </div>
                <div className="inline-flex rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
                  {tempAnalytics.byWorker.length} workers
                </div>
              </div>

              {tempAnalytics.byWorker.length === 0 ? (
                <p className="text-sm text-muted-foreground">No temporary workers recorded.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {tempAnalytics.byWorker.map((entry) => (
                    <div key={entry.name} className="rounded-2xl border border-muted p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{entry.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.hours.toFixed(1)} hours
                          </p>
                        </div>
                        <p className="text-base font-semibold">
                          ₹{entry.totalPaid.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-2xl border border-dashed border-amber-200 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Drill down</p>
                    <h4 className="text-base font-semibold">Detailed shift tracker</h4>
                  </div>
                  <Button variant="outline" size="sm" onClick={onToggleTempDetails}>
                    {showTempDetails ? 'Hide Details' : 'View Details'}
                  </Button>
                </div>

                {showTempDetails && tempAnalytics.byWorker.length > 0 && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Worker</Label>
                      <Select value={selectedTempWorker} onValueChange={onSelectedTempWorkerChange}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose worker" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All temporary workers</SelectItem>
                          {tempAnalytics.byWorker.map((entry) => (
                            <SelectItem key={entry.name} value={entry.name}>
                              {entry.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
                      {tempAnalytics.entries
                        .filter((entry) =>
                          selectedTempWorker === 'all' ? true : entry.name === selectedTempWorker
                        )
                        .map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between text-sm border-b pb-1"
                          >
                            <div>
                              <p className="font-medium">{entry.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(entry.date), 'MMM d')} · {entry.hours_worked}h
                              </p>
                            </div>
                            <span>₹{entry.amount_paid.toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      {tempAnalytics.entries.filter((entry) =>
                        selectedTempWorker === 'all' ? true : entry.name === selectedTempWorker
                      ).length === 0 && <p className="text-xs text-muted-foreground">No entries</p>}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
