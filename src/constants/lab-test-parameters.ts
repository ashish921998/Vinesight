/**
 * Shared lab test parameter definitions for soil and petiole tests
 * Used by LabTestComparisonTable and LabTestTrendCharts components
 */

export interface ParamOption {
  key: string
  label: string
  shortLabel: string
  unit: string
  optimalMin: number
  optimalMax: number
  color?: string // Optional color for chart visualization
}

// Soil parameter options with optimal ranges for grape cultivation
export const soilParamOptions: ParamOption[] = [
  {
    key: 'ph',
    label: 'pH',
    shortLabel: 'pH',
    unit: '',
    optimalMin: 6.5,
    optimalMax: 7.5,
    color: '#3b82f6'
  },
  {
    key: 'ec',
    label: 'EC',
    shortLabel: 'EC',
    unit: 'dS/m',
    optimalMin: 0.5,
    optimalMax: 2.0,
    color: '#10b981'
  },
  {
    key: 'nitrogen',
    label: 'Nitrogen',
    shortLabel: 'N',
    unit: 'ppm',
    optimalMin: 200,
    optimalMax: 400,
    color: '#8b5cf6'
  },
  {
    key: 'phosphorus',
    label: 'Phosphorus',
    shortLabel: 'P',
    unit: 'ppm',
    optimalMin: 30,
    optimalMax: 60,
    color: '#f59e0b'
  },
  {
    key: 'potassium',
    label: 'Potassium',
    shortLabel: 'K',
    unit: 'ppm',
    optimalMin: 250,
    optimalMax: 400,
    color: '#ef4444'
  },
  {
    key: 'calcium',
    label: 'Calcium',
    shortLabel: 'Ca',
    unit: 'ppm',
    optimalMin: 800,
    optimalMax: 1500,
    color: '#14b8a6'
  },
  {
    key: 'magnesium',
    label: 'Magnesium',
    shortLabel: 'Mg',
    unit: 'ppm',
    optimalMin: 150,
    optimalMax: 300,
    color: '#d946ef'
  },
  {
    key: 'sulfur',
    label: 'Sulfur',
    shortLabel: 'S',
    unit: 'ppm',
    optimalMin: 15,
    optimalMax: 30,
    color: '#f97316'
  },
  {
    key: 'organicCarbon',
    label: 'Organic Carbon',
    shortLabel: 'OC',
    unit: '%',
    optimalMin: 1.0,
    optimalMax: 2.5,
    color: '#84cc16'
  },
  {
    key: 'organicMatter',
    label: 'Organic Matter',
    shortLabel: 'OM',
    unit: '%',
    optimalMin: 2.0,
    optimalMax: 5.0,
    color: '#06b6d4'
  },
  {
    key: 'iron',
    label: 'Iron',
    shortLabel: 'Fe',
    unit: 'ppm',
    optimalMin: 4.5,
    optimalMax: 10.0,
    color: '#dc2626'
  },
  {
    key: 'manganese',
    label: 'Manganese',
    shortLabel: 'Mn',
    unit: 'ppm',
    optimalMin: 5,
    optimalMax: 15,
    color: '#7c3aed'
  },
  {
    key: 'zinc',
    label: 'Zinc',
    shortLabel: 'Zn',
    unit: 'ppm',
    optimalMin: 1.0,
    optimalMax: 3.0,
    color: '#6366f1'
  },
  {
    key: 'copper',
    label: 'Copper',
    shortLabel: 'Cu',
    unit: 'ppm',
    optimalMin: 0.5,
    optimalMax: 2.0,
    color: '#ea580c'
  },
  {
    key: 'boron',
    label: 'Boron',
    shortLabel: 'B',
    unit: 'ppm',
    optimalMin: 0.5,
    optimalMax: 1.5,
    color: '#ec4899'
  }
]

// Petiole parameter options with optimal ranges for grape cultivation
export const petioleParamOptions: ParamOption[] = [
  {
    key: 'total_nitrogen',
    label: 'Total Nitrogen',
    shortLabel: 'TN',
    unit: '%',
    optimalMin: 1.51,
    optimalMax: 2.21,
    color: '#3b82f6'
  },
  {
    key: 'nitrate_nitrogen',
    label: 'Nitrate N',
    shortLabel: 'NO₃-N',
    unit: 'ppm',
    optimalMin: 700,
    optimalMax: 1000,
    color: '#0ea5e9'
  },
  {
    key: 'ammonical_nitrogen',
    label: 'Ammonical N',
    shortLabel: 'NH₄-N',
    unit: 'ppm',
    optimalMin: 400,
    optimalMax: 700,
    color: '#38bdf8'
  },
  {
    key: 'phosphorus',
    label: 'Phosphorus',
    shortLabel: 'P',
    unit: '%',
    optimalMin: 0.31,
    optimalMax: 0.51,
    color: '#f59e0b'
  },
  {
    key: 'potassium',
    label: 'Potassium',
    shortLabel: 'K',
    unit: '%',
    optimalMin: 1.51,
    optimalMax: 2.01,
    color: '#ef4444'
  },
  {
    key: 'calcium',
    label: 'Calcium',
    shortLabel: 'Ca',
    unit: '%',
    optimalMin: 1.51,
    optimalMax: 2.21,
    color: '#10b981'
  },
  {
    key: 'magnesium',
    label: 'Magnesium',
    shortLabel: 'Mg',
    unit: '%',
    optimalMin: 0.31,
    optimalMax: 0.61,
    color: '#8b5cf6'
  },
  {
    key: 'sulfur',
    label: 'Sulfur',
    shortLabel: 'S',
    unit: '%',
    optimalMin: 0.15,
    optimalMax: 0.51,
    color: '#f97316'
  },
  {
    key: 'iron',
    label: 'Iron',
    shortLabel: 'Fe',
    unit: 'ppm',
    optimalMin: 80,
    optimalMax: 120,
    color: '#06b6d4'
  },
  {
    key: 'manganese',
    label: 'Manganese',
    shortLabel: 'Mn',
    unit: 'ppm',
    optimalMin: 40,
    optimalMax: 100,
    color: '#7c3aed'
  },
  {
    key: 'zinc',
    label: 'Zinc',
    shortLabel: 'Zn',
    unit: 'ppm',
    optimalMin: 50,
    optimalMax: 80,
    color: '#6366f1'
  },
  {
    key: 'copper',
    label: 'Copper',
    shortLabel: 'Cu',
    unit: 'ppm',
    optimalMin: 5,
    optimalMax: 15,
    color: '#ea580c'
  },
  {
    key: 'boron',
    label: 'Boron',
    shortLabel: 'B',
    unit: 'ppm',
    optimalMin: 25,
    optimalMax: 50,
    color: '#ec4899'
  },
  {
    key: 'molybdenum',
    label: 'Molybdenum',
    shortLabel: 'Mo',
    unit: 'ppm',
    optimalMin: 0.25,
    optimalMax: 0.51,
    color: '#84cc16'
  },
  {
    key: 'sodium',
    label: 'Sodium',
    shortLabel: 'Na',
    unit: '%',
    optimalMin: 0.01,
    optimalMax: 0.51,
    color: '#14b8a6'
  },
  {
    key: 'chloride',
    label: 'Chloride',
    shortLabel: 'Cl',
    unit: '%',
    optimalMin: 0.05,
    optimalMax: 0.25,
    color: '#d946ef'
  }
]
