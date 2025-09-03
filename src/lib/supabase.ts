import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

// Client-side Supabase client for React components
export const createClient = () => createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Helper function for backward compatibility
export function getSupabaseClient() {
  return createClient()
}

// Properly typed client for service operations
export function getTypedSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// For backward compatibility
export const supabase = getSupabaseClient()

// Database types based on your existing schema
export interface Farm {
  id?: number;
  name: string;
  region: string;
  area: number; // in acres
  grape_variety: string;
  planting_date: string;
  vine_spacing: number; // in meters
  row_spacing: number; // in meters
  total_tank_capacity?: number; // in liters
  system_discharge?: number; // in liters per hour (farm-level default)
  remaining_water?: number; // in mm (calculated value)
  water_calculation_updated_at?: string; // when water calculation was last done
  latitude?: number; // coordinates (decimal degrees)
  longitude?: number; // coordinates (decimal degrees)
  elevation?: number; // meters above sea level
  location_name?: string; // human readable location name
  timezone?: string; // timezone identifier
  location_source?: 'manual' | 'search' | 'current'; // how location was set
  location_updated_at?: string; // when location was last updated
  created_at?: string;
  updated_at?: string;
  user_id?: string; // For multi-user support
}

export interface IrrigationRecord {
  id?: number;
  farm_id: number;
  date: string;
  duration: number; // in hours
  area: number; // area irrigated in acres
  growth_stage: string;
  moisture_status: string;
  system_discharge: number; // in liters per hour
  notes?: string;
  created_at?: string;
}

export interface SprayRecord {
  id?: number;
  farm_id: number;
  date: string;
  pest_disease: string;
  chemical: string;
  dose: string;
  area: number; // in acres
  weather: string;
  operator: string;
  notes?: string;
  created_at?: string;
}

export interface FertigationRecord {
  id?: number;
  farm_id: number;
  date: string;
  fertilizer: string;
  dose: string;
  purpose: string;
  area: number; // in acres
  notes?: string;
  created_at?: string;
}

export interface HarvestRecord {
  id?: number;
  farm_id: number;
  date: string;
  quantity: number; // in kg
  grade: string;
  price?: number; // per kg
  buyer?: string;
  notes?: string;
  created_at?: string;
}

export interface ExpenseRecord {
  id?: number;
  farm_id: number;
  date: string;
  type: 'labor' | 'materials' | 'equipment' | 'other';
  description: string;
  cost: number;
  remarks?: string;
  created_at?: string;
}

export interface CalculationHistory {
  id?: number;
  farm_id: number;
  calculation_type: 'etc' | 'nutrients' | 'lai' | 'discharge';
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  date: string;
  created_at?: string;
}

export interface TaskReminder {
  id?: number;
  farm_id: number;
  title: string;
  description?: string;
  due_date: string;
  type: 'irrigation' | 'spray' | 'fertigation' | 'training' | 'harvest' | 'other';
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  created_at?: string;
  completed_at?: string;
}

export interface SoilTestRecord {
  id?: number;
  farm_id: number;
  date: string;
  parameters: Record<string, number>; // pH, N, P, K, etc.
  recommendations?: string;
  notes?: string;
  created_at?: string;
}