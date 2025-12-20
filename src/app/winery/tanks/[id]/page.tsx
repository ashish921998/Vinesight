'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { WineryService } from '@/lib/winery-service'
import { type Tank, type WineLot } from '@/types/winery'
import { Boxes, Transfer, Droplet, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface TransferEntry {
  id: string
  timestamp: string
  description: string
}

export default function TankDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tankId = params?.id as string

  const [tank, setTank] = useState<Tank | null>(null)
  const [wineLots, setWineLots] = useState<WineLot[]>([])
  const [transfers, setTransfers] = useState<TransferEntry[]>([])
  const [selectedLotId, setSelectedLotId] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      const seed = await WineryService.getSeedData()
      const foundTank = seed.tanks.find((t) => t.id === tankId) || null
      setTank(foundTank)
      setWineLots(seed.wineLots)
      setSelectedLotId(foundTank?.assignedLotId || '')
      if (foundTank) {
        const start: TransferEntry = {
          id: `start-${tankId}`,
          timestamp: new Date().toISOString(),
          description: foundTank.assignedLotId
            ? `Assigned to lot ${foundTank.assignedLotId} at ${foundTank.currentVolumeL} L`
            : 'Tank empty'
        }
        setTransfers([start])
      }
    }
    load()
  }, [tankId])

  const assignedLot = useMemo(
    () => wineLots.find((w) => w.id === tank?.assignedLotId),
    [wineLots, tank?.assignedLotId]
  )

  const handleAssign = () => {
    if (!tank) return
    setTank((prev) =>
      prev
        ? {
            ...prev,
            assignedLotId: selectedLotId || undefined,
            status: selectedLotId ? 'in_use' : 'empty'
          }
        : prev
    )
    const lotName = wineLots.find((l) => l.id === selectedLotId)?.name || '—'
    setTransfers((prev) => [
      ...prev,
      {
        id: `assign-${Date.now()}`,
        timestamp: new Date().toISOString(),
        description: selectedLotId ? `Assigned to ${lotName}` : 'Marked empty'
      }
    ])
  }

  const handleMarkEmpty = () => {
    setSelectedLotId('')
    handleAssign()
  }

  const handleTransfer = () => {
    setTransfers((prev) => [
      ...prev,
      {
        id: `transfer-${Date.now()}`,
        timestamp: new Date().toISOString(),
        description: `Transfer initiated from ${tank?.name}`
      }
    ])
  }

  if (!tank) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <p className="mt-4 text-muted-foreground">Tank not found.</p>
      </div>
    )
  }

  const percent = Math.min(100, Math.round((tank.currentVolumeL / tank.capacityL) * 100))

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Badge
          variant="outline"
          className={tank.status === 'empty' ? 'text-emerald-700' : 'text-rose-700'}
        >
          {tank.status === 'empty' ? 'Empty' : 'In Use'}
        </Badge>
      </div>

      <Card className="border-rose-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Boxes className="h-5 w-5 text-rose-700" />
            {tank.name}
          </CardTitle>
          <CardDescription>Tank metadata and assigned lot.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-rose-100 bg-white p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Capacity</p>
              <p className="font-semibold">{tank.capacityL} L</p>
            </div>
            <div className="rounded-lg border border-rose-100 bg-white p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Current volume</p>
              <p className="font-semibold">{tank.currentVolumeL} L</p>
            </div>
            <div className="rounded-lg border border-rose-100 bg-white p-3 space-y-1 sm:col-span-2">
              <p className="text-xs text-muted-foreground">Fill</p>
              <div className="h-2 rounded-full bg-rose-50 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-400 to-rose-600"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-rose-100 bg-white p-3 space-y-2">
            <p className="text-xs text-muted-foreground">Assigned wine lot</p>
            <p className="font-semibold">{assignedLot ? assignedLot.name : 'None'}</p>
            {assignedLot && (
              <Button asChild size="sm" variant="outline">
                <Link href={`/winery/lots/${assignedLot.id}`}>View wine lot</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-blue-700" />
            Actions
          </CardTitle>
          <CardDescription>Assign, transfer, or mark empty.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Assign lot</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedLotId} onValueChange={setSelectedLotId}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Select lot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No lot (empty)</SelectItem>
                  {wineLots.map((lot) => (
                    <SelectItem key={lot.id} value={lot.id}>
                      {lot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAssign}>Assign</Button>
              <Button variant="outline" onClick={handleMarkEmpty}>
                Mark empty
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Transfer lot</p>
            <Button
              variant="secondary"
              onClick={handleTransfer}
              className="flex items-center gap-2"
            >
              <Transfer className="h-4 w-4" />
              Transfer lot
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-rose-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Transfer className="h-5 w-5 text-rose-700" />
            Transfer History
          </CardTitle>
          <CardDescription>Container changes and volume checkpoints.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {transfers.length === 0 && (
            <p className="text-sm text-muted-foreground">No transfers recorded.</p>
          )}
          {transfers.map((entry) => (
            <div
              key={entry.id}
              className="rounded-md border border-rose-100 bg-white px-3 py-2 space-y-1"
            >
              <p className="font-semibold text-sm">{entry.description}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(entry.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
