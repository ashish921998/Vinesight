'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { WineryService } from '@/lib/winery-service'
import { type Barrel, type WineLot } from '@/types/winery'
import { PackageOpen, ArrowLeft, Transfer } from 'lucide-react'

interface FillEntry {
  id: string
  timestamp: string
  description: string
}

export default function BarrelDetailPage() {
  const params = useParams()
  const router = useRouter()
  const barrelId = params?.id as string

  const [barrel, setBarrel] = useState<Barrel | null>(null)
  const [wineLots, setWineLots] = useState<WineLot[]>([])
  const [fillHistory, setFillHistory] = useState<FillEntry[]>([])

  useEffect(() => {
    const load = async () => {
      const seed = await WineryService.getSeedData()
      const found = seed.barrels.find((b) => b.id === barrelId) || null
      setBarrel(found)
      setWineLots(seed.wineLots)
      if (found) {
        setFillHistory([
          {
            id: `fill-${Date.now()}`,
            timestamp: new Date().toISOString(),
            description:
              found.fillStatus === 'empty'
                ? 'Barrel empty'
                : `Status ${found.fillStatus} at ${found.sizeL} L`
          }
        ])
      }
    }
    load()
  }, [barrelId])

  const lot = useMemo(
    () => wineLots.find((w) => w.id === barrel?.assignedLotId),
    [wineLots, barrel?.assignedLotId]
  )

  if (!barrel) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <p className="mt-4 text-muted-foreground">Barrel not found.</p>
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
        <Badge
          variant="outline"
          className={barrel.fillStatus === 'empty' ? 'text-emerald-700' : 'text-rose-700'}
        >
          {barrel.fillStatus === 'empty' ? 'Empty' : 'In Use'}
        </Badge>
      </div>

      <Card className="border-rose-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <PackageOpen className="h-5 w-5 text-rose-700" />
            {barrel.name}
          </CardTitle>
          <CardDescription>Barrel details and linked lot.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <InfoTile label="Size" value={`${barrel.sizeL} L`} />
            <InfoTile label="Status" value={barrel.fillStatus} />
          </div>
          <div className="rounded-lg border border-rose-100 bg-white p-3 space-y-1">
            <p className="text-xs text-muted-foreground">Assigned wine lot</p>
            <p className="font-semibold">{lot ? lot.name : 'None'}</p>
            {lot && (
              <Button asChild size="sm" variant="outline">
                <Link href={`/winery/lots/${lot.id}`}>View wine lot</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Transfer className="h-5 w-5 text-blue-700" />
            Fill History
          </CardTitle>
          <CardDescription>Simple fill log.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {fillHistory.length === 0 && (
            <p className="text-sm text-muted-foreground">No history yet.</p>
          )}
          {fillHistory.map((entry) => (
            <div
              key={entry.id}
              className="rounded-md border border-blue-50 bg-white px-3 py-2 space-y-1"
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

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-rose-100 bg-white p-3 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  )
}
