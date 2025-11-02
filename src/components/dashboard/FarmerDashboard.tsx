'use client'

import { useState, useEffect } from 'react'
import { AlertsSection } from './AlertsSection'
import { TodaysTasksSection } from './TodaysTasksSection'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { LucideIcon } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Droplet,
  Sprout,
  BarChart2,
  Sparkles,
  NotebookPen,
  ShieldAlert,
  CalendarClock,
  Activity,
  CalendarDays,
  History,
  Sun,
  SprayCan,
  FlaskConical,
  Wheat,
  Wallet,
  TestTube,
  Droplets,
  Plus,
  Trash2,
  Edit
} from 'lucide-react'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { SupabaseService } from '@/lib/supabase-service'
import { WeatherService, type WeatherData } from '@/lib/weather-service'
import { type Farm } from '@/types/types'
import { capitalize, cn } from '@/lib/utils'
import { EmptyStateDashboard } from './EmptyStateDashboard'
import { useRouter } from 'next/navigation'

// Helper function to calculate farm health status based on real data
const calculateFarmStatus = (
  farm: Farm,
  tasks?: any[],
  alerts?: any[]
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
  cropVariety: string
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
  const router = useRouter()
  // Get selected farm info
  const selectedFarm = farms.find((farm) => farm.id === selectedFarmId)
  const farmInfo = selectedFarm
    ? {
        id: selectedFarm.id?.toString() || '',
        name: capitalize(selectedFarm.name),
        location: selectedFarm.locationName || selectedFarm.region,
        crop: selectedFarm.crop,
        cropVariety: selectedFarm.cropVariety,
        totalAcres: selectedFarm.area,
        status: calculateFarmStatus(
          selectedFarm,
          dashboardData?.pendingTasks,
          dashboardData?.alerts
        ) as 'healthy' | 'attention' | 'critical'
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
          financial: null
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
          selectedFarm.longitude
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
    // Handle alert action
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
    // Handle task action
    // Handle task actions (open task details, start workflow, etc.)
  }

  const handleAddTask = () => {
    // Add new task
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

  if (farms.length === 0) {
    return (
      <EmptyStateDashboard
        userName={user?.email?.split('@')[0]}
        onCreateFarm={() => router.push('/farms')}
      />
    )
  }

  const pendingTasks = dashboardData?.pendingTasks ?? []
  const overdueTasks = pendingTasks.filter(
    (task: any) => !task.completed && new Date(task.due_date) < new Date()
  )
  const todaysTasks = pendingTasks.filter((task: any) => {
    if (!task.due_date) return false
    const dueDate = new Date(task.due_date)
    const now = new Date()
    return (
      dueDate.getDate() === now.getDate() &&
      dueDate.getMonth() === now.getMonth() &&
      dueDate.getFullYear() === now.getFullYear()
    )
  })
  const alerts = ((dashboardData as { alerts?: any[] } | null)?.alerts ?? []) as any[]
  const recentActivities = dashboardData?.recentActivities ?? []
  const totalRecords = dashboardData?.recordCounts
    ? (Object.values(dashboardData.recordCounts) as number[]).reduce(
        (sum, count) => sum + (Number.isFinite(count) ? Number(count) : 0),
        0
      )
    : 0

  const formatNumber = (value?: number, digits = 0) => {
    if (value === undefined || value === null || Number.isNaN(value)) return '0'
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(value)
  }

  const convertLitersToDepthMm = (liters?: number, areaAcres?: number | null) => {
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

  const formatDepthMm = (value?: number) => {
    if (value === undefined || value === null || Number.isNaN(value)) return '— mm'
    const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2
    return `${formatNumber(value, digits)} mm`
  }

  const totalWaterUsageLiters =
    dashboardData?.totalWaterUsage !== undefined && dashboardData?.totalWaterUsage !== null
      ? dashboardData.totalWaterUsage
      : undefined
  const totalWaterUsageMm = convertLitersToDepthMm(totalWaterUsageLiters, selectedFarm?.area)

  const insights: Array<{
    title: string
    description: string
    icon: LucideIcon
    tone: 'positive' | 'warning' | 'info'
  }> = []

  if (overdueTasks.length > 0) {
    insights.push({
      title: 'Prioritize overdue work',
      description: `You have ${overdueTasks.length} task${
        overdueTasks.length > 1 ? 's' : ''
      } past due. Reassign crew or adjust irrigation windows to close the gaps.`,
      icon: ShieldAlert,
      tone: 'warning'
    })
  } else if (pendingTasks.length > 0) {
    insights.push({
      title: 'Great task momentum',
      description: `${pendingTasks.length} active task${
        pendingTasks.length > 1 ? 's' : ''
      } scheduled. Keep the pace to stay harvest-ready.`,
      icon: CheckCircle2,
      tone: 'positive'
    })
  } else {
    insights.push({
      title: 'No pending tasks',
      description: 'All scheduled activities are complete. Use the window to audit records.',
      icon: CheckCircle2,
      tone: 'positive'
    })
  }

  if (weatherData) {
    insights.push({
      title:
        weatherData.current.precipitation > 0
          ? 'Rain window detected'
          : `Currently ${weatherData.current.temperature}°C`,
      description:
        weatherData.current.precipitation > 0
          ? 'Delay irrigation to harness natural rainfall and protect soil health.'
          : `Humidity at ${weatherData.current.humidity}%. Plan spray jobs for early mornings.`,
      icon: Sparkles,
      tone: 'info'
    })
  }

  if (selectedFarm && selectedFarm.remainingWater !== undefined) {
    const waterLevelPercent =
      selectedFarm.totalTankCapacity && selectedFarm.totalTankCapacity > 0
        ? Math.round(
            ((selectedFarm.remainingWater || 0) / (selectedFarm.totalTankCapacity || 1)) * 100
          )
        : null
    insights.push({
      title: 'Water reserves check',
      description:
        waterLevelPercent !== null
          ? `Tank at ${waterLevelPercent}% capacity. ${
              waterLevelPercent < 35
                ? 'Schedule a refill before the next irrigation sequence.'
                : 'Enough buffer for the next irrigation round.'
            }`
          : 'Track tank levels to unlock precise refill recommendations.',
      icon: Droplet,
      tone: waterLevelPercent !== null && waterLevelPercent < 35 ? 'warning' : 'info'
    })
  }

  const curatedInsights = insights.slice(0, 3)

  const growthData = dashboardData?.growth as
    | {
        stage?: string
        progress?: number
        healthScore?: number
        daysToHarvest?: number
        expectedHarvest?: string | Date
      }
    | undefined

  const expectedHarvestDate =
    growthData?.expectedHarvest instanceof Date
      ? growthData.expectedHarvest
      : typeof growthData?.expectedHarvest === 'string'
        ? new Date(growthData.expectedHarvest)
        : typeof growthData?.daysToHarvest === 'number'
          ? new Date(Date.now() + growthData.daysToHarvest * 24 * 60 * 60 * 1000)
          : undefined

  const growthMetrics =
    growthData &&
    typeof growthData.stage === 'string' &&
    typeof growthData.progress === 'number' &&
    typeof growthData.healthScore === 'number' &&
    typeof growthData.daysToHarvest === 'number' &&
    expectedHarvestDate instanceof Date &&
    !Number.isNaN(expectedHarvestDate.getTime())
      ? {
          stage: growthData.stage,
          progress: growthData.progress,
          healthScore: growthData.healthScore,
          expectedHarvest: expectedHarvestDate,
          daysToHarvest: growthData.daysToHarvest
        }
      : undefined

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const endOfTomorrow = new Date(startOfToday)
  endOfTomorrow.setDate(endOfTomorrow.getDate() + 2)

  const tasksDueSoon = (dashboardData?.pendingTasks ?? []).filter((task: any) => {
    if (!task?.due_date) return false
    const dueDate = new Date(task.due_date)
    if (Number.isNaN(dueDate.getTime())) return false
    return dueDate >= startOfToday && dueDate < endOfTomorrow
  })

  const highPriorityAlerts = alerts.filter(
    (alert) => alert?.type === 'critical' || alert?.type === 'warning'
  )

  const infoAlerts = alerts.filter((alert) => alert?.type === 'info')

  const twoDaysAgo = new Date(startOfToday)
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

  const recentActivityWindow = recentActivities
    .filter((activity: any) => {
      const rawDate = activity?.created_at || activity?.date
      if (!rawDate) return false
      const activityDate = new Date(rawDate)
      if (Number.isNaN(activityDate.getTime())) return false
      return activityDate >= twoDaysAgo
    })
    .slice(0, 4)

  const highlightTiles: Array<{
    id: string
    title: string
    label: string
    body: string
    icon: LucideIcon
    accent: string
    emphasis?: string
  }> = []

  if (tasksDueSoon.length > 0) {
    const urgent = tasksDueSoon.filter((task: any) => {
      if (!task?.due_date) return false
      const dueDate = new Date(task.due_date)
      const todayCutoff = new Date(startOfToday)
      todayCutoff.setDate(todayCutoff.getDate() + 1)
      return dueDate < todayCutoff
    }).length

    highlightTiles.push({
      id: 'tasks',
      title: `${tasksDueSoon.length} task${tasksDueSoon.length > 1 ? 's' : ''}`,
      label: 'Due soon',
      body: urgent > 0 ? `${urgent} need attention today` : `All scheduled within 48 hours`,
      icon: CalendarDays,
      accent: 'from-amber-200/50 via-background to-transparent',
      emphasis: urgent > 0 ? 'text-red-600' : 'text-primary'
    })
  }

  if (highPriorityAlerts.length > 0) {
    highlightTiles.push({
      id: 'alerts',
      title: `${highPriorityAlerts.length} alert${highPriorityAlerts.length > 1 ? 's' : ''}`,
      label: 'Immediate',
      body: highPriorityAlerts[0]?.title || 'Check alert centre',
      icon: ShieldAlert,
      accent: 'from-red-200/60 via-background to-transparent',
      emphasis: 'text-red-600'
    })
  } else if (infoAlerts.length > 0) {
    highlightTiles.push({
      id: 'ai-insight',
      title: 'AI insight',
      label: 'Recommendation',
      body: infoAlerts[0]?.title || 'New advisory available',
      icon: Sparkles,
      accent: 'from-primary/15 via-background to-transparent',
      emphasis: 'text-primary'
    })
  }

  if (weatherData) {
    const weatherParts = [
      `Humidity ${weatherData.current.humidity}%`,
      `Wind ${weatherData.current.windSpeed} km/h`
    ]
    if (weatherData.current.precipitation > 0) {
      weatherParts.push(`${weatherData.current.precipitation}mm rain`)
    }
    highlightTiles.push({
      id: 'weather',
      title: `${weatherData.current.temperature}°C`,
      label: weatherData.current.condition || 'Weather',
      body: weatherParts.join(' • '),
      icon: Sun,
      accent: 'from-sky-200/50 via-background to-transparent',
      emphasis: 'text-sky-600'
    })
  }

  if (recentActivityWindow.length > 0) {
    const mostRecent = recentActivityWindow[0]
    const activityMeta = getActivityPresentation(mostRecent)
    highlightTiles.push({
      id: 'activity',
      title: activityMeta.title,
      label: 'Last 48h',
      body: activityMeta.detail,
      icon: activityMeta.icon,
      accent: 'from-emerald-200/40 via-background to-transparent',
      emphasis: activityMeta.iconClass
    })
  }

  if (highlightTiles.length === 0) {
    highlightTiles.push({
      id: 'calm',
      title: 'Everything steady',
      label: 'Status',
      body: 'No urgent jobs or alerts right now.',
      icon: CheckCircle2,
      accent: 'from-primary/15 via-background to-transparent',
      emphasis: 'text-primary'
    })
  }

  const metricTiles: Array<{
    id: string
    title: string
    label: string
    body: string
    icon: LucideIcon
    accent: string
    emphasis: string
  }> = [
    {
      id: 'metric-tasks',
      title: `${pendingTasks.length}`,
      label: 'Active tasks',
      body:
        overdueTasks.length > 0
          ? `${overdueTasks.length} overdue • ${todaysTasks.length} today`
          : todaysTasks.length > 0
            ? `${todaysTasks.length} scheduled today`
            : 'All on track',
      icon: CalendarClock,
      accent: 'from-primary/20 via-primary/5 to-transparent',
      emphasis: 'text-primary'
    },
    {
      id: 'metric-harvest',
      title: `${formatNumber(dashboardData?.totalHarvest ?? 0)}`,
      label: 'Harvest to date',
      body: 'Kg captured this season',
      icon: Sprout,
      accent: 'from-emerald-100/40 via-background to-transparent',
      emphasis: 'text-emerald-600'
    },
    {
      id: 'metric-water',
      title: formatDepthMm(totalWaterUsageMm),
      label: 'Water usage',
      body:
        selectedFarm?.area && totalWaterUsageMm !== undefined
          ? `Across ${formatNumber(selectedFarm.area, selectedFarm.area >= 10 ? 0 : 1)} acre${selectedFarm.area > 1 ? 's' : ''}`
          : 'Cumulative irrigation depth',
      icon: Droplet,
      accent: 'from-sky-100/50 via-background to-transparent',
      emphasis: 'text-sky-600'
    }
  ]

  metricTiles.forEach((tile) => highlightTiles.push(tile))

  const handleOpenFarm = () => {
    if (farmInfo) {
      router.push(`/farms/${farmInfo.id}`)
    }
  }

  const handleOpenLogs = () => {
    if (farmInfo) {
      router.push(`/farms/${farmInfo.id}/logs`)
    }
  }

  const handleAddLog = () => {
    if (!farmInfo) return
    router.push(`/farms/${farmInfo.id}?action=add-log`)
  }

  const handleEditRecord = (activity: any) => {
    if (!farmInfo || !activity?.id) return
    const params = new URLSearchParams({ action: 'edit-log', logId: String(activity.id) })
    router.push(`/farms/${farmInfo.id}?${params.toString()}`)
  }

  const handleDeleteRecord = (activity: any) => {
    if (!farmInfo || !activity?.id) return
    const params = new URLSearchParams({ action: 'delete-log', logId: String(activity.id) })
    router.push(`/farms/${farmInfo.id}?${params.toString()}`)
  }

  const formatRelativeTime = (date: Date) => {
    const diffMs = Date.now() - date.getTime()
    const diffMinutes = Math.round(diffMs / 60000)
    const absMinutes = Math.max(Math.abs(diffMinutes), 1)
    if (absMinutes < 60) return `${absMinutes}m ago`
    const diffHours = Math.round(absMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.round(diffHours / 24)
    return `${diffDays}d ago`
  }

  function getActivityPresentation(activity: any) {
    const type = activity?.type
    let title = activity?.title
    if (type === 'irrigation') {
      title = `${activity.duration} Hrs`
    }
    const detailParts: string[] = []
    let Icon: LucideIcon = Activity
    let iconClass = 'text-primary'

    switch (type) {
      case 'irrigation': {
        Icon = Droplets
        iconClass = 'text-sky-600'
        const duration = activity?.duration ?? 0
        const discharge = activity?.system_discharge ?? 0
        const totalLiters = duration * discharge
        const depthMm = convertLitersToDepthMm(totalLiters, activity?.area ?? undefined)
        if (totalLiters > 0) {
          const digits = totalLiters >= 1000 ? 0 : totalLiters >= 100 ? 1 : 2
          detailParts.push(`${formatNumber(totalLiters, digits)} L applied`)
        }
        if (duration > 0 && discharge > 0) {
          detailParts.push(
            `${formatNumber(duration, duration >= 10 ? 0 : 1)}h @ ${formatNumber(discharge, discharge >= 1000 ? 0 : 1)} L/h`
          )
        }
        if (depthMm) {
          detailParts.push(`${formatNumber(depthMm, depthMm >= 10 ? 1 : 2)} mm`)
        }
        return {
          title: title,
          detail: detailParts.join(' • ') || 'Irrigation logged',
          icon: Icon,
          iconClass
        }
      }
      case 'spray': {
        Icon = SprayCan
        iconClass = 'text-purple-600'
        const chemical = activity?.chemical || activity?.chemicals?.[0]?.name || 'Spray application'
        const quantity = activity?.quantity_amount
        const unit = activity?.quantity_unit
        if (quantity) {
          detailParts.push(`${formatNumber(quantity, quantity >= 100 ? 0 : 1)} ${unit || ''}`)
        }
        if (activity?.water_volume) {
          detailParts.push(
            `${formatNumber(activity.water_volume, activity.water_volume >= 1000 ? 0 : 1)} L water`
          )
        }
        return {
          title: chemical,
          detail: detailParts.join(' • ') || 'Foliar spray recorded',
          icon: Icon,
          iconClass
        }
      }
      case 'fertigation': {
        Icon = FlaskConical
        iconClass = 'text-amber-600'
        const fertilizer = activity?.fertilizer || 'Fertigation'
        const quantity = activity?.quantity
        const unit = activity?.unit
        if (quantity) {
          detailParts.push(`${formatNumber(quantity, quantity >= 100 ? 0 : 1)} ${unit || ''}`)
        }
        if (activity?.purpose) {
          detailParts.push(activity.purpose)
        }
        return {
          title: fertilizer,
          detail: detailParts.join(' • ') || 'Fertigation event recorded',
          icon: Icon,
          iconClass
        }
      }
      case 'harvest': {
        Icon = Wheat
        iconClass = 'text-emerald-600'
        const quantity = activity?.quantity
        if (quantity) {
          detailParts.push(`${formatNumber(quantity, quantity >= 100 ? 0 : 1)} kg`)
        }
        if (activity?.grade) {
          detailParts.push(`Grade ${activity.grade}`)
        }
        if (activity?.buyer) {
          detailParts.push(activity.buyer)
        }
        return {
          title: title || 'Harvest recorded',
          detail: detailParts.join(' • ') || 'Harvest entry added',
          icon: Icon,
          iconClass
        }
      }
      case 'expense': {
        Icon = Wallet
        iconClass = 'text-orange-600'
        const cost = activity?.cost
        if (cost) {
          detailParts.push(`₹${formatNumber(cost, cost >= 1000 ? 0 : 1)}`)
        }
        if (activity?.type) {
          detailParts.push(activity.type)
        }
        return {
          title: title || 'Expense logged',
          detail: detailParts.join(' • ') || 'Expense entry added',
          icon: Icon,
          iconClass
        }
      }
      case 'soil_test':
      case 'petiole_test': {
        Icon = TestTube
        iconClass = 'text-primary'
        if (activity?.notes) {
          detailParts.push(activity.notes)
        }
        return {
          title:
            title || (type === 'soil_test' ? 'Soil test results added' : 'Petiole test logged'),
          detail: detailParts.join(' • ') || 'Lab results ready for review',
          icon: Icon,
          iconClass
        }
      }
      default: {
        if (activity?.description) detailParts.push(activity.description)
        return {
          title: title || 'New activity',
          detail: detailParts.join(' • ') || 'Timeline updated',
          icon: Icon,
          iconClass
        }
      }
    }
  }
  return (
    <div className={cn('relative min-h-screen bg-background pb-12', className)}>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-[-140px] h-[360px] bg-gradient-to-b from-primary/30 via-primary/10 to-transparent opacity-60 blur-3xl" />
        <div className="relative px-4 pt-6 pb-8 space-y-6 md:px-6 lg:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {farmInfo && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide shadow-sm',
                      getStatusColor(farmInfo.status)
                    )}
                  >
                    {farmInfo.status === 'healthy'
                      ? 'Optimal health'
                      : farmInfo.status === 'attention'
                        ? 'Needs attention'
                        : 'Critical care'}
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex flex-col gap-3 sm:flex-row md:flex-col md:items-end">
                  <Select value={selectedFarmId?.toString() || ''} onValueChange={handleFarmChange}>
                    <SelectTrigger className="h-11 w-full rounded-full border border-border/60 bg-background/80 text-sm sm:w-60">
                      <SelectValue placeholder="Select a farm" />
                    </SelectTrigger>
                    <SelectContent>
                      {farms.map((farm) => {
                        const status = calculateFarmStatus(
                          farm,
                          dashboardData?.pendingTasks,
                          dashboardData?.alerts
                        )
                        return (
                          <SelectItem key={farm.id} value={farm.id!.toString()}>
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'h-2 w-2 rounded-full',
                                  status === 'healthy'
                                    ? 'bg-green-500'
                                    : status === 'attention'
                                      ? 'bg-amber-500'
                                      : 'bg-red-500'
                                )}
                              />
                              <span>{capitalize(farm.name)}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleOpenFarm}
                      className="h-11 flex-1 rounded-full border-border/60 text-sm sm:flex-none sm:px-6"
                    >
                      View farm
                    </Button>
                    <Button
                      onClick={handleOpenLogs}
                      className="h-11 flex-1 rounded-full text-sm sm:flex-none sm:px-6"
                    >
                      Activity logs
                    </Button>
                  </div>
                </div>
              </div>
              {farmInfo && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-3 py-1">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {farmInfo.location}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/70 px-3 py-1">
                    <Sprout className="h-3.5 w-3.5 text-primary" />
                    {farmInfo.cropVariety}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/70 px-3 py-1">
                    <BarChart2 className="h-3.5 w-3.5 text-primary" />
                    {farmInfo.totalAcres} acres
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="relative space-y-6 px-4 pb-12 md:px-6 lg:px-10">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground md:text-base">
                Today at a glance
              </h3>
              <span className="text-xs text-muted-foreground">
                Critical signals and upcoming work
              </span>
            </div>
            <div className="grid grid-flow-col auto-cols-[minmax(220px,1fr)] gap-3 overflow-x-auto pb-2 md:auto-cols-auto md:grid-flow-row md:grid-cols-2 md:overflow-visible xl:grid-cols-4">
              {highlightTiles.map(({ id, title, label, body, icon: Icon, accent, emphasis }) => (
                <div
                  key={id}
                  className="relative flex min-w-[220px] flex-col justify-between rounded-2xl border border-border/60 bg-background/90 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg md:min-w-0"
                >
                  <div
                    className={cn(
                      'pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br opacity-70',
                      accent
                    )}
                  />
                  <div className="relative flex items-start justify-between gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {label}
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/80">
                      <Icon className={cn('h-4 w-4 text-muted-foreground', emphasis)} />
                    </div>
                  </div>
                  <div className="relative mt-4 space-y-1.5">
                    <p className={cn('text-lg font-semibold text-foreground', emphasis)}>{title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-border/60 bg-background/95 px-5 py-5 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <History className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground md:text-base">
                    Field activity (48h)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Snapshot of what changed since your last visit.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddLog}
                className="h-10 rounded-2xl border-border/60 bg-background/80 px-3 text-xs font-semibold text-primary hover:bg-primary/10"
              >
                <Plus className="mr-2 h-3.5 w-3.5" />
                Log
              </Button>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {recentActivityWindow.length > 0 ? (
                recentActivityWindow.map((activity: any, index: number) => {
                  const rawDate = activity?.created_at || activity?.date
                  const activityDate = rawDate ? new Date(rawDate) : null
                  const timestamp =
                    activityDate && !Number.isNaN(activityDate.getTime())
                      ? activityDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                      : ''
                  const meta = getActivityPresentation(activity)
                  const Icon = meta.icon
                  return (
                    <div
                      key={`${activity?.id ?? activity?.title ?? 'activity'}-${index}`}
                      className="flex items-start gap-3 rounded-2xl border border-border/40 bg-background/80 px-4 py-3"
                    >
                      <div
                        className={cn(
                          'mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/70',
                          meta.iconClass
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-foreground">{meta.title}</p>
                          {activityDate && (
                            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              {timestamp}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{meta.detail}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {activity?.type !== 'petiole_test' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-primary hover:bg-primary/10"
                            onClick={() => handleEditRecord(activity)}
                            title="Edit log"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-red-600 hover:bg-red-100"
                          onClick={() => handleDeleteRecord(activity)}
                          title="Delete log"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-border/60 bg-background/70 px-4 py-4 text-sm text-muted-foreground">
                  No logs in the past two days. Record irrigation, spray, or harvest updates to keep
                  your activity trail current.
                </div>
              )}
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-2">
            <TodaysTasksSection
              className="h-full"
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
                  farmBlock: task.location || (selectedFarm ? capitalize(selectedFarm.name) : ''),
                  estimatedDuration: task.estimated_duration || 60,
                  completed: task.completed || false,
                  description: task.description
                })) || []
              }
              onTaskComplete={handleTaskComplete}
              onTaskAction={handleTaskAction}
              onAddTask={handleAddTask}
              loading={!dashboardData}
              farmName={farmInfo?.name}
            />
            <AlertsSection
              className="h-full"
              alerts={alerts}
              onAlertAction={handleAlertAction}
              loading={!dashboardData}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
