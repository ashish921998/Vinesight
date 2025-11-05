/**
 * Utility functions for generating meaningful display text for farm activities
 */

import { formatChemicalData, formatChemicalsForDisplay, Chemical } from '@/lib/chemical-formatter'
import { logger } from '@/lib/logger'
import { TEXT_LIMITS } from './constants'

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

    case 'daily_note': {
      const note = activity.notes?.trim()
      if (note) {
        return note.length > TEXT_LIMITS.DAILY_NOTE_PREVIEW
          ? `${note.slice(0, TEXT_LIMITS.DAILY_NOTE_PREVIEW - 3)}…`
          : note
      }
      return 'Daily note'
    }

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

  if (logTypes.length === 1 && logTypes[0] === 'daily_note') {
    return totalCount === 1 ? 'Daily note added' : `${totalCount} daily notes added`
  }

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

// Define valid activity types for type safety
type ValidActivityType =
  | 'irrigation'
  | 'spray'
  | 'harvest'
  | 'expense'
  | 'fertigation'
  | 'soil_test'
  | 'petiole_test'

/**
 * Validate and normalize activity type
 */
function validateActivityType(type: string | undefined): ValidActivityType | null {
  if (!type || typeof type !== 'string') return null

  const validTypes: ValidActivityType[] = [
    'irrigation',
    'spray',
    'harvest',
    'expense',
    'fertigation',
    'soil_test',
    'petiole_test'
  ]
  return validTypes.includes(type as ValidActivityType) ? (type as ValidActivityType) : null
}

/**
 * Transform activities to log entries format for UnifiedDataLogsModal
 * @param activities - Array of activity logs
 * @returns Array of log entries in the format expected by UnifiedDataLogsModal
 */
export function transformActivitiesToLogEntries(activities: ActivityLog[]): Array<{
  id: string
  type: ValidActivityType
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
  return activities
    .map((activity) => {
      // Validate activity type
      const validatedType = validateActivityType(activity.type)
      if (!validatedType) {
        // Log warning for invalid activity type
        logger.warn(`Invalid activity type detected: ${activity.type}`, {
          activityId: activity.id,
          activityType: activity.type,
          date: activity.date
        })

        // Filter out invalid types instead of coercing to irrigation
        return null
      }

      // Validate report fields
      const hasValidReport =
        activity.report_url && activity.report_storage_path && activity.report_filename

      return {
        id: activity.id.toString(),
        type: validatedType,
        data: { ...activity },
        isValid: true,
        meta: hasValidReport
          ? {
              report: {
                storagePath: activity.report_storage_path!,
                signedUrl: activity.report_url!,
                filename: activity.report_filename!,
                mimeType: activity.report_mimeType || '',
                reportType: activity.report_type || '',
                extractionStatus: activity.extraction_status || '',
                extractionError: activity.extraction_error,
                parsedParameters: activity.parsed_parameters,
                rawNotes: activity.raw_notes
              }
            }
          : undefined
      }
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
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

      case 'daily_note': {
        const sampleNote = typeActivities[0]?.notes?.trim()
        if (sampleNote) {
          summary =
            sampleNote.length > TEXT_LIMITS.ACTIVITY_DISPLAY_PREVIEW
              ? `${sampleNote.slice(0, TEXT_LIMITS.ACTIVITY_DISPLAY_PREVIEW - 3)}…`
              : sampleNote
        } else {
          summary = 'Daily note'
        }
        break
      }

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
 * Normalize date string to YYYY-MM-DD format in a timezone-safe manner
 * @param dateString - Date string to normalize
 * @returns YYYY-MM-DD format string or null if parsing fails
 */
export function normalizeDateToYYYYMMDD(dateString: string | undefined | null): string | null {
  if (!dateString || typeof dateString !== 'string') {
    return null
  }

  try {
    // Check if already in YYYY-MM-DD format
    const yyyyMmDdPattern = /^(\d{4})-(\d{2})-(\d{2})$/
    if (yyyyMmDdPattern.test(dateString.trim())) {
      return dateString.trim()
    }

    // Try to extract YYYY-MM-DD pattern from the string
    const match = dateString.match(/\d{4}-\d{2}-\d{2}/)
    if (match && match[0]) {
      return match[0]
    }

    // For locale date strings (like "Mon Oct 15 2023"), parse as local time
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return null
    }

    // Return YYYY-MM-DD format using local time components
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (error) {
    return null
  }
}

/**
 * Format date for display in grouped activities
 * @param dateString - Date string to format
 * @returns Formatted date string
 */
export function formatGroupedDate(dateString: string): string {
  try {
    let date: Date

    // Check if dateString is in YYYY-MM-DD format and parse as local date
    const yyyyMmDdPattern = /^(\d{4})-(\d{2})-(\d{2})$/
    if (yyyyMmDdPattern.test(dateString)) {
      const match = dateString.match(yyyyMmDdPattern)
      if (match) {
        const year = parseInt(match[1], 10)
        const month = parseInt(match[2], 10) - 1 // Convert to 0-based month
        const day = parseInt(match[3], 10)
        date = new Date(year, month, day)
      } else {
        date = new Date(dateString)
      }
    } else {
      date = new Date(dateString)
    }

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
