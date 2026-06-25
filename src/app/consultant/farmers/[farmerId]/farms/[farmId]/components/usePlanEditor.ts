'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ConsultantAccess } from '@/lib/consultant-access'
import { consultantKeys } from '@/lib/consultant-query-keys'
import {
  FertilizerPlanService,
  type FertilizerPlanWithItems,
  type PlanItemInput
} from '@/lib/fertilizer-plan-service'
import type { TriageItem } from '@/lib/consultant-triage-service'
import type { FarmDetail } from '@/lib/consultant-query-service'
import { farmerScope } from '@/hooks/consultant/useConsultantQueries'
import { type DraftItem, draftFromPlanItem, newDraftItem } from './farm-config'

interface StoredPlanDraft {
  note: string
  items: DraftItem[]
}

interface UsePlanEditorArgs {
  access: ConsultantAccess | null
  farmId: number | null
  farm: FarmDetail | null
  pendingReview: TriageItem | null
  previousPlan: FertilizerPlanWithItems | null
  plans: FertilizerPlanWithItems[]
  draftStorageKey: string | null
  plansReady: boolean
  triageReady: boolean
}

/**
 * Owns the fertilizer-plan workbench state: the editable draft rows, the free-
 * text note, sessionStorage persistence of unsaved edits, and the save/send
 * mutation (including its React Query cache updates). Extracted from the farm
 * page so the page stays a thin orchestration layer over its data hooks.
 */
export function usePlanEditor({
  access,
  farmId,
  farm,
  pendingReview,
  previousPlan,
  plans,
  draftStorageKey,
  plansReady,
  triageReady
}: UsePlanEditorArgs) {
  const queryClient = useQueryClient()

  const [planNote, setPlanNote] = useState('')
  const [draftItems, setDraftItems] = useState<DraftItem[]>([newDraftItem()])

  // Tracks whether the draft has unsaved edits. It is read only inside the
  // persist effect below — never on the render path — so it is a ref rather
  // than state: mutating it must NOT trigger a re-render.
  const draftDirtyRef = useRef(false)
  const initializedDraftKeyRef = useRef<string | null>(null)

  // Hydrate the editor from sessionStorage (unsaved edits) or, failing that,
  // the farm's latest plan — whenever the storage key (farm + review) changes.
  useEffect(() => {
    if (!draftStorageKey || !plansReady || !triageReady) return
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
      // Seed from the active review's own plan when one exists; otherwise fall
      // back to the farm's newest plan. Using previousPlan unconditionally
      // would seed from an unrelated newer plan and, on save, overwrite the
      // review's actual plan (updatePlanAtomic uses reviewPlan.id).
      const seedPlan = pendingReview
        ? (plans.find((p) => p.petiole_triage_id === pendingReview.id) ?? previousPlan)
        : previousPlan
      setPlanNote(seedPlan?.notes ?? '')
      setDraftItems(
        seedPlan?.items.length ? seedPlan.items.map(draftFromPlanItem) : [newDraftItem()]
      )
    }
    draftDirtyRef.current = false
    initializedDraftKeyRef.current = draftStorageKey
  }, [draftStorageKey, plansReady, previousPlan, plans, pendingReview, triageReady])

  // Persist unsaved edits to sessionStorage. Triggered by draftItems/planNote
  // changing; gated on draftDirtyRef so we never write back the just-hydrated
  // values. draftDirtyRef is intentionally absent from the dependency array —
  // refs are stable and must not drive effect scheduling.
  useEffect(() => {
    if (!draftDirtyRef.current || !draftStorageKey) return
    if (initializedDraftKeyRef.current !== draftStorageKey) return

    const draft: StoredPlanDraft = { note: planNote, items: draftItems }
    sessionStorage.setItem(draftStorageKey, JSON.stringify(draft))
  }, [draftItems, draftStorageKey, planNote])

  const savePlanMutation = useMutation({
    mutationFn: async (items: PlanItemInput[]) => {
      if (!access || farmId === null || !farm) throw new Error('Farm is unavailable')
      const title = `Plan for ${farm.name}`
      const notes = planNote.trim() || undefined

      // If we're working within a pending review, the plan must belong to THAT
      // review: update the review's existing plan in place, or send a new one
      // (which also flips the review to 'reviewed'). Reaching for the farm's
      // newest plan here would overwrite a prior review's plan and leave the
      // current review stuck pending — petiole_triage_id is what ties them.
      if (pendingReview) {
        const reviewPlan = plans.find((plan) => plan.petiole_triage_id === pendingReview.id) ?? null
        if (reviewPlan) {
          const plan = await FertilizerPlanService.updatePlanAtomic({
            planId: reviewPlan.id,
            title,
            notes,
            items
          })
          return { plan, action: 'updated' as const, reviewId: null }
        }
        const plan = await FertilizerPlanService.sendPlan({
          reviewId: pendingReview.id,
          title,
          notes,
          items
        })
        return { plan, action: 'sent' as const, reviewId: pendingReview.id }
      }

      // No review in flight: edit the farm's latest plan in place, or create one.
      if (previousPlan) {
        const plan = await FertilizerPlanService.updatePlanAtomic({
          planId: previousPlan.id,
          title,
          notes,
          items
        })
        return { plan, action: 'updated' as const, reviewId: null }
      }

      const plan = await FertilizerPlanService.createPlan({
        farm_id: farmId,
        organization_id: access.organizationId,
        title,
        notes,
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
      draftDirtyRef.current = false
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

  const updateDraftItem = (id: string, patch: Partial<DraftItem>) => {
    draftDirtyRef.current = true
    setDraftItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const addDraftItem = () => {
    draftDirtyRef.current = true
    setDraftItems((prev) => [...prev, newDraftItem()])
  }

  const removeDraftItem = (id: string) => {
    draftDirtyRef.current = true
    setDraftItems((prev) => {
      const next = prev.filter((item) => item.id !== id)
      return next.length > 0 ? next : [newDraftItem()]
    })
  }

  const onNoteChange = (value: string) => {
    draftDirtyRef.current = true
    setPlanNote(value)
  }

  const sendOrSavePlan = async () => {
    if (!access || farmId === null) return

    const validItems: Array<Omit<DraftItem, 'quantity'> & { quantity: number }> = []
    for (const item of draftItems) {
      if (item.fertilizer_name.trim() === '') continue
      validItems.push({ ...item, quantity: parseFloat(item.quantity) || 0 })
    }
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

  return {
    planNote,
    draftItems,
    savingPlan: savePlanMutation.isPending,
    updateDraftItem,
    addDraftItem,
    removeDraftItem,
    onNoteChange,
    sendOrSavePlan
  }
}
