import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

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
  date_of_pruning?: Date // Date object of pruning when this record was created (snapshot from farm level)
  notes?: string
  created_at?: string
}

// Chemical object type for chemicals array
export interface SprayChemical {
  id?: string // Optional ID for frontend tracking
  name: string
  quantity: number
  unit: 'gm/L' | 'ml/L' | 'ppm' | 'kg/Acre' | 'liter/Acre'
  warehouseItemId?: number
}

// Fertilizer object type for fertilizers array
export interface Fertilizer {
  id?: string // Optional ID for frontend tracking
  name: string
  quantity: number
  unit: 'kg/acre' | 'liter/acre'
  warehouseItemId?: number
}

export interface SprayRecord {
  id?: number
  farm_id: number
  date: string
  chemical?: string | null // Made optional for backward compatibility
  dose?: string | null // Made optional for backward compatibility
  quantity_amount: number
  quantity_unit: 'gm/L' | 'ml/L' | 'ppm' | 'kg/Acre' | 'liter/Acre'
  water_volume: number | null // total water volume in liters, can be null
  chemicals?: SprayChemical[] // New array of chemicals for multiple chemicals support
  area: number // in acres
  weather: string
  operator: string
  date_of_pruning?: Date
  notes?: string
  created_at?: string
}

export interface FertigationRecord {
  id?: number
  farm_id: number
  date: string
  fertilizers?: Fertilizer[] // Array of fertilizers with name, quantity, and unit
  area?: number
  date_of_pruning?: Date // Date object of pruning when this record was created (snapshot from farm level)
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
  date_of_pruning?: Date // Date object of pruning when this record was created (snapshot from farm level)
  notes?: string
  created_at?: string
}

export interface ExpenseRecord {
  id?: number
  farm_id: number
  date: string
  type: 'labor' | 'materials' | 'equipment' | 'fuel' | 'other'
  cost: number
  date_of_pruning?: Date // Date object of pruning when this record was created (snapshot from farm level)
  remarks?: string
  // Labor-specific fields (only used when type = 'labor')
  // Allow null to explicitly clear these fields when switching away from labor type
  num_workers?: number | null // Number of laborers
  hours_worked?: number | null // Total hours worked
  work_type?: string | null // Type of work (pruning, harvesting, spraying, weeding, etc.)
  rate_per_unit?: number | null // Hourly or daily wage rate
  worker_names?: string | null // Comma-separated worker names
  created_at?: string
}

export interface DailyNoteRecord {
  id?: number
  farm_id: number
  date: string
  notes?: string | null
  created_at?: string | null
  updated_at?: string | null
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

export interface TaskReminder {
  id?: number
  farm_id: number
  title: string
  description?: string | null
  task_type:
    | 'irrigation'
    | 'spray'
    | 'fertigation'
    | 'harvest'
    | 'soil_test'
    | 'petiole_test'
    | 'expense'
    | 'note'
  dependency_log_type?: string | null
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority?: 'low' | 'medium' | 'high'
  due_date?: string | null
  estimated_duration_minutes?: number | null
  location?: string | null
  assigned_to_user_id?: string | null
  created_by?: string | null
  linked_record_type?: string | null
  linked_record_id?: number | null
  created_at?: string
  updated_at?: string
  completed_at?: string | null
}

export interface SoilTestRecord {
  id?: number
  farm_id: number
  date: string
  parameters: Record<string, number> // pH, N, P, K, etc.
  date_of_pruning?: Date // Date object of pruning when this record was created (snapshot from farm level)
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
  date_of_pruning?: Date // Date object of pruning when this record was created (snapshot from farm level)
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

export type SoilSectionName = 'top' | 'bottom' | 'left' | 'right'

export interface SoilSection {
  name: SoilSectionName
  depth_m?: number
  width_m?: number
  photo_path?: string | null
  photo_preview?: string | null
  ec_ds_m?: number
  moisture_pct_user: number
  created_at?: string | null
}

export interface SoilProfile {
  id?: number
  farm_id: number
  fusarium_pct?: number | null
  sections?: SoilSection[]
  created_at?: string | null
}

// ============================================
// Labor Management Module Types
// ============================================

export type WorkStatus = 'full_day' | 'half_day' | 'absent'
export type TransactionType = 'advance_given' | 'advance_deducted' | 'payment'
export type SettlementStatus = 'draft' | 'confirmed'

export interface WorkType {
  id: number
  user_id: string | null // null for default system work types
  name: string
  is_default: boolean
  created_at: string
}

export interface Worker {
  id: number
  user_id: string
  name: string
  daily_rate: number
  advance_balance: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WorkerCreateInput {
  name: string
  daily_rate: number
  advance_balance: number
}

export interface WorkerUpdateInput {
  name?: string
  daily_rate?: number
  advance_balance?: number
  is_active?: boolean
}

export interface WorkerAttendance {
  id: number
  worker_id: number
  farm_ids: number[] // Array of farm IDs
  date: string
  work_status: WorkStatus
  work_type: string
  daily_rate_override?: number | null // null means use worker's default rate
  notes?: string | null
  created_at: string
  updated_at: string
  // Joined fields
  worker?: Worker
}

export interface WorkerAttendanceCreateInput {
  worker_id: number
  farm_ids: number[] // Array of farm IDs
  date: string
  work_status: WorkStatus
  work_type: string
  daily_rate_override?: number | null
  notes?: string
}

export interface WorkerSettlement {
  id: number
  worker_id: number
  farm_id?: number | null // null if settlement spans multiple farms
  period_start: string
  period_end: string
  days_worked: number
  gross_amount: number
  advance_deducted: number
  net_payment: number
  status: SettlementStatus
  notes?: string | null
  created_at: string
  confirmed_at?: string | null
  // Joined fields
  worker?: Worker
}

export interface WorkerSettlementCreateInput {
  worker_id: number
  farm_id?: number | null
  period_start: string
  period_end: string
  days_worked: number
  gross_amount: number
  advance_deducted: number
  net_payment: number
  notes?: string
}

export interface WorkerTransaction {
  id: number
  worker_id: number
  farm_id?: number | null
  date: string
  type: TransactionType
  amount: number
  settlement_id?: number | null
  notes?: string | null
  created_at: string
  // Joined fields
  worker?: Worker
  settlement?: WorkerSettlement
}

export interface WorkerTransactionCreateInput {
  worker_id: number
  farm_id?: number | null
  date: string
  type: TransactionType
  amount: number
  settlement_id?: number | null
  notes?: string
}

export interface TemporaryWorkerEntry {
  id: number
  farm_id: number
  user_id: string
  date: string
  name: string
  hours_worked: number
  amount_paid: number
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface TemporaryWorkerEntryInput {
  farm_id: number
  date: string
  name: string
  hours_worked: number
  amount_paid: number
  notes?: string
}

// Summary types for analytics
export interface WorkerAttendanceSummary {
  worker_id: number
  worker_name: string
  farm_id: number
  week_start: string
  full_days: number
  half_days: number
  total_days: number
  gross_earnings: number
}

export interface LaborAnalytics {
  total_labor_cost: number
  total_days_worked: number
  by_work_type: Array<{
    work_type: string
    total_cost: number
    total_days: number
    avg_daily_rate: number
  }>
  by_worker: Array<{
    worker_id: number
    worker_name: string
    total_cost: number
    total_days: number
    advance_balance: number
  }>
}
