'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import type { LabTestRecord } from '@/types/lab-tests'
import { VisitHistory } from '@/components/consultant/VisitHistory'
import {
  FertilizerPlanService,
  type FertilizerPlanWithItems,
  type PlanItemInput
} from '@/lib/fertilizer-plan-service'
import type { TriageItem } from '@/lib/consultant-triage-service'
import { consultantKeys } from '@/lib/consultant-query-keys'
import {
  farmerScope,
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
import {
  type DraftItem,
  PETIOLE_RANGES,
  draftFromPlanItem,
  newDraftItem
} from './components/farm-config'
import { formatParamKey } from './components/farm-helpers'

interface StoredPlanDraft {
  note: string
  items: DraftItem[]
}

const EMPTY_LAB_TESTS: LabTestRecord[] = []
const EMPTY_TRIAGE_ITEMS: TriageItem[] = []
const EMPTY_PLANS: FertilizerPlanWithItems[] = []

export default function ConsultantFarmPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const farmerId = params.farmerId as string
  const rawFarmId = parseInt(params.farmId as string, 10)
  const farmId = isNaN(rawFarmId) ? null : rawFarmId
  const initialReviewId = searchParams.get('reviewId')
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(initialReviewId)
  const queryClient = useQueryClient()

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

  // Plan editor state
  const [planNote, setPlanNote] = useState('')
  const [draftItems, setDraftItems] = useState<DraftItem[]>([newDraftItem()])
  const [draftDirty, setDraftDirty] = useState(false)
  const initializedDraftKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (farmId === null) {
      toast.error('Invalid farm ID')
      router.replace(`/consultant/farmers/${farmerId}`)
    }
  }, [farmId, farmerId, router])

  useEffect(() => {
    if (validationQuery.data && !validationQuery.data.isValid) {
      toast.error('Farmer not found or not authorized')
      router.replace('/consultant/farmers')
    }
  }, [router, validationQuery.data])

  useEffect(() => {
    if (farmQuery.isSuccess && (!farm || farm.user_id !== farmerId)) {
      toast.error('Farm not found or does not belong to this farmer')
      router.replace(`/consultant/farmers/${farmerId}`)
    }
  }, [farm, farmQuery.isSuccess, farmerId, router])

  useEffect(() => {
    if (!triageQuery.isSuccess) return
    if (selectedReviewId && triageItems.some((item) => item.id === selectedReviewId)) return
    const review = triageItems.find(
      (item) => item.status === 'pending' || item.status === 'in_review'
    )
    setSelectedReviewId(review?.id ?? null)
  }, [selectedReviewId, triageItems, triageQuery.isSuccess])

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
  const hasExistingPlan = previousPlan !== null
  const draftStorageKey =
    farmId === null ? null : `consultant-plan-draft:${farmId}:${selectedReviewId ?? 'ad-hoc'}`

  useEffect(() => {
    if (!draftStorageKey || !plansQuery.isSuccess || !triageQuery.isSuccess) return
    if (initializedDraftKeyRef.current === draftStorageKey) return

    let storedDraft: StoredPlanDraft | null = null
    try {
      const stored = sessionStorage.getItem(draftStorageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<StoredPlanDraft>
        if (typeof parsed.note === 'string' && Array.isArray(parsed.items)) {
          storedDraft = { note: parsed.note, items: parsed.items }
        }
      }
    } catch {
      sessionStorage.removeItem(draftStorageKey)
    }

    if (storedDraft) {
      setPlanNote(storedDraft.note)
      setDraftItems(storedDraft.items.length > 0 ? storedDraft.items : [newDraftItem()])
    } else {
      setPlanNote(previousPlan?.notes ?? '')
      setDraftItems(
        previousPlan?.items.length ? previousPlan.items.map(draftFromPlanItem) : [newDraftItem()]
      )
    }
    setDraftDirty(false)
    initializedDraftKeyRef.current = draftStorageKey
  }, [draftStorageKey, plansQuery.isSuccess, previousPlan, triageQuery.isSuccess])

  useEffect(() => {
    if (!draftDirty || !draftStorageKey) return
    if (initializedDraftKeyRef.current !== draftStorageKey) return

    const draft: StoredPlanDraft = { note: planNote, items: draftItems }
    sessionStorage.setItem(draftStorageKey, JSON.stringify(draft))
  }, [draftDirty, draftItems, draftStorageKey, planNote])

  const savePlanMutation = useMutation({
    mutationFn: async (items: PlanItemInput[]) => {
      if (!access || farmId === null || !farm) throw new Error('Farm is unavailable')
      const title = `Plan for ${farm.name}`

      if (previousPlan) {
        const plan = await FertilizerPlanService.updatePlanAtomic({
          planId: previousPlan.id,
          title,
          notes: planNote.trim() || undefined,
          items
        })
        return { plan, action: 'updated' as const, reviewId: null }
      }

      if (pendingReview) {
        const plan = await FertilizerPlanService.sendPlan({
          reviewId: pendingReview.id,
          title,
          notes: planNote.trim() || undefined,
          items
        })
        return { plan, action: 'sent' as const, reviewId: pendingReview.id }
      }

      const plan = await FertilizerPlanService.createPlan({
        farm_id: farmId,
        organization_id: access.organizationId,
        title,
        notes: planNote.trim() || undefined,
        items
      })
      return { plan, action: 'saved' as const, reviewId: null }
    },
    onSuccess: ({ plan, action, reviewId }) => {
      if (farmId !== null) {
        queryClient.setQueryData<FertilizerPlanWithItems[]>(
          consultantKeys.farmPlans(farmId),
          (current = []) => [plan, ...current.filter((item) => item.id !== plan.id)]
        )
      }

      if (reviewId && access && farmId !== null) {
        const farmTriageKey = consultantKeys.farmTriage(
          farmId,
          access.organizationId,
          farmerScope(access)
        )
        queryClient.setQueryData<TriageItem[]>(farmTriageKey, (current = []) =>
          current.map((item) =>
            item.id === reviewId ? { ...item, status: 'reviewed' as const } : item
          )
        )
        queryClient.invalidateQueries({ queryKey: farmTriageKey })
        queryClient.invalidateQueries({ queryKey: ['consultant', 'reviewQueue'] })
      }

      setPlanNote(plan.notes ?? '')
      setDraftItems(plan.items.length > 0 ? plan.items.map(draftFromPlanItem) : [newDraftItem()])
      setDraftDirty(false)
      if (draftStorageKey) sessionStorage.removeItem(draftStorageKey)
      toast.success(
        action === 'updated'
          ? 'Plan updated'
          : action === 'sent'
            ? 'Plan sent to farmer'
            : 'Plan saved'
      )
    },
    onError: (error) => {
      console.error('Failed to save plan:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save plan')
    }
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

  if (!farm || farmId === null) {
    return <FarmPageNotFound farmerId={farmerId} />
  }

  // -- Plan editor handlers -------------------------------------------------

  const updateDraftItem = (id: string, patch: Partial<DraftItem>) => {
    setDraftDirty(true)
    setDraftItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const addDraftItem = () => {
    setDraftDirty(true)
    setDraftItems((prev) => [...prev, newDraftItem()])
  }

  const removeDraftItem = (id: string) => {
    setDraftDirty(true)
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

    savePlanMutation.mutate(
      validItems.map((draft) => ({
        fertilizer_name: draft.fertilizer_name.trim(),
        quantity: draft.quantity,
        unit: draft.unit,
        application_method: draft.application_method || undefined
      }))
    )
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
              savingPlan={savePlanMutation.isPending}
              hasExistingPlan={hasExistingPlan}
              previousPlan={previousPlan}
              onUpdateItem={updateDraftItem}
              onAddItem={addDraftItem}
              onRemoveItem={removeDraftItem}
              onNoteChange={(value) => {
                setDraftDirty(true)
                setPlanNote(value)
              }}
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
