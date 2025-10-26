import { type Farm } from '@/types/types'
import { calculateDashboardMetrics, getFarmStatus } from './dashboard-utils'

/**
 * Portfolio-level utility functions for multi-farm aggregation and analysis
 */

export interface PortfolioMetrics {
  totalFarms: number
  totalAcres: number
  averageHealthScore: number
  totalRevenue: number
  totalExpenses: number
  profitMargin: number
  criticalFarms: number
  attentionFarms: number
  healthyFarms: number
  totalPendingTasks: number
  totalUrgentTasks: number
  averageWaterLevel: number
  nextHarvestDays?: number
  nextHarvestFarmCount: number
}

export interface FarmSummary {
  id: number
  name: string
  location: string
  cropVariety: string
  totalAcres: number
  status: 'healthy' | 'attention' | 'critical'
  healthScore: number
  waterLevel: number
  pendingTasks: number
  urgentTasks: number
  daysToHarvest?: number
  seasonPhase?: string
  lastActivity?: Date
  hasAlerts: boolean
}

/**
 * Calculate portfolio-level metrics from farms data
 */
export function calculatePortfolioMetrics(
  farms: Farm[],
  farmsData: Map<number, any>
): PortfolioMetrics {
  if (farms.length === 0) {
    return {
      totalFarms: 0,
      totalAcres: 0,
      averageHealthScore: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      profitMargin: 0,
      criticalFarms: 0,
      attentionFarms: 0,
      healthyFarms: 0,
      totalPendingTasks: 0,
      totalUrgentTasks: 0,
      averageWaterLevel: 0,
      nextHarvestDays: undefined,
      nextHarvestFarmCount: 0
    }
  }

  let totalHealthScore = 0
  let totalWaterLevel = 0
  let criticalCount = 0
  let attentionCount = 0
  let healthyCount = 0
  let totalPendingTasks = 0
  let totalUrgentTasks = 0
  let nearestHarvestDays: number | undefined = undefined
  let harvestFarmCount = 0

  farms.forEach((farm) => {
    const farmData = farmsData.get(farm.id!)
    const metrics = calculateDashboardMetrics(farm, farmData?.pendingTasks, farmData?.alerts)
    const status = getFarmStatus(farm, farmData?.pendingTasks, farmData?.alerts)

    totalHealthScore += metrics.farmHealthScore
    totalWaterLevel += metrics.waterLevel
    totalPendingTasks += metrics.pendingTotalTasks
    totalUrgentTasks += metrics.pendingUrgentTasks

    if (status === 'critical') criticalCount++
    else if (status === 'attention') attentionCount++
    else healthyCount++

    // Track nearest harvest
    if (metrics.daysToHarvest !== undefined) {
      if (nearestHarvestDays === undefined || metrics.daysToHarvest < nearestHarvestDays) {
        nearestHarvestDays = metrics.daysToHarvest
      }
      if (metrics.daysToHarvest <= 30) {
        harvestFarmCount++
      }
    }
  })

  const farmCount = farms.length
  const totalAcres = farms.reduce((sum, farm) => sum + (farm.area || 0), 0)

  return {
    totalFarms: farmCount,
    totalAcres,
    averageHealthScore: Math.round(totalHealthScore / farmCount),
    totalRevenue: 0, // Will be calculated from harvest records
    totalExpenses: 0, // Will be calculated from expense records
    profitMargin: 0, // Calculated from revenue and expenses
    criticalFarms: criticalCount,
    attentionFarms: attentionCount,
    healthyFarms: healthyCount,
    totalPendingTasks,
    totalUrgentTasks,
    averageWaterLevel: Math.round(totalWaterLevel / farmCount),
    nextHarvestDays: nearestHarvestDays,
    nextHarvestFarmCount: harvestFarmCount
  }
}

/**
 * Create farm summaries for the portfolio grid
 */
export function createFarmSummaries(farms: Farm[], farmsData: Map<number, any>): FarmSummary[] {
  return farms.map((farm) => {
    const farmData = farmsData.get(farm.id!)
    const metrics = calculateDashboardMetrics(farm, farmData?.pendingTasks, farmData?.alerts)
    const status = getFarmStatus(farm, farmData?.pendingTasks, farmData?.alerts)

    return {
      id: farm.id!,
      name: farm.name,
      location: farm.locationName || farm.region,
      cropVariety: farm.cropVariety,
      totalAcres: farm.area,
      status,
      healthScore: metrics.farmHealthScore,
      waterLevel: metrics.waterLevel,
      pendingTasks: metrics.pendingTotalTasks,
      urgentTasks: metrics.pendingUrgentTasks,
      daysToHarvest: metrics.daysToHarvest,
      seasonPhase: metrics.seasonPhase,
      lastActivity: farmData?.lastActivity,
      hasAlerts: (farmData?.alerts?.length || 0) > 0
    }
  })
}

/**
 * Sort farm summaries by priority
 */
export function sortFarmsByPriority(farms: FarmSummary[]): FarmSummary[] {
  return [...farms].sort((a, b) => {
    // 1. Critical status first
    const statusPriority = { critical: 0, attention: 1, healthy: 2 }
    const statusDiff = statusPriority[a.status] - statusPriority[b.status]
    if (statusDiff !== 0) return statusDiff

    // 2. Urgent tasks count
    const urgentDiff = b.urgentTasks - a.urgentTasks
    if (urgentDiff !== 0) return urgentDiff

    // 3. Health score (lower first within same status)
    return a.healthScore - b.healthScore
  })
}

/**
 * Filter farms by various criteria
 */
export function filterFarms(
  farms: FarmSummary[],
  filters: {
    status?: 'healthy' | 'attention' | 'critical'
    cropType?: string
    minWaterLevel?: number
    maxWaterLevel?: number
    search?: string
  }
): FarmSummary[] {
  return farms.filter((farm) => {
    if (filters.status && farm.status !== filters.status) return false
    if (
      filters.cropType &&
      !farm.cropVariety.toLowerCase().includes(filters.cropType.toLowerCase())
    )
      return false
    if (filters.minWaterLevel && farm.waterLevel < filters.minWaterLevel) return false
    if (filters.maxWaterLevel && farm.waterLevel > filters.maxWaterLevel) return false
    if (
      filters.search &&
      !farm.name.toLowerCase().includes(filters.search.toLowerCase()) &&
      !farm.location.toLowerCase().includes(filters.search.toLowerCase())
    )
      return false
    return true
  })
}

/**
 * Sort farms by different criteria
 */
export function sortFarms(
  farms: FarmSummary[],
  sortBy:
    | 'priority'
    | 'health_asc'
    | 'health_desc'
    | 'water_asc'
    | 'water_desc'
    | 'tasks'
    | 'harvest'
    | 'name'
): FarmSummary[] {
  const sorted = [...farms]

  switch (sortBy) {
    case 'priority':
      return sortFarmsByPriority(sorted)
    case 'health_asc':
      return sorted.sort((a, b) => a.healthScore - b.healthScore)
    case 'health_desc':
      return sorted.sort((a, b) => b.healthScore - a.healthScore)
    case 'water_asc':
      return sorted.sort((a, b) => a.waterLevel - b.waterLevel)
    case 'water_desc':
      return sorted.sort((a, b) => b.waterLevel - a.waterLevel)
    case 'tasks':
      return sorted.sort((a, b) => b.pendingTasks - a.pendingTasks)
    case 'harvest':
      return sorted.sort((a, b) => {
        if (a.daysToHarvest === undefined) return 1
        if (b.daysToHarvest === undefined) return -1
        return a.daysToHarvest - b.daysToHarvest
      })
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    default:
      return sorted
  }
}

/**
 * Get critical alerts across all farms
 */
export interface CriticalAlert {
  farmId: number
  farmName: string
  type: 'pest' | 'water' | 'task' | 'weather' | 'system'
  severity: 'critical' | 'high' | 'medium'
  title: string
  description: string
  actionRequired: boolean
  timestamp: Date
}

export function getCriticalAlerts(farms: Farm[], farmsData: Map<number, any>): CriticalAlert[] {
  const alerts: CriticalAlert[] = []

  farms.forEach((farm) => {
    const farmData = farmsData.get(farm.id!)
    if (!farmData) return

    // Low water alerts
    const waterLevel = farm.totalTankCapacity
      ? ((farm.remainingWater || 0) / farm.totalTankCapacity) * 100
      : 0
    if (waterLevel < 30) {
      alerts.push({
        farmId: farm.id!,
        farmName: farm.name,
        type: 'water',
        severity: waterLevel < 15 ? 'critical' : 'high',
        title: 'Low Water Level',
        description: `Water level at ${Math.round(waterLevel)}%. Irrigation capacity limited.`,
        actionRequired: true,
        timestamp: new Date()
      })
    }

    // Overdue tasks
    const overdueTasks =
      farmData.pendingTasks?.filter(
        (task: any) => !task.completed && new Date(task.due_date) < new Date()
      ) || []
    if (overdueTasks.length >= 3) {
      alerts.push({
        farmId: farm.id!,
        farmName: farm.name,
        type: 'task',
        severity: 'high',
        title: `${overdueTasks.length} Overdue Tasks`,
        description: 'Multiple tasks require immediate attention.',
        actionRequired: true,
        timestamp: new Date()
      })
    }

    // Add alerts from farm data
    if (farmData.alerts?.length > 0) {
      farmData.alerts.forEach((alert: any) => {
        alerts.push({
          farmId: farm.id!,
          farmName: farm.name,
          type: alert.type || 'system',
          severity: alert.severity || 'medium',
          title: alert.title,
          description: alert.description,
          actionRequired: alert.actionRequired || false,
          timestamp: new Date(alert.timestamp || Date.now())
        })
      })
    }
  })

  // Sort by severity and timestamp
  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2 }
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
    if (severityDiff !== 0) return severityDiff
    return b.timestamp.getTime() - a.timestamp.getTime()
  })
}

/**
 * Calculate trend indicator for health score
 */
export function calculateTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
  const diff = current - previous
  if (Math.abs(diff) < 3) return 'stable'
  return diff > 0 ? 'up' : 'down'
}
