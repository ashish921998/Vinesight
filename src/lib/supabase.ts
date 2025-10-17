import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import type { Task, TaskPriority, TaskStatus } from '@/types/types'

// Client-side Supabase client for React components
export const createClient = () =>
  createBrowserClient<Database>(
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

export interface IrrigationRecord {
  id?: number
  farm_id: number
  date: string
  duration: number // in hours
  area: number // area irrigated in acres
  growth_stage: string
  moisture_status: string
  system_discharge: number // in liters per hour
  notes?: string
  created_at?: string
}

export interface SprayRecord {
  id?: number
  farm_id: number
  date: string
  chemical: string
  dose: string
  quantity_amount: number
  quantity_unit: string // 'gm/L' or 'ml/L'
  water_volume: number // total water volume in liters
  area: number // in acres
  weather: string
  operator: string
  notes?: string
  created_at?: string
}

export interface FertigationRecord {
  id?: number
  farm_id: number
  date: string
  fertilizer: string
  dose: string
  purpose: string
  area: number // in acres
  notes?: string
  created_at?: string
}

export interface HarvestRecord {
  id?: number
  farm_id: number
  date: string
  quantity: number // in kg
  grade: string
  price?: number // per kg
  buyer?: string
  notes?: string
  created_at?: string
}

export interface ExpenseRecord {
  id?: number
  farm_id: number
  date: string
  type: 'labor' | 'materials' | 'equipment' | 'other'
  description: string
  cost: number
  remarks?: string
  created_at?: string
}

export interface CalculationHistory {
  id?: number
  farm_id: number
  calculation_type: 'etc' | 'nutrients' | 'lai' | 'discharge'
  inputs: Record<string, any>
  outputs: Record<string, any>
  date: string
  created_at?: string
}

export type { Task, TaskPriority, TaskStatus }

export interface SoilTestRecord {
  id?: number
  farm_id: number
  date: string
  parameters: Record<string, number> // pH, N, P, K, etc.
  recommendations?: string
  notes?: string
  report_url?: string | null
  report_storage_path?: string | null
  report_filename?: string | null
  report_type?: string | null
  extraction_status?: 'pending' | 'success' | 'failed' | null
  extraction_error?: string | null
  parsed_parameters?: Record<string, number> | null
  raw_notes?: string | null
  created_at?: string
}

export interface PetioleTestRecord {
  id?: number
  farm_id: number
  date: string
  sample_id?: string
  parameters?: Record<string, number>
  recommendations?: string
  notes?: string
  report_url?: string | null
  report_storage_path?: string | null
  report_filename?: string | null
  report_type?: string | null
  extraction_status?: 'pending' | 'success' | 'failed' | null
  extraction_error?: string | null
  parsed_parameters?: Record<string, number> | null
  raw_notes?: string | null
  created_at?: string
}
