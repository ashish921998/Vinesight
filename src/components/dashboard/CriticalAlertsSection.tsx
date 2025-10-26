'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Droplets, CheckSquare, Bug, AlertCircle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type CriticalAlert } from '@/lib/portfolio-utils'

interface CriticalAlertsSectionProps {
  alerts: CriticalAlert[]
  onAlertClick: (farmId: number, alert: CriticalAlert) => void
  className?: string
}

export function CriticalAlertsSection({
  alerts,
  onAlertClick,
  className
}: CriticalAlertsSectionProps) {
  if (alerts.length === 0) {
    return null
  }

  // Only show high priority alerts (critical and high severity)
  const criticalAlerts = alerts.filter(
    (alert) => alert.severity === 'critical' || alert.severity === 'high'
  )

  if (criticalAlerts.length === 0) {
    return null
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'water':
        return <Droplets className="h-4 w-4" />
      case 'task':
        return <CheckSquare className="h-4 w-4" />
      case 'pest':
        return <Bug className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-500',
          textColor: 'text-red-700',
          iconColor: 'text-red-600',
          badgeVariant: 'destructive' as const
        }
      case 'high':
        return {
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-500',
          textColor: 'text-amber-700',
          iconColor: 'text-amber-600',
          badgeVariant: 'outline' as const
        }
      default:
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-500',
          textColor: 'text-blue-700',
          iconColor: 'text-blue-600',
          badgeVariant: 'outline' as const
        }
    }
  }

  return (
    <div className={cn('px-4 py-2 space-y-2', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
        <h3 className="font-semibold text-base">Critical Alerts ({criticalAlerts.length})</h3>
      </div>

      {/* Alerts List */}
      <div className="space-y-2">
        {criticalAlerts.slice(0, 5).map((alert, index) => {
          const config = getSeverityConfig(alert.severity)

          return (
            <Card
              key={index}
              className={cn(
                'border-l-4 cursor-pointer transition-all hover:shadow-md',
                config.borderColor,
                config.bgColor
              )}
              onClick={() => onAlertClick(alert.farmId, alert)}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={cn('p-2 rounded-md bg-white/80 flex-shrink-0', config.iconColor)}>
                    {getAlertIcon(alert.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Farm Name & Severity */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{alert.farmName}</span>
                      <Badge variant={config.badgeVariant} className="text-xs">
                        {alert.severity.toUpperCase()}
                      </Badge>
                      {alert.actionRequired && (
                        <Badge variant="outline" className="text-xs bg-white">
                          Action Required
                        </Badge>
                      )}
                    </div>

                    {/* Alert Title */}
                    <div className={cn('font-medium text-sm', config.textColor)}>{alert.title}</div>

                    {/* Alert Description */}
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {alert.description}
                    </div>

                    {/* Timestamp */}
                    <div className="text-xs text-muted-foreground">
                      {getTimeAgo(alert.timestamp)}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0 h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAlertClick(alert.farmId, alert)
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Show More Link */}
      {criticalAlerts.length > 5 && (
        <Button variant="ghost" size="sm" className="w-full">
          View All {criticalAlerts.length} Alerts
        </Button>
      )}
    </div>
  )
}

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
