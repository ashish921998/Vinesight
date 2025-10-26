'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Droplets,
  Calendar,
  CheckSquare,
  DollarSign,
  MapPin
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type PortfolioMetrics } from '@/lib/portfolio-utils'

interface PortfolioSnapshotProps {
  metrics: PortfolioMetrics
  loading?: boolean
  className?: string
}

export function PortfolioSnapshot({ metrics, loading, className }: PortfolioSnapshotProps) {
  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center justify-between px-4">
          <h2 className="text-lg font-semibold">Portfolio Overview</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-hide">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="flex-shrink-0 w-[140px] snap-start">
              <CardContent className="p-3">
                <div className="h-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const kpiCards = [
    {
      id: 'farms',
      label: 'Total Farms',
      value: metrics.totalFarms.toString(),
      subValue: `${metrics.totalAcres} acres`,
      icon: <MapPin className="h-4 w-4" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'health',
      label: 'Avg Health',
      value: `${metrics.averageHealthScore}%`,
      subValue: getHealthLabel(metrics),
      icon: <Activity className="h-4 w-4" />,
      color: getHealthColor(metrics.averageHealthScore),
      bgColor: getHealthBgColor(metrics.averageHealthScore),
      trend:
        metrics.averageHealthScore >= 70
          ? 'up'
          : metrics.averageHealthScore >= 50
            ? 'stable'
            : 'down'
    },
    {
      id: 'harvest',
      label: 'Next Harvest',
      value: metrics.nextHarvestDays !== undefined ? `${metrics.nextHarvestDays}d` : 'N/A',
      subValue:
        metrics.nextHarvestFarmCount > 0
          ? `${metrics.nextHarvestFarmCount} farms`
          : 'None upcoming',
      icon: <Calendar className="h-4 w-4" />,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      id: 'tasks',
      label: 'Pending Tasks',
      value: metrics.totalPendingTasks.toString(),
      subValue:
        metrics.totalUrgentTasks > 0 ? `${metrics.totalUrgentTasks} urgent` : 'All on track',
      icon: <CheckSquare className="h-4 w-4" />,
      color: metrics.totalUrgentTasks > 0 ? 'text-red-600' : 'text-green-600',
      bgColor: metrics.totalUrgentTasks > 0 ? 'bg-red-50' : 'bg-green-50'
    },
    {
      id: 'water',
      label: 'Avg Water',
      value: `${metrics.averageWaterLevel}%`,
      subValue: getWaterLabel(metrics.averageWaterLevel),
      icon: <Droplets className="h-4 w-4" />,
      color: getWaterColor(metrics.averageWaterLevel),
      bgColor: getWaterBgColor(metrics.averageWaterLevel)
    }
  ]

  // Add financial card if data available
  if (metrics.totalRevenue > 0 || metrics.totalExpenses > 0) {
    kpiCards.push({
      id: 'financial',
      label: 'This Season',
      value: `₹${(metrics.totalRevenue / 1000).toFixed(0)}K`,
      subValue: `${metrics.profitMargin.toFixed(0)}% margin`,
      icon: <DollarSign className="h-4 w-4" />,
      color: metrics.profitMargin > 0 ? 'text-green-600' : 'text-red-600',
      bgColor: metrics.profitMargin > 0 ? 'bg-green-50' : 'bg-red-50',
      trend: metrics.profitMargin > 0 ? 'up' : 'down'
    })
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header with status badges */}
      <div className="flex items-center justify-between px-4">
        <h2 className="text-lg font-semibold">Portfolio Overview</h2>
        <div className="flex gap-1">
          {metrics.criticalFarms > 0 && (
            <Badge variant="destructive" className="text-xs">
              {metrics.criticalFarms} Critical
            </Badge>
          )}
          {metrics.attentionFarms > 0 && (
            <Badge
              variant="outline"
              className="text-xs bg-amber-50 text-amber-700 border-amber-200"
            >
              {metrics.attentionFarms} Attention
            </Badge>
          )}
          {metrics.healthyFarms > 0 && (
            <Badge
              variant="outline"
              className="text-xs bg-green-50 text-green-700 border-green-200"
            >
              {metrics.healthyFarms} Healthy
            </Badge>
          )}
        </div>
      </div>

      {/* KPI Cards - Horizontal Scroll */}
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-hide">
        {kpiCards.map((card) => (
          <Card
            key={card.id}
            className={cn(
              'flex-shrink-0 w-[140px] snap-start border-2 transition-all hover:shadow-md',
              card.bgColor
            )}
          >
            <CardContent className="p-3 space-y-1">
              {/* Icon and Trend */}
              <div className="flex items-center justify-between">
                <div className={cn('p-1.5 rounded-md bg-white/80', card.color)}>{card.icon}</div>
                {card.trend && (
                  <div className={cn('text-xs', card.color)}>
                    {card.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                    {card.trend === 'down' && <TrendingDown className="h-3 w-3" />}
                    {card.trend === 'stable' && <Minus className="h-3 w-3" />}
                  </div>
                )}
              </div>

              {/* Value */}
              <div className={cn('text-2xl font-bold', card.color)}>{card.value}</div>

              {/* Label */}
              <div className="text-xs text-muted-foreground font-medium">{card.label}</div>

              {/* Sub Value */}
              <div className={cn('text-xs font-medium', card.color)}>{card.subValue}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scroll indicator dots (mobile) */}
      <div className="flex justify-center gap-1 md:hidden">
        {kpiCards.map((_, index) => (
          <div key={index} className="w-1.5 h-1.5 rounded-full bg-primary/20" />
        ))}
      </div>
    </div>
  )
}

// Helper functions
function getHealthLabel(metrics: PortfolioMetrics): string {
  if (metrics.criticalFarms > 0) return `${metrics.criticalFarms} critical`
  if (metrics.attentionFarms > 0) return `${metrics.attentionFarms} need attention`
  return 'All healthy'
}

function getHealthColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-600'
}

function getHealthBgColor(score: number): string {
  if (score >= 80) return 'bg-green-50'
  if (score >= 60) return 'bg-amber-50'
  return 'bg-red-50'
}

function getWaterLabel(level: number): string {
  if (level >= 60) return 'Good level'
  if (level >= 30) return 'Monitor closely'
  return 'Low - urgent'
}

function getWaterColor(level: number): string {
  if (level >= 60) return 'text-blue-600'
  if (level >= 30) return 'text-amber-600'
  return 'text-red-600'
}

function getWaterBgColor(level: number): string {
  if (level >= 60) return 'bg-blue-50'
  if (level >= 30) return 'bg-amber-50'
  return 'bg-red-50'
}
