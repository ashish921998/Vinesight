// Type adapters to bridge application types with Supabase database types
import { Database, Json } from '@/types/database'
import { canonicalizeParameters } from './parameter-canonicalization'

// Import application types from both sources
import type {
  IrrigationRecord,
  SprayRecord,
  SprayChemical,
  FertigationRecord,
  HarvestRecord,
  ExpenseRecord,
  CalculationHistory,
  SoilTestRecord,
  PetioleTestRecord,
  DailyNoteRecord,
  SoilProfile,
  SoilSection
} from './supabase'
import { taskReminderFromDB } from '@/types/types'
import type { TaskReminder, Farm } from '@/types/types'

// Re-export application types
export type {
  TaskReminder,
  IrrigationRecord,
  SprayRecord,
  SprayChemical,
  FertigationRecord,
  HarvestRecord,
  ExpenseRecord,
  CalculationHistory,
  SoilTestRecord,
  PetioleTestRecord,
  DailyNoteRecord,
  SoilProfile,
  SoilSection
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

export type DatabaseDailyNoteRecord = Database['public']['Tables']['daily_notes']['Row']
export type DatabaseDailyNoteRecordInsert = Database['public']['Tables']['daily_notes']['Insert']
export type DatabaseDailyNoteRecordUpdate = Database['public']['Tables']['daily_notes']['Update']

export type DatabaseCalculationHistory = Database['public']['Tables']['calculation_history']['Row']
export type DatabaseCalculationHistoryInsert =
  Database['public']['Tables']['calculation_history']['Insert']
export type DatabaseCalculationHistoryUpdate =
  Database['public']['Tables']['calculation_history']['Update']

export type DatabaseTaskReminder = Database['public']['Tables']['task_reminders']['Row']
export type DatabaseTaskReminderInsert = Database['public']['Tables']['task_reminders']['Insert']
export type DatabaseTaskReminderUpdate = Database['public']['Tables']['task_reminders']['Update']

export interface TaskReminderCreateInput {
  farmId: number
  title: string
  description?: string | null
  type: string
  status?: TaskReminder['status']
  priority?: TaskReminder['priority']
  dueDate: string
  estimatedDurationMinutes?: number | null
  location?: string | null
  assignedToUserId?: string | null
  createdBy?: string | null
  linkedRecordType?: string | null
  linkedRecordId?: number | null
  completedAt?: string | null
}

export interface TaskReminderUpdateInput extends Partial<TaskReminderCreateInput> {
  status?: TaskReminder['status']
  completed?: boolean
  completedAt?: string | null
}

export type DatabaseSoilTestRecord = Database['public']['Tables']['soil_test_records']['Row']
export type DatabaseSoilTestRecordInsert =
  Database['public']['Tables']['soil_test_records']['Insert']
export type DatabaseSoilTestRecordUpdate =
  Database['public']['Tables']['soil_test_records']['Update']

export type DatabaseSoilProfile = Database['public']['Tables']['soil_profiles']['Row']
export type DatabaseSoilProfileInsert = Database['public']['Tables']['soil_profiles']['Insert']
export type DatabaseSoilProfileUpdate = Database['public']['Tables']['soil_profiles']['Update']

// Petiole Test Record database types
export type DatabasePetioleTestRecord = Database['public']['Tables']['petiole_test_records']['Row']
export type DatabasePetioleTestRecordInsert =
  Database['public']['Tables']['petiole_test_records']['Insert']
export type DatabasePetioleTestRecordUpdate =
  Database['public']['Tables']['petiole_test_records']['Update']

// Helper function to convert Date or string to ISO date string
const dateToISOString = (dateValue: any): string | null => {
  if (!dateValue) return null
  if (dateValue instanceof Date) {
    return dateValue.toISOString().split('T')[0]
  }
  if (typeof dateValue === 'string') {
    return dateValue
  }
  return null
}

const serializeSoilSections = (sections?: SoilSection[]): Json => {
  const plainSections = (sections ?? []).map((section) => ({
    name: section.name,
    depth_m: section.depth_m ?? null,
    width_m: section.width_m ?? null,
    photo_path: section.photo_path ?? null,
    photo_preview: section.photo_preview ?? null,
    ec_ds_m: section.ec_ds_m ?? null,
    moisture_pct_user: section.moisture_pct_user,
    created_at: section.created_at ?? null
  }))
  return plainSections as Json
}

// Type conversion utilities
export function toApplicationFarm(dbFarm: DatabaseFarm): Farm {
  return {
    id: dbFarm.id,
    name: dbFarm.name,
    region: dbFarm.region,
    area: dbFarm.area,
    crop: dbFarm.crop,
    cropVariety: dbFarm.crop_variety,
    plantingDate: dbFarm.planting_date,
    vineSpacing: dbFarm.vine_spacing ?? undefined,
    rowSpacing: dbFarm.row_spacing ?? undefined,
    totalTankCapacity: dbFarm.total_tank_capacity ?? undefined,
    systemDischarge: dbFarm.system_discharge ?? undefined,
    remainingWater: dbFarm.remaining_water ?? undefined,
    waterCalculationUpdatedAt: dbFarm.water_calculation_updated_at ?? undefined,
    latitude: dbFarm.latitude ?? undefined,
    longitude: dbFarm.longitude ?? undefined,
    elevation: dbFarm.elevation ?? undefined,
    locationName: dbFarm.location_name ?? undefined,
    timezone: dbFarm.timezone ?? undefined,
    locationSource: (dbFarm.location_source as 'manual' | 'search' | 'current') ?? undefined,
    locationUpdatedAt: dbFarm.location_updated_at ?? undefined,
    createdAt: dbFarm.created_at ?? undefined,
    updatedAt: dbFarm.updated_at ?? undefined,
    userId: dbFarm.user_id ?? undefined,
    dateOfPruning: dbFarm.date_of_pruning ? new Date(dbFarm.date_of_pruning) : undefined,
    bulkDensity: dbFarm.bulk_density ?? undefined,
    cationExchangeCapacity: dbFarm.cation_exchange_capacity ?? undefined,
    soilWaterRetention: dbFarm.soil_water_retention ?? undefined,
    soilTextureClass: dbFarm.soil_texture_class ?? undefined,
    sandPercentage: dbFarm.sand_percentage ?? undefined,
    siltPercentage: dbFarm.silt_percentage ?? undefined,
    clayPercentage: dbFarm.clay_percentage ?? undefined
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
    crop_variety: appFarm.cropVariety,
    planting_date: appFarm.plantingDate,
    vine_spacing: appFarm.vineSpacing ?? null,
    row_spacing: appFarm.rowSpacing ?? null,
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
    date_of_pruning: dateToISOString(appFarm.dateOfPruning),
    bulk_density: appFarm.bulkDensity ?? null,
    cation_exchange_capacity: appFarm.cationExchangeCapacity ?? null,
    soil_water_retention: appFarm.soilWaterRetention ?? null,
    soil_texture_class: appFarm.soilTextureClass || null,
    sand_percentage: appFarm.sandPercentage ?? null,
    silt_percentage: appFarm.siltPercentage ?? null,
    clay_percentage: appFarm.clayPercentage ?? null
  } as DatabaseFarmInsert
}

export function toDatabaseFarmUpdate(appFarmUpdates: Partial<Farm>): DatabaseFarmUpdate {
  const update: DatabaseFarmUpdate = {}

  if (appFarmUpdates.name !== undefined) update.name = appFarmUpdates.name
  if (appFarmUpdates.region !== undefined) update.region = appFarmUpdates.region
  if (appFarmUpdates.area !== undefined) update.area = appFarmUpdates.area
  if (appFarmUpdates.cropVariety !== undefined) update.crop_variety = appFarmUpdates.cropVariety
  if (appFarmUpdates.plantingDate !== undefined) update.planting_date = appFarmUpdates.plantingDate
  if (appFarmUpdates.vineSpacing !== undefined) update.vine_spacing = appFarmUpdates.vineSpacing
  if (appFarmUpdates.rowSpacing !== undefined) update.row_spacing = appFarmUpdates.rowSpacing
  if (appFarmUpdates.totalTankCapacity !== undefined)
    update.total_tank_capacity = appFarmUpdates.totalTankCapacity ?? null
  if (appFarmUpdates.systemDischarge !== undefined)
    update.system_discharge = appFarmUpdates.systemDischarge ?? null
  if (appFarmUpdates.remainingWater !== undefined)
    update.remaining_water = appFarmUpdates.remainingWater ?? null
  if (appFarmUpdates.waterCalculationUpdatedAt !== undefined)
    update.water_calculation_updated_at = appFarmUpdates.waterCalculationUpdatedAt ?? null
  if (appFarmUpdates.latitude !== undefined) update.latitude = appFarmUpdates.latitude ?? null
  if (appFarmUpdates.longitude !== undefined) update.longitude = appFarmUpdates.longitude ?? null
  if (appFarmUpdates.elevation !== undefined) update.elevation = appFarmUpdates.elevation ?? null
  if (appFarmUpdates.locationName !== undefined)
    update.location_name = appFarmUpdates.locationName || null
  if (appFarmUpdates.timezone !== undefined) update.timezone = appFarmUpdates.timezone || null
  if (appFarmUpdates.locationSource !== undefined)
    update.location_source = appFarmUpdates.locationSource || null
  if (appFarmUpdates.locationUpdatedAt !== undefined)
    update.location_updated_at = appFarmUpdates.locationUpdatedAt || null
  if (appFarmUpdates.userId !== undefined) update.user_id = appFarmUpdates.userId || null
  if (appFarmUpdates.dateOfPruning !== undefined) {
    if (appFarmUpdates.dateOfPruning) {
      const dateValue = appFarmUpdates.dateOfPruning
      const dateString =
        dateValue instanceof Date
          ? dateValue.toISOString().split('T')[0]
          : typeof dateValue === 'string'
            ? dateValue
            : null

      update.date_of_pruning = dateString
    } else {
      update.date_of_pruning = null
    }
  }
  if (appFarmUpdates.bulkDensity !== undefined)
    update.bulk_density = appFarmUpdates.bulkDensity ?? null
  if (appFarmUpdates.cationExchangeCapacity !== undefined)
    update.cation_exchange_capacity = appFarmUpdates.cationExchangeCapacity ?? null
  if (appFarmUpdates.soilWaterRetention !== undefined)
    update.soil_water_retention = appFarmUpdates.soilWaterRetention ?? null
  if (appFarmUpdates.soilTextureClass !== undefined)
    update.soil_texture_class = appFarmUpdates.soilTextureClass || null
  if (appFarmUpdates.sandPercentage !== undefined)
    update.sand_percentage = appFarmUpdates.sandPercentage ?? null
  if (appFarmUpdates.siltPercentage !== undefined)
    update.silt_percentage = appFarmUpdates.siltPercentage ?? null
  if (appFarmUpdates.clayPercentage !== undefined)
    update.clay_percentage = appFarmUpdates.clayPercentage ?? null

  return update as DatabaseFarmUpdate
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
    date_of_pruning: dbRecord.date_of_pruning ? new Date(dbRecord.date_of_pruning) : undefined,
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
    date_of_pruning: dateToISOString(appRecord.date_of_pruning) as any,
    notes: appRecord.notes || null
  } as DatabaseIrrigationRecordInsert
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
  if (appUpdates.date_of_pruning !== undefined)
    update.date_of_pruning = dateToISOString(appUpdates.date_of_pruning) as any
  if (appUpdates.notes !== undefined) update.notes = appUpdates.notes || null

  return update
}

// Spray Record conversion functions
export function toApplicationSprayRecord(
  dbRecord: DatabaseSprayRecord
): import('./supabase').SprayRecord {
  // Helper to safely parse chemicals from Json
  const parseChemicals = (
    chemicalsJson: Json
  ): import('./supabase').SprayChemical[] | undefined => {
    if (!chemicalsJson || !Array.isArray(chemicalsJson)) return undefined
    // Validate structure
    const isValid = chemicalsJson.every(
      (c: any) =>
        typeof c === 'object' &&
        typeof c.name === 'string' &&
        typeof c.quantity === 'number' &&
        (c.unit === 'gm/L' ||
          c.unit === 'ml/L' ||
          c.unit === 'ppm' ||
          c.unit === 'kg/Acre' ||
          c.unit === 'liter/Acre')
    )
    return isValid ? (chemicalsJson as unknown as import('./supabase').SprayChemical[]) : undefined
  }

  return {
    id: dbRecord.id,
    farm_id: dbRecord.farm_id!,
    date: dbRecord.date,
    chemical: dbRecord.chemical || undefined,
    dose: dbRecord.dose || undefined,
    quantity_amount: dbRecord.quantity_amount,
    quantity_unit: dbRecord.quantity_unit as 'gm/L' | 'ml/L' | 'ppm' | 'kg/Acre' | 'liter/Acre',
    water_volume: dbRecord.water_volume,
    chemicals: parseChemicals(dbRecord.chemicals),
    area: dbRecord.area,
    weather: dbRecord.weather,
    operator: dbRecord.operator,
    date_of_pruning: dbRecord.date_of_pruning ? new Date(dbRecord.date_of_pruning) : undefined,
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
    chemical: appRecord.chemical || null,
    dose: appRecord.dose || null,
    quantity_amount: appRecord.quantity_amount,
    quantity_unit: appRecord.quantity_unit,
    water_volume: appRecord.water_volume,
    chemicals:
      appRecord.chemicals && appRecord.chemicals.length > 0
        ? (appRecord.chemicals as unknown as Json)
        : null, // Only store if array has items
    area: appRecord.area,
    weather: appRecord.weather,
    date_of_pruning: dateToISOString(appRecord.date_of_pruning) as any,
    operator: appRecord.operator,
    notes: appRecord.notes || null
  } as DatabaseSprayRecordInsert
}

export function toDatabaseSprayUpdate(
  appUpdates: Partial<import('./supabase').SprayRecord>
): DatabaseSprayRecordUpdate {
  const update: DatabaseSprayRecordUpdate = {}

  if (appUpdates.farm_id !== undefined) update.farm_id = appUpdates.farm_id
  if (appUpdates.date !== undefined) update.date = appUpdates.date
  if (appUpdates.chemical !== undefined) update.chemical = appUpdates.chemical || null
  if (appUpdates.dose !== undefined) update.dose = appUpdates.dose || null
  if (appUpdates.quantity_amount !== undefined) update.quantity_amount = appUpdates.quantity_amount
  if (appUpdates.quantity_unit !== undefined) update.quantity_unit = appUpdates.quantity_unit
  if (appUpdates.water_volume !== undefined) update.water_volume = appUpdates.water_volume
  if (appUpdates.chemicals !== undefined) {
    update.chemicals =
      appUpdates.chemicals && appUpdates.chemicals.length > 0
        ? (appUpdates.chemicals as unknown as Json)
        : null
  }
  if (appUpdates.area !== undefined) update.area = appUpdates.area
  if (appUpdates.weather !== undefined) update.weather = appUpdates.weather
  if (appUpdates.operator !== undefined) update.operator = appUpdates.operator
  if (appUpdates.date_of_pruning !== undefined)
    update.date_of_pruning = dateToISOString(appUpdates.date_of_pruning) as any
  if (appUpdates.notes !== undefined) update.notes = appUpdates.notes || null

  return update
}

// Fertigation Record conversion functions
export function toApplicationFertigationRecord(
  dbRecord: DatabaseFertigationRecord
): import('./supabase').FertigationRecord {
  // Helper to safely parse fertilizers from Json
  const parseFertilizers = (
    fertilizersJson: Json
  ): import('./supabase').Fertilizer[] | undefined => {
    if (!fertilizersJson || !Array.isArray(fertilizersJson)) return undefined
    // Validate structure
    const isValid = fertilizersJson.every(
      (f: any) =>
        typeof f === 'object' &&
        typeof f.name === 'string' &&
        typeof f.quantity === 'number' &&
        (f.unit === 'kg/acre' || f.unit === 'liter/acre')
    )
    return isValid ? (fertilizersJson as unknown as import('./supabase').Fertilizer[]) : undefined
  }

  return {
    id: dbRecord.id,
    farm_id: dbRecord.farm_id!,
    date: dbRecord.date,
    fertilizers: parseFertilizers(dbRecord.fertilizers),
    area: dbRecord.area || undefined,
    date_of_pruning: dbRecord.date_of_pruning ? new Date(dbRecord.date_of_pruning) : undefined,
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
    fertilizers: appRecord.fertilizers ? (appRecord.fertilizers as unknown as Json[]) : null,
    area: appRecord.area ?? 0,
    date_of_pruning: dateToISOString(appRecord.date_of_pruning) as any,
    notes: appRecord.notes || null
  } as DatabaseFertigationRecordInsert
}

export function toDatabaseFertigationUpdate(
  appUpdates: Partial<import('./supabase').FertigationRecord>
): DatabaseFertigationRecordUpdate {
  const update: DatabaseFertigationRecordUpdate = {}

  if (appUpdates.farm_id !== undefined) update.farm_id = appUpdates.farm_id
  if (appUpdates.date !== undefined) update.date = appUpdates.date
  if (appUpdates.area !== undefined) update.area = appUpdates.area
  if (appUpdates.fertilizers !== undefined) {
    update.fertilizers = appUpdates.fertilizers
      ? (appUpdates.fertilizers as unknown as Json[])
      : null
  }
  if (appUpdates.date_of_pruning !== undefined)
    update.date_of_pruning = dateToISOString(appUpdates.date_of_pruning) as any
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
    date_of_pruning: dbRecord.date_of_pruning ? new Date(dbRecord.date_of_pruning) : undefined,
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
    date_of_pruning: dateToISOString(appRecord.date_of_pruning) as any,
    notes: appRecord.notes || null
  } as DatabaseHarvestRecordInsert
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
  if (appUpdates.date_of_pruning !== undefined)
    update.date_of_pruning = dateToISOString(appUpdates.date_of_pruning) as any
  if (appUpdates.notes !== undefined) update.notes = appUpdates.notes || null

  return update
}

// Expense Record conversion functions
export function toApplicationExpenseRecord(
  dbRecord: DatabaseExpenseRecord
): import('./supabase').ExpenseRecord {
  const record = dbRecord as DatabaseExpenseRecord & {
    num_workers?: number | null
    hours_worked?: number | null
    work_type?: string | null
    rate_per_unit?: number | null
    worker_names?: string | null
  }
  return {
    id: record.id,
    farm_id: record.farm_id!,
    date: record.date,
    type: record.type as 'labor' | 'materials' | 'equipment' | 'fuel' | 'other',
    cost: record.cost,
    date_of_pruning: record.date_of_pruning ? new Date(record.date_of_pruning) : undefined,
    remarks: record.remarks ?? undefined,
    // Labor-specific fields
    num_workers: record.num_workers ?? undefined,
    hours_worked: record.hours_worked ?? undefined,
    work_type: record.work_type ?? undefined,
    rate_per_unit: record.rate_per_unit ?? undefined,
    worker_names: record.worker_names ?? undefined,
    created_at: record.created_at ?? undefined
  }
}

export function toDatabaseExpenseInsert(
  appRecord: Omit<import('./supabase').ExpenseRecord, 'id' | 'created_at'>
): DatabaseExpenseRecordInsert {
  const baseRecord: Record<string, any> = {
    farm_id: appRecord.farm_id,
    date: appRecord.date,
    type: appRecord.type,
    cost: appRecord.cost,
    date_of_pruning: dateToISOString(appRecord.date_of_pruning),
    remarks: appRecord.remarks ?? null
  }

  // Only include labor-specific fields when type is 'labor'
  if (appRecord.type === 'labor') {
    baseRecord.num_workers = appRecord.num_workers ?? null
    baseRecord.hours_worked = appRecord.hours_worked ?? null
    baseRecord.work_type = appRecord.work_type ?? null
    baseRecord.rate_per_unit = appRecord.rate_per_unit ?? null
    baseRecord.worker_names = appRecord.worker_names ?? null
  }

  return baseRecord as DatabaseExpenseRecordInsert
}

export function toDatabaseExpenseUpdate(
  appUpdates: Partial<import('./supabase').ExpenseRecord>
): DatabaseExpenseRecordUpdate {
  const update: Record<string, any> = {}

  if (appUpdates.farm_id !== undefined) update.farm_id = appUpdates.farm_id
  if (appUpdates.date !== undefined) update.date = appUpdates.date
  if (appUpdates.type !== undefined) update.type = appUpdates.type
  if (appUpdates.cost !== undefined) update.cost = appUpdates.cost
  if (appUpdates.date_of_pruning !== undefined)
    update.date_of_pruning = dateToISOString(appUpdates.date_of_pruning)
  if (appUpdates.remarks !== undefined) update.remarks = appUpdates.remarks ?? null
  // Labor-specific fields - only include when explicitly provided
  if (appUpdates.num_workers !== undefined) update.num_workers = appUpdates.num_workers ?? null
  if (appUpdates.hours_worked !== undefined) update.hours_worked = appUpdates.hours_worked ?? null
  if (appUpdates.work_type !== undefined) update.work_type = appUpdates.work_type ?? null
  if (appUpdates.rate_per_unit !== undefined)
    update.rate_per_unit = appUpdates.rate_per_unit ?? null
  if (appUpdates.worker_names !== undefined) update.worker_names = appUpdates.worker_names ?? null

  return update as DatabaseExpenseRecordUpdate
}

// Daily Note conversion functions
export function toApplicationDailyNote(dbRecord: DatabaseDailyNoteRecord): DailyNoteRecord {
  return {
    id: dbRecord.id,
    farm_id: dbRecord.farm_id,
    date: dbRecord.date,
    notes: dbRecord.notes,
    created_at: dbRecord.created_at || undefined,
    updated_at: dbRecord.updated_at || undefined
  }
}

export function toDatabaseDailyNoteInsert(
  appRecord: Omit<DailyNoteRecord, 'id' | 'created_at' | 'updated_at'>
): DatabaseDailyNoteRecordInsert {
  return {
    farm_id: appRecord.farm_id,
    date: appRecord.date,
    notes: appRecord.notes ?? null
  } as DatabaseDailyNoteRecordInsert
}

export function toDatabaseDailyNoteUpdate(
  appUpdates: Partial<DailyNoteRecord>
): DatabaseDailyNoteRecordUpdate {
  const update: DatabaseDailyNoteRecordUpdate = {}

  if (appUpdates.farm_id !== undefined) update.farm_id = appUpdates.farm_id
  if (appUpdates.date !== undefined) update.date = appUpdates.date
  if (appUpdates.notes !== undefined) update.notes = appUpdates.notes ?? null
  if (appUpdates.created_at !== undefined) update.created_at = appUpdates.created_at
  if (appUpdates.updated_at !== undefined) update.updated_at = appUpdates.updated_at

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
export function toApplicationTaskReminder(dbRecord: DatabaseTaskReminder): TaskReminder {
  return taskReminderFromDB(dbRecord as Database['public']['Tables']['task_reminders']['Row'])
}

export function toDatabaseTaskReminderInsert(
  appRecord: TaskReminderCreateInput
): DatabaseTaskReminderInsert {
  return {
    farm_id: appRecord.farmId,
    title: appRecord.title,
    description: appRecord.description ?? null,
    type: appRecord.type,
    status: appRecord.status ?? 'pending',
    priority: appRecord.priority ?? 'medium',
    due_date: appRecord.dueDate,
    estimated_duration_minutes: appRecord.estimatedDurationMinutes ?? null,
    location: appRecord.location ?? null,
    assigned_to_user_id: appRecord.assignedToUserId ?? null,
    created_by: appRecord.createdBy ?? null,
    linked_record_type: appRecord.linkedRecordType ?? null,
    linked_record_id: appRecord.linkedRecordId ?? null,
    completed: false, // Always false on creation
    completed_at: appRecord.completedAt ?? null
  }
}

export function toDatabaseTaskReminderUpdate(
  appUpdates: TaskReminderUpdateInput
): DatabaseTaskReminderUpdate {
  const update: DatabaseTaskReminderUpdate = {}

  if (appUpdates.farmId !== undefined) update.farm_id = appUpdates.farmId
  if (appUpdates.title !== undefined) update.title = appUpdates.title
  if (appUpdates.description !== undefined) update.description = appUpdates.description ?? null
  if (appUpdates.type !== undefined) update.type = appUpdates.type
  if (appUpdates.status !== undefined) update.status = appUpdates.status
  if (appUpdates.priority !== undefined) update.priority = appUpdates.priority
  if (appUpdates.dueDate !== undefined) update.due_date = appUpdates.dueDate
  if (appUpdates.estimatedDurationMinutes !== undefined)
    update.estimated_duration_minutes = appUpdates.estimatedDurationMinutes ?? null
  if (appUpdates.location !== undefined) update.location = appUpdates.location ?? null
  if (appUpdates.assignedToUserId !== undefined)
    update.assigned_to_user_id = appUpdates.assignedToUserId ?? null
  if (appUpdates.createdBy !== undefined) update.created_by = appUpdates.createdBy ?? null
  if (appUpdates.linkedRecordType !== undefined)
    update.linked_record_type = appUpdates.linkedRecordType ?? null
  if (appUpdates.linkedRecordId !== undefined)
    update.linked_record_id = appUpdates.linkedRecordId ?? null
  if (appUpdates.completed !== undefined) update.completed = appUpdates.completed
  if (appUpdates.completedAt !== undefined) update.completed_at = appUpdates.completedAt

  return update
}

// Soil Test Record conversion functions
export function toApplicationSoilTestRecord(
  dbRecord: DatabaseSoilTestRecord
): import('./supabase').SoilTestRecord {
  const params = (dbRecord.parameters as Record<string, number>) || {}
  return {
    id: dbRecord.id,
    farm_id: dbRecord.farm_id!,
    date: dbRecord.date,
    parameters: canonicalizeParameters(params),
    date_of_pruning: dbRecord.date_of_pruning ? new Date(dbRecord.date_of_pruning) : undefined,
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
    parameters: canonicalizeParameters(appRecord.parameters || {}),
    date_of_pruning: dateToISOString(appRecord.date_of_pruning) as any,
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
  } as DatabaseSoilTestRecordInsert
}

export function toDatabaseSoilTestUpdate(
  appUpdates: Partial<import('./supabase').SoilTestRecord>
): DatabaseSoilTestRecordUpdate {
  const update: DatabaseSoilTestRecordUpdate = {}

  if (appUpdates.farm_id !== undefined) update.farm_id = appUpdates.farm_id
  if (appUpdates.date !== undefined) update.date = appUpdates.date
  if (appUpdates.parameters !== undefined)
    update.parameters = canonicalizeParameters(appUpdates.parameters || {})
  if (appUpdates.date_of_pruning !== undefined)
    update.date_of_pruning = dateToISOString(appUpdates.date_of_pruning) as any
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

export function toApplicationSoilProfile(
  dbRecord: DatabaseSoilProfile
): import('./supabase').SoilProfile {
  const sections = (dbRecord.sections as import('./supabase').SoilSection[] | null) || []
  return {
    id: dbRecord.id,
    farm_id: dbRecord.farm_id,
    fusarium_pct: dbRecord.fusarium_pct ?? undefined,
    created_at: dbRecord.created_at ?? undefined,
    sections
  }
}

export function toDatabaseSoilProfileInsert(
  appRecord: Omit<import('./supabase').SoilProfile, 'id' | 'created_at'>
): DatabaseSoilProfileInsert {
  return {
    farm_id: appRecord.farm_id,
    fusarium_pct: appRecord.fusarium_pct ?? null,
    sections: serializeSoilSections(appRecord.sections)
  }
}

export function toDatabaseSoilProfileUpdate(
  appUpdates: Partial<import('./supabase').SoilProfile>
): DatabaseSoilProfileUpdate {
  const update: DatabaseSoilProfileUpdate = {}
  if (appUpdates.farm_id !== undefined) update.farm_id = appUpdates.farm_id
  if (appUpdates.fusarium_pct !== undefined) update.fusarium_pct = appUpdates.fusarium_pct ?? null
  if (appUpdates.sections !== undefined) {
    update.sections = serializeSoilSections(appUpdates.sections)
  }
  return update
}

// Petiole Test Record conversion functions
export function toApplicationPetioleTestRecord(
  dbRecord: DatabasePetioleTestRecord
): import('./supabase').PetioleTestRecord {
  const params = (dbRecord.parameters as Record<string, number>) || {}
  return {
    id: dbRecord.id,
    farm_id: dbRecord.farm_id!,
    date: dbRecord.date,
    date_of_pruning: dbRecord.date_of_pruning ? new Date(dbRecord.date_of_pruning) : undefined,
    parameters: canonicalizeParameters(params),
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
    date_of_pruning: dateToISOString(appRecord.date_of_pruning) as any,
    parameters: canonicalizeParameters(appRecord.parameters || {}),
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
  } as DatabasePetioleTestRecordInsert
}

export function toDatabasePetioleTestUpdate(
  appUpdates: Partial<import('./supabase').PetioleTestRecord>
): DatabasePetioleTestRecordUpdate {
  const update: DatabasePetioleTestRecordUpdate = {}

  if (appUpdates.farm_id !== undefined) update.farm_id = appUpdates.farm_id
  if (appUpdates.date !== undefined) update.date = appUpdates.date
  if (appUpdates.date_of_pruning !== undefined)
    update.date_of_pruning = dateToISOString(appUpdates.date_of_pruning) as any

  if (appUpdates.parameters !== undefined) {
    update.parameters = canonicalizeParameters(appUpdates.parameters || {})
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
