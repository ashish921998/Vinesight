'use client'

// react-doctor-disable-next-line react-doctor/prefer-dynamic-import, prefer-dynamic-import -- the timeline is the primary above-the-fold chart on this route-split demo page; deferring recharts only adds a loading flash
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import {
  ACTION_THRESHOLD,
  AI_SPRAY_MARKERS,
  MONTH_TICKS,
  PRESSURE_TIMELINE,
  type PressurePoint
} from '@/lib/consultant-intelligence-demo'
import { AXIS_TICK, GRID_STROKE, SERIES_SAGE } from '@/components/consultant/dashboard/chart-theme'
import { ChartCard, LegendChip } from '@/components/consultant/dashboard/ChartCard'

// Two distinct, on-brand hues. Indigo = the wet/rain-driven disease; amber = the
// warm/dry-driven one. Color always pairs with the disease name in the legend.
const DOWNY_COLOR = '#5b6c9e'
const POWDERY_COLOR = '#b54708'

const labelForWeek = (week: number) => PRESSURE_TIMELINE[week]?.label ?? ''

interface PressureTooltipProps {
  active?: boolean
  payload?: Array<{ payload: PressurePoint }>
  label?: string
}

function PressureTooltip({ active, payload, label }: PressureTooltipProps) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm">
      <p className="font-mono font-medium tabular-nums">{label}</p>
      <ul className="mt-1.5 space-y-1">
        <li className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: DOWNY_COLOR }} />
          <span className="text-muted-foreground">Downy</span>
          <span className="ml-auto font-mono font-medium tabular-nums">{p.downy}</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: POWDERY_COLOR }} />
          <span className="text-muted-foreground">Powdery</span>
          <span className="ml-auto font-mono font-medium tabular-nums">{p.powdery}</span>
        </li>
        <li className="flex items-center gap-2 border-t border-border pt-1 text-muted-foreground">
          <span>Rain</span>
          <span className="ml-auto font-mono tabular-nums">{p.rain} mm</span>
        </li>
      </ul>
    </div>
  )
}

/**
 * Season-long downy/powdery mildew risk, with the spray-decision threshold and
 * the 9 AI-guided spray points overlaid. The visual argument: sprays cluster on
 * the risk peaks, not the calendar — including a preventive round placed *before*
 * the 12 Jan rain spike.
 */
export function DiseasePressureTimeline() {
  const ariaLabel = `Disease pressure across the season. Downy mildew peaks in October (${PRESSURE_TIMELINE[0].downy}) and after the 12 January rain (${PRESSURE_TIMELINE[14].downy}); powdery mildew peaks before harvest in February (${PRESSURE_TIMELINE[20].powdery}). Nine AI-guided sprays are placed at the risk onsets.`

  return (
    <ChartCard
      title="Season disease-pressure timeline"
      description="Modelled downy & powdery mildew risk, Oct → Mar — with AI-guided spray timing"
      state="ready"
      footnote={`Risk index 0–100. The dashed line is the spray-decision threshold (${ACTION_THRESHOLD}); sage markers are the 9 AI-recommended sprays. Round 5 is placed before the 12 Jan rain to pre-empt the downy spike.`}
    >
      {/* react-doctor-disable-next-line react-doctor/prefer-tag-over-role, prefer-tag-over-role -- role="img"+aria-label is the correct ARIA pattern for an inline SVG chart */}
      <div className="h-72 w-full" role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={PRESSURE_TIMELINE}
            margin={{ top: 16, right: 12, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="downyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={DOWNY_COLOR} stopOpacity={0.22} />
                <stop offset="100%" stopColor={DOWNY_COLOR} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="powderyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={POWDERY_COLOR} stopOpacity={0.2} />
                <stop offset="100%" stopColor={POWDERY_COLOR} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID_STROKE} strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="label"
              ticks={MONTH_TICKS}
              tickFormatter={(v: string) => v.split(' ')[1] ?? v}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              content={<PressureTooltip />}
              cursor={{ stroke: GRID_STROKE, strokeWidth: 1 }}
            />

            <Area
              type="monotone"
              dataKey="downy"
              name="Downy mildew"
              stroke={DOWNY_COLOR}
              strokeWidth={2}
              fill="url(#downyFill)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="powdery"
              name="Powdery mildew"
              stroke={POWDERY_COLOR}
              strokeWidth={2}
              fill="url(#powderyFill)"
              isAnimationActive={false}
            />

            <ReferenceLine
              y={ACTION_THRESHOLD}
              stroke="#6f7672"
              strokeDasharray="5 4"
              strokeWidth={1}
              label={{
                value: 'Action threshold',
                position: 'insideTopRight',
                fontSize: 10,
                fill: '#6f7672'
              }}
            />

            {/* Causal annotation: the unseasonal rain that drove the Jan downy spike. */}
            <ReferenceLine
              x="12 Jan"
              stroke={DOWNY_COLOR}
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{ value: 'Unseasonal rain', position: 'top', fontSize: 10, fill: DOWNY_COLOR }}
            />

            {/* The 9 AI-guided sprays, numbered, sitting on the disease they target. */}
            {AI_SPRAY_MARKERS.map((m, i) => (
              <ReferenceDot
                key={m.week}
                x={labelForWeek(m.week)}
                y={m.risk}
                r={5}
                fill={SERIES_SAGE}
                stroke="#ffffff"
                strokeWidth={1.5}
                label={{ value: String(i + 1), position: 'top', fontSize: 10, fill: '#2f3a44' }}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        <LegendChip color={DOWNY_COLOR} label="Downy mildew risk" />
        <LegendChip color={POWDERY_COLOR} label="Powdery mildew risk" />
        <LegendChip color={SERIES_SAGE} label="AI-guided spray" />
      </div>
    </ChartCard>
  )
}
