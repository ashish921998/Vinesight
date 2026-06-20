import type { FertilizerPlanItem } from '@/lib/fertilizer-plan-service'

// ---------------------------------------------------------------------------
// Configurable annual soil baseline (decision: compact baseline, replaceable).
// To swap EC for a different property, edit this array only.
// ---------------------------------------------------------------------------
export const SOIL_BASELINE_KEYS: string[] = ['ph', 'ec', 'nitrogen', 'phosphorus', 'potassium']

export interface ParamRange {
  min: number
  max: number
  /** Full-scale min/max used to position the marker on the track. */
  scaleMin: number
  scaleMax: number
  unit?: string
}

// Annual soil target ranges (configurable baseline).
export const SOIL_RANGES: Record<string, ParamRange> = {
  ph: { min: 6.5, max: 7.5, scaleMin: 5.5, scaleMax: 8.5, unit: '' },
  ec: { min: 0.5, max: 1.5, scaleMin: 0, scaleMax: 3, unit: 'dS/m' },
  nitrogen: { min: 140, max: 280, scaleMin: 0, scaleMax: 400, unit: 'kg/ha' },
  phosphorus: { min: 30, max: 60, scaleMin: 0, scaleMax: 100, unit: 'kg/ha' },
  potassium: { min: 140, max: 280, scaleMin: 0, scaleMax: 400, unit: 'kg/ha' }
}

// Petiole target ranges (drives status colour and the optimal zone on the bar).
// Ranges match the bloom-stage standards on the lab petiole analysis report.
export const PETIOLE_RANGES: Record<string, ParamRange> = {
  total_nitrogen: { min: 1.01, max: 1.21, scaleMin: 0, scaleMax: 3, unit: '%' },
  nitrate_nitrogen: { min: 700, max: 1000, scaleMin: 0, scaleMax: 2500, unit: 'mg/kg' },
  ammonical_nitrogen: { min: 300, max: 600, scaleMin: 0, scaleMax: 1200, unit: 'mg/kg' },
  phosphorus: { min: 0.31, max: 0.51, scaleMin: 0, scaleMax: 1.2, unit: '%' },
  potassium: { min: 1.51, max: 2.51, scaleMin: 0, scaleMax: 6, unit: '%' },
  calcium: { min: 0.81, max: 1.51, scaleMin: 0, scaleMax: 4, unit: '%' },
  magnesium: { min: 0.25, max: 0.51, scaleMin: 0, scaleMax: 2, unit: '%' },
  sulphur: { min: 0.15, max: 0.51, scaleMin: 0, scaleMax: 1.2, unit: '%' },
  iron: { min: 80, max: 120, scaleMin: 0, scaleMax: 300, unit: 'mg/kg' },
  manganese: { min: 40, max: 100, scaleMin: 0, scaleMax: 200, unit: 'mg/kg' },
  zinc: { min: 30, max: 60, scaleMin: 0, scaleMax: 120, unit: 'mg/kg' },
  copper: { min: 5, max: 15, scaleMin: 0, scaleMax: 40, unit: 'mg/kg' },
  boron: { min: 30, max: 50, scaleMin: 0, scaleMax: 120, unit: 'mg/kg' },
  molybdenum: { min: 0.25, max: 0.51, scaleMin: 0, scaleMax: 1, unit: 'mg/kg' },
  sodium: { min: 0.01, max: 0.51, scaleMin: 0, scaleMax: 1.2, unit: '%' },
  chloride: { min: 0.05, max: 0.25, scaleMin: 0, scaleMax: 0.6, unit: '%' }
}

// Petiole parameter groups, mirroring the lab report layout. Order defines the
// display order in the comparison grid; the grid shows every parameter that
// has a value in at least one report.
export const PETIOLE_PARAM_GROUPS: { label: string; keys: string[] }[] = [
  {
    label: 'Major Nutrients',
    keys: ['total_nitrogen', 'nitrate_nitrogen', 'ammonical_nitrogen', 'phosphorus', 'potassium']
  },
  {
    label: 'Secondary Nutrients',
    keys: ['calcium', 'magnesium', 'sulphur']
  },
  {
    label: 'Micro Nutrients',
    keys: ['iron', 'manganese', 'zinc', 'copper', 'boron', 'molybdenum']
  },
  {
    label: 'Other',
    keys: ['sodium', 'chloride']
  }
]

export const PLAN_ITEM_UNIT_OPTIONS = ['kg/acre', 'g/acre', 'L/acre', 'ml/acre', 'ppm']

export interface DraftItem {
  id: string
  fertilizer_name: string
  quantity: string
  unit: string
  application_method: string
  // Optional tag tracking which flagged nutrient this row was seeded from.
  nutrient?: string
}

export function newDraftItem(): DraftItem {
  return {
    id: crypto.randomUUID(),
    fertilizer_name: '',
    quantity: '',
    unit: 'kg/acre',
    application_method: 'Soil application'
  }
}

export function draftFromPlanItem(item: FertilizerPlanItem): DraftItem {
  return {
    id: item.id,
    fertilizer_name: item.fertilizer_name,
    quantity: String(item.quantity ?? ''),
    unit: item.unit || 'kg/acre',
    application_method: item.application_method || 'Soil application'
  }
}

// Default recommendations shown as chips in the Workbench "Needs attention" bar.
export const NUTRIENT_RECOMMENDATIONS: Record<string, Partial<DraftItem>> = {
  total_nitrogen: {
    fertilizer_name: 'Urea',
    quantity: '25',
    unit: 'kg/acre',
    application_method: 'Drip fertigation'
  },
  potassium: {
    fertilizer_name: '13:0:45 (Potassium Nitrate)',
    quantity: '3',
    unit: 'kg/acre',
    application_method: 'Drip fertigation'
  },
  magnesium: {
    fertilizer_name: 'Magnesium Sulphate',
    quantity: '200',
    unit: 'g/acre',
    application_method: 'Foliar spray'
  },
  zinc: {
    fertilizer_name: 'Zinc Sulphate',
    quantity: '150',
    unit: 'g/acre',
    application_method: 'Foliar spray'
  },
  boron: {
    fertilizer_name: 'Boron 20%',
    quantity: '100',
    unit: 'g/acre',
    application_method: 'Foliar spray'
  },
  calcium: {
    fertilizer_name: 'Calcium Nitrate',
    quantity: '200',
    unit: 'g/acre',
    application_method: 'Foliar spray'
  },
  phosphorus: {
    fertilizer_name: '19:19:19 (NPK)',
    quantity: '2.5',
    unit: 'kg/acre',
    application_method: 'Drip fertigation'
  },
  iron: {
    fertilizer_name: 'Ferrous Sulphate',
    quantity: '100',
    unit: 'g/acre',
    application_method: 'Foliar spray'
  },
  manganese: {
    fertilizer_name: 'Manganese Sulphate',
    quantity: '100',
    unit: 'g/acre',
    application_method: 'Foliar spray'
  },
  copper: {
    fertilizer_name: 'Copper Sulphate',
    quantity: '50',
    unit: 'g/acre',
    application_method: 'Foliar spray'
  },
  sulphur: {
    fertilizer_name: 'Sulphur 90% WDG',
    quantity: '100',
    unit: 'g/acre',
    application_method: 'Foliar spray'
  },
  nitrate_nitrogen: {
    fertilizer_name: 'Calcium Nitrate',
    quantity: '25',
    unit: 'kg/acre',
    application_method: 'Drip fertigation'
  },
  ammonical_nitrogen: {
    fertilizer_name: 'Ammonium Sulphate',
    quantity: '25',
    unit: 'kg/acre',
    application_method: 'Drip fertigation'
  }
}
