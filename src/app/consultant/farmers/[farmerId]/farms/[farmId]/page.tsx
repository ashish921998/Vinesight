'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useParams, useSearchParams, redirect } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { LabTestRecord } from '@/types/lab-tests'
import { VisitHistory } from '@/components/consultant/VisitHistory'
import type { FertilizerPlanWithItems } from '@/lib/fertilizer-plan-service'
import type { TriageItem } from '@/lib/consultant-triage-service'
import {
  useConsultantAccess,
  useFarmDetail,
  useFarmLabTests,
  useFarmerProfile,
  useFarmerVisits,
  useFarmPlans,
  useFarmTriage,
  useValidatedFarmerClient
} from '@/hooks/consultant/useConsultantQueries'

import { FarmPageHeader } from './components/FarmPageHeader'
import { FarmPageLoading, FarmPageNotFound } from './components/FarmPageStates'
import { NoReportState } from './components/NoReportState'
import { ReviewPlanTab, type AbnormalNutrient } from './components/ReviewPlanTab'
import { HistoryTable } from './components/HistoryTable'
import { FarmReportFiles } from './components/FarmReportFiles'
import { PETIOLE_RANGES } from './components/farm-config'
import { formatParamKey } from './components/farm-helpers'
import { usePlanEditor } from './components/usePlanEditor'

const EMPTY_LAB_TESTS: LabTestRecord[] = []
const EMPTY_TRIAGE_ITEMS: TriageItem[] = []
const EMPTY_PLANS: FertilizerPlanWithItems[] = []

export default function ConsultantFarmPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const farmerId = params.farmerId as string
  const rawFarmId = parseInt(params.farmId as string, 10)
  const farmId = isNaN(rawFarmId) ? null : rawFarmId
  const initialReviewId = searchParams.get('reviewId')
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(initialReviewId)
  // Last triage snapshot we reconciled the review selection against. Held in a
  // ref because it is never rendered — it only gates the selection correction
  // below — so a useState here would force a pointless second render every time
  // the triage list changes.
  const reconciledTriageRef = useRef<TriageItem[] | null>(null)

  const accessQuery = useConsultantAccess()
  const access = accessQuery.data
  const validationQuery = useValidatedFarmerClient(access, farmerId)
  const isAuthorizedFarmer = validationQuery.data?.isValid === true
  const farmQuery = useFarmDetail(farmId, isAuthorizedFarmer, access)
  const farm = farmQuery.data ?? null
  const isExpectedFarm = Boolean(farm && farm.user_id === farmerId)
  const profileQuery = useFarmerProfile(farmerId, isExpectedFarm)
  const visitsQuery = useFarmerVisits(isExpectedFarm ? access : null, farmerId)
  const labTestsQuery = useFarmLabTests(farmId, isExpectedFarm)
  const plansQuery = useFarmPlans(farmId, isExpectedFarm)
  const triageQuery = useFarmTriage(access, farmId, isExpectedFarm)

  const soilTests = labTestsQuery.data?.soilTests ?? EMPTY_LAB_TESTS
  const petioleTests = labTestsQuery.data?.petioleTests ?? EMPTY_LAB_TESTS
  const farmerName = profileQuery.data?.full_name || 'Farmer'
  const visits = (visitsQuery.data ?? []).filter((visit) => visit.farmId === farmId)
  const triageItems = triageQuery.data ?? EMPTY_TRIAGE_ITEMS
  const plans = plansQuery.data ?? EMPTY_PLANS
  const previousPlan = plans[0] ?? null

  useEffect(() => {
    const error =
      accessQuery.error ??
      validationQuery.error ??
      farmQuery.error ??
      profileQuery.error ??
      visitsQuery.error ??
      labTestsQuery.error ??
      plansQuery.error ??
      triageQuery.error
    if (!error) return

    console.error('Error loading farm data:', error)
    Sentry.captureException(error, {
      tags: { context: 'loadFarmDetail' },
      extra: { farmerId, farmId }
    })
    toast.error(error instanceof Error ? error.message : 'Failed to load farm data')
  }, [
    accessQuery.error,
    validationQuery.error,
    farmQuery.error,
    profileQuery.error,
    visitsQuery.error,
    labTestsQuery.error,
    plansQuery.error,
    triageQuery.error,
    farmerId,
    farmId
  ])

  // Reconcile the selected review against the latest triage list. Done during
  // render (not in an effect) so picking the review doesn't chain into an extra
  // render: the selection is settled before the page commits. We keep the
  // current selection if it's still a real triage item; otherwise fall back to
  // the first pending review (or none). Pattern:
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (triageQuery.isSuccess && triageItems !== reconciledTriageRef.current) {
    reconciledTriageRef.current = triageItems
    const currentIsValid =
      Boolean(selectedReviewId) && triageItems.some((item) => item.id === selectedReviewId)
    if (!currentIsValid) {
      const nextReview = triageItems.find(
        (item) => item.status === 'pending' || item.status === 'in_review'
      )
      setSelectedReviewId(nextReview?.id ?? null)
    }
  }

  const pendingReview = useMemo<TriageItem | null>(() => {
    if (!selectedReviewId) return null
    return triageItems.find((item) => item.id === selectedReviewId) ?? null
  }, [selectedReviewId, triageItems])

  const sortedSoilTests = useMemo(
    () => soilTests.toSorted((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [soilTests]
  )
  const sortedPetioleTests = useMemo(
    () => petioleTests.toSorted((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [petioleTests]
  )

  // Identify the petiole test the review is anchored to, plus the previous one
  // for comparison. If no pending review, default to the most recent test.
  const reviewTest = useMemo(() => {
    if (pendingReview?.petioleTestId != null) {
      const match = sortedPetioleTests.find((t) => t.id === pendingReview.petioleTestId)
      if (match) return match
    }
    return sortedPetioleTests[0]
  }, [pendingReview, sortedPetioleTests])

  const latestSoil = sortedSoilTests[0]

  // Flagged nutrients from the current review report, surfaced in the Workbench bar.
  const abnormalNutrients = useMemo<AbnormalNutrient[]>(() => {
    if (!reviewTest) return []
    const parameters = reviewTest.parameters || {}
    const result: AbnormalNutrient[] = []
    for (const key of Object.keys(parameters)) {
      const value = parameters[key]
      const range = PETIOLE_RANGES[key]
      if (typeof value === 'number' && range) {
        if (value < range.min) {
          result.push({ key, label: formatParamKey(key), value, range, status: 'low' })
        } else if (value > range.max) {
          result.push({ key, label: formatParamKey(key), value, range, status: 'high' })
        }
      }
    }
    return result.sort((a, b) => a.label.localeCompare(b.label))
  }, [reviewTest])

  const hasPendingReview =
    pendingReview?.status === 'pending' || pendingReview?.status === 'in_review'
  const reviewPlan = pendingReview
    ? (plans.find((plan) => plan.petiole_triage_id === pendingReview.id) ?? null)
    : null
  const displayPreviousPlan = reviewPlan ?? previousPlan
  const hasExistingPlan = pendingReview ? reviewPlan !== null : previousPlan !== null
  const draftStorageKey =
    farmId === null ? null : `consultant-plan-draft:${farmId}:${selectedReviewId ?? 'ad-hoc'}`

  const {
    planNote,
    draftItems,
    savingPlan,
    updateDraftItem,
    addDraftItem,
    removeDraftItem,
    onNoteChange,
    sendOrSavePlan
  } = usePlanEditor({
    access: access ?? null,
    farmId,
    farm,
    pendingReview,
    previousPlan,
    plans,
    draftStorageKey,
    plansReady: plansQuery.isSuccess,
    triageReady: triageQuery.isSuccess
  })

  const loading =
    accessQuery.isPending ||
    (Boolean(access) && validationQuery.isPending) ||
    (isAuthorizedFarmer && farmQuery.isPending) ||
    (isExpectedFarm &&
      (profileQuery.isPending ||
        visitsQuery.isPending ||
        labTestsQuery.isPending ||
        plansQuery.isPending ||
        triageQuery.isPending))

  if (loading) {
    return <FarmPageLoading />
  }

  // Authorization & validity guards. Evaluated during render (not in an effect)
  // so an invalid farm or unauthorized access never commits the page before the
  // browser navigates away — no flash of the wrong UI, no broken back-button.
  // redirect() throws, terminating this render.
  if (validationQuery.data && !validationQuery.data.isValid) {
    redirect('/consultant/farmers')
  }
  if (farmId === null) {
    redirect(`/consultant/farmers/${farmerId}`)
  }
  if (farmQuery.isSuccess && (!farm || farm.user_id !== farmerId)) {
    redirect(`/consultant/farmers/${farmerId}`)
  }

  if (!farm) {
    return <FarmPageNotFound farmerId={farmerId} />
  }

  return (
    <div className="space-y-6">
      <FarmPageHeader
        farmerId={farmerId}
        farmerName={farmerName}
        farm={farm}
        farmId={farmId}
        access={access ?? null}
        reviewTest={reviewTest}
        hasPendingReview={hasPendingReview}
      />

      {!reviewTest ? (
        <NoReportState
          soilTestsCount={sortedSoilTests.length}
          petioleTestsCount={sortedPetioleTests.length}
        />
      ) : (
        <Tabs defaultValue="review">
          <TabsList className="inline-grid h-11 grid-cols-2 gap-1 rounded-lg border border-border bg-muted/40 p-1">
            <TabsTrigger
              value="review"
              className="h-9 min-w-36 rounded-md px-4 text-sm font-medium transition-colors hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Review &amp; plan
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="h-9 min-w-36 rounded-md px-4 text-sm font-medium transition-colors hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Farm history
            </TabsTrigger>
          </TabsList>

          <TabsContent value="review" className="mt-4">
            <ReviewPlanTab
              reviewTest={reviewTest}
              sortedPetioleTests={sortedPetioleTests}
              sortedSoilTests={sortedSoilTests}
              latestSoil={latestSoil}
              farm={farm}
              abnormalNutrients={abnormalNutrients}
              draftItems={draftItems}
              planNote={planNote}
              savingPlan={savingPlan}
              hasExistingPlan={hasExistingPlan}
              previousPlan={displayPreviousPlan}
              onUpdateItem={updateDraftItem}
              onAddItem={addDraftItem}
              onRemoveItem={removeDraftItem}
              onNoteChange={onNoteChange}
              onSave={sendOrSavePlan}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="rounded-lg border border-border bg-card p-4 space-y-5">
              <FarmReportFiles farmId={farmId} />
              <HistoryTable soilTests={sortedSoilTests} petioleTests={sortedPetioleTests} />
              <VisitHistory visits={visits} />
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
