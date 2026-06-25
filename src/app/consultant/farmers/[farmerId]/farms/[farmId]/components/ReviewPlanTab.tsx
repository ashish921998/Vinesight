'use client'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import type { LabTestRecord } from '@/types/lab-tests'
import type { FarmDetail } from '@/lib/consultant-query-service'
import type { FertilizerPlanWithItems } from '@/lib/fertilizer-plan-service'
import { SectionLabel } from './SectionLabel'
import { PetioleComparison } from './PetioleComparison'
import { PlanEditorPanel } from './PlanEditorPanel'
import { PreviousPlanPanel } from './PreviousPlanPanel'
import { SoilBackgroundPanel } from './SoilBackgroundPanel'
import {
  type DraftItem,
  ParamRange,
  PETIOLE_PARAM_GROUPS,
  PETIOLE_RANGES,
  SOIL_BASELINE_KEYS,
  SOIL_RANGES
} from './farm-config'

export interface AbnormalNutrient {
  key: string
  label: string
  value: number
  range: ParamRange
  status: 'low' | 'high'
}

export function ReviewPlanTab({
  reviewTest,
  sortedPetioleTests,
  sortedSoilTests,
  latestSoil,
  farm,
  abnormalNutrients,
  draftItems,
  planNote,
  savingPlan,
  hasExistingPlan,
  previousPlan,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  onNoteChange,
  onSave
}: {
  reviewTest: LabTestRecord | undefined
  sortedPetioleTests: LabTestRecord[]
  sortedSoilTests: LabTestRecord[]
  latestSoil: LabTestRecord | undefined
  farm: FarmDetail
  abnormalNutrients: AbnormalNutrient[]
  draftItems: DraftItem[]
  planNote: string
  savingPlan: boolean
  hasExistingPlan: boolean
  previousPlan: FertilizerPlanWithItems | null
  onUpdateItem: (id: string, patch: Partial<DraftItem>) => void
  onAddItem: () => void
  onRemoveItem: (id: string) => void
  onNoteChange: (v: string) => void
  onSave: () => void
}) {
  return (
    <div className="space-y-4">
      {/* Soil is decision evidence, so it stays visible above both halves of
      the workspace instead of being buried below the previous plan. */}
      <SoilBackgroundPanel
        test={latestSoil}
        tests={sortedSoilTests}
        farm={farm}
        ranges={SOIL_RANGES}
        baselineKeys={SOIL_BASELINE_KEYS}
      />

      {/* Workspace: petiole comparison (left) + the plan column (right).
      The right column keeps the active and previous prescriptions together. */}
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

        {/* RIGHT: the active plan and the previous prescription. */}
        <aside>
          <div className="lg:sticky lg:top-6 space-y-3">
            <PlanEditorPanel
              note={planNote}
              onNoteChange={onNoteChange}
              items={draftItems}
              onUpdateItem={onUpdateItem}
              onAddItem={onAddItem}
              onRemoveItem={onRemoveItem}
              onSave={onSave}
              saving={savingPlan}
              hasExistingPlan={hasExistingPlan}
              abnormalCount={abnormalNutrients.length}
            />

            {/* Previous plan — directly under the new plan for at-a-glance
            comparison of what was prescribed last cycle. */}
            <Collapsible>
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-muted/30 transition-colors [&[data-state=open]>svg]:rotate-180">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-left">
                    <SectionLabel>Previous fertilizer plan</SectionLabel>
                    {previousPlan && (
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {previousPlan.items.length}{' '}
                        {previousPlan.items.length === 1 ? 'item' : 'items'} ·{' '}
                        {new Date(previousPlan.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4">
                  <PreviousPlanPanel plan={previousPlan} />
                </CollapsibleContent>
              </div>
            </Collapsible>
          </div>
        </aside>
      </div>
    </div>
  )
}
