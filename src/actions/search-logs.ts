'use server'

import { SupabaseService } from '@/lib/supabase-service'
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
    // fetch all record types in parallel
    const [irrigation, spray, harvest, expenses, fertigation, soilTests, petioleTests, dailyNotes] =
      await Promise.all([
        SupabaseService.getIrrigationRecords(farmId),
        SupabaseService.getSprayRecords(farmId),
        SupabaseService.getHarvestRecords(farmId),
        SupabaseService.getExpenseRecords(farmId),
        SupabaseService.getFertigationRecords(farmId),
        SupabaseService.getSoilTestRecords(farmId),
        SupabaseService.getPetioleTestRecords(farmId),
        SupabaseService.getDailyNotes(farmId)
      ])

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
      ...mapIfHasId(irrigation, mappers.irrigation),
      ...mapIfHasId(spray, mappers.spray),
      ...mapIfHasId(harvest, mappers.harvest),
      ...mapIfHasId(expenses, mappers.expense),
      ...mapIfHasId(fertigation, mappers.fertigation),
      ...mapIfHasId(soilTests, mappers.soil_test),
      ...mapIfHasId(petioleTests, mappers.petiole_test),
      ...mapIfHasId(dailyNotes, mappers.daily_note)
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
