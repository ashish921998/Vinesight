'use client'

import { Skeleton } from '@/components/ui/Skeleton'

interface SnapshotStat {
  label: string
  /** Pre-formatted value, e.g. "12", "78%", or "—". */
  value: string
}

/**
 * Right-rail "Your practice" snapshot — the at-a-glance state of the
 * consultant's book: how many farmers, how many carrying a deficiency, how many
 * gone quiet, and recommendation adherence. Replaces the old KPI strip on the
 * Overview; numbers are mono + tabular per DESIGN.md.
 */
export function PracticeSnapshot({
  activeFarmers,
  withDeficiency,
  quietCount,
  adherencePct,
  isLoading,
  isError
}: {
  activeFarmers: number
  withDeficiency: number
  quietCount: number
  adherencePct: number | null
  isLoading: boolean
  isError: boolean
}) {
  const stats: SnapshotStat[] = [
    { label: 'Active farmers', value: isError ? '—' : String(activeFarmers) },
    { label: 'With deficiency', value: isError ? '—' : String(withDeficiency) },
    { label: 'Gone quiet', value: isError ? '—' : String(quietCount) },
    {
      label: 'Adherence',
      value: isError || adherencePct == null ? '—' : `${Math.round(adherencePct)}%`
    }
  ]

  return (
    <section className="rounded-xl bg-card text-card-foreground shadow-xs ring-1 ring-foreground/10">
      <div className="px-4 pt-4">
        <h2 className="text-sm font-semibold">Your practice</h2>
      </div>
      <div className="grid grid-cols-2 gap-px px-4 pb-4 pt-3">
        {stats.map((stat) => (
          <div key={stat.label} className="py-1">
            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            {isLoading ? (
              <Skeleton className="mt-1 h-6 w-12" />
            ) : (
              <p className="mt-0.5 font-mono text-xl font-semibold tabular-nums tracking-tight">
                {stat.value}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
