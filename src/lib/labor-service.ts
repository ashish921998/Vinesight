/**
 * Labor Management Service
 * Handles all CRUD operations for workers, attendance, settlements, and transactions
 *
 * NOTE: This service uses type assertions because the new tables (workers, worker_attendance, etc.)
 * are not yet in the auto-generated Supabase types. Run the migration and regenerate types to fix.
 */

import { createClient } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Worker,
  WorkerCreateInput,
  WorkerUpdateInput,
  WorkerAttendance,
  WorkerAttendanceCreateInput,
  WorkerSettlement,
  WorkerSettlementCreateInput,
  WorkerTransaction,
  WorkerTransactionCreateInput,
  WorkType,
  WorkStatus,
  LaborAnalytics,
  TemporaryWorkerEntry,
  TemporaryWorkerEntryInput
} from '@/lib/supabase'

// Minimal typed interface for labor-related tables to retain autocomplete and catch typos
interface LaborTables {
  workers: any
  worker_attendance: any
  worker_transactions: any
  worker_settlements: any
  temporary_worker_entries: any
  work_types: any
}

// Helper to get client with labor table names typed while keeping payloads untyped
const getUntypedClient = () => createClient() as unknown as SupabaseClient<LaborTables>

// ============================================
// Work Types
// ============================================

export async function getWorkTypes(): Promise<WorkType[]> {
  const supabase = getUntypedClient()
  const { data, error } = await supabase
    .from('work_types')
    .select('*')
    .order('is_default', { ascending: false })
    .order('name')

  if (error) throw error
  return data || []
}

export async function addCustomWorkType(name: string): Promise<WorkType> {
  const supabase = getUntypedClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('work_types')
    .insert({ user_id: user.id, name: name.toLowerCase(), is_default: false })
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// Workers
// ============================================

export async function getWorkers(includeInactive = false): Promise<Worker[]> {
  const supabase = getUntypedClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  let query = supabase.from('workers').select('*').eq('user_id', user.id).order('name')

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getWorkerById(workerId: number): Promise<Worker | null> {
  const supabase = getUntypedClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .eq('id', workerId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data
}

export async function createWorker(input: WorkerCreateInput): Promise<Worker> {
  const supabase = getUntypedClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('workers')
    .insert({
      user_id: user.id,
      name: input.name,
      daily_rate: input.daily_rate,
      advance_balance: input.advance_balance ?? 0,
      is_active: true
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateWorker(workerId: number, input: WorkerUpdateInput): Promise<Worker> {
  const supabase = getUntypedClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('workers')
    .update({
      ...input,
      updated_at: new Date().toISOString()
    })
    .eq('id', workerId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteWorker(workerId: number): Promise<void> {
  const supabase = getUntypedClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('workers')
    .delete()
    .eq('id', workerId)
    .eq('user_id', user.id)

  if (error) throw error
}

// ============================================
// Worker Attendance
// ============================================

export async function getAttendanceByDateRange(
  farmId: number,
  startDate: string,
  endDate: string
): Promise<WorkerAttendance[]> {
  const supabase = getUntypedClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('worker_attendance')
    .select('*, worker:workers(*)')
    .eq('farm_id', farmId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  if (error) throw error

  return (data || []).filter((record: any) => record.worker?.user_id === user.id)
}

export async function getAttendanceByWorker(
  workerId: number,
  startDate?: string,
  endDate?: string
): Promise<WorkerAttendance[]> {
  const supabase = getUntypedClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  const worker = await getWorkerById(workerId)
  if (!worker) return []

  let query = supabase
    .from('worker_attendance')
    .select('*')
    .eq('worker_id', workerId)
    .order('date', { ascending: false })

  if (startDate) query = query.gte('date', startDate)
  if (endDate) query = query.lte('date', endDate)

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getAttendanceByDate(
  farmId: number,
  date: string
): Promise<WorkerAttendance[]> {
  const supabase = getUntypedClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('worker_attendance')
    .select('*, worker:workers(*)')
    .eq('farm_id', farmId)
    .eq('date', date)
    .order('worker_id')

  if (error) throw error

  return (data || []).filter((record: any) => record.worker?.user_id === user.id)
}

// ============================================
// Temporary Workers
// ============================================

export async function getTemporaryWorkers(
  farmId: number,
  date: string
): Promise<TemporaryWorkerEntry[]> {
  const supabase = getUntypedClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('temporary_worker_entries')
    .select('*')
    .eq('farm_id', farmId)
    .eq('date', date)
    .eq('user_id', user.id)
    .order('created_at')

  if (error) throw error
  return data || []
}

export async function createTemporaryWorkerEntry(
  input: TemporaryWorkerEntryInput
): Promise<TemporaryWorkerEntry> {
  const supabase = getUntypedClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('temporary_worker_entries')
    .insert({
      ...input,
      user_id: user.id
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTemporaryWorkerEntry(
  entryId: number,
  input: Partial<TemporaryWorkerEntryInput>
): Promise<TemporaryWorkerEntry> {
  const supabase = getUntypedClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  const { data: existingEntry, error: fetchError } = await supabase
    .from('temporary_worker_entries')
    .select('*')
    .eq('id', entryId)
    .single()

  if (fetchError || !existingEntry) throw new Error('Entry not found')

  const entry = existingEntry as any
  if (entry.user_id !== user.id) throw new Error('Not authorized to update this entry')

  const { data, error } = await supabase
    .from('temporary_worker_entries')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', entryId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTemporaryWorkerEntry(entryId: number): Promise<void> {
  const supabase = getUntypedClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  const { data: existingEntry, error: fetchError } = await supabase
    .from('temporary_worker_entries')
    .select('*')
    .eq('id', entryId)
    .single()

  if (fetchError || !existingEntry) throw new Error('Entry not found')

  const entry = existingEntry as any
  if (entry.user_id !== user.id) throw new Error('Not authorized to delete this entry')

  const { error } = await supabase.from('temporary_worker_entries').delete().eq('id', entryId)
  if (error) throw error
}

export async function createAttendance(
  input: WorkerAttendanceCreateInput
): Promise<WorkerAttendance> {
  const supabase = getUntypedClient()
  const worker = await getWorkerById(input.worker_id)
  if (!worker) throw new Error('Worker not found')

  const { data, error } = await supabase
    .from('worker_attendance')
    .insert({
      worker_id: input.worker_id,
      farm_id: input.farm_id,
      date: input.date,
      work_status: input.work_status,
      work_type: input.work_type,
      daily_rate_override: input.daily_rate_override ?? null,
      notes: input.notes ?? null
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateAttendance(
  attendanceId: number,
  input: Partial<WorkerAttendanceCreateInput>
): Promise<WorkerAttendance> {
  const supabase = getUntypedClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  const { data: existingRecord, error: fetchError } = await supabase
    .from('worker_attendance')
    .select('*, worker:workers(*)')
    .eq('id', attendanceId)
    .single()

  if (fetchError || !existingRecord) throw new Error('Attendance record not found')

  const record = existingRecord as any
  if (record.worker?.user_id !== user.id) throw new Error('Not authorized to update this record')

  const { data, error } = await supabase
    .from('worker_attendance')
    .update({
      ...input,
      updated_at: new Date().toISOString()
    })
    .eq('id', attendanceId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAttendance(attendanceId: number): Promise<void> {
  const supabase = getUntypedClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  const { data: existingRecord, error: fetchError } = await supabase
    .from('worker_attendance')
    .select('*, worker:workers(*)')
    .eq('id', attendanceId)
    .single()

  if (fetchError || !existingRecord) throw new Error('Attendance record not found')

  const record = existingRecord as any
  if (record.worker?.user_id !== user.id) throw new Error('Not authorized to delete this record')

  const { error } = await supabase.from('worker_attendance').delete().eq('id', attendanceId)

  if (error) throw error
}

// Bulk attendance entry for multiple workers on a single day
export async function bulkCreateAttendance(
  entries: WorkerAttendanceCreateInput[]
): Promise<WorkerAttendance[]> {
  const supabase = getUntypedClient()

  for (const entry of entries) {
    const worker = await getWorkerById(entry.worker_id)
    if (!worker) throw new Error(`Worker ${entry.worker_id} not found`)
  }

  const { data, error } = await supabase.from('worker_attendance').insert(entries).select()

  if (error) throw error
  return data || []
}

// ============================================
// Worker Transactions (Advances & Payments)
// ============================================

export async function getTransactionsByWorker(
  workerId: number,
  limit = 50
): Promise<WorkerTransaction[]> {
  const supabase = getUntypedClient()
  const worker = await getWorkerById(workerId)
  if (!worker) return []

  const { data, error } = await supabase
    .from('worker_transactions')
    .select('*')
    .eq('worker_id', workerId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function createTransaction(
  input: WorkerTransactionCreateInput
): Promise<WorkerTransaction> {
  const supabase = getUntypedClient()
  const worker = await getWorkerById(input.worker_id)
  if (!worker) throw new Error('Worker not found')

  const { data, error } = await supabase
    .from('worker_transactions')
    .insert({
      worker_id: input.worker_id,
      farm_id: input.farm_id ?? null,
      date: input.date,
      type: input.type,
      amount: input.amount,
      settlement_id: input.settlement_id ?? null,
      notes: input.notes ?? null
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTransaction(
  transactionId: number,
  updates: Partial<WorkerTransactionCreateInput>
): Promise<WorkerTransaction> {
  const supabase = getUntypedClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  const { data: existingTx, error: fetchError } = await supabase
    .from('worker_transactions')
    .select('*, worker:workers(*)')
    .eq('id', transactionId)
    .single()

  if (fetchError || !existingTx) throw new Error('Transaction not found')

  const tx = existingTx as any
  if (tx.worker?.user_id !== user.id) throw new Error('Not authorized to update this transaction')

  const { data, error } = await supabase
    .from('worker_transactions')
    .update({
      ...updates
    })
    .eq('id', transactionId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTransaction(transactionId: number): Promise<void> {
  const supabase = getUntypedClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  const { data: existingTx, error: fetchError } = await supabase
    .from('worker_transactions')
    .select('*, worker:workers(*)')
    .eq('id', transactionId)
    .single()

  if (fetchError || !existingTx) throw new Error('Transaction not found')

  const tx = existingTx as any
  if (tx.worker?.user_id !== user.id) throw new Error('Not authorized to delete this transaction')

  const { error } = await supabase.from('worker_transactions').delete().eq('id', transactionId)
  if (error) throw error
}

export async function getAdvanceDeductionsByDate(
  farmId: number,
  date: string
): Promise<WorkerTransaction[]> {
  const supabase = getUntypedClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('worker_transactions')
    .select('*, worker:workers(*)')
    .eq('farm_id', farmId)
    .eq('date', date)
    .eq('type', 'advance_deducted')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data || []).filter((record: any) => record.worker?.user_id === user.id)
}

// Give advance to worker
export async function giveAdvance(
  workerId: number,
  amount: number,
  date: string,
  farmId?: number,
  notes?: string
): Promise<WorkerTransaction> {
  return createTransaction({
    worker_id: workerId,
    farm_id: farmId || null,
    date,
    type: 'advance_given',
    amount,
    notes
  })
}

// ============================================
// Worker Settlements
// ============================================

export async function getSettlementsByWorker(
  workerId: number,
  limit = 20
): Promise<WorkerSettlement[]> {
  const supabase = getUntypedClient()
  const { data, error } = await supabase
    .from('worker_settlements')
    .select('*')
    .eq('worker_id', workerId)
    .order('period_end', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

// Calculate settlement for a worker for a given period
export async function calculateSettlement(
  workerId: number,
  farmId: number | null,
  periodStart: string,
  periodEnd: string
): Promise<{
  days_worked: number
  gross_amount: number
  attendance_details: Array<{
    date: string
    work_status: WorkStatus
    work_type: string
    rate: number
    earnings: number
  }>
}> {
  const supabase = getUntypedClient()

  // Get worker's default rate
  const worker = await getWorkerById(workerId)
  if (!worker) throw new Error('Worker not found')

  // Get attendance records for the period
  let query = supabase
    .from('worker_attendance')
    .select('*')
    .eq('worker_id', workerId)
    .gte('date', periodStart)
    .lte('date', periodEnd)
    .neq('work_status', 'absent')
    .order('date')

  if (farmId) {
    query = query.eq('farm_id', farmId)
  }

  const { data: attendance, error } = await query

  if (error) throw error

  let totalDays = 0
  let grossAmount = 0
  const details: Array<{
    date: string
    work_status: WorkStatus
    work_type: string
    rate: number
    earnings: number
  }> = []

  for (const record of attendance || []) {
    const rate = record.daily_rate_override ?? worker.daily_rate
    const dayFraction = record.work_status === 'full_day' ? 1 : 0.5
    const earnings = rate * dayFraction

    totalDays += dayFraction
    grossAmount += earnings

    details.push({
      date: record.date,
      work_status: record.work_status as WorkStatus,
      work_type: record.work_type,
      rate,
      earnings
    })
  }

  return {
    days_worked: totalDays,
    gross_amount: grossAmount,
    attendance_details: details
  }
}

// Create and confirm a settlement
export async function createSettlement(
  input: WorkerSettlementCreateInput,
  autoConfirm = false
): Promise<WorkerSettlement> {
  const supabase = getUntypedClient()

  // Always insert as draft - confirmSettlement is the single place that confirms and creates transactions
  const { data: settlement, error: settlementError } = await supabase
    .from('worker_settlements')
    .insert({
      worker_id: input.worker_id,
      farm_id: input.farm_id ?? null,
      period_start: input.period_start,
      period_end: input.period_end,
      days_worked: input.days_worked,
      gross_amount: input.gross_amount,
      advance_deducted: input.advance_deducted,
      net_payment: input.net_payment,
      status: 'draft',
      notes: input.notes ?? null,
      confirmed_at: null
    })
    .select()
    .single()

  if (settlementError) throw settlementError

  // If auto-confirming, use atomic confirmation to ensure data consistency
  if (autoConfirm) {
    try {
      return await confirmSettlementAtomic(settlement.id)
    } catch (error) {
      // Roll back the created settlement if atomic confirmation fails
      try {
        await supabase.from('worker_settlements').delete().eq('id', settlement.id)
      } catch (rollbackError) {
        // Log rollback error but throw the original error
        console.error(
          'Failed to roll back settlement after atomic confirmation error:',
          rollbackError
        )
      }
      throw error
    }
  }

  return settlement
}

// Confirm a draft settlement atomically using server-side function
export async function confirmSettlementAtomic(settlementId: number): Promise<WorkerSettlement> {
  const supabase = getUntypedClient()

  // Call the atomic server-side function
  const { data, error } = await supabase.rpc('confirm_settlement_atomic', {
    settlement_id_param: settlementId
  })

  if (error) throw error
  if (!data || data.length === 0) throw new Error('Settlement confirmation failed')

  return data[0] as WorkerSettlement
}

// Legacy function - kept for backward compatibility but uses atomic version
export async function confirmSettlement(settlementId: number): Promise<WorkerSettlement> {
  return confirmSettlementAtomic(settlementId)
}

// ============================================
// Analytics
// ============================================

export async function getLaborAnalytics(
  farmId: number | null,
  startDate: string,
  endDate: string
): Promise<LaborAnalytics> {
  const supabase = getUntypedClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  // Get all workers for this user
  const { data: workers, error: workersError } = await supabase
    .from('workers')
    .select('*')
    .eq('user_id', user.id)

  if (workersError) throw workersError

  // Get attendance data
  let attendanceQuery = supabase
    .from('worker_attendance')
    .select('*, worker:workers(*)')
    .gte('date', startDate)
    .lte('date', endDate)
    .neq('work_status', 'absent')

  if (farmId) {
    attendanceQuery = attendanceQuery.eq('farm_id', farmId)
  }

  const { data: attendance, error: attendanceError } = await attendanceQuery

  if (attendanceError) throw attendanceError

  // Calculate totals
  let totalCost = 0
  let totalDays = 0
  const byWorkType: Record<string, { cost: number; days: number; count: number }> = {}
  const byWorker: Record<number, { cost: number; days: number; name: string }> = {}

  for (const record of attendance || []) {
    const worker = record.worker as Worker
    const rate = record.daily_rate_override ?? worker?.daily_rate ?? 0
    const dayFraction = record.work_status === 'full_day' ? 1 : 0.5
    const cost = rate * dayFraction

    totalCost += cost
    totalDays += dayFraction

    // By work type
    if (!byWorkType[record.work_type]) {
      byWorkType[record.work_type] = { cost: 0, days: 0, count: 0 }
    }
    byWorkType[record.work_type].cost += cost
    byWorkType[record.work_type].days += dayFraction
    byWorkType[record.work_type].count += 1

    // By worker
    if (!byWorker[record.worker_id]) {
      byWorker[record.worker_id] = {
        cost: 0,
        days: 0,
        name: worker?.name || 'Unknown'
      }
    }
    byWorker[record.worker_id].cost += cost
    byWorker[record.worker_id].days += dayFraction
  }

  return {
    total_labor_cost: totalCost,
    total_days_worked: totalDays,
    by_work_type: Object.entries(byWorkType).map(([work_type, data]) => ({
      work_type,
      total_cost: data.cost,
      total_days: data.days,
      avg_daily_rate: data.days > 0 ? data.cost / data.days : 0
    })),
    by_worker: Object.entries(byWorker).map(([worker_id, data]) => {
      const worker = workers?.find((w: Worker) => w.id === parseInt(worker_id))
      return {
        worker_id: parseInt(worker_id),
        worker_name: data.name,
        total_cost: data.cost,
        total_days: data.days,
        advance_balance: worker?.advance_balance ?? 0
      }
    })
  }
}

// Export the service as a namespace
export const LaborService = {
  // Work Types
  getWorkTypes,
  addCustomWorkType,

  // Workers
  getWorkers,
  getWorkerById,
  createWorker,
  updateWorker,
  deleteWorker,

  // Attendance
  getAttendanceByDateRange,
  getAttendanceByWorker,
  getAttendanceByDate,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  bulkCreateAttendance,
  getTemporaryWorkers,
  createTemporaryWorkerEntry,
  updateTemporaryWorkerEntry,
  deleteTemporaryWorkerEntry,

  // Transactions
  getTransactionsByWorker,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  giveAdvance,
  getAdvanceDeductionsByDate,

  // Settlements
  getSettlementsByWorker,
  calculateSettlement,
  createSettlement,
  confirmSettlement,

  // Analytics
  getLaborAnalytics
}
