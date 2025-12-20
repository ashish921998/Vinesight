'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { WineryService } from '@/lib/winery-service'
import { type WineLot, type FermentationReading } from '@/types/winery'

export default function NewFermentationReadingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [wineLots, setWineLots] = useState<WineLot[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const seed = await WineryService.getSeedData()
      setWineLots(seed.wineLots)
      const lotId = searchParams?.get('lotId')
      setForm((prev) => ({
        ...prev,
        wineLotId:
          lotId && seed.wineLots.some((l) => l.id === lotId) ? lotId : seed.wineLots[0]?.id || ''
      }))
    }
    load()
  }, [searchParams])

  const [form, setForm] = useState({
    wineLotId: '',
    brix: '',
    temperatureC: '',
    pH: '',
    recordedAt: new Date().toISOString().slice(0, 16)
  })

  const selectedLotName = useMemo(
    () => wineLots.find((lot) => lot.id === form.wineLotId)?.name || 'Wine lot',
    [wineLots, form.wineLotId]
  )

  const handleSave = async (andStay: boolean) => {
    if (!form.wineLotId) {
      setMessage('Please select a wine lot.')
      return
    }
    setSaving(true)
    setMessage(null)
    const reading: FermentationReading = {
      id: `FR-${Date.now()}`,
      wineLotId: form.wineLotId,
      brix: form.brix ? Number(form.brix) : undefined,
      temperatureC: form.temperatureC ? Number(form.temperatureC) : undefined,
      pH: form.pH ? Number(form.pH) : undefined,
      timestamp: form.recordedAt
        ? new Date(form.recordedAt).toISOString()
        : new Date().toISOString()
    }
    WineryService.addFermentationReading(reading)
    setSaving(false)
    if (andStay) {
      setMessage('Saved. Add another reading.')
      setForm((prev) => ({
        ...prev,
        brix: '',
        temperatureC: '',
        pH: '',
        recordedAt: new Date().toISOString().slice(0, 16)
      }))
      return
    }
    router.push(`/winery/lots/${form.wineLotId}`)
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">New Fermentation Reading</CardTitle>
          <p className="text-sm text-muted-foreground">
            Fast entry for cellar teams. No charts here.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="wineLot">Wine lot</Label>
            <select
              id="wineLot"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.wineLotId}
              onChange={(e) => setForm((prev) => ({ ...prev, wineLotId: e.target.value }))}
            >
              {wineLots.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="brix">Brix / SG</Label>
              <Input
                id="brix"
                value={form.brix}
                onChange={(e) => setForm((prev) => ({ ...prev, brix: e.target.value }))}
                inputMode="decimal"
                placeholder="14.2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temp">Temperature (°C)</Label>
              <Input
                id="temp"
                value={form.temperatureC}
                onChange={(e) => setForm((prev) => ({ ...prev, temperatureC: e.target.value }))}
                inputMode="decimal"
                placeholder="22.4"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ph">pH</Label>
              <Input
                id="ph"
                value={form.pH}
                onChange={(e) => setForm((prev) => ({ ...prev, pH: e.target.value }))}
                inputMode="decimal"
                placeholder="3.45"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recordedAt">Recorded at</Label>
              <Input
                id="recordedAt"
                type="datetime-local"
                value={form.recordedAt}
                onChange={(e) => setForm((prev) => ({ ...prev, recordedAt: e.target.value }))}
              />
            </div>
          </div>
          {message && <p className="text-sm text-emerald-700">{message}</p>}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Button
              className="w-full sm:w-auto"
              disabled={saving || !form.wineLotId}
              onClick={() => handleSave(false)}
            >
              {saving ? 'Saving...' : 'Save Reading'}
            </Button>
            <Button
              className="w-full sm:w-auto"
              variant="outline"
              disabled={saving || !form.wineLotId}
              onClick={() => handleSave(true)}
            >
              Save & Add Another
            </Button>
            <Button
              className="w-full sm:w-auto"
              variant="ghost"
              onClick={() => router.push(`/winery/lots/${form.wineLotId || ''}`)}
            >
              Cancel
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Logging for: <span className="font-semibold text-foreground">{selectedLotName}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
