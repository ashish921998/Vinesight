import { type Farm } from '@/types/types'

/**
 * Dashboard utility functions for calculating farm metrics and health scores
 */

export interface DashboardMetrics {
  farmHealthScore: number // 0-100
  waterLevel: number // percentage
  daysToHarvest?: number
  pendingUrgentTasks: number
  pendingTotalTasks: number
  seasonPhase?: 'germination' | 'flowering' | 'veraison' | 'ripening' | 'harvest' | 'dormant'
}

/**
 * Calculate farm health score based on multiple factors
 * @param farm - Farm data
 * @param tasks - Array of tasks
 * @param alerts - Array of alerts
 * @returns Health score from 0-100
 */
export function calculateFarmHealthScore(farm: Farm, tasks?: any[], alerts?: any[]): number {
  let score = 100

  // Deduct points for overdue tasks (max -30 points)
  const overdueTasks =
    tasks?.filter((task) => !task.completed && new Date(task.due_date) < new Date()) || []
  score -= Math.min(overdueTasks.length * 5, 30)

  // Deduct points for critical alerts (max -20 points)
  const criticalAlerts = alerts?.filter((alert) => alert.severity === 'critical') || []
  score -= Math.min(criticalAlerts.length * 10, 20)

  // Deduct points for low water level (max -15 points)
  const waterPercentage = farm.totalTankCapacity
    ? ((farm.remainingWater || 0) / farm.totalTankCapacity) * 100
    : 100
  if (waterPercentage < 30) {
    score -= 15
  } else if (waterPercentage < 60) {
    score -= 8
  }

  // Deduct points for high pending task count (max -15 points)
  const pendingTasks = tasks?.filter((task) => !task.completed) || []
  if (pendingTasks.length > 10) {
    score -= 15
  } else if (pendingTasks.length > 5) {
    score -= 8
  }

  // Ensure score is within 0-100 range
  return Math.max(0, Math.min(100, score))
}

/**
 * Calculate water level percentage
 * @param farm - Farm data
 * @returns Water level percentage (0-100)
 */
export function calculateWaterLevel(farm: Farm): number {
  if (!farm.totalTankCapacity || farm.totalTankCapacity === 0) {
    return 0
  }
  const percentage = ((farm.remainingWater || 0) / farm.totalTankCapacity) * 100
  return Math.max(0, Math.min(100, percentage))
}

/**
 * Calculate days to harvest based on planting date and grape variety
 * @param farm - Farm data
 * @returns Days until harvest or undefined if not calculable
 */
export function calculateDaysToHarvest(farm: Farm): number | undefined {
  // If no planting date, cannot calculate
  if (!farm.plantingDate) {
    return undefined
  }

  const plantingDate = new Date(farm.plantingDate)
  const today = new Date()
  const daysSincePlanting = Math.floor(
    (today.getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Typical growing periods for different grape varieties (in days)
  const growingPeriods: Record<string, number> = {
    'thompson seedless': 120,
    'sharad seedless': 110,
    'flame seedless': 115,
    'crimson seedless': 125,
    sonaka: 120,
    default: 120
  }

  // Get growing period for the variety (case-insensitive match)
  const variety = farm.cropVariety?.toLowerCase() || ''
  const growingPeriod =
    Object.entries(growingPeriods).find(([key]) => variety.includes(key))?.[1] ||
    growingPeriods.default

  const daysToHarvest = growingPeriod - daysSincePlanting

  // If already past harvest period, return 0
  if (daysToHarvest < 0) {
    return 0
  }

  return daysToHarvest
}

/**
 * Determine current season phase based on planting date
 * @param farm - Farm data
 * @returns Current season phase
 */
export function calculateSeasonPhase(
  farm: Farm
): 'germination' | 'flowering' | 'veraison' | 'ripening' | 'harvest' | 'dormant' {
  if (!farm.plantingDate) {
    return 'dormant'
  }

  const plantingDate = new Date(farm.plantingDate)
  const today = new Date()
  const daysSincePlanting = Math.floor(
    (today.getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Typical phase durations for grapes (in days from planting)
  if (daysSincePlanting < 0) {
    return 'dormant'
  } else if (daysSincePlanting < 30) {
    return 'germination'
  } else if (daysSincePlanting < 60) {
    return 'flowering'
  } else if (daysSincePlanting < 90) {
    return 'veraison'
  } else if (daysSincePlanting < 120) {
    return 'ripening'
  } else if (daysSincePlanting < 150) {
    return 'harvest'
  } else {
    return 'dormant'
  }
}

/**
 * Count urgent and total pending tasks
 * @param tasks - Array of tasks
 * @returns Object with urgent and total task counts
 */
export function countPendingTasks(tasks?: any[]): { urgent: number; total: number } {
  if (!tasks || tasks.length === 0) {
    return { urgent: 0, total: 0 }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const pending = tasks.filter((task) => !task.completed)
  const urgent = pending.filter((task) => {
    const dueDate = new Date(task.due_date)
    dueDate.setHours(0, 0, 0, 0)
    return dueDate < today
  })

  return {
    urgent: urgent.length,
    total: pending.length
  }
}

/**
 * Calculate all dashboard metrics at once
 * @param farm - Farm data
 * @param tasks - Array of tasks
 * @param alerts - Array of alerts
 * @returns Complete dashboard metrics
 */
export function calculateDashboardMetrics(
  farm: Farm,
  tasks?: any[],
  alerts?: any[]
): DashboardMetrics {
  const taskCounts = countPendingTasks(tasks)

  return {
    farmHealthScore: calculateFarmHealthScore(farm, tasks, alerts),
    waterLevel: calculateWaterLevel(farm),
    daysToHarvest: calculateDaysToHarvest(farm),
    pendingUrgentTasks: taskCounts.urgent,
    pendingTotalTasks: taskCounts.total,
    seasonPhase: calculateSeasonPhase(farm)
  }
}

/**
 * Get farm status based on health score and alerts
 * @param farm - Farm data
 * @param tasks - Array of tasks
 * @param alerts - Array of alerts
 * @returns Farm status: 'healthy' | 'attention' | 'critical'
 */
export function getFarmStatus(
  farm: Farm,
  tasks?: any[],
  alerts?: any[]
): 'healthy' | 'attention' | 'critical' {
  const criticalAlerts = alerts?.filter((alert) => alert.type === 'critical')?.length || 0
  const overdueTasks =
    tasks?.filter((task) => !task.completed && new Date(task.due_date) < new Date())?.length || 0

  if (criticalAlerts > 0 || overdueTasks > 2) return 'critical'
  if (overdueTasks > 0) return 'attention'
  return 'healthy'
}
