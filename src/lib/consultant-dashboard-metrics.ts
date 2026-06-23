/**
 * Pure, unit-testable aggregation helpers for the Command Center dashboard.
 *
 * Everything here derives dashboard metrics from data already fetched by the
 * existing TanStack Query hooks (Petiole Reviews, org members, clients) plus the
 * two aggregate RPCs (adherence, latest petiole). No I/O, no React — so the
 * numbers can be tested in isolation and the components stay declarative.
 *
 * Time-windowed helpers take an injectable `now` (default: current time) so the
 * windows are deterministic under test.
 */
import { differenceInMilliseconds, format, startOfWeek, subWeeks } from 'date-fns'
import {
  TRIAGE_SEVERITIES,
  TRIAGE_STATUSES,
  type TriageItem,
  type TriageSeverity,
  type TriageStatus
} from './consultant-triage-service'
import { type FollowedStatus } from './consultant-visit-service'
import { canonicalizeParameters } from './parameter-canonicalization'
// Reuse the single source of truth for petiole target ranges + status logic.
import { PETIOLE_RANGES } from '@/app/consultant/farmers/[farmerId]/farms/[farmId]/components/farm-config'
import {
  formatParamKey,
  getStatus
} from '@/app/consultant/farmers/[farmerId]/farms/[farmId]/components/farm-helpers'

// --- Gating thresholds (charts below these render a compact empty state) -----
export const REVIEW_WINDOW_DAYS = 30
export const THROUGHPUT_WEEKS = 8
export const MIN_THROUGHPUT_COMPLETED = 3
export const MIN_NUTRIENT_FARMS = 3

const MS_PER_DAY = 1000 * 60 * 60 * 24

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** A review is "open" (needs attention) while pending or in review. */
export function openReviewCount(items: TriageItem[]): number {
  return items.filter((t) => t.status === 'pending' || t.status === 'in_review').length
}

/**
 * Mean days from creation to review, over reviews completed in the last
 * `windowDays`. Returns null when no review has been completed in the window.
 */
export function avgTimeToReviewDays(
  items: TriageItem[],
  { now = new Date(), windowDays = REVIEW_WINDOW_DAYS }: { now?: Date; windowDays?: number } = {}
): number | null {
  const cutoff = now.getTime() - windowDays * MS_PER_DAY
  const durations: number[] = []
  for (const t of items) {
    const reviewed = parseDate(t.reviewedAt)
    const created = parseDate(t.createdAt)
    if (!reviewed || !created) continue
    if (reviewed.getTime() < cutoff) continue
    const days = differenceInMilliseconds(reviewed, created) / MS_PER_DAY
    if (days >= 0) durations.push(days)
  }
  if (durations.length === 0) return null
  return durations.reduce((sum, d) => sum + d, 0) / durations.length
}

/** Counts per pipeline status (every status represented, including zeros). */
export function statusCounts(items: TriageItem[]): {
  counts: Record<TriageStatus, number>
  total: number
} {
  const counts = Object.fromEntries(TRIAGE_STATUSES.map((s) => [s, 0])) as Record<
    TriageStatus,
    number
  >
  for (const t of items) counts[t.status] += 1
  return { counts, total: items.length }
}

/** Counts per severity across all classified reviews (severity is null until reviewed). */
export function severityCounts(items: TriageItem[]): {
  counts: Record<TriageSeverity, number>
  classifiedTotal: number
} {
  const counts = Object.fromEntries(TRIAGE_SEVERITIES.map((s) => [s, 0])) as Record<
    TriageSeverity,
    number
  >
  let classifiedTotal = 0
  for (const t of items) {
    if (t.severity) {
      counts[t.severity] += 1
      classifiedTotal += 1
    }
  }
  return { counts, classifiedTotal }
}

export interface ThroughputPoint {
  weekStart: string // ISO date of the week's Monday
  label: string // e.g. "Jun 9"
  count: number
}

/**
 * Reviews completed (reviewed_at set) per week over the last `weeks` weeks,
 * oldest → newest. Weeks start Monday. Always returns `weeks` points so the
 * trend has a stable x-axis even with sparse data.
 */
export function weeklyThroughput(
  items: TriageItem[],
  { now = new Date(), weeks = THROUGHPUT_WEEKS }: { now?: Date; weeks?: number } = {}
): ThroughputPoint[] {
  const buckets: ThroughputPoint[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
    buckets.push({
      weekStart: weekStart.toISOString(),
      label: format(weekStart, 'MMM d'),
      count: 0
    })
  }
  const earliest = new Date(buckets[0].weekStart).getTime()
  for (const t of items) {
    const reviewed = parseDate(t.reviewedAt)
    if (!reviewed || reviewed.getTime() < earliest) continue
    // Index by whole weeks since the first bucket's Monday.
    const idx = Math.floor((reviewed.getTime() - earliest) / (7 * MS_PER_DAY))
    if (idx >= 0 && idx < buckets.length) buckets[idx].count += 1
  }
  return buckets
}

/** Number of completed reviews represented in a throughput series (for gating). */
export function throughputTotal(points: ThroughputPoint[]): number {
  return points.reduce((sum, p) => sum + p.count, 0)
}

// --- Nutrient status across farms (the signature chart) ----------------------

/**
 * Petiole target ranges keyed by the CANONICAL parameter names produced by
 * `canonicalizeParameters` (sulfur, not the British "sulphur" used in
 * PETIOLE_RANGES). All other keys already match. Single-sources the numbers
 * from farm-config; only the sulphur→sulfur alias is applied here.
 */
const { sulphur: sulphurRange, ...restPetioleRanges } = PETIOLE_RANGES
const CANONICAL_PETIOLE_RANGES: typeof PETIOLE_RANGES = {
  ...restPetioleRanges,
  sulfur: sulphurRange
}

export interface NutrientStatusRow {
  key: string
  label: string
  deficient: number
  optimal: number
  excess: number
  total: number
}

export interface FarmPetioleSnapshot {
  farmId: number
  /** Latest petiole parameters for the farm (DB `parameters`, already canonical). */
  parameters: Record<string, number | string | null | undefined> | null
}

/**
 * For each nutrient with at least one reading, count how many farms' latest
 * petiole test is deficient / optimal / excess versus the bloom-stage ranges.
 * Reuses `getStatus` (value < min → low/deficient, > max → high/excess).
 * Only nutrients present in at least one farm are returned, in lab-report order.
 */
export function nutrientStatusAcrossFarms(farms: FarmPetioleSnapshot[]): NutrientStatusRow[] {
  const rows: NutrientStatusRow[] = []
  const orderedKeys = Object.keys(CANONICAL_PETIOLE_RANGES)

  for (const key of orderedKeys) {
    const range = CANONICAL_PETIOLE_RANGES[key]
    if (!range) continue
    let deficient = 0
    let optimal = 0
    let excess = 0
    for (const farm of farms) {
      if (!farm.parameters) continue
      const canonical = canonicalizeParameters(farm.parameters)
      const value = canonical[key]
      if (typeof value !== 'number' || !Number.isFinite(value)) continue
      const status = getStatus(value, range)
      if (status === 'low') deficient += 1
      else if (status === 'high') excess += 1
      else optimal += 1
    }
    const total = deficient + optimal + excess
    if (total > 0) {
      rows.push({ key, label: formatParamKey(key), deficient, optimal, excess, total })
    }
  }
  return rows
}

/** Distinct farms with at least one usable petiole reading (for gating). */
export function farmsWithPetioleData(farms: FarmPetioleSnapshot[]): number {
  return farms.filter((f) => {
    if (!f.parameters) return false
    const canonical = canonicalizeParameters(f.parameters)
    return Object.keys(CANONICAL_PETIOLE_RANGES).some((k) => typeof canonical[k] === 'number')
  }).length
}

// --- Recommendation adherence ------------------------------------------------

export type AdherenceCounts = Record<FollowedStatus, number>

export interface AdherenceSummary {
  counts: AdherenceCounts
  total: number
  /** Share of follow-ups marked fully "followed", 0–100, or null if no data. */
  followedPct: number | null
}

export function adherenceSummary(
  counts: Partial<AdherenceCounts> | null | undefined
): AdherenceSummary {
  const safe: AdherenceCounts = {
    followed: counts?.followed ?? 0,
    partially_followed: counts?.partially_followed ?? 0,
    not_followed: counts?.not_followed ?? 0
  }
  const total = safe.followed + safe.partially_followed + safe.not_followed
  return {
    counts: safe,
    total,
    followedPct: total === 0 ? null : (safe.followed / total) * 100
  }
}

// --- Team workload (Owner/Admin only) ----------------------------------------

export interface TeamMemberRef {
  userId: string
  name: string
}

export interface TeamWorkloadRow {
  memberId: string | null // null = the "Unassigned" backlog bucket
  name: string
  openBacklog: number
  completed30d: number
}

const UNASSIGNED_ROW_ID = '__unassigned__'

/**
 * Per-member review load: open backlog (pending/in_review for that member's
 * assigned clients) + reviews they completed in the last `windowDays`.
 * `assignmentByClient` maps a client_user_id to its assigned agronomist (or
 * null). Open reviews for unassigned clients collect into an "Unassigned" row.
 * Rows with no work at all are dropped; sorted by total load desc.
 */
export function teamWorkload(
  items: TriageItem[],
  members: TeamMemberRef[],
  assignmentByClient: Map<string, string | null>,
  { now = new Date(), windowDays = REVIEW_WINDOW_DAYS }: { now?: Date; windowDays?: number } = {}
): TeamWorkloadRow[] {
  const backlog = new Map<string, number>() // memberId | UNASSIGNED_ROW_ID -> count
  const completed = new Map<string, number>() // memberId -> count
  const cutoff = now.getTime() - windowDays * MS_PER_DAY

  for (const t of items) {
    if (t.status === 'pending' || t.status === 'in_review') {
      const assignee = assignmentByClient.get(t.clientUserId) ?? null
      const bucket = assignee ?? UNASSIGNED_ROW_ID
      backlog.set(bucket, (backlog.get(bucket) ?? 0) + 1)
    }
    const reviewed = parseDate(t.reviewedAt)
    if (t.reviewedBy && reviewed && reviewed.getTime() >= cutoff) {
      completed.set(t.reviewedBy, (completed.get(t.reviewedBy) ?? 0) + 1)
    }
  }

  const rows: TeamWorkloadRow[] = members.map((m) => ({
    memberId: m.userId,
    name: m.name,
    openBacklog: backlog.get(m.userId) ?? 0,
    completed30d: completed.get(m.userId) ?? 0
  }))

  const unassignedBacklog = backlog.get(UNASSIGNED_ROW_ID) ?? 0
  if (unassignedBacklog > 0) {
    rows.push({
      memberId: null,
      name: 'Unassigned',
      openBacklog: unassignedBacklog,
      completed30d: 0
    })
  }

  return rows
    .filter((r) => r.openBacklog > 0 || r.completed30d > 0)
    .sort((a, b) => b.openBacklog + b.completed30d - (a.openBacklog + a.completed30d))
}
