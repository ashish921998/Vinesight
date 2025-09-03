// Type adapters to bridge application types with Supabase database types
import { Database } from '@/types/database'

// Extract database table types
export type DatabaseFarm = Database['public']['Tables']['farms']['Row']
export type DatabaseFarmInsert = Database['public']['Tables']['farms']['Insert']
export type DatabaseFarmUpdate = Database['public']['Tables']['farms']['Update']

export type DatabaseIrrigationRecord = Database['public']['Tables']['irrigation_records']['Row']
export type DatabaseIrrigationRecordInsert = Database['public']['Tables']['irrigation_records']['Insert']
export type DatabaseIrrigationRecordUpdate = Database['public']['Tables']['irrigation_records']['Update']

export type DatabaseSprayRecord = Database['public']['Tables']['spray_records']['Row']
export type DatabaseSprayRecordInsert = Database['public']['Tables']['spray_records']['Insert']
export type DatabaseSprayRecordUpdate = Database['public']['Tables']['spray_records']['Update']

export type DatabaseFertigationRecord = Database['public']['Tables']['fertigation_records']['Row']
export type DatabaseFertigationRecordInsert = Database['public']['Tables']['fertigation_records']['Insert']
export type DatabaseFertigationRecordUpdate = Database['public']['Tables']['fertigation_records']['Update']

export type DatabaseHarvestRecord = Database['public']['Tables']['harvest_records']['Row']
export type DatabaseHarvestRecordInsert = Database['public']['Tables']['harvest_records']['Insert']
export type DatabaseHarvestRecordUpdate = Database['public']['Tables']['harvest_records']['Update']

export type DatabaseExpenseRecord = Database['public']['Tables']['expense_records']['Row']
export type DatabaseExpenseRecordInsert = Database['public']['Tables']['expense_records']['Insert']
export type DatabaseExpenseRecordUpdate = Database['public']['Tables']['expense_records']['Update']

export type DatabaseCalculationHistory = Database['public']['Tables']['calculation_history']['Row']
export type DatabaseCalculationHistoryInsert = Database['public']['Tables']['calculation_history']['Insert']
export type DatabaseCalculationHistoryUpdate = Database['public']['Tables']['calculation_history']['Update']

export type DatabaseTaskReminder = Database['public']['Tables']['task_reminders']['Row']
export type DatabaseTaskReminderInsert = Database['public']['Tables']['task_reminders']['Insert']
export type DatabaseTaskReminderUpdate = Database['public']['Tables']['task_reminders']['Update']

export type DatabaseSoilTestRecord = Database['public']['Tables']['soil_test_records']['Row']
export type DatabaseSoilTestRecordInsert = Database['public']['Tables']['soil_test_records']['Insert']
export type DatabaseSoilTestRecordUpdate = Database['public']['Tables']['soil_test_records']['Update']

// Type conversion utilities
export function toApplicationFarm(dbFarm: DatabaseFarm): import('./supabase').Farm {
  return {
    id: dbFarm.id,
    name: dbFarm.name,
    region: dbFarm.region,
    area: dbFarm.area,
    grape_variety: dbFarm.grape_variety,
    planting_date: dbFarm.planting_date,
    vine_spacing: dbFarm.vine_spacing,
    row_spacing: dbFarm.row_spacing,
    total_tank_capacity: dbFarm.total_tank_capacity || undefined,
    system_discharge: dbFarm.system_discharge || undefined,
    remaining_water: dbFarm.remaining_water || undefined,
    water_calculation_updated_at: dbFarm.water_calculation_updated_at || undefined,
    latitude: dbFarm.latitude || undefined,
    longitude: dbFarm.longitude || undefined,
    elevation: dbFarm.elevation || undefined,
    location_name: dbFarm.location_name || undefined,
    timezone: dbFarm.timezone || undefined,
    location_source: (dbFarm.location_source as 'manual' | 'search' | 'current') || undefined,
    location_updated_at: dbFarm.location_updated_at || undefined,
    created_at: dbFarm.created_at || undefined,
    updated_at: dbFarm.updated_at || undefined,
    user_id: dbFarm.user_id || undefined
  }
}

export function toDatabaseFarmInsert(appFarm: Omit<import('./supabase').Farm, 'id' | 'created_at' | 'updated_at'>): DatabaseFarmInsert {
  return {
    name: appFarm.name,
    region: appFarm.region,
    area: appFarm.area,
    grape_variety: appFarm.grape_variety,
    planting_date: appFarm.planting_date,
    vine_spacing: appFarm.vine_spacing,
    row_spacing: appFarm.row_spacing,
    total_tank_capacity: appFarm.total_tank_capacity || null,
    system_discharge: appFarm.system_discharge || null,
    remaining_water: appFarm.remaining_water || null,
    water_calculation_updated_at: appFarm.water_calculation_updated_at || null,
    latitude: appFarm.latitude || null,
    longitude: appFarm.longitude || null,
    elevation: appFarm.elevation || null,
    location_name: appFarm.location_name || null,
    timezone: appFarm.timezone || null,
    location_source: appFarm.location_source || null,
    location_updated_at: appFarm.location_updated_at || null,
    user_id: appFarm.user_id || null
  }
}

export function toDatabaseFarmUpdate(appFarmUpdates: Partial<import('./supabase').Farm>): DatabaseFarmUpdate {
  const update: DatabaseFarmUpdate = {}
  
  if (appFarmUpdates.name !== undefined) update.name = appFarmUpdates.name
  if (appFarmUpdates.region !== undefined) update.region = appFarmUpdates.region
  if (appFarmUpdates.area !== undefined) update.area = appFarmUpdates.area
  if (appFarmUpdates.grape_variety !== undefined) update.grape_variety = appFarmUpdates.grape_variety
  if (appFarmUpdates.planting_date !== undefined) update.planting_date = appFarmUpdates.planting_date
  if (appFarmUpdates.vine_spacing !== undefined) update.vine_spacing = appFarmUpdates.vine_spacing
  if (appFarmUpdates.row_spacing !== undefined) update.row_spacing = appFarmUpdates.row_spacing
  if (appFarmUpdates.total_tank_capacity !== undefined) update.total_tank_capacity = appFarmUpdates.total_tank_capacity || null
  if (appFarmUpdates.system_discharge !== undefined) update.system_discharge = appFarmUpdates.system_discharge || null
  if (appFarmUpdates.remaining_water !== undefined) update.remaining_water = appFarmUpdates.remaining_water || null
  if (appFarmUpdates.water_calculation_updated_at !== undefined) update.water_calculation_updated_at = appFarmUpdates.water_calculation_updated_at || null
  if (appFarmUpdates.latitude !== undefined) update.latitude = appFarmUpdates.latitude || null
  if (appFarmUpdates.longitude !== undefined) update.longitude = appFarmUpdates.longitude || null
  if (appFarmUpdates.elevation !== undefined) update.elevation = appFarmUpdates.elevation || null
  if (appFarmUpdates.location_name !== undefined) update.location_name = appFarmUpdates.location_name || null
  if (appFarmUpdates.timezone !== undefined) update.timezone = appFarmUpdates.timezone || null
  if (appFarmUpdates.location_source !== undefined) update.location_source = appFarmUpdates.location_source || null
  if (appFarmUpdates.location_updated_at !== undefined) update.location_updated_at = appFarmUpdates.location_updated_at || null
  if (appFarmUpdates.user_id !== undefined) update.user_id = appFarmUpdates.user_id || null

  return update
}

// Similar conversion functions for other record types...
export function toApplicationIrrigationRecord(dbRecord: DatabaseIrrigationRecord): import('./supabase').IrrigationRecord {
  return {
    id: dbRecord.id,
    farm_id: dbRecord.farm_id,
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

export function toDatabaseIrrigationInsert(appRecord: Omit<import('./supabase').IrrigationRecord, 'id' | 'created_at'>): DatabaseIrrigationRecordInsert {
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

export function toDatabaseIrrigationUpdate(appUpdates: Partial<import('./supabase').IrrigationRecord>): DatabaseIrrigationRecordUpdate {
  const update: DatabaseIrrigationRecordUpdate = {}
  
  if (appUpdates.farm_id !== undefined) update.farm_id = appUpdates.farm_id
  if (appUpdates.date !== undefined) update.date = appUpdates.date
  if (appUpdates.duration !== undefined) update.duration = appUpdates.duration
  if (appUpdates.area !== undefined) update.area = appUpdates.area
  if (appUpdates.growth_stage !== undefined) update.growth_stage = appUpdates.growth_stage
  if (appUpdates.moisture_status !== undefined) update.moisture_status = appUpdates.moisture_status
  if (appUpdates.system_discharge !== undefined) update.system_discharge = appUpdates.system_discharge
  if (appUpdates.notes !== undefined) update.notes = appUpdates.notes || null

  return update
}

// Spray Record conversion functions
export function toApplicationSprayRecord(dbRecord: DatabaseSprayRecord): import('./supabase').SprayRecord {
  return {
    id: dbRecord.id,
    farm_id: dbRecord.farm_id,
    date: dbRecord.date,
    pest_disease: dbRecord.pest_disease,
    chemical: dbRecord.chemical,
    dose: dbRecord.dose,
    area: dbRecord.area,
    weather: dbRecord.weather,
    operator: dbRecord.operator,
    notes: dbRecord.notes || undefined,
    created_at: dbRecord.created_at || undefined
  }
}

export function toDatabaseSprayInsert(appRecord: Omit<import('./supabase').SprayRecord, 'id' | 'created_at'>): DatabaseSprayRecordInsert {
  return {
    farm_id: appRecord.farm_id,
    date: appRecord.date,
    pest_disease: appRecord.pest_disease,
    chemical: appRecord.chemical,
    dose: appRecord.dose,
    area: appRecord.area,
    weather: appRecord.weather,
    operator: appRecord.operator,
    notes: appRecord.notes || null
  }
}

export function toDatabaseSprayUpdate(appUpdates: Partial<import('./supabase').SprayRecord>): DatabaseSprayRecordUpdate {
  const update: DatabaseSprayRecordUpdate = {}
  
  if (appUpdates.farm_id !== undefined) update.farm_id = appUpdates.farm_id
  if (appUpdates.date !== undefined) update.date = appUpdates.date
  if (appUpdates.pest_disease !== undefined) update.pest_disease = appUpdates.pest_disease
  if (appUpdates.chemical !== undefined) update.chemical = appUpdates.chemical
  if (appUpdates.dose !== undefined) update.dose = appUpdates.dose
  if (appUpdates.area !== undefined) update.area = appUpdates.area
  if (appUpdates.weather !== undefined) update.weather = appUpdates.weather
  if (appUpdates.operator !== undefined) update.operator = appUpdates.operator
  if (appUpdates.notes !== undefined) update.notes = appUpdates.notes || null

  return update
}

// Fertigation Record conversion functions
export function toApplicationFertigationRecord(dbRecord: DatabaseFertigationRecord): import('./supabase').FertigationRecord {
  return {
    id: dbRecord.id,
    farm_id: dbRecord.farm_id,
    date: dbRecord.date,
    fertilizer: dbRecord.fertilizer,
    dose: dbRecord.dose,
    purpose: dbRecord.purpose,
    area: dbRecord.area,
    notes: dbRecord.notes || undefined,
    created_at: dbRecord.created_at || undefined
  }
}

export function toDatabaseFertigationInsert(appRecord: Omit<import('./supabase').FertigationRecord, 'id' | 'created_at'>): DatabaseFertigationRecordInsert {
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

export function toDatabaseFertigationUpdate(appUpdates: Partial<import('./supabase').FertigationRecord>): DatabaseFertigationRecordUpdate {
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
export function toApplicationHarvestRecord(dbRecord: DatabaseHarvestRecord): import('./supabase').HarvestRecord {
  return {
    id: dbRecord.id,
    farm_id: dbRecord.farm_id,
    date: dbRecord.date,
    quantity: dbRecord.quantity,
    grade: dbRecord.grade,
    price: dbRecord.price || undefined,
    buyer: dbRecord.buyer || undefined,
    notes: dbRecord.notes || undefined,
    created_at: dbRecord.created_at || undefined
  }
}

export function toDatabaseHarvestInsert(appRecord: Omit<import('./supabase').HarvestRecord, 'id' | 'created_at'>): DatabaseHarvestRecordInsert {
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

export function toDatabaseHarvestUpdate(appUpdates: Partial<import('./supabase').HarvestRecord>): DatabaseHarvestRecordUpdate {
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
export function toApplicationExpenseRecord(dbRecord: DatabaseExpenseRecord): import('./supabase').ExpenseRecord {
  return {
    id: dbRecord.id,
    farm_id: dbRecord.farm_id,
    date: dbRecord.date,
    type: dbRecord.type,
    description: dbRecord.description,
    cost: dbRecord.cost,
    remarks: dbRecord.remarks || undefined,
    created_at: dbRecord.created_at || undefined
  }
}

export function toDatabaseExpenseInsert(appRecord: Omit<import('./supabase').ExpenseRecord, 'id' | 'created_at'>): DatabaseExpenseRecordInsert {
  return {
    farm_id: appRecord.farm_id,
    date: appRecord.date,
    type: appRecord.type,
    description: appRecord.description,
    cost: appRecord.cost,
    remarks: appRecord.remarks || null
  }
}

export function toDatabaseExpenseUpdate(appUpdates: Partial<import('./supabase').ExpenseRecord>): DatabaseExpenseRecordUpdate {
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
export function toApplicationCalculationHistory(dbRecord: DatabaseCalculationHistory): import('./supabase').CalculationHistory {
  return {
    id: dbRecord.id,
    farm_id: dbRecord.farm_id,
    calculation_type: dbRecord.calculation_type,
    inputs: dbRecord.inputs,
    outputs: dbRecord.outputs,
    date: dbRecord.date,
    created_at: dbRecord.created_at || undefined
  }
}

export function toDatabaseCalculationHistoryInsert(appRecord: Omit<import('./supabase').CalculationHistory, 'id' | 'created_at'>): DatabaseCalculationHistoryInsert {
  return {
    farm_id: appRecord.farm_id,
    calculation_type: appRecord.calculation_type,
    inputs: appRecord.inputs,
    outputs: appRecord.outputs,
    date: appRecord.date
  }
}

// Task Reminder conversion functions
export function toApplicationTaskReminder(dbRecord: DatabaseTaskReminder): import('./supabase').TaskReminder {
  return {
    id: dbRecord.id,
    farm_id: dbRecord.farm_id,
    title: dbRecord.title,
    description: dbRecord.description || undefined,
    due_date: dbRecord.due_date,
    type: dbRecord.type,
    completed: dbRecord.completed,
    priority: dbRecord.priority,
    created_at: dbRecord.created_at || undefined,
    completed_at: dbRecord.completed_at || undefined
  }
}

export function toDatabaseTaskReminderInsert(appRecord: Omit<import('./supabase').TaskReminder, 'id' | 'created_at'>): DatabaseTaskReminderInsert {
  return {
    farm_id: appRecord.farm_id,
    title: appRecord.title,
    description: appRecord.description || null,
    due_date: appRecord.due_date,
    type: appRecord.type,
    completed: appRecord.completed || false,
    priority: appRecord.priority,
    completed_at: appRecord.completed_at || null
  }
}

export function toDatabaseTaskReminderUpdate(appUpdates: Partial<import('./supabase').TaskReminder>): DatabaseTaskReminderUpdate {
  const update: DatabaseTaskReminderUpdate = {}
  
  if (appUpdates.farm_id !== undefined) update.farm_id = appUpdates.farm_id
  if (appUpdates.title !== undefined) update.title = appUpdates.title
  if (appUpdates.description !== undefined) update.description = appUpdates.description || null
  if (appUpdates.due_date !== undefined) update.due_date = appUpdates.due_date
  if (appUpdates.type !== undefined) update.type = appUpdates.type
  if (appUpdates.completed !== undefined) update.completed = appUpdates.completed
  if (appUpdates.priority !== undefined) update.priority = appUpdates.priority
  if (appUpdates.completed_at !== undefined) update.completed_at = appUpdates.completed_at || null

  return update
}

// Soil Test Record conversion functions
export function toApplicationSoilTestRecord(dbRecord: DatabaseSoilTestRecord): import('./supabase').SoilTestRecord {
  return {
    id: dbRecord.id,
    farm_id: dbRecord.farm_id,
    date: dbRecord.date,
    parameters: dbRecord.parameters,
    recommendations: dbRecord.recommendations || undefined,
    notes: dbRecord.notes || undefined,
    created_at: dbRecord.created_at || undefined
  }
}

export function toDatabaseSoilTestInsert(appRecord: Omit<import('./supabase').SoilTestRecord, 'id' | 'created_at'>): DatabaseSoilTestRecordInsert {
  return {
    farm_id: appRecord.farm_id,
    date: appRecord.date,
    parameters: appRecord.parameters,
    recommendations: appRecord.recommendations || null,
    notes: appRecord.notes || null
  }
}

export function toDatabaseSoilTestUpdate(appUpdates: Partial<import('./supabase').SoilTestRecord>): DatabaseSoilTestRecordUpdate {
  const update: DatabaseSoilTestRecordUpdate = {}
  
  if (appUpdates.farm_id !== undefined) update.farm_id = appUpdates.farm_id
  if (appUpdates.date !== undefined) update.date = appUpdates.date
  if (appUpdates.parameters !== undefined) update.parameters = appUpdates.parameters
  if (appUpdates.recommendations !== undefined) update.recommendations = appUpdates.recommendations || null
  if (appUpdates.notes !== undefined) update.notes = appUpdates.notes || null

  return update
}