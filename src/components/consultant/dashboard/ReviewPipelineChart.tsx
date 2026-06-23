'use client'

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { TRIAGE_STATUSES, type TriageItem } from '@/lib/consultant-triage-service'
import { statusCounts } from '@/lib/consultant-dashboard-metrics'
import { STATUS_COLORS, STATUS_LABELS, TOOLTIP_CONTENT_STYLE } from './chart-theme'
import { ChartCard, LegendChip, type ChartCardState } from './ChartCard'

/** Single stacked horizontal bar: the Petiole Review pipeline by status. */
export function ReviewPipelineChart({
  items,
  isLoading,
  isError
}: {
  items: TriageItem[]
  isLoading: boolean
  isError: boolean
}) {
  const { counts, total } = statusCounts(items)
  const state: ChartCardState = isLoading
    ? 'loading'
    : isError
      ? 'error'
      : total === 0
        ? 'empty'
        : 'ready'

  const data = [{ name: 'Reviews', ...counts }]
  const ariaLabel = `Review pipeline: ${TRIAGE_STATUSES.map(
    (s) => `${counts[s]} ${STATUS_LABELS[s]}`
  ).join(', ')}`

  return (
    <ChartCard
      title="Review pipeline"
      description="All Petiole Reviews by status"
      state={state}
      emptyHint="No Petiole Reviews yet. New petiole uploads from your farmers appear here."
    >
      <div className="h-12 w-full" role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={TOOLTIP_CONTENT_STYLE} />
            {TRIAGE_STATUSES.map((s, i) => {
              const radius: [number, number, number, number] =
                i === 0
                  ? [4, 0, 0, 4]
                  : i === TRIAGE_STATUSES.length - 1
                    ? [0, 4, 4, 0]
                    : [0, 0, 0, 0]
              return (
                <Bar
                  key={s}
                  dataKey={s}
                  name={STATUS_LABELS[s]}
                  stackId="pipeline"
                  fill={STATUS_COLORS[s]}
                  maxBarSize={36}
                  radius={radius}
                />
              )
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {TRIAGE_STATUSES.map((s) => (
          <LegendChip key={s} color={STATUS_COLORS[s]} label={STATUS_LABELS[s]} count={counts[s]} />
        ))}
      </div>
    </ChartCard>
  )
}
