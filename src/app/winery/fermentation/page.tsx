'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WineryService } from '@/lib/winery-service'
import { type FermentationReading, type WineLot } from '@/types/winery'
import { FlaskConical, Thermometer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function FermentationPage() {
  const searchParams = useSearchParams()
  const [readings, setReadings] = useState<FermentationReading[]>([])
  const [lots, setLots] = useState<WineLot[]>([])
  const [form, setForm] = useState({ wineLotId: '', brix: '', temperatureC: '', pH: '', note: '' })

  useEffect(() => {
    const load = async () => {
      const seed = await WineryService.getSeedData()
      setReadings(seed.fermentationReadings)
      setLots(seed.wineLots)

      const lotId = searchParams?.get('lotId')
      const targetLot =
        lotId && seed.wineLots.some((lot) => lot.id === lotId) ? lotId : seed.wineLots[0]?.id
      setForm((prev) => ({ ...prev, wineLotId: targetLot || '' }))
    }
    load()
  }, [searchParams])

  const sorted = readings
    .slice()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const handleSubmit = () => {
    if (!form.wineLotId) return
    const entry: FermentationReading = {
      id: `FR-${Date.now()}`,
      wineLotId: form.wineLotId,
      brix: form.brix ? Number(form.brix) : undefined,
      temperatureC: form.temperatureC ? Number(form.temperatureC) : undefined,
      pH: form.pH ? Number(form.pH) : undefined,
      note: form.note || undefined,
      timestamp: new Date().toISOString()
    }
    setReadings((prev) => [entry, ...prev])
    setForm((prev) => ({ ...prev, brix: '', temperatureC: '', pH: '', note: '' }))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <Card className="border-rose-100">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <FlaskConical className="h-5 w-5 text-rose-700" />
              Fermentation Readings
            </CardTitle>
            <CardDescription>Most recent manual entries by lot.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-rose-100 bg-rose-50/50 p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Lot</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.wineLotId}
                  onChange={(e) => setForm((prev) => ({ ...prev, wineLotId: e.target.value }))}
                >
                  {lots.map((lot) => (
                    <option key={lot.id} value={lot.id}>
                      {lot.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Brix / SG</Label>
                <Input
                  value={form.brix}
                  onChange={(e) => setForm((prev) => ({ ...prev, brix: e.target.value }))}
                  placeholder="14.2"
                />
              </div>
              <div className="space-y-2">
                <Label>Temperature (°C)</Label>
                <Input
                  value={form.temperatureC}
                  onChange={(e) => setForm((prev) => ({ ...prev, temperatureC: e.target.value }))}
                  placeholder="22.4"
                />
              </div>
              <div className="space-y-2">
                <Label>pH</Label>
                <Input
                  value={form.pH}
                  onChange={(e) => setForm((prev) => ({ ...prev, pH: e.target.value }))}
                  placeholder="3.45"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                value={form.note}
                onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Any cap, aroma, or actions?"
              />
            </div>
            <Button onClick={handleSubmit} disabled={!form.wineLotId}>
              Log reading
            </Button>
          </div>
          {sorted.map((reading) => {
            const lot = lots.find((l) => l.id === reading.wineLotId)
            return (
              <div
                key={reading.id}
                className="rounded-lg border border-rose-100 bg-white p-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold">{lot?.name ?? reading.wineLotId}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(reading.timestamp).toLocaleString()}
                  </p>
                  <p className="text-xs text-rose-700 flex items-center gap-2">
                    <Thermometer className="h-4 w-4" />
                    Brix {reading.brix ?? '—'} · Temp {reading.temperatureC ?? '—'}°C · pH{' '}
                    {reading.pH ?? '—'}
                  </p>
                </div>
                {reading.note && <Badge variant="outline">{reading.note}</Badge>}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
