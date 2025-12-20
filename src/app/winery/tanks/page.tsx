'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WineryService } from '@/lib/winery-service'
import { type Tank, type WineLot } from '@/types/winery'
import { Boxes } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function TanksPage() {
  const [tanks, setTanks] = useState<Tank[]>([])
  const [wineLots, setWineLots] = useState<WineLot[]>([])

  useEffect(() => {
    const load = async () => {
      const seed = await WineryService.getSeedData()
      setTanks(seed.tanks)
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
              <Boxes className="h-5 w-5 text-rose-700" />
              Tanks
            </CardTitle>
            <CardDescription>Capacity, fill state, and assigned lot.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/winery/work-orders?action=create">Create work order</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {tanks.map((tank) => {
            const lot = wineLots.find((w) => w.id === tank.assignedLotId)
            const percent = Math.min(100, Math.round((tank.currentVolumeL / tank.capacityL) * 100))
            return (
              <Link
                href={`/winery/tanks/${tank.id}`}
                key={tank.id}
                className="rounded-lg border border-rose-100 bg-white p-3 space-y-3 block hover:bg-rose-50 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{tank.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Capacity {tank.capacityL} L · Current {tank.currentVolumeL} L
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Assigned lot: {lot ? lot.name : '—'}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={tank.status === 'empty' ? 'text-emerald-700' : 'text-rose-700'}
                  >
                    {tank.status === 'empty' ? 'Empty' : 'In Use'}
                  </Badge>
                </div>
                <div className="h-2 rounded-full bg-rose-50 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-400 to-rose-600"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </Link>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
