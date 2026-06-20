'use client'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import type { LabTestRecord } from '@/types/lab-tests'
import type { FarmDetail } from '@/lib/consultant-query-service'
import type { FertilizerPlanWithItems } from '@/lib/fertilizer-plan-service'
import { SectionLabel } from './SectionLabel'
import { NeedsAttentionBar, type AbnormalNutrient } from './NeedsAttentionBar'
import { PetioleComparison } from './PetioleComparison'
import { PlanEditorPanel } from './PlanEditorPanel'
import { PreviousPlanPanel } from './PreviousPlanPanel'
import { SoilBackgroundPanel } from './SoilBackgroundPanel'
import {
  type DraftItem,
  PETIOLE_PARAM_GROUPS,
  PETIOLE_RANGES,
  SOIL_BASELINE_KEYS,
  SOIL_RANGES
} from './farm-config'

export function ReviewPlanTab({
  reviewTest,
  sortedPetioleTests,
  sortedSoilTests,
  latestSoil,
  farm,
  abnormalNutrients,
  soilFlags,
  draftItems,
  planNote,
  savingPlan,
  hasExistingPlan,
  previousPlan,
  onToggleNutrient,
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
  soilFlags: { count: number; evaluated: number }
  draftItems: DraftItem[]
  planNote: string
  savingPlan: boolean
  hasExistingPlan: boolean
  previousPlan: FertilizerPlanWithItems | null
  onToggleNutrient: (nutrientKey: string) => void
  onUpdateItem: (id: string, patch: Partial<DraftItem>) => void
  onAddItem: () => void
  onRemoveItem: (id: string) => void
  onNoteChange: (v: string) => void
  onSave: () => void
}) {
  return (
    <div className="space-y-4">
      <NeedsAttentionBar
        abnormalNutrients={abnormalNutrients}
        draftItems={draftItems}
        onToggleNutrient={onToggleNutrient}
        soilFlags={latestSoil ? soilFlags : { count: 0, evaluated: 0 }}
      />

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
    </div>
  )
}
