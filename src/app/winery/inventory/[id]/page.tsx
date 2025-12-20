'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { WineryService } from '@/lib/winery-service'
import { type InventoryItem } from '@/types/winery'
import { Package2, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface StockEntry {
  id: string
  timestamp: string
  delta: number
  note?: string
}

export default function InventoryItemPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [item, setItem] = useState<InventoryItem | null>(null)
  const [history, setHistory] = useState<StockEntry[]>([])
  const [adjustAmount, setAdjustAmount] = useState('')

  useEffect(() => {
    const load = async () => {
      const seed = await WineryService.getSeedData()
      const found = seed.inventory.find((inv) => inv.id === id) || null
      setItem(found)
      if (found) {
        setHistory([
          {
            id: `init-${found.id}`,
            timestamp: new Date().toISOString(),
            delta: found.quantity,
            note: 'Initial stock'
          }
        ])
      }
    }
    load()
  }, [id])

  const threshold = item?.lowStockThreshold ?? item?.reorderLevel
  const isLow = threshold !== undefined && item && item.quantity <= threshold

  const adjust = (delta: number) => {
    if (!item) return
    const nextQuantity = Math.max(0, Math.round((item.quantity + delta) * 100) / 100)
    setItem({ ...item, quantity: nextQuantity })
    setHistory((prev) => [
      ...prev,
      {
        id: `adj-${Date.now()}`,
        timestamp: new Date().toISOString(),
        delta,
        note: 'Manual adjustment'
      }
    ])
  }

  if (!item) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <p className="mt-4 text-muted-foreground">Inventory item not found.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        {isLow && (
          <Badge className="bg-rose-100 text-rose-900 border-rose-200" variant="outline">
            Low stock
          </Badge>
        )}
      </div>

      <Card className="border-rose-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Package2 className="h-5 w-5 text-rose-700" />
            {item.name}
          </CardTitle>
          <CardDescription>Manual adjustments only.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {item.category} · {item.quantity} {item.unit}
          </p>
          {threshold !== undefined && (
            <p className="text-xs text-rose-700">Low-stock threshold: {threshold}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <Input
              type="number"
              inputMode="decimal"
              placeholder="Adjust amount"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
            />
            <Button
              onClick={() => adjust(Number(adjustAmount) || 0)}
              disabled={!adjustAmount}
              className="sm:w-40"
            >
              Adjust stock
            </Button>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => adjust(1)}>
              +1
            </Button>
            <Button size="sm" variant="outline" onClick={() => adjust(-1)}>
              -1
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle>Stock History</CardTitle>
          <CardDescription>Manual adjustments only.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {history.length === 0 && (
            <p className="text-sm text-muted-foreground">No stock history yet.</p>
          )}
          {history.map((entry) => (
            <div
              key={entry.id}
              className="rounded-md border border-blue-50 bg-white px-3 py-2 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-sm">
                  {entry.delta > 0 ? '+' : ''}
                  {entry.delta}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleString()}
                </p>
                {entry.note && <p className="text-xs text-blue-700">{entry.note}</p>}
              </div>
              <Badge variant="outline">{entry.delta > 0 ? 'Added' : 'Removed'}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-rose-100">
        <CardHeader>
          <CardTitle>Linked Work Orders</CardTitle>
          <CardDescription>Reference only; no vendor logic.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Coming soon: link to work order usage.</p>
        </CardContent>
      </Card>
    </div>
  )
}
