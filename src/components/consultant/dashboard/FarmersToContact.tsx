'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/Skeleton'
import type { CallListRow, CallReason } from '@/lib/consultant-dashboard-metrics'

const VISIBLE_CAP = 10

const REASON_META: Record<CallReason, { dotVar: string; label: string; cta: string }> = {
  quiet: { dotVar: '--nutrient-deficient', label: 'Gone quiet', cta: 'View farmer' },
  no_plan: { dotVar: '--status-in-review', label: 'Reviewed · no plan', cta: 'Issue plan' }
}

function rowHref(row: CallListRow): string {
  if (row.reason === 'no_plan' && row.triageId != null) {
    return `/consultant/farmers/${row.clientUserId}/farms/${row.farmId}?reviewId=${row.triageId}`
  }
  return `/consultant/farmers/${row.clientUserId}`
}

function reasonDetail(row: CallListRow): string {
  if (row.reason === 'quiet' && row.daysSinceSample != null) {
    return `${row.daysSinceSample}d quiet`
  }
  return REASON_META[row.reason].label
}

/**
 * The hero call list — the consultant's derived-state "who to reach out to
 * today". Per-farm grain (a multi-farm farmer can appear once per flagged
 * farm). No contact logging: rows are derived and self-clear when the
 * underlying data changes (a new sample, an issued plan). CTAs deep-link to the
 * farmer page or the plan builder for the specific review.
 */
export function FarmersToContact({
  rows,
  isLoading,
  isError,
  filter,
  onClearFilter,
  onContact
}: {
  rows: CallListRow[]
  isLoading: boolean
  isError: boolean
  filter: CallReason | null
  onClearFilter: () => void
  onContact: (row: CallListRow) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const filtered = useMemo(
    () => (filter ? rows.filter((r) => r.reason === filter) : rows),
    [rows, filter]
  )
  const visible = expanded ? filtered : filtered.slice(0, VISIBLE_CAP)
  const hiddenCount = filtered.length - visible.length

  return (
    <section
      id="farmers-to-contact"
      className="scroll-mt-6 rounded-xl bg-card text-card-foreground shadow-xs ring-1 ring-foreground/10"
    >
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-semibold tracking-tight">Farmers to contact</h2>
            <p className="text-xs text-muted-foreground">
              Derived from today&apos;s data — clears itself as you act
            </p>
          </div>
        </div>
        {filter && (
          <Button variant="ghost" size="xs" onClick={onClearFilter} className="gap-1">
            {REASON_META[filter].label}
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="px-2 py-1">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load the call list. Please refresh.
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {filter
              ? 'No farmers match this filter.'
              : 'No farmers flagged for contact. Nicely kept up.'}
          </p>
        ) : (
          <ul className="divide-y">
            {visible.map((row) => {
              const meta = REASON_META[row.reason]
              const location = [row.village, row.farmName].filter(Boolean).join(' · ')
              return (
                <li key={row.key}>
                  <Link
                    href={rowHref(row)}
                    onClick={() => onContact(row)}
                    className="-mx-0 flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/50"
                  >
                    <span
                      aria-hidden
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: `var(${meta.dotVar})` }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif text-sm font-medium">
                        {row.farmerName || 'Unknown farmer'}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {location || 'Location unknown'}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                      {reasonDetail(row)}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary">
                      {meta.cta}
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {!isLoading && !isError && hiddenCount > 0 && (
        <div className="border-t px-2 py-2">
          <Button variant="ghost" size="sm" className="w-full" onClick={() => setExpanded(true)}>
            See all {filtered.length} flagged farmers
          </Button>
        </div>
      )}
    </section>
  )
}
