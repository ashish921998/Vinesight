'use client'

import { useMemo } from 'react'
import { Sprout, IndianRupee, MapPin, CheckCircle2, CircleAlert } from 'lucide-react'
import type { FarmerFarm } from '@/lib/consultant-query-service'

export function FarmerSummaryStrip({ farms, isPaid }: { farms: FarmerFarm[]; isPaid: boolean }) {
  // Aggregate unique regions for the Region metric.
  const regions = useMemo(() => {
    const set = new Set<string>()
    farms.forEach((f) => {
      if (f.region) set.add(f.region)
    })
    return Array.from(set)
  }, [farms])

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Sprout className="h-3.5 w-3.5 text-accent" />
          Farms
        </div>
        <p className="mt-1 font-mono text-2xl font-bold tabular-nums">{farms.length}</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <IndianRupee className="h-3.5 w-3.5 text-accent" />
          Payment
        </div>
        <p
          className="mt-1 flex items-center gap-1 text-sm font-semibold"
          style={{ color: isPaid ? 'var(--nutrient-optimal)' : 'var(--nutrient-deficient)' }}
        >
          {isPaid ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <CircleAlert className="h-3.5 w-3.5" />
          )}
          {isPaid ? 'Paid' : 'Unpaid'}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-4 col-span-2 sm:col-span-1">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-accent" />
          Region
        </div>
        <p className="mt-1 text-sm font-semibold">
          {regions.length === 0 ? (
            <span className="text-muted-foreground italic font-normal">Not set</span>
          ) : regions.length === 1 ? (
            regions[0]
          ) : (
            `${regions.length} regions`
          )}
        </p>
      </div>
    </div>
  )
}
