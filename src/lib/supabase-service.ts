import {
  getTypedSupabaseClient,
  type IrrigationRecord,
  type SprayRecord,
  type FertigationRecord,
  type HarvestRecord,
  type ExpenseRecord,
  type CalculationHistory,
  type SoilTestRecord,
  type PetioleTestRecord
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
  toApplicationSoilTestRecord,
  toDatabaseSoilTestInsert,
  toDatabaseSoilTestUpdate,
  toApplicationPetioleTestRecord,
  toDatabasePetioleTestInsert,
  toDatabasePetioleTestUpdate
} from './supabase-types'

export class SupabaseService {
  // Farm operations
  static async getAllFarms(): Promise<Farm[]> {
    const supabase = getTypedSupabaseClient()
    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
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

    const { data: records, error: fetchError } = await supabase
      .from('irrigation_records')
      .select('*')
      .eq('id', id)
      .limit(1)

    if (fetchError) throw fetchError

    const record = records?.[0]

    const { error } = await supabase.from('irrigation_records').delete().eq('id', id)

    if (error) throw error

    if (!record?.farm_id) {
      return
    }

    const farm = await this.getFarmById(record.farm_id)

    if (!farm) {
      return
    }

    const duration = Number(record.duration ?? 0)
    const rawSystemDischarge = record.system_discharge ?? farm.systemDischarge ?? 0
    const systemDischarge = Number(rawSystemDischarge)

    if (!Number.isFinite(duration) || !Number.isFinite(systemDischarge)) {
      return
    }

    const waterContribution = duration * systemDischarge

    if (waterContribution === 0) {
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
    const dbRecord = toDatabaseFertigationInsert(record)

    const { data, error } = await supabase
      .from('fertigation_records')
      .insert(dbRecord as any)
      .select()
      .single()

    if (error) throw error
    return toApplicationFertigationRecord(data)
  }

  static async updateFertigationRecord(
    id: number,
    updates: Partial<FertigationRecord>
  ): Promise<FertigationRecord> {
    const supabase = getTypedSupabaseClient()
    const dbUpdates = toDatabaseFertigationUpdate(updates)

    const { data, error } = await supabase
      .from('fertigation_records')
      .update(dbUpdates as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
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

  // Task and reminder operations
  static async getTaskReminders(farmId: number): Promise<TaskReminder[]> {
    const supabase = getTypedSupabaseClient()
    const { data, error } = await supabase
      .from('task_reminders')
      .select('*')
      .eq('farm_id', farmId)
      .order('due_date', { ascending: true })

    if (error) throw error
    return (data || []).map(toApplicationTaskReminder)
  }

  static async getPendingTasks(farmId: number): Promise<TaskReminder[]> {
    const supabase = getTypedSupabaseClient()
    const { data, error } = await supabase
      .from('task_reminders')
      .select('*')
      .eq('farm_id', farmId)
      .eq('completed', false)
      .order('due_date', { ascending: true })

    if (error) throw error
    return (data || []).map(toApplicationTaskReminder)
  }

  static async addTaskReminder(
    task: Omit<TaskReminder, 'id' | 'createdAt'>
  ): Promise<TaskReminder> {
    const supabase = getTypedSupabaseClient()
    const dbTask = toDatabaseTaskReminderInsert(task)

    const { data, error } = await supabase
      .from('task_reminders')
      .insert(dbTask as any)
      .select()
      .single()

    if (error) throw error
    return toApplicationTaskReminder(data)
  }

  static async completeTask(id: number): Promise<TaskReminder> {
    const supabase = getTypedSupabaseClient()
    const dbUpdates = toDatabaseTaskReminderUpdate({
      completed: true,
      completedAt: new Date().toISOString()
    })

    const { data, error } = await supabase
      .from('task_reminders')
      .update(dbUpdates as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return toApplicationTaskReminder(data)
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
      petioleTestRecords
    ] = await Promise.all([
      this.getFarmById(farmId),
      this.getPendingTasks(farmId),
      this.getIrrigationRecords(farmId),
      this.getSprayRecords(farmId),
      this.getFertigationRecords(farmId),
      this.getHarvestRecords(farmId),
      this.getExpenseRecords(farmId),
      this.getSoilTestRecords(farmId),
      this.getPetioleTestRecords(farmId)
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
      ...petioleTestRecords.slice(0, 3).map((record) => ({ ...record, type: 'petiole_test' }))
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
        petioleTest: petioleTestRecords.length
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
