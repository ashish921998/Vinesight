'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WineryService } from '@/lib/winery-service'
import { type WineLot, type HarvestLot } from '@/types/winery'
import { Button } from '@/components/ui/button'
import { ArrowRight, Leaf, Wine } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const lotStatusTone: Record<WineLot['status'], string> = {
  fermenting: 'bg-amber-100 text-amber-900 border-amber-200',
  aging: 'bg-blue-100 text-blue-900 border-blue-200',
  bottled: 'bg-slate-100 text-slate-900 border-slate-200',
  harvested: 'bg-emerald-100 text-emerald-900 border-emerald-200'
}

export default function WineLotsPage() {
  const [wineLots, setWineLots] = useState<WineLot[]>([])
  const [harvestLots, setHarvestLots] = useState<HarvestLot[]>([])

  useEffect(() => {
    const load = async () => {
      const seed = await WineryService.getSeedData()
      setWineLots(seed.wineLots)
      setHarvestLots(seed.harvestLots)
    }
    load()
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <Card className="border-rose-100">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Wine className="h-5 w-5 text-rose-700" />
              Wine Lots
            </CardTitle>
            <CardDescription>
              Mobile-first list with status, container, and variety.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/vineyard/farms">Convert harvest → wine lot</Link>
            </Button>
            <Button asChild>
              <Link href="/winery/lots/new">+ New Wine Lot</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {wineLots.map((lot) => {
            const harvest = harvestLots.find((h) => h.id === lot.sourceHarvestLotId)
            const variety = harvest?.variety || harvest?.vineyardBlock.variety || '—'
            const containerLabel = lot.container
              ? `${lot.container.type} ${lot.container.name}`
              : 'No container assigned'
            return (
              <Link
                href={`/winery/lots/${lot.id}`}
                key={lot.id}
                className="rounded-lg border border-rose-100 bg-white p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-rose-50 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{lot.name}</p>
                    <Badge className={cn('border', lotStatusTone[lot.status])}>{lot.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {variety} · {lot.currentVolumeL} L · {containerLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Code {lot.code} · Vintage {lot.vintage}
                  </p>
                  {harvest && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Leaf className="h-3 w-3" />
                      {harvest.vineyardBlock.name} · {harvest.harvestDate}
                    </p>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground sm:ml-2" />
              </Link>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
