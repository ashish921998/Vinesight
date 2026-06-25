'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import type { CallReason, Finding, FindingTone } from '@/lib/consultant-dashboard-metrics'

const TONE_VAR: Record<FindingTone, string> = {
  urgent: '--severity-critical',
  attention: '--nutrient-deficient',
  positive: '--nutrient-optimal'
}

/**
 * "What needs attention" — the impression band. Each finding is a severity dot
 * + a plain sentence (with bold mono numbers) + an action link. Urgent first,
 * one positive last; zero-count findings are already suppressed by the builder.
 * When there are no findings the parent shows an "All caught up" state instead,
 * so this renders nothing in that case.
 */
export function ImpressionBand({
  findings,
  isLoading,
  isError,
  onFindingClick,
  onScrollToCallList
}: {
  findings: Finding[]
  isLoading: boolean
  isError: boolean
  onFindingClick: (finding: Finding) => void
  onScrollToCallList: (filter?: CallReason) => void
}) {
  if (isLoading) {
    return (
      <section className="rounded-xl bg-card text-card-foreground shadow-xs ring-1 ring-foreground/10">
        <div className="px-4 py-3">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="divide-y border-t">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-4 py-3">
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (isError) {
    return (
      <section className="rounded-xl bg-card text-card-foreground shadow-xs ring-1 ring-foreground/10">
        <div className="px-4 py-3">
          <h2 className="text-sm font-semibold">What needs attention</h2>
        </div>
        <p className="border-t px-4 py-6 text-center text-sm text-muted-foreground">
          Couldn&apos;t load attention items. Please refresh.
        </p>
      </section>
    )
  }

  if (findings.length === 0) return null

  return (
    <section className="rounded-xl bg-card text-card-foreground shadow-xs ring-1 ring-foreground/10">
      <div className="px-4 py-3">
        <h2 className="text-sm font-semibold">What needs attention</h2>
      </div>
      <ul className="divide-y border-t">
        {findings.map((finding) => (
          <li key={finding.id} className="flex items-center gap-3 px-4 py-3 text-sm">
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: `var(${TONE_VAR[finding.tone]})` }}
            />
            <p className="min-w-0 flex-1">
              {finding.segments.map((segment) =>
                segment.mono ? (
                  <span
                    key={`${finding.id}-${segment.text}`}
                    className="font-mono font-semibold tabular-nums"
                  >
                    {segment.text}
                  </span>
                ) : (
                  <span key={`${finding.id}-${segment.text}`}>{segment.text}</span>
                )
              )}
            </p>
            {finding.action.target.kind === 'route' ? (
              <Link
                href={finding.action.target.href}
                onClick={() => onFindingClick(finding)}
                className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary hover:underline"
              >
                {finding.action.label}
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onFindingClick(finding)
                  onScrollToCallList(
                    finding.action.target.kind === 'scroll'
                      ? finding.action.target.filter
                      : undefined
                  )
                }}
                className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary hover:underline"
              >
                {finding.action.label}
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
