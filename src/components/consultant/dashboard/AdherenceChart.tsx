'use client'

// react-doctor-disable-next-line react-doctor/prefer-dynamic-import, prefer-dynamic-import -- recharts drives above-the-fold dashboard charts on an already route-split page; deferring it only adds a loading flash on the primary view
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { FOLLOWED_STATUSES, followedStatusLabels } from '@/lib/consultant-visit-service'
import { adherenceSummary, type AdherenceCounts } from '@/lib/consultant-dashboard-metrics'
import { ADHERENCE_COLORS, TOOLTIP_CONTENT_STYLE } from './chart-theme'
import { ChartCard, LegendChip, type ChartCardState } from './ChartCard'

/**
 * Single stacked horizontal bar: visit follow-ups by adherence outcome —
 * how often farmers followed / partially followed / didn't follow the issued
 * recommendation. Mirrors the diverging temperature scale (followed = green,
 * partial = amber, not-followed = critical).
 */
export function AdherenceChart({
  counts,
  isLoading,
  isError
}: {
  counts: AdherenceCounts | undefined
  isLoading: boolean
  isError: boolean
}) {
  const { counts: safe, total, followedPct } = adherenceSummary(counts)
  const state: ChartCardState = isLoading
    ? 'loading'
    : isError
      ? 'error'
      : total === 0
        ? 'empty'
        : 'ready'

  const data = [{ name: 'Adherence', ...safe }]
  const ariaLabel = `Recommendation adherence across ${total} follow-up${
    total === 1 ? '' : 's'
  }: ${FOLLOWED_STATUSES.map((s) => `${safe[s]} ${followedStatusLabels[s]}`).join(', ')}`

  return (
    <ChartCard
      title="Recommendation adherence"
      description="Visit follow-ups by outcome"
      state={state}
      emptyHint="Adherence appears once you log visit follow-ups."
      footnote={
        followedPct == null
          ? undefined
          : `${Math.round(followedPct)}% fully followed across ${total} follow-up${
              total === 1 ? '' : 's'
            }.`
      }
    >
      {/* react-doctor-disable-next-line react-doctor/prefer-tag-over-role, prefer-tag-over-role -- role="img"+aria-label is the correct ARIA pattern for an inline SVG chart; <img> needs a src and can't wrap recharts */}
      <div className="h-12 w-full" role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={TOOLTIP_CONTENT_STYLE} />
            {FOLLOWED_STATUSES.map((s, i) => {
              const radius: [number, number, number, number] =
                i === 0
                  ? [4, 0, 0, 4]
                  : i === FOLLOWED_STATUSES.length - 1
                    ? [0, 4, 4, 0]
                    : [0, 0, 0, 0]
              return (
                <Bar
                  key={s}
                  dataKey={s}
                  name={followedStatusLabels[s]}
                  stackId="adherence"
                  fill={ADHERENCE_COLORS[s]}
                  maxBarSize={36}
                  radius={radius}
                />
              )
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {FOLLOWED_STATUSES.map((s) => (
          <LegendChip
            key={s}
            color={ADHERENCE_COLORS[s]}
            label={followedStatusLabels[s]}
            count={safe[s]}
          />
        ))}
      </div>
    </ChartCard>
  )
}
