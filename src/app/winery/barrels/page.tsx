'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WineryService } from '@/lib/winery-service'
import { type Barrel, type WineLot } from '@/types/winery'
import { PackageOpen, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function BarrelsPage() {
  const [barrels, setBarrels] = useState<Barrel[]>([])
  const [wineLots, setWineLots] = useState<WineLot[]>([])

  useEffect(() => {
    const load = async () => {
      const seed = await WineryService.getSeedData()
      setBarrels(seed.barrels)
      setWineLots(seed.wineLots)
    }
    load()
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <Card className="border-rose-100">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <PackageOpen className="h-5 w-5 text-rose-700" />
              Barrels
            </CardTitle>
            <CardDescription>Fill status and lot assignment per barrel.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/winery/lots">Assign lot</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {barrels.map((barrel) => {
            const lot = wineLots.find((w) => w.id === barrel.assignedLotId)
            return (
              <Link
                href={`/winery/barrels/${barrel.id}`}
                key={barrel.id}
                className="rounded-lg border border-rose-100 bg-white p-3 flex items-center justify-between hover:bg-rose-50 transition"
              >
                <div>
                  <p className="font-semibold">{barrel.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Size {barrel.sizeL} L · {barrel.fillStatus}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Assigned lot: {lot ? lot.name : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      barrel.fillStatus === 'empty' ? 'text-emerald-700' : 'text-rose-700'
                    )}
                  >
                    {barrel.fillStatus === 'empty' ? 'Empty' : 'In Use'}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            )
          })}
          {barrels.length === 0 && (
            <p className="text-sm text-muted-foreground">No barrels recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
