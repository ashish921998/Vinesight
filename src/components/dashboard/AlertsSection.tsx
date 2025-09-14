'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  Droplets,
  CloudRain,
  Bug,
  Clock,
  Thermometer,
  Wind,
  CheckCircle,
  ArrowRight,
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
}

export function AlertsSection({ alerts, onAlertAction, loading }: AlertsSectionProps) {
  const getAlertIcon = (category: string, type: string) => {
    const iconClass =
      type === 'critical'
        ? 'h-5 w-5 text-red-600'
        : type === 'warning'
          ? 'h-5 w-5 text-amber-600'
          : 'h-5 w-5 text-primary'

    switch (category) {
      case 'weather':
        return <CloudRain className={iconClass} />
      case 'irrigation':
        return <Droplets className={iconClass} />
      case 'pest':
        return <Bug className={iconClass} />
      case 'task':
        return <Clock className={iconClass} />
      case 'equipment':
        return <AlertTriangle className={iconClass} />
      default:
        return <AlertTriangle className={iconClass} />
    }
  }

  const getAlertBadgeColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      default:
        return 'bg-primary/10 text-primary border-primary/20'
    }
  }

  const getCardBorderColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-l-4 border-l-red-500'
      case 'warning':
        return 'border-l-4 border-l-amber-500'
      default:
        return 'border-l-4 border-l-primary'
    }
  }

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="w-32 h-6 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg animate-pulse"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                  <div className="w-24 h-4 bg-gray-200 rounded mb-1" />
                  <div className="w-32 h-3 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Filter and sort alerts by priority
  const criticalAlerts = alerts.filter((alert) => alert.type === 'critical')
  const warningAlerts = alerts.filter((alert) => alert.type === 'warning')
  const infoAlerts = alerts.filter((alert) => alert.type === 'info')

  const sortedAlerts = [...criticalAlerts, ...warningAlerts, ...infoAlerts].slice(0, 5)

  if (sortedAlerts.length === 0) {
    return (
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-primary mb-3" />
          <h3 className="font-semibold text-foreground mb-1">All Good!</h3>
          <p className="text-sm text-muted-foreground">No urgent alerts or actions needed</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Alerts & Urgent Actions
          {sortedAlerts.length > 0 && (
            <Badge variant="outline" className="bg-primary/10 text-primary">
              {sortedAlerts.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {sortedAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border bg-card transition-all hover:shadow-md touch-manipulation ${getCardBorderColor(alert.type)}`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 p-1.5 rounded-lg bg-background">
                  {getAlertIcon(alert.category, alert.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1 flex-wrap">
                    <h4 className="font-semibold text-sm text-foreground truncate">
                      {alert.title}
                    </h4>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getAlertBadgeColor(alert.type)} px-1`}
                    >
                      {alert.type}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                    {alert.message}
                  </p>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {alert.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {alert.actionRequired && alert.actionText && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-xs border-primary/30 text-primary hover:bg-primary/10 touch-manipulation"
                        onClick={() => onAlertAction?.(alert.id)}
                      >
                        {alert.actionText}
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {alerts.length > 5 && (
          <div className="text-center mt-4">
            <Button variant="ghost" size="sm" className="text-primary h-12 px-6 touch-manipulation">
              View All Alerts ({alerts.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
