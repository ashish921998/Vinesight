'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WineryService } from '@/lib/winery-service'
import { type InventoryItem } from '@/types/winery'
import { Package2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])

  useEffect(() => {
    const load = async () => {
      const seed = await WineryService.getSeedData()
      setInventory(seed.inventory)
    }
    load()
  }, [])

  const adjust = (id: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(0, Math.round((item.quantity + delta) * 100) / 100) }
          : item
      )
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <Card className="border-rose-100">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Package2 className="h-5 w-5 text-rose-700" />
              Inventory
            </CardTitle>
            <CardDescription>Low-friction stock adjustments.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {inventory.map((item) => {
            const threshold = item.lowStockThreshold ?? item.reorderLevel
            const isLow = threshold !== undefined && item.quantity <= threshold
            return (
              <Link
                href={`/winery/inventory/${item.id}`}
                key={item.id}
                className="rounded-lg border border-rose-100 bg-white p-3 flex items-center justify-between hover:bg-rose-50 transition"
              >
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.category} · {item.quantity} {item.unit}
                  </p>
                  {threshold !== undefined && (
                    <p className="text-xs text-rose-700">Low-stock threshold: {threshold}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isLow && (
                    <Badge className="bg-rose-100 text-rose-900 border-rose-200 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Low
                    </Badge>
                  )}
                  <ArrowIndicator />
                </div>
              </Link>
            )
          })}
          {inventory.length === 0 && (
            <p className="text-sm text-muted-foreground">No inventory items yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ArrowIndicator() {
  return <span className="h-2 w-2 rounded-full bg-rose-300" aria-hidden />
}
