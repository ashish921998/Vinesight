import { supabase } from './supabase';
import type {
  Farm,
  IrrigationRecord,
  SprayRecord,
  FertigationRecord,
  HarvestRecord,
  ExpenseRecord,
  CalculationHistory,
  TaskReminder,
  SoilTestRecord
} from './supabase';

export class SupabaseService {
  // Farm operations
  static async getAllFarms(): Promise<Farm[]> {
    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getFarmById(id: number): Promise<Farm | null> {
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
    const { data, error } = await supabase
      .from('farms')
      .insert([farm])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateFarm(id: number, updates: Partial<Farm>): Promise<Farm> {
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
    const { error } = await supabase
      .from('farms')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Irrigation operations
  static async getIrrigationRecords(farmId: number): Promise<IrrigationRecord[]> {
    const { data, error } = await supabase
      .from('irrigation_records')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async addIrrigationRecord(record: Omit<IrrigationRecord, 'id' | 'created_at'>): Promise<IrrigationRecord> {
    const { data, error } = await supabase
      .from('irrigation_records')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Spray operations
  static async getSprayRecords(farmId: number): Promise<SprayRecord[]> {
    const { data, error } = await supabase
      .from('spray_records')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async addSprayRecord(record: Omit<SprayRecord, 'id' | 'created_at'>): Promise<SprayRecord> {
    const { data, error } = await supabase
      .from('spray_records')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Fertigation operations
  static async getFertigationRecords(farmId: number): Promise<FertigationRecord[]> {
    const { data, error } = await supabase
      .from('fertigation_records')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async addFertigationRecord(record: Omit<FertigationRecord, 'id' | 'created_at'>): Promise<FertigationRecord> {
    const { data, error } = await supabase
      .from('fertigation_records')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Harvest operations
  static async getHarvestRecords(farmId: number): Promise<HarvestRecord[]> {
    const { data, error } = await supabase
      .from('harvest_records')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async addHarvestRecord(record: Omit<HarvestRecord, 'id' | 'created_at'>): Promise<HarvestRecord> {
    const { data, error } = await supabase
      .from('harvest_records')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Expense operations
  static async getExpenseRecords(farmId: number): Promise<ExpenseRecord[]> {
    const { data, error } = await supabase
      .from('expense_records')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async addExpenseRecord(record: Omit<ExpenseRecord, 'id' | 'created_at'>): Promise<ExpenseRecord> {
    const { data, error } = await supabase
      .from('expense_records')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Calculation history operations
  static async getCalculationHistory(farmId: number): Promise<CalculationHistory[]> {
    const { data, error } = await supabase
      .from('calculation_history')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async addCalculationHistory(record: Omit<CalculationHistory, 'id' | 'created_at'>): Promise<CalculationHistory> {
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
    const { data, error } = await supabase
      .from('task_reminders')
      .select('*')
      .eq('farm_id', farmId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getPendingTasks(farmId: number): Promise<TaskReminder[]> {
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
    const { data, error } = await supabase
      .from('task_reminders')
      .insert([task])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async completeTask(id: number): Promise<TaskReminder> {
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
    const { data, error } = await supabase
      .from('soil_test_records')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async addSoilTestRecord(record: Omit<SoilTestRecord, 'id' | 'created_at'>): Promise<SoilTestRecord> {
    const { data, error } = await supabase
      .from('soil_test_records')
      .insert([record])
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
    const [farm, pendingTasks, recentIrrigations, harvestRecords] = await Promise.all([
      this.getFarmById(farmId),
      this.getPendingTasks(farmId),
      supabase
        .from('irrigation_records')
        .select('*')
        .eq('farm_id', farmId)
        .order('date', { ascending: false })
        .limit(5),
      this.getHarvestRecords(farmId)
    ]);

    const totalHarvest = harvestRecords.reduce((sum, record) => sum + record.quantity, 0);

    return {
      farm,
      pendingTasksCount: pendingTasks.length,
      recentIrrigations: recentIrrigations.data || [],
      totalHarvest,
      pendingTasks: pendingTasks.slice(0, 3) // Show top 3 pending tasks
    };
  }

  // Authentication helper functions
  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  static async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Real-time subscriptions
  static subscribeToFarmChanges(farmId: number, callback: (payload: any) => void) {
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