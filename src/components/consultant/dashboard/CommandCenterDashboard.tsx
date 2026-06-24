'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import posthog from 'posthog-js'
import { type ConsultantAccess } from '@/lib/consultant-access'
import {
  useFarmerClients,
  useOrgAdherence,
  useOrgNutrientStatus,
  useOrgPlanTriageLinks,
  useTriageItems
} from '@/hooks/consultant/useConsultantQueries'
import {
  adherenceSummary,
  buildCallList,
  buildFindings,
  farmsWithDeficiency,
  goneQuietFarmers,
  nutrientStatusAcrossFarms,
  oldestOpenReviewDays,
  openReviewCount,
  reviewedNoPlan,
  type CallListRow,
  type CallReason,
  type FarmContactRef,
  type Finding
} from '@/lib/consultant-dashboard-metrics'
import { ImpressionBand } from './ImpressionBand'
import { FarmersToContact } from './FarmersToContact'
import { QueuePointerCard } from './QueuePointerCard'
import { PracticeSnapshot } from './PracticeSnapshot'
import { PortfolioNutrientsBar } from './PortfolioNutrientsBar'

/**
 * The consultant Overview — a proactive daily panel. Complements (does not
 * duplicate) the reactive Petiole Review queue by surfacing what the queue is
 * blind to: farmers gone quiet, reviews left without a plan. Everything is
 * derived client-side from the existing scoped queries; no new RPC.
 */
export function CommandCenterDashboard({ access }: { access: ConsultantAccess }) {
  const triageQuery = useTriageItems(access)
  const clientsQuery = useFarmerClients(access)
  const adherenceQuery = useOrgAdherence(access)
  const nutrientQuery = useOrgNutrientStatus(access)
  const plansQuery = useOrgPlanTriageLinks(access)

  const [callListFilter, setCallListFilter] = useState<CallReason | null>(null)

  // farm_id → farmer/village context, joined from the clients query in memory.
  const farmIndex = useMemo(() => {
    const map = new Map<number, FarmContactRef>()
    for (const client of clientsQuery.data ?? []) {
      for (const farm of client.farms) {
        map.set(farm.id, {
          clientUserId: client.id,
          farmerName: client.full_name,
          village: farm.region,
          farmName: farm.name
        })
      }
    }
    return map
  }, [clientsQuery.data])

  const goneQuiet = useMemo(() => goneQuietFarmers(nutrientQuery.data ?? []), [nutrientQuery.data])

  // Only trust the reviewed-no-plan diff once the plans actually loaded — an
  // errored/pending plans query would otherwise flag plans that DO exist.
  const reviewed = useMemo(() => {
    if (!plansQuery.isSuccess) return []
    const planTriageIds = new Set(plansQuery.data)
    return reviewedNoPlan(triageQuery.data ?? [], planTriageIds)
  }, [plansQuery.isSuccess, plansQuery.data, triageQuery.data])

  const callList = useMemo(
    () => buildCallList(goneQuiet, reviewed, farmIndex),
    [goneQuiet, reviewed, farmIndex]
  )

  const nutrientRows = useMemo(
    () => nutrientStatusAcrossFarms(nutrientQuery.data ?? []),
    [nutrientQuery.data]
  )
  const withDeficiency = useMemo(
    () => farmsWithDeficiency(nutrientQuery.data ?? []),
    [nutrientQuery.data]
  )

  const openCount = useMemo(() => openReviewCount(triageQuery.data ?? []), [triageQuery.data])
  const oldestDays = useMemo(() => oldestOpenReviewDays(triageQuery.data ?? []), [triageQuery.data])
  const adherence = useMemo(() => adherenceSummary(adherenceQuery.data), [adherenceQuery.data])

  const findings = useMemo(
    () =>
      buildFindings({
        openReviewCount: openCount,
        oldestOpenDays: oldestDays,
        goneQuietCount: goneQuiet.length,
        reviewedNoPlanCount: reviewed.length,
        adherencePct: adherence.followedPct
      }),
    [openCount, oldestDays, goneQuiet.length, reviewed.length, adherence.followedPct]
  )

  // Loading/error roll-ups. Adherence failure degrades gracefully (its finding
  // just drops out), so it never fails the band. A clients failure also leaves
  // the band intact, but the call list CAN'T be built without farmer context —
  // the gone-quiet rows need it to navigate — so a clients error surfaces as a
  // call-list error rather than a false "all clear" that contradicts the band.
  const findingsLoading = triageQuery.isPending || nutrientQuery.isPending || plansQuery.isPending
  const findingsError = triageQuery.isError
  const callListLoading =
    triageQuery.isPending ||
    nutrientQuery.isPending ||
    plansQuery.isPending ||
    clientsQuery.isPending
  const callListError = triageQuery.isError || clientsQuery.isError

  const coreReady =
    !triageQuery.isPending &&
    !nutrientQuery.isPending &&
    plansQuery.isSuccess &&
    !clientsQuery.isPending
  const allCaughtUp = coreReady && !findingsError && findings.length === 0 && callList.length === 0

  const handleScrollToCallList = (filter?: CallReason) => {
    setCallListFilter(filter ?? null)
    if (typeof document !== 'undefined') {
      document
        .getElementById('farmers-to-contact')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleFindingClick = (finding: Finding) => {
    posthog.capture('consultant_overview_finding_clicked', {
      finding_id: finding.id,
      org_id: access.organizationId,
      role: access.role
    })
  }

  const handleContact = (row: CallListRow) => {
    posthog.capture(
      row.reason === 'quiet' ? 'consultant_overview_view_farmer' : 'consultant_overview_issue_plan',
      {
        reason: row.reason,
        farm_id: row.farmId,
        org_id: access.organizationId,
        role: access.role
      }
    )
  }

  const handleQueueOpen = () => {
    posthog.capture('consultant_overview_queue_opened', {
      org_id: access.organizationId,
      role: access.role,
      open_count: openCount
    })
  }

  return (
    <div className="space-y-4">
      {!allCaughtUp && (
        <ImpressionBand
          findings={findings}
          isLoading={findingsLoading}
          isError={findingsError}
          onFindingClick={handleFindingClick}
          onScrollToCallList={handleScrollToCallList}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {allCaughtUp ? (
            <div className="flex flex-col items-center justify-center rounded-xl bg-card px-6 py-16 text-center text-card-foreground shadow-xs ring-1 ring-foreground/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--nutrient-optimal-bg)] text-[var(--nutrient-optimal)]">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="mt-4 font-serif text-lg font-semibold">All caught up</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                No reports waiting and no farmers gone quiet. New petiole uploads and overdue
                samples will surface here.
              </p>
            </div>
          ) : (
            <FarmersToContact
              rows={callList}
              isLoading={callListLoading}
              isError={callListError}
              filter={callListFilter}
              onClearFilter={() => setCallListFilter(null)}
              onContact={handleContact}
            />
          )}
        </div>

        <aside className="space-y-4">
          <QueuePointerCard
            openCount={openCount}
            oldestDays={oldestDays}
            isLoading={triageQuery.isPending}
            isError={triageQuery.isError}
            onOpen={handleQueueOpen}
          />
          <PracticeSnapshot
            activeFarmers={clientsQuery.data?.length ?? 0}
            withDeficiency={withDeficiency}
            quietCount={goneQuiet.length}
            adherencePct={adherence.followedPct}
            isLoading={clientsQuery.isPending || nutrientQuery.isPending}
            isError={clientsQuery.isError}
          />
          <PortfolioNutrientsBar
            rows={nutrientRows}
            isLoading={nutrientQuery.isPending}
            isError={nutrientQuery.isError}
          />
        </aside>
      </div>
    </div>
  )
}
