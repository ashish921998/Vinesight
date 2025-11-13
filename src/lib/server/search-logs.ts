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

    // Combine all logs
    const combinedLogs: ActivityLog[] = [
      ...irrigation
        .filter((log) => log.id != null)
        .map((log) => ({
          id: log.id!,
          type: 'irrigation',
          date: log.date,
          notes: log.notes,
          duration: log.duration,
          created_at: log.created_at || log.date
        })),
      ...spray
        .filter((log) => log.id != null)
        .map((log) => ({
          id: log.id!,
          type: 'spray',
          date: log.date,
          notes: log.notes,
          chemical: log.chemical,
          chemicals: log.chemicals,
          created_at: log.created_at || log.date
        })),
      ...harvest
        .filter((log) => log.id != null)
        .map((log) => ({
          id: log.id!,
          type: 'harvest',
          date: log.date,
          notes: log.notes,
          quantity: log.quantity,
          created_at: log.created_at || log.date
        })),
      ...expenses
        .filter((log) => log.id != null)
        .map((log) => ({
          id: log.id!,
          type: 'expense',
          date: log.date,
          notes: log.remarks,
          cost: log.cost,
          created_at: log.created_at || log.date
        })),
      ...fertigation
        .filter((log) => log.id != null)
        .map((log) => ({
          id: log.id!,
          type: 'fertigation',
          date: log.date,
          notes: log.notes,
          fertilizers: log.fertilizers,
          created_at: log.created_at || log.date
        })),
      ...soilTests
        .filter((log) => log.id != null)
        .map((log) => ({
          id: log.id!,
          type: 'soil_test',
          date: log.date,
          notes: log.notes,
          created_at: log.created_at || log.date
        })),
      ...petioleTests
        .filter((log) => log.id != null)
        .map((log) => ({
          id: log.id!,
          type: 'petiole_test',
          date: log.date,
          notes: log.notes,
          created_at: log.created_at || log.date
        })),
      ...dailyNotes
        .filter((note) => note.id != null)
        .map((note) => ({
          id: note.id!,
          type: 'daily_note',
          date: note.date,
          notes: note.notes || '',
          created_at: note.created_at || note.date
        }))
    ]

    // Filter by activity types
    let filtered = combinedLogs
    if (selectedActivityTypes.length > 0) {
      filtered = filtered.filter((log) => selectedActivityTypes.includes(log.type))
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((log) => {
        // Search in log type
        if (log.type.toLowerCase().includes(query)) return true

        // Search in notes
        if (log.notes?.toLowerCase().includes(query)) return true

        // Search in duration for irrigation logs
        if (log.duration && log.duration.toString().includes(query)) return true

        // Search in quantity for harvest logs
        if (log.quantity && log.quantity.toString().includes(query)) return true

        // Search in cost for expense logs
        if (log.cost && log.cost.toString().includes(query)) return true

        // Search in chemical name for spray logs
        if (log.chemical?.toLowerCase().includes(query)) return true

        // Search in chemicals array for spray logs
        if (log.chemicals && Array.isArray(log.chemicals)) {
          if (log.chemicals.some((chem) => chem.name?.toLowerCase().includes(query))) return true
        }

        // Search in fertilizers array for fertigation logs
        if (log.fertilizers && Array.isArray(log.fertilizers)) {
          if (log.fertilizers.some((fert: any) => fert.name?.toLowerCase().includes(query)))
            return true
        }

        return false
      })
    }

    // Filter by date range
    if (dateFrom) {
      const normalizedDateFrom = normalizeDateToYYYYMMDD(dateFrom)
      if (normalizedDateFrom) {
        filtered = filtered.filter((log) => {
          const normalizedLogDate = normalizeDateToYYYYMMDD(log.date)
          return normalizedLogDate && normalizedLogDate >= normalizedDateFrom
        })
      }
    }

    if (dateTo) {
      const normalizedDateTo = normalizeDateToYYYYMMDD(dateTo)
      if (normalizedDateTo) {
        filtered = filtered.filter((log) => {
          const normalizedLogDate = normalizeDateToYYYYMMDD(log.date)
          return normalizedLogDate && normalizedLogDate <= normalizedDateTo
        })
      }
    }

    // Sort by creation date (newest first)
    const sortedLogs = filtered.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    // Paginate
    const totalCount = sortedLogs.length
    const offset = (currentPage - 1) * itemsPerPage
    const paginatedLogs = sortedLogs.slice(offset, offset + itemsPerPage)

    return {
      logs: paginatedLogs,
      totalCount
    }
  } catch (error) {
    console.error('Error searching logs:', error)
    throw error
  }
}
