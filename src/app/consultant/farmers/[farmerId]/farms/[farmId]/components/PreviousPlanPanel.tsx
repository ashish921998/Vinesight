'use client'

import { ClipboardList } from 'lucide-react'
import type { FertilizerPlanWithItems } from '@/lib/fertilizer-plan-service'

export function PreviousPlanPanel({ plan }: { plan: FertilizerPlanWithItems | null }) {
  return (
    <div className="space-y-3">
      {!plan ? (
        <div className="rounded-lg border border-dashed border-border p-8 flex flex-col items-center justify-center text-center">
          <ClipboardList className="h-6 w-6 text-muted-foreground/40 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">No previous plan</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            This will be the first fertilizer plan for this farm
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden bg-card">
          <div className="px-4 py-2.5 border-b border-border/50 bg-muted/20">
            <p className="text-sm font-semibold">{plan.title}</p>
            <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
              Created{' '}
              {new Date(plan.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>

          <div className="divide-y divide-border/40">
            {plan.items.map((item, idx) => (
              <div key={item.id} className="px-4 py-2.5 flex items-baseline gap-3">
                <span className="text-[10px] font-semibold text-muted-foreground/60 tabular-nums w-4 shrink-0">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.fertilizer_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="tabular-nums">
                      {item.quantity} {item.unit}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          {plan.notes && (
            <div className="px-4 py-2.5 border-t border-border/50 bg-muted/10">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                Message to farmer
              </p>
              <p className="text-xs text-foreground/90 leading-relaxed">{plan.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
