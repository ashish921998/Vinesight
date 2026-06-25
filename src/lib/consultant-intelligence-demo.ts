/**
 * Vineyard Intelligence — demo dataset.
 *
 * A self-contained, *illustrative* dataset modelling what VineSight produces
 * once it holds a season-plus of agronomic records across a grower network
 * (here, a representative Fratelli estate around Akluj, Maharashtra). Every
 * figure lives here so the demo narrative can be tuned in one place.
 *
 * NOT production data and NOT wired to Supabase — the page renders these
 * constants directly so a live demo can never break on a query. The honesty
 * framing ("Preview", illustrative footnote) lives on the page that reads this.
 *
 * Agronomic basis (kept realistic for an audience of agronomists):
 *  - Downy mildew (Plasmopara viticola): driven by leaf wetness, rain and high
 *    humidity — spikes post-monsoon (Oct) and on any unseasonal rain (Jan).
 *  - Powdery mildew (Erysiphe necator): favoured by warm, dry, shaded canopies —
 *    builds through the dry pre-harvest months (Nov–Dec, Feb), suppressed by rain.
 *  - Action threshold: a risk index of 60/100 is the spray-decision line.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Network scope + headline outcomes
// ─────────────────────────────────────────────────────────────────────────────

export const NETWORK_SCOPE = {
  seasons: 2,
  blocks: 38,
  acres: 224,
  region: 'Akluj, Maharashtra'
} as const

export interface KpiDatum {
  label: string
  value: string
  sub: string
}

/** The four headline outcomes shown in the KPI strip. */
export const HEADLINE_KPIS: KpiDatum[] = [
  {
    label: 'Spray rounds avoided',
    value: '5',
    sub: '14 → 9 fungicide rounds this season (−36%)'
  },
  {
    label: 'Input cost saved',
    value: '₹16k/ac',
    sub: '≈ ₹35.8L across 224 acres'
  },
  {
    label: 'Downy mildew incidence',
    value: '3.2%',
    sub: 'Held below the 5% action threshold'
  },
  {
    label: 'Export MRL compliance',
    value: '100%',
    sub: 'All blocks within EU residue limits'
  }
]

// ─────────────────────────────────────────────────────────────────────────────
// Season disease-pressure timeline (weekly, Oct → Mar)
// ─────────────────────────────────────────────────────────────────────────────

export const ACTION_THRESHOLD = 60

export interface PressurePoint {
  /** 0-based week index across the season. */
  week: number
  /** Full label, e.g. "12 Jan". */
  label: string
  /** First week of a calendar month — drives the month axis ticks. */
  monthStart: boolean
  /** Downy mildew risk index, 0–100. */
  downy: number
  /** Powdery mildew risk index, 0–100. */
  powdery: number
  /** Rainfall that week (mm) — the main downy driver. */
  rain: number
}

/**
 * 26 weeks, 06 Oct 2025 → 30 Mar 2026. Hand-built to tell the season story:
 * an Oct downy run-up, a Nov–Dec powdery build, a sharp downy spike on the
 * 12 Jan unseasonal rain, then a Feb powdery peak before harvest.
 */
export const PRESSURE_TIMELINE: PressurePoint[] = [
  { week: 0, label: '06 Oct', monthStart: true, downy: 74, powdery: 12, rain: 22 },
  { week: 1, label: '13 Oct', monthStart: false, downy: 63, powdery: 16, rain: 8 },
  { week: 2, label: '20 Oct', monthStart: false, downy: 48, powdery: 22, rain: 3 },
  { week: 3, label: '27 Oct', monthStart: false, downy: 66, powdery: 26, rain: 14 },
  { week: 4, label: '03 Nov', monthStart: true, downy: 38, powdery: 34, rain: 1 },
  { week: 5, label: '10 Nov', monthStart: false, downy: 28, powdery: 45, rain: 0 },
  { week: 6, label: '17 Nov', monthStart: false, downy: 22, powdery: 52, rain: 0 },
  { week: 7, label: '24 Nov', monthStart: false, downy: 18, powdery: 58, rain: 0 },
  { week: 8, label: '01 Dec', monthStart: true, downy: 16, powdery: 64, rain: 0 },
  { week: 9, label: '08 Dec', monthStart: false, downy: 20, powdery: 61, rain: 2 },
  { week: 10, label: '15 Dec', monthStart: false, downy: 24, powdery: 54, rain: 3 },
  { week: 11, label: '22 Dec', monthStart: false, downy: 17, powdery: 44, rain: 0 },
  { week: 12, label: '29 Dec', monthStart: false, downy: 15, powdery: 38, rain: 0 },
  { week: 13, label: '05 Jan', monthStart: true, downy: 34, powdery: 33, rain: 9 },
  { week: 14, label: '12 Jan', monthStart: false, downy: 78, powdery: 20, rain: 46 },
  { week: 15, label: '19 Jan', monthStart: false, downy: 71, powdery: 18, rain: 28 },
  { week: 16, label: '26 Jan', monthStart: false, downy: 44, powdery: 24, rain: 6 },
  { week: 17, label: '02 Feb', monthStart: true, downy: 26, powdery: 40, rain: 0 },
  { week: 18, label: '09 Feb', monthStart: false, downy: 20, powdery: 55, rain: 0 },
  { week: 19, label: '16 Feb', monthStart: false, downy: 18, powdery: 66, rain: 0 },
  { week: 20, label: '23 Feb', monthStart: false, downy: 16, powdery: 72, rain: 0 },
  { week: 21, label: '02 Mar', monthStart: true, downy: 15, powdery: 63, rain: 0 },
  { week: 22, label: '09 Mar', monthStart: false, downy: 14, powdery: 52, rain: 0 },
  { week: 23, label: '16 Mar', monthStart: false, downy: 13, powdery: 44, rain: 0 },
  { week: 24, label: '23 Mar', monthStart: false, downy: 12, powdery: 36, rain: 0 },
  { week: 25, label: '30 Mar', monthStart: false, downy: 11, powdery: 28, rain: 0 }
]

/** Label strings at month starts — passed to the x-axis `ticks` prop. */
export const MONTH_TICKS: string[] = PRESSURE_TIMELINE.filter((p) => p.monthStart).map(
  (p) => p.label
)

export interface SprayMarker {
  week: number
  /** Which disease drove the spray decision (positions the marker + tooltip). */
  driver: 'downy' | 'powdery'
  /** Risk index at the decision point. */
  risk: number
  note: string
}

/**
 * The 9 AI-guided sprays, each placed at the *onset* of a real pressure window
 * (preventive timing). These overlay the timeline so sprays visibly track the
 * risk peaks rather than the calendar.
 */
export const AI_SPRAY_MARKERS: SprayMarker[] = [
  { week: 0, driver: 'downy', risk: 74, note: 'Post-monsoon downy pressure' },
  { week: 3, driver: 'downy', risk: 66, note: 'Late-Oct rain bump' },
  { week: 7, driver: 'powdery', risk: 58, note: 'Powdery build — preventive' },
  { week: 9, driver: 'powdery', risk: 61, note: 'Powdery hold-down' },
  { week: 13, driver: 'downy', risk: 34, note: 'Pre-empts 12 Jan rain spike' },
  { week: 15, driver: 'downy', risk: 71, note: 'Downy follow-up after rain' },
  { week: 18, driver: 'powdery', risk: 55, note: 'Pre-harvest powdery — preventive' },
  { week: 20, driver: 'powdery', risk: 72, note: 'Powdery peak cover' },
  { week: 22, driver: 'powdery', risk: 52, note: 'Final pre-harvest cover' }
]

// ─────────────────────────────────────────────────────────────────────────────
// Calendar program vs AI program (spray comparison)
// ─────────────────────────────────────────────────────────────────────────────

export interface ProgramRound {
  week: number
  /** Whether the AI model would keep this calendar round or skip it. */
  status: 'kept' | 'skipped'
  /** Combined risk context at that week. */
  risk: number
}

/**
 * The fixed fortnightly calendar program — 14 rounds regardless of pressure.
 * 5 fall in low-pressure windows the AI safely skips.
 */
export const CALENDAR_PROGRAM: ProgramRound[] = [
  { week: 0, status: 'kept', risk: 74 },
  { week: 2, status: 'skipped', risk: 48 },
  { week: 4, status: 'skipped', risk: 38 },
  { week: 6, status: 'kept', risk: 52 },
  { week: 8, status: 'kept', risk: 64 },
  { week: 10, status: 'kept', risk: 54 },
  { week: 12, status: 'skipped', risk: 38 },
  { week: 14, status: 'kept', risk: 78 },
  { week: 16, status: 'skipped', risk: 44 },
  { week: 18, status: 'kept', risk: 55 },
  { week: 20, status: 'kept', risk: 72 },
  { week: 22, status: 'kept', risk: 52 },
  { week: 24, status: 'skipped', risk: 36 },
  { week: 25, status: 'kept', risk: 28 }
]

export const CALENDAR_ROUNDS = CALENDAR_PROGRAM.length // 14
export const AI_ROUNDS = AI_SPRAY_MARKERS.length // 9
export const ROUNDS_AVOIDED = CALENDAR_ROUNDS - AI_ROUNDS // 5

/** The skipped rounds, with the reason — drives the "why fewer" explainer. */
export const SKIPPED_ROUNDS = CALENDAR_PROGRAM.filter((r) => r.status === 'skipped')

// ─────────────────────────────────────────────────────────────────────────────
// Active early-warning alert (the proactive moment)
// ─────────────────────────────────────────────────────────────────────────────

export interface EarlyWarning {
  block: string
  variety: string
  acres: number
  disease: string
  riskLevel: 'high' | 'critical'
  currentRisk: number
  projectedRisk: number
  leadTimeHours: number
  drivers: string[]
  networkSignal: string
  recommendation: string
  confidence: number
}

export const EARLY_WARNING: EarlyWarning = {
  block: 'C-12',
  variety: 'Sangiovese',
  acres: 7.9,
  disease: 'Downy mildew',
  riskLevel: 'high',
  currentRisk: 41,
  projectedRisk: 73,
  leadTimeHours: 72,
  drivers: [
    '18 mm rain forecast in 48 h',
    'Humidity >85% for 2 nights',
    'Canopy still wet at dawn'
  ],
  networkSignal: '2 adjacent blocks confirmed downy in the last 5 days',
  recommendation: 'Apply preventive cover spray within the 24–48 h dry window before the front',
  confidence: 0.86
}

// ─────────────────────────────────────────────────────────────────────────────
// Network block-risk map (worklist table)
// ─────────────────────────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high'

export interface BlockRisk {
  block: string
  variety: string
  acres: number
  level: RiskLevel
  /** Which disease the current risk is about (paired with the level label). */
  disease: string
  /** Network / neighbour signal feeding the block's score, or '—' if none. */
  signal: string
}

export const NETWORK_BLOCKS: BlockRisk[] = [
  {
    block: 'C-12',
    variety: 'Sangiovese',
    acres: 7.9,
    level: 'high',
    disease: 'Downy',
    signal: '↑ 2 adjacent blocks confirmed downy'
  },
  {
    block: 'CD-05',
    variety: 'Chardonnay',
    acres: 5.2,
    level: 'high',
    disease: 'Powdery',
    signal: 'Dense canopy · low airflow'
  },
  {
    block: 'S-04',
    variety: 'Cabernet Sauvignon',
    acres: 10.1,
    level: 'medium',
    disease: 'Downy',
    signal: 'Humidity rising'
  },
  {
    block: 'SB-02',
    variety: 'Sauvignon Blanc',
    acres: 5.9,
    level: 'medium',
    disease: 'Powdery',
    signal: 'Warm dry spell'
  },
  {
    block: 'VM-01',
    variety: 'Vermentino',
    acres: 4.0,
    level: 'medium',
    disease: 'Downy',
    signal: '↑ rain forecast in 48 h'
  },
  {
    block: 'CH-07',
    variety: 'Chenin Blanc',
    acres: 6.9,
    level: 'low',
    disease: 'Downy',
    signal: '—'
  },
  {
    block: 'SH-09',
    variety: 'Shiraz',
    acres: 8.9,
    level: 'low',
    disease: 'Powdery',
    signal: '—'
  },
  {
    block: 'GR-03',
    variety: 'Grenache',
    acres: 4.7,
    level: 'low',
    disease: 'Downy',
    signal: '—'
  }
]

// ─────────────────────────────────────────────────────────────────────────────
// Soil / nutrition trends
// ─────────────────────────────────────────────────────────────────────────────

export interface SoilTrendPoint {
  label: string
  /** Petiole potassium, % dry matter. */
  potassium: number
  /** True at the sampling the model flagged as a developing decline. */
  flagged?: boolean
}

/** Optimal petiole-K band (% DM) for the diverging band on the trend chart. */
export const POTASSIUM_OPTIMAL = { min: 1.8, max: 2.6 } as const

/**
 * Three seasons of petiole-K for a representative block. A slow decline toward
 * deficiency, flagged at the Oct '25 sampling, then recovered after a corrective
 * fertigation plan — the "caught it early" soil story.
 */
export const SOIL_TREND: SoilTrendPoint[] = [
  { label: "Oct '23", potassium: 2.5 },
  { label: "Feb '24", potassium: 2.3 },
  { label: "Oct '24", potassium: 2.1 },
  { label: "Feb '25", potassium: 1.9 },
  { label: "Oct '25", potassium: 1.6, flagged: true },
  { label: "Jan '26", potassium: 1.85 },
  { label: "Mar '26", potassium: 2.2 }
]

export interface NutrientStatusRow {
  /** Nutrient short label, e.g. "Nitrogen (N)". */
  label: string
  deficient: number
  optimal: number
  excess: number
}

/**
 * Latest petiole status across the 38 network blocks, per nutrient. Nitrogen
 * skews to *excess* (the over-fertilisation story); potassium carries the most
 * deficiency (ties to the trend chart). Counts sum to 38 per row.
 */
export const BLOCK_NUTRIENT_STATUS: NutrientStatusRow[] = [
  { label: 'Nitrogen (N)', deficient: 3, optimal: 24, excess: 11 },
  { label: 'Phosphorus (P)', deficient: 5, optimal: 30, excess: 3 },
  { label: 'Potassium (K)', deficient: 9, optimal: 26, excess: 3 },
  { label: 'Calcium (Ca)', deficient: 4, optimal: 31, excess: 3 },
  { label: 'Magnesium (Mg)', deficient: 7, optimal: 28, excess: 3 },
  { label: 'Boron (B)', deficient: 6, optimal: 29, excess: 3 }
]

/** Soil/nutrition summary stats shown alongside the charts. */
export const SOIL_STATS = {
  nitrogenReduced: '28 kg N/ac',
  blocksOverApplying: 11,
  potassiumCaughtEarly: '6 weeks'
} as const

// ─────────────────────────────────────────────────────────────────────────────
// The data flywheel — what sharpens the models each season
// ─────────────────────────────────────────────────────────────────────────────

export interface FlywheelInput {
  title: string
  detail: string
}

export const FLYWHEEL_INPUTS: FlywheelInput[] = [
  {
    title: 'Spray diaries',
    detail:
      'Product, dose and date per block — calibrates the spray-decision line to what actually worked.'
  },
  {
    title: 'Disease scouting',
    detail: 'Quick incidence + severity ratings turn predictions into measured ground truth.'
  },
  {
    title: 'Petiole & soil tests',
    detail:
      'Season-over-season tissue values surface depletion trends before the canopy shows them.'
  },
  {
    title: 'Weather & forecast',
    detail: 'On-block conditions and the 72-hour forecast drive the early-warning model.'
  }
]
