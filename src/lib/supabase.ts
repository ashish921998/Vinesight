import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import type { Task, TaskPriority, TaskStatus } from '@/types/types'

// Client-side Supabase client for React components
const isInvalidEnvValue = (value?: string | null) =>
  !value || value === 'undefined' || value === 'null'

let cachedClient: SupabaseClient<Database> | null = null
let cachedTypedClient: SupabaseClient<Database> | null = null

const getSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (isInvalidEnvValue(url) || isInvalidEnvValue(anonKey)) {
    throw new Error('Supabase client is not configured. Missing URL or anon key.')
  }

  return { url: url as string, anonKey: anonKey as string }
}

export const createClient = () => {
  const { url, anonKey } = getSupabaseConfig()
  return createBrowserClient<Database>(url, anonKey)
}

// Helper function for backward compatibility
export function getSupabaseClient() {
  if (!cachedClient) {
    cachedClient = createClient()
  }
  return cachedClient
}

// Properly typed client for service operations
export function getTypedSupabaseClient() {
  if (!cachedTypedClient) {
    const { url, anonKey } = getSupabaseConfig()
    cachedTypedClient = createBrowserClient<Database>(url, anonKey)
  }
  return cachedTypedClient
}

// Lazily evaluated supabase client for backward compatibility
// Ensures build-time environments without Supabase config do not crash
const supabaseProxyHandler: ProxyHandler<SupabaseClient<Database>> = {
  get(_target, property) {
    const client = getSupabaseClient()
    const value = (client as any)[property]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
}

export const supabase = new Proxy(
  {} as SupabaseClient<Database>,
  supabaseProxyHandler
) as SupabaseClient<Database>

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
