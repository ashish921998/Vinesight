'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, MapPin } from 'lucide-react'
import { cn, capitalize } from '@/lib/utils'
import { type Farm } from '@/types/types'
import { SupabaseService } from '@/lib/supabase-service'
import { WeatherService, type WeatherData } from '@/lib/weather-service'
import { calculateDashboardMetrics, getFarmStatus } from '@/lib/dashboard-utils'

// Import existing dashboard components
import { QuickStatsCards } from './QuickStatsCards'
import { TodaysTasksSection } from './TodaysTasksSection'
import { AIInsightsCard } from './AIInsightsCard'
import { ActiveSprayScheduleCard } from './ActiveSprayScheduleCard'
import { LiveFarmStatus } from './LiveFarmStatus'
import { MarketInsightsCard } from './MarketInsightsCard'
import { AlertsSection } from './AlertsSection'

interface FarmDetailModalProps {
  farmId: number | null
  open: boolean
  onClose: () => void
  preloadedFarm?: Farm // OPTIMIZED: Accept pre-loaded farm data
  preloadedData?: any // OPTIMIZED: Accept pre-loaded dashboard data
}

export function FarmDetailModal({
  farmId,
  open,
  onClose,
  preloadedFarm,
  preloadedData
}: FarmDetailModalProps) {
  const [loading, setLoading] = useState(true)
  const [farm, setFarm] = useState<Farm | null>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null)

  useEffect(() => {
    if (!farmId || !open) {
      return
    }

    const loadFarmDetails = async () => {
      try {
        setLoading(true)

        // OPTIMIZED: Use preloaded farm if available
        let farmData = preloadedFarm
        if (!farmData) {
          farmData = await SupabaseService.getFarmById(farmId)
          if (!farmData) {
            console.error('Farm not found')
            onClose()
            return
          }
        }
        setFarm(farmData)

        // OPTIMIZED: Use preloaded data if available
        // If preloaded data exists (from portfolio), use it directly
        // Otherwise, fetch full dashboard summary with all records
        let dashboard = preloadedData
        if (!dashboard) {
          // Only fetch full dashboard if not preloaded
          dashboard = await SupabaseService.getDashboardSummary(farmId)
        } else {
          // If we have preloaded data, we already have what we need
          // No need to fetch again - the portfolio already loaded:
          // - pendingTasks
          // - harvestRecords
          // - expenseRecords
          console.log('Using preloaded dashboard data - 0 API calls!')
        }
        setDashboardData(dashboard)

        // Calculate metrics
        const metrics = calculateDashboardMetrics(
          farmData,
          dashboard?.pendingTasks,
          dashboard?.alerts
        )
        setDashboardMetrics(metrics)

        // Load weather data (only fetch when modal opens, not on portfolio load)
        if (farmData.latitude && farmData.longitude) {
          const weather = await WeatherService.getCurrentWeather(
            farmData.latitude,
            farmData.longitude
          )
          setWeatherData(weather)
        }
      } catch (error) {
        console.error('Error loading farm details:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFarmDetails()
  }, [farmId, open, onClose, preloadedFarm, preloadedData])

  const handleTaskComplete = async (taskId: string) => {
    try {
      await SupabaseService.completeTask(parseInt(taskId))
      // Refresh only pending tasks (lightweight update)
      if (farmId) {
        const pendingTasks = await SupabaseService.getPendingTasks(farmId)
        setDashboardData((prev: any) => ({
          ...prev,
          pendingTasks,
          pendingTasksCount: pendingTasks.length
        }))
      }
    } catch (error) {
      console.error('Error completing task:', error)
    }
  }

  const farmInfo = farm
    ? {
        id: farm.id?.toString() || '',
        name: capitalize(farm.name),
        location: farm.locationName || farm.region,
        crop: farm.crop,
        cropVariety: farm.cropVariety,
        totalAcres: farm.area,
        status: getFarmStatus(farm, dashboardData?.pendingTasks, dashboardData?.alerts) as
          | 'healthy'
          | 'attention'
          | 'critical'
      }
    : null

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 border-green-200 text-green-800'
      case 'attention':
        return 'bg-amber-100 border-amber-200 text-amber-800'
      case 'critical':
        return 'bg-red-100 border-red-200 text-red-800'
      default:
        return 'bg-primary/10 border-primary/20 text-primary'
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold mb-2">
                {farm ? capitalize(farm.name) : 'Loading...'}
              </DialogTitle>
              {farmInfo && (
                <div
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm',
                    getStatusColor(farmInfo.status)
                  )}
                >
                  <div
                    className={cn('w-2 h-2 rounded-full', {
                      'bg-green-600': farmInfo.status === 'healthy',
                      'bg-amber-600': farmInfo.status === 'attention',
                      'bg-red-600': farmInfo.status === 'critical'
                    })}
                  />
                  <MapPin className="h-3 w-3" />
                  <span>{farmInfo.location}</span>
                  <span>•</span>
                  <span>{farmInfo.cropVariety}</span>
                  <span>•</span>
                  <span>{farmInfo.totalAcres} AC</span>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto px-6 py-4 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              {/* Weather Summary */}
              {weatherData && (
                <div className="px-4 py-3 bg-primary/5 rounded-lg border">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{weatherData.current.temperature}°C</span>
                        <span className="text-muted-foreground">
                          {weatherData.current.condition}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">💧</span>
                        <span>{weatherData.current.humidity}%</span>
                      </div>
                      {weatherData.current.precipitation > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">🌧️</span>
                          <span>{weatherData.current.precipitation}mm</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <QuickStatsCards
                farmHealthScore={dashboardMetrics?.farmHealthScore}
                waterLevel={dashboardMetrics?.waterLevel}
                daysToHarvest={dashboardMetrics?.daysToHarvest}
                pendingUrgentTasks={dashboardMetrics?.pendingUrgentTasks}
                pendingTotalTasks={dashboardMetrics?.pendingTotalTasks}
                seasonPhase={dashboardMetrics?.seasonPhase}
                loading={!dashboardData}
              />

              {/* Today's Tasks */}
              <TodaysTasksSection
                tasks={
                  dashboardData?.pendingTasks?.map((task: any) => ({
                    id: task.id.toString(),
                    title: task.title,
                    type: task.category || 'maintenance',
                    priority: task.priority || 'medium',
                    scheduledTime: task.due_date
                      ? new Date(task.due_date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : undefined,
                    farmBlock: task.location || (farm ? capitalize(farm.name) : ''),
                    estimatedDuration: task.estimated_duration || 60,
                    completed: task.completed || false,
                    description: task.description
                  })) || []
                }
                onTaskComplete={handleTaskComplete}
                onTaskAction={(taskId) => console.log('Task action:', taskId)}
                onAddTask={() => console.log('Add task')}
                loading={!dashboardData}
                farmName={farmInfo?.name}
              />

              {/* AI Insights */}
              <AIInsightsCard farmId={farmId || undefined} loading={!dashboardData} />

              {/* Active Spray Schedule */}
              <ActiveSprayScheduleCard
                farmId={farmId || undefined}
                tasks={dashboardData?.pendingTasks}
                loading={!dashboardData}
                onStartSpray={(sprayId) => console.log('Start spray:', sprayId)}
                onScheduleSpray={() => console.log('Schedule new spray')}
              />

              {/* Farm Status */}
              <LiveFarmStatus
                weather={
                  weatherData
                    ? {
                        temperature: weatherData.current.temperature,
                        humidity: weatherData.current.humidity,
                        precipitation: weatherData.current.precipitation,
                        windSpeed: weatherData.current.windSpeed,
                        condition: weatherData.current.condition
                      }
                    : undefined
                }
                soil={undefined}
                water={
                  farm
                    ? {
                        currentLevel: Math.round(
                          ((farm.remainingWater || 0) / (farm.totalTankCapacity || 1000)) * 100
                        ),
                        dailyUsage: 0,
                        weeklyTarget: farm.totalTankCapacity || 0,
                        weeklyUsed: dashboardData?.totalWaterUsage || 0,
                        efficiency: 85
                      }
                    : undefined
                }
                growth={{
                  stage: 'Growing Season',
                  progress: 60,
                  healthScore: dashboardMetrics?.farmHealthScore || 0,
                  expectedHarvest: new Date(new Date().getTime() + 90 * 24 * 60 * 60 * 1000),
                  daysToHarvest: dashboardMetrics?.daysToHarvest || 90
                }}
                financial={undefined}
                loading={!dashboardData}
                farmName={farmInfo?.name}
              />

              {/* Market Insights */}
              <MarketInsightsCard
                farmId={farmId || undefined}
                grapeVariety={farm?.cropVariety}
                region={farm?.region || farm?.locationName}
                loading={!dashboardData}
              />

              {/* Alerts */}
              <AlertsSection
                alerts={dashboardData?.alerts || []}
                onAlertAction={(alertId) => console.log('Alert action:', alertId)}
                loading={!dashboardData}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
