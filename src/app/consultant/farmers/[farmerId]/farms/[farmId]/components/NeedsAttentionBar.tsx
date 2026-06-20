'use client'

import { Check, FlaskConical } from 'lucide-react'
import type { DraftItem, ParamRange } from './farm-config'
import { formatValue } from './farm-helpers'

export interface AbnormalNutrient {
  key: string
  label: string
  value: number
  range: ParamRange
  status: 'low' | 'high'
}

export function NeedsAttentionBar({
  abnormalNutrients,
  draftItems,
  onToggleNutrient,
  soilFlags
}: {
  abnormalNutrients: AbnormalNutrient[]
  draftItems: DraftItem[]
  onToggleNutrient: (nutrientKey: string) => void
  soilFlags: { count: number; evaluated: number }
}) {
  if (abnormalNutrients.length === 0) return null

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 p-3 border-l-4 border-l-amber-400">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2 shrink-0">
          <FlaskConical className="h-4 w-4 text-amber-600" />
          <span className="text-xs font-semibold text-amber-900 dark:text-amber-100">
            Needs attention
          </span>
          <span className="text-[11px] text-amber-700 dark:text-amber-400">
            {
              abnormalNutrients.filter((n) => !draftItems.some((item) => item.nutrient === n.key))
                .length
            }{' '}
            of {abnormalNutrients.length} unaddressed
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {abnormalNutrients.map((n) => {
            const addressed = draftItems.some((item) => item.nutrient === n.key)
            return (
              <button
                type="button"
                key={n.key}
                onClick={() => onToggleNutrient(n.key)}
                className={`group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  addressed
                    ? 'border-border bg-muted text-muted-foreground'
                    : 'border-amber-300 bg-white dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:border-amber-500'
                }`}
              >
                {n.label} <span className="tabular-nums">{formatValue(n.value, n.range)}</span>
                <span className="text-amber-500">{n.status === 'low' ? '↓' : '↑'}</span>
                {addressed ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <Check className="h-3 w-3" />
                    in plan
                  </span>
                ) : (
                  <span className="text-amber-400 group-hover:text-amber-600">+ plan</span>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground ml-auto">
          {soilFlags.evaluated > 0 && (
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
  )
}
