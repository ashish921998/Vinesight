'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  ArrowUpRight,
  Beaker,
  Boxes,
  ClipboardList,
  CloudRain,
  Factory,
  FlaskConical,
  Leaf,
  RefreshCw,
  Rows3,
  Sparkles,
  TestTube,
  Thermometer,
  WineOff,
  Wine
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { WineryService } from '@/lib/winery-service'
import { exportTemplates } from '@/constants/winery'
import { useAppMode } from '@/hooks/useAppMode'
import {
  type Barrel,
  type FermentationAlert,
  type FermentationReading,
  type HarvestLot,
  type InventoryItem,
  type ExportTemplate,
  type LotStatus,
  type Tank,
  type WineLot,
  type WorkOrder,
  type WorkOrderStatus,
  type WorkOrderType
} from '@/types/winery'
import { cn } from '@/lib/utils'

type ContainerType = 'tank' | 'barrel'

const lotStatusCopy: Record<LotStatus, string> = {
  harvested: 'Harvested',
  fermenting: 'Fermenting',
  aging: 'Aging',
  bottled: 'Bottled'
}

const statusTone: Record<LotStatus, string> = {
  harvested: 'bg-amber-100 text-amber-800 border-amber-200',
  fermenting: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  aging: 'bg-blue-100 text-blue-800 border-blue-200',
  bottled: 'bg-slate-100 text-slate-800 border-slate-200'
}

const workOrderLabels: Record<WorkOrderType, string> = {
  crush: 'Crush',
  punch_down: 'Punch down',
  pump_over: 'Pump over',
  racking: 'Racking',
  so2_addition: 'SO2 addition',
  blending: 'Blending',
  bottling: 'Bottling'
}

const workOrderIcons: Record<WorkOrderType, JSX.Element> = {
  crush: <Factory className="h-4 w-4" />,
  punch_down: <TestTube className="h-4 w-4" />,
  pump_over: <RefreshCw className="h-4 w-4" />,
  racking: <Rows3 className="h-4 w-4" />,
  so2_addition: <CloudRain className="h-4 w-4" />,
  blending: <Beaker className="h-4 w-4" />,
  bottling: <Wine className="h-4 w-4" />
}

const formatDate = (value: string | undefined) => {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(value)
  )
}

const formatDateTime = (value: string | undefined) => {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value))
}

const formatNumber = (value: number, unit?: string) => {
  return `${value.toLocaleString('en-US')} ${unit ?? ''}`.trim()
}

const percentFill = (current: number, capacity: number) => {
  if (!capacity) return 0
  return Math.min(100, Math.round((current / capacity) * 100))
}

const getTimeAgo = (timestamp?: string) => {
  if (!timestamp) return '—'
  const diffMs = Date.now() - new Date(timestamp).getTime()
  const hours = Math.round(diffMs / (1000 * 60 * 60))
  if (hours < 1) return 'just now'
  if (hours < 48) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export function WineryDashboard() {
  const searchParams = useSearchParams()
  const { setMode } = useAppMode()
  const [loading, setLoading] = useState(true)
  const [harvestLots, setHarvestLots] = useState<HarvestLot[]>([])
  const [wineLots, setWineLots] = useState<WineLot[]>([])
  const [tanks, setTanks] = useState<Tank[]>([])
  const [barrels, setBarrels] = useState<Barrel[]>([])
  const [fermentationReadings, setFermentationReadings] = useState<FermentationReading[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [initialWorkOrderLot, setInitialWorkOrderLot] = useState<string | undefined>(undefined)
  const [initialFermentationLot, setInitialFermentationLot] = useState<string | undefined>(
    undefined
  )

  useEffect(() => {
    const load = async () => {
      const seed = await WineryService.getSeedData()
      setHarvestLots(seed.harvestLots)
      setWineLots(seed.wineLots)
      setTanks(seed.tanks)
      setBarrels(seed.barrels)
      setFermentationReadings(seed.fermentationReadings)
      setWorkOrders(seed.workOrders)
      setInventory(seed.inventory)
      setLoading(false)
    }
    load()
  }, [])

  const fermentationAlerts = useMemo(
    () => buildFermentationAlerts(wineLots, fermentationReadings),
    [wineLots, fermentationReadings]
  )

  useEffect(() => {
    setMode('winery')
  }, [setMode])

  useEffect(() => {
    if (loading) return
    const action = searchParams?.get('action')
    const actionLotId = searchParams?.get('lotId')

    const resolveLot = () => {
      if (actionLotId && wineLots.some((lot) => lot.id === actionLotId)) return actionLotId
      return wineLots.find((lot) => lot.status === 'fermenting')?.id || wineLots[0]?.id
    }

    const scrollTo = (id: string) => {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    if (action === 'create-work-order') {
      setInitialWorkOrderLot(resolveLot())
      scrollTo('work-orders')
    }
    if (action === 'add-reading') {
      setInitialFermentationLot(resolveLot())
      scrollTo('fermentation')
    }
    if (action === 'adjust-inventory') {
      scrollTo('inventory')
    }
    if (action === 'create-harvest' || action === 'assign-capacity') {
      scrollTo('harvest')
    }
  }, [loading, searchParams, wineLots])

  const summary = useMemo(() => {
    const activeFermentations = wineLots.filter((lot) => lot.status === 'fermenting').length
    const availableTanks = tanks.filter((tank) => tank.status === 'empty').length
    const openWorkOrders = workOrders.filter((order) => order.status === 'pending')
    const dueToday = openWorkOrders.filter((order) => isDueToday(order.dueDate)).length
    const lowStock = inventory.filter(
      (item) => item.reorderLevel !== undefined && item.quantity <= item.reorderLevel
    )

    return {
      activeFermentations,
      availableTanks,
      dueToday,
      lowStockCount: lowStock.length
    }
  }, [inventory, tanks, wineLots, workOrders])

  const handleCreateHarvestLot = (
    payload: Omit<HarvestLot, 'id' | 'status' | 'linkedWineLotId'>
  ) => {
    const newLot: HarvestLot = {
      ...payload,
      id: `HL-${Date.now()}`,
      status: 'harvested'
    }
    setHarvestLots((prev) => [newLot, ...prev])
  }

  const handleConvertHarvestLot = (lotId: string) => {
    const lot = harvestLots.find((item) => item.id === lotId)
    if (!lot) return

    const code = `${new Date(lot.harvestDate).getFullYear().toString().slice(-2)}${lot.variety
      .split(' ')
      .map((word) => word[0]?.toUpperCase())
      .join('')}-${Math.floor(Math.random() * 90 + 10)}`

    const newWineLot: WineLot = {
      id: `WL-${Date.now()}`,
      code,
      vintage: new Date(lot.harvestDate).getFullYear().toString(),
      sourceHarvestLotId: lot.id,
      name: `${lot.vineyardBlock.name} ${lot.variety}`,
      status: 'fermenting',
      currentVolumeL: lot.initialVolumeL || lot.weightKg * 0.75
    }

    setWineLots((prev) => [newWineLot, ...prev])
    setHarvestLots((prev) =>
      prev.map((item) =>
        item.id === lotId ? { ...item, status: 'fermenting', linkedWineLotId: newWineLot.id } : item
      )
    )
  }

  const handleAssignContainer = (
    lotId: string,
    containerType: ContainerType,
    containerId: string
  ) => {
    if (!lotId) {
      if (containerType === 'tank') {
        setTanks((prev) =>
          prev.map((tank) =>
            tank.id === containerId
              ? { ...tank, assignedLotId: undefined, status: 'empty', currentVolumeL: 0 }
              : tank
          )
        )
      } else {
        setBarrels((prev) =>
          prev.map((barrel) =>
            barrel.id === containerId
              ? { ...barrel, assignedLotId: undefined, fillStatus: 'empty' }
              : barrel
          )
        )
      }
      setWineLots((prev) =>
        prev.map((lot) =>
          lot.container?.id === containerId && lot.container?.type === containerType
            ? { ...lot, container: undefined }
            : lot
        )
      )
      return
    }

    const lot = wineLots.find((item) => item.id === lotId)
    if (!lot) return

    // Clear any previous container linked to this lot
    setTanks((prev) =>
      prev.map((tank) =>
        tank.assignedLotId === lotId
          ? { ...tank, assignedLotId: undefined, status: 'empty', currentVolumeL: 0 }
          : tank
      )
    )
    setBarrels((prev) =>
      prev.map((barrel) =>
        barrel.assignedLotId === lotId
          ? { ...barrel, assignedLotId: undefined, fillStatus: 'empty' }
          : barrel
      )
    )

    // Clear container reference from any other lot using it
    setWineLots((prev) =>
      prev.map((item) =>
        item.container?.id === containerId && item.container?.type === containerType
          ? { ...item, container: undefined }
          : item
      )
    )

    if (containerType === 'tank') {
      const containerName = tanks.find((tank) => tank.id === containerId)?.name || containerId
      setTanks((prev) =>
        prev.map((tank) =>
          tank.id === containerId
            ? {
                ...tank,
                assignedLotId: lotId,
                status: 'in_use',
                currentVolumeL: lot.currentVolumeL
              }
            : tank
        )
      )
      setWineLots((prev) =>
        prev.map((item) =>
          item.id === lotId
            ? { ...item, container: { type: 'tank', id: containerId, name: containerName } }
            : item
        )
      )
    } else {
      const containerName = barrels.find((barrel) => barrel.id === containerId)?.name || containerId
      setBarrels((prev) =>
        prev.map((barrel) =>
          barrel.id === containerId
            ? { ...barrel, assignedLotId: lotId, fillStatus: 'full' }
            : barrel
        )
      )
      setWineLots((prev) =>
        prev.map((item) =>
          item.id === lotId
            ? { ...item, container: { type: 'barrel', id: containerId, name: containerName } }
            : item
        )
      )
    }
  }

  const handleAddReading = (reading: Omit<FermentationReading, 'id'>) => {
    const record: FermentationReading = { ...reading, id: `FR-${Date.now()}` }
    setFermentationReadings((prev) => [record, ...prev])
  }

  const handleWorkOrderStatus = (id: string, status: WorkOrderStatus) => {
    setWorkOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status } : order)))
    if (status === 'completed') {
      applyInventoryImpact(id)
    }
  }

  const handleCreateWorkOrder = (payload: Omit<WorkOrder, 'id' | 'status'>) => {
    const newOrder: WorkOrder = {
      ...payload,
      id: `WO-${Date.now()}`,
      status: 'pending'
    }
    setWorkOrders((prev) => [newOrder, ...prev])
  }

  const handleAdjustInventory = (id: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(0, Math.round((item.quantity + delta) * 100) / 100) }
          : item
      )
    )
  }

  const applyInventoryImpact = (workOrderId: string) => {
    const workOrder = workOrders.find((order) => order.id === workOrderId)
    if (!workOrder) return
    if (workOrder.type === 'so2_addition') {
      const chemical = inventory.find((item) => item.name.toLowerCase().includes('so2'))
      if (chemical) {
        handleAdjustInventory(chemical.id, -0.5)
      }
    }
  }

  const handleExport = (dataset: ExportTemplate['dataset']) => {
    const content = buildCsv(dataset, { harvestLots, wineLots, workOrders })
    const filename = `${dataset}-${new Date().toISOString().slice(0, 10)}.csv`
    const blob = new Blob([content], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-emerald-700">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading winery workspace...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-8">
        <HeaderSummary summary={summary} fermentationAlerts={fermentationAlerts} />

        <HarvestAndCapacitySection
          harvestLots={harvestLots}
          wineLots={wineLots}
          tanks={tanks}
          barrels={barrels}
          onCreateHarvestLot={handleCreateHarvestLot}
          onConvertHarvestLot={handleConvertHarvestLot}
          onAssignContainer={handleAssignContainer}
        />

        <FermentationSection
          wineLots={wineLots}
          readings={fermentationReadings}
          alerts={fermentationAlerts}
          onAddReading={handleAddReading}
          initialLotId={initialFermentationLot}
        />

        <WorkOrdersSection
          workOrders={workOrders}
          wineLots={wineLots}
          onCreateWorkOrder={handleCreateWorkOrder}
          onWorkOrderStatusChange={handleWorkOrderStatus}
          initialLotId={initialWorkOrderLot}
        />

        <InventoryComplianceSection
          inventory={inventory}
          onAdjustInventory={handleAdjustInventory}
          onExport={handleExport}
        />

        <VineyardContinuitySection harvestLots={harvestLots} wineLots={wineLots} />
      </div>
    </div>
  )
}

interface HeaderSummaryProps {
  summary: {
    activeFermentations: number
    availableTanks: number
    dueToday: number
    lowStockCount: number
  }
  fermentationAlerts: FermentationAlert[]
}

function HeaderSummary({ summary, fermentationAlerts }: HeaderSummaryProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white shadow-lg">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,_#ffffff,_transparent_45%)]" />
      <div className="p-6 sm:p-8 relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-emerald-100">Winery OS · GTM</p>
            <h1 className="text-3xl sm:text-4xl font-semibold mt-1 flex items-center gap-2">
              Winery Command Center
              <Sparkles className="h-6 w-6 text-amber-200" />
            </h1>
            <p className="text-emerald-100 mt-2 max-w-2xl">
              Mobile-first workflows for harvest, fermentation, and compliance-ready traceability.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {fermentationAlerts.slice(0, 2).map((alert) => (
              <Badge
                key={alert.id}
                variant="secondary"
                className="bg-white/15 text-white border-white/20"
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                {alert.lotName}: {alert.message}
              </Badge>
            ))}
            <Button asChild size="sm" className="bg-white text-emerald-700 hover:bg-emerald-50">
              <Link href="/winery/work-orders?action=create">Create work order</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <SummaryTile
            label="Fermentations"
            value={summary.activeFermentations}
            icon={<Wine className="h-4 w-4" />}
          />
          <SummaryTile
            label="Open tanks"
            value={summary.availableTanks}
            icon={<Boxes className="h-4 w-4" />}
          />
          <SummaryTile
            label="Due today"
            value={summary.dueToday}
            icon={<ClipboardList className="h-4 w-4" />}
            tone="amber"
          />
          <SummaryTile
            label="Low stock"
            value={summary.lowStockCount}
            icon={<WineOff className="h-4 w-4" />}
            tone="rose"
          />
        </div>
      </div>
    </div>
  )
}

function SummaryTile({
  label,
  value,
  icon,
  tone = 'emerald'
}: {
  label: string
  value: number | string
  icon: JSX.Element
  tone?: 'emerald' | 'amber' | 'rose'
}) {
  const toneClasses: Record<'emerald' | 'amber' | 'rose', string> = {
    emerald: 'bg-white/15 text-white',
    amber: 'bg-amber-100/20 text-amber-50',
    rose: 'bg-rose-100/20 text-rose-50'
  }
  return (
    <div
      className={cn(
        'rounded-xl px-4 py-3 border border-white/15 flex items-center gap-3',
        toneClasses[tone]
      )}
    >
      <div className="rounded-lg bg-white/15 p-2">{icon}</div>
      <div>
        <div className="text-xs uppercase tracking-wide opacity-80">{label}</div>
        <div className="text-xl font-semibold">{value}</div>
      </div>
    </div>
  )
}

interface HarvestAndCapacitySectionProps {
  harvestLots: HarvestLot[]
  wineLots: WineLot[]
  tanks: Tank[]
  barrels: Barrel[]
  onCreateHarvestLot: (payload: Omit<HarvestLot, 'id' | 'status' | 'linkedWineLotId'>) => void
  onConvertHarvestLot: (lotId: string) => void
  onAssignContainer: (lotId: string, containerType: ContainerType, containerId: string) => void
}

function HarvestAndCapacitySection({
  harvestLots,
  wineLots,
  tanks,
  barrels,
  onCreateHarvestLot,
  onConvertHarvestLot,
  onAssignContainer
}: HarvestAndCapacitySectionProps) {
  const [form, setForm] = useState({
    vineyardBlock: '',
    farmName: '',
    variety: '',
    harvestDate: '',
    weightKg: '',
    brix: '',
    temperatureC: '',
    pH: ''
  })

  const fermentingLots = wineLots.filter((lot) => lot.status === 'fermenting')

  const handleSubmit = () => {
    if (!form.vineyardBlock || !form.harvestDate || !form.weightKg || !form.variety) return
    onCreateHarvestLot({
      vineyardBlock: {
        id: `VB-${Date.now()}`,
        name: form.vineyardBlock,
        farmName: form.farmName || 'Unassigned',
        variety: form.variety
      },
      variety: form.variety,
      harvestDate: form.harvestDate,
      weightKg: Number(form.weightKg),
      initialChemistry: {
        brix: form.brix ? Number(form.brix) : undefined,
        temperatureC: form.temperatureC ? Number(form.temperatureC) : undefined,
        pH: form.pH ? Number(form.pH) : undefined
      },
      initialVolumeL: Number(form.weightKg) * 0.75
    })
    setForm({
      vineyardBlock: '',
      farmName: '',
      variety: '',
      harvestDate: '',
      weightKg: '',
      brix: '',
      temperatureC: '',
      pH: ''
    })
  }

  return (
    <Card className="border-emerald-100 shadow-sm" id="harvest">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Leaf className="h-5 w-5 text-emerald-600" />
            Harvest & Lot Management
          </CardTitle>
          <CardDescription>
            Create lots in under a minute and keep vineyard → tank traceability.
          </CardDescription>
        </div>
        <Badge className="bg-emerald-100 text-emerald-900 border-emerald-200">
          {harvestLots.length} harvest lots · {wineLots.length} wine lots
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="vineyardBlock">Vineyard block</Label>
                <Input
                  id="vineyardBlock"
                  placeholder="North Slope A"
                  value={form.vineyardBlock}
                  onChange={(e) => setForm((prev) => ({ ...prev, vineyardBlock: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="farmName">Farm</Label>
                <Input
                  id="farmName"
                  placeholder="Estate name"
                  value={form.farmName}
                  onChange={(e) => setForm((prev) => ({ ...prev, farmName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variety">Variety</Label>
                <Input
                  id="variety"
                  placeholder="Syrah"
                  value={form.variety}
                  onChange={(e) => setForm((prev) => ({ ...prev, variety: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="harvestDate">Harvest date</Label>
                <Input
                  id="harvestDate"
                  type="date"
                  value={form.harvestDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, harvestDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weightKg">Weight (kg)</Label>
                <Input
                  id="weightKg"
                  type="number"
                  placeholder="8200"
                  value={form.weightKg}
                  onChange={(e) => setForm((prev) => ({ ...prev, weightKg: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brix">Initial Brix</Label>
                <Input
                  id="brix"
                  type="number"
                  step="0.1"
                  placeholder="24.0"
                  value={form.brix}
                  onChange={(e) => setForm((prev) => ({ ...prev, brix: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperatureC">Temperature (°C)</Label>
                <Input
                  id="temperatureC"
                  type="number"
                  step="0.1"
                  placeholder="18.5"
                  value={form.temperatureC}
                  onChange={(e) => setForm((prev) => ({ ...prev, temperatureC: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pH">pH</Label>
                <Input
                  id="pH"
                  type="number"
                  step="0.01"
                  placeholder="3.55"
                  value={form.pH}
                  onChange={(e) => setForm((prev) => ({ ...prev, pH: e.target.value }))}
                />
              </div>
            </div>
            <Button onClick={handleSubmit} className="w-full sm:w-auto">
              Create harvest lot
            </Button>
          </div>
          <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/60 p-4">
            <p className="text-sm font-semibold text-emerald-800 mb-2">Fast conversion rules</p>
            <ul className="text-sm text-emerald-700 space-y-1.5">
              <li>• Auto-links vineyard block and chemistry to wine lot</li>
              <li>• Default status set to fermenting</li>
              <li>• Uses weight → volume to prefill tank volume</li>
            </ul>
            <div className="mt-3 flex items-center gap-2 text-emerald-900">
              <Sparkles className="h-4 w-4" />
              <span>Target: usable lot in under 60 seconds</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="border border-emerald-100 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Harvest lots</CardTitle>
                <CardDescription>Source data with vineyard linkage.</CardDescription>
              </div>
              <Badge variant="outline">{harvestLots.length} lots</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {harvestLots.map((lot) => (
                <div
                  key={lot.id}
                  className="rounded-lg border border-emerald-100 bg-white p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{lot.vineyardBlock.name}</p>
                      <Badge className={cn('border', statusTone[lot.status])}>
                        {lotStatusCopy[lot.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {lot.variety} · {formatDate(lot.harvestDate)} ·{' '}
                      {formatNumber(lot.weightKg, 'kg')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Block → {lot.vineyardBlock.farmName || 'Unassigned'} · Brix{' '}
                      {lot.initialChemistry?.brix ?? '—'} · pH {lot.initialChemistry?.pH ?? '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!lot.linkedWineLotId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onConvertHarvestLot(lot.id)}
                      >
                        Convert to wine lot
                      </Button>
                    )}
                    {lot.linkedWineLotId && (
                      <Badge variant="outline" className="text-emerald-700 border-emerald-200">
                        Linked → {lot.linkedWineLotId}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-emerald-100 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Tank & barrel capacity</CardTitle>
                <CardDescription>Zero-ambiguity fill status.</CardDescription>
              </div>
              <Badge variant="outline">{fermentingLots.length} active lots</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <Tabs defaultValue="tanks">
                <TabsList>
                  <TabsTrigger value="tanks">Tanks</TabsTrigger>
                  <TabsTrigger value="barrels">Barrels</TabsTrigger>
                </TabsList>
                <TabsContent value="tanks" className="space-y-3">
                  {tanks.map((tank) => (
                    <CapacityRow
                      key={tank.id}
                      title={tank.name}
                      capacity={tank.capacityL}
                      current={tank.currentVolumeL}
                      status={tank.status === 'empty' ? 'Available' : 'In use'}
                      lotName={wineLots.find((lot) => lot.id === tank.assignedLotId)?.name}
                      lotId={tank.assignedLotId}
                      lots={wineLots}
                      containerId={tank.id}
                      containerType="tank"
                      onAssign={onAssignContainer}
                    />
                  ))}
                </TabsContent>
                <TabsContent value="barrels" className="space-y-3">
                  {barrels.map((barrel) => (
                    <CapacityRow
                      key={barrel.id}
                      title={barrel.name}
                      capacity={barrel.sizeL}
                      current={
                        barrel.fillStatus === 'full'
                          ? barrel.sizeL
                          : barrel.fillStatus === 'partial'
                            ? barrel.sizeL / 2
                            : 0
                      }
                      status={barrel.fillStatus === 'empty' ? 'Available' : 'In use'}
                      lotName={wineLots.find((lot) => lot.id === barrel.assignedLotId)?.name}
                      lotId={barrel.assignedLotId}
                      lots={wineLots}
                      containerId={barrel.id}
                      containerType="barrel"
                      onAssign={onAssignContainer}
                    />
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}

interface CapacityRowProps {
  title: string
  capacity: number
  current: number
  status: string
  lotName?: string
  lotId?: string
  lots: WineLot[]
  containerType: ContainerType
  containerId: string
  onAssign: (lotId: string, type: ContainerType, containerId: string) => void
}

function CapacityRow({
  title,
  capacity,
  current,
  status,
  lotName,
  lotId,
  lots,
  containerType,
  containerId,
  onAssign
}: CapacityRowProps) {
  const availableLots = lots.filter((lot) => lot.status !== 'bottled')
  const percent = percentFill(current, capacity)
  return (
    <div className="border border-emerald-100 rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">
            {status} · {percent}% full · {formatNumber(capacity, 'L')}
          </p>
          {lotName && <p className="text-xs text-emerald-700">Lot: {lotName}</p>}
        </div>
        <Badge variant="outline">{status}</Badge>
      </div>
      <div className="mt-3 h-2 bg-emerald-50 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-teal-400"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Select onValueChange={(value) => onAssign(value, containerType, containerId)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Assign lot" />
          </SelectTrigger>
          <SelectContent>
            {availableLots.map((lot) => (
              <SelectItem value={lot.id} key={lot.id}>
                {lot.name} ({lotStatusCopy[lot.status]})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          onClick={() => lotId && onAssign('', containerType, containerId)}
          disabled={!lotId}
        >
          Clear
        </Button>
      </div>
    </div>
  )
}

interface FermentationSectionProps {
  wineLots: WineLot[]
  readings: FermentationReading[]
  alerts: FermentationAlert[]
  onAddReading: (reading: Omit<FermentationReading, 'id'>) => void
}

function FermentationSection({
  wineLots,
  readings,
  alerts,
  onAddReading,
  initialLotId
}: FermentationSectionProps & { initialLotId?: string }) {
  const [selectedLot, setSelectedLot] = useState(
    initialLotId || wineLots.find((lot) => lot.status === 'fermenting')?.id || ''
  )
  const [form, setForm] = useState({ brix: '', temperatureC: '', pH: '', note: '' })

  useEffect(() => {
    if (initialLotId) {
      setSelectedLot(initialLotId)
    }
  }, [initialLotId])

  const lotReadings = readings
    .filter((reading) => reading.wineLotId === selectedLot)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const handleSubmit = () => {
    if (!selectedLot) return
    onAddReading({
      wineLotId: selectedLot,
      brix: form.brix ? Number(form.brix) : undefined,
      temperatureC: form.temperatureC ? Number(form.temperatureC) : undefined,
      pH: form.pH ? Number(form.pH) : undefined,
      note: form.note || undefined,
      timestamp: new Date().toISOString()
    })
    setForm({ brix: '', temperatureC: '', pH: '', note: '' })
  }

  return (
    <Card className="border border-blue-100 shadow-sm" id="fermentation">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <FlaskConical className="h-5 w-5 text-blue-600" />
            Fermentation Tracking
          </CardTitle>
          <CardDescription>Manual-first readings with curve visibility and alerts.</CardDescription>
        </div>
        <Badge className="bg-blue-100 text-blue-900 border-blue-200">
          {alerts.length} alert{alerts.length === 1 ? '' : 's'}
        </Badge>
      </CardHeader>
      <CardContent className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <Tabs defaultValue="readings">
            <TabsList>
              <TabsTrigger value="readings">Readings</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
            </TabsList>
            <TabsContent value="readings">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <Select value={selectedLot} onValueChange={setSelectedLot}>
                  <SelectTrigger className="w-full sm:w-72">
                    <SelectValue placeholder="Select fermenting lot" />
                  </SelectTrigger>
                  <SelectContent>
                    {wineLots
                      .filter((lot) => lot.status === 'fermenting')
                      .map((lot) => (
                        <SelectItem value={lot.id} key={lot.id}>
                          {lot.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Thermometer className="h-4 w-4" />
                  Latest:{' '}
                  {lotReadings[0] ? formatDateTime(lotReadings[0].timestamp) : 'No readings yet'}
                </div>
              </div>
              <div className="rounded-lg border border-blue-100 bg-white p-3">
                {lotReadings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No readings for this lot yet.</p>
                ) : (
                  <ScrollArea className="h-60 pr-2">
                    <div className="space-y-2">
                      {lotReadings.map((reading) => (
                        <div
                          key={reading.id}
                          className="flex items-center justify-between rounded-md border border-blue-50 px-3 py-2"
                        >
                          <div>
                            <p className="font-medium">{formatDateTime(reading.timestamp)}</p>
                            <p className="text-xs text-muted-foreground">
                              Brix {reading.brix ?? '—'} · Temp {reading.temperatureC ?? '—'}°C · pH{' '}
                              {reading.pH ?? '—'}
                            </p>
                            {reading.note && (
                              <p className="text-xs text-blue-700">{reading.note}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="border-blue-100 text-blue-800">
                            {getTimeAgo(reading.timestamp)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>
            <TabsContent value="alerts" className="space-y-2">
              {alerts.length === 0 && (
                <p className="text-sm text-muted-foreground">No alerts. Keep logging.</p>
              )}
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'rounded-md border px-3 py-2 flex items-center gap-2',
                    alert.severity === 'critical'
                      ? 'border-rose-200 bg-rose-50 text-rose-800'
                      : 'border-amber-200 bg-amber-50 text-amber-800'
                  )}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <div>
                    <p className="font-semibold">{alert.lotName}</p>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
        <div className="space-y-3">
          <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4 space-y-3">
            <p className="font-semibold text-blue-900">Quick reading</p>
            <div className="space-y-2">
              <Label htmlFor="readingBrix">Brix / SG</Label>
              <Input
                id="readingBrix"
                placeholder="14.2"
                value={form.brix}
                onChange={(e) => setForm((prev) => ({ ...prev, brix: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="readingTemp">Temperature (°C)</Label>
              <Input
                id="readingTemp"
                placeholder="22.4"
                value={form.temperatureC}
                onChange={(e) => setForm((prev) => ({ ...prev, temperatureC: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="readingPh">pH</Label>
              <Input
                id="readingPh"
                placeholder="3.45"
                value={form.pH}
                onChange={(e) => setForm((prev) => ({ ...prev, pH: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="readingNote">Note</Label>
              <Textarea
                id="readingNote"
                placeholder="Any aromas, cap condition, or actions?"
                value={form.note}
                onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              />
            </div>
            <Button onClick={handleSubmit} disabled={!selectedLot}>
              Log reading
            </Button>
          </div>
          <div className="rounded-lg border border-dashed border-blue-200 p-3 text-sm text-blue-900">
            Alerts watch for missing readings (24h) and stalled Brix drop &lt; 0.3 across two
            readings.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface WorkOrdersSectionProps {
  workOrders: WorkOrder[]
  wineLots: WineLot[]
  onCreateWorkOrder: (payload: Omit<WorkOrder, 'id' | 'status'>) => void
  onWorkOrderStatusChange: (id: string, status: WorkOrderStatus) => void
}

function WorkOrdersSection({
  workOrders,
  wineLots,
  onCreateWorkOrder,
  onWorkOrderStatusChange,
  initialLotId
}: WorkOrdersSectionProps & { initialLotId?: string }) {
  const [form, setForm] = useState({
    wineLotId: (initialLotId || wineLots[0]?.id) ?? '',
    type: 'punch_down' as WorkOrderType,
    dueDate: new Date().toISOString().slice(0, 16),
    assignee: 'Cellar',
    notes: ''
  })

  useEffect(() => {
    if (initialLotId) {
      setForm((prev) => ({ ...prev, wineLotId: initialLotId }))
    }
  }, [initialLotId])

  const handleSubmit = () => {
    if (!form.wineLotId) return
    const lot = wineLots.find((item) => item.id === form.wineLotId)
    if (!lot) return

    onCreateWorkOrder({
      wineLotId: lot.id,
      wineLotName: lot.name,
      type: form.type,
      dueDate: new Date(form.dueDate).toISOString(),
      assignee: form.assignee,
      containerId: lot.container?.id,
      containerType: lot.container?.type,
      notes: form.notes
    })

    setForm((prev) => ({ ...prev, notes: '' }))
  }

  return (
    <Card className="border border-amber-100 shadow-sm" id="work-orders">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <ClipboardList className="h-5 w-5 text-amber-600" />
            Work Orders & Cellar Tasks
          </CardTitle>
          <CardDescription>
            One-tap completion on mobile keeps cellar crews in sync.
          </CardDescription>
        </div>
        <Badge className="bg-amber-100 text-amber-900 border-amber-200">
          {workOrders.filter((order) => order.status === 'pending').length} open
        </Badge>
      </CardHeader>
      <CardContent className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {workOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-lg border border-amber-100 bg-white p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-amber-50 p-2 text-amber-700">
                  {workOrderIcons[order.type]}
                </div>
                <div>
                  <p className="font-semibold">
                    {workOrderLabels[order.type]} · {order.wineLotName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Due {formatDateTime(order.dueDate)} · {order.assignee}
                  </p>
                  {order.notes && <p className="text-xs text-amber-700">{order.notes}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-amber-800 border-amber-200 capitalize">
                  {order.status}
                </Badge>
                {order.status === 'pending' ? (
                  <Button size="sm" onClick={() => onWorkOrderStatusChange(order.id, 'completed')}>
                    Mark done
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onWorkOrderStatusChange(order.id, 'pending')}
                  >
                    Reopen
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-4 space-y-3">
            <p className="font-semibold text-amber-900">New work order</p>
            <div className="space-y-2">
              <Label>Lot</Label>
              <Select
                value={form.wineLotId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, wineLotId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pick lot" />
                </SelectTrigger>
                <SelectContent>
                  {wineLots.map((lot) => (
                    <SelectItem value={lot.id} key={lot.id}>
                      {lot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Task type</Label>
              <Select
                value={form.type}
                onValueChange={(value: WorkOrderType) =>
                  setForm((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(workOrderLabels).map(([value, label]) => (
                    <SelectItem value={value} key={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due</Label>
              <Input
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Input
                value={form.assignee}
                onChange={(e) => setForm((prev) => ({ ...prev, assignee: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Punch downs every 6 hours"
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <Button onClick={handleSubmit}>Create work order</Button>
          </div>
          <div className="rounded-lg border border-dashed border-amber-200 p-3 text-sm text-amber-900">
            Completion will auto-deduct supplies for SO2 additions.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface InventoryComplianceSectionProps {
  inventory: InventoryItem[]
  onAdjustInventory: (id: string, delta: number) => void
  onExport: (dataset: ExportTemplate['dataset']) => void
}

function InventoryComplianceSection({
  inventory,
  onAdjustInventory,
  onExport
}: InventoryComplianceSectionProps) {
  return (
    <Card className="border border-rose-100 shadow-sm" id="inventory">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Boxes className="h-5 w-5 text-rose-600" />
            Inventory & Compliance Exports
          </CardTitle>
          <CardDescription>Low-friction stock tracking and export-ready data.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {inventory.map((item) => {
            const isLow = item.reorderLevel !== undefined && item.quantity <= item.reorderLevel
            return (
              <div
                key={item.id}
                className={cn(
                  'rounded-lg border p-3 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2',
                  isLow ? 'border-rose-200' : 'border-rose-100'
                )}
              >
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.category} · {formatNumber(item.quantity, item.unit)}
                  </p>
                  {item.reorderLevel !== undefined && (
                    <p className="text-xs text-rose-700">
                      Reorder at {formatNumber(item.reorderLevel, item.unit)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isLow && (
                    <Badge className="bg-rose-100 text-rose-900 border-rose-200">Low</Badge>
                  )}
                  <Button size="sm" variant="outline" onClick={() => onAdjustInventory(item.id, 1)}>
                    +1
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAdjustInventory(item.id, -1)}
                  >
                    -1
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
        <div className="space-y-3">
          <div className="rounded-lg border border-rose-100 bg-rose-50/60 p-4 space-y-3">
            <p className="font-semibold text-rose-900">Compliance exports</p>
            {exportTemplates.map((template) => (
              <div
                key={template.id}
                className="rounded-md border border-rose-100 bg-white p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{template.title}</p>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onExport(template.dataset)}>
                    Export CSV
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-dashed border-rose-200 p-3 text-sm text-rose-900">
            Audit trail captures who, what, and when across movements and treatments.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface VineyardContinuityProps {
  harvestLots: HarvestLot[]
  wineLots: WineLot[]
}

function VineyardContinuitySection({ harvestLots, wineLots }: VineyardContinuityProps) {
  const mapped = harvestLots.map((harvest) => {
    const wine = wineLots.find((lot) => lot.id === harvest.linkedWineLotId)
    return { harvest, wine }
  })

  return (
    <Card className="border border-emerald-100 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpRight className="h-5 w-5 text-emerald-600" />
          Vineyard → Winery Continuity
        </CardTitle>
        <CardDescription>
          Trace block, chemistry, and container assignment end-to-end.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {mapped.map(({ harvest, wine }) => (
          <div
            key={harvest.id}
            className="rounded-lg border border-emerald-100 bg-white p-3 space-y-2"
          >
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-emerald-600" />
              <p className="font-semibold">{harvest.vineyardBlock.name}</p>
              <Badge variant="outline">{harvest.vineyardBlock.variety}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Harvested {formatDate(harvest.harvestDate)} · {formatNumber(harvest.weightKg, 'kg')}
            </p>
            {wine ? (
              <div className="text-sm space-y-1">
                <p className="font-semibold text-emerald-800">→ {wine.name}</p>
                <p className="text-xs text-muted-foreground">
                  {lotStatusCopy[wine.status]} · {formatNumber(wine.currentVolumeL, 'L')} ·{' '}
                  {wine.container
                    ? `${wine.container.type} ${wine.container.name}`
                    : 'No container set'}
                </p>
              </div>
            ) : (
              <p className="text-xs text-amber-700">Waiting for conversion to wine lot.</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

const buildFermentationAlerts = (
  wineLots: WineLot[],
  readings: FermentationReading[]
): FermentationAlert[] => {
  const alerts: FermentationAlert[] = []

  wineLots
    .filter((lot) => lot.status === 'fermenting')
    .forEach((lot) => {
      const lotReadings = readings
        .filter((reading) => reading.wineLotId === lot.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      if (lotReadings.length === 0) {
        alerts.push({
          id: `alert-${lot.id}-missing`,
          wineLotId: lot.id,
          lotName: lot.name,
          message: 'No readings logged yet',
          severity: 'warning'
        })
        return
      }

      const latest = lotReadings[0]
      const previous = lotReadings[1]
      const hoursSince = (Date.now() - new Date(latest.timestamp).getTime()) / (1000 * 60 * 60)
      if (hoursSince > 24) {
        alerts.push({
          id: `alert-${lot.id}-missing-reading`,
          wineLotId: lot.id,
          lotName: lot.name,
          message: 'No reading logged in the last 24h',
          severity: 'critical'
        })
      }

      if (latest.brix !== undefined && previous?.brix !== undefined) {
        const delta = previous.brix - latest.brix
        if (delta < 0.3) {
          alerts.push({
            id: `alert-${lot.id}-stall`,
            wineLotId: lot.id,
            lotName: lot.name,
            message: 'Potential stall: Brix drop < 0.3 since last reading',
            severity: 'warning'
          })
        }
      }
    })

  return alerts
}

const isDueToday = (iso: string) => {
  const date = new Date(iso)
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

const buildCsv = (
  dataset: ExportTemplate['dataset'],
  data: { harvestLots: HarvestLot[]; wineLots: WineLot[]; workOrders: WorkOrder[] }
) => {
  if (dataset === 'lot_movements') {
    const header = 'wine_lot,source_harvest,timestamp,container,status,volume_l\n'
    const rows = data.wineLots
      .map((lot) => {
        const container = lot.container
          ? `${lot.container.type} ${lot.container.name}`
          : 'Unassigned'
        return `${lot.name},${lot.sourceHarvestLotId},${new Date().toISOString()},${container},${lot.status},${lot.currentVolumeL}`
      })
      .join('\n')
    return header + rows
  }

  if (dataset === 'volume_changes') {
    const header = 'wine_lot,timestamp,volume_l,notes\n'
    const rows = data.wineLots
      .map((lot) => `${lot.name},${new Date().toISOString()},${lot.currentVolumeL},"Current fill"`)
      .join('\n')
    return header + rows
  }

  const header = 'wine_lot,status,container,work_orders\n'
  const rows = data.wineLots
    .map((lot) => {
      const lotOrders = data.workOrders.filter((order) => order.wineLotId === lot.id)
      const tasks = lotOrders.map((order) => workOrderLabels[order.type]).join('; ')
      const container = lot.container ? `${lot.container.type} ${lot.container.name}` : 'Unassigned'
      return `${lot.name},${lotStatusCopy[lot.status]},${container},"${tasks}"`
    })
    .join('\n')
  return header + rows
}
