'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Users, User, Wallet, Plus, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Worker } from '@/lib/supabase'
import { formatCurrency, type CurrencyCode } from '@/lib/currency-utils'

interface WorkersListViewProps {
  workers: Worker[]
  loading: boolean
  currencyPreference?: CurrencyCode
  onOpenAddModal: () => void
  onOpenWorkerDetail: (worker: Worker) => void
  onOpenEditModal: (worker: Worker) => void
  onDeleteWorker: (worker: Worker) => void
}

export function WorkersListView({
  workers,
  loading,
  currencyPreference = 'INR',
  onOpenAddModal,
  onOpenWorkerDetail,
  onOpenEditModal,
  onDeleteWorker
}: WorkersListViewProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (workers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-medium mb-1">No workers yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your first worker to start tracking
          </p>
          <Button
            onClick={onOpenAddModal}
            className="bg-accent hover:bg-accent/90 text-white rounded-full px-6"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Worker
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {workers.map((worker) => (
        <Card
          key={worker.id}
          className={cn(
            'cursor-pointer border-none bg-gradient-to-r from-white to-primary/10 shadow-sm rounded-3xl transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            !worker.is_active && 'opacity-60'
          )}
          tabIndex={0}
          role="button"
          aria-label={`View details for ${worker.name}`}
          onClick={() => onOpenWorkerDetail(worker)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onOpenWorkerDetail(worker)
            }
          }}
        >
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-primary">
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">{worker.name}</h3>
                  <Badge className="text-xs" variant={worker.is_active ? 'outline' : 'secondary'}>
                    {worker.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-foreground">
                      {formatCurrency(worker.daily_rate, currencyPreference)}
                    </span>
                    <span>/day</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-600">
                    <Wallet className="h-4 w-4" />
                    <span className="font-semibold">
                      {formatCurrency(worker.advance_balance || 0, currencyPreference)}
                    </span>
                    <span className="text-xs uppercase tracking-wide">advance</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary"
                  aria-label={`Edit ${worker.name}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenEditModal(worker)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:text-red-700"
                  aria-label={`Delete ${worker.name}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteWorker(worker)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
