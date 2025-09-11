import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { logger } from './logger'
import type { Farm } from '@/types/types'
import { 
  toApplicationFarm,
  toApplicationIrrigationRecord,
  toApplicationSprayRecord,
  toApplicationHarvestRecord,
  toApplicationExpenseRecord
} from './supabase-types'
import type { IrrigationRecord, SprayRecord, HarvestRecord, ExpenseRecord } from './supabase'

export type TimeRange = '30d' | '90d' | '1y'

export interface AnalyticsAggregateData {
  farms: Farm[]
  irrigations: IrrigationRecord[]
  sprays: SprayRecord[]
  harvests: HarvestRecord[]
  expenses: ExpenseRecord[]
  fertigations: any[]
}

function getStartDate(range: TimeRange): string {
  const now = new Date()
  const d = new Date(now)
  if (range === '30d') d.setDate(now.getDate() - 30)
  else if (range === '90d') d.setDate(now.getDate() - 90)
  else d.setFullYear(now.getFullYear() - 1)
  return d.toISOString().split('T')[0]
}

export async function fetchAggregatedData(range: TimeRange = '30d'): Promise<AnalyticsAggregateData> {
  const t0 = performance.now()
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (pairs) => {
          try { pairs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { farms: [], irrigations: [], sprays: [], harvests: [], expenses: [], fertigations: [] }

  const { data: farmRows, error: farmErr } = await supabase.from('farms').select('*').eq('user_id', user.id)
  if (farmErr) {
    logger.error('Failed to load farms', farmErr)
    return { farms: [], irrigations: [], sprays: [], harvests: [], expenses: [], fertigations: [] }
  }
  const farms = (farmRows || []).map(toApplicationFarm)
  const farmIds = farms.map(f => f.id!).filter(Boolean) as number[]
  if (farmIds.length === 0) return { farms: [], irrigations: [], sprays: [], harvests: [], expenses: [], fertigations: [] }

  const startDate = getStartDate(range)

  const q0 = performance.now()
  const [irrigationsRes, spraysRes, harvestsRes, expensesRes, fertigationsRes] = await Promise.all([
    supabase.from('irrigation_records').select('*').in('farm_id', farmIds).gte('date', startDate),
    supabase.from('spray_records').select('*').in('farm_id', farmIds).gte('date', startDate),
    supabase.from('harvest_records').select('*').in('farm_id', farmIds).gte('date', startDate),
    supabase.from('expense_records').select('*').in('farm_id', farmIds).gte('date', startDate),
    supabase.from('fertigation_records').select('*').in('farm_id', farmIds).gte('date', startDate)
  ])
  const q1 = performance.now()
  logger.info(`Analytics batch queries completed in ${(q1 - q0).toFixed(1)}ms`)

  const irrigations = (irrigationsRes.data || []).map(toApplicationIrrigationRecord)
  const sprays = (spraysRes.data || []).map(toApplicationSprayRecord)
  const harvests = (harvestsRes.data || []).map(toApplicationHarvestRecord)
  const expenses = (expensesRes.data || []).map(toApplicationExpenseRecord)
  const fertigations = (fertigationsRes.data || [])

  const t1 = performance.now()
  logger.info(`fetchAggregatedData total ${(t1 - t0).toFixed(1)}ms for ${farmIds.length} farms`)

  return { farms, irrigations, sprays, harvests, expenses, fertigations }
}
