'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { WineryService } from '@/lib/winery-service'
import {
  type WineLot,
  type HarvestLot,
  type FermentationReading,
  type WorkOrder
} from '@/types/winery'
import {
  ArrowLeft,
  Beaker,
  ClipboardList,
  Leaf,
  ArrowLeftRight,
  Thermometer,
  Wine
} from 'lucide-react'
import { cn } from '@/lib/utils'

const lotStatusTone: Record<WineLot['status'], string> = {
  fermenting: 'bg-amber-100 text-amber-900 border-amber-200',
  aging: 'bg-blue-100 text-blue-900 border-blue-200',
  bottled: 'bg-slate-100 text-slate-900 border-slate-200',
  harvested: 'bg-emerald-100 text-emerald-900 border-emerald-200'
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })

const daysBetween = (start?: string, end?: string) => {
  if (!start || !end) return 0
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export default function WineLotDetailPage() {
  const params = useParams()
  const router = useRouter()
  const lotId = params?.id as string

  const [lot, setLot] = useState<WineLot | null>(null)
  const [harvest, setHarvest] = useState<HarvestLot | null>(null)
  const [readings, setReadings] = useState<FermentationReading[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [transferHistory, setTransferHistory] = useState<
    { id: string; timestamp: string; container: string; volume: number }[]
  >([])

  useEffect(() => {
    const load = async () => {
      const seed = await WineryService.getSeedData()
      const wine = seed.wineLots.find((w) => w.id === lotId) || null
      setLot(wine)
      const lotReadings = seed.fermentationReadings
        .filter((r) => r.wineLotId === lotId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      setReadings(lotReadings)
      setWorkOrders(seed.workOrders.filter((w) => w.wineLotId === lotId))

      const foundHarvest = seed.harvestLots.find((h) => h.id === wine?.sourceHarvestLotId) || null
      setHarvest(foundHarvest)

      const transfers: { id: string; timestamp: string; container: string; volume: number }[] = []
      const startStamp =
        lotReadings[0]?.timestamp || foundHarvest?.harvestDate || new Date().toISOString()
      transfers.push({
        id: `start-${lotId}`,
        timestamp: startStamp,
        container: wine?.container ? `${wine.container.type} ${wine.container.name}` : 'Unassigned',
        volume: wine?.currentVolumeL || 0
      })
      setTransferHistory(transfers)
    }
    load()
  }, [lotId])

  const latestReading = useMemo(
    () =>
      readings
        .slice()
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0],
    [readings]
  )

  const daysFermenting = useMemo(() => {
    if (!readings.length && harvest?.harvestDate) {
      return daysBetween(harvest.harvestDate, new Date().toISOString())
    }
    const first = readings[0]
    const last = readings[readings.length - 1]
    return daysBetween(first?.timestamp, last?.timestamp || new Date().toISOString())
  }, [harvest?.harvestDate, readings])

  const upcomingOrders = workOrders.filter((o) => o.status !== 'completed')
  const completedOrders = workOrders.filter((o) => o.status === 'completed')

  if (!lot) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <p className="mt-4 text-muted-foreground">Wine lot not found.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Badge className={cn('border', lotStatusTone[lot.status])}>{lot.status}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/winery/fermentation?action=add&lotId=${lotId}`}>
              + Add Fermentation Reading
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/winery/work-orders?action=create&lotId=${lotId}`}>
              + Create Work Order
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/winery/tanks">Transfer Lot</Link>
          </Button>
        </div>
      </div>

      <Card className="border-rose-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Wine className="h-5 w-5 text-rose-700" />
            {lot.name}
          </CardTitle>
          <CardDescription>Traceability and current container.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <InfoTile label="Code" value={lot.code} />
          <InfoTile
            label="Current container"
            value={lot.container ? `${lot.container.type} ${lot.container.name}` : 'Unassigned'}
          />
          <InfoTile label="Volume" value={`${lot.currentVolumeL} L`} />
          <InfoTile label="Vintage" value={lot.vintage} />
          {harvest && (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3 space-y-1 sm:col-span-2">
              <p className="text-xs uppercase text-emerald-700">Vineyard block</p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-semibold">{harvest.vineyardBlock.name}</p>
                  <p className="text-xs text-muted-foreground">{harvest.harvestDate}</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href="/vineyard/farms">View block</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5 text-blue-700" />
            Fermentation Summary
          </CardTitle>
          <CardDescription>Last reading and time in ferment.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-blue-100 bg-white p-3 space-y-1">
            <p className="text-xs text-muted-foreground">Last reading</p>
            {latestReading ? (
              <>
                <p className="font-semibold">{formatDateTime(latestReading.timestamp)}</p>
                <p className="text-sm text-blue-700 flex items-center gap-2">
                  <Thermometer className="h-4 w-4" />
                  Brix {latestReading.brix ?? '—'} · Temp {latestReading.temperatureC ?? '—'}°C · pH{' '}
                  {latestReading.pH ?? '—'}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No readings yet.</p>
            )}
          </div>
          <div className="rounded-lg border border-blue-100 bg-white p-3 space-y-1">
            <p className="text-xs text-muted-foreground">Days fermenting</p>
            <p className="font-semibold">{daysFermenting} days</p>
            <div className="mt-2 h-2 rounded-full bg-blue-50 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                style={{ width: '70%' }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-amber-700" />
            Work Orders
          </CardTitle>
          <CardDescription>Upcoming and completed tasks.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs uppercase text-amber-700">Upcoming</p>
            {upcomingOrders.length === 0 && (
              <p className="text-sm text-muted-foreground">None scheduled.</p>
            )}
            {upcomingOrders.map((order) => (
              <WorkOrderRow key={order.id} order={order} />
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase text-emerald-700">Completed</p>
            {completedOrders.length === 0 && (
              <p className="text-sm text-muted-foreground">No completed tasks.</p>
            )}
            {completedOrders.map((order) => (
              <WorkOrderRow key={order.id} order={order} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-blue-700" />
            Fermentation Readings
          </CardTitle>
          <CardDescription>Chronological list.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {readings.length === 0 && (
            <p className="text-sm text-muted-foreground">No readings logged.</p>
          )}
          {readings.map((reading) => (
            <div
              key={reading.id}
              className="rounded-md border border-blue-50 bg-white px-3 py-2 space-y-1"
            >
              <p className="font-semibold text-sm">{formatDateTime(reading.timestamp)}</p>
              <p className="text-xs text-muted-foreground">
                Brix {reading.brix ?? '—'} · Temp {reading.temperatureC ?? '—'}°C · pH{' '}
                {reading.pH ?? '—'}
              </p>
              {reading.note && <p className="text-xs text-blue-700">{reading.note}</p>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-rose-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-rose-700" />
            Transfer History
          </CardTitle>
          <CardDescription>Container and volume changes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {transferHistory.length === 0 && (
            <p className="text-sm text-muted-foreground">No transfers recorded.</p>
          )}
          {transferHistory.map((entry) => (
            <div
              key={entry.id}
              className="rounded-md border border-rose-100 bg-white px-3 py-2 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-sm">{entry.container}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(entry.timestamp)}</p>
              </div>
              <Badge variant="outline">{entry.volume} L</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-rose-100 bg-white p-3 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  )
}

function WorkOrderRow({ order }: { order: WorkOrder }) {
  return (
    <div className="rounded-md border border-amber-100 bg-white p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold capitalize">{order.type.replace('_', ' ')}</p>
          <p className="text-xs text-muted-foreground">
            {order.wineLotName} ·{' '}
            {order.containerType ? `${order.containerType} ${order.containerId}` : 'No container'}
          </p>
        </div>
        <Badge
          variant="outline"
          className={order.status === 'completed' ? 'text-emerald-700' : 'text-amber-700'}
        >
          {order.status}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        Due {formatDateTime(order.dueDate)} · {order.assignee}
      </p>
    </div>
  )
}
