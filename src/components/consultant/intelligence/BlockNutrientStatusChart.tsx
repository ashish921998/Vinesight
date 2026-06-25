'use client'

// react-doctor-disable-next-line react-doctor/prefer-dynamic-import, prefer-dynamic-import -- small below-the-fold chart on a route-split page; static import keeps it consistent with the dashboard charts
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BLOCK_NUTRIENT_STATUS, NETWORK_SCOPE } from '@/lib/consultant-intelligence-demo'
import {
  AXIS_TICK,
  NUTRIENT_COLORS,
  NUTRIENT_LABELS,
  TOOLTIP_CONTENT_STYLE
} from '@/components/consultant/dashboard/chart-theme'
import { ChartCard, LegendChip } from '@/components/consultant/dashboard/ChartCard'

/**
 * Latest petiole status across the network, per nutrient — the signature
 * diverging stacked bar. Nitrogen skews to excess (over-application across 11
 * blocks); potassium carries the most deficiency, tying to the trend chart.
 */
export function BlockNutrientStatusChart() {
  const rows = BLOCK_NUTRIENT_STATUS
  const chartHeight = Math.max(180, rows.length * 30 + 16)
  const ariaLabel = `Petiole nutrient status across ${NETWORK_SCOPE.blocks} blocks. ${rows
    .map((r) => `${r.label}: ${r.deficient} deficient, ${r.optimal} optimal, ${r.excess} excess`)
    .join('; ')}`

  return (
    <ChartCard
      title={`Petiole status across ${NETWORK_SCOPE.blocks} blocks`}
      description="Latest test per block, judged against stage norms"
      state="ready"
      footnote="Nitrogen reads excess in 11 blocks — the over-application the AI flags for savings. Potassium carries the most deficiency."
    >
      {/* react-doctor-disable-next-line react-doctor/prefer-tag-over-role, prefer-tag-over-role -- role="img"+aria-label is the correct ARIA pattern for an inline SVG chart */}
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
              width={104}
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
