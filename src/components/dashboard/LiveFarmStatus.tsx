'use client'

import type { ReactNode } from 'react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  Activity,
  Droplets,
  Thermometer,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  CloudRain,
  Gauge,
  Leaf,
  Sparkles
} from 'lucide-react'

interface WeatherData {
  temperature: number
  humidity: number
  precipitation: number
  windSpeed: number
  condition: string
}

interface SoilData {
  moisture: number
  temperature: number
  ph: number
  lastUpdated: Date
}

interface WaterStatus {
  currentLevel: number
  dailyUsage?: number
  weeklyTarget?: number
  weeklyUsed?: number
  efficiency?: number
  unitLabel?: 'L' | 'mm'
}

interface GrowthMetrics {
  stage: string
  progress: number
  healthScore: number
  expectedHarvest: Date
  daysToHarvest: number
}

interface FinancialSummary {
  weeklyRevenue: number
  weeklyExpenses: number
  profitMargin: number
  trend: 'up' | 'down' | 'stable'
}

interface LiveFarmStatusProps {
  weather?: WeatherData
  soil?: SoilData
  water?: WaterStatus
  growth?: GrowthMetrics
  financial?: FinancialSummary
  loading?: boolean
  farmName?: string
  className?: string
}

export function LiveFarmStatus({
  weather,
  soil,
  water,
  growth,
  financial,
  loading,
  farmName,
  className
}: LiveFarmStatusProps) {
  const formatNumeric = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: value >= 100 ? 0 : value >= 10 ? 1 : 2
    }).format(value)

  const containerClass = cn(
    'rounded-2xl border border-border/60 bg-background/85 px-5 py-5 shadow-sm backdrop-blur',
    className
  )

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-primary'
    if (value >= thresholds.warning) return 'text-amber-600'
    return 'text-red-600'
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-primary" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (loading) {
    return (
      <div className={containerClass}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/30">
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-40 rounded-full bg-muted/40 animate-pulse" />
            <div className="h-3 w-24 rounded-full bg-muted/20 animate-pulse" />
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-[140px] rounded-2xl border border-border/40 bg-muted/10 animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  const overviewMetrics: Array<{
    label: string
    value: string
    hint?: string
    icon: ReactNode
  }> = []

  if (weather) {
    overviewMetrics.push({
      label: 'Temperature',
      value: `${weather.temperature}°C`,
      hint: weather.condition,
      icon: <Thermometer className="h-4 w-4 text-primary" />
    })
    overviewMetrics.push({
      label: 'Humidity',
      value: `${weather.humidity}%`,
      hint: 'Ambient moisture',
      icon: <Droplets className="h-4 w-4 text-primary" />
    })
  }

  if (water) {
    overviewMetrics.push({
      label: 'Water reserve',
      value: `${water.currentLevel}%`,
      hint: 'Tank level',
      icon: <Gauge className="h-4 w-4 text-primary" />
    })
  }

  if (soil) {
    overviewMetrics.push({
      label: 'Soil moisture',
      value: `${soil.moisture}%`,
      hint: 'Sensor reading',
      icon: <Sparkles className="h-4 w-4 text-primary" />
    })
  }

  const hasAnyInsight = weather || soil || water || growth || financial

  if (!hasAnyInsight) {
    return (
      <div className={containerClass}>
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/50 bg-background/60 px-6 py-10 text-center">
          <Activity className="h-10 w-10 text-primary" />
          <div>
            <h3 className="text-base font-semibold text-foreground">No telemetry yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Once you start logging irrigations, weather, or crop updates, live insights will
              appear here.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={containerClass}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Activity className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground md:text-base">
              {farmName ? `${farmName} — live status` : 'Live farm status'}
            </h3>
            <p className="text-xs text-muted-foreground">
              Real-time readouts across climate, irrigation, and crop progress.
            </p>
          </div>
        </div>
      </div>

      {overviewMetrics.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {overviewMetrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border border-border/50 bg-background/70 px-4 py-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {metric.icon}
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {metric.label}
                  </p>
                  <p className="text-sm font-semibold text-foreground">{metric.value}</p>
                  {metric.hint && (
                    <p className="text-[11px] text-muted-foreground/80">{metric.hint}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
        {weather && (
          <div className="rounded-2xl border border-border/60 bg-background/80 px-4 py-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Environment</h4>
                <p className="text-xs text-muted-foreground">{weather.condition}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Thermometer className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Humidity</span>
                <span
                  className={cn(
                    'font-semibold',
                    getStatusColor(weather.humidity, { good: 60, warning: 40 })
                  )}
                >
                  {weather.humidity}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Wind speed</span>
                <span className="font-semibold text-foreground">{weather.windSpeed} km/h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Precipitation</span>
                <span className="flex items-center gap-1 font-semibold text-foreground">
                  <CloudRain className="h-4 w-4 text-primary" />
                  {weather.precipitation > 0 ? `${weather.precipitation}mm` : 'None'}
                </span>
              </div>
            </div>
          </div>
        )}

        {(soil || water) && (
          <div className="rounded-2xl border border-border/60 bg-background/80 px-4 py-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Irrigation readiness</h4>
                <p className="text-xs text-muted-foreground">
                  {soil
                    ? `Sensor update at ${soil.lastUpdated.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}`
                    : 'Monitoring tank capacity'}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Droplets className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 space-y-4 text-sm">
              {soil && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Soil moisture</span>
                    <span
                      className={cn(
                        'font-semibold',
                        getStatusColor(soil.moisture, { good: 60, warning: 30 })
                      )}
                    >
                      {soil.moisture}%
                    </span>
                  </div>
                  <Progress value={soil.moisture} className="h-2 bg-muted/50" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                    <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                    Soil temp {soil.temperature}°C • pH {soil.ph.toFixed(1)}
                  </div>
                </div>
              )}
              {water && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Water reserve</span>
                    <span
                      className={cn(
                        'font-semibold',
                        getStatusColor(water.currentLevel, { good: 70, warning: 40 })
                      )}
                    >
                      {water.currentLevel}%
                    </span>
                  </div>
                  <Progress value={water.currentLevel} className="h-2 bg-muted/50" />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-center">
                      <p className="font-semibold text-foreground">
                        {typeof water.dailyUsage === 'number'
                          ? `${formatNumeric(water.dailyUsage)} ${water.unitLabel ?? 'L'}`
                          : '—'}
                      </p>
                      <p className="text-muted-foreground/80">Applied depth</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-center">
                      <p className="font-semibold text-foreground">
                        {typeof water.efficiency === 'number'
                          ? `${formatNumeric(water.efficiency)}%`
                          : '—'}
                      </p>
                      <p className="text-muted-foreground/80">System efficiency</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {growth && (
          <div className="rounded-2xl border border-border/60 bg-background/80 px-4 py-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Crop development</h4>
                <p className="text-xs text-muted-foreground">{growth.stage}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Leaf className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Stage progress</span>
                  <span className="font-semibold text-primary">{growth.progress}%</span>
                </div>
                <Progress value={growth.progress} className="mt-2 h-2" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                <div className="rounded-xl border border-border/60 bg-background/60 px-3 py-3">
                  <p
                    className={cn(
                      'text-base font-semibold',
                      getStatusColor(growth.healthScore, { good: 80, warning: 60 })
                    )}
                  >
                    {growth.healthScore}
                  </p>
                  <p className="text-muted-foreground/80">Health score</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/60 px-3 py-3">
                  <p className="text-base font-semibold text-primary">{growth.daysToHarvest}</p>
                  <p className="text-muted-foreground/80">Days to harvest</p>
                </div>
              </div>
              <div className="rounded-xl border border-dashed border-border/50 bg-background/60 px-3 py-3 text-xs text-muted-foreground">
                Expected harvest:{' '}
                <span className="font-medium text-foreground">
                  {growth.expectedHarvest.toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {financial && (
          <div className="rounded-2xl border border-border/60 bg-background/80 px-4 py-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Weekly economics</h4>
                <p className="text-xs text-muted-foreground">Revenue versus operating spend</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                <div className="rounded-xl border border-green-200/70 bg-green-50/80 px-3 py-3">
                  <p className="text-base font-semibold text-green-700">
                    ₹{(financial.weeklyRevenue / 1000).toFixed(1)}k
                  </p>
                  <p className="text-green-700/80">Weekly revenue</p>
                </div>
                <div className="rounded-xl border border-red-200/70 bg-red-50/80 px-3 py-3">
                  <p className="text-base font-semibold text-red-700">
                    ₹{(financial.weeklyExpenses / 1000).toFixed(1)}k
                  </p>
                  <p className="text-red-700/80">Weekly spend</p>
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/60 px-3 py-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Profit margin</span>
                  <span
                    className={cn(
                      'flex items-center gap-2 text-base font-semibold',
                      financial.profitMargin >= 20 ? 'text-primary' : 'text-amber-600'
                    )}
                  >
                    {financial.profitMargin.toFixed(1)}%{getTrendIcon(financial.trend)}
                  </span>
                </div>
                {financial.profitMargin < 20 && (
                  <p className="mt-2 text-[11px] text-amber-700">
                    Tight margin — review fertigation cost and labour deployment.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
