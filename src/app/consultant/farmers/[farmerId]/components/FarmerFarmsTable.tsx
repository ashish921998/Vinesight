'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Sprout } from 'lucide-react'
import type { FarmerFarm } from '@/lib/consultant-query-service'

export function FarmerFarmsTable({ farms, farmerId }: { farms: FarmerFarm[]; farmerId: string }) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight mb-4">
        Farms <span className="text-muted-foreground font-normal">({farms.length})</span>
      </h2>

      {farms.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Sprout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No Farms</h3>
            <p className="text-muted-foreground mt-2">This farmer has not added any farms yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {/* Desktop header row - hidden on mobile */}
          <div className="hidden grid-cols-[1.5fr_1fr_1fr_0.75fr_1fr] gap-4 border-b border-border bg-secondary/50 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
            <div className="flex items-center gap-2">
              <Sprout className="h-3.5 w-3.5 text-accent" />
              Farm
            </div>
            <div>Region</div>
            <div>Variety</div>
            <div className="text-right">Area</div>
            <div className="text-right">Soil</div>
          </div>
          {/* Rows */}
          <div className="divide-y divide-border">
            {farms.map((farm) => (
              <Link
                key={farm.id}
                href={`/consultant/farmers/${farmerId}/farms/${farm.id}`}
                className="group block transition-colors hover:bg-accent/5 focus-visible:outline-none focus-visible:bg-accent/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
                {/* Desktop: aligned columns */}
                <div className="hidden grid-cols-[1.5fr_1fr_1fr_0.75fr_1fr] gap-4 px-4 py-3.5 sm:grid">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sprout className="h-4 w-4 shrink-0 text-accent" />
                    <h3 className="truncate text-sm font-semibold leading-tight group-hover:text-accent transition-colors">
                      {farm.name}
                    </h3>
                  </div>
                  <div className="text-sm text-foreground self-center truncate">
                    {farm.region || <span className="text-muted-foreground italic">Not set</span>}
                  </div>
                  <div className="text-sm text-foreground self-center truncate">
                    {farm.crop_variety || (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </div>
                  <div className="text-sm text-foreground self-center text-right tabular-nums">
                    {farm.area != null ? (
                      `${farm.area} ac`
                    ) : (
                      <span className="text-muted-foreground italic">-</span>
                    )}
                  </div>
                  <div className="text-sm text-foreground self-center text-right truncate">
                    {farm.soil_texture_class || (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </div>
                </div>
                {/* Mobile: stacked block */}
                <div className="px-4 py-3.5 sm:hidden">
                  <div className="flex items-center gap-2 mb-2">
                    <Sprout className="h-4 w-4 shrink-0 text-accent" />
                    <h3 className="truncate text-base font-semibold leading-tight group-hover:text-accent transition-colors">
                      {farm.name}
                    </h3>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <dt className="text-muted-foreground shrink-0">Region</dt>
                      <dd className="font-medium truncate">
                        {farm.region || (
                          <span className="text-muted-foreground italic font-normal">Not set</span>
                        )}
                      </dd>
                    </div>
                    <div className="flex items-center gap-2">
                      <dt className="text-muted-foreground shrink-0">Variety</dt>
                      <dd className="font-medium truncate">
                        {farm.crop_variety || (
                          <span className="text-muted-foreground italic font-normal">Not set</span>
                        )}
                      </dd>
                    </div>
                    <div className="flex items-center gap-2">
                      <dt className="text-muted-foreground shrink-0">Area</dt>
                      <dd className="font-medium tabular-nums">
                        {farm.area != null ? (
                          `${farm.area} acres`
                        ) : (
                          <span className="text-muted-foreground italic font-normal">-</span>
                        )}
                      </dd>
                    </div>
                    <div className="flex items-center gap-2">
                      <dt className="text-muted-foreground shrink-0">Soil</dt>
                      <dd className="font-medium truncate">
                        {farm.soil_texture_class || (
                          <span className="text-muted-foreground italic font-normal">Not set</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
