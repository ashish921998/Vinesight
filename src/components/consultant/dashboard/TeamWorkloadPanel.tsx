'use client'

import { useMemo } from 'react'
// react-doctor-disable-next-line react-doctor/prefer-dynamic-import, prefer-dynamic-import -- recharts drives above-the-fold dashboard charts on an already route-split page; deferring it only adds a loading flash on the primary view
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { type TriageItem } from '@/lib/consultant-triage-service'
import { type OrgMember } from '@/lib/team-service'
import { type FarmerWithFarms } from '@/lib/consultant-query-service'
import { REVIEW_WINDOW_DAYS, teamWorkload } from '@/lib/consultant-dashboard-metrics'
import { AXIS_TICK, SERIES_SAGE, SERIES_SLATE, TOOLTIP_CONTENT_STYLE } from './chart-theme'
import { ChartCard, LegendChip, type ChartCardState } from './ChartCard'

/**
 * Owner/Admin-only: per-Agronomist open backlog + reviews completed in the
 * window. Backlog is bucketed by each client's assigned agronomist; unassigned
 * open reviews collect into their own row.
 */
export function TeamWorkloadPanel({
  items,
  members,
  clients,
  isLoading,
  isError
}: {
  items: TriageItem[]
  members: OrgMember[]
  clients: FarmerWithFarms[]
  isLoading: boolean
  isError: boolean
}) {
  const rows = useMemo(() => {
    const assignmentByClient = new Map<string, string | null>(
      clients.map((c) => [c.id, c.assigned_to])
    )
    const memberRefs = members.map((m) => ({ userId: m.id, name: m.full_name ?? 'Member' }))
    return teamWorkload(items, memberRefs, assignmentByClient)
  }, [items, members, clients])

  const state: ChartCardState = isLoading
    ? 'loading'
    : isError
      ? 'error'
      : rows.length === 0
        ? 'empty'
        : 'ready'

  const chartHeight = Math.max(160, rows.length * 44 + 16)
  const ariaLabel = `Team workload. ${rows
    .map((r) => `${r.name}: ${r.openBacklog} open, ${r.completed30d} completed`)
    .join('; ')}`

  return (
    <ChartCard
      title="Team workload"
      description={`Open backlog + reviews completed · last ${REVIEW_WINDOW_DAYS} days`}
      state={state}
      emptyHint="No open reviews or recent activity to attribute yet."
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
              dataKey="name"
              width={110}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={TOOLTIP_CONTENT_STYLE} />
            <Bar
              dataKey="openBacklog"
              name="Open backlog"
              fill={SERIES_SLATE}
              radius={[0, 4, 4, 0]}
              maxBarSize={14}
            />
            <Bar
              dataKey="completed30d"
              name="Completed"
              fill={SERIES_SAGE}
              radius={[0, 4, 4, 0]}
              maxBarSize={14}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        <LegendChip color={SERIES_SLATE} label="Open backlog" />
        <LegendChip color={SERIES_SAGE} label={`Completed (${REVIEW_WINDOW_DAYS}d)`} />
      </div>
    </ChartCard>
  )
}
