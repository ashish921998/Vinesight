'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WineryService } from '@/lib/winery-service'
import { type WorkOrder, type WineLot, type WorkOrderType } from '@/types/winery'
import { ClipboardList, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function WorkOrdersPage() {
  const searchParams = useSearchParams()
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [wineLots, setWineLots] = useState<WineLot[]>([])
  const [form, setForm] = useState({
    wineLotId: '',
    type: 'punch_down' as WorkOrderType,
    dueDate: new Date().toISOString().slice(0, 16),
    assignee: 'Cellar',
    notes: ''
  })

  useEffect(() => {
    const load = async () => {
      const seed = await WineryService.getSeedData()
      setWorkOrders(seed.workOrders)
      setWineLots(seed.wineLots)
      const lotId = searchParams?.get('lotId')
      const targetLot =
        lotId && seed.wineLots.some((lot) => lot.id === lotId) ? lotId : seed.wineLots[0]?.id
      setForm((prev) => ({ ...prev, wineLotId: targetLot || prev.wineLotId }))
    }
    load()
  }, [searchParams])

  const handleCreate = () => {
    if (!form.wineLotId) return
    const lot = wineLots.find((l) => l.id === form.wineLotId)
    if (!lot) return
    const newOrder: WorkOrder = {
      id: `WO-${Date.now()}`,
      type: form.type,
      wineLotId: lot.id,
      wineLotName: lot.name,
      containerId: lot.container?.id,
      containerType: lot.container?.type,
      dueDate: new Date(form.dueDate).toISOString(),
      assignee: form.assignee,
      status: 'pending',
      notes: form.notes
    }
    setWorkOrders((prev) => [newOrder, ...prev])
    setForm((prev) => ({ ...prev, notes: '' }))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <Card className="border-rose-100">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <ClipboardList className="h-5 w-5 text-rose-700" />
              Work Orders
            </CardTitle>
            <CardDescription>Mobile-friendly task tracking.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/winery/work-orders?action=create">Create work order</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="today">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent value="today">
              <WorkOrderList
                items={workOrders.filter(
                  (order) => isToday(order.dueDate) && order.status !== 'completed'
                )}
                emptyLabel="No work orders due today."
              />
            </TabsContent>
            <TabsContent value="upcoming">
              <WorkOrderList
                items={workOrders.filter(
                  (order) => !isToday(order.dueDate) && order.status !== 'completed'
                )}
                emptyLabel="No upcoming work orders."
              />
            </TabsContent>
            <TabsContent value="completed">
              <WorkOrderList
                items={workOrders.filter((order) => order.status === 'completed')}
                emptyLabel="No completed work orders."
              />
            </TabsContent>
          </Tabs>

          <div className="rounded-lg border border-rose-100 bg-rose-50/60 p-4 space-y-3">
            <p className="text-sm font-semibold">Create work order</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Lot</Label>
                <Select
                  value={form.wineLotId}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, wineLotId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lot" />
                  </SelectTrigger>
                  <SelectContent>
                    {wineLots.map((lot) => (
                      <SelectItem key={lot.id} value={lot.id}>
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
                    <SelectItem value="punch_down">Punch down</SelectItem>
                    <SelectItem value="pump_over">Pump over</SelectItem>
                    <SelectItem value="racking">Racking</SelectItem>
                    <SelectItem value="so2_addition">SO2 addition</SelectItem>
                    <SelectItem value="blending">Blending</SelectItem>
                    <SelectItem value="bottling">Bottling</SelectItem>
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
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Punch downs every 6 hours"
              />
            </div>
            <Button onClick={handleCreate} disabled={!form.wineLotId}>
              Create work order
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const isToday = (iso: string) => {
  const date = new Date(iso)
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

function WorkOrderList({ items, emptyLabel }: { items: WorkOrder[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground mt-2">{emptyLabel}</p>
  }
  return (
    <div className="space-y-3 mt-2">
      {items.map((order) => (
        <div
          key={order.id}
          className="rounded-lg border border-rose-100 bg-white p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
        >
          <div>
            <p className="font-semibold capitalize">
              {order.type.replace('_', ' ')} · {order.wineLotName}
            </p>
            <p className="text-xs text-muted-foreground">
              {order.containerType ? `${order.containerType} ${order.containerId}` : 'No container'}{' '}
              · {order.assignee}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(order.dueDate).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={order.status === 'completed' ? 'text-green-700' : 'text-rose-700'}
            >
              {order.status}
            </Badge>
            <Button size="sm" variant="outline">
              Mark Done
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
