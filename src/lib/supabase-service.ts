import { 
  getUntypedSupabaseClient, 
  type Farm,
  type IrrigationRecord,
  type SprayRecord,
  type FertigationRecord,
  type HarvestRecord,
  type ExpenseRecord,
  type CalculationHistory,
  type TaskReminder,
  type SoilTestRecord
} from './supabase';

export class SupabaseService {
  // Farm operations
  static async getAllFarms(): Promise<Farm[]> {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getFarmById(id: number): Promise<Farm | null> {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  static async createFarm(farm: Omit<Farm, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Farm> {
    const supabase = getUntypedSupabaseClient();
    
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User must be authenticated to create a farm');
    
    // Include the user_id in the farm data
    const farmWithUser = {
      ...farm,
      user_id: user.id
    };
    
    console.log('Creating farm with data:', farmWithUser);
    
    const { data, error } = await supabase
      .from('farms')
      .insert([farmWithUser])
      .select()
      .single();

    if (error) {
      console.error('Farm creation error:', error);
      throw error;
    }
    return data;
  }

  static async updateFarm(id: number, updates: Partial<Farm>): Promise<Farm> {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase
      .from('farms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteFarm(id: number): Promise<void> {
    const supabase = getUntypedSupabaseClient();
    const { error } = await supabase
      .from('farms')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Irrigation operations
  static async getIrrigationRecords(farmId: number, limit?: number): Promise<IrrigationRecord[]> {
    const supabase = getUntypedSupabaseClient();
    let query = supabase
      .from('irrigation_records')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async addIrrigationRecord(record: Omit<IrrigationRecord, 'id' | 'created_at'>): Promise<IrrigationRecord> {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase
      .from('irrigation_records')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateIrrigationRecord(id: number, updates: Partial<IrrigationRecord>): Promise<IrrigationRecord> {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase
      .from('irrigation_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteIrrigationRecord(id: number): Promise<void> {
    const supabase = getUntypedSupabaseClient();
    const { error } = await supabase
      .from('irrigation_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Spray operations
  static async getSprayRecords(farmId: number): Promise<SprayRecord[]> {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase
      .from('spray_records')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async addSprayRecord(record: Omit<SprayRecord, 'id' | 'created_at'>): Promise<SprayRecord> {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase
      .from('spray_records')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateSprayRecord(id: number, updates: Partial<SprayRecord>): Promise<SprayRecord> {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase
      .from('spray_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteSprayRecord(id: number): Promise<void> {
    const supabase = getUntypedSupabaseClient();
    const { error } = await supabase
      .from('spray_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Fertigation operations
  static async getFertigationRecords(farmId: number): Promise<FertigationRecord[]> {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase
      .from('fertigation_records')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async addFertigationRecord(record: Omit<FertigationRecord, 'id' | 'created_at'>): Promise<FertigationRecord> {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase
      .from('fertigation_records')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateFertigationRecord(id: number, updates: Partial<FertigationRecord>): Promise<FertigationRecord> {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase
      .from('fertigation_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Harvest operations
  static async getHarvestRecords(farmId: number): Promise<HarvestRecord[]> {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase
      .from('harvest_records')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async addHarvestRecord(record: Omit<HarvestRecord, 'id' | 'created_at'>): Promise<HarvestRecord> {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase
      .from('harvest_records')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateHarvestRecord(id: number, updates: Partial<HarvestRecord>): Promise<HarvestRecord> {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase
      .from('harvest_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteHarvestRecord(id: number): Promise<void> {
    const supabase = getUntypedSupabaseClient();
    const { error } = await supabase
      .from('harvest_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Expense operations
  static async getExpenseRecords(farmId: number): Promise<ExpenseRecord[]> {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase
      .from('expense_records')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async addExpenseRecord(record: Omit<ExpenseRecord, 'id' | 'created_at'>): Promise<ExpenseRecord> {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase
      .from('expense_records')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateExpenseRecord(id: number, updates: Partial<ExpenseRecord>): Promise<ExpenseRecord> {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase
      .from('expense_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Calculation history operations
  static async getCalculationHistory(farmId: number): Promise<CalculationHistory[]> {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase
      .from('calculation_history')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async addCalculationHistory(record: Omit<CalculationHistory, 'id' | 'created_at'>): Promise<CalculationHistory> {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase
      .from('calculation_history')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Task and reminder operations
  static async getTaskReminders(farmId: number): Promise<TaskReminder[]> {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase
      .from('task_reminders')
      .select('*')
      .eq('farm_id', farmId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getPendingTasks(farmId: number): Promise<TaskReminder[]> {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase
      .from('task_reminders')
      .select('*')
      .eq('farm_id', farmId)
      .eq('completed', false)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async addTaskReminder(task: Omit<TaskReminder, 'id' | 'created_at'>): Promise<TaskReminder> {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase
      .from('task_reminders')
      .insert([task])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async completeTask(id: number): Promise<TaskReminder> {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase
      .from('task_reminders')
      .update({
        completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Soil test operations
  static async getSoilTestRecords(farmId: number): Promise<SoilTestRecord[]> {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase
      .from('soil_test_records')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async addSoilTestRecord(record: Omit<SoilTestRecord, 'id' | 'created_at'>): Promise<SoilTestRecord> {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase
      .from('soil_test_records')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateSoilTestRecord(id: number, updates: Partial<SoilTestRecord>): Promise<SoilTestRecord> {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase
      .from('soil_test_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Export data functions
  static async exportFarmData(farmId: number) {
    const [farm, irrigation, sprays, harvests, expenses] = await Promise.all([
      this.getFarmById(farmId),
      this.getIrrigationRecords(farmId),
      this.getSprayRecords(farmId),
      this.getHarvestRecords(farmId),
      this.getExpenseRecords(farmId)
    ]);

    return {
      farm,
      irrigation,
      sprays,
      harvests,
      expenses
    };
  }

  // Dashboard summary
  static async getDashboardSummary(farmId: number) {
    const [farm, pendingTasks, irrigationRecords, sprayRecords, fertigationRecords, harvestRecords, expenseRecords, soilTestRecords] = await Promise.all([
      this.getFarmById(farmId),
      this.getPendingTasks(farmId),
      this.getIrrigationRecords(farmId),
      this.getSprayRecords(farmId),
      this.getFertigationRecords(farmId),
      this.getHarvestRecords(farmId),
      this.getExpenseRecords(farmId),
      this.getSoilTestRecords(farmId)
    ]);

    const totalHarvest = harvestRecords.reduce((sum, record) => sum + record.quantity, 0);
    
    // Calculate total historical water usage (duration × system_discharge)
    const totalWaterUsage = irrigationRecords.reduce((sum, record) => {
      const waterUsed = (record.duration || 0) * (record.system_discharge || 0);
      return sum + waterUsed;
    }, 0);
    
    // Combine all activities for recent activities display
    const allActivities = [
      ...irrigationRecords.slice(0, 3).map(record => ({ ...record, type: 'irrigation' })),
      ...sprayRecords.slice(0, 3).map(record => ({ ...record, type: 'spray' })),
      ...fertigationRecords.slice(0, 3).map(record => ({ ...record, type: 'fertigation' })),
      ...harvestRecords.slice(0, 3).map(record => ({ ...record, type: 'harvest' })),
      ...expenseRecords.slice(0, 3).map(record => ({ ...record, type: 'expense' })),
      ...soilTestRecords.slice(0, 3).map(record => ({ ...record, type: 'soil_test' }))
    ].sort((a, b) => new Date(b.date || b.created_at || '').getTime() - new Date(a.date || a.created_at || '').getTime()).slice(0, 10);

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
        soilTest: soilTestRecords.length
      }
    };
  }

  // Authentication helper functions
  static async getCurrentUser() {
    const supabase = getUntypedSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  static async signUp(email: string, password: string) {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  static async signIn(email: string, password: string) {
    const supabase = getUntypedSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  static async signOut() {
    const supabase = getUntypedSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Real-time subscriptions
  static subscribeToFarmChanges(farmId: number, callback: (payload: any) => void) {
    const supabase = getUntypedSupabaseClient();
    return supabase
      .channel(`farm-${farmId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'farms',
          filter: `id=eq.${farmId}`,
        },
        callback
      )
      .subscribe();
  }

  static subscribeToTaskChanges(farmId: number, callback: (payload: any) => void) {
    const supabase = getUntypedSupabaseClient();
    return supabase
      .channel(`tasks-${farmId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_reminders',
          filter: `farm_id=eq.${farmId}`,
        },
        callback
      )
      .subscribe();
  }
}