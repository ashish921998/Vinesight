import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing required Supabase environment variables in production')
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Supabase environment variables not configured. Some features may not work.')
    console.warn('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
}

// Only create client with valid configuration
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Helper function to ensure supabase client is available
export function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Check environment variables.')
  }
  return supabase
}

// Database types based on your existing schema
export interface Farm {
  id?: number;
  name: string;
  region: string;
  area: number; // in hectares
  grape_variety: string;
  planting_date: string;
  vine_spacing: number; // in meters
  row_spacing: number; // in meters
  latitude?: number; // coordinates
  longitude?: number; // coordinates
  created_at?: string;
  updated_at?: string;
  user_id?: string; // For multi-user support
}

export interface IrrigationRecord {
  id?: number;
  farm_id: number;
  date: string;
  duration: number; // in hours
  area: number; // area irrigated in hectares
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
  area: number; // in hectares
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
  area: number; // in hectares
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