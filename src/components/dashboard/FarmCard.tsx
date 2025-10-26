'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Activity,
  Droplets,
  Calendar,
  CheckSquare,
  MapPin,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { cn, capitalize } from '@/lib/utils'
import { type FarmSummary } from '@/lib/portfolio-utils'

interface FarmCardProps {
  farm: FarmSummary
  onClick: () => void
  className?: string
}

export function FarmCard({ farm, onClick, className }: FarmCardProps) {
  const statusConfig = {
    healthy: {
      color: 'bg-green-500',
      borderColor: 'border-green-200',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      label: 'Healthy'
    },
    attention: {
      color: 'bg-amber-500',
      borderColor: 'border-amber-200',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      label: 'Attention'
    },
    critical: {
      color: 'bg-red-500',
      borderColor: 'border-red-200',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      label: 'Critical'
    }
  }

  const config = statusConfig[farm.status]

  const getHealthTrend = () => {
    // Simple trend based on health score thresholds
    if (farm.healthScore >= 85) return 'up'
    if (farm.healthScore <= 60) return 'down'
    return null
  }

  const trend = getHealthTrend()

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border-2',
        config.borderColor,
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header - Farm Name & Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className={cn('w-3 h-3 rounded-full flex-shrink-0', config.color)} />
              <h3 className="font-bold text-base truncate">{capitalize(farm.name)}</h3>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{farm.location}</span>
              <span>•</span>
              <span className="flex-shrink-0">{farm.totalAcres} AC</span>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn('flex-shrink-0 text-xs', config.bgColor, config.textColor)}
          >
            {config.label}
          </Badge>
        </div>

        {/* Crop Variety */}
        <div className="text-sm font-medium text-muted-foreground">🍇 {farm.cropVariety}</div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Health Score */}
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
            <Activity className={cn('h-4 w-4 flex-shrink-0', getHealthColor(farm.healthScore))} />
            <div className="min-w-0 flex-1">
              <div className={cn('text-xs font-medium', getHealthColor(farm.healthScore))}>
                Health
              </div>
              <div className="flex items-center gap-1">
                <span className={cn('text-sm font-bold', getHealthColor(farm.healthScore))}>
                  {farm.healthScore}%
                </span>
                {trend && (
                  <span className={cn('text-xs', getHealthColor(farm.healthScore))}>
                    {trend === 'up' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Water Level */}
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
            <Droplets className={cn('h-4 w-4 flex-shrink-0', getWaterColor(farm.waterLevel))} />
            <div className="min-w-0 flex-1">
              <div className={cn('text-xs font-medium', getWaterColor(farm.waterLevel))}>Water</div>
              <div className={cn('text-sm font-bold', getWaterColor(farm.waterLevel))}>
                {Math.round(farm.waterLevel)}%
              </div>
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
            <CheckSquare className={cn('h-4 w-4 flex-shrink-0', getTasksColor(farm.urgentTasks))} />
            <div className="min-w-0 flex-1">
              <div className={cn('text-xs font-medium', getTasksColor(farm.urgentTasks))}>
                Tasks
              </div>
              <div className={cn('text-sm font-bold', getTasksColor(farm.urgentTasks))}>
                {farm.pendingTasks}
                {farm.urgentTasks > 0 && (
                  <span className="text-xs text-red-600 ml-1">({farm.urgentTasks} ⏰)</span>
                )}
              </div>
            </div>
          </div>

          {/* Days to Harvest */}
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
            <Calendar className="h-4 w-4 flex-shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-amber-600">Harvest</div>
              <div className="text-sm font-bold text-amber-600">
                {farm.daysToHarvest !== undefined ? `${farm.daysToHarvest}d` : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Banner (if any) */}
        {farm.hasAlerts && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-red-50 border border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span className="text-xs font-medium text-red-700">
              Active alerts require attention
            </span>
          </div>
        )}

        {/* Season Phase Badge */}
        {farm.seasonPhase && (
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {getSeasonPhaseLabel(farm.seasonPhase)}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={(e) => {
                e.stopPropagation()
                onClick()
              }}
            >
              View Details
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper functions
function getHealthColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-600'
}

function getWaterColor(level: number): string {
  if (level >= 60) return 'text-blue-600'
  if (level >= 30) return 'text-amber-600'
  return 'text-red-600'
}

function getTasksColor(urgent: number): string {
  if (urgent === 0) return 'text-green-600'
  if (urgent <= 2) return 'text-amber-600'
  return 'text-red-600'
}

function getSeasonPhaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    germination: '🌱 Germination',
    flowering: '🌸 Flowering',
    veraison: '🔵 Veraison',
    ripening: '🍇 Ripening',
    harvest: '📦 Harvest',
    dormant: '💤 Dormant'
  }
  return labels[phase] || phase
}
