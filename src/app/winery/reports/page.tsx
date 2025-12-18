'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { exportTemplates } from '@/constants/winery'
import { Button } from '@/components/ui/button'
import { useMemo, useState } from 'react'
import { WineryService } from '@/lib/winery-service'
import { FileSpreadsheet, Sparkles } from 'lucide-react'

export default function WineryReportsPage() {
  const filenamePrefix = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const handleExport = async (dataset: (typeof exportTemplates)[number]['dataset']) => {
    const seed = await WineryService.getSeedData()
    const rows = buildCsv(dataset, {
      wineLots: seed.wineLots,
      workOrders: seed.workOrders,
      dateFrom,
      dateTo
    })
    const blob = new Blob([rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${dataset}-${filenamePrefix}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Card className="border-rose-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <FileSpreadsheet className="h-5 w-5 text-rose-700" />
            Reports & Exports
          </CardTitle>
          <CardDescription>CSV-ready datasets for compliance workflows.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Date from</label>
              <input
                type="date"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Date to</label>
              <input
                type="date"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          {exportTemplates.map((template) => (
            <div
              key={template.id}
              className="rounded-lg border border-rose-100 bg-white p-3 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold">{template.title}</p>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </div>
              <Button variant="outline" onClick={() => handleExport(template.dataset)}>
                Export CSV
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="border-dashed border-rose-200 bg-rose-50/50">
        <CardContent className="p-4 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-rose-700" />
          <div>
            <p className="font-semibold text-rose-900">Exports only</p>
            <p className="text-sm text-rose-800">
              Regulatory automation stays out of scope per GTM constraints.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const buildCsv = (
  dataset: (typeof exportTemplates)[number]['dataset'],
  data: { wineLots: any[]; workOrders: any[]; dateFrom?: string; dateTo?: string }
) => {
  if (dataset === 'lot_movements') {
    const header = 'wine_lot,container,status,volume_l\n'
    const rows = data.wineLots
      .map(
        (lot) =>
          `${lot.name},${lot.container ? `${lot.container.type} ${lot.container.name}` : 'Unassigned'},${lot.status},${lot.currentVolumeL}`
      )
      .join('\n')
    return header + rows
  }

  if (dataset === 'volume_changes') {
    const header = 'wine_lot,timestamp,volume_l\n'
    const rows = data.wineLots
      .map((lot) => `${lot.name},${new Date().toISOString()},${lot.currentVolumeL}`)
      .join('\n')
    return header + rows
  }

  const header = 'wine_lot,work_orders\n'
  const rows = data.wineLots
    .map((lot) => {
      const tasks = data.workOrders.filter((order) => order.wineLotId === lot.id)
      return `${lot.name},"${tasks.map((task) => task.type).join('; ')}"`
    })
    .join('\n')
  return header + rows
}
