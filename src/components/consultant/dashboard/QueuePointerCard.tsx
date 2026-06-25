'use client'

import Link from 'next/link'
import { ArrowRight, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/Skeleton'

/**
 * Right-rail pointer into the reactive review queue. Shows the open count and
 * the oldest item's age, then hands off to the full worklist at /consultant/triage.
 * Deliberately a pointer, not a list — the queue is its own page.
 */
export function QueuePointerCard({
  openCount,
  oldestDays,
  isLoading,
  isError,
  onOpen
}: {
  openCount: number
  oldestDays: number | null
  isLoading: boolean
  isError: boolean
  onOpen?: () => void
}) {
  return (
    <section className="rounded-xl bg-card text-card-foreground shadow-xs ring-1 ring-foreground/10">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <FlaskConical className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">Review queue</h2>
          {isLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : isError ? (
            <p className="mt-1 text-sm text-muted-foreground">Unavailable</p>
          ) : (
            <>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums leading-none">
                {openCount}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {openCount === 0
                  ? 'No reports awaiting review'
                  : oldestDays != null && oldestDays > 0
                    ? `open · oldest waited ${oldestDays}d`
                    : `open · ${openCount === 1 ? 'report' : 'reports'} awaiting review`}
              </p>
            </>
          )}
        </div>
      </div>
      <div className="px-4 pb-4">
        <Button asChild variant="outline" size="sm" className="w-full" onClick={onOpen}>
          <Link href="/consultant/triage">
            Open review queue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
