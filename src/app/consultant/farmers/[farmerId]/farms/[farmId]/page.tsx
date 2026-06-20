'use client'

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChevronDown,
  Loader2,
  MapPin,
  Grape,
  TestTube,
  Leaf,
  FileImage,
  ExternalLink,
  Check,
  Plus,
  Trash2,
  Send,
  History,
  FlaskConical,
  ClipboardList
} from 'lucide-react'
import { toast } from 'sonner'
import type { LabTestRecord } from '@/types/lab-tests'
import type { TestReportFile } from '@/lib/document-service'
import { getConsultantAccess, type ConsultantAccess } from '@/lib/consultant-access'
import {
  validateFarmerClient,
  getFarmDetail,
  type FarmDetail
} from '@/lib/consultant-query-service'
import { getVisitsForFarmer, type Visit } from '@/lib/consultant-visit-service'
import { RecordVisitDialog } from '@/components/consultant/RecordVisitDialog'
import { VisitHistory } from '@/components/consultant/VisitHistory'
import { SupabaseService } from '@/lib/supabase-service'
import {
  FertilizerPlanService,
  type FertilizerPlanWithItems,
  type FertilizerPlanItem
} from '@/lib/fertilizer-plan-service'
import {
  getTriageItems,
  updateTriageReview,
  type TriageItem
} from '@/lib/consultant-triage-service'

// ---------------------------------------------------------------------------
// Configurable annual soil baseline (decision: compact baseline, replaceable).
// To swap EC for a different property, edit this array only.
// ---------------------------------------------------------------------------
const SOIL_BASELINE_KEYS: string[] = ['ph', 'ec', 'nitrogen', 'phosphorus', 'potassium']

interface ParamRange {
  min: number
  max: number
  /** Full-scale min/max used to position the marker on the track. */
  scaleMin: number
  scaleMax: number
  unit?: string
}

// Annual soil target ranges (configurable baseline).
const SOIL_RANGES: Record<string, ParamRange> = {
  ph: { min: 6.5, max: 7.5, scaleMin: 5.5, scaleMax: 8.5, unit: '' },
  ec: { min: 0.5, max: 1.5, scaleMin: 0, scaleMax: 3, unit: 'dS/m' },
  nitrogen: { min: 140, max: 280, scaleMin: 0, scaleMax: 400, unit: 'kg/ha' },
  phosphorus: { min: 30, max: 60, scaleMin: 0, scaleMax: 100, unit: 'kg/ha' },
  potassium: { min: 140, max: 280, scaleMin: 0, scaleMax: 400, unit: 'kg/ha' }
}

// Petiole target ranges (drives status colour and the optimal zone on the bar).
// Ranges match the bloom-stage standards on the lab petiole analysis report.
const PETIOLE_RANGES: Record<string, ParamRange> = {
  total_nitrogen: { min: 1.01, max: 1.21, scaleMin: 0, scaleMax: 3, unit: '%' },
  nitrate_nitrogen: { min: 700, max: 1000, scaleMin: 0, scaleMax: 2500, unit: 'mg/kg' },
  ammonical_nitrogen: { min: 300, max: 600, scaleMin: 0, scaleMax: 1200, unit: 'mg/kg' },
  phosphorus: { min: 0.31, max: 0.51, scaleMin: 0, scaleMax: 1.2, unit: '%' },
  potassium: { min: 1.51, max: 2.51, scaleMin: 0, scaleMax: 6, unit: '%' },
  calcium: { min: 0.81, max: 1.51, scaleMin: 0, scaleMax: 4, unit: '%' },
  magnesium: { min: 0.25, max: 0.51, scaleMin: 0, scaleMax: 2, unit: '%' },
  sulphur: { min: 0.15, max: 0.51, scaleMin: 0, scaleMax: 1.2, unit: '%' },
  iron: { min: 80, max: 120, scaleMin: 0, scaleMax: 300, unit: 'mg/kg' },
  manganese: { min: 40, max: 100, scaleMin: 0, scaleMax: 200, unit: 'mg/kg' },
  zinc: { min: 30, max: 60, scaleMin: 0, scaleMax: 120, unit: 'mg/kg' },
  copper: { min: 5, max: 15, scaleMin: 0, scaleMax: 40, unit: 'mg/kg' },
  boron: { min: 30, max: 50, scaleMin: 0, scaleMax: 120, unit: 'mg/kg' },
  molybdenum: { min: 0.25, max: 0.51, scaleMin: 0, scaleMax: 1, unit: 'mg/kg' },
  sodium: { min: 0.01, max: 0.51, scaleMin: 0, scaleMax: 1.2, unit: '%' },
  chloride: { min: 0.05, max: 0.25, scaleMin: 0, scaleMax: 0.6, unit: '%' }
}

// Petiole parameter groups, mirroring the lab report layout. Order defines the
// display order in the comparison grid; the grid shows every parameter that
// has a value in at least one report.
const PETIOLE_PARAM_GROUPS: { label: string; keys: string[] }[] = [
  {
    label: 'Major Nutrients',
    keys: ['total_nitrogen', 'nitrate_nitrogen', 'ammonical_nitrogen', 'phosphorus', 'potassium']
  },
  {
    label: 'Secondary Nutrients',
    keys: ['calcium', 'magnesium', 'sulphur']
  },
  {
    label: 'Micro Nutrients',
    keys: ['iron', 'manganese', 'zinc', 'copper', 'boron', 'molybdenum']
  },
  {
    label: 'Other',
    keys: ['sodium', 'chloride']
  }
]

const PLAN_ITEM_UNIT_OPTIONS = ['kg/acre', 'g/acre', 'L/acre', 'ml/acre', 'ppm']

interface DraftItem {
  id: string
  fertilizer_name: string
  quantity: string
  unit: string
  application_method: string
  // Optional tag tracking which flagged nutrient this row was seeded from.
  nutrient?: string
}

function newDraftItem(): DraftItem {
  return {
    id: crypto.randomUUID(),
    fertilizer_name: '',
    quantity: '',
    unit: 'kg/acre',
    application_method: 'Soil application'
  }
}

function draftFromPlanItem(item: FertilizerPlanItem): DraftItem {
  return {
    id: item.id,
    fertilizer_name: item.fertilizer_name,
    quantity: String(item.quantity ?? ''),
    unit: item.unit || 'kg/acre',
    application_method: item.application_method || 'Soil application'
  }
}

// Default recommendations shown as chips in the Workbench "Needs attention" bar.
const NUTRIENT_RECOMMENDATIONS: Record<string, Partial<DraftItem>> = {
  total_nitrogen: {
    fertilizer_name: 'Urea',
    quantity: '25',
    unit: 'kg/acre',
    application_method: 'Drip fertigation'
  },
  potassium: {
    fertilizer_name: '13:0:45 (Potassium Nitrate)',
    quantity: '3',
    unit: 'kg/acre',
    application_method: 'Drip fertigation'
  },
  magnesium: {
    fertilizer_name: 'Magnesium Sulphate',
    quantity: '200',
    unit: 'g/acre',
    application_method: 'Foliar spray'
  },
  zinc: {
    fertilizer_name: 'Zinc Sulphate',
    quantity: '150',
    unit: 'g/acre',
    application_method: 'Foliar spray'
  },
  boron: {
    fertilizer_name: 'Boron 20%',
    quantity: '100',
    unit: 'g/acre',
    application_method: 'Foliar spray'
  },
  calcium: {
    fertilizer_name: 'Calcium Nitrate',
    quantity: '200',
    unit: 'g/acre',
    application_method: 'Foliar spray'
  },
  phosphorus: {
    fertilizer_name: '19:19:19 (NPK)',
    quantity: '2.5',
    unit: 'kg/acre',
    application_method: 'Drip fertigation'
  },
  iron: {
    fertilizer_name: 'Ferrous Sulphate',
    quantity: '100',
    unit: 'g/acre',
    application_method: 'Foliar spray'
  },
  manganese: {
    fertilizer_name: 'Manganese Sulphate',
    quantity: '100',
    unit: 'g/acre',
    application_method: 'Foliar spray'
  },
  copper: {
    fertilizer_name: 'Copper Sulphate',
    quantity: '50',
    unit: 'g/acre',
    application_method: 'Foliar spray'
  },
  sulphur: {
    fertilizer_name: 'Sulphur 90% WDG',
    quantity: '100',
    unit: 'g/acre',
    application_method: 'Foliar spray'
  },
  nitrate_nitrogen: {
    fertilizer_name: 'Calcium Nitrate',
    quantity: '25',
    unit: 'kg/acre',
    application_method: 'Drip fertigation'
  },
  ammonical_nitrogen: {
    fertilizer_name: 'Ammonium Sulphate',
    quantity: '25',
    unit: 'kg/acre',
    application_method: 'Drip fertigation'
  }
}

export default function ConsultantFarmPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const farmerId = params.farmerId as string
  const rawFarmId = parseInt(params.farmId as string, 10)
  const farmId = isNaN(rawFarmId) ? null : rawFarmId
  const reviewIdFromUrl = searchParams.get('reviewId')

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
  const [planTitle, setPlanTitle] = useState('')
  const [planNote, setPlanNote] = useState('')
  const [draftItems, setDraftItems] = useState<DraftItem[]>([newDraftItem()])
  const [removedIds, setRemovedIds] = useState<string[]>([])
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
      if (reviewIdFromUrl) {
        resolvedReview = triageItems.find((t) => t.id === reviewIdFromUrl) ?? null
      }
      if (!resolvedReview) {
        resolvedReview =
          triageItems.find((t) => t.status === 'pending' || t.status === 'in_review') ?? null
      }
      setPendingReview(resolvedReview)

      // Seed the plan editor from the latest plan when one exists.
      if (plans[0]) {
        setPlanTitle(plans[0].title)
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
  }, [farmerId, farmId, router, reviewIdFromUrl])

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

  // Evaluate the latest soil report against the baseline ranges so the status
  // chip reflects the actual values instead of a fixed "all optimal".
  const soilFlags = useMemo(() => {
    const parameters = latestSoil?.parameters
    if (!parameters) return { count: 0, evaluated: 0 }
    let count = 0
    let evaluated = 0
    for (const key of SOIL_BASELINE_KEYS) {
      const value = parameters[key]
      const range = SOIL_RANGES[key]
      if (typeof value === 'number' && range) {
        evaluated++
        if (getStatus(value, range) !== 'optimal') count++
      }
    }
    return { count, evaluated }
  }, [latestSoil])

  // Flagged nutrients from the current review report, surfaced in the Workbench bar.
  const abnormalNutrients = useMemo(() => {
    if (!reviewTest) return []
    const parameters = reviewTest.parameters || {}
    const result: {
      key: string
      label: string
      value: number
      range: ParamRange
      status: 'low' | 'high'
    }[] = []
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
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading farm workspace...</p>
        </div>
      </div>
    )
  }

  if (!farm || farmId === null) {
    return (
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/consultant/farmers">Farmers</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/consultant/farmers/${farmerId}`}>Farmer</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Not found</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MapPin className="h-10 w-10 text-muted-foreground mb-3" />
          <h2 className="text-base font-semibold">Farm not found</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            This farm could not be found or does not belong to this farmer.
          </p>
        </div>
      </div>
    )
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
    // Track items removed from an existing plan so we can delete them on save.
    if (previousPlan?.items.some((i) => i.id === id)) {
      setRemovedIds((prev) => [...prev, id])
    }
  }

  // Toggle a flagged-nutrient chip in the Workbench "Needs attention" bar.
  // If the nutrient is already addressed, remove its seeded row. Otherwise,
  // seed a new plan row with the default recommendation for that nutrient.
  const toggleNutrientChip = (nutrientKey: string) => {
    setDraftItems((prev) => {
      const existing = prev.find((item) => item.nutrient === nutrientKey)
      if (existing) {
        const next = prev.filter((item) => item.nutrient !== nutrientKey)
        return next.length > 0 ? next : [newDraftItem()]
      }
      const recommendation = NUTRIENT_RECOMMENDATIONS[nutrientKey]
      return [
        ...prev,
        {
          ...newDraftItem(),
          ...recommendation,
          nutrient: nutrientKey
        }
      ]
    })
  }

  const handleSendOrSavePlan = async () => {
    if (!access || farmId === null) return

    const validItems = draftItems.filter((i) => i.fertilizer_name.trim() !== '')
    if (validItems.length === 0) {
      toast.error('Add at least one fertilizer item before sending the plan')
      return
    }

    setSavingPlan(true)
    try {
      const title = planTitle.trim() || `Plan for ${farm.name}`

      if (hasExistingPlan && previousPlan) {
        // Save changes to the existing plan (no draft state - edits go live).
        await FertilizerPlanService.updatePlan(previousPlan.id, {
          title,
          notes: planNote.trim() || undefined
        })

        // Reconcile items: delete removed, update existing, add new.
        await Promise.all(removedIds.map((id) => FertilizerPlanService.deletePlanItem(id)))

        const existingItemIds = new Set(previousPlan.items.map((i) => i.id))

        let addedCount = 0
        for (const draft of validItems) {
          if (existingItemIds.has(draft.id)) {
            await FertilizerPlanService.updatePlanItem(draft.id, {
              fertilizer_name: draft.fertilizer_name.trim(),
              quantity: parseFloat(draft.quantity) || 0,
              unit: draft.unit,
              application_method: draft.application_method || null
            })
          } else {
            await FertilizerPlanService.addPlanItem(previousPlan.id, {
              fertilizer_name: draft.fertilizer_name.trim(),
              quantity: parseFloat(draft.quantity) || 0,
              unit: draft.unit,
              application_method: draft.application_method || undefined
            })
            addedCount++
          }
        }

        // Reload the plan so the editor reflects the persisted state.
        const refreshed = await FertilizerPlanService.getPlanById(previousPlan.id)
        if (refreshed) {
          setPreviousPlan(refreshed)
          setDraftItems(
            refreshed.items.length > 0 ? refreshed.items.map(draftFromPlanItem) : [newDraftItem()]
          )
        }
        setRemovedIds([])
        toast.success(
          `Plan updated${addedCount > 0 ? ` (${addedCount} new item${addedCount > 1 ? 's' : ''})` : ''}`
        )
      } else {
        // First plan: create + send. Linked to the source review when present.
        const created = await FertilizerPlanService.createPlan({
          farm_id: farmId,
          organization_id: access.organizationId,
          title,
          notes: planNote.trim() || undefined,
          items: validItems.map((draft) => ({
            fertilizer_name: draft.fertilizer_name.trim(),
            quantity: parseFloat(draft.quantity) || 0,
            unit: draft.unit,
            application_method: draft.application_method || undefined
          }))
        })

        // Mark the Petiole Review as reviewed now that a plan is published.
        if (pendingReview) {
          try {
            await updateTriageReview(access, pendingReview.id, {
              status: 'reviewed',
              recommendation: title
            })
            setPendingReview((prev) => (prev ? { ...prev, status: 'reviewed' } : null))
          } catch (err) {
            console.error('Failed to mark review as reviewed:', err)
            // Non-blocking: the plan is already sent to the farmer.
          }
        }

        setPreviousPlan(created)
        setHasExistingPlan(true)
        setDraftItems(
          created.items.length > 0 ? created.items.map(draftFromPlanItem) : [newDraftItem()]
        )
        toast.success('Plan sent to farmer')
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
      {/* Header */}
      <header className="pb-5 border-b border-border">
        <Breadcrumb className="mb-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/consultant/farmers">Farmers</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/consultant/farmers/${farmerId}`}>{farmerName}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{farm.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold tracking-tight">{farm.name}</h1>
              {hasPendingReview ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  New report to review
                </span>
              ) : reviewTest ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  <Check className="h-3 w-3" />
                  Reviewed
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3 text-zinc-400" />
                {farm.region || 'No region'}
              </span>
              {farm.area && (
                <>
                  <span className="text-border">·</span>
                  <span className="tabular-nums">{farm.area} acres</span>
                </>
              )}
              {farm.crop_variety && (
                <>
                  <span className="text-border">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Grape className="h-3 w-3 text-purple-600" />
                    {farm.crop_variety}
                  </span>
                </>
              )}
              {farm.date_of_pruning && (
                <>
                  <span className="text-border">·</span>
                  <span className="tabular-nums">
                    Pruned{' '}
                    {new Date(farm.date_of_pruning).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </>
              )}
              {reviewTest?.date && (
                <>
                  <span className="text-border">·</span>
                  <span className="tabular-nums">
                    Sample{' '}
                    {new Date(reviewTest.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </>
              )}
            </div>
          </div>

          {access && farmId !== null && (
            <RecordVisitDialog
              access={access}
              farmerId={farmerId}
              farms={[{ id: farmId, name: farm.name }]}
              defaultFarmId={farmId}
              onRecorded={(visit) => setVisits((prev) => [visit, ...prev])}
            />
          )}
        </div>
      </header>

      {/* No petiole test state */}
      {!reviewTest ? (
        <NoReportState
          soilTestsCount={sortedSoilTests.length}
          petioleTestsCount={sortedPetioleTests.length}
        />
      ) : (
        <div className="space-y-4">
          <Tabs defaultValue="review">
            <TabsList>
              <TabsTrigger value="review">Review &amp; plan</TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="review" className="mt-4 space-y-4">
              {/* Workbench bridge: persistent flagged-nutrient chips that seed plan rows */}
              {abnormalNutrients.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 p-3 border-l-4 border-l-amber-400">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex items-center gap-2 shrink-0">
                      <FlaskConical className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                        Needs attention
                      </span>
                      <span className="text-[11px] text-amber-700 dark:text-amber-400">
                        {
                          abnormalNutrients.filter(
                            (n) => !draftItems.some((item) => item.nutrient === n.key)
                          ).length
                        }{' '}
                        of {abnormalNutrients.length} unaddressed
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {abnormalNutrients.map((n) => {
                        const addressed = draftItems.some((item) => item.nutrient === n.key)
                        return (
                          <button
                            key={n.key}
                            onClick={() => toggleNutrientChip(n.key)}
                            className={`group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                              addressed
                                ? 'border-border bg-muted text-muted-foreground'
                                : 'border-amber-300 bg-white dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:border-amber-500'
                            }`}
                          >
                            {n.label}{' '}
                            <span className="tabular-nums">{formatValue(n.value, n.range)}</span>
                            <span className="text-amber-500">{n.status === 'low' ? '↓' : '↑'}</span>
                            {addressed ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600">
                                <Check className="h-3 w-3" />
                                in plan
                              </span>
                            ) : (
                              <span className="text-amber-400 group-hover:text-amber-600">
                                + plan
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground ml-auto">
                      {latestSoil && soilFlags.evaluated > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              soilFlags.count === 0 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          {soilFlags.count === 0
                            ? 'Soil: all optimal'
                            : `Soil: ${soilFlags.count} flag${soilFlags.count === 1 ? '' : 's'}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Workspace: petiole comparison (left) + the plan column (right).
              The right column — new plan, previous plan, soil background — is
              pinned, so all the planning context stays in view while the
              consultant reads the comparison. */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* LEFT: Evidence — the petiole comparison table */}
                <div className="space-y-3">
                  <PetioleComparison
                    reports={sortedPetioleTests}
                    currentReportId={reviewTest?.id ?? null}
                    ranges={PETIOLE_RANGES}
                    paramGroups={PETIOLE_PARAM_GROUPS}
                  />
                </div>

                {/* RIGHT: the new plan, with the previous plan and soil context
                stacked beneath it and pinned, so both stay in view while the
                consultant reads the comparison on the left. */}
                <aside>
                  <div className="lg:sticky lg:top-6 space-y-3">
                    <PlanEditorPanel
                      note={planNote}
                      onNoteChange={setPlanNote}
                      items={draftItems}
                      onUpdateItem={updateDraftItem}
                      onAddItem={addDraftItem}
                      onRemoveItem={removeDraftItem}
                      onSave={handleSendOrSavePlan}
                      saving={savingPlan}
                      hasExistingPlan={hasExistingPlan}
                      abnormalCount={abnormalNutrients.length}
                    />

                    {/* Previous plan — directly under the new plan for at-a-glance
                    comparison of what was prescribed last cycle. */}
                    <Collapsible defaultOpen>
                      <div className="rounded-lg border border-border bg-card overflow-hidden">
                        <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-muted/30 transition-colors [&[data-state=open]>svg]:rotate-180">
                          <SectionLabel>Previous fertilizer plan</SectionLabel>
                          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-4">
                          <PreviousPlanPanel plan={previousPlan} />
                        </CollapsibleContent>
                      </div>
                    </Collapsible>

                    {/* Soil background — kept in the planning column so soil context
                    is readable alongside the petiole comparison. */}
                    <Collapsible>
                      <div className="rounded-lg border border-border bg-card overflow-hidden">
                        <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-muted/30 transition-colors [&[data-state=open]>svg]:rotate-180">
                          <SectionLabel>Soil background</SectionLabel>
                          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-4">
                          <SoilBackgroundPanel
                            test={latestSoil}
                            tests={sortedSoilTests}
                            farm={farm}
                            ranges={SOIL_RANGES}
                            baselineKeys={SOIL_BASELINE_KEYS}
                          />
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  </div>
                </aside>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <div className="rounded-lg border border-border bg-card p-4 space-y-5">
                {farmId !== null && <FarmReportFiles farmId={farmId} />}
                <HistoryTable soilTests={sortedSoilTests} petioleTests={sortedPetioleTests} />
                <VisitHistory visits={visits} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}

// ===========================================================================
// Sub-components
// ===========================================================================

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h2>
  )
}

function formatParamKey(key: string): string {
  const labels: Record<string, string> = {
    ph: 'pH',
    ec: 'EC',
    nitrogen: 'Nitrogen',
    phosphorus: 'Phosphorus',
    potassium: 'Potassium',
    total_nitrogen: 'Total Nitrogen',
    nitrate_nitrogen: 'Nitrate-N',
    ammonical_nitrogen: 'Ammonical-N',
    calcium: 'Calcium',
    magnesium: 'Magnesium',
    sulphur: 'Sulphur',
    iron: 'Iron',
    manganese: 'Manganese',
    zinc: 'Zinc',
    copper: 'Copper',
    boron: 'Boron',
    molybdenum: 'Molybdenum',
    sodium: 'Sodium',
    chloride: 'Chloride'
  }
  return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function getStatus(value: number, range: ParamRange): 'optimal' | 'low' | 'high' {
  if (value < range.min) return 'low'
  if (value > range.max) return 'high'
  return 'optimal'
}

function NoReportState({
  soilTestsCount,
  petioleTestsCount
}: {
  soilTestsCount: number
  petioleTestsCount: number
}) {
  return (
    <div className="rounded-lg border border-dashed border-border p-12 flex flex-col items-center justify-center text-center">
      <div className="flex items-center gap-2 mb-3">
        <FlaskConical className="h-6 w-6 text-muted-foreground/40" />
        <Leaf className="h-6 w-6 text-muted-foreground/40" />
      </div>
      <h2 className="text-base font-semibold">No petiole report to review</h2>
      <p className="mt-1 text-sm text-muted-foreground max-w-md">
        When the farmer uploads a petiole report, it will appear here for review.
        {soilTestsCount > 0 || petioleTestsCount > 0
          ? ` There ${soilTestsCount + petioleTestsCount === 1 ? 'is' : 'are'} ${
              soilTestsCount + petioleTestsCount
            } existing test${soilTestsCount + petioleTestsCount === 1 ? '' : 's'} on record.`
          : ''}
      </p>
    </div>
  )
}

// -- Stage 1: Petiole Comparison (Excel-style grid) -----------------------

function PetioleComparison({
  reports,
  currentReportId,
  ranges,
  paramGroups
}: {
  reports: LabTestRecord[]
  currentReportId?: number | null
  ranges: Record<string, ParamRange>
  paramGroups: { label: string; keys: string[] }[]
}) {
  const sortedReports = useMemo(
    () =>
      [...reports]
        .filter((r) => r.parameters && Object.keys(r.parameters).length > 0)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [reports]
  )

  const currentId = currentReportId ?? sortedReports[0]?.id ?? null

  // Flatten the group keys while preserving group membership for rendering.
  const groupedRows = paramGroups
    .map((g) => ({
      label: g.label,
      keys: g.keys.filter((k) =>
        sortedReports.some((r) => {
          const v = r.parameters?.[k]
          return v !== undefined && v !== null && v !== ''
        })
      )
    }))
    .filter((g) => g.keys.length > 0)

  const totalParams = groupedRows.reduce((acc, g) => acc + g.keys.length, 0)

  // Count abnormal cells across all reports so the consultant gets a heads-up.
  const abnormalCounts = useMemo(() => {
    const counts = new Map<number, number>()
    for (const r of sortedReports) {
      let n = 0
      for (const g of groupedRows) {
        for (const k of g.keys) {
          const v = r.parameters?.[k]
          const range = ranges[k]
          if (typeof v === 'number' && range) {
            const st = getStatus(v, range)
            if (st !== 'optimal') n++
          }
        }
      }
      counts.set(r.id ?? -1, n)
    }
    return counts
  }, [sortedReports, groupedRows, ranges])

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <SectionLabel>Petiole comparison</SectionLabel>
        {totalParams > 0 && (
          <span className="text-[11px] text-muted-foreground">
            {sortedReports.length} report{sortedReports.length !== 1 ? 's' : ''} · {totalParams}{' '}
            parameters
          </span>
        )}
      </div>

      {sortedReports.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No parameter values were extracted from this report.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/40">
                <th className="sticky left-0 z-10 bg-muted/40 px-3 py-2 text-left align-bottom text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border min-w-[140px]">
                  Parameter
                </th>
                {sortedReports.map((r) => {
                  const isCurrent = (r.id ?? null) === currentId
                  const abnormal = abnormalCounts.get(r.id ?? -1) ?? 0
                  return (
                    <th
                      key={r.id ?? `${r.date}-${Math.random()}`}
                      className={`px-3 py-2 text-center align-bottom border-b border-l border-border min-w-[110px] ${
                        isCurrent ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="tabular-nums text-[11px] font-semibold text-foreground">
                          {new Date(r.date).toLocaleDateString(undefined, {
                            day: '2-digit',
                            month: 'short'
                          })}
                        </span>
                        <span className="tabular-nums text-[10px] text-muted-foreground">
                          {new Date(r.date).toLocaleDateString(undefined, {
                            year: 'numeric'
                          })}
                        </span>
                        {isCurrent && (
                          <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary-foreground">
                            Current
                          </span>
                        )}
                        {!isCurrent && abnormal > 0 && (
                          <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                            {abnormal} flag{abnormal !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {groupedRows.map((group, gi) => (
                <Fragment key={group.label}>
                  <tr>
                    <td
                      colSpan={sortedReports.length + 1}
                      className={`sticky left-0 bg-muted/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border ${
                        gi === 0 ? '' : 'border-t'
                      }`}
                    >
                      {group.label}
                    </td>
                  </tr>
                  {group.keys.map((key) => {
                    const range = ranges[key]
                    return (
                      <tr key={key} className="group hover:bg-muted/20">
                        <td className="sticky left-0 z-10 bg-card group-hover:bg-muted/20 px-3 py-1.5 text-left text-[12px] font-medium text-foreground border-b border-border">
                          <div className="flex flex-col">
                            <span>{formatParamKey(key)}</span>
                            {range && (
                              <span className="text-[10px] text-muted-foreground tabular-nums">
                                {range.min}-{range.max} {range.unit}
                              </span>
                            )}
                          </div>
                        </td>
                        {sortedReports.map((r) => {
                          const raw = r.parameters?.[key]
                          const isCurrent = (r.id ?? null) === currentId
                          const isNumeric = typeof raw === 'number'
                          const status = isNumeric && range ? getStatus(raw, range) : 'optimal'
                          const display = isNumeric
                            ? formatValue(raw, range)
                            : raw != null && raw !== ''
                              ? String(raw)
                              : '-'
                          return (
                            <td
                              key={r.id ?? `${r.date}-${key}`}
                              className={`px-3 py-1.5 text-center border-b border-l border-border tabular-nums text-[12px] font-medium ${cellClasses(
                                status,
                                isCurrent
                              )}`}
                              title={
                                isNumeric && range
                                  ? `${formatParamKey(key)}: ${raw} (target ${range.min}-${range.max})`
                                  : undefined
                              }
                            >
                              {display}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-200 dark:bg-amber-900/50" />
          Below target
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-rose-200 dark:bg-rose-900/50" />
          Above target
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary/10 ring-1 ring-primary/30" />
          Current report
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-card ring-1 ring-border" />
          Within target
        </span>
      </div>

      {sortedReports[0]?.notes && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/10 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-500 mb-0.5">
            Lab note (latest report)
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">{sortedReports[0].notes}</p>
        </div>
      )}
    </div>
  )
}

function formatValue(value: number, _range: ParamRange | undefined): string {
  const magnitude = Math.abs(value)
  const decimals = magnitude >= 100 ? 0 : magnitude >= 10 ? 1 : 2
  return value.toFixed(decimals)
}

function cellClasses(status: 'optimal' | 'low' | 'high', isCurrent: boolean): string {
  const statusBg =
    status === 'low'
      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
      : status === 'high'
        ? 'bg-rose-100 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
        : ''
  const currentRing = isCurrent ? 'ring-1 ring-inset ring-primary/30' : ''
  return `${statusBg} ${currentRing}`.trim()
}

// -- Stage 2: Previous Plan ------------------------------------------------

function PreviousPlanPanel({ plan }: { plan: FertilizerPlanWithItems | null }) {
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

// -- Stage 3: Soil Background ---------------------------------------------

function SoilBackgroundPanel({
  test,
  tests,
  farm,
  ranges,
  baselineKeys
}: {
  test: LabTestRecord | undefined
  tests: LabTestRecord[]
  farm: FarmDetail
  ranges: Record<string, ParamRange>
  baselineKeys: string[]
}) {
  const [showAllSoil, setShowAllSoil] = useState(false)
  const parameters = test?.parameters || {}
  const baselineRows = baselineKeys
    .filter((k) => parameters[k] !== undefined && parameters[k] !== null)
    .map((key) => {
      const value = parameters[key]
      const range = ranges[key]
      const isNumeric = typeof value === 'number'
      const status = isNumeric && range ? getStatus(value as number, range) : 'optimal'
      return { paramKey: key, value, range, isNumeric, status }
    })

  const allKeys = Object.keys(parameters).filter(
    (k) => parameters[k] !== undefined && parameters[k] !== null
  )
  const extraKeys = allKeys.filter((k) => !baselineKeys.includes(k))

  return (
    <div className="space-y-3">
      {test?.date && (
        <span className="block text-[11px] text-muted-foreground tabular-nums">
          Tested{' '}
          {new Date(test.date).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
          {tests.length > 1 && (
            <span className="text-muted-foreground/70 ml-1">· {tests.length} reports</span>
          )}
        </span>
      )}

      {!test ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          <TestTube className="h-5 w-5 text-muted-foreground/40 mx-auto mb-2" />
          No soil test on record. Soil context will appear here once a report is uploaded.
        </div>
      ) : (
        <>
          {/* Configurable baseline strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {baselineRows.map((row) => (
              <SoilBaselineCard key={row.paramKey} {...row} />
            ))}
          </div>

          {/* Farm-level soil facts (2x2 — reads cleaner in the narrower column) */}
          <div className="grid grid-cols-2 gap-2">
            <SoilFact label="Texture" value={farm.soil_texture_class} />
            <SoilFact
              label="CEC"
              value={
                farm.cation_exchange_capacity != null
                  ? `${farm.cation_exchange_capacity} meq/100g`
                  : null
              }
            />
            <SoilFact
              label="Bulk density"
              value={farm.bulk_density != null ? `${farm.bulk_density} g/ml` : null}
            />
            <SoilFact
              label="Water retention"
              value={farm.soil_water_retention != null ? `${farm.soil_water_retention} mm/m` : null}
            />
          </div>

          {/* Expandable complete soil results */}
          {extraKeys.length > 0 && (
            <div>
              <button
                onClick={() => setShowAllSoil((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${showAllSoil ? 'rotate-180' : ''}`}
                />
                {showAllSoil ? 'Hide full results' : `View all soil results (${extraKeys.length})`}
              </button>
              {showAllSoil && (
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {extraKeys.map((key) => (
                    <div key={key} className="rounded-md border border-border/60 bg-card px-3 py-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        {formatParamKey(key)}
                      </p>
                      <p className="text-sm font-semibold tabular-nums mt-0.5">
                        {typeof parameters[key] === 'number'
                          ? (parameters[key] as number).toFixed(2)
                          : String(parameters[key])}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(test.report_storage_path || test.report_url) && (
            <ReportLink storagePath={test.report_storage_path} directUrl={test.report_url} />
          )}
        </>
      )}
    </div>
  )
}

function SoilBaselineCard({
  paramKey,
  value,
  range,
  isNumeric,
  status
}: {
  paramKey: string
  value: number | string
  range: ParamRange | undefined
  isNumeric: boolean
  status: 'optimal' | 'low' | 'high'
}) {
  const statusColor =
    status === 'low'
      ? 'text-amber-700 dark:text-amber-500'
      : status === 'high'
        ? 'text-rose-700 dark:text-rose-500'
        : 'text-emerald-700 dark:text-emerald-500'

  return (
    <div className="rounded-md border border-border/60 bg-card px-3 py-2">
      <div className="flex items-baseline justify-between">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
          {formatParamKey(paramKey)}
        </p>
        {isNumeric && range && status !== 'optimal' && (
          <span className={`text-[9px] font-semibold uppercase ${statusColor}`}>
            {status === 'low' ? 'Low' : 'High'}
          </span>
        )}
      </div>
      <p className="text-base font-bold tabular-nums mt-0.5">
        {isNumeric ? (value as number).toFixed(2) : String(value)}
        {range?.unit ? (
          <span className="text-[10px] font-normal text-muted-foreground ml-1">{range.unit}</span>
        ) : null}
      </p>
      {isNumeric && range && (
        <p className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
          Target {range.min}-{range.max}
        </p>
      )}
    </div>
  )
}

function SoilFact({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p
        className={`text-sm font-medium mt-0.5 ${
          value ? 'text-foreground' : 'text-muted-foreground/50 italic'
        }`}
      >
        {value || 'Not set'}
      </p>
    </div>
  )
}

// -- Stage 4: Plan Editor -------------------------------------------------

function PlanEditorPanel({
  note,
  onNoteChange,
  items,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  onSave,
  saving,
  hasExistingPlan,
  abnormalCount
}: {
  note: string
  onNoteChange: (v: string) => void
  items: DraftItem[]
  onUpdateItem: (id: string, patch: Partial<DraftItem>) => void
  onAddItem: () => void
  onRemoveItem: (id: string) => void
  onSave: () => void
  saving: boolean
  hasExistingPlan: boolean
  abnormalCount: number
}) {
  const addressedCount = items.filter((item) => item.nutrient).length
  const allAddressed = abnormalCount > 0 && addressedCount === abnormalCount

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <SectionLabel>
          {hasExistingPlan ? 'Edit fertilizer plan' : 'New fertilizer plan'}
        </SectionLabel>
        {abnormalCount > 0 && (
          <span
            className={`text-[11px] font-medium ${
              allAddressed ? 'text-emerald-600' : 'text-amber-700'
            }`}
          >
            Addresses {addressedCount} of {abnormalCount} flagged
          </span>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Items table - full width */}
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <Label className="text-xs">Fertilizer items</Label>
          <span className="text-[11px] text-muted-foreground/70 tabular-nums">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        <Table className="text-sm">
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="h-auto py-2 px-2 text-center w-8 text-[11px] font-medium text-muted-foreground">
                #
              </TableHead>
              <TableHead className="h-auto py-2 px-2 text-left text-[11px] font-medium text-muted-foreground">
                Fertilizer
              </TableHead>
              <TableHead className="h-auto py-2 px-2 text-right w-24 text-[11px] font-medium text-muted-foreground">
                Qty
              </TableHead>
              <TableHead className="h-auto py-2 px-1.5 text-left w-24 text-[11px] font-medium text-muted-foreground">
                Unit
              </TableHead>
              <TableHead className="h-auto py-2 px-2 text-center w-12 text-[11px] font-medium text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => (
              <PlanItemRow
                key={item.id}
                item={item}
                index={idx}
                onUpdate={(patch) => onUpdateItem(item.id, patch)}
                onRemove={() => onRemoveItem(item.id)}
              />
            ))}
          </TableBody>
        </Table>
        <div className="p-4 pt-2">
          <Button variant="outline" size="sm" onClick={onAddItem} className="w-full border-dashed">
            <Plus className="h-3.5 w-3.5" />
            Add item
          </Button>
        </div>

        {/* Message to farmer */}
        <div className="px-4 pb-3 space-y-1.5">
          <Label htmlFor="plan-note" className="text-xs">
            Message to farmer
          </Label>
          <Input
            id="plan-note"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Short note the farmer will see with this plan"
            className="h-9"
          />
        </div>

        {/* Action footer */}
        <div className="px-4 pb-4 pt-1 flex flex-col gap-1.5 border-t border-border/60 mt-1">
          <Button onClick={onSave} disabled={saving} className="w-full h-10">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {hasExistingPlan ? 'Save changes' : 'Send plan'}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            {hasExistingPlan
              ? 'Changes are sent to the farmer immediately after saving.'
              : 'The farmer will see this plan as soon as you send it.'}
          </p>
        </div>
      </div>
    </div>
  )
}

function PlanItemRow({
  item,
  index,
  onUpdate,
  onRemove
}: {
  item: DraftItem
  index: number
  onUpdate: (patch: Partial<DraftItem>) => void
  onRemove: () => void
}) {
  const [confirmRemove, setConfirmRemove] = useState(false)

  const handleRemove = () => {
    if (!confirmRemove) {
      setConfirmRemove(true)
      setTimeout(() => setConfirmRemove(false), 3000)
      return
    }
    onRemove()
  }

  return (
    <TableRow className="border-b border-border/50 last:border-0 hover:bg-muted/30">
      <TableCell className="p-0 py-2 px-2 text-center align-middle">
        <span className="text-[11px] text-muted-foreground tabular-nums">{index + 1}</span>
      </TableCell>
      <TableCell className="p-0 py-1.5 px-2 align-middle">
        <div className="flex flex-col gap-1">
          {item.nutrient && (
            <span className="inline-flex w-fit items-center rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold px-1.5 py-0.5">
              {formatParamKey(item.nutrient)}
            </span>
          )}
          <Input
            value={item.fertilizer_name}
            onChange={(e) => onUpdate({ fertilizer_name: e.target.value })}
            placeholder="Fertilizer name"
            className="h-8 text-sm px-2"
          />
        </div>
      </TableCell>
      <TableCell className="p-0 py-1.5 px-2 align-middle">
        <Input
          type="number"
          value={item.quantity}
          onChange={(e) => onUpdate({ quantity: e.target.value })}
          placeholder="0"
          className="h-8 text-sm tabular-nums text-right px-2"
        />
      </TableCell>
      <TableCell className="p-0 py-1.5 px-1.5 align-middle">
        <Select value={item.unit} onValueChange={(v) => onUpdate({ unit: v })}>
          <SelectTrigger size="sm" className="text-sm px-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLAN_ITEM_UNIT_OPTIONS.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="p-0 py-1.5 px-2 align-middle">
        <div className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 ${
              confirmRemove
                ? 'text-destructive hover:bg-destructive/10'
                : 'text-muted-foreground hover:text-destructive'
            }`}
            onClick={handleRemove}
            title={confirmRemove ? 'Click again to remove' : 'Remove item'}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

// -- Quick-reference sidebar ----------------------------------------------

// -- Collapsed history ----------------------------------------------------

function HistoryTable({
  soilTests,
  petioleTests
}: {
  soilTests: LabTestRecord[]
  petioleTests: LabTestRecord[]
}) {
  const allTests = useMemo(() => {
    return [
      ...soilTests.map((t) => ({ ...t, _type: 'soil' as const })),
      ...petioleTests.map((t) => ({ ...t, _type: 'petiole' as const }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [soilTests, petioleTests])

  return (
    <div>
      <SectionLabel>Test records</SectionLabel>
      <div className="mt-2 divide-y divide-border rounded-lg border border-border">
        {allTests.map((test) => (
          <div
            key={`${test._type}-${test.id}`}
            className="flex items-center gap-2.5 py-2.5 px-3 hover:bg-muted/20"
          >
            {test._type === 'soil' ? (
              <TestTube className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            ) : (
              <Leaf className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium capitalize">{test._type} test</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {new Date(test.date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
                <span className="mx-1">·</span>
                {Object.keys(test.parameters || {}).length} parameters
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// -- Report files (storage-backed) ---------------------------------------

// Uploaded report filenames are prefixed with an upload timestamp
// (e.g. "1768741676670-kabade-...pdf"); strip it for display.
function prettyReportName(filename: string): string {
  return filename.replace(/^\d+-/, '')
}

function formatFileSize(bytes: number | null): string | null {
  if (!bytes || bytes <= 0) return null
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

// Lists the actual report PDFs in storage for this farm. Files are surfaced
// here (not per test record) because uploads aren't reliably linked back onto
// a record — see the History tab. Each opens its signed URL in a new tab.
function FarmReportFiles({ farmId }: { farmId: number }) {
  const [files, setFiles] = useState<TestReportFile[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    fetch(`/api/test-reports/list?farmId=${farmId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load report files')
        const json = await res.json()
        if (active) setFiles((json.files as TestReportFile[]) ?? [])
      })
      .catch(() => {
        if (active) setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [farmId])

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <SectionLabel>Report files</SectionLabel>
        {files && files.length > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">{files.length} files</span>
        )}
      </div>

      {loading ? (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-border px-3 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading report files…
        </div>
      ) : error ? (
        <div className="mt-2 rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          Couldn’t load report files. Try refreshing.
        </div>
      ) : !files || files.length === 0 ? (
        <div className="mt-2 rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          No uploaded report files for this farm yet.
        </div>
      ) : (
        <div className="mt-2 divide-y divide-border rounded-lg border border-border">
          {files.map((file) => {
            const size = formatFileSize(file.sizeBytes)
            return (
              <div
                key={file.path}
                className="flex items-center justify-between gap-3 py-2.5 px-3 hover:bg-muted/20"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {file.testType === 'soil' ? (
                    <TestTube className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  ) : (
                    <Leaf className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {prettyReportName(file.filename)}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      <span className="capitalize">{file.testType}</span>
                      <span className="mx-1">·</span>
                      {file.uploadedAt
                        ? new Date(file.uploadedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : 'Unknown date'}
                      {size && (
                        <>
                          <span className="mx-1">·</span>
                          {size}
                        </>
                      )}
                    </p>
                  </div>
                </div>
                {file.signedUrl ? (
                  <Button asChild variant="outline" size="sm" className="h-7 shrink-0 gap-1.5">
                    <a href={file.signedUrl} target="_blank" rel="noopener noreferrer">
                      Open PDF
                      <ExternalLink className="size-3" />
                    </a>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="h-7 shrink-0 gap-1.5 border-dashed text-muted-foreground/60"
                  >
                    Unavailable
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// -- Shared bits ----------------------------------------------------------

function ReportLink({
  storagePath,
  directUrl
}: {
  storagePath?: string | null
  directUrl?: string | null
}) {
  const { url, loading } = useReportUrl(storagePath, directUrl)

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading
      </span>
    )
  }

  if (!url) return null

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
    >
      <FileImage className="h-3.5 w-3.5" />
      View soil report
      <ExternalLink className="h-3 w-3" />
    </a>
  )
}

function useReportUrl(
  path?: string | null,
  fallbackUrl?: string | null
): { url: string | null; loading: boolean } {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchUrl = useCallback(async () => {
    if (!path || signedUrl) return
    setLoading(true)
    try {
      const response = await fetch('/api/test-reports/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      })
      if (response.ok) {
        const { signedUrl: signed } = await response.json()
        setSignedUrl(signed)
      }
    } catch (error) {
      console.error('Error loading report:', error)
    } finally {
      setLoading(false)
    }
  }, [path, signedUrl])

  useEffect(() => {
    if (path) fetchUrl()
  }, [path, fetchUrl])

  // A storage path must be signed; otherwise fall back to a legacy direct
  // report_url (already openable, no signing or fetch needed).
  const url = path ? signedUrl : (fallbackUrl ?? null)
  return { url, loading: path ? loading : false }
}

// Inline helper to fetch farmer profile for the farm page header.
async function supabaseGetFarmerProfile(farmerId: string) {
  const { getTypedSupabaseClient } = await import('@/lib/supabase')
  const supabase = await getTypedSupabaseClient()
  const { data } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', farmerId)
    .maybeSingle()
  return data
}
