'use client'

import { useState, useEffect } from 'react'
import { AlertsSection } from './AlertsSection'
import { TodaysTasksSection } from './TodaysTasksSection'
import { LiveFarmStatus } from './LiveFarmStatus'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MapPin, AlertTriangle, Plus } from 'lucide-react'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { SupabaseService } from '@/lib/supabase-service'
import { WeatherService, type WeatherData } from '@/lib/weather-service'
import { type Farm } from '@/types/types'
import { capitalize } from '@/lib/utils'

// Helper function to calculate farm health status based on real data
const calculateFarmStatus = (
  farm: Farm,
  tasks?: any[],
  alerts?: any[],
): 'healthy' | 'attention' | 'critical' => {
  const criticalAlerts = alerts?.filter((alert) => alert.type === 'critical')?.length || 0
  const overdueTasks =
    tasks?.filter((task) => !task.completed && new Date(task.due_date) < new Date())?.length || 0

  if (criticalAlerts > 0 || overdueTasks > 2) return 'critical'
  if (overdueTasks > 0) return 'attention'
  return 'healthy'
}

interface FarmInfo {
  id: string
  name: string
  location: string
  cropType: string
  totalAcres: number
  status: 'healthy' | 'attention' | 'critical'
}

interface FarmerDashboardProps {
  className?: string
}

export function FarmerDashboard({ className }: FarmerDashboardProps) {
  const { user, loading: authLoading } = useSupabaseAuth()
  const [loading, setLoading] = useState(true)
  const [farms, setFarms] = useState<Farm[]>([])
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Get selected farm info
  const selectedFarm = farms.find((farm) => farm.id === selectedFarmId)
  const farmInfo = selectedFarm
    ? {
        id: selectedFarm.id?.toString() || '',
        name: capitalize(selectedFarm.name),
        location: selectedFarm.locationName || selectedFarm.region,
        cropType: selectedFarm.grapeVariety,
        totalAcres: selectedFarm.area,
        status: calculateFarmStatus(
          selectedFarm,
          dashboardData?.pendingTasks,
          dashboardData?.alerts,
        ) as 'healthy' | 'attention' | 'critical',
      }
    : null

  // Load farms when user is authenticated
  useEffect(() => {
    const loadFarms = async () => {
      if (authLoading) return

      if (!user) {
        setError('Please sign in to view your farms')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const userFarms = await SupabaseService.getAllFarms()
        setFarms(userFarms)

        // Select first farm by default
        if (userFarms.length > 0) {
          setSelectedFarmId(userFarms[0].id!)
        } else {
          setError('No farms found. Please add a farm first.')
        }
      } catch (err) {
        console.error('Error loading farms:', err)
        setError('Failed to load farms')
      } finally {
        setLoading(false)
      }
    }

    loadFarms()
  }, [user, authLoading])

  // Load dashboard data when farm is selected
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!selectedFarmId) return

      try {
        const data = await SupabaseService.getDashboardSummary(selectedFarmId)
        setDashboardData(data)
      } catch (err) {
        console.error('Error loading dashboard data:', err)
        // Continue with empty data rather than failing completely
        setDashboardData({
          pendingTasks: [],
          alerts: [],
          weather: null,
          soil: null,
          water: null,
          growth: null,
          financial: null,
        })
      }
    }

    loadDashboardData()
  }, [selectedFarmId])

  // Load weather data when farm is selected
  useEffect(() => {
    const loadWeatherData = async () => {
      if (!selectedFarm) return

      try {
        const weather = await WeatherService.getCurrentWeather(
          selectedFarm.latitude,
          selectedFarm.longitude,
        )
        setWeatherData(weather)
      } catch (err) {
        console.error('Error loading weather data:', err)
        // Continue without weather data rather than failing
        setWeatherData(null)
      }
    }

    loadWeatherData()
  }, [selectedFarm])

  const handleFarmChange = (farmIdStr: string) => {
    const farmId = parseInt(farmIdStr)
    setSelectedFarmId(farmId)
  }

  const handleAlertAction = (alertId: string) => {
    console.log('Alert action:', alertId)
    // Handle alert actions (navigate to specific screens, start workflows, etc.)
  }

  const handleTaskComplete = async (taskId: string) => {
    try {
      await SupabaseService.completeTask(parseInt(taskId))
      // Refresh dashboard data
      if (selectedFarmId) {
        const data = await SupabaseService.getDashboardSummary(selectedFarmId)
        setDashboardData(data)
      }
    } catch (err) {
      console.error('Error completing task:', err)
    }
  }

  const handleTaskAction = (taskId: string) => {
    console.log('Task action:', taskId)
    // Handle task actions (open task details, start workflow, etc.)
  }

  const handleAddTask = () => {
    console.log('Add new task')
    // Navigate to add task screen
  }

  // Get status color for farm identification
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

  // Show loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-6">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Dashboard Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  // Show no farms state
  if (farms.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-6xl mb-4">🌱</div>
          <h2 className="text-lg font-semibold mb-2">No Farms Found</h2>
          <p className="text-muted-foreground mb-4">
            Add your first farm to start tracking your agricultural data
          </p>
          <Button onClick={() => (window.location.href = '/farms')}>Add Your First Farm</Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-background touch-manipulation select-none ${className}`}>
      {/* Mobile-First Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border">
        {/* Top row with title and farm selector */}
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-foreground">🍇 VineSight</h1>

          <div className="flex items-center gap-2">
            <Select value={selectedFarmId?.toString() || ''} onValueChange={handleFarmChange}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Select farm" />
              </SelectTrigger>
              <SelectContent>
                {farms.map((farm) => {
                  const status = calculateFarmStatus(
                    farm,
                    dashboardData?.pendingTasks,
                    dashboardData?.alerts,
                  )
                  return (
                    <SelectItem key={farm.id} value={farm.id!.toString()}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            status === 'healthy'
                              ? 'bg-green-500'
                              : status === 'attention'
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                          }`}
                        />
                        <span>{capitalize(farm.name)}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Farm Identification Section */}
        {farmInfo && (
          <div className={`mx-4 mb-2 p-3 rounded-lg border-2 ${getStatusColor(farmInfo.status)}`}>
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  farmInfo.status === 'healthy'
                    ? 'bg-green-500'
                    : farmInfo.status === 'attention'
                      ? 'bg-amber-500'
                      : farmInfo.status === 'critical'
                        ? 'bg-red-500'
                        : 'bg-primary'
                }`}
              />
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-base truncate">{capitalize(farmInfo.name)}</h2>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{farmInfo.location}</span>
                  <span>•</span>
                  <span className="flex-shrink-0">{farmInfo.cropType}</span>
                  <span>•</span>
                  <span className="flex-shrink-0">{farmInfo.totalAcres} acres</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Weather Summary Bar */}
        {weatherData && (
          <div className="px-4 py-2 bg-primary/5 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <span className="font-medium">{weatherData.current.temperature}°C</span>
                  <span className="text-muted-foreground">{weatherData.current.condition}</span>
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
      </div>

      {/* Mobile-First Dashboard Content */}
      <div className="pb-20">
        {' '}
        {/* Extra bottom padding for mobile navigation */}
        {/* Critical Alerts Banner - Always visible if present */}
        {dashboardData?.pendingTasks?.filter(
          (task: any) => !task.completed && new Date(task.due_date) < new Date(),
        ).length > 0 && (
          <div className="bg-red-50 border-l-4 border-l-red-500 px-4 py-3 mx-4 mt-4 rounded-r-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                {
                  dashboardData.pendingTasks.filter(
                    (task: any) => !task.completed && new Date(task.due_date) < new Date(),
                  ).length
                }{' '}
                Overdue Task(s)
              </span>
            </div>
          </div>
        )}
        {/* Enhanced Farm Status Overview - Expanded */}
        <div className="px-4 py-4">
          <LiveFarmStatus
            weather={
              weatherData
                ? {
                    temperature: weatherData.current.temperature,
                    humidity: weatherData.current.humidity,
                    precipitation: weatherData.current.precipitation,
                    windSpeed: weatherData.current.windSpeed,
                    condition: weatherData.current.condition,
                  }
                : undefined
            }
            soil={undefined} // Real-time soil data would come from sensors
            water={
              selectedFarm
                ? {
                    currentLevel: Math.round(
                      ((selectedFarm.remainingWater || 0) /
                        (selectedFarm.totalTankCapacity || 1000)) *
                        100,
                    ),
                    dailyUsage: 0, // Calculate from recent irrigation records
                    weeklyTarget: selectedFarm.totalTankCapacity || 0,
                    weeklyUsed: dashboardData?.totalWaterUsage || 0,
                    efficiency: 85, // Could be calculated from system efficiency
                  }
                : undefined
            }
            growth={{
              stage: 'Growing Season', // Could be calculated based on planting date
              progress: 60,
              healthScore: 85,
              expectedHarvest: new Date(new Date().getTime() + 90 * 24 * 60 * 60 * 1000),
              daysToHarvest: 90,
            }}
            financial={undefined} // Would be calculated from harvest and expense records
            loading={!dashboardData}
            farmName={farmInfo?.name}
          />
        </div>
        {/* Today's Tasks - Prominent Position */}
        <div className="px-4 py-2">
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
                      minute: '2-digit',
                    })
                  : undefined,
                farmBlock: task.location || (selectedFarm ? capitalize(selectedFarm.name) : ''),
                estimatedDuration: task.estimated_duration || 60,
                completed: task.completed || false,
                description: task.description,
              })) || []
            }
            onTaskComplete={handleTaskComplete}
            onTaskAction={handleTaskAction}
            onAddTask={handleAddTask}
            loading={!dashboardData}
            farmName={farmInfo?.name}
          />
        </div>
        {/* All Alerts - Expandable */}
        <div className="px-4 py-2">
          <AlertsSection
            alerts={[]} // Alerts would come from monitoring systems, notifications, etc.
            onAlertAction={handleAlertAction}
            loading={!dashboardData}
          />
        </div>
        {/* Bottom Safe Area */}
        <div className="h-8" />
      </div>
    </div>
  )
}
