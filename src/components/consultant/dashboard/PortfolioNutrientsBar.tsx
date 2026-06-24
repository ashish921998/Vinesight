'use client'

import { Skeleton } from '@/components/ui/Skeleton'
import type { NutrientStatusRow } from '@/lib/consultant-dashboard-metrics'

const LEGEND: { key: 'deficient' | 'optimal' | 'excess'; label: string; varName: string }[] = [
  { key: 'deficient', label: 'Deficient', varName: '--nutrient-deficient' },
  { key: 'optimal', label: 'Optimal', varName: '--nutrient-optimal' },
  { key: 'excess', label: 'Excess', varName: '--nutrient-excess' }
]

/**
 * Compact, instrument-grade nutrient bar for the right rail. Reuses the
 * `nutrientStatusAcrossFarms` rows; one thin diverging bar per nutrient
 * (deficient amber ↔ optimal green ↔ excess indigo). Color is always paired
 * with the legend label per DESIGN.md ("never color alone").
 */
export function PortfolioNutrientsBar({
  rows,
  isLoading,
  isError
}: {
  rows: NutrientStatusRow[]
  isLoading: boolean
  isError: boolean
}) {
  return (
    <section className="rounded-xl bg-card text-card-foreground shadow-xs ring-1 ring-foreground/10">
      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <h2 className="text-sm font-semibold">Portfolio nutrients</h2>
        <div className="flex items-center gap-2">
          {LEGEND.map((l) => (
            <span
              key={l.key}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
            >
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: `var(${l.varName})` }}
              />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4 pt-3">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Couldn&apos;t load nutrient status.
          </p>
        ) : rows.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No petiole data across your farms yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.key} className="flex items-center gap-2">
                <span
                  className="w-20 shrink-0 truncate text-xs text-muted-foreground"
                  title={row.label}
                >
                  {row.label}
                </span>
                <span
                  className="flex h-2 flex-1 overflow-hidden rounded-full bg-muted"
                  role="img"
                  aria-label={`${row.label}: ${row.deficient} deficient, ${row.optimal} optimal, ${row.excess} excess`}
                >
                  {(['deficient', 'optimal', 'excess'] as const).map((bucket) => {
                    const value = row[bucket]
                    if (value === 0) return null
                    const varName = LEGEND.find((l) => l.key === bucket)!.varName
                    return (
                      <span
                        key={bucket}
                        style={{
                          width: `${(value / row.total) * 100}%`,
                          backgroundColor: `var(${varName})`
                        }}
                      />
                    )
                  })}
                </span>
                <span className="w-6 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                  {row.total}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
