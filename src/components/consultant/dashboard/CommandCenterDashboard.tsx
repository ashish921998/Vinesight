'use client'

import { type ReactNode, useMemo } from 'react'
import { type ConsultantAccess } from '@/lib/consultant-access'
import {
  useFarmerClients,
  useOrgAdherence,
  useOrgMembers,
  useOrgNutrientStatus,
  useTriageItems
} from '@/hooks/consultant/useConsultantQueries'
import {
  adherenceSummary,
  avgTimeToReviewDays,
  openReviewCount
} from '@/lib/consultant-dashboard-metrics'
import { KpiStrip, type KpiTile } from './KpiStrip'
import { ReviewPipelineChart } from './ReviewPipelineChart'
import { IncomingSeverityChart } from './IncomingSeverityChart'
import { ReviewThroughputChart } from './ReviewThroughputChart'
import { NutrientStatusChart } from './NutrientStatusChart'
import { TeamWorkloadPanel } from './TeamWorkloadPanel'

/**
 * Command Center analytics layer. Orchestrates the (scoped) queries once and
 * renders: KPI strip → the caller-supplied review worklist → operational charts
 * → nutrient status → team panel (Owner/Admin only). All data auto-scopes to
 * the viewer via the underlying hooks.
 */
export function CommandCenterDashboard({
  access,
  worklist
}: {
  access: ConsultantAccess
  worklist?: ReactNode
}) {
  const triageQuery = useTriageItems(access)
  const clientsQuery = useFarmerClients(access)
  const adherenceQuery = useOrgAdherence(access)
  const nutrientQuery = useOrgNutrientStatus(access)
  // Members are only needed for the Owner/Admin team panel — skip the fetch otherwise.
  const membersQuery = useOrgMembers(access.canViewAllFarmers ? access : null)

  const items = triageQuery.data ?? []
  const clients = clientsQuery.data ?? []
  const members = membersQuery.data ?? []
  const farms = nutrientQuery.data ?? []

  const tiles: KpiTile[] = useMemo(() => {
    // Derive from the query data directly (stable refs from React Query) so the
    // memo doesn't recompute on every render via a fresh `?? []` array.
    const triageItems = triageQuery.data ?? []
    const open = openReviewCount(triageItems)
    const avg = avgTimeToReviewDays(triageItems)
    const adherence = adherenceSummary(adherenceQuery.data)
    const farmerCount = clientsQuery.data?.length ?? 0
    return [
      {
        label: 'Open Petiole Reviews',
        value: triageQuery.isError ? '—' : String(open),
        sub: 'pending + in review',
        loading: triageQuery.isPending
      },
      {
        label: 'Avg time to review',
        value: triageQuery.isError || avg == null ? '—' : `${avg.toFixed(1)} d`,
        sub: 'last 30 days',
        loading: triageQuery.isPending
      },
      {
        label: 'Active farmers',
        value: clientsQuery.isError ? '—' : String(farmerCount),
        sub: access.canViewAllFarmers ? 'in your organization' : 'assigned to you',
        loading: clientsQuery.isPending
      },
      {
        label: 'Recommendation adherence',
        value: adherence.followedPct == null ? '—' : `${Math.round(adherence.followedPct)}%`,
        sub:
          adherence.total === 0
            ? 'no follow-ups yet'
            : `of ${adherence.total} follow-up${adherence.total === 1 ? '' : 's'}`,
        loading: adherenceQuery.isPending
      }
    ]
  }, [
    triageQuery.data,
    triageQuery.isPending,
    triageQuery.isError,
    clientsQuery.data,
    clientsQuery.isError,
    clientsQuery.isPending,
    adherenceQuery.data,
    adherenceQuery.isPending,
    access.canViewAllFarmers
  ])

  return (
    <div className="space-y-4">
      <KpiStrip tiles={tiles} />

      {worklist}

      <div className="grid gap-4 lg:grid-cols-2">
        <ReviewPipelineChart
          items={items}
          isLoading={triageQuery.isPending}
          isError={triageQuery.isError}
        />
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
        <NutrientStatusChart
          farms={farms}
          isLoading={nutrientQuery.isPending}
          isError={nutrientQuery.isError}
        />
      </div>

      {access.canViewAllFarmers && (
        <TeamWorkloadPanel
          items={items}
          members={members}
          clients={clients}
          isLoading={triageQuery.isPending || membersQuery.isPending}
          isError={triageQuery.isError || membersQuery.isError}
        />
      )}
    </div>
  )
}
