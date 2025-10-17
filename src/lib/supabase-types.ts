// Type adapters to bridge application types with Supabase database types
import { Database } from '@/types/database'

// Import application types from both sources
import type {
  IrrigationRecord,
  SprayRecord,
  FertigationRecord,
  HarvestRecord,
  ExpenseRecord,
  CalculationHistory,
  SoilTestRecord,
  PetioleTestRecord
} from './supabase'
import type { Task, Farm } from '@/types/types'

// Re-export application types
export type {
  Task,
  IrrigationRecord,
  SprayRecord,
  FertigationRecord,
  HarvestRecord,
  ExpenseRecord,
  CalculationHistory,
  SoilTestRecord,
  PetioleTestRecord
}

// Extract database table types
export type DatabaseFarm = Database['public']['Tables']['farms']['Row']
export type DatabaseFarmInsert = Database['public']['Tables']['farms']['Insert']
export type DatabaseFarmUpdate = Database['public']['Tables']['farms']['Update']

export type DatabaseIrrigationRecord = Database['public']['Tables']['irrigation_records']['Row']
export type DatabaseIrrigationRecordInsert =
  Database['public']['Tables']['irrigation_records']['Insert']
export type DatabaseIrrigationRecordUpdate =
  Database['public']['Tables']['irrigation_records']['Update']

export type DatabaseSprayRecord = Database['public']['Tables']['spray_records']['Row']
export type DatabaseSprayRecordInsert = Database['public']['Tables']['spray_records']['Insert']
export type DatabaseSprayRecordUpdate = Database['public']['Tables']['spray_records']['Update']

export type DatabaseFertigationRecord = Database['public']['Tables']['fertigation_records']['Row']
export type DatabaseFertigationRecordInsert =
  Database['public']['Tables']['fertigation_records']['Insert']
export type DatabaseFertigationRecordUpdate =
  Database['public']['Tables']['fertigation_records']['Update']

export type DatabaseHarvestRecord = Database['public']['Tables']['harvest_records']['Row']
export type DatabaseHarvestRecordInsert = Database['public']['Tables']['harvest_records']['Insert']
export type DatabaseHarvestRecordUpdate = Database['public']['Tables']['harvest_records']['Update']

export type DatabaseExpenseRecord = Database['public']['Tables']['expense_records']['Row']
export type DatabaseExpenseRecordInsert = Database['public']['Tables']['expense_records']['Insert']
export type DatabaseExpenseRecordUpdate = Database['public']['Tables']['expense_records']['Update']

export type DatabaseCalculationHistory = Database['public']['Tables']['calculation_history']['Row']
export type DatabaseCalculationHistoryInsert =
  Database['public']['Tables']['calculation_history']['Insert']
export type DatabaseCalculationHistoryUpdate =
  Database['public']['Tables']['calculation_history']['Update']

export type DatabaseTask = Database['public']['Tables']['tasks']['Row']
export type DatabaseTaskInsert = Database['public']['Tables']['tasks']['Insert']
export type DatabaseTaskUpdate = Database['public']['Tables']['tasks']['Update']

export type DatabaseSoilTestRecord = Database['public']['Tables']['soil_test_records']['Row']
export type DatabaseSoilTestRecordInsert =
  Database['public']['Tables']['soil_test_records']['Insert']
export type DatabaseSoilTestRecordUpdate =
  Database['public']['Tables']['soil_test_records']['Update']

// Petiole Test Record database types
export type DatabasePetioleTestRecord = Database['public']['Tables']['petiole_test_records']['Row']
export type DatabasePetioleTestRecordInsert =
  Database['public']['Tables']['petiole_test_records']['Insert']
export type DatabasePetioleTestRecordUpdate =
  Database['public']['Tables']['petiole_test_records']['Update']
// Type conversion utilities
export function toApplicationFarm(dbFarm: DatabaseFarm): Farm {
  return {
    id: dbFarm.id,
    name: dbFarm.name,
    region: dbFarm.region,
    area: dbFarm.area,
    grapeVariety: dbFarm.grape_variety,
    plantingDate: dbFarm.planting_date,
    vineSpacing: dbFarm.vine_spacing || undefined,
    rowSpacing: dbFarm.row_spacing || undefined,
    totalTankCapacity: dbFarm.total_tank_capacity || undefined,
    systemDischarge: dbFarm.system_discharge || undefined,
    remainingWater: dbFarm.remaining_water || undefined,
    waterCalculationUpdatedAt: dbFarm.water_calculation_updated_at || undefined,
    latitude: dbFarm.latitude || undefined,
    longitude: dbFarm.longitude || undefined,
    elevation: dbFarm.elevation || undefined,
    locationName: dbFarm.location_name || undefined,
    timezone: dbFarm.timezone || undefined,
    locationSource: (dbFarm.location_source as 'manual' | 'search' | 'current') || undefined,
    locationUpdatedAt: dbFarm.location_updated_at || undefined,
    createdAt: dbFarm.created_at || undefined,
    updatedAt: dbFarm.updated_at || undefined,
    userId: dbFarm.user_id || undefined,
    dateOfPruning: dbFarm.date_of_pruning || undefined
  }
}

export function toDatabaseFarmInsert(
  appFarm: Omit<import('@/types/types').Farm, 'id' | 'createdAt' | 'updatedAt'> & {
    user_id: string
  }
): DatabaseFarmInsert {
  return {
    name: appFarm.name,
    region: appFarm.region,
    area: appFarm.area,
    grape_variety: appFarm.grapeVariety,
    planting_date: appFarm.plantingDate,
    vine_spacing: appFarm.vineSpacing || 0,
    row_spacing: appFarm.rowSpacing || 0,
    total_tank_capacity: appFarm.totalTankCapacity || null,
    system_discharge: appFarm.systemDischarge || null,
    remaining_water: appFarm.remainingWater || null,
    water_calculation_updated_at: appFarm.waterCalculationUpdatedAt || null,
    latitude: appFarm.latitude || null,
    longitude: appFarm.longitude || null,
    elevation: appFarm.elevation || null,
    location_name: appFarm.locationName || null,
    timezone: appFarm.timezone || null,
    location_source: appFarm.locationSource || null,
    location_updated_at: appFarm.locationUpdatedAt || null,
    user_id: appFarm.user_id || null,
    date_of_pruning: appFarm.dateOfPruning || null
  }
}

export function toDatabaseFarmUpdate(appFarmUpdates: Partial<Farm>): DatabaseFarmUpdate {
  const update: DatabaseFarmUpdate = {}

  if (appFarmUpdates.name !== undefined) update.name = appFarmUpdates.name
  if (appFarmUpdates.region !== undefined) update.region = appFarmUpdates.region
  if (appFarmUpdates.area !== undefined) update.area = appFarmUpdates.area
  if (appFarmUpdates.grapeVariety !== undefined) update.grape_variety = appFarmUpdates.grapeVariety
  if (appFarmUpdates.plantingDate !== undefined) update.planting_date = appFarmUpdates.plantingDate
  if (appFarmUpdates.vineSpacing !== undefined) update.vine_spacing = appFarmUpdates.vineSpacing
  if (appFarmUpdates.rowSpacing !== undefined) update.row_spacing = appFarmUpdates.rowSpacing
  if (appFarmUpdates.totalTankCapacity !== undefined)
    update.total_tank_capacity = appFarmUpdates.totalTankCapacity || null
  if (appFarmUpdates.systemDischarge !== undefined)
    update.system_discharge = appFarmUpdates.systemDischarge || null
  if (appFarmUpdates.remainingWater !== undefined)
    update.remaining_water = appFarmUpdates.remainingWater || null
  if (appFarmUpdates.waterCalculationUpdatedAt !== undefined)
    update.water_calculation_updated_at = appFarmUpdates.waterCalculationUpdatedAt || null
  if (appFarmUpdates.latitude !== undefined) update.latitude = appFarmUpdates.latitude || null
  if (appFarmUpdates.longitude !== undefined) update.longitude = appFarmUpdates.longitude || null
  if (appFarmUpdates.elevation !== undefined) update.elevation = appFarmUpdates.elevation || null
  if (appFarmUpdates.locationName !== undefined)
    update.location_name = appFarmUpdates.locationName || null
  if (appFarmUpdates.timezone !== undefined) update.timezone = appFarmUpdates.timezone || null
  if (appFarmUpdates.locationSource !== undefined)
    update.location_source = appFarmUpdates.locationSource || null
  if (appFarmUpdates.locationUpdatedAt !== undefined)
    update.location_updated_at = appFarmUpdates.locationUpdatedAt || null
  if (appFarmUpdates.userId !== undefined) update.user_id = appFarmUpdates.userId || null
  if (appFarmUpdates.dateOfPruning !== undefined)
    update.date_of_pruning = appFarmUpdates.dateOfPruning || null

  return update
}

// Similar conversion functions for other record types...
export function toApplicationIrrigationRecord(
  dbRecord: DatabaseIrrigationRecord
): import('./supabase').IrrigationRecord {
  return {
    id: dbRecord.id,
    farm_id: dbRecord.farm_id!,
    date: dbRecord.date,
    duration: dbRecord.duration,
    area: dbRecord.area,
    growth_stage: dbRecord.growth_stage,
    moisture_status: dbRecord.moisture_status,
    system_discharge: dbRecord.system_discharge,
    notes: dbRecord.notes || undefined,
    created_at: dbRecord.created_at || undefined
  }
}

export function toDatabaseIrrigationInsert(
  appRecord: Omit<import('./supabase').IrrigationRecord, 'id' | 'created_at'>
): DatabaseIrrigationRecordInsert {
  return {
    farm_id: appRecord.farm_id,
    date: appRecord.date,
    duration: appRecord.duration,
    area: appRecord.area,
    growth_stage: appRecord.growth_stage,
    moisture_status: appRecord.moisture_status,
    system_discharge: appRecord.system_discharge,
    notes: appRecord.notes || null
  }
}

export function toDatabaseIrrigationUpdate(
  appUpdates: Partial<import('./supabase').IrrigationRecord>
): DatabaseIrrigationRecordUpdate {
  const update: DatabaseIrrigationRecordUpdate = {}

  if (appUpdates.farm_id !== undefined) update.farm_id = appUpdates.farm_id
  if (appUpdates.date !== undefined) update.date = appUpdates.date
  if (appUpdates.duration !== undefined) update.duration = appUpdates.duration
  if (appUpdates.area !== undefined) update.area = appUpdates.area
  if (appUpdates.growth_stage !== undefined) update.growth_stage = appUpdates.growth_stage
  if (appUpdates.moisture_status !== undefined) update.moisture_status = appUpdates.moisture_status
  if (appUpdates.system_discharge !== undefined)
    update.system_discharge = appUpdates.system_discharge
  if (appUpdates.notes !== undefined) update.notes = appUpdates.notes || null

  return update
}

// Spray Record conversion functions
export function toApplicationSprayRecord(
  dbRecord: DatabaseSprayRecord
): import('./supabase').SprayRecord {
  return {
    id: dbRecord.id,
    farm_id: dbRecord.farm_id!,
    date: dbRecord.date,
    chemical: dbRecord.chemical,
    dose: dbRecord.dose,
    quantity_amount: dbRecord.quantity_amount,
    quantity_unit: dbRecord.quantity_unit,
    water_volume: dbRecord.water_volume,
    area: dbRecord.area,
    weather: dbRecord.weather,
    operator: dbRecord.operator,
    notes: dbRecord.notes || undefined,
    created_at: dbRecord.created_at || undefined
  }
}

export function toDatabaseSprayInsert(
  appRecord: Omit<import('./supabase').SprayRecord, 'id' | 'created_at'>
): DatabaseSprayRecordInsert {
  return {
    farm_id: appRecord.farm_id,
    date: appRecord.date,
    chemical: appRecord.chemical,
    dose: appRecord.dose,
    quantity_amount: appRecord.quantity_amount,
    quantity_unit: appRecord.quantity_unit,
    water_volume: appRecord.water_volume,
    area: appRecord.area,
    weather: appRecord.weather,
    operator: appRecord.operator,
    notes: appRecord.notes || null
  }
}

export function toDatabaseSprayUpdate(
  appUpdates: Partial<import('./supabase').SprayRecord>
): DatabaseSprayRecordUpdate {
  const update: DatabaseSprayRecordUpdate = {}

  if (appUpdates.farm_id !== undefined) update.farm_id = appUpdates.farm_id
  if (appUpdates.date !== undefined) update.date = appUpdates.date
  if (appUpdates.chemical !== undefined) update.chemical = appUpdates.chemical
  if (appUpdates.dose !== undefined) update.dose = appUpdates.dose
  if (appUpdates.area !== undefined) update.area = appUpdates.area
  if (appUpdates.weather !== undefined) update.weather = appUpdates.weather
  if (appUpdates.operator !== undefined) update.operator = appUpdates.operator
  if (appUpdates.notes !== undefined) update.notes = appUpdates.notes || null

  return update
}

// Fertigation Record conversion functions
export function toApplicationFertigationRecord(
  dbRecord: DatabaseFertigationRecord
): import('./supabase').FertigationRecord {
  return {
    id: dbRecord.id,
    farm_id: dbRecord.farm_id!,
    date: dbRecord.date,
    fertilizer: dbRecord.fertilizer,
    dose: dbRecord.dose,
    purpose: dbRecord.purpose,
    area: dbRecord.area,
    notes: dbRecord.notes || undefined,
    created_at: dbRecord.created_at || undefined
  }
}

export function toDatabaseFertigationInsert(
  appRecord: Omit<import('./supabase').FertigationRecord, 'id' | 'created_at'>
): DatabaseFertigationRecordInsert {
  return {
    farm_id: appRecord.farm_id,
    date: appRecord.date,
    fertilizer: appRecord.fertilizer,
    dose: appRecord.dose,
    purpose: appRecord.purpose,
    area: appRecord.area,
    notes: appRecord.notes || null
  }
}

export function toDatabaseFertigationUpdate(
  appUpdates: Partial<import('./supabase').FertigationRecord>
): DatabaseFertigationRecordUpdate {
  const update: DatabaseFertigationRecordUpdate = {}

  if (appUpdates.farm_id !== undefined) update.farm_id = appUpdates.farm_id
  if (appUpdates.date !== undefined) update.date = appUpdates.date
  if (appUpdates.fertilizer !== undefined) update.fertilizer = appUpdates.fertilizer
  if (appUpdates.dose !== undefined) update.dose = appUpdates.dose
  if (appUpdates.purpose !== undefined) update.purpose = appUpdates.purpose
  if (appUpdates.area !== undefined) update.area = appUpdates.area
  if (appUpdates.notes !== undefined) update.notes = appUpdates.notes || null

  return update
}

// Harvest Record conversion functions
export function toApplicationHarvestRecord(
  dbRecord: DatabaseHarvestRecord
): import('./supabase').HarvestRecord {
  return {
    id: dbRecord.id,
    farm_id: dbRecord.farm_id!,
    date: dbRecord.date,
    quantity: dbRecord.quantity,
    grade: dbRecord.grade,
    price: dbRecord.price || undefined,
    buyer: dbRecord.buyer || undefined,
    notes: dbRecord.notes || undefined,
    created_at: dbRecord.created_at || undefined
  }
}

export function toDatabaseHarvestInsert(
  appRecord: Omit<import('./supabase').HarvestRecord, 'id' | 'created_at'>
): DatabaseHarvestRecordInsert {
  return {
    farm_id: appRecord.farm_id,
    date: appRecord.date,
    quantity: appRecord.quantity,
    grade: appRecord.grade,
    price: appRecord.price || null,
    buyer: appRecord.buyer || null,
    notes: appRecord.notes || null
  }
}

export function toDatabaseHarvestUpdate(
  appUpdates: Partial<import('./supabase').HarvestRecord>
): DatabaseHarvestRecordUpdate {
  const update: DatabaseHarvestRecordUpdate = {}

  if (appUpdates.farm_id !== undefined) update.farm_id = appUpdates.farm_id
  if (appUpdates.date !== undefined) update.date = appUpdates.date
  if (appUpdates.quantity !== undefined) update.quantity = appUpdates.quantity
  if (appUpdates.grade !== undefined) update.grade = appUpdates.grade
  if (appUpdates.price !== undefined) update.price = appUpdates.price || null
  if (appUpdates.buyer !== undefined) update.buyer = appUpdates.buyer || null
  if (appUpdates.notes !== undefined) update.notes = appUpdates.notes || null

  return update
}

// Expense Record conversion functions
export function toApplicationExpenseRecord(
  dbRecord: DatabaseExpenseRecord
): import('./supabase').ExpenseRecord {
  return {
    id: dbRecord.id,
    farm_id: dbRecord.farm_id!,
    date: dbRecord.date,
    type: dbRecord.type as 'labor' | 'materials' | 'equipment' | 'other',
    description: dbRecord.description,
    cost: dbRecord.cost,
    remarks: dbRecord.remarks || undefined,
    created_at: dbRecord.created_at || undefined
  }
}

export function toDatabaseExpenseInsert(
  appRecord: Omit<import('./supabase').ExpenseRecord, 'id' | 'created_at'>
): DatabaseExpenseRecordInsert {
  return {
    farm_id: appRecord.farm_id,
    date: appRecord.date,
    type: appRecord.type,
    description: appRecord.description,
    cost: appRecord.cost,
    remarks: appRecord.remarks || null
  }
}

export function toDatabaseExpenseUpdate(
  appUpdates: Partial<import('./supabase').ExpenseRecord>
): DatabaseExpenseRecordUpdate {
  const update: DatabaseExpenseRecordUpdate = {}

  if (appUpdates.farm_id !== undefined) update.farm_id = appUpdates.farm_id
  if (appUpdates.date !== undefined) update.date = appUpdates.date
  if (appUpdates.type !== undefined) update.type = appUpdates.type
  if (appUpdates.description !== undefined) update.description = appUpdates.description
  if (appUpdates.cost !== undefined) update.cost = appUpdates.cost
  if (appUpdates.remarks !== undefined) update.remarks = appUpdates.remarks || null

  return update
}

// Calculation History conversion functions
export function toApplicationCalculationHistory(
  dbRecord: DatabaseCalculationHistory
): import('./supabase').CalculationHistory {
  return {
    id: dbRecord.id,
    farm_id: dbRecord.farm_id!,
    calculation_type: dbRecord.calculation_type as 'etc' | 'nutrients' | 'lai' | 'discharge',
    inputs: (dbRecord.inputs as Record<string, any>) || {},
    outputs: (dbRecord.outputs as Record<string, any>) || {},
    date: dbRecord.date,
    created_at: dbRecord.created_at || undefined
  }
}

export function toDatabaseCalculationHistoryInsert(
  appRecord: Omit<import('./supabase').CalculationHistory, 'id' | 'created_at'>
): DatabaseCalculationHistoryInsert {
  return {
    farm_id: appRecord.farm_id,
    calculation_type: appRecord.calculation_type,
    inputs: appRecord.inputs,
    outputs: appRecord.outputs,
    date: appRecord.date
  }
}

// Task conversion functions
export function toApplicationTask(dbRecord: DatabaseTask): Task {
  const status = (dbRecord.status as Task['status']) || 'pending'
  const category = dbRecord.category ?? 'general'

  return {
    id: dbRecord.id,
    userId: dbRecord.user_id,
    farmId: dbRecord.farm_id,
    title: dbRecord.title,
    description: dbRecord.description || null,
    dueDate: dbRecord.due_date,
    priority: (dbRecord.priority as Task['priority']) || 'medium',
    status,
    category,
    type: category,
    completed: status === 'completed',
    createdAt: dbRecord.created_at || null,
    updatedAt: dbRecord.updated_at || null
  }
}

export function toDatabaseTaskInsert(
  appRecord: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
): DatabaseTaskInsert {
  const category = appRecord.category ?? appRecord.type ?? 'general'
  return {
    user_id: appRecord.userId,
    farm_id: appRecord.farmId ?? null,
    title: appRecord.title,
    description: appRecord.description,
    due_date: appRecord.dueDate,
    priority: appRecord.priority,
    status: appRecord.status,
    category
  }
}

export function toDatabaseTaskUpdate(appUpdates: Partial<Task>): DatabaseTaskUpdate {
  const update: DatabaseTaskUpdate = {}

  if (appUpdates.userId !== undefined) update.user_id = appUpdates.userId
  if (appUpdates.farmId !== undefined) update.farm_id = appUpdates.farmId
  if (appUpdates.title !== undefined) update.title = appUpdates.title
  if (appUpdates.description !== undefined) update.description = appUpdates.description
  if (appUpdates.dueDate !== undefined) update.due_date = appUpdates.dueDate
  if (appUpdates.priority !== undefined) update.priority = appUpdates.priority
  if (appUpdates.status !== undefined) update.status = appUpdates.status
  if (appUpdates.category !== undefined || appUpdates.type !== undefined) {
    update.category = (appUpdates.category ?? appUpdates.type) || null
  }
  if (appUpdates.createdAt !== undefined) update.created_at = appUpdates.createdAt
  if (appUpdates.updatedAt !== undefined) update.updated_at = appUpdates.updatedAt

  return update
}

// Soil Test Record conversion functions
export function toApplicationSoilTestRecord(
  dbRecord: DatabaseSoilTestRecord
): import('./supabase').SoilTestRecord {
  return {
    id: dbRecord.id,
    farm_id: dbRecord.farm_id!,
    date: dbRecord.date,
    parameters: (dbRecord.parameters as Record<string, number>) || {},
    recommendations: dbRecord.recommendations || undefined,
    notes: dbRecord.notes || undefined,
    report_url: dbRecord.report_url || undefined,
    report_storage_path: dbRecord.report_storage_path || undefined,
    report_filename: dbRecord.report_filename || undefined,
    report_type: dbRecord.report_type || undefined,
    extraction_status:
      (dbRecord.extraction_status as 'pending' | 'success' | 'failed' | null) || undefined,
    extraction_error: dbRecord.extraction_error || undefined,
    parsed_parameters: (dbRecord.parsed_parameters as Record<string, number>) || undefined,
    raw_notes: dbRecord.raw_notes || undefined,
    created_at: dbRecord.created_at || undefined
  }
}

export function toDatabaseSoilTestInsert(
  appRecord: Omit<import('./supabase').SoilTestRecord, 'id' | 'created_at'>
): DatabaseSoilTestRecordInsert {
  return {
    farm_id: appRecord.farm_id,
    date: appRecord.date,
    parameters: appRecord.parameters,
    recommendations: appRecord.recommendations || null,
    notes: appRecord.notes || null,
    report_url: appRecord.report_url || null,
    report_storage_path: appRecord.report_storage_path || null,
    report_filename: appRecord.report_filename || null,
    report_type: appRecord.report_type || null,
    extraction_status: appRecord.extraction_status || null,
    extraction_error: appRecord.extraction_error || null,
    parsed_parameters: appRecord.parsed_parameters || null,
    raw_notes: appRecord.raw_notes || null
  }
}

export function toDatabaseSoilTestUpdate(
  appUpdates: Partial<import('./supabase').SoilTestRecord>
): DatabaseSoilTestRecordUpdate {
  const update: DatabaseSoilTestRecordUpdate = {}

  if (appUpdates.farm_id !== undefined) update.farm_id = appUpdates.farm_id
  if (appUpdates.date !== undefined) update.date = appUpdates.date
  if (appUpdates.parameters !== undefined) update.parameters = appUpdates.parameters
  if (appUpdates.recommendations !== undefined)
    update.recommendations = appUpdates.recommendations || null
  if (appUpdates.notes !== undefined) update.notes = appUpdates.notes || null
  if (appUpdates.report_url !== undefined) update.report_url = appUpdates.report_url || null
  if (appUpdates.report_storage_path !== undefined)
    update.report_storage_path = appUpdates.report_storage_path || null
  if (appUpdates.report_filename !== undefined)
    update.report_filename = appUpdates.report_filename || null
  if (appUpdates.report_type !== undefined) update.report_type = appUpdates.report_type || null
  if (appUpdates.extraction_status !== undefined)
    update.extraction_status = appUpdates.extraction_status || null
  if (appUpdates.extraction_error !== undefined)
    update.extraction_error = appUpdates.extraction_error || null
  if (appUpdates.parsed_parameters !== undefined)
    update.parsed_parameters = appUpdates.parsed_parameters || null
  if (appUpdates.raw_notes !== undefined) update.raw_notes = appUpdates.raw_notes || null
  return update
}

// Petiole Test Record conversion functions
export function toApplicationPetioleTestRecord(
  dbRecord: DatabasePetioleTestRecord
): import('./supabase').PetioleTestRecord {
  return {
    id: dbRecord.id,
    farm_id: dbRecord.farm_id!,
    date: dbRecord.date,
    parameters: (dbRecord.parameters as Record<string, number>) || {},
    recommendations: dbRecord.recommendations || undefined,
    notes: dbRecord.notes || undefined,
    report_url: dbRecord.report_url || undefined,
    report_storage_path: dbRecord.report_storage_path || undefined,
    report_filename: dbRecord.report_filename || undefined,
    report_type: dbRecord.report_type || undefined,
    extraction_status:
      (dbRecord.extraction_status as 'pending' | 'success' | 'failed' | null) || undefined,
    extraction_error: dbRecord.extraction_error || undefined,
    parsed_parameters: (dbRecord.parsed_parameters as Record<string, number>) || undefined,
    raw_notes: dbRecord.raw_notes || undefined,
    created_at: dbRecord.created_at || undefined
  }
}

export function toDatabasePetioleTestInsert(
  appRecord: Omit<import('./supabase').PetioleTestRecord, 'id' | 'created_at'>
): DatabasePetioleTestRecordInsert {
  return {
    farm_id: appRecord.farm_id,
    date: appRecord.date,
    parameters: appRecord.parameters || {},
    recommendations: appRecord.recommendations || null,
    notes: appRecord.notes || null,
    report_url: appRecord.report_url || null,
    report_storage_path: appRecord.report_storage_path || null,
    report_filename: appRecord.report_filename || null,
    report_type: appRecord.report_type || null,
    extraction_status: appRecord.extraction_status || null,
    extraction_error: appRecord.extraction_error || null,
    parsed_parameters: appRecord.parsed_parameters || null,
    raw_notes: appRecord.raw_notes || null
  }
}

export function toDatabasePetioleTestUpdate(
  appUpdates: Partial<import('./supabase').PetioleTestRecord>
): DatabasePetioleTestRecordUpdate {
  const update: DatabasePetioleTestRecordUpdate = {}

  if (appUpdates.farm_id !== undefined) update.farm_id = appUpdates.farm_id
  if (appUpdates.date !== undefined) update.date = appUpdates.date

  if (appUpdates.parameters !== undefined) {
    update.parameters = appUpdates.parameters
  }

  if (appUpdates.recommendations !== undefined)
    update.recommendations = appUpdates.recommendations || null
  if (appUpdates.notes !== undefined) update.notes = appUpdates.notes || null
  if (appUpdates.report_url !== undefined) update.report_url = appUpdates.report_url || null
  if (appUpdates.report_storage_path !== undefined)
    update.report_storage_path = appUpdates.report_storage_path || null
  if (appUpdates.report_filename !== undefined)
    update.report_filename = appUpdates.report_filename || null
  if (appUpdates.report_type !== undefined) update.report_type = appUpdates.report_type || null
  if (appUpdates.extraction_status !== undefined)
    update.extraction_status = appUpdates.extraction_status || null
  if (appUpdates.extraction_error !== undefined)
    update.extraction_error = appUpdates.extraction_error || null
  if (appUpdates.parsed_parameters !== undefined)
    update.parsed_parameters = appUpdates.parsed_parameters || null
  if (appUpdates.raw_notes !== undefined) update.raw_notes = appUpdates.raw_notes || null

  return update
}
