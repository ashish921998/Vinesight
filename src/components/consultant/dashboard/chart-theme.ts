/**
 * Command Center chart palette — hex literals consumed directly by Recharts.
 *
 * These MIRROR the `--nutrient-*` / `--severity-*` / `--status-*` CSS variables
 * in `globals.css`. They are duplicated as literals (rather than `var(--x)`)
 * because Recharts renders `fill`/`stroke` as SVG presentation *attributes*,
 * where CSS `var()` does not resolve. Values are the light-mode tokens; they
 * remain legible on the dark card surface. Keep the two in sync.
 *
 * Per DESIGN.md, color NEVER stands alone — every chart that uses these also
 * renders the matching text label (Deficient/Optimal/Excess, severity, status).
 */
import type { TriageSeverity, TriageStatus } from '@/lib/consultant-triage-service'
import type { FollowedStatus } from '@/lib/consultant-visit-service'

/** Diverging nutrient scale (the signature): deficient ↔ optimal ↔ excess. */
export type NutrientBucket = 'deficient' | 'optimal' | 'excess'

export const NUTRIENT_COLORS: Record<NutrientBucket, string> = {
  deficient: '#b54708', // warm amber
  optimal: '#3f7d4c', // green
  excess: '#5b6c9e' // cool indigo
}

export const NUTRIENT_LABELS: Record<NutrientBucket, string> = {
  deficient: 'Deficient',
  optimal: 'Optimal',
  excess: 'Excess'
}

/** Ordered for diverging stacked bars: deficient — optimal — excess. */
export const NUTRIENT_ORDER: NutrientBucket[] = ['deficient', 'optimal', 'excess']

/** Petiole Review severity ramp — low → critical. */
export const SEVERITY_COLORS: Record<TriageSeverity, string> = {
  low: '#3f7d4c',
  medium: '#b54708',
  high: '#c2410c',
  critical: '#7f1d1d'
}

export const SEVERITY_LABELS: Record<TriageSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical'
}

/** Review pipeline status ramp — pending → resolved (+ escalated exception). */
export const STATUS_COLORS: Record<TriageStatus, string> = {
  pending: '#6f7672',
  in_review: '#5b6c9e',
  reviewed: '#89a379',
  resolved: '#3f7d4c',
  escalated: '#7f1d1d'
}

export const STATUS_LABELS: Record<TriageStatus, string> = {
  pending: 'Pending',
  in_review: 'In review',
  reviewed: 'Reviewed',
  resolved: 'Resolved',
  escalated: 'Escalated'
}

/** Recommendation adherence (visit follow-ups) — reuses the nutrient temperatures. */
export const ADHERENCE_COLORS: Record<FollowedStatus, string> = {
  followed: '#3f7d4c',
  partially_followed: '#b54708',
  not_followed: '#7f1d1d'
}

/** Neutral series colors for single-metric charts (slate + sage brand spine). */
export const SERIES_SLATE = '#2f3a44'
export const SERIES_SAGE = '#6f8f5e'

/** Shared axis/grid tints + tooltip style, matching the in-repo Recharts usage. */
export const AXIS_TICK = { fontSize: 11, fill: '#6f7672' }
export const GRID_STROKE = '#e4e4e7'
export const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid #e4e4e7',
  borderRadius: '8px',
  fontSize: '12px',
  fontVariantNumeric: 'tabular-nums' as const
}
