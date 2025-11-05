/**
 * Centralized configuration for log types including icons, colors, and styling
 * Used across the application to maintain consistency in log type display
 */

import {
  Droplets,
  SprayCan,
  Scissors,
  IndianRupee,
  TestTube,
  Beaker,
  StickyNote
} from 'lucide-react'

/**
 * Log types that represent structured farm activities.
 * Note: 'daily_note' is handled separately as it's not a structured activity type
 * but rather a free-form note attached to a date. It's handled via special cases
 * in the helper functions below rather than being part of this union type.
 */
export type LogType =
  | 'irrigation'
  | 'spray'
  | 'harvest'
  | 'expense'
  | 'fertigation'
  | 'soil_test'
  | 'petiole_test'

export interface FormField {
  name: string
  type: 'text' | 'number' | 'select' | 'textarea'
  label: string
  required: boolean
  options?: string[]
  placeholder?: string
  min?: number
  max?: number
  step?: number
  maxLength?: number
}

export interface LogTypeConfig {
  icon: any
  color: string
  bgColor: string
  borderColor: string
  label: string
  fields: FormField[]
}

export const logTypeConfigs: Record<LogType, LogTypeConfig> = {
  irrigation: {
    icon: Droplets,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'Irrigation',
    fields: [
      {
        name: 'duration',
        type: 'number',
        label: 'Duration (hours)',
        required: true,
        min: 0,
        step: 0.1
      }
    ]
  },
  spray: {
    icon: SprayCan,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Spray Record',
    fields: [
      {
        name: 'water_volume',
        type: 'number',
        label: 'Water Volume (L)',
        required: true,
        min: 0,
        step: 0.1,
        placeholder: 'e.g., 1000'
      }
    ]
  },
  harvest: {
    icon: Scissors,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    label: 'Harvest',
    fields: [
      {
        name: 'quantity',
        type: 'number',
        label: 'Quantity (kg)',
        required: true,
        min: 0,
        step: 0.1
      },
      {
        name: 'grade',
        type: 'select',
        label: 'Grade',
        required: true,
        options: ['Premium', 'Standard', 'Below Standard']
      },
      {
        name: 'price',
        type: 'number',
        label: 'Price per kg (₹)',
        required: false,
        min: 0,
        step: 0.01
      },
      {
        name: 'buyer',
        type: 'text',
        label: 'Buyer',
        required: false,
        placeholder: 'Buyer name',
        maxLength: 1000
      }
    ]
  },
  expense: {
    icon: IndianRupee,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Expense',
    fields: [
      {
        name: 'type',
        type: 'select',
        label: 'Category',
        required: true,
        options: ['labor', 'materials', 'equipment', 'other']
      },
      {
        name: 'description',
        type: 'text',
        label: 'Description',
        required: true,
        placeholder: 'Brief description',
        maxLength: 1000
      },
      {
        name: 'cost',
        type: 'number',
        label: 'Amount (₹)',
        required: true,
        min: 0,
        step: 0.01
      },
      {
        name: 'vendor',
        type: 'text',
        label: 'Vendor',
        required: false,
        placeholder: 'Vendor name (optional)',
        maxLength: 1000
      }
    ]
  },
  fertigation: {
    icon: Beaker,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    label: 'Fertigation',
    fields: [
      {
        name: 'fertilizer',
        type: 'text',
        label: 'Fertilizer Type',
        required: true,
        placeholder: 'e.g., NPK 19:19:19',
        maxLength: 1000
      },
      {
        name: 'quantity',
        type: 'number',
        label: 'Quantity',
        required: false,
        min: 0,
        step: 0.1
      },
      {
        name: 'unit',
        type: 'select',
        label: 'Unit',
        required: false,
        options: ['kg/acre', 'liter/acre']
      }
    ]
  },
  soil_test: {
    icon: TestTube,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    label: 'Soil Test',
    fields: [
      {
        name: 'ph',
        type: 'number',
        label: 'pH Level',
        required: true,
        min: 0,
        max: 14,
        step: 0.1
      },
      {
        name: 'ec',
        type: 'number',
        label: 'EC (dS/m)',
        required: false,
        min: 0,
        step: 0.01
      },
      {
        name: 'organicCarbon',
        type: 'number',
        label: 'Organic Carbon (%)',
        required: false,
        min: 0,
        step: 0.01
      },
      {
        name: 'organicMatter',
        type: 'number',
        label: 'Organic Matter (%)',
        required: false,
        min: 0,
        step: 0.01
      },
      {
        name: 'nitrogen',
        type: 'number',
        label: 'Nitrogen (%)',
        required: false,
        min: 0,
        step: 0.01
      },
      {
        name: 'phosphorus',
        type: 'number',
        label: 'Phosphorus (ppm)',
        required: false,
        min: 0,
        step: 0.1
      },
      {
        name: 'potassium',
        type: 'number',
        label: 'Potassium (ppm)',
        required: false,
        min: 0,
        step: 0.1
      },
      {
        name: 'calcium',
        type: 'number',
        label: 'Calcium (ppm)',
        required: false,
        min: 0
      },
      {
        name: 'magnesium',
        type: 'number',
        label: 'Magnesium (ppm)',
        required: false,
        min: 0
      },
      {
        name: 'sulfur',
        type: 'number',
        label: 'Sulfur (ppm)',
        required: false,
        min: 0
      },
      {
        name: 'iron',
        type: 'number',
        label: 'Ferrous / Iron (ppm)',
        required: false,
        min: 0
      },
      {
        name: 'manganese',
        type: 'number',
        label: 'Manganese (ppm)',
        required: false,
        min: 0
      },
      {
        name: 'zinc',
        type: 'number',
        label: 'Zinc (ppm)',
        required: false,
        min: 0
      },
      {
        name: 'copper',
        type: 'number',
        label: 'Copper (ppm)',
        required: false,
        min: 0
      },
      {
        name: 'boron',
        type: 'number',
        label: 'Boron (ppm)',
        required: false,
        min: 0
      },
      {
        name: 'molybdenum',
        type: 'number',
        label: 'Molybdenum (ppm)',
        required: false,
        min: 0
      },
      {
        name: 'sodium',
        type: 'number',
        label: 'Sodium (ppm)',
        required: false,
        min: 0
      },
      {
        name: 'chloride',
        type: 'number',
        label: 'Chloride (ppm)',
        required: false,
        min: 0
      },
      {
        name: 'calciumCarbonate',
        type: 'number',
        label: 'Calcium Carbonate (ppm)',
        required: false,
        min: 0
      },
      {
        name: 'carbonate',
        type: 'number',
        label: 'Carbonate (ppm)',
        required: false,
        min: 0
      },
      {
        name: 'bicarbonate',
        type: 'number',
        label: 'Bicarbonate (ppm)',
        required: false,
        min: 0
      }
    ]
  },
  petiole_test: {
    icon: TestTube,
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Petiole Test',
    fields: [
      {
        name: 'total_nitrogen',
        type: 'number',
        label: 'Total Nitrogen (%)',
        required: false,
        min: 0
      },
      {
        name: 'nitrate_nitrogen',
        type: 'number',
        label: 'Nitrate Nitrogen (PPM)',
        required: false,
        min: 0
      },
      {
        name: 'ammonical_nitrogen',
        type: 'number',
        label: 'Ammonical Nitrogen (PPM)',
        required: false,
        min: 0
      },
      {
        name: 'phosphorus',
        type: 'number',
        label: 'Phosphorus (%)',
        required: false,
        min: 0
      },
      {
        name: 'potassium',
        type: 'number',
        label: 'Potassium (%)',
        required: false,
        min: 0
      },
      {
        name: 'calcium',
        type: 'number',
        label: 'Calcium (%)',
        required: false,
        min: 0
      },
      {
        name: 'magnesium',
        type: 'number',
        label: 'Magnesium (%)',
        required: false,
        min: 0
      },
      {
        name: 'sulphur',
        type: 'number',
        label: 'Sulphur (%)',
        required: false,
        min: 0
      },
      {
        name: 'ferrous',
        type: 'number',
        label: 'Ferrous (PPM)',
        required: false,
        min: 0
      },
      {
        name: 'manganese',
        type: 'number',
        label: 'Manganese (PPM)',
        required: false,
        min: 0
      },
      {
        name: 'zinc',
        type: 'number',
        label: 'Zinc (PPM)',
        required: false,
        min: 0
      },
      {
        name: 'copper',
        type: 'number',
        label: 'Copper (PPM)',
        required: false,
        min: 0
      },
      {
        name: 'boron',
        type: 'number',
        label: 'Boron (PPM)',
        required: false,
        min: 0
      },
      {
        name: 'molybdenum',
        type: 'number',
        label: 'Molybdenum (PPM)',
        required: false,
        min: 0
      },
      {
        name: 'sodium',
        type: 'number',
        label: 'Sodium (%)',
        required: false,
        min: 0
      },
      {
        name: 'chloride',
        type: 'number',
        label: 'Chloride (%)',
        required: false,
        min: 0
      },
      {
        name: 'carbonate',
        type: 'number',
        label: 'Carbonate (PPM)',
        required: false,
        min: 0
      },
      {
        name: 'bicarbonate',
        type: 'number',
        label: 'Bicarbonate (PPM)',
        required: false,
        min: 0
      }
    ]
  }
}

/**
 * Get the icon component for a given log type
 */
export function getLogTypeIcon(type: string): any {
  if (type === 'daily_note') {
    return StickyNote
  }
  const config = logTypeConfigs[type as LogType]
  return config?.icon || TestTube // Fallback icon
}

/**
 * Get the color class for a given log type
 */
export function getLogTypeColor(type: string): string {
  if (type === 'daily_note') {
    return 'text-amber-600'
  }
  const config = logTypeConfigs[type as LogType]
  return config?.color || 'text-gray-600'
}

/**
 * Get the background color class for a given log type
 */
export function getLogTypeBgColor(type: string): string {
  if (type === 'daily_note') {
    return 'bg-amber-50'
  }
  const config = logTypeConfigs[type as LogType]
  return config?.bgColor || 'bg-gray-50'
}

/**
 * Get the border color class for a given log type
 */
export function getLogTypeBorderColor(type: string): string {
  if (type === 'daily_note') {
    return 'border-amber-200'
  }
  const config = logTypeConfigs[type as LogType]
  return config?.borderColor || 'border-gray-200'
}

/**
 * Get the label for a given log type
 */
export function getLogTypeLabel(type: string): string {
  const config = logTypeConfigs[type as LogType]
  return config?.label || type.replace(/_/g, ' ')
}

/**
 * Get all log type configurations for select options
 */
export function getLogTypeOptions(): Array<{ value: LogType; label: string }> {
  return Object.entries(logTypeConfigs).map(([value, config]) => ({
    value: value as LogType,
    label: config.label
  }))
}
