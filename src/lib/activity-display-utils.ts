/**
 * Utility functions for generating meaningful display text for farm activities
 */

import { formatChemicalData, formatChemicalsForDisplay, Chemical } from '@/lib/chemical-formatter'
import { logger } from '@/lib/logger'

interface ActivityLog {
  id: number
  type: string
  date: string
  notes?: string
  duration?: number
  chemical?: string
  chemicals?: Array<{ name: string; quantity: number; unit: string }>
  quantity?: number
  cost?: number
  fertilizer?: string
  created_at: string
}

/**
 * Get the most meaningful display text for an activity
 * @param activity - The activity log object
 * @returns String to display as the main activity text
 */
export function getActivityDisplayData(activity: ActivityLog): string {
  // Add null/undefined guard for activity
  if (!activity) {
    return 'Unknown Activity'
  }

  // Add null/undefined guard for activity type
  if (!activity.type) {
    return 'Unknown Activity'
  }

  switch (activity.type) {
    case 'irrigation':
      return getIrrigationDisplayText(activity)

    case 'spray':
      return getSprayDisplayText(activity)

    case 'harvest':
      return getHarvestDisplayText(activity)

    case 'expense':
      return getExpenseDisplayText(activity)

    case 'fertigation':
      return getFertigationDisplayText(activity)

    case 'soil_test':
      return getTestDateDisplayText(activity)

    case 'petiole_test':
      return getTestDateDisplayText(activity)

    default:
      // Add null/undefined guard for type replacement
      return activity.type ? activity.type.replace(/_/g, ' ') : 'Unknown Activity'
  }
}

/**
 * Format irrigation duration display
 */
function getIrrigationDisplayText(activity: ActivityLog): string {
  // Add null/undefined guard and validation
  if (
    activity.duration !== undefined &&
    activity.duration !== null &&
    !isNaN(activity.duration) &&
    activity.duration > 0
  ) {
    // Ensure duration is a reasonable number
    const duration = Number(activity.duration)
    if (isFinite(duration)) {
      return `${duration} hrs`
    }
  }
  return 'Irrigation'
}

/**
 * Format spray chemical display
 */
function getSprayDisplayText(activity: ActivityLog): string {
  // Check for chemicals array first (new format)
  if (activity.chemicals && Array.isArray(activity.chemicals) && activity.chemicals.length > 0) {
    try {
      // Validate chemicals array structure
      const validChemicals = activity.chemicals.filter(
        (chem) =>
          chem &&
          typeof chem === 'object' &&
          typeof chem.name === 'string' &&
          chem.name.trim() !== '' &&
          typeof chem.quantity === 'number' &&
          isFinite(chem.quantity) &&
          chem.quantity > 0
      ) as Chemical[]

      if (validChemicals.length > 0) {
        const formattedChemicals = formatChemicalsForDisplay(validChemicals, 30)
        if (formattedChemicals && formattedChemicals.trim() !== '') {
          return formattedChemicals
        }
      }
    } catch (error) {
      // If formatting fails, continue to fallback
      logger.warn('Error formatting chemicals array:', error)
    }
  }

  // Fallback to legacy chemical field
  if (activity.chemical && typeof activity.chemical === 'string') {
    const chemical = activity.chemical.trim()
    if (chemical !== '') {
      // Use the updated chemical formatter for legacy field
      const formattedLegacy = formatChemicalData(chemical)
      if (formattedLegacy && formattedLegacy.trim() !== '') {
        // Apply truncation if very long
        return formattedLegacy.length > 30
          ? formattedLegacy.substring(0, 27) + '...'
          : formattedLegacy
      }
      // If formatter returns empty, use the original value
      return chemical.length > 30 ? chemical.substring(0, 27) + '...' : chemical
    }
  }

  return 'Spray'
}

/**
 * Format harvest quantity display
 */
function getHarvestDisplayText(activity: ActivityLog): string {
  // Add null/undefined guard and validation
  if (
    activity.quantity !== undefined &&
    activity.quantity !== null &&
    !isNaN(activity.quantity) &&
    activity.quantity > 0
  ) {
    // Ensure quantity is a reasonable number
    const quantity = Number(activity.quantity)
    if (isFinite(quantity)) {
      return `${quantity} kg`
    }
  }
  return 'Harvest'
}

/**
 * Format expense cost display
 */
function getExpenseDisplayText(activity: ActivityLog): string {
  // Add null/undefined guard and validation
  if (
    activity.cost !== undefined &&
    activity.cost !== null &&
    !isNaN(activity.cost) &&
    activity.cost > 0
  ) {
    // Ensure cost is a reasonable number
    const cost = Number(activity.cost)
    if (isFinite(cost)) {
      try {
        return `₹${cost.toLocaleString('en-IN')}`
      } catch (error) {
        // Fallback if toLocaleString fails
        return `₹${cost.toFixed(2)}`
      }
    }
  }
  return 'Expense'
}

/**
 * Format fertilizer display
 */
function getFertigationDisplayText(activity: ActivityLog): string {
  // Add null/undefined guard and type checking
  if (activity.fertilizer && typeof activity.fertilizer === 'string') {
    const fertilizer = activity.fertilizer.trim()
    if (fertilizer !== '') {
      // Use the updated chemical formatter for consistency
      const formattedFertilizer = formatChemicalData(fertilizer)
      if (formattedFertilizer && formattedFertilizer.trim() !== '') {
        // Apply truncation if very long
        return formattedFertilizer.length > 25
          ? formattedFertilizer.substring(0, 22) + '...'
          : formattedFertilizer
      }
      // If formatter returns empty, use the original value
      return fertilizer.length > 25 ? fertilizer.substring(0, 22) + '...' : fertilizer
    }
  }
  return 'Fertigation'
}

/**
 * Format test date display for soil and petiole tests
 */
function getTestDateDisplayText(activity: ActivityLog): string {
  // Add null/undefined guard for date
  if (!activity.date) {
    return activity.type ? activity.type.replace(/_/g, ' ') : 'Test'
  }

  try {
    const date = new Date(activity.date)
    if (isNaN(date.getTime())) {
      return activity.type ? activity.type.replace(/_/g, ' ') : 'Test'
    }

    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }

    try {
      return date.toLocaleDateString('en-IN', options)
    } catch (localeError) {
      // Fallback if locale formatting fails
      return date.toLocaleDateString()
    }
  } catch (error) {
    return activity.type ? activity.type.replace(/_/g, ' ') : 'Test'
  }
}
