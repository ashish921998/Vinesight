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
export type LogType = 'irrigation' | 'spray' | 'harvest' | 'expense' | 'fertigation'

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
  // Conditional display: only show field when another field has a specific value
  conditionalOn?: {
    field: string
    value: string | string[]
  }
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
      },
      {
        name: 'notes',
        type: 'textarea',
        label: 'Notes (Optional)',
        required: false,
        placeholder: 'e.g., Irrigated north section only, reduced duration due to rain forecast...',
        maxLength: 2000
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
      },
      {
        name: 'notes',
        type: 'textarea',
        label: 'Notes (Optional)',
        required: false,
        placeholder: 'e.g., Applied to north section only, weather conditions favorable...',
        maxLength: 2000
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
      },
      {
        name: 'notes',
        type: 'textarea',
        label: 'Notes (Optional)',
        required: false,
        placeholder: 'e.g., Harvested from rows 1-5, quality excellent...',
        maxLength: 2000
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
        options: ['materials', 'equipment', 'fuel', 'other']
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
        name: 'remarks',
        type: 'textarea',
        label: 'Remarks (Optional)',
        required: false,
        placeholder: 'e.g., Diesel for tractor, fertilizer purchase...',
        maxLength: 2000
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
        name: 'notes',
        type: 'textarea',
        label: 'Notes (Optional)',
        required: false,
        placeholder: 'e.g., Applied to all sections, timing details, observations...',
        maxLength: 2000
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
