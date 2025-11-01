'use client'

import type { ElementType } from 'react'
import {
  ArrowUpRight,
  ClipboardList,
  Cloud,
  CloudRain,
  Droplets,
  Gauge,
  Grape,
  ListChecks,
  MoreVertical,
  Plus,
  Ruler,
  Scissors,
  Sprout,
  Sun,
  Thermometer,
  MapPin
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { type Farm } from '@/types/types'
import { capitalize } from '@/lib/utils'
import { WEATHER_THRESHOLDS } from '@/constants/weather'

export type FarmWeatherSummary = {
  temperature: number | null
  humidity: number | null
  precipitation: number | null
  condition: 'clear' | 'humid' | 'rain'
}

interface FarmHeaderProps {
  farm: Farm
  loading: boolean
  pendingTasksCount?: number
  totalLogs?: number
  totalHarvest?: number
  totalWaterUsage?: number
  onAddLogs?: () => void
  onOpenWaterCalculator?: () => void
  onViewLogEntries?: () => void
  weatherSummary?: FarmWeatherSummary | null
  onOpenWeatherDetails?: () => void
  onEditFarm?: (farm: Farm) => void
  onDeleteFarm?: (farmId: number) => void
}

export function FarmHeader({
  farm,
  loading,
  pendingTasksCount,
  totalLogs,
  totalHarvest,
  totalWaterUsage,
  onAddLogs,
  onOpenWaterCalculator,
  onViewLogEntries,
  weatherSummary,
  onOpenWeatherDetails,
  onEditFarm,
  onDeleteFarm
}: FarmHeaderProps) {
  const calculateDaysAfterPruning = (pruningDate?: Date) => {
    if (!pruningDate) return null

    const pruning = pruningDate
    const today = new Date()

    const pruningMidnight = new Date(pruning.getFullYear(), pruning.getMonth(), pruning.getDate())
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    const diffTime = todayMidnight.getTime() - pruningMidnight.getTime()

    const rawDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    const diffDays = rawDays + 1

    return diffDays > 0 ? diffDays : null
  }

  const getWeatherConditionIcon = () => {
    if (!weatherSummary) return Sun
    switch (weatherSummary.condition) {
      case 'rain':
        return CloudRain
      case 'humid':
        return Cloud
      default:
        return Sun
    }
  }

  const weatherConditionLabel = (() => {
    if (!weatherSummary) return null
    switch (weatherSummary.condition) {
      case 'rain':
        return 'Rain expected'
      case 'humid':
        return 'Humid conditions'
      default:
        return 'Clear skies'
    }
  })()

  const WeatherConditionIcon = getWeatherConditionIcon()
  const temperatureLabel =
    weatherSummary && weatherSummary.temperature !== null ? `${weatherSummary.temperature}°C` : null
  const humidityLabel =
    weatherSummary && weatherSummary.humidity !== null ? `${weatherSummary.humidity}% RH` : null
  const precipitationLabel =
    weatherSummary && weatherSummary.precipitation !== null
      ? weatherSummary.precipitation > WEATHER_THRESHOLDS.RAIN_MM
        ? `${weatherSummary.precipitation.toFixed(1)}mm rain`
        : 'No rain today'
      : null
  const hasRainForecast =
    weatherSummary !== undefined &&
    weatherSummary !== null &&
    weatherSummary.precipitation !== null &&
    weatherSummary.precipitation > WEATHER_THRESHOLDS.RAIN_MM

  const formatNumber = (value: number | null | undefined, options?: Intl.NumberFormatOptions) => {
    if (value === null || value === undefined) return '—'
    const formatter = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
      ...options
    })
    return formatter.format(value)
  }

  const formatHarvest = (value: number | null | undefined) => {
    if (value === null || value === undefined || value === 0) return 'No harvest yet'
    if (value < 1000) return `${formatNumber(value)} kg harvested`
    const tonnes = value / 1000
    return `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(tonnes)} t harvested`
  }

  const formatWaterUsage = (value: number | null | undefined) => {
    if (value === null || value === undefined || value === 0) return 'No irrigation logged yet'
    if (value < 1000) return `${formatNumber(value)} L used`
    if (value < 1000000) {
      const kilolitres = value / 1000
      return `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(kilolitres)} kL used`
    }
    const megalitres = value / 1000000
    return `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(megalitres)} ML used`
  }

  const daysAfterPruning = calculateDaysAfterPruning(farm.dateOfPruning)
  const locationLabel = farm.locationName || (farm.region ? capitalize(farm.region) : null)

  const tagItems = [
    daysAfterPruning !== null
      ? {
          icon: Scissors,
          label: `${daysAfterPruning} days`,
          emphasis: true
        }
      : null,
    farm.cropVariety
      ? {
          icon: Grape,
          label: capitalize(farm.cropVariety),
          emphasis: false
        }
      : null
  ].filter(Boolean) as Array<{ icon: ElementType; label: string; emphasis?: boolean }>

  if (loading) {
    return (
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-36 rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10" />
        </div>
      </section>
    )
  }

  if (!farm) return null

  const hasPendingTasks = (pendingTasksCount ?? 0) > 0

  const formatRemainingWater = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '—'
    return `${value.toFixed(1)} mm`
  }

  const waterUsageCaption = totalWaterUsage
    ? `${formatWaterUsage(totalWaterUsage)} this season`
    : 'Log irrigation to monitor water use'

  const logEntriesCaption =
    totalLogs && totalLogs > 0 ? 'Across all categories' : 'Start logging to build history'

  const harvestCaption =
    totalHarvest && totalHarvest > 0 ? 'Current season yield' : 'Record harvest to track output'

  const stats: Array<{
    label: string
    value: string
    caption: string
    icon: typeof ListChecks
    onClick?: () => void
  }> = [
    {
      label: 'Pending tasks',
      value: formatNumber(pendingTasksCount ?? 0),
      caption: hasPendingTasks ? 'Action items queued' : 'All caught up',
      icon: ListChecks
    },
    {
      label: 'Log entries',
      value: formatNumber(totalLogs ?? 0),
      caption: logEntriesCaption,
      icon: ClipboardList,
      onClick: onViewLogEntries
    },
    {
      label: 'Harvest to date',
      value: formatHarvest(totalHarvest),
      caption: harvestCaption,
      icon: Sprout
    },
    {
      label: 'Soil water',
      value: formatRemainingWater(farm.remainingWater),
      caption: waterUsageCaption,
      icon: Gauge,
      onClick: onOpenWaterCalculator
    }
  ]

  return (
    <section className="overflow-hidden border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="flex items-start gap-3 sm:flex-1 sm:gap-4">
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:h-14 sm:w-14">
                <Grape className="h-6 w-6 sm:h-7 sm:w-7" />
              </span>
              <div className="flex min-w-0 flex-col gap-3">
                <div className="flex items-center gap-2 sm:items-start">
                  <div className="flex min-w-0 flex-col gap-2">
                    <h1
                      className="w-full truncate text-xl font-semibold tracking-tight text-foreground sm:max-w-[540px] sm:text-3xl"
                      title={capitalize(farm.name)}
                    >
                      {capitalize(farm.name)}
                    </h1>
                    {(locationLabel || (typeof farm.area === 'number' && farm.area > 0)) && (
                      <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground">
                        {locationLabel && (
                          <span className="inline-flex min-w-0 items-center gap-1">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="max-w-[70vw] truncate sm:max-w-xs lg:max-w-sm">
                              {locationLabel}
                            </span>
                          </span>
                        )}
                        {locationLabel && typeof farm.area === 'number' && farm.area > 0 && (
                          <span className="text-muted-foreground/60">•</span>
                        )}
                        {typeof farm.area === 'number' && farm.area > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Ruler className="h-4 w-4 text-primary" />
                            {farm.area} acres
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {(tagItems.length > 0 || onEditFarm || onDeleteFarm) && (
                  <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3">
                    {tagItems.length > 0 && (
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
                        {tagItems.map(({ icon: TagIcon, label, emphasis }) => (
                          <span
                            key={label}
                            className={`inline-flex max-w-[75vw] items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold sm:max-w-[220px] sm:text-xs ${
                              emphasis
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground/80'
                            }`}
                          >
                            <TagIcon
                              className={`h-3.5 w-3.5 flex-shrink-0 sm:h-4 sm:w-4 ${
                                emphasis ? 'text-primary-foreground' : 'text-primary'
                              }`}
                            />
                            <span className="truncate">{label}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {(onAddLogs || onEditFarm || onDeleteFarm) && (
                      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:hidden">
                        {onAddLogs && (
                          <Button
                            size="sm"
                            onClick={onAddLogs}
                            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                          >
                            <Plus className="h-4 w-4" />
                            Log
                          </Button>
                        )}
                        {(onEditFarm || onDeleteFarm) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 shrink-0 rounded-full border border-border/60 bg-muted/70 text-muted-foreground transition hover:border-primary/60 hover:text-primary"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              sideOffset={6}
                              className="w-40 rounded-xl border border-border/60 bg-card/95 text-sm shadow-lg backdrop-blur"
                            >
                              {onEditFarm && (
                                <DropdownMenuItem
                                  onClick={() => onEditFarm(farm)}
                                  className="flex items-center gap-2 text-foreground focus:text-primary"
                                >
                                  Edit farm
                                </DropdownMenuItem>
                              )}
                              {onDeleteFarm && (
                                <DropdownMenuItem
                                  onClick={() => farm.id && onDeleteFarm(farm.id)}
                                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                                >
                                  Delete farm
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {weatherSummary && (
                  <div className="rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/12 via-primary/6 to-transparent px-3 py-3 sm:px-5 sm:py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-5">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm sm:h-10 sm:w-10">
                          <WeatherConditionIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                        </span>
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="truncate text-sm font-semibold text-primary">
                            {weatherConditionLabel}
                          </span>
                          <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground sm:text-xs">
                            {temperatureLabel && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-foreground/80 shadow-sm">
                                <Thermometer className="h-3 w-3 text-primary" />
                                {temperatureLabel}
                              </span>
                            )}
                            {humidityLabel && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-foreground/80 shadow-sm">
                                <Droplets className="h-3 w-3 text-primary" />
                                {humidityLabel}
                              </span>
                            )}
                            {precipitationLabel && (
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 shadow-sm ${
                                  hasRainForecast
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-background/90 text-foreground/80'
                                }`}
                              >
                                <CloudRain className="h-3 w-3" />
                                {precipitationLabel}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {onOpenWeatherDetails && (
                        <Button
                          size="sm"
                          onClick={onOpenWeatherDetails}
                          className="inline-flex h-9 items-center gap-1 rounded-full border border-primary/30 bg-background px-3 text-xs font-semibold text-primary shadow-sm transition hover:bg-primary/10 sm:h-10 sm:px-4 sm:text-sm"
                        >
                          Weather
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {(onAddLogs || onEditFarm || onDeleteFarm) && (
              <div className="hidden shrink-0 items-start gap-2 sm:flex sm:flex-col sm:items-end">
                {onAddLogs && (
                  <Button
                    onClick={onAddLogs}
                    className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                    Log activity
                  </Button>
                )}
                {(onEditFarm || onDeleteFarm) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="mt-1 h-11 w-11 shrink-0 rounded-full border-border/70 bg-card text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      sideOffset={6}
                      className="w-44 rounded-xl border border-border/60 bg-card/95 text-sm shadow-lg backdrop-blur"
                    >
                      {onEditFarm && (
                        <DropdownMenuItem
                          onClick={() => onEditFarm(farm)}
                          className="flex items-center gap-2 text-foreground focus:text-primary"
                        >
                          Edit farm
                        </DropdownMenuItem>
                      )}
                      {onDeleteFarm && (
                        <DropdownMenuItem
                          onClick={() => farm.id && onDeleteFarm(farm.id)}
                          className="flex items-center gap-2 text-destructive focus:text-destructive"
                        >
                          Delete farm
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border/70" />

      <div className="px-4 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            const Wrapper: ElementType = stat.onClick ? 'button' : 'div'
            return (
              <Wrapper
                key={stat.label}
                type={stat.onClick ? 'button' : undefined}
                onClick={stat.onClick}
                className={`flex h-full min-h-[120px] w-full flex-col justify-between rounded-2xl border border-border/60 bg-muted/20 p-3 text-left sm:min-h-[136px] sm:p-3.5 ${
                  stat.onClick
                    ? 'cursor-pointer transition hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  <span className="max-w-[70%] truncate sm:max-w-[65%]">{stat.label}</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-10 sm:w-10">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold text-foreground sm:text-2xl">
                  {stat.value}
                </div>
                <p className="line-clamp-2 text-[11px] text-muted-foreground/80 sm:text-xs">
                  {stat.caption}
                </p>
              </Wrapper>
            )
          })}
        </div>
      </div>
    </section>
  )
}
