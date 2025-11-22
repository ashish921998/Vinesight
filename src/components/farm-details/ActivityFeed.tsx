'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Calendar, Edit, Trash2 } from 'lucide-react'
import {
  formatGroupedDate,
  getGroupedActivitiesSummary,
  groupActivitiesByDate,
  normalizeDateToYYYYMMDD
} from '@/lib/activity-display-utils'
import { getLogTypeIcon } from '@/lib/log-type-config'
import { cn } from '@/lib/utils'

interface ActivityFeedProps {
  recentActivities: any[]
  loading: boolean
  onEditDateGroup?: (date: string, activities: any[]) => void
  onDeleteDateGroup?: (date: string, activities: any[]) => void
  farmId?: string
  variant?: 'card' | 'plain'
  className?: string
  hideHeader?: boolean
}

const formatLogTypeLabel = (type: string) =>
  type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

export function ActivityFeed({
  recentActivities,
  loading,
  onEditDateGroup,
  onDeleteDateGroup,
  farmId,
  variant = 'card',
  className,
  hideHeader = false
}: ActivityFeedProps) {
  const router = useRouter()
  const groupedActivities = recentActivities ? groupActivitiesByDate(recentActivities) : []
  const canNavigateToLogs = Boolean(farmId)

  const header = (
    <div className="flex items-center gap-2 text-foreground">
      <Calendar className="h-5 w-5" />
      <CardTitle className="text-lg font-semibold">Recent activity</CardTitle>
    </div>
  )

  const emptyStateCard = (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center">
      <Calendar className="h-5 w-5 text-muted-foreground" />
      <div>
        <p className="text-sm font-semibold text-foreground">No activity yet</p>
        <p className="text-xs text-muted-foreground">
          Start logging irrigation, spray, or notes to build your history.
        </p>
      </div>
      {canNavigateToLogs && (
        <Button variant="outline" onClick={() => router.push(`/farms/${farmId}/logs?tab=log`)}>
          Add first log
        </Button>
      )}
    </div>
  )

  const emptyStatePlain = (
    <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
      No activity logged yet. Add irrigation, spray, or notes to see them here.
    </div>
  )

  const renderTimeline = () => (
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
              <span className="absolute left-1.5 sm:left-2 top-4 hidden h-3 w-3 items-center justify-center rounded-full border-4 border-card bg-primary shadow-[0_0_0_3px_rgba(85,112,41,0.12)] sm:flex" />
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
  )

  if (loading) {
    if (variant === 'plain') {
      return (
        <div className={cn('space-y-3', className)}>
          {[...Array(2)].map((_, index) => (
            <div
              key={index}
              className="h-20 rounded-2xl border border-border/60 bg-muted/20 animate-pulse"
            />
          ))}
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <Card className="rounded-3xl border border-gray-100 bg-white shadow-sm">
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
      </div>
    )
  }

  if (variant === 'plain') {
    return (
      <div className={cn('space-y-4', className)}>
        {!hideHeader && (
          <div className="flex items-center gap-2 text-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Recent activity</p>
          </div>
        )}
        {groupedActivities.length > 0 ? renderTimeline() : emptyStatePlain}
      </div>
    )
  }

  return (
    <Card className={cn('rounded-3xl border border-border bg-card/95 shadow-sm', className)}>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {header}
      </CardHeader>
      <CardContent>
        {groupedActivities.length > 0 ? (
          <>
            {renderTimeline()}
            {canNavigateToLogs && (
              <div className="mt-6">
                <Button
                  variant="outline"
                  className="w-full rounded-full border-border/70 text-foreground"
                  onClick={() => router.push(`/farms/${farmId}/logs`)}
                >
                  View full logbook
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          emptyStateCard
        )}
      </CardContent>
    </Card>
  )
}
