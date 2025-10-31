/**
 * Unified Activity Type System for VineSight
 *
 * This file defines the canonical activity types that should be used
 * throughout the entire application. All activity-related components,
 * services, and utilities should import and use these types.
 */

import type { Database, Json } from './database'

export type DatabaseRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

// ============================================================================
// BASE ACTIVITY INTERFACES
// ============================================================================

/**
 * Core activity interface with all common fields that apply to all activity types
 * This represents the unified structure that combines fields from different activity tables
 */
export interface BaseActivity {
  // Core identification (flexible to match existing data structures)
  id: number | undefined

  type: ActivityType

  // Timing information
  date: string
  created_at?: string

  // Farm association
  farm_id?: number
  farmId?: number // camelCase version for React components

  // Common descriptive fields
  notes?: string | null
  description?: string | null

  // Metadata for tracking
  metadata?: Record<string, unknown>
}

// ============================================================================
// SPECIFIC ACTIVITY TYPES
// ============================================================================

/**
 * Type-safe union of all possible activity types
 */
export type ActivityType =
  | 'irrigation'
  | 'spray'
  | 'harvest'
  | 'fertigation'
  | 'soil_test'
  | 'petiole_test'
  | 'expense'
  | 'pruning'
  | 'maintenance'
  | 'monitoring'

/**
 * Complete Activity interface with discriminated unions for type-specific data
 */
export type Activity = BaseActivity & {
  // Type-specific data fields
  irrigation?: IrrigationActivityData
  spray?: SprayActivityData
  harvest?: HarvestActivityData
  fertigation?: FertigationActivityData
  soil_test?: TestActivityData
  petiole_test?: TestActivityData
  expense?: ExpenseActivityData
  pruning?: PruningActivityData
  maintenance?: MaintenanceActivityData
  monitoring?: MonitoringActivityData
}

// ============================================================================
// TYPE-SPECIFIC DATA INTERFACES
// ============================================================================

/**
 * Irrigation activity specific data
 */
export interface IrrigationActivityData {
  duration?: number // hours
  area?: number // acres
  moisture_status?: string
  growth_stage?: string
  system_discharge?: number // liters per hour
}

/**
 * Spray activity specific data
 */
export interface SprayActivityData {
  area?: number // acres
  chemicals?: Array<{
    name: string
    quantity: number
    unit: string
  }>
  chemical?: string // legacy field for backward compatibility
  operator?: string
  weather?: string
  water_volume?: number // liters
  quantity_amount?: number
  quantity_unit?: string
}

/**
 * Harvest activity specific data
 */
export interface HarvestActivityData {
  quantity?: number // kg
  grade?: string
  buyer?: string
  price?: number // per kg
}

/**
 * Fertigation activity specific data
 */
export interface FertigationActivityData {
  fertilizer?: string
  quantity?: number
  unit?: string
  dose?: string // legacy field
  area?: number // acres
  purpose?: string
}

/**
 * Test activity data (for soil and petiole tests)
 */
export interface TestActivityData {
  report_url?: string
  report_storage_path?: string
  report_filename?: string
  report_mimeType?: string
  report_type?: string
  extraction_status?: string
  extraction_error?: string
  parsed_parameters?: Json
  raw_notes?: string
  parameters?: Json // JSON data from database
  recommendations?: string
}

/**
 * Expense activity data
 */
export interface ExpenseActivityData {
  cost?: number
  category?: string
  description?: string
  remarks?: string
  type?: string
}

/**
 * Pruning activity data
 */
export interface PruningActivityData {
  method?: string
  area?: number
  notes?: string
}

/**
 * Maintenance activity data
 */
export interface MaintenanceActivityData {
  equipment?: string
  duration?: number
  cost?: number
  description?: string
}

/**
 * Monitoring activity data
 */
export interface MonitoringActivityData {
  observations?: string
  conditions?: string
  findings?: Record<string, unknown>
}

// ============================================================================
// DATABASE ROW TO ACTIVITY CONVERTERS
// ============================================================================

/**
 * Convert database irrigation record to Activity
 */
export function irrigationRecordToActivity(record: DatabaseRow<'irrigation_records'>): Activity {
  return {
    id: record.id,
    type: 'irrigation',
    date: record.date,
    created_at: record.created_at || undefined,
    farm_id: record.farm_id,
    farmId: record.farm_id,
    notes: record.notes || undefined,
    description: record.notes || undefined,
    irrigation: {
      duration: record.duration || undefined,
      area: record.area || undefined,
      moisture_status: record.moisture_status || undefined,
      growth_stage: record.growth_stage || undefined,
      system_discharge: record.system_discharge || undefined
    },
    metadata: {
      database_type: 'irrigation_records',
      record_id: record.id
    }
  }
}

/**
 * Convert database fertigation record to Activity
 */
export function fertigationRecordToActivity(record: DatabaseRow<'fertigation_records'>): Activity {
  return {
    id: record.id,
    type: 'fertigation',
    date: record.date,
    created_at: record.created_at || undefined,
    farm_id: record.farm_id,
    farmId: record.farm_id,
    notes: record.notes || undefined,
    description: record.notes || undefined,
    fertigation: {
      fertilizer: record.fertilizer || undefined,
      quantity: record.quantity || undefined,
      unit: record.unit || undefined,
      dose: record.dose || undefined, // legacy field
      area: record.area || undefined,
      purpose: record.purpose || undefined
    },
    metadata: {
      database_type: 'fertigation_records',
      record_id: record.id
    }
  }
}

/**
 * Convert database harvest record to Activity
 */
export function harvestRecordToActivity(record: DatabaseRow<'harvest_records'>): Activity {
  return {
    id: record.id,
    type: 'harvest',
    date: record.date,
    created_at: record.created_at || undefined,
    farm_id: record.farm_id,
    farmId: record.farm_id,
    notes: record.notes || undefined,
    description: record.notes || undefined,
    harvest: {
      quantity: record.quantity || undefined,
      grade: record.grade || undefined,
      buyer: record.buyer || undefined,
      price: record.price || undefined
    },
    metadata: {
      database_type: 'harvest_records',
      record_id: record.id
    }
  }
}

/**
 * Convert database soil test record to Activity
 */
export function soilTestRecordToActivity(record: DatabaseRow<'soil_test_records'>): Activity {
  return {
    id: record.id,
    type: 'soil_test',
    date: record.date,
    created_at: record.created_at || undefined,
    farm_id: record.farm_id,
    farmId: record.farm_id,
    notes: record.notes || undefined,
    description: record.notes || undefined,
    soil_test: {
      report_url: record.report_url || undefined,
      report_storage_path: record.report_storage_path || undefined,
      report_filename: record.report_filename || undefined,
      report_type: record.report_type || undefined,
      extraction_status: record.extraction_status || undefined,
      extraction_error: record.extraction_error || undefined,
      parsed_parameters: record.parsed_parameters,
      raw_notes: record.raw_notes || undefined,
      parameters: record.parameters,
      recommendations: record.recommendations || undefined
    },
    metadata: {
      database_type: 'soil_test_records',
      record_id: record.id
    }
  }
}

/**
 * Convert database petiole test record to Activity
 */
export function petioleTestRecordToActivity(record: DatabaseRow<'petiole_test_records'>): Activity {
  return {
    id: record.id,
    type: 'petiole_test',
    date: record.date,
    created_at: record.created_at || undefined,
    farm_id: record.farm_id,
    farmId: record.farm_id,
    notes: record.notes || undefined,
    description: record.notes || undefined,
    petiole_test: {
      report_url: record.report_url || undefined,
      report_storage_path: record.report_storage_path || undefined,
      report_filename: record.report_filename || undefined,
      report_type: record.report_type || undefined,
      extraction_status: record.extraction_status || undefined,
      extraction_error: record.extraction_error || undefined,
      parsed_parameters: record.parsed_parameters || undefined,
      raw_notes: record.raw_notes || undefined,
      parameters: record.parameters || undefined,
      recommendations: record.recommendations || undefined
    },
    metadata: {
      database_type: 'petiole_test_records',
      record_id: record.id
    }
  }
}

/**
 * Convert database expense record to Activity
 */
export function expenseRecordToActivity(record: DatabaseRow<'expense_records'>): Activity {
  return {
    id: record.id,
    type: 'expense',
    date: record.date,
    created_at: record.created_at || undefined,
    farm_id: record.farm_id,
    farmId: record.farm_id,
    notes: record.remarks || undefined,
    description: record.description,
    expense: {
      cost: record.cost || undefined,
      category: record.type || undefined,
      description: record.description,
      remarks: record.remarks || undefined,
      type: record.type || undefined
    },
    metadata: {
      database_type: 'expense_records',
      record_id: record.id
    }
  }
}

// ============================================================================
// AGGREGATED ACTIVITY FOR DASHBOARD
// ============================================================================

/**
 * Activity with additional farm information for dashboard display
 */
export interface AggregatedActivity extends Omit<Activity, 'id'> {
  id: number | undefined // Allow undefined to match ActivityRecord
  farmName?: string
  farmId: number // Required for dashboard
}

/**
 * Legacy activity record with permissive index signature for compatibility
 */
export interface LegacyActivityRecord extends AggregatedActivity {
  [key: string]: unknown // Index signature for compatibility with ActivityRecord
}

/**
 * Type guard to check if an activity has irrigation data
 */
export function isIrrigationActivity(
  activity: Activity
): activity is Activity & { irrigation: IrrigationActivityData } {
  return activity.type === 'irrigation' && activity.irrigation !== undefined
}

/**
 * Type guard to check if an activity has spray data
 */
export function isSprayActivity(
  activity: Activity
): activity is Activity & { spray: SprayActivityData } {
  return activity.type === 'spray' && activity.spray !== undefined
}

/**
 * Type guard to check if an activity has harvest data
 */
export function isHarvestActivity(
  activity: Activity
): activity is Activity & { harvest: HarvestActivityData } {
  return activity.type === 'harvest' && activity.harvest !== undefined
}

/**
 * Type guard to check if an activity has fertigation data
 */
export function isFertigationActivity(
  activity: Activity
): activity is Activity & { fertigation: FertigationActivityData } {
  return activity.type === 'fertigation' && activity.fertigation !== undefined
}

/**
 * Type guard to check if an activity has test data (soil or petiole)
 */
export function isTestActivity(activity: Activity): activity is
  | (Activity & {
      soil_test?: TestActivityData
    })
  | (Activity & {
      petiole_test?: TestActivityData
    }) {
  return (
    (activity.type === 'soil_test' && activity.soil_test !== undefined) ||
    (activity.type === 'petiole_test' && activity.petiole_test !== undefined)
  )
}

/**
 * Type guard to check if an activity has expense data
 */
export function isExpenseActivity(
  activity: Activity
): activity is Activity & { expense: ExpenseActivityData } {
  return activity.type === 'expense' && activity.expense !== undefined
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the type-specific data from an activity
 */
export function getActivityData<T extends ActivityType>(
  activity: Activity,
  type: T
): Activity & { [K in keyof Activity as ActivityType]: Activity[K] } {
  if (activity.type === type) {
    return activity as Activity & { [K in keyof Activity as ActivityType]: Activity[K] }
  }
  throw new Error(`Activity is not of type ${type}`)
}

/**
 * Get a safe activity that includes all possible data fields (for legacy compatibility)
 * This function creates a new object with only the defined properties from the input activity
 */
export function getSafeActivity(activity: Activity): Activity {
  // Create a new object with only the defined properties
  const result: Record<string, unknown> = {}

  // Copy all defined properties from the activity
  for (const key in activity) {
    const value = activity[key as keyof Activity]
    if (value !== undefined) {
      result[key] = value
    }
  }

  // Return as Activity since we've filtered out undefined values
  return result as unknown as Activity
}

/**
 * Check if two activities represent the same database record
 */
export function isSameActivity(a1: Activity, a2: Activity): boolean {
  return a1.id === a2.id && a1.type === a2.type
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Legacy ActivityLog interface for backward compatibility
 * @deprecated Use Activity instead
 */
export interface ActivityLog {
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
  parsed_parameters?: Json
  raw_notes?: string
}

/**
 * Convert new Activity type to legacy ActivityLog
 * @deprecated Use Activity type directly instead
 */
export function activityToActivityLog(activity: Activity): ActivityLog {
  const safeActivity = getSafeActivity(activity)

  return {
    id: safeActivity.id ?? 0, // Handle undefined/null id by defaulting to 0
    type: safeActivity.type,
    date: safeActivity.date,
    notes: safeActivity.notes || undefined,
    duration: safeActivity.irrigation?.duration,
    chemical: safeActivity.spray?.chemical,
    chemicals: safeActivity.spray?.chemicals,
    quantity: safeActivity.harvest?.quantity,
    cost: safeActivity.expense?.cost,
    fertilizer: safeActivity.fertigation?.fertilizer,
    created_at: safeActivity.created_at || '',
    // Test data
    report_url: safeActivity.soil_test?.report_url || safeActivity.petiole_test?.report_url,
    report_storage_path:
      safeActivity.soil_test?.report_storage_path || safeActivity.petiole_test?.report_storage_path,
    report_filename:
      safeActivity.soil_test?.report_filename || safeActivity.petiole_test?.report_filename,
    report_type: safeActivity.soil_test?.report_type || safeActivity.petiole_test?.report_type,
    extraction_status:
      safeActivity.soil_test?.extraction_status || safeActivity.petiole_test?.extraction_status,
    extraction_error:
      safeActivity.soil_test?.extraction_error || safeActivity.petiole_test?.extraction_error,
    parsed_parameters:
      safeActivity.soil_test?.parsed_parameters || safeActivity.petiole_test?.parsed_parameters,
    raw_notes: safeActivity.soil_test?.raw_notes || safeActivity.petiole_test?.raw_notes
  }
}

/**
 * Convert legacy ActivityLog to new Activity type
 * @deprecated Update code to use Activity type directly instead
 */
export function activityLogToActivity(activityLog: ActivityLog): Activity {
  // Try to determine the activity type based on available fields
  let type: ActivityType = 'irrigation' // default

  if (activityLog.type) {
    type = activityLog.type as ActivityType
  } else if (activityLog.chemicals || activityLog.chemical) {
    type = 'spray'
  } else if (activityLog.fertilizer) {
    type = 'fertigation'
  } else if (activityLog.quantity) {
    type = 'harvest'
  } else if (activityLog.cost) {
    type = 'expense'
  } else if (activityLog.report_url) {
    type = 'soil_test'
  }

  const baseActivity: BaseActivity = {
    id: activityLog.id,
    type,
    date: activityLog.date,
    created_at: activityLog.created_at,
    notes: activityLog.notes,
    description: activityLog.notes
  }

  const activity: Activity = {
    ...baseActivity,
    irrigation: type === 'irrigation' ? { duration: activityLog.duration } : undefined,
    spray:
      type === 'spray'
        ? {
            chemicals: activityLog.chemicals || [],
            chemical: activityLog.chemical
          }
        : undefined,
    harvest: type === 'harvest' ? { quantity: activityLog.quantity } : undefined,
    fertigation: type === 'fertigation' ? { fertilizer: activityLog.fertilizer } : undefined,
    expense:
      type === 'expense'
        ? {
            cost: activityLog.cost,
            description: activityLog.notes
          }
        : undefined,
    soil_test:
      type === 'soil_test'
        ? {
            report_url: activityLog.report_url,
            report_storage_path: activityLog.report_storage_path,
            report_filename: activityLog.report_filename,
            report_mimeType: activityLog.report_mimeType,
            report_type: activityLog.report_type,
            extraction_status: activityLog.extraction_status,
            extraction_error: activityLog.extraction_error,
            parsed_parameters: activityLog.parsed_parameters,
            raw_notes: activityLog.raw_notes
          }
        : undefined,
    petiole_test:
      type === 'petiole_test'
        ? {
            report_url: activityLog.report_url,
            report_storage_path: activityLog.report_storage_path,
            report_filename: activityLog.report_filename,
            report_mimeType: activityLog.report_mimeType,
            report_type: activityLog.report_type,
            extraction_status: activityLog.extraction_status,
            extraction_error: activityLog.extraction_error,
            parsed_parameters: activityLog.parsed_parameters,
            raw_notes: activityLog.raw_notes
          }
        : undefined,
    metadata: {
      legacy: true,
      converted_from: 'ActivityLog'
    }
  }

  return activity
}
