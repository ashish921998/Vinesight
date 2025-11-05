'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Calendar, Clock, Edit, ListChecks, Trash2 } from 'lucide-react'
import {
  formatGroupedDate,
  getGroupedActivitiesSummary,
  groupActivitiesByDate,
  normalizeDateToYYYYMMDD
} from '@/lib/activity-display-utils'
import { getLogTypeIcon } from '@/lib/log-type-config'

interface ActivityFeedProps {
  recentActivities: any[]
  pendingTasks: any[]
  loading: boolean
  onCompleteTask: (taskId: number) => Promise<void>
  onDeleteRecord: (record: any, recordType: string) => void
  onEditDateGroup?: (date: string, activities: any[]) => void
  onDeleteDateGroup?: (date: string, activities: any[]) => void
  farmId?: string
}

const formatLogTypeLabel = (type: string) =>
  type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

export function ActivityFeed({
  recentActivities,
  pendingTasks,
  loading,
  onCompleteTask,
  onDeleteRecord: _onDeleteRecord,
  onEditDateGroup,
  onDeleteDateGroup,
  farmId
}: ActivityFeedProps) {
  const router = useRouter()
  const groupedActivities = recentActivities ? groupActivitiesByDate(recentActivities) : []

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="border border-gray-100 bg-white shadow-sm">
          <CardHeader>
            <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3"
              >
                <div className="h-10 w-10 rounded-xl bg-slate-200 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 rounded bg-slate-200 animate-pulse" />
                  <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
                </div>
                <div className="h-9 w-16 rounded-lg bg-slate-200 animate-pulse" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border border-gray-100 bg-white shadow-sm">
          <CardHeader>
            <div className="h-4 w-40 rounded bg-slate-200 animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="h-full w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
                <div className="flex-1 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="h-4 w-28 rounded bg-slate-200 animate-pulse" />
                  <div className="mt-2 h-3 w-full rounded bg-slate-100 animate-pulse" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {pendingTasks && pendingTasks.length > 0 && (
        <Card className="border border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-primary">
              <ListChecks className="h-5 w-5" />
              <CardTitle className="text-lg font-semibold text-primary">
                {pendingTasks.length} pending task
                {pendingTasks.length > 1 ? 's' : ''}
              </CardTitle>
            </div>
            <p className="text-sm text-primary/90">
              Stay ahead by clearing today&apos;s priorities first.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingTasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {task.title || task.task_type || 'Scheduled task'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'soon'}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="self-start rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 sm:self-center"
                  onClick={() => onCompleteTask(task.id)}
                >
                  Mark complete
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <Calendar className="h-5 w-5" />
            <CardTitle className="text-lg font-semibold">Recent activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {groupedActivities.length > 0 ? (
            <>
              <div className="relative">
                <div className="absolute left-3 sm:left-4 top-0 h-full w-px bg-gradient-to-b from-primary/20 via-primary/10 to-transparent" />
                <div className="space-y-4 sm:space-y-5">
                  {groupedActivities.slice(0, 6).map((grouped) => {
                    const firstActivity = grouped.activities[0]
                    const Icon = getLogTypeIcon(firstActivity.type)
                    const formattedDate = normalizeDateToYYYYMMDD(grouped.date)

                    return (
                      <div
                        key={`${grouped.date}-${grouped.totalCount}`}
                        role="button"
                        tabIndex={0}
                        className="relative pl-8 sm:pl-11 focus:outline-none"
                        onClick={() => {
                          if (formattedDate && onEditDateGroup) {
                            onEditDateGroup(formattedDate, grouped.activities)
                          }
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            if (formattedDate && onEditDateGroup) {
                              onEditDateGroup(formattedDate, grouped.activities)
                            }
                          }
                        }}
                      >
                        <span className="absolute left-1.5 sm:left-2 top-4 flex h-3 w-3 sm:h-3.5 sm:w-3.5 items-center justify-center rounded-full border-4 border-card bg-primary shadow-[0_0_0_3px_rgba(85,112,41,0.12)]" />
                        <div className="group rounded-xl border border-border bg-muted/40 p-4 sm:p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-semibold text-foreground sm:text-base">
                                  {formatGroupedDate(grouped.date)}
                                </h3>
                                <Badge className="bg-primary/10 text-primary">
                                  {grouped.totalCount} log{grouped.totalCount !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                {onEditDateGroup && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="inline-flex h-9 w-9 items-center justify-center text-primary hover:bg-primary/10 hover:text-primary"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      if (formattedDate) {
                                        onEditDateGroup(formattedDate, grouped.activities)
                                      }
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                {onDeleteDateGroup && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="inline-flex h-9 w-9 items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      if (formattedDate) {
                                        onDeleteDateGroup(formattedDate, grouped.activities)
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground sm:text-sm">
                              {getGroupedActivitiesSummary(grouped)}
                            </p>
                            {firstActivity.notes && (
                              <div className="rounded-lg bg-card px-3 py-2 text-xs text-muted-foreground">
                                {firstActivity.notes.length > 80
                                  ? `${firstActivity.notes.substring(0, 80)}…`
                                  : firstActivity.notes}
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                              {grouped.logTypes.slice(0, 3).map((type) => {
                                const TypeIcon = getLogTypeIcon(type)
                                return (
                                  <span
                                    key={`${grouped.date}-${type}`}
                                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary"
                                  >
                                    <TypeIcon className="h-3.5 w-3.5" />
                                    {formatLogTypeLabel(type)}
                                  </span>
                                )
                              })}
                              {grouped.logTypes.length > 3 && (
                                <span className="text-[11px] text-muted-foreground">
                                  +{grouped.logTypes.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:bg-muted/70"
                onClick={() => router.push(`/farms/${farmId}/logs`)}
              >
                View full logbook
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-center text-muted-foreground">
              <Calendar className="h-10 w-10 text-primary" />
              <p className="text-sm font-medium text-foreground">No activity logged yet</p>
              <p className="text-xs text-muted-foreground">
                Use the quick actions to add your first farm log.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
