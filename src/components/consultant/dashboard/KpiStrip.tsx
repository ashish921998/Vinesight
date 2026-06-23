'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/Skeleton'

export interface KpiTile {
  label: string
  /** Pre-formatted primary value, e.g. "12", "2.4 d", "78%", or "—". */
  value: string
  sub?: string
  loading?: boolean
}

/**
 * The always-visible metric row. KPIs are meaningful at N=1, so they render
 * even when the charts below are gated for low data. Numbers are mono +
 * tabular-nums per DESIGN.md.
 */
export function KpiStrip({ tiles }: { tiles: KpiTile[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((tile) => (
        <Card key={tile.label}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{tile.label}</p>
            {tile.loading ? (
              <Skeleton className="mt-2 h-8 w-20" />
            ) : (
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight">
                {tile.value}
              </p>
            )}
            {tile.sub && !tile.loading && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">{tile.sub}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
