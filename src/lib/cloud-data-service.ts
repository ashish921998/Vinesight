import { getSupabaseClient, type Farm } from './supabase';

/**
 * Cloud Data Service - Pure Supabase integration for online-only app
 * All operations require authentication and internet connection
 */
export class CloudDataService {
  
  // Farm operations with cloud-only storage
  static async getAllFarms(): Promise<Farm[]> {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch farms: ${error.message}`);
    }

    return data || [];
  }

  static async createFarm(farmData: Omit<Farm, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Farm> {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Authentication required');
    }

    const { data, error } = await (supabase as any)
      .from('farms')
      .insert({ ...farmData, user_id: user.id })
      .select()
      .single();
      
    if (error) {
      throw new Error(`Failed to create farm: ${error.message}`);
    }

    return data;
  }

  static async updateFarm(id: number, farmData: Partial<Farm>): Promise<Farm> {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Authentication required');
    }

    const { data, error } = await (supabase as any)
      .from('farms')
      .update(farmData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
      
    if (error) {
      throw new Error(`Failed to update farm: ${error.message}`);
    }

    return data;
  }

  static async deleteFarm(id: number): Promise<void> {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Authentication required');
    }

    const { error } = await supabase
      .from('farms')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
      
    if (error) {
      throw new Error(`Failed to delete farm: ${error.message}`);
    }
  }

  static async getFarm(id: number): Promise<Farm | null> {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch farm: ${error.message}`);
    }

    return data;
  }
}