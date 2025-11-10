/**
 * Custom hook for fetching and managing dashboard data
 * Optimized with parallel fetching and memoization
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { SupabaseService } from '@/lib/supabase-service'
import { OpenMeteoWeatherService } from '@/lib/open-meteo-weather'
import type { Farm, TaskReminder } from '@/types/types'
import type { FarmWeatherSummary } from '@/components/farm-details/FarmHeader'
import { WEATHER_THRESHOLDS } from '@/constants/weather'
import { logger } from '@/lib/logger'

export interface DashboardData {
  farm: Farm | null
  pendingTasksCount: number
  recentIrrigations: any[]
  recentActivities: any[]
  totalHarvest: number
  totalWaterUsage: number
  pendingTasks: TaskReminder[]
  recordCounts: {
    irrigation: number
    spray: number
    fertigation: number
    harvest: number
    expense: number
    soilTest: number
    petioleTest: number
    dailyNotes: number
  }
}

interface UseDashboardDataResult {
  dashboardData: DashboardData | undefined
  weatherSummary: FarmWeatherSummary | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Fetches weather summary for a farm
 */
async function fetchWeatherSummary(
  latitude: number | null | undefined,
  longitude: number | null | undefined
): Promise<FarmWeatherSummary | null> {
  if (latitude == null || longitude == null) {
    return null
  }

  try {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const dayAfterTomorrow = new Date(today)
    dayAfterTomorrow.setDate(today.getDate() + 2)
    const endDateStr = dayAfterTomorrow.toISOString().split('T')[0]

    const weatherDataArray = await OpenMeteoWeatherService.getWeatherData(
      latitude,
      longitude,
      todayStr,
      endDateStr
    )

    if (weatherDataArray.length > 0) {
      const todayWeather = weatherDataArray[0]
      const temperature =
        typeof todayWeather.temperatureMean === 'number'
          ? Math.round(todayWeather.temperatureMean)
          : null
      const humidity =
        typeof todayWeather.relativeHumidityMean === 'number'
          ? Math.round(todayWeather.relativeHumidityMean)
          : null
      const precipitation =
        typeof todayWeather.precipitationSum === 'number'
          ? Number(todayWeather.precipitationSum.toFixed(1))
          : null

      const condition: FarmWeatherSummary['condition'] =
        precipitation !== null && precipitation > WEATHER_THRESHOLDS.RAIN_MM
          ? 'rain'
          : humidity !== null && humidity > WEATHER_THRESHOLDS.HIGH_HUMIDITY_PERCENT
            ? 'humid'
            : 'clear'

      return {
        temperature,
        humidity,
        precipitation,
        condition
      }
    }
  } catch (error) {
    logger.error('Error fetching weather summary:', error)
  }

  return null
}

/**
 * Custom hook to fetch dashboard data with optimized parallel loading
 */
export function useDashboardData(farmId: number | string | null): UseDashboardDataResult {
  const [dashboardData, setDashboardData] = useState<DashboardData>()
  const [weatherSummary, setWeatherSummary] = useState<FarmWeatherSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const parsedFarmId = useMemo(() => {
    if (typeof farmId === 'number') return farmId
    if (typeof farmId === 'string') {
      const parsed = parseInt(farmId, 10)
      return isNaN(parsed) ? null : parsed
    }
    return null
  }, [farmId])

  const loadData = useCallback(async () => {
    if (!parsedFarmId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch dashboard data first
      const data = await SupabaseService.getDashboardSummary(parsedFarmId)

      setDashboardData({
        ...data,
        farm: data.farm
      })

      // Fetch weather in parallel (non-blocking)
      if (data.farm?.latitude != null && data.farm?.longitude != null) {
        // Don't await - let it load in background
        fetchWeatherSummary(data.farm.latitude, data.farm.longitude).then((weather) => {
          setWeatherSummary(weather)
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data'
      setError(errorMessage)
      logger.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [parsedFarmId])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    dashboardData,
    weatherSummary,
    loading,
    error,
    refetch: loadData
  }
}

/**
 * Memoized calculation helpers for dashboard metrics
 */
export function calculateFarmStatus(
  tasks?: any[],
  alerts?: any[]
): 'healthy' | 'attention' | 'critical' {
  const criticalAlerts = alerts?.filter((alert) => alert.type === 'critical')?.length || 0
  const overdueTasks =
    tasks?.filter((task) => {
      const dueDateValue = task?.dueDate
      if (!dueDateValue || task?.completed) return false
      const dueDate = new Date(dueDateValue)
      if (Number.isNaN(dueDate.getTime())) return false
      return dueDate < new Date()
    })?.length || 0

  if (criticalAlerts > 0 || overdueTasks > 2) return 'critical'
  if (overdueTasks > 0) return 'attention'
  return 'healthy'
}

export function formatNumber(value?: number, digits = 0): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '0'
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value)
}

export function convertLitersToDepthMm(
  liters?: number,
  areaAcres?: number | null
): number | undefined {
  if (
    liters === undefined ||
    liters === null ||
    !Number.isFinite(liters) ||
    liters < 0 ||
    areaAcres === undefined ||
    areaAcres === null ||
    !Number.isFinite(areaAcres) ||
    areaAcres <= 0
  ) {
    return undefined
  }
  const areaInSquareMeters = areaAcres * 4046.8564224
  if (areaInSquareMeters === 0) return undefined
  return liters / areaInSquareMeters
}

export function formatDepthMm(value?: number): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '— mm'
  const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2
  return `${formatNumber(value, digits)} mm`
}
