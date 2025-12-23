'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  Droplets,
  CloudRain,
  Bug,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react'

interface Alert {
  id: string
  type: 'critical' | 'warning' | 'info'
  category: 'weather' | 'irrigation' | 'pest' | 'task' | 'equipment'
  title: string
  message: string
  actionRequired?: boolean
  actionText?: string
  timestamp: Date
  farmId?: number
}

interface AlertsSectionProps {
  alerts: Alert[]
  onAlertAction?: (alertId: string) => void
  loading?: boolean
  className?: string
}

export function AlertsSection({ alerts, onAlertAction, loading, className }: AlertsSectionProps) {
  const getAlertIcon = (category: string, type: string) => {
    const iconClass =
      type === 'critical' ? 'text-destructive' : type === 'warning' ? 'text-accent' : 'text-primary'

    switch (category) {
      case 'weather':
        return <CloudRain className={cn('h-5 w-5', iconClass)} />
      case 'irrigation':
        return <Droplets className={cn('h-5 w-5', iconClass)} />
      case 'pest':
        return <Bug className={cn('h-5 w-5', iconClass)} />
      case 'task':
        return <Clock className={cn('h-5 w-5', iconClass)} />
      case 'equipment':
        return <AlertTriangle className={cn('h-5 w-5', iconClass)} />
      default:
        return <AlertTriangle className={cn('h-5 w-5', iconClass)} />
    }
  }

  const getActionToneClasses = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-destructive/30 bg-destructive/10 text-destructive'
      case 'warning':
        return 'border-accent/30 bg-accent/10 text-accent'
      default:
        return 'border-accent/20 bg-accent/10 text-primary'
    }
  }

  const containerClass = cn(
    'rounded-3xl border border-border/60 bg-background/95 px-5 py-5 shadow-sm backdrop-blur',
    className
  )

  if (loading) {
    return (
      <div className={containerClass}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/30">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-32 rounded-full bg-muted/40 animate-pulse" />
            <div className="h-3 w-24 rounded-full bg-muted/20 animate-pulse" />
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-[88px] rounded-2xl border border-border/40 bg-muted/10 animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  const criticalAlerts = alerts.filter((alert) => alert.type === 'critical')
  const warningAlerts = alerts.filter((alert) => alert.type === 'warning')
  const infoAlerts = alerts.filter((alert) => alert.type === 'info')

  const sortedAlerts = [...criticalAlerts, ...warningAlerts, ...infoAlerts].slice(0, 5)

  return (
    <div className={containerClass}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-primary">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground md:text-base">
              Alerts & safeguards
            </h3>
            <p className="text-xs text-muted-foreground">
              {sortedAlerts.length > 0
                ? `Showing ${sortedAlerts.length} high-impact signal${sortedAlerts.length > 1 ? 's' : ''}.`
                : 'No urgent notifications right now.'}
            </p>
          </div>
        </div>
        {alerts.length > 5 && (
          <Button
            variant="outline"
            size="sm"
            className="h-10 rounded-2xl border-border/60 bg-background/80 px-4 text-xs text-primary"
          >
            View all ({alerts.length})
          </Button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className="rounded-full border-border/60 bg-background/80 px-2.5 py-1 text-[11px] uppercase tracking-wide text-muted-foreground"
        >
          {alerts.length} total
        </Badge>
        {criticalAlerts.length > 0 && (
          <Badge
            variant="outline"
            className="rounded-full border-destructive/30 bg-destructive/10 px-2.5 py-1 text-[11px] uppercase tracking-wide text-destructive"
          >
            {criticalAlerts.length} critical
          </Badge>
        )}
        {warningAlerts.length > 0 && (
          <Badge
            variant="outline"
            className="rounded-full border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] uppercase tracking-wide text-accent"
          >
            {warningAlerts.length} warning
          </Badge>
        )}
      </div>

      {sortedAlerts.length === 0 ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-border/60 bg-background/70 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <CheckCircle className="h-4 w-4" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Nothing urgent</h4>
              <p className="text-xs text-muted-foreground">
                Sensors are quiet. We’ll surface risk the moment it appears.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {sortedAlerts.map((alert) => {
            const toneClasses = getActionToneClasses(alert.type)
            return (
              <div
                key={alert.id}
                className={cn(
                  'relative overflow-hidden rounded-2xl border border-border/60 bg-background/90 px-4 py-4 transition-all hover:-translate-y-0.5 hover:shadow-lg',
                  toneClasses
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-border/50 bg-card/70">
                    {getAlertIcon(alert.category, alert.type)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">{alert.title}</h4>
                      <Badge
                        variant="outline"
                        className="rounded-full border-border/60 bg-card/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-foreground/80"
                      >
                        {alert.type}
                      </Badge>
                      <span className="ml-auto text-[11px] uppercase tracking-wide text-foreground/60">
                        {alert.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/80">{alert.message}</p>
                    {alert.actionRequired && alert.actionText && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 rounded-full border-foreground/20 bg-card/60 px-4 text-xs font-medium text-foreground"
                        onClick={() => onAlertAction?.(alert.id)}
                      >
                        {alert.actionText}
                        <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
