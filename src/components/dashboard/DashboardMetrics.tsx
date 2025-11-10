/**
 * Memoized Dashboard Metrics Component
 * Prevents unnecessary re-renders of metric tiles
 */

import { memo, useMemo } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatNumber, formatDepthMm } from '@/hooks/useDashboardData'

interface MetricTile {
  id: string
  title: string
  label: string
  body: string
  icon: LucideIcon
  accent: string
  emphasis: string
}

interface DashboardMetricsProps {
  tiles: MetricTile[]
  className?: string
}

/**
 * Individual metric tile component (memoized)
 */
const MetricTile = memo<{
  tile: MetricTile
}>(({ tile }) => {
  const Icon = tile.icon

  return (
    <div className="relative mr-3 flex min-w-[200px] flex-col justify-between rounded-2xl border border-border/60 bg-background/90 p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg last:mr-0 md:mr-0 md:min-w-0 md:p-4">
      <div
        className={cn(
          'pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br opacity-70',
          tile.accent
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {tile.label}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/80">
          <Icon className={cn('h-4 w-4 text-muted-foreground', tile.emphasis)} />
        </div>
      </div>
      <div className="relative mt-3 space-y-1">
        <p className={cn('text-base font-semibold text-foreground', tile.emphasis)}>{tile.title}</p>
        <p className="text-[11px] leading-4 text-muted-foreground line-clamp-2">{tile.body}</p>
      </div>
    </div>
  )
})

MetricTile.displayName = 'MetricTile'

/**
 * Main Dashboard Metrics Component
 * Displays metric tiles in a responsive grid
 */
export const DashboardMetrics = memo<DashboardMetricsProps>(({ tiles, className }) => {
  return (
    <section className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground md:text-base">Today at a glance</h3>
        <span className="text-xs text-muted-foreground">Critical signals and upcoming work</span>
      </div>
      <div className="flex snap-x snap-mandatory overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-2 md:auto-rows-fr md:gap-3 md:overflow-visible xl:grid-cols-4">
        {tiles.map((tile) => (
          <MetricTile key={tile.id} tile={tile} />
        ))}
      </div>
    </section>
  )
})

DashboardMetrics.displayName = 'DashboardMetrics'

/**
 * Hook to generate metric tiles from dashboard data
 */
export function useMetricTiles(data: {
  pendingTasks: any[]
  overdueTasks: any[]
  todaysTasks: any[]
  totalHarvest: number
  totalWaterUsageMm?: number
  farmArea?: number
  tasksDueSoon: any[]
  highPriorityAlerts: any[]
  infoAlerts: any[]
  weatherData?: any
  recentActivities: any[]
}): MetricTile[] {
  return useMemo(() => {
    const tiles: MetricTile[] = []

    // Import icons dynamically to avoid bundle bloat
    const {
      CalendarDays,
      ShieldAlert,
      Brain,
      Sun,
      History,
      CheckCircle2,
      Sprout,
      Droplet,
      CalendarClock
    } = require('lucide-react')

    // Task tiles
    if (data.tasksDueSoon.length > 0) {
      const urgent = data.tasksDueSoon.filter((task) => {
        if (!task.dueDate) return false
        const dueDate = new Date(task.dueDate)
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(23, 59, 59, 999)
        return dueDate <= tomorrow
      }).length

      tiles.push({
        id: 'tasks',
        title: `${data.tasksDueSoon.length} task${data.tasksDueSoon.length > 1 ? 's' : ''}`,
        label: 'Due soon',
        body: urgent > 0 ? `${urgent} need attention today` : `All scheduled within 48 hours`,
        icon: CalendarDays,
        accent: 'from-amber-200/50 via-background to-transparent',
        emphasis: urgent > 0 ? 'text-red-600' : 'text-primary'
      })
    }

    // Alert tiles
    if (data.highPriorityAlerts.length > 0) {
      tiles.push({
        id: 'alerts',
        title: `${data.highPriorityAlerts.length} alert${data.highPriorityAlerts.length > 1 ? 's' : ''}`,
        label: 'Immediate',
        body: data.highPriorityAlerts[0]?.title || 'Check alert centre',
        icon: ShieldAlert,
        accent: 'from-red-200/60 via-background to-transparent',
        emphasis: 'text-red-600'
      })
    } else if (data.infoAlerts.length > 0) {
      tiles.push({
        id: 'ai-insight',
        title: 'AI insight',
        label: 'Recommendation',
        body: data.infoAlerts[0]?.title || 'New advisory available',
        icon: Brain,
        accent: 'from-primary/15 via-background to-transparent',
        emphasis: 'text-primary'
      })
    }

    // Weather tile
    if (data.weatherData) {
      const weatherParts = [
        `Humidity ${data.weatherData.current.humidity}%`,
        `Wind ${data.weatherData.current.windSpeed} km/h`
      ]
      if (data.weatherData.current.precipitation > 0) {
        weatherParts.push(`${data.weatherData.current.precipitation}mm rain`)
      }
      tiles.push({
        id: 'weather',
        title: `${data.weatherData.current.temperature}°C`,
        label: data.weatherData.current.condition || 'Weather',
        body: weatherParts.join(' • '),
        icon: Sun,
        accent: 'from-sky-200/50 via-background to-transparent',
        emphasis: 'text-sky-600'
      })
    }

    // Recent activity tile
    if (data.recentActivities.length > 0) {
      const mostRecent = data.recentActivities[0]
      tiles.push({
        id: 'activity',
        title: mostRecent.title || 'Recent activity',
        label: 'Last 48h',
        body: mostRecent.description || 'Check activity feed',
        icon: History,
        accent: 'from-emerald-200/40 via-background to-transparent',
        emphasis: 'text-emerald-600'
      })
    }

    // Default calm tile if no urgent items
    if (tiles.length === 0) {
      tiles.push({
        id: 'calm',
        title: 'Everything steady',
        label: 'Status',
        body: 'No urgent jobs or alerts right now.',
        icon: CheckCircle2,
        accent: 'from-primary/15 via-background to-transparent',
        emphasis: 'text-primary'
      })
    }

    // Metric tiles (always shown)
    tiles.push(
      {
        id: 'metric-tasks',
        title: `${data.pendingTasks.length}`,
        label: 'Active tasks',
        body:
          data.overdueTasks.length > 0
            ? `${data.overdueTasks.length} overdue • ${data.todaysTasks.length} today`
            : data.todaysTasks.length > 0
              ? `${data.todaysTasks.length} scheduled today`
              : 'All on track',
        icon: CalendarClock,
        accent: 'from-primary/20 via-primary/5 to-transparent',
        emphasis: 'text-primary'
      },
      {
        id: 'metric-harvest',
        title: `${formatNumber(data.totalHarvest)}`,
        label: 'Harvest to date',
        body: 'Kg captured this season',
        icon: Sprout,
        accent: 'from-emerald-100/40 via-background to-transparent',
        emphasis: 'text-emerald-600'
      },
      {
        id: 'metric-water',
        title: formatDepthMm(data.totalWaterUsageMm),
        label: 'Water usage',
        body:
          data.farmArea && data.totalWaterUsageMm !== undefined
            ? `Across ${formatNumber(data.farmArea, data.farmArea >= 10 ? 0 : 1)} acre${data.farmArea > 1 ? 's' : ''}`
            : 'Cumulative irrigation depth',
        icon: Droplet,
        accent: 'from-sky-100/50 via-background to-transparent',
        emphasis: 'text-sky-600'
      }
    )

    return tiles
  }, [
    data.tasksDueSoon,
    data.highPriorityAlerts,
    data.infoAlerts,
    data.weatherData,
    data.recentActivities,
    data.pendingTasks,
    data.overdueTasks,
    data.todaysTasks,
    data.totalHarvest,
    data.totalWaterUsageMm,
    data.farmArea
  ])
}
