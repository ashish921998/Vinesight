import { SupabaseService } from './supabase-service'
import { type Farm } from '@/types/types'

/**
 * Portfolio service for fetching aggregated data across multiple farms
 * OPTIMIZED VERSION: Minimal queries for portfolio overview
 */

export interface PortfolioData {
  farms: Farm[]
  farmsData: Map<number, FarmDashboardData>
  financials: {
    totalRevenue: number
    totalExpenses: number
    profit: number
    profitMargin: number
  }
}

export interface FarmDashboardData {
  pendingTasks: any[]
  alerts: any[]
  weather: any
  lastActivity?: Date
  totalWaterUsage?: number
  harvestCount?: number
  harvestRecords?: any[] // Include harvest records for calculations
  expenseRecords?: any[] // Include expense records for calculations
  expenseTotal?: number
  revenue?: number
}

export class PortfolioService {
  /**
   * OPTIMIZED: Get all farms with lightweight dashboard data
   * Only fetches what's needed for portfolio cards view
   */
  static async getPortfolioData(): Promise<PortfolioData> {
    try {
      // Get all user farms
      const farms = await SupabaseService.getAllFarms()

      // OPTIMIZED: Fetch all farm data in parallel batches
      // Group: Tasks, Harvests, Expenses for all farms
      const farmsDataPromises = farms.map(async (farm) => {
        try {
          // Fetch only essential data per farm in parallel
          const [pendingTasks, harvestRecords, expenseRecords] = await Promise.all([
            SupabaseService.getPendingTasks(farm.id!),
            SupabaseService.getHarvestRecords(farm.id!),
            SupabaseService.getExpenseRecords(farm.id!)
          ])

          // Calculate aggregate data
          const harvestCount = harvestRecords.length
          const revenue = harvestRecords.reduce((sum, h) => sum + (h.revenue || 0), 0)
          const expenseTotal = expenseRecords.reduce((sum, e) => sum + e.cost, 0)

          return {
            farmId: farm.id!,
            data: {
              pendingTasks: pendingTasks.slice(0, 5), // Only top 5 tasks for display
              alerts: [], // Alerts are synthesized by getCriticalAlerts()
              weather: null, // Don't fetch weather for portfolio view
              lastActivity: undefined,
              totalWaterUsage: 0,
              harvestCount,
              harvestRecords, // Keep for detailed calculations
              expenseRecords, // Keep for detailed calculations
              revenue,
              expenseTotal
            }
          }
        } catch (error) {
          console.error(`Error loading data for farm ${farm.id}:`, error)
          return {
            farmId: farm.id!,
            data: {
              pendingTasks: [],
              alerts: [],
              weather: null,
              totalWaterUsage: 0,
              harvestCount: 0,
              harvestRecords: [],
              expenseRecords: [],
              revenue: 0,
              expenseTotal: 0
            }
          }
        }
      })

      const farmsDataArray = await Promise.all(farmsDataPromises)

      // Convert to Map for easy lookup
      const farmsData = new Map<number, FarmDashboardData>(
        farmsDataArray.map((item) => [item.farmId, item.data])
      )

      // OPTIMIZED: Calculate financials from already-loaded data (no extra API calls!)
      const totalRevenue = farmsDataArray.reduce((sum, item) => sum + (item.data.revenue || 0), 0)
      const totalExpenses = farmsDataArray.reduce(
        (sum, item) => sum + (item.data.expenseTotal || 0),
        0
      )
      const profit = totalRevenue - totalExpenses
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

      const financials = {
        totalRevenue,
        totalExpenses,
        profit,
        profitMargin
      }

      return {
        farms,
        farmsData,
        financials
      }
    } catch (error) {
      console.error('Error loading portfolio data:', error)
      throw error
    }
  }

  /**
   * REMOVED: getUnifiedTasks() - Not implemented yet, was causing unnecessary API calls
   * Use getPendingTasks() per farm instead for portfolio view
   */

  /**
   * OPTIMIZED: Get financial summary across portfolio
   * Fetches in parallel to avoid sequential queries
   */
  static async getFinancialSummary(farms?: Farm[]) {
    try {
      // Reuse farms if already loaded
      const allFarms = farms || (await SupabaseService.getAllFarms())

      // Fetch all harvests and expenses in parallel
      const financialsPromises = allFarms.map(async (farm) => {
        try {
          const [harvests, expenses] = await Promise.all([
            SupabaseService.getHarvestRecords(farm.id!),
            SupabaseService.getExpenseRecords(farm.id!)
          ])

          const farmRevenue = harvests.reduce((sum, harvest) => sum + (harvest.revenue || 0), 0)
          const farmExpenses = expenses.reduce((sum, expense) => sum + expense.cost, 0)

          return { revenue: farmRevenue, expenses: farmExpenses }
        } catch (error) {
          console.error(`Error loading financials for farm ${farm.id}:`, error)
          return { revenue: 0, expenses: 0 }
        }
      })

      const financials = await Promise.all(financialsPromises)

      const totalRevenue = financials.reduce((sum, f) => sum + f.revenue, 0)
      const totalExpenses = financials.reduce((sum, f) => sum + f.expenses, 0)
      const profit = totalRevenue - totalExpenses
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

      return {
        totalRevenue,
        totalExpenses,
        profit,
        profitMargin
      }
    } catch (error) {
      console.error('Error loading financial summary:', error)
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        profit: 0,
        profitMargin: 0
      }
    }
  }

  /**
   * Refresh portfolio data (force reload)
   */
  static async refreshPortfolio(): Promise<PortfolioData> {
    // Clear any cached data if applicable
    return this.getPortfolioData()
  }
}
