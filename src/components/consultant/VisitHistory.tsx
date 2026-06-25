'use client'

import { Sprout, CheckCircle2, MinusCircle, XCircle, CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  followedStatusLabels,
  type Visit,
  type FollowedStatus
} from '@/lib/consultant-visit-service'

// Status colors come from the design system, not raw Tailwind: followed →
// optimal-green, partially → deficient-amber, not-followed → critical red
// (#7f1d1d / bg #fee2e2 per DESIGN.md). Always paired with an icon + label.
const followedStatusIcon: Record<FollowedStatus, React.ReactNode> = {
  followed: <CheckCircle2 className="h-3.5 w-3.5 text-[var(--nutrient-optimal)]" />,
  partially_followed: <MinusCircle className="h-3.5 w-3.5 text-[var(--nutrient-deficient)]" />,
  not_followed: <XCircle className="h-3.5 w-3.5 text-[#7f1d1d] dark:text-[#f3b2b2]" />
}

const followedStatusBadgeClass: Record<FollowedStatus, string> = {
  followed: 'bg-[var(--nutrient-optimal-bg)] text-[var(--nutrient-optimal)]',
  partially_followed: 'bg-[var(--nutrient-deficient-bg)] text-[var(--nutrient-deficient)]',
  not_followed: 'bg-[#fee2e2] text-[#7f1d1d] dark:bg-[#3a1c1c] dark:text-[#f3b2b2]'
}

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function dayBucket(dateStr: string): { key: string; label: string } {
  const date = new Date(dateStr)
  const today = startOfDay(new Date())
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const target = startOfDay(date)
  const key = target.toISOString().slice(0, 10)

  if (target.getTime() === today.getTime()) return { key, label: 'Today' }
  if (target.getTime() === yesterday.getTime()) return { key, label: 'Yesterday' }

  return {
    key,
    label: date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    })
  }
}

function initials(name: string | null | undefined): string {
  if (!name) return '—'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '—'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function timeLabel(createdAt: string | null): string | null {
  if (!createdAt) return null
  return new Date(createdAt).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  })
}

export function VisitHistory({ visits }: { visits: Visit[] }) {
  if (visits.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Visits
        </h2>
        <div className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
          <CalendarClock className="h-5 w-5 text-muted-foreground/60" />
          <span>
            No visits recorded for this farm. Use{' '}
            <span className="font-medium text-foreground">Record Visit</span> to log one.
          </span>
        </div>
      </section>
    )
  }

  const sorted = visits.toSorted(
    (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
  )

  const groups: { key: string; label: string; items: Visit[] }[] = []
  for (const v of sorted) {
    const bucket = dayBucket(v.visitDate)
    const last = groups[groups.length - 1]
    if (last && last.key === bucket.key) last.items.push(v)
    else groups.push({ ...bucket, items: [v] })
  }

  return (
    <section className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Visit history
        </h2>
        <span className="text-xs text-muted-foreground tabular-nums">{visits.length} total</span>
      </div>

      <div className="relative space-y-6">
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" aria-hidden />
        {groups.map((group) => (
          <div key={group.key} className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 pl-10">
              {group.label}
            </p>
            <ol className="space-y-4">
              {group.items.map((visit) => (
                <VisitEntry key={visit.id} visit={visit} />
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  )
}

function VisitEntry({ visit }: { visit: Visit }) {
  const followups = visit.followups
  const hasFollowups = followups.length > 0

  return (
    <li className="relative flex gap-3">
      <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-[11px] font-semibold uppercase text-muted-foreground">
        {initials(visit.visitedByName)}
      </div>

      <div className="min-w-0 flex-1 pb-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <p className="text-sm">
            <span className="font-medium text-foreground">
              {visit.visitedByName || 'Unknown visitor'}
            </span>{' '}
            <span className="text-muted-foreground">visited</span>
            {visit.farmName && (
              <>
                {' '}
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Sprout className="h-3 w-3" />
                  {visit.farmName}
                </span>
              </>
            )}
          </p>
          <time className="text-xs tabular-nums text-muted-foreground">
            {timeLabel(visit.createdAt)}
          </time>
        </div>

        {visit.summary && (
          <p className="mt-1 text-sm leading-relaxed text-foreground/90">{visit.summary}</p>
        )}

        {hasFollowups && (
          <div className="mt-2.5 space-y-1.5">
            {followups.map((f) => (
              <div
                key={f.id}
                className="flex flex-wrap items-center gap-2 rounded-md bg-muted/40 px-2.5 py-1.5"
              >
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium',
                    followedStatusBadgeClass[f.followedStatus]
                  )}
                >
                  {followedStatusIcon[f.followedStatus]}
                  {followedStatusLabels[f.followedStatus]}
                </span>
                {f.classification && (
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {f.classification}
                  </span>
                )}
                {f.recommendation && (
                  <span className="text-xs text-muted-foreground">{f.recommendation}</span>
                )}
                {f.note && <span className="text-xs text-foreground/90">{f.note}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </li>
  )
}
