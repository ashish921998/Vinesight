'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import type { LabTestRecord } from '@/types/lab-tests'
import { getConsultantAccess, type ConsultantAccess } from '@/lib/consultant-access'
import {
  validateFarmerClient,
  getFarmDetail,
  type FarmDetail
} from '@/lib/consultant-query-service'
import { getVisitsForFarmer, type Visit } from '@/lib/consultant-visit-service'
import { VisitHistory } from '@/components/consultant/VisitHistory'
import { SupabaseService } from '@/lib/supabase-service'
import { FertilizerPlanService, type FertilizerPlanWithItems } from '@/lib/fertilizer-plan-service'
import { getTriageItems, type TriageItem } from '@/lib/consultant-triage-service'

import { FarmPageHeader } from './components/FarmPageHeader'
import { FarmPageLoading, FarmPageNotFound } from './components/FarmPageStates'
import { NoReportState } from './components/NoReportState'
import { ReviewPlanTab, type AbnormalNutrient } from './components/ReviewPlanTab'
import { HistoryTable } from './components/HistoryTable'
import { FarmReportFiles } from './components/FarmReportFiles'
import {
  type DraftItem,
  PETIOLE_RANGES,
  draftFromPlanItem,
  newDraftItem
} from './components/farm-config'
import { formatParamKey, supabaseGetFarmerProfile } from './components/farm-helpers'

export default function ConsultantFarmPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const farmerId = params.farmerId as string
  const rawFarmId = parseInt(params.farmId as string, 10)
  const farmId = isNaN(rawFarmId) ? null : rawFarmId
  const [initialReviewId] = useState(() => searchParams.get('reviewId'))

  const [loading, setLoading] = useState(true)
  const [farm, setFarm] = useState<FarmDetail | null>(null)
  const [soilTests, setSoilTests] = useState<LabTestRecord[]>([])
  const [petioleTests, setPetioleTests] = useState<LabTestRecord[]>([])
  const [farmerName, setFarmerName] = useState<string>('')
  const [access, setAccess] = useState<ConsultantAccess | null>(null)
  const [visits, setVisits] = useState<Visit[]>([])
  const [pendingReview, setPendingReview] = useState<TriageItem | null>(null)
  const [previousPlan, setPreviousPlan] = useState<FertilizerPlanWithItems | null>(null)

  // Plan editor state
  const [planNote, setPlanNote] = useState('')
  const [draftItems, setDraftItems] = useState<DraftItem[]>([newDraftItem()])
  const [savingPlan, setSavingPlan] = useState(false)
  const [hasExistingPlan, setHasExistingPlan] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)

      const accessResult = await getConsultantAccess()
      if (!accessResult) {
        toast.error('Not authenticated')
        return
      }
      setAccess(accessResult)

      const validation = await validateFarmerClient(accessResult, farmerId)
      if (!validation.isValid) {
        toast.error('Farmer not found or not authorized')
        router.push('/consultant/farmers')
        return
      }

      if (farmId === null) {
        toast.error('Invalid farm ID')
        router.push(`/consultant/farmers/${farmerId}`)
        return
      }

      const farmData = await getFarmDetail(farmId)
      if (!farmData || farmData.user_id !== farmerId) {
        toast.error('Farm not found or does not belong to this farmer')
        router.push(`/consultant/farmers/${farmerId}`)
        return
      }

      setFarm(farmData)

      const [soilTestsData, petioleTestsData, profile, allVisits, plans, triageItems] =
        await Promise.all([
          SupabaseService.getSoilTestRecords(farmId),
          SupabaseService.getPetioleTestRecords(farmId),
          supabaseGetFarmerProfile(farmerId),
          getVisitsForFarmer(accessResult, farmerId),
          FertilizerPlanService.getPlansByFarm(farmId),
          getTriageItems(accessResult, { farmId })
        ])

      setSoilTests((soilTestsData || []) as LabTestRecord[])
      setPetioleTests((petioleTestsData || []) as LabTestRecord[])
      setFarmerName(profile?.full_name || 'Farmer')
      setVisits(allVisits.filter((v) => v.farmId === farmId))
      setPreviousPlan(plans[0] ?? null)

      // Resolve the Petiole Review this page is opening on. Priority:
      //   1. explicit ?reviewId= from the Command Center deep-link;
      //   2. newest pending review for this farm;
      //   3. none (page opens on the latest completed review / read mode).
      let resolvedReview: TriageItem | null = null
      if (initialReviewId) {
        resolvedReview = triageItems.find((t) => t.id === initialReviewId) ?? null
      }
      if (!resolvedReview) {
        resolvedReview =
          triageItems.find((t) => t.status === 'pending' || t.status === 'in_review') ?? null
      }
      setPendingReview(resolvedReview)

      // Seed the plan editor from the latest plan when one exists.
      if (plans[0]) {
        setPlanNote(plans[0].notes ?? '')
        setDraftItems(
          plans[0].items.length > 0 ? plans[0].items.map(draftFromPlanItem) : [newDraftItem()]
        )
      }
    } catch (error) {
      console.error('Error loading farm data:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load farm data')
    } finally {
      setLoading(false)
    }
  }, [farmerId, farmId, router, initialReviewId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Keep the editor's plan mode in sync with the loaded plan.
  useEffect(() => {
    setHasExistingPlan(previousPlan !== null)
  }, [previousPlan])

  const sortedSoilTests = useMemo(
    () => [...soilTests].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [soilTests]
  )
  const sortedPetioleTests = useMemo(
    () => [...petioleTests].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
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

  if (loading) {
    return <FarmPageLoading />
  }

  if (!farm || farmId === null) {
    return <FarmPageNotFound farmerId={farmerId} />
  }

  // -- Plan editor handlers -------------------------------------------------

  const updateDraftItem = (id: string, patch: Partial<DraftItem>) => {
    setDraftItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const addDraftItem = () => {
    setDraftItems((prev) => [...prev, newDraftItem()])
  }

  const removeDraftItem = (id: string) => {
    setDraftItems((prev) => {
      const next = prev.filter((item) => item.id !== id)
      return next.length > 0 ? next : [newDraftItem()]
    })
  }

  const handleSendOrSavePlan = async () => {
    if (!access || farmId === null) return

    const validItems = draftItems
      .filter((i) => i.fertilizer_name.trim() !== '')
      .map((i) => ({ ...i, quantity: parseFloat(i.quantity) || 0 }))
    if (validItems.length === 0) {
      toast.error('Add at least one fertilizer item before sending the plan')
      return
    }
    const invalidQuantity = validItems.find((i) => i.quantity <= 0)
    if (invalidQuantity) {
      toast.error(
        `Enter a quantity greater than zero for "${invalidQuantity.fertilizer_name.trim()}"`
      )
      return
    }

    setSavingPlan(true)
    try {
      const title = `Plan for ${farm.name}`

      if (hasExistingPlan && previousPlan) {
        // Atomic edit: title/notes + full item replacement in one transaction
        // (RPC update_fertilizer_plan). Prevents a failed edit from leaving
        // some items changed and others stale.
        const refreshed = await FertilizerPlanService.updatePlanAtomic({
          planId: previousPlan.id,
          title,
          notes: planNote.trim() || undefined,
          items: validItems.map((draft) => ({
            fertilizer_name: draft.fertilizer_name.trim(),
            quantity: draft.quantity,
            unit: draft.unit,
            application_method: draft.application_method || undefined
          }))
        })

        setPreviousPlan(refreshed)
        setDraftItems(
          refreshed.items.length > 0 ? refreshed.items.map(draftFromPlanItem) : [newDraftItem()]
        )
        toast.success('Plan updated')
      } else if (pendingReview) {
        // First plan linked to a Petiole Review: create + send atomically via the
        // send_fertilizer_plan RPC, which sets petiole_triage_id and flips the
        // review to 'reviewed' in one transaction. A plan can never reach the
        // farmer while its review stays pending in the queue.
        const created = await FertilizerPlanService.sendPlan({
          reviewId: pendingReview.id,
          title,
          notes: planNote.trim() || undefined,
          items: validItems.map((draft) => ({
            fertilizer_name: draft.fertilizer_name.trim(),
            quantity: draft.quantity,
            unit: draft.unit,
            application_method: draft.application_method || undefined
          }))
        })

        setPendingReview((prev) => (prev ? { ...prev, status: 'reviewed' } : null))
        setPreviousPlan(created)
        setHasExistingPlan(true)
        setDraftItems(
          created.items.length > 0 ? created.items.map(draftFromPlanItem) : [newDraftItem()]
        )
        toast.success('Plan sent to farmer')
      } else {
        // Ad-hoc plan with no source review (no pendingReview on this farm).
        const created = await FertilizerPlanService.createPlan({
          farm_id: farmId,
          organization_id: access.organizationId,
          title,
          notes: planNote.trim() || undefined,
          items: validItems.map((draft) => ({
            fertilizer_name: draft.fertilizer_name.trim(),
            quantity: draft.quantity,
            unit: draft.unit,
            application_method: draft.application_method || undefined
          }))
        })

        setPreviousPlan(created)
        setHasExistingPlan(true)
        setDraftItems(
          created.items.length > 0 ? created.items.map(draftFromPlanItem) : [newDraftItem()]
        )
        toast.success('Plan saved')
      }
    } catch (error) {
      console.error('Failed to save plan:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save plan')
    } finally {
      setSavingPlan(false)
    }
  }

  return (
    <div className="space-y-6">
      <FarmPageHeader
        farmerId={farmerId}
        farmerName={farmerName}
        farm={farm}
        farmId={farmId}
        access={access}
        reviewTest={reviewTest}
        hasPendingReview={hasPendingReview}
        onVisitRecorded={(visit) => setVisits((prev) => [visit, ...prev])}
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
              previousPlan={previousPlan}
              onUpdateItem={updateDraftItem}
              onAddItem={addDraftItem}
              onRemoveItem={removeDraftItem}
              onNoteChange={setPlanNote}
              onSave={handleSendOrSavePlan}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="rounded-lg border border-border bg-card p-4 space-y-5">
              {farmId !== null && <FarmReportFiles farmId={farmId} />}
              <HistoryTable soilTests={sortedSoilTests} petioleTests={sortedPetioleTests} />
              <VisitHistory visits={visits} />
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
