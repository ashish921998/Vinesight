'use client'

// react-doctor-disable-next-line react-doctor/prefer-dynamic-import, prefer-dynamic-import -- recharts drives above-the-fold dashboard charts on an already route-split page; deferring it only adds a loading flash on the primary view
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  MIN_NUTRIENT_FARMS,
  farmsWithPetioleData,
  nutrientStatusAcrossFarms,
  type FarmPetioleSnapshot
} from '@/lib/consultant-dashboard-metrics'
import { NUTRIENT_COLORS, NUTRIENT_LABELS, TOOLTIP_CONTENT_STYLE } from './chart-theme'
import { AXIS_TICK } from './chart-theme'
import { ChartCard, LegendChip, type ChartCardState } from './ChartCard'

/**
 * The signature agronomy chart: for each nutrient, how many farms' latest
 * petiole test reads deficient / optimal / excess — a diverging stacked bar.
 * Honestly labelled: the ranges are bloom-stage norms (see footnote).
 */
export function NutrientStatusChart({
  farms,
  isLoading,
  isError
}: {
  farms: FarmPetioleSnapshot[]
  isLoading: boolean
  isError: boolean
}) {
  const rows = nutrientStatusAcrossFarms(farms)
  const farmCount = farmsWithPetioleData(farms)
  const state: ChartCardState = isLoading
    ? 'loading'
    : isError
      ? 'error'
      : farmCount < MIN_NUTRIENT_FARMS || rows.length === 0
        ? 'empty'
        : 'ready'

  const chartHeight = Math.max(180, rows.length * 30 + 16)
  const ariaLabel = `Nutrient status across ${farmCount} farms. ${rows
    .map((r) => `${r.label}: ${r.deficient} deficient, ${r.optimal} optimal, ${r.excess} excess`)
    .join('; ')}`

  return (
    <ChartCard
      title="Nutrient status across farms"
      description="Latest petiole test per farm"
      state={state}
      emptyHint={`Needs at least ${MIN_NUTRIENT_FARMS} farms with a petiole test. ${farmCount} so far.`}
      footnote={`Each farm's most recent petiole test, judged against bloom-stage norms — farms sampled at other stages are an approximation. Based on ${farmCount} farm${farmCount === 1 ? '' : 's'}.`}
    >
      {/* react-doctor-disable-next-line react-doctor/prefer-tag-over-role, prefer-tag-over-role -- role="img"+aria-label is the correct ARIA pattern for an inline SVG chart; <img> needs a src and can't wrap recharts */}
      <div className="w-full" style={{ height: chartHeight }} role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 8 }}>
            <XAxis
              type="number"
              allowDecimals={false}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={92}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={TOOLTIP_CONTENT_STYLE} />
            <Bar
              dataKey="deficient"
              name="Deficient"
              stackId="n"
              fill={NUTRIENT_COLORS.deficient}
            />
            <Bar dataKey="optimal" name="Optimal" stackId="n" fill={NUTRIENT_COLORS.optimal} />
            <Bar
              dataKey="excess"
              name="Excess"
              stackId="n"
              fill={NUTRIENT_COLORS.excess}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        <LegendChip color={NUTRIENT_COLORS.deficient} label={NUTRIENT_LABELS.deficient} />
        <LegendChip color={NUTRIENT_COLORS.optimal} label={NUTRIENT_LABELS.optimal} />
        <LegendChip color={NUTRIENT_COLORS.excess} label={NUTRIENT_LABELS.excess} />
      </div>
    </ChartCard>
  )
}
