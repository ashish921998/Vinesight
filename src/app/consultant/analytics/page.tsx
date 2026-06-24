'use client'

import { useEffect, useRef } from 'react'
import posthog from 'posthog-js'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/Skeleton'
import { roleLabels } from '@/lib/consultant-access'
import {
  useConsultantAccess,
  useOrgAdherence,
  useOrgNutrientStatus,
  useTriageItems
} from '@/hooks/consultant/useConsultantQueries'
import type { TriageItem } from '@/lib/consultant-triage-service'
import type { FarmPetioleSnapshot } from '@/lib/consultant-dashboard-metrics'
import { NutrientStatusChart } from '@/components/consultant/dashboard/NutrientStatusChart'
import { IncomingSeverityChart } from '@/components/consultant/dashboard/IncomingSeverityChart'
import { ReviewThroughputChart } from '@/components/consultant/dashboard/ReviewThroughputChart'
import { ReviewPipelineChart } from '@/components/consultant/dashboard/ReviewPipelineChart'
import { AdherenceChart } from '@/components/consultant/dashboard/AdherenceChart'

// Stable empty refs so the chart props don't get a fresh [] every render before
// the underlying queries resolve.
const EMPTY_ITEMS: TriageItem[] = []
const EMPTY_FARMS: FarmPetioleSnapshot[] = []

/**
 * Organization-wide trends — a "study the book of farms" surface, explicitly
 * NOT daily work (that lives on the Overview + Petiole Review). It rehomes the
 * charts pulled off the Overview so the lead agronomist can study portfolio
 * patterns. Earns-its-keep: instrumented with a page-view event so it can be
 * cut if it goes unused after launch.
 */
export default function ConsultantAnalyticsPage() {
  const accessQuery = useConsultantAccess()
  const access = accessQuery.data ?? null
  const triageQuery = useTriageItems(access)
  const nutrientQuery = useOrgNutrientStatus(access)
  const adherenceQuery = useOrgAdherence(access)

  const items = triageQuery.data ?? EMPTY_ITEMS
  const farms = nutrientQuery.data ?? EMPTY_FARMS

  // Page-view instrumentation (the earns-its-keep check). Fire once per resolved
  // scope when access lands — keyed off access, not the data queries, so an
  // empty/cold-start org still records that the page was opened.
  const capturedScopeRef = useRef<string | null>(null)
  useEffect(() => {
    if (!accessQuery.isSuccess || !access) return
    const scopeKey = `${access.organizationId}:${access.role}`
    if (capturedScopeRef.current === scopeKey) return
    capturedScopeRef.current = scopeKey
    posthog.capture('consultant_analytics_viewed', {
      org_id: access.organizationId,
      role: access.role,
      can_view_all_farmers: access.canViewAllFarmers
    })
  }, [accessQuery.isSuccess, access])

  if (accessQuery.isPending) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (accessQuery.isError || !access) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Access unavailable. Please refresh or return to the dashboard.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Analytics</h1>
          <Badge variant="secondary">{roleLabels[access.role]}</Badge>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Organization-wide trends across your book of farms — nutrient status, review flow, and
          recommendation adherence. A place to study patterns, not daily work.
        </p>
      </div>

      {/* Hero: the signature nutrient-status chart, full width. */}
      <NutrientStatusChart
        farms={farms}
        isLoading={nutrientQuery.isPending}
        isError={nutrientQuery.isError}
      />

      {/* 2×2 grid of the operational charts (per the locked mockup). */}
      <div className="grid gap-4 lg:grid-cols-2">
        <IncomingSeverityChart
          items={items}
          isLoading={triageQuery.isPending}
          isError={triageQuery.isError}
        />
        <ReviewThroughputChart
          items={items}
          isLoading={triageQuery.isPending}
          isError={triageQuery.isError}
        />
        <ReviewPipelineChart
          items={items}
          isLoading={triageQuery.isPending}
          isError={triageQuery.isError}
        />
        <AdherenceChart
          counts={adherenceQuery.data}
          isLoading={adherenceQuery.isPending}
          isError={adherenceQuery.isError}
        />
      </div>
    </div>
  )
}
