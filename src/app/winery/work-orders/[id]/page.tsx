'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { WineryService } from '@/lib/winery-service'
import { type WorkOrder } from '@/types/winery'
import { ClipboardList, ArrowLeft } from 'lucide-react'

export default function WorkOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)

  useEffect(() => {
    const load = async () => {
      const seed = await WineryService.getSeedData()
      setWorkOrder(seed.workOrders.find((o) => o.id === id) || null)
    }
    load()
  }, [id])

  if (!workOrder) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <p className="mt-4 text-muted-foreground">Work order not found.</p>
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
          className={workOrder.status === 'completed' ? 'text-emerald-700' : 'text-rose-700'}
        >
          {workOrder.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <ClipboardList className="h-5 w-5 text-rose-700" />
            {workOrder.type.replace('_', ' ')}
          </CardTitle>
          <CardDescription>Linked lot and container.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <DetailRow
            label="Wine lot"
            value={workOrder.wineLotName}
            link={`/winery/lots/${workOrder.wineLotId}`}
          />
          <DetailRow
            label="Container"
            value={
              workOrder.containerType
                ? `${workOrder.containerType} ${workOrder.containerId}`
                : 'None'
            }
            link={
              workOrder.containerType === 'tank'
                ? `/winery/tanks/${workOrder.containerId}`
                : undefined
            }
          />
          <DetailRow label="Assignee" value={workOrder.assignee} />
          <DetailRow label="Due" value={new Date(workOrder.dueDate).toLocaleString()} />
          {workOrder.notes && <DetailRow label="Notes" value={workOrder.notes} />}
          <Button size="sm" className="mt-2">
            Mark Done
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function DetailRow({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      {link ? (
        <Link href={link} className="font-semibold text-rose-700 hover:underline">
          {value}
        </Link>
      ) : (
        <span className="font-semibold">{value}</span>
      )}
    </div>
  )
}
