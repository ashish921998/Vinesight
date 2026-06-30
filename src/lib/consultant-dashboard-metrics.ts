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
// Rename in place (sulphur → sulfur) rather than spread-and-append, so the
// original PETIOLE_RANGES insertion order — i.e. lab-report order — is kept.
const CANONICAL_PETIOLE_RANGES: typeof PETIOLE_RANGES = Object.fromEntries(
  Object.entries(PETIOLE_RANGES).map(([key, range]) => [key === 'sulphur' ? 'sulfur' : key, range])
)

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
  /**
   * Date of the farm's latest petiole sample (DB `petiole_test_records.date`,
   * surfaced by `get_org_latest_petiole.sample_date`). Optional because the
   * nutrient-bucketing helpers only read `parameters`; the gone-quiet
   * derivation is the one consumer that needs it. The service always supplies
   * it. ⚠ Farmer/lab-entered and can be backdated — see `goneQuietFarmers`.
   */
  sampleDate?: string | null
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

// --- Overview "Your Practice" panel ------------------------------------------
// Derived signals for the consultant's proactive daily panel. These complement
// (don't duplicate) the reactive review queue: they surface what the queue is
// structurally blind to — farmers gone quiet, reviews left without a plan. All
// client-side from data already fetched; no new RPC.

/**
 * Days since a farm's last petiole sample beyond which it counts as "gone
 * quiet". Tunable — bump if 30d proves too noisy in the field.
 */
export const QUIET_SAMPLE_DAYS = 30

export interface GoneQuietFarm {
  farmId: number
  /** Whole days since the last sample (floored). Always > the threshold. */
  daysSinceSample: number
  sampleDate: string
}

/**
 * Farms whose latest petiole sample is older than `thresholdDays`, newest-gap
 * last (most overdue first). Two known v1 gaps, deliberately accepted:
 *
 *   1. Farms NEVER sampled aren't returned by `get_org_latest_petiole`, so this
 *      surfaces only "sampled before, now silent" farms — not first-timers.
 *   2. `sampleDate` is farmer/lab-entered and can be backdated, so a freshly
 *      entered old report shows up as falsely "quiet". If that bites, re-key the
 *      threshold off `created_at` (system-entry time) instead of the sample date.
 */
export function goneQuietFarmers(
  farms: FarmPetioleSnapshot[],
  {
    now = new Date(),
    thresholdDays = QUIET_SAMPLE_DAYS
  }: { now?: Date; thresholdDays?: number } = {}
): GoneQuietFarm[] {
  const out: GoneQuietFarm[] = []
  for (const farm of farms) {
    const sampled = parseDate(farm.sampleDate)
    if (!sampled) continue // never sampled / unparseable → not "gone quiet" (gap 1)
    const days = Math.floor((now.getTime() - sampled.getTime()) / MS_PER_DAY)
    if (days > thresholdDays) {
      out.push({
        farmId: farm.farmId,
        daysSinceSample: days,
        sampleDate: farm.sampleDate as string
      })
    }
  }
  return out.sort((a, b) => b.daysSinceSample - a.daysSinceSample)
}

export interface ReviewedNoPlanItem {
  triageId: string
  farmId: number
  clientUserId: string
  farmerName: string | null
  farmName: string | null
}

/**
 * Reviews that were acted on (status `reviewed` or `escalated`) but have no
 * fertilizer plan attached — a loose end the queue no longer shows. `resolved`
 * is excluded on purpose (deliberately closed). `planTriageIds` is the set of
 * `fertilizer_plans.petiole_triage_id` values that already have a plan.
 *
 * The plan link (not `recommendation`) is the authoritative "has a plan" signal:
 * `recommendation` can be written independently of a plan row.
 */
export function reviewedNoPlan(
  items: TriageItem[],
  planTriageIds: Set<string>
): ReviewedNoPlanItem[] {
  return items
    .filter(
      (t) => (t.status === 'reviewed' || t.status === 'escalated') && !planTriageIds.has(t.id)
    )
    .map((t) => ({
      triageId: t.id,
      farmId: t.farmId,
      clientUserId: t.clientUserId,
      farmerName: t.farmerName,
      farmName: t.farmName
    }))
}

/**
 * Oldest open (pending/in_review) review's age in whole days, by `createdAt`.
 * Null when there is no open review. Feeds the "oldest waited X days" finding.
 */
export function oldestOpenReviewDays(
  items: TriageItem[],
  { now = new Date() }: { now?: Date } = {}
): number | null {
  let oldest: number | null = null
  for (const t of items) {
    if (t.status !== 'pending' && t.status !== 'in_review') continue
    const created = parseDate(t.createdAt)
    if (!created) continue
    const days = Math.floor((now.getTime() - created.getTime()) / MS_PER_DAY)
    if (oldest == null || days > oldest) oldest = days
  }
  return oldest
}

/** Farms whose latest petiole test has at least one deficient nutrient. */
export function farmsWithDeficiency(farms: FarmPetioleSnapshot[]): number {
  let count = 0
  for (const farm of farms) {
    if (!farm.parameters) continue
    const canonical = canonicalizeParameters(farm.parameters)
    const deficient = Object.keys(CANONICAL_PETIOLE_RANGES).some((key) => {
      const range = CANONICAL_PETIOLE_RANGES[key]
      if (!range) return false
      const value = canonical[key]
      if (typeof value !== 'number' || !Number.isFinite(value)) return false
      return getStatus(value, range) === 'low'
    })
    if (deficient) count += 1
  }
  return count
}

// --- Farmers-to-contact call list (per-farm grain) ---------------------------

export type CallReason = 'quiet' | 'no_plan'

/** Farm → display/navigation context, joined from `useFarmerClients` in memory. */
export interface FarmContactRef {
  clientUserId: string
  farmerName: string | null
  /** Village-equivalent: the farm's region (no village field exists upstream). */
  village: string | null
  farmName: string | null
}

export interface CallListRow {
  /** Stable de-dup key — one row per (reason, farm/triage). */
  key: string
  reason: CallReason
  farmId: number
  clientUserId: string
  farmerName: string | null
  village: string | null
  farmName: string | null
  /** Set for `quiet` rows. */
  daysSinceSample?: number
  /** Set for `no_plan` rows — the triage to open in the plan builder. */
  triageId?: string
}

const REASON_RANK: Record<CallReason, number> = { quiet: 0, no_plan: 1 }

/**
 * Merge the derived reasons into one urgency-sorted call list, at per-farm
 * grain (a multi-farm farmer appears once per flagged farm). Order: gone-quiet
 * first (most overdue first), then reviewed-no-plan.
 *
 * `farmIndex` maps farmId → farmer/village context. A quiet row with no index
 * match (farmer left the org mid-session) is skipped — we can't navigate
 * without a client id. A no_plan row carries its own client id from the triage
 * item, so it survives a missing index (just without a village).
 */
export function buildCallList(
  goneQuiet: GoneQuietFarm[],
  reviewed: ReviewedNoPlanItem[],
  farmIndex: Map<number, FarmContactRef>
): CallListRow[] {
  const rows: CallListRow[] = []

  for (const q of goneQuiet) {
    const ref = farmIndex.get(q.farmId)
    if (!ref) continue // can't navigate without a client id — skip gracefully
    rows.push({
      key: `quiet:${q.farmId}`,
      reason: 'quiet',
      farmId: q.farmId,
      clientUserId: ref.clientUserId,
      farmerName: ref.farmerName,
      village: ref.village,
      farmName: ref.farmName,
      daysSinceSample: q.daysSinceSample
    })
  }

  for (const r of reviewed) {
    const ref = farmIndex.get(r.farmId)
    rows.push({
      key: `no_plan:${r.triageId}`,
      reason: 'no_plan',
      farmId: r.farmId,
      clientUserId: r.clientUserId, // reliable: comes from the triage row
      farmerName: ref?.farmerName ?? r.farmerName,
      village: ref?.village ?? null,
      farmName: ref?.farmName ?? r.farmName,
      triageId: r.triageId
    })
  }

  return rows.sort((a, b) => {
    if (REASON_RANK[a.reason] !== REASON_RANK[b.reason]) {
      return REASON_RANK[a.reason] - REASON_RANK[b.reason]
    }
    // Within gone-quiet, most overdue first.
    return (b.daysSinceSample ?? 0) - (a.daysSinceSample ?? 0)
  })
}

export interface FarmerCallGroup {
  /** Stable key — the farmer's client id. */
  clientUserId: string
  farmerName: string | null
  /** The group's most urgent reason — drives the header dot colour. */
  topReason: CallReason
  /**
   * Quiet farms, most overdue first. Rendered as plain context lines: they all
   * link to the same farmer page, which the group's single "View farmer" header
   * already covers, so they carry no per-row CTA.
   */
  quietFarms: CallListRow[]
  /**
   * Reviewed-no-plan farms. Each keeps its own review-specific "Issue plan"
   * deep link (the plan builder targets a single farm + review), so these stay
   * individually actionable rather than folding into the header.
   */
  planRows: CallListRow[]
}

/**
 * Collapse the per-farm call list to per-farmer groups so a multi-farm farmer
 * shows once instead of once per flagged farm. Quiet farms fold into context
 * lines under a single "View farmer" header; reviewed-no-plan farms stay as
 * their own rows because their CTA can't roll up to the farmer level.
 *
 * Group order mirrors the flat list: quiet-led farmers first (most overdue
 * first), then farmers with only reviewed-no-plan work. Input is assumed to
 * already be filtered by reason if a filter is active.
 */
export function groupCallList(rows: CallListRow[]): FarmerCallGroup[] {
  const groups = new Map<string, FarmerCallGroup>()

  for (const row of rows) {
    let group = groups.get(row.clientUserId)
    if (!group) {
      group = {
        clientUserId: row.clientUserId,
        farmerName: row.farmerName,
        topReason: row.reason,
        quietFarms: [],
        planRows: []
      }
      groups.set(row.clientUserId, group)
    }
    // Prefer any non-null name we encounter (a no_plan row always has one).
    if (!group.farmerName && row.farmerName) group.farmerName = row.farmerName
    if (row.reason === 'quiet') group.quietFarms.push(row)
    else group.planRows.push(row)
  }

  const list = [...groups.values()]
  for (const group of list) {
    group.quietFarms.sort((a, b) => (b.daysSinceSample ?? 0) - (a.daysSinceSample ?? 0))
    group.topReason = group.quietFarms.length > 0 ? 'quiet' : 'no_plan'
  }

  return list.sort((a, b) => {
    if (REASON_RANK[a.topReason] !== REASON_RANK[b.topReason]) {
      return REASON_RANK[a.topReason] - REASON_RANK[b.topReason]
    }
    // Both quiet-led: the farmer with the most overdue farm comes first.
    return (b.quietFarms[0]?.daysSinceSample ?? 0) - (a.quietFarms[0]?.daysSinceSample ?? 0)
  })
}

// --- Impression band ("What needs attention") --------------------------------

export type FindingTone = 'urgent' | 'attention' | 'positive'
export type FindingId = 'open_reviews' | 'gone_quiet' | 'reviewed_no_plan' | 'adherence'

/** A finding sentence is a list of inline segments; `mono` ones render bold mono. */
export interface FindingSegment {
  text: string
  mono?: boolean
}

export type FindingTarget =
  | { kind: 'route'; href: string }
  | { kind: 'scroll'; filter?: CallReason }

export interface Finding {
  id: FindingId
  tone: FindingTone
  segments: FindingSegment[]
  action: { label: string; target: FindingTarget }
}

export interface FindingInputs {
  openReviewCount: number
  oldestOpenDays: number | null
  goneQuietCount: number
  reviewedNoPlanCount: number
  adherencePct: number | null
}

/** Treat an open review as urgent once its oldest item has waited this long. */
const URGENT_OPEN_REVIEW_DAYS = 7
/** Adherence at or above this reads as the band's positive note. */
const HEALTHY_ADHERENCE_PCT = 70

/**
 * Build the impression-band findings from today's counts. Rules (make-or-break):
 *   - Suppress any finding whose count is 0 (and adherence when there's no data).
 *   - Urgent first, then attention, with the positive note last ("one positive").
 *   - All copy singular/plural-correct.
 * Returns `[]` when nothing is worth surfacing — the caller shows "All caught up".
 */
export function buildFindings(inputs: FindingInputs): Finding[] {
  const findings: Finding[] = []

  if (inputs.openReviewCount > 0) {
    const segments: FindingSegment[] = [
      { text: String(inputs.openReviewCount), mono: true },
      {
        text: inputs.openReviewCount === 1 ? ' report awaiting review' : ' reports awaiting review'
      }
    ]
    if (inputs.oldestOpenDays != null && inputs.oldestOpenDays > 0) {
      segments.push({ text: ' — oldest waited ' })
      segments.push({ text: `${inputs.oldestOpenDays}d`, mono: true })
    }
    segments.push({ text: '.' })
    findings.push({
      id: 'open_reviews',
      tone:
        inputs.oldestOpenDays != null && inputs.oldestOpenDays >= URGENT_OPEN_REVIEW_DAYS
          ? 'urgent'
          : 'attention',
      segments,
      action: { label: 'Review queue', target: { kind: 'route', href: '/consultant/triage' } }
    })
  }

  if (inputs.goneQuietCount > 0) {
    findings.push({
      id: 'gone_quiet',
      tone: 'attention',
      segments: [
        { text: String(inputs.goneQuietCount), mono: true },
        {
          text:
            inputs.goneQuietCount === 1
              ? ` farmer hasn't sampled in ${QUIET_SAMPLE_DAYS}+ days.`
              : ` farmers haven't sampled in ${QUIET_SAMPLE_DAYS}+ days.`
        }
      ],
      action: { label: 'See call list', target: { kind: 'scroll', filter: 'quiet' } }
    })
  }

  if (inputs.reviewedNoPlanCount > 0) {
    findings.push({
      id: 'reviewed_no_plan',
      tone: 'attention',
      segments: [
        { text: String(inputs.reviewedNoPlanCount), mono: true },
        {
          text:
            inputs.reviewedNoPlanCount === 1
              ? ' reviewed report has no plan attached.'
              : ' reviewed reports have no plan attached.'
        }
      ],
      action: { label: 'See call list', target: { kind: 'scroll', filter: 'no_plan' } }
    })
  }

  if (inputs.adherencePct != null) {
    findings.push({
      id: 'adherence',
      tone: inputs.adherencePct >= HEALTHY_ADHERENCE_PCT ? 'positive' : 'attention',
      segments: [
        { text: 'Recommendation adherence is ' },
        { text: `${Math.round(inputs.adherencePct)}%`, mono: true },
        { text: '.' }
      ],
      action: { label: 'Follow-ups', target: { kind: 'route', href: '/consultant/triage' } }
    })
  }

  const TONE_RANK: Record<FindingTone, number> = { urgent: 0, attention: 1, positive: 2 }
  return findings.sort((a, b) => TONE_RANK[a.tone] - TONE_RANK[b.tone])
}
