'use client'

import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/Skeleton'

export type ChartCardState = 'loading' | 'error' | 'empty' | 'ready'

/**
 * Shared frame for every Command Center chart. Owns the four display states so
 * each chart only worries about rendering its `ready` body. Empty/error states
 * are compact and instrument-like (a quiet line of text), never a broken chart.
 */
export function ChartCard({
  title,
  description,
  footnote,
  state,
  emptyHint,
  headerRight,
  children
}: {
  title: string
  description?: string
  footnote?: string
  state: ChartCardState
  emptyHint?: string
  headerRight?: ReactNode
  children?: ReactNode
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
        <div className="min-w-0">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        {headerRight}
      </CardHeader>
      <CardContent className="flex-1">
        {state === 'loading' && <Skeleton className="h-48 w-full" />}

        {state === 'error' && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Couldn&apos;t load this chart. Please refresh.
          </p>
        )}

        {state === 'empty' && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {emptyHint ?? 'Not enough data yet.'}
          </p>
        )}

        {state === 'ready' && children}

        {state === 'ready' && footnote && (
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{footnote}</p>
        )}
      </CardContent>
    </Card>
  )
}

/** A small color swatch + label + count, used as an accessible chart legend. */
export function LegendChip({
  color,
  label,
  count
}: {
  color: string
  label: string
  count?: number
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span aria-hidden className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: color }} />
      <span>{label}</span>
      {count != null && <span className="font-medium tabular-nums text-foreground">{count}</span>}
    </span>
  )
}
