'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { TRIAGE_SEVERITIES, type TriageItem } from '@/lib/consultant-triage-service'
import { severityCounts } from '@/lib/consultant-dashboard-metrics'
import {
  AXIS_TICK,
  GRID_STROKE,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  TOOLTIP_CONTENT_STYLE
} from './chart-theme'
import { ChartCard, type ChartCardState } from './ChartCard'

/** Severity profile of classified Petiole Reviews (severity is set on review). */
export function IncomingSeverityChart({
  items,
  isLoading,
  isError
}: {
  items: TriageItem[]
  isLoading: boolean
  isError: boolean
}) {
  const { counts, classifiedTotal } = severityCounts(items)
  const state: ChartCardState = isLoading
    ? 'loading'
    : isError
      ? 'error'
      : classifiedTotal === 0
        ? 'empty'
        : 'ready'

  const data = TRIAGE_SEVERITIES.map((s) => ({
    key: s,
    label: SEVERITY_LABELS[s],
    count: counts[s]
  }))
  const ariaLabel = `Severity mix: ${data.map((d) => `${d.count} ${d.label}`).join(', ')}`

  return (
    <ChartCard
      title="Severity mix"
      description="Classified reviews by severity"
      state={state}
      emptyHint="Severity appears once you classify reviews."
    >
      <div className="h-48 w-full" role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis
              allowDecimals={false}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={TOOLTIP_CONTENT_STYLE} />
            <Bar dataKey="count" name="Reviews" radius={[4, 4, 0, 0]} maxBarSize={64}>
              {data.map((d) => (
                <Cell key={d.key} fill={SEVERITY_COLORS[d.key]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
