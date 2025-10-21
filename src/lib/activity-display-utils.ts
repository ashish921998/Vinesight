/**
 * Utility functions for generating meaningful display text for farm activities
 */

import { formatChemicalData } from '@/lib/chemical-formatter'

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
  // Report-related properties for soil and petiole tests
  report_url?: string
  report_storage_path?: string
  report_filename?: string
  report_mimeType?: string
  report_type?: string
  extraction_status?: string
  extraction_error?: string
  parsed_parameters?: Record<string, number>
  raw_notes?: string
}

export interface GroupedActivities {
  date: string
  activities: ActivityLog[]
  totalCount: number
  logTypes: string[]
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
  // Check for chemicals array first (new format)
  if (activity.chemicals && Array.isArray(activity.chemicals)) {
    const formattedChemicals = formatChemicalData(activity.chemicals)
    if (formattedChemicals) {
      // Truncate if very long
      return formattedChemicals.length > 30
        ? formattedChemicals.substring(0, 27) + '...'
        : formattedChemicals
    }
  }

  // Fallback to legacy chemical field
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

/**
 * Group activities by date for better organization
 * @param activities - Array of activity logs
 * @returns Array of grouped activities by date
 */
export function groupActivitiesByDate(activities: ActivityLog[]): GroupedActivities[] {
  const grouped: Record<string, ActivityLog[]> = {}

  // Group activities by date
  activities.forEach((activity) => {
    const date = activity.date || activity.created_at
    if (!date) return

    const dateKey = new Date(date).toDateString()
    if (!grouped[dateKey]) {
      grouped[dateKey] = []
    }
    grouped[dateKey].push(activity)
  })

  // Convert to array and sort by date (newest first)
  return Object.entries(grouped)
    .map(([date, activities]) => ({
      date,
      activities: activities.sort(
        (a, b) =>
          new Date(b.date || b.created_at || '').getTime() -
          new Date(a.date || a.created_at || '').getTime()
      ),
      totalCount: activities.length,
      logTypes: [...new Set(activities.map((a) => a.type))]
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

/**
 * Get all logs for a specific date
 * @param activities - Array of activity logs
 * @param targetDate - The date to extract logs for
 * @returns Array of activities for the specified date
 */
export function getLogsForDate(activities: ActivityLog[], targetDate: string): ActivityLog[] {
  const targetDateKey = new Date(targetDate).toDateString()
  return activities.filter((activity) => {
    const activityDate = activity.date || activity.created_at
    if (!activityDate) return false
    return new Date(activityDate).toDateString() === targetDateKey
  })
}

/**
 * Get a summary text for a group of activities
 * @param grouped - Grouped activities object
 * @returns Summary string for display
 */
export function getGroupedActivitiesSummary(grouped: GroupedActivities): string {
  const { totalCount, logTypes } = grouped

  if (totalCount === 1) {
    return `1 log: ${logTypes[0].replace(/_/g, ' ')}`
  }

  const typeNames = logTypes.map((type) => type.replace(/_/g, ' '))

  if (typeNames.length === 1) {
    return `${totalCount} ${typeNames[0]} logs`
  }

  if (typeNames.length === 2) {
    return `${totalCount} logs: ${typeNames.join(' & ')}`
  }

  return `${totalCount} logs: ${typeNames.slice(0, 2).join(', ')} & ${typeNames.length - 2} more`
}

/**
 * Transform activities to log entries format for UnifiedDataLogsModal
 * @param activities - Array of activity logs
 * @returns Array of log entries in the format expected by UnifiedDataLogsModal
 */
export function transformActivitiesToLogEntries(activities: ActivityLog[]): Array<{
  id: string
  type: any
  data: Record<string, any>
  isValid: boolean
  meta?: {
    report?: {
      storagePath: string
      signedUrl: string
      filename: string
      mimeType: string
      reportType: string
      extractionStatus: string
      extractionError?: string
      parsedParameters?: Record<string, number>
      rawNotes?: string
    }
  }
}> {
  return activities.map((activity) => ({
    id: activity.id.toString(),
    type: activity.type as any,
    data: { ...activity },
    isValid: true,
    meta: activity.report_url
      ? {
          report: {
            storagePath: activity.report_storage_path || '',
            signedUrl: activity.report_url,
            filename: activity.report_filename || '',
            mimeType: activity.report_mimeType || '',
            reportType: activity.report_type || '',
            extractionStatus: activity.extraction_status || '',
            extractionError: activity.extraction_error,
            parsedParameters: activity.parsed_parameters,
            rawNotes: activity.raw_notes
          }
        }
      : undefined
  }))
}

/**
 * Get summary items for an array of activities
 * @param activities - Array of activity logs
 * @returns Array of summary objects with type, summary, and count
 */
export function getActivitiesSummary(activities: ActivityLog[]): Array<{
  type: string
  summary: string
  count: number
}> {
  // Group activities by type
  const groupedByType: Record<string, ActivityLog[]> = {}

  activities.forEach((activity) => {
    if (!groupedByType[activity.type]) {
      groupedByType[activity.type] = []
    }
    groupedByType[activity.type].push(activity)
  })

  // Create summary items for each type
  return Object.entries(groupedByType).map(([type, typeActivities]) => {
    const count = typeActivities.length
    let summary = ''

    // Create type-specific summary
    switch (type) {
      case 'irrigation': {
        const totalDuration = typeActivities.reduce((sum, act) => sum + (act.duration || 0), 0)
        summary = totalDuration > 0 ? `${totalDuration} hrs irrigation` : 'Irrigation'
        break
      }

      case 'spray': {
        // Get unique chemicals
        const chemicals = new Set<string>()
        typeActivities.forEach((act) => {
          if (act.chemical && act.chemical.trim()) {
            chemicals.add(act.chemical.trim())
          }
          if (act.chemicals && Array.isArray(act.chemicals)) {
            act.chemicals.forEach((chem) => {
              if (chem.name && chem.name.trim()) {
                chemicals.add(chem.name.trim())
              }
            })
          }
        })
        if (chemicals.size > 0) {
          summary = Array.from(chemicals).join(', ')
        } else {
          summary = 'Spray'
        }
        break
      }

      case 'harvest': {
        const totalQuantity = typeActivities.reduce((sum, act) => sum + (act.quantity || 0), 0)
        summary = totalQuantity > 0 ? `${totalQuantity} kg harvested` : 'Harvest'
        break
      }

      case 'expense': {
        const totalCost = typeActivities.reduce((sum, act) => sum + (act.cost || 0), 0)
        summary = totalCost > 0 ? `₹${totalCost.toLocaleString('en-IN')} expenses` : 'Expense'
        break
      }

      case 'fertigation': {
        const fertilizers = new Set<string>()
        typeActivities.forEach((act) => {
          if (act.fertilizer && act.fertilizer.trim()) {
            fertilizers.add(act.fertilizer.trim())
          }
        })
        if (fertilizers.size > 0) {
          summary = Array.from(fertilizers).join(', ')
        } else {
          summary = 'Fertigation'
        }
        break
      }

      case 'soil_test':
      case 'petiole_test':
        summary = type.replace(/_/g, ' ')
        break

      default:
        summary = type.replace(/_/g, ' ')
    }

    return {
      type,
      summary,
      count
    }
  })
}

/**
 * Format date for display in grouped activities
 * @param dateString - Date string to format
 * @returns Formatted date string
 */
export function formatGroupedDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      }
      return date.toLocaleDateString('en-IN', options)
    }
  } catch (error) {
    return dateString
  }
}
