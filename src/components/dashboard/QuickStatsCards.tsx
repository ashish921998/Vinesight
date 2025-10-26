'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Activity,
  Droplets,
  Calendar,
  CheckSquare,
  Leaf,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickStat {
  id: string
  label: string
  value: string | number
  subValue?: string
  icon: React.ReactNode
  status: 'healthy' | 'warning' | 'critical' | 'neutral'
  trend?: 'up' | 'down' | 'stable'
  onClick?: () => void
}

interface QuickStatsCardsProps {
  farmHealthScore?: number // 0-100
  waterLevel?: number // percentage
  daysToHarvest?: number
  pendingUrgentTasks?: number
  pendingTotalTasks?: number
  seasonPhase?: 'germination' | 'flowering' | 'veraison' | 'ripening' | 'harvest' | 'dormant'
  loading?: boolean
  className?: string
}

export function QuickStatsCards({
  farmHealthScore,
  waterLevel,
  daysToHarvest,
  pendingUrgentTasks = 0,
  pendingTotalTasks = 0,
  seasonPhase,
  loading,
  className
}: QuickStatsCardsProps) {
  const getHealthStatus = (score?: number): QuickStat['status'] => {
    if (!score) return 'neutral'
    if (score >= 80) return 'healthy'
    if (score >= 60) return 'warning'
    return 'critical'
  }

  const getWaterStatus = (level?: number): QuickStat['status'] => {
    if (!level) return 'neutral'
    if (level >= 60) return 'healthy'
    if (level >= 30) return 'warning'
    return 'critical'
  }

  const getTasksStatus = (urgent: number): QuickStat['status'] => {
    if (urgent === 0) return 'healthy'
    if (urgent <= 2) return 'warning'
    return 'critical'
  }

  const getSeasonPhaseLabel = (
    phase?: string
  ): { label: string; color: string; bgColor: string } => {
    switch (phase) {
      case 'germination':
        return { label: 'Germination', color: 'text-green-700', bgColor: 'bg-green-50' }
      case 'flowering':
        return { label: 'Flowering', color: 'text-purple-700', bgColor: 'bg-purple-50' }
      case 'veraison':
        return { label: 'Veraison', color: 'text-blue-700', bgColor: 'bg-blue-50' }
      case 'ripening':
        return { label: 'Ripening', color: 'text-amber-700', bgColor: 'bg-amber-50' }
      case 'harvest':
        return { label: 'Harvest', color: 'text-red-700', bgColor: 'bg-red-50' }
      case 'dormant':
        return { label: 'Dormant', color: 'text-gray-700', bgColor: 'bg-gray-50' }
      default:
        return { label: 'Growing', color: 'text-green-700', bgColor: 'bg-green-50' }
    }
  }

  const getStatusColor = (status: QuickStat['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800'
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const stats: QuickStat[] = [
    {
      id: 'health',
      label: 'Farm Health',
      value: farmHealthScore ? `${Math.round(farmHealthScore)}` : '--',
      subValue: farmHealthScore ? '/100' : 'No data',
      icon: <Activity className="h-5 w-5" />,
      status: getHealthStatus(farmHealthScore),
      trend: farmHealthScore && farmHealthScore >= 80 ? 'up' : 'stable'
    },
    {
      id: 'water',
      label: 'Water Level',
      value: waterLevel ? `${Math.round(waterLevel)}%` : '--',
      subValue: waterLevel ? (waterLevel > 50 ? 'Good' : 'Low') : 'No data',
      icon: <Droplets className="h-5 w-5" />,
      status: getWaterStatus(waterLevel)
    },
    {
      id: 'harvest',
      label: 'Days to Harvest',
      value: daysToHarvest !== undefined ? daysToHarvest : '--',
      subValue: daysToHarvest ? `~${Math.ceil(daysToHarvest / 7)} weeks` : 'Not set',
      icon: <Calendar className="h-5 w-5" />,
      status: 'neutral'
    },
    {
      id: 'tasks',
      label: 'Pending Tasks',
      value: pendingTotalTasks,
      subValue:
        pendingUrgentTasks > 0
          ? `${pendingUrgentTasks} urgent`
          : pendingTotalTasks > 0
            ? 'On track'
            : 'All done!',
      icon: <CheckSquare className="h-5 w-5" />,
      status: getTasksStatus(pendingUrgentTasks)
    }
  ]

  if (loading) {
    return (
      <div className={cn('w-full overflow-hidden', className)}>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          {[1, 2, 3, 4].map((i) => (
            <Card
              key={i}
              className="flex-shrink-0 w-[140px] sm:w-[160px] snap-start border-2 animate-pulse"
            >
              <CardContent className="p-4">
                <div className="h-5 w-5 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-12 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('w-full overflow-hidden', className)}>
      {/* Season Phase Badge */}
      {seasonPhase && (
        <div className="mb-3 px-4">
          <Badge
            variant="outline"
            className={cn(
              'text-sm font-medium py-1.5 px-3',
              getSeasonPhaseLabel(seasonPhase).bgColor,
              getSeasonPhaseLabel(seasonPhase).color
            )}
          >
            <Leaf className="h-3 w-3 mr-1.5" />
            {getSeasonPhaseLabel(seasonPhase).label} Season
          </Badge>
        </div>
      )}

      {/* Horizontal Scrollable Stats */}
      <div className="flex gap-3 overflow-x-auto pb-2 px-4 scrollbar-hide snap-x snap-mandatory">
        {stats.map((stat) => (
          <Card
            key={stat.id}
            className={cn(
              'flex-shrink-0 w-[140px] sm:w-[160px] snap-start border-2 transition-all',
              getStatusColor(stat.status),
              stat.onClick && 'cursor-pointer hover:shadow-md active:scale-95'
            )}
            onClick={stat.onClick}
          >
            <CardContent className="p-4">
              {/* Icon and Trend */}
              <div className="flex items-center justify-between mb-2">
                <div className="opacity-70">{stat.icon}</div>
                {stat.trend && (
                  <div className="text-xs">
                    {stat.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
                    {stat.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-600" />}
                  </div>
                )}
              </div>

              {/* Value */}
              <div className="text-2xl font-bold mb-0.5 leading-tight">{stat.value}</div>

              {/* Label */}
              <div className="text-xs font-medium opacity-70 mb-1">{stat.label}</div>

              {/* Sub Value */}
              {stat.subValue && (
                <div className="text-[10px] opacity-60 font-medium">{stat.subValue}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scroll Indicator */}
      <div className="flex justify-center mt-2 gap-1 px-4">
        {stats.map((stat, index) => (
          <div
            key={stat.id}
            className={cn(
              'h-1 rounded-full transition-all',
              index === 0 ? 'w-4 bg-primary' : 'w-1.5 bg-gray-300'
            )}
          />
        ))}
      </div>
    </div>
  )
}
