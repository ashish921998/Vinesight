'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { type TriageItem } from '@/lib/consultant-triage-service'
import {
  MIN_THROUGHPUT_COMPLETED,
  THROUGHPUT_WEEKS,
  throughputTotal,
  weeklyThroughput
} from '@/lib/consultant-dashboard-metrics'
import { AXIS_TICK, GRID_STROKE, SERIES_SLATE, TOOLTIP_CONTENT_STYLE } from './chart-theme'
import { ChartCard, type ChartCardState } from './ChartCard'

/** Reviews completed per week over the trailing window — queue burn-down. */
export function ReviewThroughputChart({
  items,
  isLoading,
  isError
}: {
  items: TriageItem[]
  isLoading: boolean
  isError: boolean
}) {
  const points = weeklyThroughput(items)
  const completed = throughputTotal(points)
  const state: ChartCardState = isLoading
    ? 'loading'
    : isError
      ? 'error'
      : completed < MIN_THROUGHPUT_COMPLETED
        ? 'empty'
        : 'ready'

  const ariaLabel = `Reviews completed per week over the last ${THROUGHPUT_WEEKS} weeks: ${points
    .map((p) => `${p.label}: ${p.count}`)
    .join(', ')}`

  return (
    <ChartCard
      title="Review throughput"
      description={`Reviews completed per week · last ${THROUGHPUT_WEEKS} weeks`}
      state={state}
      emptyHint={`Fewer than ${MIN_THROUGHPUT_COMPLETED} reviews completed — the trend fills in as you clear the queue.`}
    >
      <div className="h-48 w-full" role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={TOOLTIP_CONTENT_STYLE} />
            <Bar
              dataKey="count"
              name="Completed"
              fill={SERIES_SLATE}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
