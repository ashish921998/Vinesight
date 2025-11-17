'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { normalizeDateToYYYYMMDD } from '@/lib/activity-display-utils'

interface ActivityLog {
  id: number
  type: string
  date: string
  notes?: string
  duration?: number
  chemical?: string
  chemicals?: Array<{ name: string; quantity: number; unit: string }>
  quantity?: number
  cost?: number
  fertilizer?: string
  fertilizers?: Array<{ name: string; quantity: number; unit: string }>
  unit?: string
  created_at: string
}

interface SearchLogsParams {
  farmId: number
  searchQuery: string
  selectedActivityTypes: string[]
  dateFrom: string
  dateTo: string
  currentPage: number
  itemsPerPage: number
}

interface SearchLogsResult {
  logs: ActivityLog[]
  totalCount: number
}

/**
 * Refactored searchLogs:
 * - mapper registry to avoid repeated filter/map blocks
 * - single-pass filtering after combining
 * - precompute normalized date bounds and lowercased query
 * - defensive defaults and stable sort (clone before sort)
 */
export async function searchLogs({
  farmId,
  searchQuery,
  selectedActivityTypes,
  dateFrom,
  dateTo,
  currentPage,
  itemsPerPage
}: SearchLogsParams): Promise<SearchLogsResult> {
  try {
    const supabase = await createServerSupabaseClient()

    // Fetch all record types in parallel
    const [
      irrigationResult,
      sprayResult,
      harvestResult,
      expensesResult,
      fertigationResult,
      soilTestsResult,
      petioleTestsResult,
      dailyNotesResult
    ] = await Promise.all([
      supabase.from('irrigation_records').select('*').eq('farm_id', farmId),
      supabase.from('spray_records').select('*').eq('farm_id', farmId),
      supabase.from('harvest_records').select('*').eq('farm_id', farmId),
      supabase.from('expense_records').select('*').eq('farm_id', farmId),
      supabase.from('fertigation_records').select('*').eq('farm_id', farmId),
      supabase.from('soil_test_records').select('*').eq('farm_id', farmId),
      supabase.from('petiole_test_records').select('*').eq('farm_id', farmId),
      supabase.from('daily_notes').select('*').eq('farm_id', farmId)
    ])

    // Validate each query result and log errors
    const errors: string[] = []
    if (irrigationResult.error) errors.push(`irrigation_records: ${irrigationResult.error.message}`)
    if (sprayResult.error) errors.push(`spray_records: ${sprayResult.error.message}`)
    if (harvestResult.error) errors.push(`harvest_records: ${harvestResult.error.message}`)
    if (expensesResult.error) errors.push(`expense_records: ${expensesResult.error.message}`)
    if (fertigationResult.error)
      errors.push(`fertigation_records: ${fertigationResult.error.message}`)
    if (soilTestsResult.error) errors.push(`soil_test_records: ${soilTestsResult.error.message}`)
    if (petioleTestsResult.error)
      errors.push(`petiole_test_records: ${petioleTestsResult.error.message}`)
    if (dailyNotesResult.error) errors.push(`daily_notes: ${dailyNotesResult.error.message}`)

    if (errors.length > 0) {
      console.error('Supabase query errors:', errors)
      throw new Error(`Failed to fetch farm logs: ${errors.join('; ')}`)
    }

    const irrigationData = irrigationResult.data || []
    const sprayData = sprayResult.data || []
    const harvestData = harvestResult.data || []
    const expensesData = expensesResult.data || []
    const fertigationData = fertigationResult.data || []
    const soilTestsData = soilTestsResult.data || []
    const petioleTestsData = petioleTestsResult.data || []
    const dailyNotesData = dailyNotesResult.data || []

    // small helper to map arrays safely
    const mapIfHasId = (arr: any[] | undefined, fn: (r: any) => ActivityLog) =>
      (arr || []).filter((r) => r?.id != null).map(fn)

    const mappers: Record<string, (r: any) => ActivityLog> = {
      irrigation: (r: any) => ({
        id: r.id,
        type: 'irrigation',
        date: r.date,
        notes: r.notes,
        duration: r.duration,
        created_at: r.created_at || r.date
      }),
      spray: (r: any) => ({
        id: r.id,
        type: 'spray',
        date: r.date,
        notes: r.notes,
        chemical: r.chemical,
        chemicals: r.chemicals,
        created_at: r.created_at || r.date
      }),
      harvest: (r: any) => ({
        id: r.id,
        type: 'harvest',
        date: r.date,
        notes: r.notes,
        quantity: r.quantity,
        created_at: r.created_at || r.date
      }),
      expense: (r: any) => ({
        id: r.id,
        type: 'expense',
        date: r.date,
        notes: r.remarks,
        cost: r.cost,
        created_at: r.created_at || r.date
      }),
      fertigation: (r: any) => ({
        id: r.id,
        type: 'fertigation',
        date: r.date,
        notes: r.notes,
        fertilizers: r.fertilizers,
        created_at: r.created_at || r.date
      }),
      soil_test: (r: any) => ({
        id: r.id,
        type: 'soil_test',
        date: r.date,
        notes: r.notes,
        created_at: r.created_at || r.date
      }),
      petiole_test: (r: any) => ({
        id: r.id,
        type: 'petiole_test',
        date: r.date,
        notes: r.notes,
        created_at: r.created_at || r.date
      }),
      daily_note: (r: any) => ({
        id: r.id,
        type: 'daily_note',
        date: r.date,
        notes: r.notes || '',
        created_at: r.created_at || r.date
      })
    }

    // combine mapped arrays
    const combined: ActivityLog[] = [
      ...mapIfHasId(irrigationData, mappers.irrigation),
      ...mapIfHasId(sprayData, mappers.spray),
      ...mapIfHasId(harvestData, mappers.harvest),
      ...mapIfHasId(expensesData, mappers.expense),
      ...mapIfHasId(fertigationData, mappers.fertigation),
      ...mapIfHasId(soilTestsData, mappers.soil_test),
      ...mapIfHasId(petioleTestsData, mappers.petiole_test),
      ...mapIfHasId(dailyNotesData, mappers.daily_note)
    ]

    // defensive defaults
    const q = (searchQuery || '').toLowerCase().trim()
    const hasQuery = q.length > 0
    const hasTypeFilter = Array.isArray(selectedActivityTypes) && selectedActivityTypes.length > 0
    const normalizedFrom = dateFrom ? normalizeDateToYYYYMMDD(dateFrom) : null
    const normalizedTo = dateTo ? normalizeDateToYYYYMMDD(dateTo) : null

    // single-pass filtering
    const shortlisted: ActivityLog[] = []
    for (const log of combined) {
      // activity type filter
      if (hasTypeFilter && !selectedActivityTypes.includes(log.type)) continue

      // date range (based on activity date)
      if (normalizedFrom || normalizedTo) {
        const logNorm = normalizeDateToYYYYMMDD(log.date)
        if (!logNorm) continue
        if (normalizedFrom && logNorm < normalizedFrom) continue
        if (normalizedTo && logNorm > normalizedTo) continue
      }

      // search query filter (if any)
      if (hasQuery) {
        const notes = (log.notes || '').toLowerCase()
        let matched = false

        if (log.type.toLowerCase().includes(q)) matched = true
        else if (notes.includes(q)) matched = true
        else if (log.duration != null && String(log.duration).includes(q)) matched = true
        else if (log.quantity != null && String(log.quantity).includes(q)) matched = true
        else if (log.cost != null && String(log.cost).includes(q)) matched = true
        else if (log.chemical && log.chemical.toLowerCase().includes(q)) matched = true
        else if (
          Array.isArray(log.chemicals) &&
          log.chemicals.some((c) => c?.name?.toLowerCase().includes(q))
        )
          matched = true
        else if (
          Array.isArray(log.fertilizers) &&
          log.fertilizers.some((f) => f?.name?.toLowerCase().includes(q))
        )
          matched = true

        if (!matched) continue
      }

      shortlisted.push(log)
    }

    // sort by activity date (newest first) - clone array to avoid mutating originals
    const sorted = [...shortlisted].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // pagination with safe bounds
    const totalCount = sorted.length
    const safeItemsPerPage = Math.max(1, Math.floor(itemsPerPage || 10))
    const safeCurrentPage = Math.max(1, Math.floor(currentPage || 1))
    const offset = (safeCurrentPage - 1) * safeItemsPerPage
    const paginated = sorted.slice(offset, offset + safeItemsPerPage)

    return {
      logs: paginated,
      totalCount
    }
  } catch (error) {
    console.error('Error searching logs:', error)
    throw error
  }
}
