'use client'

// react-doctor-disable-next-line react-doctor/prefer-dynamic-import, prefer-dynamic-import -- small below-the-fold chart on a route-split page; static import keeps it consistent with the dashboard charts
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { POTASSIUM_OPTIMAL, SOIL_TREND } from '@/lib/consultant-intelligence-demo'
import {
  AXIS_TICK,
  GRID_STROKE,
  SERIES_SLATE,
  TOOLTIP_CONTENT_STYLE
} from '@/components/consultant/dashboard/chart-theme'
import { ChartCard, LegendChip } from '@/components/consultant/dashboard/ChartCard'

const OPTIMAL_GREEN = '#3f7d4c'
const FLAGGED_AMBER = '#b54708'
const flagged = SOIL_TREND.find((p) => p.flagged)

/**
 * Three seasons of petiole potassium for a representative block. The shaded band
 * is the optimal range; the amber marker is where the model flagged a developing
 * decline — caught ~6 weeks before the canopy would have shown it, then recovered
 * after a corrective fertigation plan.
 */
export function SoilTrendChart() {
  const ariaLabel = `Petiole potassium over three seasons, declining from 2.5% to a flagged low of ${flagged?.potassium}% in October 2025, then recovering to 2.2% after intervention. Optimal band ${POTASSIUM_OPTIMAL.min}–${POTASSIUM_OPTIMAL.max}%.`

  return (
    <ChartCard
      title="Petiole potassium — 3-season trend"
      description="Representative block · % dry matter"
      state="ready"
      footnote={`Optimal band ${POTASSIUM_OPTIMAL.min}–${POTASSIUM_OPTIMAL.max}% K. The Oct '25 sampling fell below the band; a corrective fertigation plan returned it to optimal by Mar '26.`}
    >
      {/* react-doctor-disable-next-line react-doctor/prefer-tag-over-role, prefer-tag-over-role -- role="img"+aria-label is the correct ARIA pattern for an inline SVG chart */}
      <div className="h-56 w-full" role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={SOIL_TREND} margin={{ top: 8, right: 12, bottom: 0, left: -4 }}>
            <CartesianGrid stroke={GRID_STROKE} strokeDasharray="2 4" vertical={false} />
            <ReferenceArea
              y1={POTASSIUM_OPTIMAL.min}
              y2={POTASSIUM_OPTIMAL.max}
              fill={OPTIMAL_GREEN}
              fillOpacity={0.08}
              ifOverflow="extendDomain"
            />
            <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis
              domain={[1.4, 2.8]}
              ticks={[1.4, 1.8, 2.2, 2.6]}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={TOOLTIP_CONTENT_STYLE}
              formatter={(value) => [`${value}% K`, 'Petiole']}
            />
            <Line
              type="monotone"
              dataKey="potassium"
              stroke={SERIES_SLATE}
              strokeWidth={2}
              dot={{ r: 3, fill: SERIES_SLATE }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
            {flagged && (
              <ReferenceDot
                x={flagged.label}
                y={flagged.potassium}
                r={6}
                fill={FLAGGED_AMBER}
                stroke="#ffffff"
                strokeWidth={2}
                label={{
                  value: 'Flagged',
                  position: 'bottom',
                  fontSize: 10,
                  fill: FLAGGED_AMBER
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        <LegendChip color={SERIES_SLATE} label="Petiole K (%)" />
        <LegendChip color={OPTIMAL_GREEN} label="Optimal band" />
        <LegendChip color={FLAGGED_AMBER} label="AI-flagged decline" />
      </div>
    </ChartCard>
  )
}
