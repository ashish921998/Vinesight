import { getSupabaseClient, type Farm } from './supabase';
import { DatabaseService } from './db-utils';
import type { Farm as LocalFarm } from './database';

/**
 * Hybrid Data Service - Uses Supabase when authenticated, falls back to local IndexedDB
 * This provides a seamless experience whether online/offline or authenticated/guest
 */
export class HybridDataService {
  
  // Farm operations with hybrid fallback
  static async getAllFarms(): Promise<Farm[]> {
    try {
      // Try Supabase first if user is authenticated
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        console.log('Fetching farms from Supabase for authenticated user');
        const { data, error } = await supabase
          .from('farms')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          // Sync to local storage for offline access
          await this.syncFarmsToLocal(data);
          return data;
        }
        
        console.warn('Supabase farms fetch failed, falling back to local:', error);
      }
      
      // Fall back to local IndexedDB
      console.log('Using local IndexedDB farms');
      const localFarms = await DatabaseService.getAllFarms();
      
      // If no local farms exist, create demo data for MVP
      if (localFarms.length === 0) {
        const demoFarms = await this.createDemoFarms();
        return demoFarms;
      }
      
      // Convert local farms to Supabase format
      return localFarms.map(this.convertLocalToSupabase);
      
    } catch (error) {
      console.error('Error in getAllFarms, falling back to local:', error);
      
      // Final fallback to local data
      try {
        const localFarms = await DatabaseService.getAllFarms();
        if (localFarms.length === 0) {
          return await this.createDemoFarms();
        }
        return localFarms.map(this.convertLocalToSupabase);
      } catch (localError) {
        console.error('Local farms fetch also failed:', localError);
        return await this.createDemoFarms();
      }
    }
  }

  static async getFarmById(id: number): Promise<Farm | null> {
    try {
      // Try Supabase first if authenticated
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('farms')
          .select('*')
          .eq('id', id)
          .single();
          
        if (!error && data) return data;
      }
      
      // Fall back to local
      const localFarm = await DatabaseService.getFarmById(id);
      return localFarm ? this.convertLocalToSupabase(localFarm) : null;
    } catch (error) {
      console.error('Error getting farm by ID:', error);
      const localFarm = await DatabaseService.getFarmById(id);
      return localFarm ? this.convertLocalToSupabase(localFarm) : null;
    }
  }

  static async createFarm(farmData: Omit<Farm, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Farm> {
    try {
      // Try Supabase first if authenticated
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await (supabase as any)
          .from('farms')
          .insert(farmData)
          .select()
          .single();
          
        if (!error && data) {
          // Also save to local for offline access
          await DatabaseService.createFarm(this.convertSupabaseToLocal(data));
          return data;
        }
        
        console.warn('Supabase create failed, using local:', error);
      }
      
      // Fall back to local creation
      const localFarmData = this.convertSupabaseToLocal({
        ...farmData,
        id: Date.now(), // Generate local ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: undefined
      });
      
      const farmId = await DatabaseService.createFarm(localFarmData);
      const createdFarm = await DatabaseService.getFarmById(farmId);
      
      return this.convertLocalToSupabase(createdFarm!);
      
    } catch (error) {
      console.error('Error creating farm:', error);
      throw error;
    }
  }

  static async updateFarm(id: number, farmData: Partial<Farm>): Promise<Farm> {
    try {
      // Try Supabase first if authenticated
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await (supabase as any)
          .from('farms')
          .update(farmData)
          .eq('id', id)
          .select()
          .single();
          
        if (!error && data) {
          // Update local copy
          await DatabaseService.updateFarm(id, this.convertSupabaseToLocal(data));
          return data;
        }
      }
      
      // Fall back to local update
      const localFarmData = this.convertSupabaseToLocal(farmData);
      await DatabaseService.updateFarm(id, localFarmData);
      const updatedFarm = await DatabaseService.getFarmById(id);
      return this.convertLocalToSupabase(updatedFarm!);
      
    } catch (error) {
      console.error('Error updating farm:', error);
      throw error;
    }
  }

  static async deleteFarm(id: number): Promise<void> {
    try {
      // Try Supabase first if authenticated
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('farms')
          .delete()
          .eq('id', id);
          
        if (!error) {
          // Also delete from local
          await DatabaseService.deleteFarm(id);
          return;
        }
      }
      
      // Fall back to local delete
      await DatabaseService.deleteFarm(id);
      
    } catch (error) {
      console.error('Error deleting farm:', error);
      throw error;
    }
  }

  // Sync Supabase farms to local storage
  private static async syncFarmsToLocal(farms: Farm[]): Promise<void> {
    try {
      // Clear local farms and replace with Supabase data
      const localFarms = await DatabaseService.getAllFarms();
      
      // Delete local farms that don't exist in Supabase
      for (const localFarm of localFarms) {
        if (!farms.find(f => f.id === localFarm.id)) {
          await DatabaseService.deleteFarm(localFarm.id!);
        }
      }
      
      // Add or update farms from Supabase
      for (const farm of farms) {
        const existingLocal = localFarms.find(f => f.id === farm.id);
        if (existingLocal) {
          await DatabaseService.updateFarm(farm.id!, this.convertSupabaseToLocal(farm));
        } else {
          await DatabaseService.createFarm(this.convertSupabaseToLocal(farm));
        }
      }
    } catch (error) {
      console.error('Error syncing farms to local:', error);
    }
  }

  // Create demo farms for MVP testing
  private static async createDemoFarms(): Promise<Farm[]> {
    const demoFarms = [
      {
        id: 1,
        name: "Test Vineyard",
        region: "Maharashtra", 
        area: 5,
        grape_variety: "Thompson Seedless",
        planting_date: "2020-01-15",
        vine_spacing: 2.5,
        row_spacing: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: undefined
      },
      {
        id: 2,
        name: "Nashik Vineyard Main",
        region: "Maharashtra",
        area: 2.5,
        grape_variety: "Cabernet Sauvignon", 
        planting_date: "2019-03-20",
        vine_spacing: 2,
        row_spacing: 2.5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: undefined
      },
      {
        id: 3,
        name: "Pune Valley Farm",
        region: "Maharashtra",
        area: 1.8,
        grape_variety: "Shiraz",
        planting_date: "2021-02-10", 
        vine_spacing: 2.2,
        row_spacing: 2.8,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: undefined
      }
    ];

    try {
      // Add demo farms to local storage
      const createdFarms: Farm[] = [];
      for (const farm of demoFarms) {
        await DatabaseService.createFarm(this.convertSupabaseToLocal(farm));
        createdFarms.push(farm);
      }
      
      console.log('Created demo farms for MVP');
      return createdFarms;
    } catch (error) {
      console.error('Error creating demo farms:', error);
      return demoFarms; // Return even if storage fails
    }
  }

  // Check if user is authenticated and online
  static async isOnlineAndAuthenticated(): Promise<boolean> {
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      return !!user && navigator.onLine;
    } catch {
      return false;
    }
  }

  // Get sync status for UI display
  static async getSyncStatus(): Promise<{
    isAuthenticated: boolean;
    isOnline: boolean;
    lastSync: Date | null;
    pendingChanges: number;
  }> {
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      return {
        isAuthenticated: !!user,
        isOnline: navigator.onLine,
        lastSync: null, // TODO: Implement sync tracking
        pendingChanges: 0 // TODO: Implement change tracking
      };
    } catch {
      return {
        isAuthenticated: false,
        isOnline: navigator.onLine,
        lastSync: null,
        pendingChanges: 0
      };
    }
  }

  // Conversion methods between local and Supabase Farm formats
  private static convertLocalToSupabase(localFarm: LocalFarm): Farm {
    return {
      id: localFarm.id,
      name: localFarm.name,
      region: localFarm.region,
      area: localFarm.area,
      grape_variety: localFarm.grapeVariety,
      planting_date: localFarm.plantingDate,
      vine_spacing: localFarm.vineSpacing,
      row_spacing: localFarm.rowSpacing,
      created_at: localFarm.createdAt.toISOString(),
      updated_at: localFarm.updatedAt.toISOString(),
      user_id: undefined,
      latitude: undefined,
      longitude: undefined
    };
  }

  private static convertSupabaseToLocal(supabaseFarm: Partial<Farm>): Omit<LocalFarm, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: supabaseFarm.name || '',
      region: supabaseFarm.region || '',
      area: supabaseFarm.area || 0,
      grapeVariety: supabaseFarm.grape_variety || '',
      plantingDate: supabaseFarm.planting_date || '',
      vineSpacing: supabaseFarm.vine_spacing || 0,
      rowSpacing: supabaseFarm.row_spacing || 0
    };
  }
}