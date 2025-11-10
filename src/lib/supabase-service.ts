import {
  getTypedSupabaseClient,
  type IrrigationRecord,
  type SprayRecord,
  type FertigationRecord,
  type HarvestRecord,
  type ExpenseRecord,
  type CalculationHistory,
  type SoilTestRecord,
  type PetioleTestRecord,
  type DailyNoteRecord
} from './supabase'
import { type Farm, type TaskReminder } from '@/types/types'
import {
  toApplicationFarm,
  toDatabaseFarmInsert,
  toDatabaseFarmUpdate,
  toApplicationIrrigationRecord,
  toDatabaseIrrigationInsert,
  toDatabaseIrrigationUpdate,
  toApplicationSprayRecord,
  toDatabaseSprayInsert,
  toDatabaseSprayUpdate,
  toApplicationFertigationRecord,
  toDatabaseFertigationInsert,
  toDatabaseFertigationUpdate,
  toApplicationHarvestRecord,
  toDatabaseHarvestInsert,
  toDatabaseHarvestUpdate,
  toApplicationExpenseRecord,
  toDatabaseExpenseInsert,
  toDatabaseExpenseUpdate,
  toApplicationCalculationHistory,
  toDatabaseCalculationHistoryInsert,
  toApplicationTaskReminder,
  toDatabaseTaskReminderInsert,
  toDatabaseTaskReminderUpdate,
  TaskReminderCreateInput,
  TaskReminderUpdateInput,
  toApplicationSoilTestRecord,
  toDatabaseSoilTestInsert,
  toDatabaseSoilTestUpdate,
  toApplicationPetioleTestRecord,
  toDatabasePetioleTestInsert,
  toDatabasePetioleTestUpdate,
  toApplicationDailyNote,
  toDatabaseDailyNoteInsert,
  toDatabaseDailyNoteUpdate
} from './supabase-types'

export class SupabaseService {
  // Farm operations
  static async getAllFarms(): Promise<Farm[]> {
    const supabase = getTypedSupabaseClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('User must be authenticated to fetch farms')

    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error in getAllFarms:', error)
      throw new Error(`Failed to get farms: ${error.message} (Code: ${error.code || 'UNKNOWN'})`)
    }
    return (data || []).map(toApplicationFarm)
  }

  static async getFarmById(id: number): Promise<Farm | null> {
    const supabase = getTypedSupabaseClient()
    const { data, error } = await supabase.from('farms').select('*').eq('id', id).single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data ? toApplicationFarm(data) : null
  }

  static async createFarm(
    farm: Omit<Farm, 'id' | 'created_at' | 'updated_at' | 'user_id'>
  ): Promise<Farm> {
    const supabase = getTypedSupabaseClient()

    // Get the current authenticated user
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('User must be authenticated to create a farm')

    // Include the user_id in the farm data and convert to database format
    const farmWithUser = { ...farm, user_id: user.id }
    const dbFarmData = toDatabaseFarmInsert(farmWithUser)

    const { data, error } = await supabase
      .from('farms')
      .insert(dbFarmData as any)
      .select()
      .single()

    if (error) throw error
    return toApplicationFarm(data)
  }

  static async updateFarm(id: number, updates: Partial<Farm>): Promise<Farm> {
    const supabase = getTypedSupabaseClient()
    const dbUpdates = toDatabaseFarmUpdate(updates)

    const { data, error } = await supabase
      .from('farms')
      .update(dbUpdates as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return toApplicationFarm(data)
  }

  static async deleteFarm(id: number): Promise<void> {
    const supabase = getTypedSupabaseClient()
    const { error } = await supabase.from('farms').delete().eq('id', id)

    if (error) throw error
  }

  // Irrigation operations
  static async getIrrigationRecords(farmId: number, limit?: number): Promise<IrrigationRecord[]> {
    const supabase = getTypedSupabaseClient()
    let query = supabase
      .from('irrigation_records')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error
    return (data || []).map(toApplicationIrrigationRecord)
  }

  static async addIrrigationRecord(
    record: Omit<IrrigationRecord, 'id' | 'created_at'>
  ): Promise<IrrigationRecord> {
    const supabase = getTypedSupabaseClient()

    // Validate duration if provided
    if (record.duration !== undefined && record.duration !== null) {
      // Validate duration is strictly greater than 0
      if (record.duration <= 0 || !isFinite(record.duration)) {
        throw new Error('Duration must be greater than 0')
      }

      // Validate duration is within reasonable bounds (max 24 hours)
      if (record.duration > 24) {
        throw new Error('Duration cannot exceed 24 hours')
      }
    }

    // Validate area if provided
    if (record.area !== undefined && record.area !== null) {
      // Check for NaN and Infinity
      if (isNaN(record.area) || !isFinite(record.area)) {
        throw new Error('Area must be a valid number')
      }

      // Validate area is strictly greater than 0
      if (record.area <= 0) {
        throw new Error('Area must be greater than 0')
      }

      // Validate area is within reasonable bounds
      if (record.area > 25000) {
        throw new Error('Area cannot exceed 25,000 acres')
      }
    }

    // Validate system_discharge if provided
    if (record.system_discharge !== undefined && record.system_discharge !== null) {
      // Check for NaN and Infinity
      if (isNaN(record.system_discharge) || !isFinite(record.system_discharge)) {
        throw new Error('System discharge must be a valid number')
      }

      // Validate system_discharge is strictly greater than 0
      if (record.system_discharge <= 0) {
        throw new Error('System discharge must be greater than 0')
      }

      // Validate system_discharge is within reasonable bounds
      if (record.system_discharge > 10000) {
        throw new Error('System discharge cannot exceed 10,000 L/h')
      }
    }

    const dbRecord = toDatabaseIrrigationInsert(record)

    const { data, error } = await supabase
      .from('irrigation_records')
      .insert(dbRecord as any)
      .select()
      .single()

    if (error) throw error
    return toApplicationIrrigationRecord(data)
  }

  static async updateIrrigationRecord(
    id: number,
    updates: Partial<IrrigationRecord>
  ): Promise<IrrigationRecord> {
    const supabase = getTypedSupabaseClient()

    // Validate duration if provided
    if (updates.duration !== undefined && updates.duration !== null) {
      // Check for NaN and Infinity
      if (isNaN(updates.duration) || !isFinite(updates.duration)) {
        throw new Error('Duration must be a valid number')
      }

      // Validate duration is strictly greater than 0
      if (updates.duration <= 0) {
        throw new Error('Duration must be greater than 0')
      }

      // Validate duration is within reasonable bounds (max 24 hours)
      if (updates.duration > 24) {
        throw new Error('Duration cannot exceed 24 hours')
      }
    }

    // Validate area if provided
    if (updates.area !== undefined && updates.area !== null) {
      // Check for NaN and Infinity
      if (isNaN(updates.area) || !isFinite(updates.area)) {
        throw new Error('Area must be a valid number')
      }

      // Validate area is strictly greater than 0
      if (updates.area <= 0) {
        throw new Error('Area must be greater than 0')
      }

      // Validate area is within reasonable bounds
      if (updates.area > 25000) {
        throw new Error('Area cannot exceed 25,000 acres')
      }
    }

    // Validate system_discharge if provided
    if (updates.system_discharge !== undefined && updates.system_discharge !== null) {
      // Check for NaN and Infinity
      if (isNaN(updates.system_discharge) || !isFinite(updates.system_discharge)) {
        throw new Error('System discharge must be a valid number')
      }

      // Validate system_discharge is strictly greater than 0
      if (updates.system_discharge <= 0) {
        throw new Error('System discharge must be greater than 0')
      }

      // Validate system_discharge is within reasonable bounds
      if (updates.system_discharge > 10000) {
        throw new Error('System discharge cannot exceed 10,000 L/h')
      }
    }

    const dbUpdates = toDatabaseIrrigationUpdate(updates)

    const { data, error } = await supabase
      .from('irrigation_records')
      .update(dbUpdates as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return toApplicationIrrigationRecord(data)
  }

  static async deleteIrrigationRecord(id: number): Promise<void> {
    const supabase = getTypedSupabaseClient()

    const { data: record, error } = await supabase
      .from('irrigation_records')
      .delete()
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return
      }
      throw error
    }

    if (!record?.farm_id) {
      return
    }

    const farm = await this.getFarmById(record.farm_id)

    if (!farm) {
      return
    }

    const rawDuration = Number(record.duration ?? 0)
    const rawSystemDischarge = Number(record.system_discharge ?? farm.systemDischarge ?? 0)

    if (!Number.isFinite(rawDuration) || !Number.isFinite(rawSystemDischarge)) {
      return
    }

    const duration = Math.max(rawDuration, 0)
    const systemDischarge = Math.max(rawSystemDischarge, 0)

    if (duration <= 0 || systemDischarge <= 0) {
      return
    }

    const waterContribution = duration * systemDischarge

    if (!Number.isFinite(waterContribution) || waterContribution <= 0) {
      return
    }

    const currentWaterLevel = Number(farm.remainingWater ?? 0)
    const safeCurrentLevel = Number.isFinite(currentWaterLevel) ? currentWaterLevel : 0
    const updatedWaterLevel = Math.max(safeCurrentLevel - waterContribution, 0)

    await this.updateFarm(record.farm_id, {
      remainingWater: updatedWaterLevel,
      waterCalculationUpdatedAt: new Date().toISOString()
    })
  }

  // Spray operations
  static async getSprayRecords(farmId: number): Promise<SprayRecord[]> {
    const supabase = getTypedSupabaseClient()
    const { data, error } = await supabase
      .from('spray_records')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false })

    if (error) throw error
    return (data || []).map(toApplicationSprayRecord)
  }

  static async addSprayRecord(
    record: Omit<SprayRecord, 'id' | 'created_at'>
  ): Promise<SprayRecord> {
    const supabase = getTypedSupabaseClient()

    // Validate the chemicals array if provided
    if (record.chemicals && record.chemicals.length > 0) {
      // Ensure each chemical has the required fields
      for (const chemical of record.chemicals) {
        // Validate chemical name
        const trimmedName = chemical.name.trim()
        if (!trimmedName) {
          throw new Error('Chemical name is required and cannot be empty')
        }

        // Validate chemical name length
        if (trimmedName.length > 100) {
          throw new Error('Chemical name must be less than 100 characters')
        }

        // Validate quantity is provided and is a valid number
        if (chemical.quantity === undefined || chemical.quantity === null) {
          throw new Error('Chemical quantity is required')
        }

        // Check for NaN and Infinity
        if (isNaN(chemical.quantity) || !isFinite(chemical.quantity)) {
          throw new Error('Chemical quantity must be a valid number')
        }

        // Validate quantity is strictly greater than 0
        if (chemical.quantity <= 0) {
          throw new Error('Chemical quantity must be greater than 0')
        }

        // Validate unit is provided
        if (!chemical.unit) {
          throw new Error('Chemical unit is required')
        }

        // Trim unit once into local variable
        const unit = chemical.unit.trim()

        // Validate unit is one of the allowed values
        if (!['gm/L', 'ml/L', 'ppm'].includes(unit)) {
          throw new Error('Chemical unit must be either "gm/L", "ml/L", or "ppm"')
        }

        // Assign/store sanitized trimmed value back to object with proper type assertion
        chemical.unit = unit as 'gm/L' | 'ml/L' | 'ppm'
      }
    }

    // Validate water_volume if provided
    if (record.water_volume !== undefined && record.water_volume !== null) {
      // Check for NaN and Infinity
      if (isNaN(record.water_volume) || !isFinite(record.water_volume)) {
        throw new Error('Water volume must be a valid number')
      }

      // Validate water_volume is strictly greater than 0
      if (record.water_volume <= 0) {
        throw new Error('Water volume must be greater than 0')
      }
    }

    // Validate quantity_amount if provided
    if (record.quantity_amount !== undefined && record.quantity_amount !== null) {
      // Check for NaN and Infinity
      if (isNaN(record.quantity_amount) || !isFinite(record.quantity_amount)) {
        throw new Error('Quantity amount must be a valid number')
      }

      // Validate quantity_amount is strictly greater than 0
      if (record.quantity_amount <= 0) {
        throw new Error('Quantity amount must be greater than 0')
      }
    }

    // Validate quantity_unit - if quantity_amount is provided, unit is required
    if (record.quantity_amount !== undefined && record.quantity_amount !== null) {
      // quantity_amount is provided, so unit is required
      if (!record.quantity_unit || typeof record.quantity_unit !== 'string') {
        throw new Error('Quantity unit is required when quantity amount is provided')
      }

      const unit = record.quantity_unit.trim()
      if (!unit) {
        throw new Error('Quantity unit cannot be empty when quantity amount is provided')
      }

      if (!['gm/L', 'ml/L', 'ppm'].includes(unit)) {
        throw new Error('Quantity unit must be either "gm/L", "ml/L", or "ppm"')
      }

      // Assign/store sanitized trimmed value back to record with proper type assertion
      record.quantity_unit = unit as 'gm/L' | 'ml/L' | 'ppm'
    } else if (record.quantity_unit) {
      // quantity_amount is not provided, but unit is - validate it anyway
      const unit = record.quantity_unit.trim()
      if (unit && !['gm/L', 'ml/L', 'ppm'].includes(unit)) {
        throw new Error('Quantity unit must be either "gm/L", "ml/L", or "ppm"')
      }
      // Assign/store sanitized trimmed value back to record with proper type assertion
      record.quantity_unit = unit as 'gm/L' | 'ml/L' | 'ppm'
    }

    // Validate area if provided
    if (record.area !== undefined && record.area !== null) {
      // Check for NaN and Infinity
      if (isNaN(record.area) || !isFinite(record.area)) {
        throw new Error('Area must be a valid number')
      }

      // Validate area is strictly greater than 0
      if (record.area <= 0) {
        throw new Error('Area must be greater than 0')
      }
    }

    const dbRecord = toDatabaseSprayInsert(record)

    const { data, error } = await supabase
      .from('spray_records')
      .insert(dbRecord as any)
      .select()
      .single()

    if (error) throw error
    return toApplicationSprayRecord(data)
  }

  static async updateSprayRecord(id: number, updates: Partial<SprayRecord>): Promise<SprayRecord> {
    const supabase = getTypedSupabaseClient()

    // Validate the chemicals array if provided
    if (updates.chemicals && updates.chemicals.length > 0) {
      // Ensure each chemical has the required fields
      for (const chemical of updates.chemicals) {
        // Validate chemical name
        if (!chemical.name || !chemical.name.trim()) {
          throw new Error('Chemical name is required and cannot be empty')
        }

        // Validate chemical name length
        if (chemical.name.trim().length > 100) {
          throw new Error('Chemical name must be less than 100 characters')
        }

        // Validate quantity is provided and is a valid number
        if (chemical.quantity === undefined || chemical.quantity === null) {
          throw new Error('Chemical quantity is required')
        }

        // Check for NaN and Infinity
        if (isNaN(chemical.quantity) || !isFinite(chemical.quantity)) {
          throw new Error('Chemical quantity must be a valid number')
        }

        // Validate quantity is strictly greater than 0
        if (chemical.quantity <= 0) {
          throw new Error('Chemical quantity must be greater than 0')
        }

        // Validate unit is provided
        if (!chemical.unit) {
          throw new Error('Chemical unit is required')
        }

        // Trim unit once into local variable
        const unit = chemical.unit.trim()

        // Validate unit is one of the allowed values
        if (!['gm/L', 'ml/L', 'ppm'].includes(unit)) {
          throw new Error('Chemical unit must be either "gm/L", "ml/L", or "ppm"')
        }

        // Assign/store sanitized trimmed value back to object with proper type assertion
        chemical.unit = unit as 'gm/L' | 'ml/L' | 'ppm'
      }
    }

    // Validate water_volume if provided
    if (updates.water_volume !== undefined && updates.water_volume !== null) {
      // Check for NaN and Infinity
      if (isNaN(updates.water_volume) || !isFinite(updates.water_volume)) {
        throw new Error('Water volume must be a valid number')
      }

      // Validate water_volume is strictly greater than 0
      if (updates.water_volume <= 0) {
        throw new Error('Water volume must be greater than 0')
      }
    }

    // Validate quantity_amount if provided
    if (updates.quantity_amount !== undefined && updates.quantity_amount !== null) {
      // Check for NaN and Infinity
      if (isNaN(updates.quantity_amount) || !isFinite(updates.quantity_amount)) {
        throw new Error('Quantity amount must be a valid number')
      }

      // Validate quantity_amount is strictly greater than 0
      if (updates.quantity_amount <= 0) {
        throw new Error('Quantity amount must be greater than 0')
      }
    }

    // Validate quantity_unit - if quantity_amount is provided, unit is required
    if (updates.quantity_amount !== undefined && updates.quantity_amount !== null) {
      // quantity_amount is provided, so unit is required
      if (!updates.quantity_unit || typeof updates.quantity_unit !== 'string') {
        throw new Error('Quantity unit is required when quantity amount is provided')
      }

      const unit = updates.quantity_unit.trim()
      if (!unit) {
        throw new Error('Quantity unit cannot be empty when quantity amount is provided')
      }

      if (!['gm/L', 'ml/L', 'ppm'].includes(unit)) {
        throw new Error('Quantity unit must be either "gm/L", "ml/L", or "ppm"')
      }

      // Assign/store sanitized trimmed value back to updates with proper type assertion
      updates.quantity_unit = unit as 'gm/L' | 'ml/L' | 'ppm'
    } else if (updates.quantity_unit) {
      // quantity_amount is not provided, but unit is - validate it anyway
      const unit = updates.quantity_unit.trim()
      if (unit && !['gm/L', 'ml/L', 'ppm'].includes(unit)) {
        throw new Error('Quantity unit must be either "gm/L", "ml/L", or "ppm"')
      }
      // Assign/store sanitized trimmed value back to updates with proper type assertion
      updates.quantity_unit = unit as 'gm/L' | 'ml/L' | 'ppm'
    }

    // Validate area if provided
    if (updates.area !== undefined && updates.area !== null) {
      // Check for NaN and Infinity
      if (isNaN(updates.area) || !isFinite(updates.area)) {
        throw new Error('Area must be a valid number')
      }

      // Validate area is strictly greater than 0
      if (updates.area <= 0) {
        throw new Error('Area must be greater than 0')
      }
    }

    const dbUpdates = toDatabaseSprayUpdate(updates)

    const { data, error } = await supabase
      .from('spray_records')
      .update(dbUpdates as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return toApplicationSprayRecord(data)
  }

  static async deleteSprayRecord(id: number): Promise<void> {
    const supabase = getTypedSupabaseClient()
    const { error } = await supabase.from('spray_records').delete().eq('id', id)

    if (error) throw error
  }

  // Fertigation operations
  static async getFertigationRecords(farmId: number): Promise<FertigationRecord[]> {
    const supabase = getTypedSupabaseClient()
    const { data, error } = await supabase
      .from('fertigation_records')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false })

    if (error) throw error
    return (data || []).map(toApplicationFertigationRecord)
  }

  static async addFertigationRecord(
    record: Omit<FertigationRecord, 'id' | 'created_at'>
  ): Promise<FertigationRecord> {
    const supabase = getTypedSupabaseClient()

    // Validate fertilizers array
    if (!record.fertilizers || record.fertilizers.length === 0) {
      throw new Error('At least one fertilizer is required')
    }

    // Ensure each fertilizer has the required fields
    for (const fertilizer of record.fertilizers) {
      // Validate fertilizer name
      const trimmedName = fertilizer.name.trim()
      if (!trimmedName) {
        throw new Error('Fertilizer name is required and cannot be empty')
      }

      // Validate fertilizer name length
      if (trimmedName.length > 100) {
        throw new Error('Fertilizer name must be less than 100 characters')
      }

      // Validate quantity is provided and is a valid number
      if (fertilizer.quantity === undefined || fertilizer.quantity === null) {
        throw new Error('Fertilizer quantity is required')
      }

      // Check for NaN and Infinity
      if (isNaN(fertilizer.quantity) || !isFinite(fertilizer.quantity)) {
        throw new Error('Fertilizer quantity must be a valid number')
      }

      // Validate quantity is strictly greater than 0
      if (fertilizer.quantity <= 0) {
        throw new Error('Fertilizer quantity must be greater than 0')
      }

      // Validate unit is provided
      if (!fertilizer.unit) {
        throw new Error('Fertilizer unit is required')
      }

      // Trim unit once into local variable
      const unit = fertilizer.unit.trim()

      // Validate unit is one of the allowed values
      if (!['kg/acre', 'liter/acre'].includes(unit)) {
        throw new Error('Fertilizer unit must be either "kg/acre" or "liter/acre"')
      }

      // Assign/store sanitized trimmed value back to object with proper type assertion
      fertilizer.unit = unit as 'kg/acre' | 'liter/acre'
    }

    // Validate area if provided
    if (record.area !== undefined && record.area !== null) {
      // Check for NaN and Infinity
      if (isNaN(record.area) || !isFinite(record.area)) {
        throw new Error('Area must be a valid number')
      }

      // Validate area is strictly greater than 0
      if (record.area <= 0) {
        throw new Error('Area must be greater than 0')
      }

      // Validate area is within reasonable bounds
      if (record.area > 25000) {
        throw new Error('Area cannot exceed 25,000 acres')
      }
    }

    const dbRecord = toDatabaseFertigationInsert(record)

    const { data, error } = await supabase
      .from('fertigation_records')
      .insert(dbRecord as any)
      .select()
      .single()

    if (error) {
      console.error('Supabase error in addFertigationRecord:', error)
      throw new Error(
        `Failed to add fertigation record: ${error.message} (Code: ${error.code || 'UNKNOWN'})`
      )
    }
    return toApplicationFertigationRecord(data)
  }

  static async updateFertigationRecord(
    id: number,
    updates: Partial<FertigationRecord>
  ): Promise<FertigationRecord> {
    const supabase = getTypedSupabaseClient()

    // Validate fertilizers array if provided
    if (updates.fertilizers && updates.fertilizers.length > 0) {
      // Ensure each fertilizer has the required fields
      for (const fertilizer of updates.fertilizers) {
        // Validate fertilizer name
        if (!fertilizer.name || !fertilizer.name.trim()) {
          throw new Error('Fertilizer name is required and cannot be empty')
        }

        // Validate fertilizer name length
        if (fertilizer.name.trim().length > 100) {
          throw new Error('Fertilizer name must be less than 100 characters')
        }

        // Validate quantity is provided and is a valid number
        if (fertilizer.quantity === undefined || fertilizer.quantity === null) {
          throw new Error('Fertilizer quantity is required')
        }

        // Check for NaN and Infinity
        if (isNaN(fertilizer.quantity) || !isFinite(fertilizer.quantity)) {
          throw new Error('Fertilizer quantity must be a valid number')
        }

        // Validate quantity is strictly greater than 0
        if (fertilizer.quantity <= 0) {
          throw new Error('Fertilizer quantity must be greater than 0')
        }

        // Validate unit is provided
        if (!fertilizer.unit) {
          throw new Error('Fertilizer unit is required')
        }

        // Trim unit once into local variable
        const unit = fertilizer.unit.trim()

        // Validate unit is one of the allowed values
        if (!['kg/acre', 'liter/acre'].includes(unit)) {
          throw new Error('Fertilizer unit must be either "kg/acre" or "liter/acre"')
        }

        // Assign/store sanitized trimmed value back to object with proper type assertion
        fertilizer.unit = unit as 'kg/acre' | 'liter/acre'
      }
    }

    // Validate area if provided
    if (updates.area !== undefined && updates.area !== null) {
      // Check for NaN and Infinity
      if (isNaN(updates.area) || !isFinite(updates.area)) {
        throw new Error('Area must be a valid number')
      }

      // Validate area is strictly greater than 0
      if (updates.area <= 0) {
        throw new Error('Area must be greater than 0')
      }

      // Validate area is within reasonable bounds
      if (updates.area > 25000) {
        throw new Error('Area cannot exceed 25,000 acres')
      }
    }

    const dbUpdates = toDatabaseFertigationUpdate(updates)

    const { data, error } = await supabase
      .from('fertigation_records')
      .update(dbUpdates as any)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase error in updateFertigationRecord:', error)
      throw new Error(
        `Failed to update fertigation record: ${error.message} (Code: ${error.code || 'UNKNOWN'})`
      )
    }
    return toApplicationFertigationRecord(data)
  }

  static async deleteFertigationRecord(id: number): Promise<void> {
    const supabase = getTypedSupabaseClient()
    const { error } = await supabase.from('fertigation_records').delete().eq('id', id)

    if (error) throw error
  }

  // Harvest operations
  static async getHarvestRecords(farmId: number): Promise<HarvestRecord[]> {
    const supabase = getTypedSupabaseClient()
    const { data, error } = await supabase
      .from('harvest_records')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false })

    if (error) throw error
    return (data || []).map(toApplicationHarvestRecord)
  }

  static async addHarvestRecord(
    record: Omit<HarvestRecord, 'id' | 'created_at'>
  ): Promise<HarvestRecord> {
    const supabase = getTypedSupabaseClient()
    const dbRecord = toDatabaseHarvestInsert(record)

    const { data, error } = await supabase
      .from('harvest_records')
      .insert(dbRecord as any)
      .select()
      .single()

    if (error) throw error
    return toApplicationHarvestRecord(data)
  }

  static async updateHarvestRecord(
    id: number,
    updates: Partial<HarvestRecord>
  ): Promise<HarvestRecord> {
    const supabase = getTypedSupabaseClient()
    const dbUpdates = toDatabaseHarvestUpdate(updates)

    const { data, error } = await supabase
      .from('harvest_records')
      .update(dbUpdates as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return toApplicationHarvestRecord(data)
  }

  static async deleteHarvestRecord(id: number): Promise<void> {
    const supabase = getTypedSupabaseClient()
    const { error } = await supabase.from('harvest_records').delete().eq('id', id)

    if (error) throw error
  }

  // Expense operations
  static async getExpenseRecords(farmId: number): Promise<ExpenseRecord[]> {
    const supabase = getTypedSupabaseClient()
    const { data, error } = await supabase
      .from('expense_records')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false })

    if (error) throw error
    return (data || []).map(toApplicationExpenseRecord)
  }

  static async addExpenseRecord(
    record: Omit<ExpenseRecord, 'id' | 'created_at'>
  ): Promise<ExpenseRecord> {
    const supabase = getTypedSupabaseClient()
    const dbRecord = toDatabaseExpenseInsert(record)

    const { data, error } = await supabase
      .from('expense_records')
      .insert(dbRecord as any)
      .select()
      .single()

    if (error) throw error
    return toApplicationExpenseRecord(data)
  }

  static async updateExpenseRecord(
    id: number,
    updates: Partial<ExpenseRecord>
  ): Promise<ExpenseRecord> {
    const supabase = getTypedSupabaseClient()
    const dbUpdates = toDatabaseExpenseUpdate(updates)

    const { data, error } = await supabase
      .from('expense_records')
      .update(dbUpdates as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return toApplicationExpenseRecord(data)
  }

  static async deleteExpenseRecord(id: number): Promise<void> {
    const supabase = getTypedSupabaseClient()
    const { error } = await supabase.from('expense_records').delete().eq('id', id)

    if (error) throw error
  }

  // Daily note operations
  static async getDailyNotes(farmId: number, limit?: number): Promise<DailyNoteRecord[]> {
    const supabase = getTypedSupabaseClient()
    let query = supabase
      .from('daily_notes')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false })

    if (limit !== undefined) {
      query = query.limit(limit)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []).map(toApplicationDailyNote)
  }

  static async getDailyNoteByDate(farmId: number, date: string): Promise<DailyNoteRecord | null> {
    const supabase = getTypedSupabaseClient()
    const { data, error } = await supabase
      .from('daily_notes')
      .select('*')
      .eq('farm_id', farmId)
      .eq('date', date)
      .maybeSingle()

    if (error) throw error
    return data ? toApplicationDailyNote(data) : null
  }

  static async upsertDailyNote(note: {
    farm_id: number
    date: string
    notes?: string | null
  }): Promise<DailyNoteRecord> {
    const supabase = getTypedSupabaseClient()
    const sanitizedNotes = note.notes?.trim() ?? ''

    const { data, error } = await supabase
      .from('daily_notes')
      .upsert(
        {
          ...toDatabaseDailyNoteInsert({
            farm_id: note.farm_id,
            date: note.date,
            notes: sanitizedNotes
          }),
          updated_at: new Date().toISOString()
        },
        { onConflict: 'farm_id,date' }
      )
      .select()
      .single()

    if (error) throw error
    return toApplicationDailyNote(data)
  }

  static async updateDailyNote(
    id: number,
    updates: Partial<DailyNoteRecord>
  ): Promise<DailyNoteRecord> {
    const supabase = getTypedSupabaseClient()
    const dbUpdates = toDatabaseDailyNoteUpdate(updates)

    const { data, error } = await supabase
      .from('daily_notes')
      .update(dbUpdates as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return toApplicationDailyNote(data)
  }

  static async deleteDailyNote(id: number): Promise<void> {
    const supabase = getTypedSupabaseClient()
    const { error } = await supabase.from('daily_notes').delete().eq('id', id)
    if (error) throw error
  }

  static async deleteDailyNoteForDate(farmId: number, date: string): Promise<void> {
    const supabase = getTypedSupabaseClient()
    const { error } = await supabase
      .from('daily_notes')
      .delete()
      .eq('farm_id', farmId)
      .eq('date', date)
    if (error) throw error
  }

  // Calculation history operations
  static async getCalculationHistory(farmId: number): Promise<CalculationHistory[]> {
    const supabase = getTypedSupabaseClient()
    const { data, error } = await supabase
      .from('calculation_history')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false })

    if (error) throw error
    return (data || []).map(toApplicationCalculationHistory)
  }

  static async addCalculationHistory(
    record: Omit<CalculationHistory, 'id' | 'created_at'>
  ): Promise<CalculationHistory> {
    const supabase = getTypedSupabaseClient()
    const dbRecord = toDatabaseCalculationHistoryInsert(record)

    const { data, error } = await supabase
      .from('calculation_history')
      .insert(dbRecord as any)
      .select()
      .single()

    if (error) throw error
    return toApplicationCalculationHistory(data)
  }

  // Task operations
  static async getTaskReminders(
    farmId: number,
    options: { status?: TaskReminder['status'][] } = {}
  ): Promise<TaskReminder[]> {
    const supabase = getTypedSupabaseClient()
    let query = supabase
      .from('task_reminders')
      .select('*')
      .eq('farm_id', farmId)
      .order('due_date', { ascending: true })
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })

    if (options.status && options.status.length > 0) {
      query = query.in('status', options.status as string[])
    }

    const { data, error } = await query

    if (error) throw error
    return (data || []).map(toApplicationTaskReminder)
  }

  static async getPendingTasks(farmId: number): Promise<TaskReminder[]> {
    return this.getTaskReminders(farmId, { status: ['pending', 'in_progress'] })
  }

  static async getTaskById(id: number): Promise<TaskReminder | null> {
    const supabase = getTypedSupabaseClient()
    const { data, error } = await supabase
      .from('task_reminders')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data ? toApplicationTaskReminder(data) : null
  }

  static async addTaskReminder(task: TaskReminderCreateInput): Promise<TaskReminder> {
    const supabase = getTypedSupabaseClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    const dbTask = toDatabaseTaskReminderInsert({
      ...task,
      status: task.status ?? 'pending',
      priority: task.priority ?? 'medium',
      createdBy: task.createdBy ?? user?.id ?? null
    })

    const { data, error } = await supabase
      .from('task_reminders')
      .insert(dbTask as any)
      .select()
      .single()

    if (error) throw error
    return toApplicationTaskReminder(data)
  }

  static async updateTask(id: number, updates: TaskReminderUpdateInput): Promise<TaskReminder> {
    const supabase = getTypedSupabaseClient()
    const dbUpdates = toDatabaseTaskReminderUpdate(updates)

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('updateTask - ID:', id)
      console.log('updateTask - App Updates:', updates)
      console.log('updateTask - DB Updates:', dbUpdates)
    }

    const { data, error } = await supabase
      .from('task_reminders')
      .update(dbUpdates as any)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('updateTask - Error:', error)
      }
      throw error
    }
    return toApplicationTaskReminder(data)
  }

  static async completeTask(id: number): Promise<TaskReminder> {
    return this.updateTask(id, {
      status: 'completed',
      completed: true,
      completedAt: new Date().toISOString()
    })
  }

  static async reopenTask(id: number): Promise<TaskReminder> {
    return this.updateTask(id, {
      status: 'pending',
      completed: false,
      completedAt: null
    })
  }

  static async deleteTask(id: number): Promise<void> {
    const supabase = getTypedSupabaseClient()
    const { error } = await supabase.from('task_reminders').delete().eq('id', id)
    if (error) throw error
  }

  // Soil test operations
  static async getSoilTestRecords(farmId: number): Promise<SoilTestRecord[]> {
    const supabase = getTypedSupabaseClient()
    const { data, error } = await supabase
      .from('soil_test_records')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false })

    if (error) throw error
    return (data || []).map(toApplicationSoilTestRecord)
  }

  static async addSoilTestRecord(
    record: Omit<SoilTestRecord, 'id' | 'created_at'>
  ): Promise<SoilTestRecord> {
    const supabase = getTypedSupabaseClient()
    const dbRecord = toDatabaseSoilTestInsert(record)

    const { data, error } = await supabase
      .from('soil_test_records')
      .insert(dbRecord as any)
      .select()
      .single()

    if (error) throw error
    return toApplicationSoilTestRecord(data)
  }

  static async updateSoilTestRecord(
    id: number,
    updates: Partial<SoilTestRecord>
  ): Promise<SoilTestRecord> {
    const supabase = getTypedSupabaseClient()
    const dbUpdates = toDatabaseSoilTestUpdate(updates)

    const { data, error } = await supabase
      .from('soil_test_records')
      .update(dbUpdates as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return toApplicationSoilTestRecord(data)
  }

  static async deleteSoilTestRecord(id: number): Promise<void> {
    const supabase = getTypedSupabaseClient()
    const { error } = await supabase.from('soil_test_records').delete().eq('id', id)

    if (error) throw error
  }

  // Petiole test operations
  static async getPetioleTestRecords(farmId: number): Promise<PetioleTestRecord[]> {
    const supabase = getTypedSupabaseClient()
    const { data, error } = await supabase
      .from('petiole_test_records')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false })

    if (error) throw error
    return (data || []).map(toApplicationPetioleTestRecord)
  }

  static async addPetioleTestRecord(
    record: Omit<PetioleTestRecord, 'id' | 'created_at'>
  ): Promise<PetioleTestRecord> {
    const supabase = getTypedSupabaseClient()
    const dbRecord = toDatabasePetioleTestInsert(record)

    // Validate that at least one nutrient parameter is provided
    if (!dbRecord.parameters || Object.keys(dbRecord.parameters).length === 0) {
      throw new Error('At least one nutrient parameter must be provided for a petiole test record')
    }

    const { data, error } = await supabase
      .from('petiole_test_records')
      .insert(dbRecord as any)
      .select()
      .single()

    if (error) throw error
    return toApplicationPetioleTestRecord(data)
  }

  static async updatePetioleTestRecord(
    id: number,
    updates: Partial<PetioleTestRecord>
  ): Promise<PetioleTestRecord> {
    const supabase = getTypedSupabaseClient()
    const dbUpdates = toDatabasePetioleTestUpdate(updates)

    // If parameters are being updated, validate that at least one nutrient parameter is provided
    if (updates.parameters && Object.keys(updates.parameters).length === 0) {
      throw new Error('At least one nutrient parameter must be provided for a petiole test record')
    }

    const { data, error } = await supabase
      .from('petiole_test_records')
      .update(dbUpdates as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return toApplicationPetioleTestRecord(data)
  }

  static async deletePetioleTestRecord(id: number): Promise<void> {
    const supabase = getTypedSupabaseClient()
    const { error } = await supabase.from('petiole_test_records').delete().eq('id', id)

    if (error) throw error
  }

  // Export data functions
  static async exportFarmData(farmId: number) {
    const [farm, irrigation, sprays, harvests, expenses] = await Promise.all([
      this.getFarmById(farmId),
      this.getIrrigationRecords(farmId),
      this.getSprayRecords(farmId),
      this.getHarvestRecords(farmId),
      this.getExpenseRecords(farmId)
    ])

    return {
      farm,
      irrigation,
      sprays,
      harvests,
      expenses
    }
  }

  // Dashboard summary
  static async getDashboardSummary(farmId: number) {
    const [
      farm,
      pendingTasks,
      irrigationRecords,
      sprayRecords,
      fertigationRecords,
      harvestRecords,
      expenseRecords,
      soilTestRecords,
      petioleTestRecords,
      dailyNotes
    ] = await Promise.all([
      this.getFarmById(farmId),
      this.getPendingTasks(farmId),
      this.getIrrigationRecords(farmId),
      this.getSprayRecords(farmId),
      this.getFertigationRecords(farmId),
      this.getHarvestRecords(farmId),
      this.getExpenseRecords(farmId),
      this.getSoilTestRecords(farmId),
      this.getPetioleTestRecords(farmId),
      this.getDailyNotes(farmId)
    ])

    const totalHarvest = harvestRecords.reduce((sum, record) => sum + record.quantity, 0)

    // Calculate total historical water usage (duration × system_discharge)
    const totalWaterUsage = irrigationRecords.reduce((sum, record) => {
      const waterUsed = (record.duration || 0) * (record.system_discharge || 0)
      return sum + waterUsed
    }, 0)

    // Combine all activities for recent activities display
    const allActivities = [
      ...irrigationRecords.slice(0, 3).map((record) => ({ ...record, type: 'irrigation' })),
      ...sprayRecords.slice(0, 3).map((record) => ({ ...record, type: 'spray' })),
      ...fertigationRecords.slice(0, 3).map((record) => ({ ...record, type: 'fertigation' })),
      ...harvestRecords.slice(0, 3).map((record) => ({ ...record, type: 'harvest' })),
      ...expenseRecords.slice(0, 3).map((record) => ({ ...record, type: 'expense' })),
      ...soilTestRecords.slice(0, 3).map((record) => ({ ...record, type: 'soil_test' })),
      ...petioleTestRecords.slice(0, 3).map((record) => ({ ...record, type: 'petiole_test' })),
      ...dailyNotes.slice(0, 3).map((record) => ({ ...record, type: 'daily_note' }))
    ]
      .sort(
        (a, b) =>
          new Date(b.date || b.created_at || '').getTime() -
          new Date(a.date || a.created_at || '').getTime()
      )
      .slice(0, 10)

    return {
      farm,
      pendingTasksCount: pendingTasks.length,
      recentIrrigations: irrigationRecords.slice(0, 5), // Keep for backward compatibility
      recentActivities: allActivities, // New comprehensive activities list
      totalHarvest,
      totalWaterUsage, // Total historical water usage in liters
      pendingTasks: pendingTasks.slice(0, 3), // Show top 3 pending tasks
      recordCounts: {
        irrigation: irrigationRecords.length,
        spray: sprayRecords.length,
        fertigation: fertigationRecords.length,
        harvest: harvestRecords.length,
        expense: expenseRecords.length,
        soilTest: soilTestRecords.length,
        petioleTest: petioleTestRecords.length,
        dailyNotes: dailyNotes.length
      }
    }
  }

  // Authentication helper functions
  static async getCurrentUser() {
    const supabase = getTypedSupabaseClient()
    const {
      data: { user },
      error
    } = await supabase.auth.getUser()
    if (error) throw error
    return user
  }

  static async signUp(email: string, password: string) {
    const supabase = getTypedSupabaseClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    if (error) throw error
    return data
  }

  static async signIn(email: string, password: string) {
    const supabase = getTypedSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  }

  static async signOut() {
    const supabase = getTypedSupabaseClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  // Unified deletion helper
  static async deleteLogByType(logType: string, logId: number): Promise<void> {
    switch (logType) {
      case 'irrigation':
        await this.deleteIrrigationRecord(logId)
        break
      case 'spray':
        await this.deleteSprayRecord(logId)
        break
      case 'fertigation':
        await this.deleteFertigationRecord(logId)
        break
      case 'harvest':
        await this.deleteHarvestRecord(logId)
        break
      case 'expense':
        await this.deleteExpenseRecord(logId)
        break
      case 'soil_test':
        await this.deleteSoilTestRecord(logId)
        break
      case 'petiole_test':
        await this.deletePetioleTestRecord(logId)
        break
      case 'daily_note':
        await this.deleteDailyNote(logId)
        break
      default:
        throw new Error(`Unknown log type: ${logType}`)
    }
  }

  // Real-time subscriptions
  static subscribeToFarmChanges(farmId: number, callback: (payload: any) => void) {
    const supabase = getTypedSupabaseClient()
    return supabase
      .channel(`farm-${farmId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'farms',
          filter: `id=eq.${farmId}`
        },
        callback
      )
      .subscribe()
  }

  static subscribeToTaskChanges(farmId: number, callback: (payload: any) => void) {
    const supabase = getTypedSupabaseClient()
    return supabase
      .channel(`tasks-${farmId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_reminders',
          filter: `farm_id=eq.${farmId}`
        },
        callback
      )
      .subscribe()
  }
}
