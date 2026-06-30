'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  groupCallList,
  type CallListRow,
  type CallReason,
  type FarmerCallGroup
} from '@/lib/consultant-dashboard-metrics'

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

function rowLocation(row: CallListRow): string {
  return [row.village, row.farmName].filter(Boolean).join(' · ') || 'Location unknown'
}

function reasonDetail(row: CallListRow): string {
  if (row.reason === 'quiet' && row.daysSinceSample != null) {
    return `${row.daysSinceSample}d quiet`
  }
  return REASON_META[row.reason].label
}

function Dot({ reason }: { reason: CallReason }) {
  return (
    <span
      aria-hidden
      className="h-2 w-2 shrink-0 rounded-full"
      style={{ backgroundColor: `var(${REASON_META[reason].dotVar})` }}
    />
  )
}

/**
 * A self-contained, deep-linked row. Used for single-signal farmers (full, with
 * name + dot) and for each reviewed-no-plan farm under a grouped header
 * (`inset`, location only — the header already shows the name).
 */
function ActionRow({
  row,
  onContact,
  inset
}: {
  row: CallListRow
  onContact: (row: CallListRow) => void
  inset?: boolean
}) {
  const meta = REASON_META[row.reason]
  return (
    <Link
      href={rowHref(row)}
      onClick={() => onContact(row)}
      className={`flex items-center gap-3 rounded-md py-2.5 pr-2 transition-colors hover:bg-muted/50 ${
        inset ? 'pl-7' : 'pl-2'
      }`}
    >
      {!inset && <Dot reason={row.reason} />}
      <div className="min-w-0 flex-1">
        {!inset && (
          <p className="truncate font-serif text-sm font-medium">
            {row.farmerName || 'Unknown farmer'}
          </p>
        )}
        <p className="truncate text-xs text-muted-foreground">{rowLocation(row)}</p>
      </div>
      <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
        {reasonDetail(row)}
      </span>
      <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary">
        {meta.cta}
        <ChevronRight className="h-4 w-4" />
      </span>
    </Link>
  )
}

/**
 * One farmer's worth of the call list. A single flagged farm renders as a plain
 * {@link ActionRow}; a multi-farm farmer gets a "View farmer" header with quiet
 * farms as context lines and each reviewed-no-plan farm as its own inset row.
 */
function GroupBlock({
  group,
  onContact
}: {
  group: FarmerCallGroup
  onContact: (row: CallListRow) => void
}) {
  const total = group.quietFarms.length + group.planRows.length

  // Single signal — no grouping needed; keep the original flat row.
  if (total === 1) {
    return <ActionRow row={group.quietFarms[0] ?? group.planRows[0]} onContact={onContact} />
  }

  // The header's "View farmer" link covers every quiet farm (they share the
  // farmer page). Fire contact analytics against the most urgent farm.
  const headerRow = group.quietFarms[0] ?? group.planRows[0]
  return (
    <div className="py-1">
      <Link
        href={`/consultant/farmers/${group.clientUserId}`}
        onClick={() => onContact(headerRow)}
        className="flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/50"
      >
        <Dot reason={group.topReason} />
        <p className="min-w-0 flex-1 truncate font-serif text-sm font-medium">
          {group.farmerName || 'Unknown farmer'}
        </p>
        <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary">
          View farmer
          <ChevronRight className="h-4 w-4" />
        </span>
      </Link>

      {group.quietFarms.map((farm) => (
        <div key={farm.key} className="flex items-center gap-3 py-1.5 pl-7 pr-2">
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {rowLocation(farm)}
          </p>
          <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
            {farm.daysSinceSample}d quiet
          </span>
        </div>
      ))}

      {group.planRows.map((farm) => (
        <ActionRow key={farm.key} row={farm} onContact={onContact} inset />
      ))}
    </div>
  )
}

/**
 * The hero call list — the consultant's derived-state "who to reach out to
 * today". Grouped to per-farmer grain: a multi-farm farmer shows once, with its
 * flagged farms nested beneath. No contact logging: rows are derived and
 * self-clear when the underlying data changes (a new sample, an issued plan).
 * CTAs deep-link to the farmer page or the plan builder for the specific review.
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

  // Filter by reason first (so a reason filter prunes farms, not whole
  // farmers), then collapse to per-farmer groups.
  const groups = useMemo(() => {
    const filtered = filter ? rows.filter((r) => r.reason === filter) : rows
    return groupCallList(filtered)
  }, [rows, filter])

  const visible = expanded ? groups : groups.slice(0, VISIBLE_CAP)
  const hiddenCount = groups.length - visible.length

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
        ) : groups.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {filter
              ? 'No farmers match this filter.'
              : 'No farmers flagged for contact. Nicely kept up.'}
          </p>
        ) : (
          <ul className="divide-y">
            {visible.map((group) => (
              <li key={group.clientUserId}>
                <GroupBlock group={group} onContact={onContact} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {!isLoading && !isError && hiddenCount > 0 && (
        <div className="border-t px-2 py-2">
          <Button variant="ghost" size="sm" className="w-full" onClick={() => setExpanded(true)}>
            See all {groups.length} flagged farmers
          </Button>
        </div>
      )}
    </section>
  )
}
