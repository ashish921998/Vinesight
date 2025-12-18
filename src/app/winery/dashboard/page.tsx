'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { WineryService } from '@/lib/winery-service'
import {
  type FermentationReading,
  type InventoryItem,
  type Tank,
  type WineLot,
  type WorkOrder
} from '@/types/winery'
import {
  AlertTriangle,
  Beaker,
  ClipboardList,
  Droplet,
  Timer,
  Wine,
  CheckCircle2
} from 'lucide-react'

const isToday = (dateIso: string) => {
  const date = new Date(dateIso)
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

const hoursSince = (iso?: string) => {
  if (!iso) return Infinity
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60)
}

export default function WinerySummaryDashboard() {
  const [wineLots, setWineLots] = useState<WineLot[]>([])
  const [fermentationReadings, setFermentationReadings] = useState<FermentationReading[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [tanks, setTanks] = useState<Tank[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const seed = await WineryService.getSeedData()
      setWineLots(seed.wineLots)
      setFermentationReadings(seed.fermentationReadings)
      setWorkOrders(seed.workOrders)
      setTanks(seed.tanks)
      setInventory(seed.inventory)
      setLoading(false)
    }
    load()
  }, [])

  const activeFermentations = wineLots.filter((lot) => lot.status === 'fermenting')

  const fermentationMeta = useMemo(() => {
    return activeFermentations.map((lot) => {
      const readingsForLot = fermentationReadings
        .filter((reading) => reading.wineLotId === lot.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      const lastReading = readingsForLot[0]
      const firstReading = readingsForLot[readingsForLot.length - 1]
      const daysFermenting = firstReading
        ? Math.max(
            0,
            Math.floor(
              (Date.now() - new Date(firstReading.timestamp).getTime()) / (1000 * 60 * 60 * 24)
            )
          )
        : 0
      return { lot, lastReading, daysFermenting }
    })
  }, [activeFermentations, fermentationReadings])

  const todaysOrders = workOrders.filter((order) => isToday(order.dueDate))

  const tankSummary = useMemo(() => {
    const total = tanks.length
    const occupied = tanks.filter((tank) => tank.status === 'in_use').length
    const free = Math.max(0, total - occupied)
    return { total, occupied, free }
  }, [tanks])

  const alerts = useMemo(() => {
    const items: { id: string; message: string }[] = []
    fermentationMeta.forEach(({ lot, lastReading }) => {
      if (!lastReading || hoursSince(lastReading.timestamp) > 24) {
        items.push({
          id: `missing-${lot.id}`,
          message: `${lot.name}: no fermentation reading in last 24h`
        })
      }
    })
    inventory.forEach((item) => {
      const threshold = item.lowStockThreshold ?? item.reorderLevel
      if (threshold !== undefined && item.quantity <= threshold) {
        items.push({
          id: `low-${item.id}`,
          message: `Low stock: ${item.name} (${item.quantity} ${item.unit})`
        })
      }
    })
    return items
  }, [fermentationMeta, inventory])

  const primaryCta =
    fermentationMeta.length > 0
      ? {
          label: '+ Add Fermentation Reading',
          href: `/winery/fermentation?action=add&lotId=${fermentationMeta[0]?.lot.id ?? ''}`
        }
      : { label: '+ Create Work Order', href: '/winery/work-orders?action=create' }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading winery dashboard...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Winery Mode</p>
          <h1 className="text-2xl font-semibold">Winery Dashboard</h1>
          <p className="text-sm text-muted-foreground">Read-only snapshot for cellar crews.</p>
        </div>
        <Button asChild>
          <Link href={primaryCta.href}>{primaryCta.label}</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Beaker className="h-5 w-5 text-rose-700" />
              Active Fermentations
            </CardTitle>
            <CardDescription>Lot, tank, days, and last Brix.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {fermentationMeta.length === 0 && (
              <p className="text-sm text-muted-foreground">No active fermentations.</p>
            )}
            {fermentationMeta.map(({ lot, lastReading, daysFermenting }) => (
              <div key={lot.id} className="rounded-md border border-rose-100 bg-white p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{lot.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {lot.container
                        ? `${lot.container.type} ${lot.container.name}`
                        : 'No tank assigned'}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-rose-700">
                    {daysFermenting}d fermenting
                  </Badge>
                </div>
                <p className="text-xs text-rose-700 mt-1">
                  Last Brix: {lastReading?.brix ?? '—'} · Temp: {lastReading?.temperatureC ?? '—'}°C
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-amber-700" />
              Today&apos;s Work Orders
            </CardTitle>
            <CardDescription>Tasks due today with quick status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaysOrders.length === 0 && (
              <p className="text-sm text-muted-foreground">No work orders scheduled today.</p>
            )}
            {todaysOrders.map((order) => (
              <div key={order.id} className="rounded-md border border-amber-100 bg-white p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold capitalize">{order.type.replace('_', ' ')}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.wineLotName} ·{' '}
                      {order.containerType
                        ? `${order.containerType} ${order.containerId}`
                        : 'No container'}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-amber-700">
                    {order.status}
                  </Badge>
                </div>
                {order.status !== 'completed' && (
                  <Button size="sm" variant="outline" className="mt-2">
                    Mark Done
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplet className="h-5 w-5 text-blue-700" />
              Tank Availability
            </CardTitle>
            <CardDescription>Total vs free capacity.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
              <p className="text-sm text-blue-800">Total</p>
              <p className="text-2xl font-semibold text-blue-900">{tankSummary.total}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3 flex-1">
              <div className="flex items-center justify-between text-sm text-emerald-800">
                <span>Free</span>
                <span className="font-semibold">{tankSummary.free}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-amber-800 mt-1">
                <span>Occupied</span>
                <span className="font-semibold">{tankSummary.occupied}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-700" />
              Alerts
            </CardTitle>
            <CardDescription>Readings and inventory warnings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.length === 0 && (
              <p className="text-sm text-muted-foreground">No alerts right now.</p>
            )}
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-md border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-900 flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>{alert.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
