/**
 * Utility functions for generating meaningful display text for farm activities
 */

interface ActivityLog {
  id: number
  type: string
  date: string
  notes?: string
  duration?: number
  chemical?: string
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
      return activity.type.replace(/_/g, ' ')
  }
}

/**
 * Format irrigation duration display
 */
function getIrrigationDisplayText(activity: ActivityLog): string {
  if (activity.duration !== undefined && activity.duration > 0) {
    return `${activity.duration} hrs`
  }
  return 'Irrigation'
}

/**
 * Format spray chemical display
 */
function getSprayDisplayText(activity: ActivityLog): string {
  if (activity.chemical && activity.chemical.trim()) {
    // Truncate if very long
    const chemical = activity.chemical.trim()
    return chemical.length > 30 ? chemical.substring(0, 27) + '...' : chemical
  }
  return 'Spray'
}

/**
 * Format harvest quantity display
 */
function getHarvestDisplayText(activity: ActivityLog): string {
  if (activity.quantity !== undefined && activity.quantity > 0) {
    return `${activity.quantity} kg`
  }
  return 'Harvest'
}

/**
 * Format expense cost display
 */
function getExpenseDisplayText(activity: ActivityLog): string {
  if (activity.cost !== undefined && activity.cost > 0) {
    return `₹${activity.cost.toLocaleString('en-IN')}`
  }
  return 'Expense'
}

/**
 * Format fertilizer display
 */
function getFertigationDisplayText(activity: ActivityLog): string {
  if (activity.fertilizer && activity.fertilizer.trim()) {
    const fertilizer = activity.fertilizer.trim()
    return fertilizer.length > 25 ? fertilizer.substring(0, 22) + '...' : fertilizer
  }
  return 'Fertigation'
}

/**
 * Format test date display for soil and petiole tests
 */
function getTestDateDisplayText(activity: ActivityLog): string {
  try {
    const date = new Date(activity.date)
    if (isNaN(date.getTime())) {
      return activity.type.replace(/_/g, ' ')
    }
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }
    return date.toLocaleDateString('en-IN', options)
  } catch (error) {
    return activity.type.replace(/_/g, ' ')
  }
}
