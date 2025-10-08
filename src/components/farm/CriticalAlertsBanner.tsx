'use client'

import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Bug, Zap, Clock, ChevronRight, X, Shield, Sprout } from 'lucide-react'
import type { CriticalAlert } from '@/types/ai'

interface CriticalAlertsBannerProps {
  alerts: CriticalAlert[]
  onAlertAction: (alertId: string, action: string, actionData?: Record<string, any>) => void
  onDismiss?: (alertId: string) => void
  className?: string
}

export function CriticalAlertsBanner({
  alerts,
  onAlertAction,
  onDismiss,
  className = ''
}: CriticalAlertsBannerProps) {
  if (!alerts || alerts.length === 0) {
    return null
  }

  const criticalAlerts = alerts.filter((alert) => alert.severity === 'critical')
  const highAlerts = alerts.filter((alert) => alert.severity === 'high')

  const getAlertIcon = (type: string, severity: string) => {
    const iconSize = severity === 'critical' ? 'h-6 w-6' : 'h-5 w-5'
    const iconColor = severity === 'critical' ? 'text-red-600' : 'text-orange-600'

    switch (type) {
      case 'pest_prediction':
        return <Bug className={`${iconSize} ${iconColor}`} />
      case 'weather_warning':
        return <Zap className={`${iconSize} ${iconColor}`} />
      case 'equipment_failure':
        return <AlertTriangle className={`${iconSize} ${iconColor}`} />
      case 'market_crash':
        return <Sprout className={`${iconSize} ${iconColor}`} />
      default:
        return <AlertTriangle className={`${iconSize} ${iconColor}`} />
    }
  }

  const getAlertColors = (severity: string) => {
    if (severity === 'critical') {
      return {
        border: 'border-red-500',
        background: 'bg-red-50',
        text: 'text-red-900',
        badge: 'bg-red-100 text-red-800',
        button: 'bg-red-600 hover:bg-red-700 text-white'
      }
    } else {
      return {
        border: 'border-orange-500',
        background: 'bg-orange-50',
        text: 'text-orange-900',
        badge: 'bg-orange-100 text-orange-800',
        button: 'bg-orange-600 hover:bg-orange-700 text-white'
      }
    }
  }

  const handleAlertAction = (alert: CriticalAlert, actionIndex: number) => {
    const action = alert.actions[actionIndex]
    onAlertAction(alert.id, action.action, action.actionData)
  }

  const AlertCard = ({ alert }: { alert: CriticalAlert }) => {
    const colors = getAlertColors(alert.severity)
    const timeRemaining = alert.timeWindow.end.getTime() - new Date().getTime()
    const hoursRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)))
    const daysRemaining = Math.floor(hoursRemaining / 24)

    return (
      <Alert className={`${colors.border} ${colors.background} border-l-4 mb-3 shadow-md relative`}>
        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={() => onDismiss(alert.id)}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}

        <div className="flex items-start gap-3 pr-8">
          {/* Alert Icon */}
          <div className="flex-shrink-0 mt-0.5">{getAlertIcon(alert.type, alert.severity)}</div>

          {/* Alert Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold text-lg ${colors.text}`}>{alert.title}</h3>
              <Badge variant="outline" className={colors.badge}>
                {alert.severity.toUpperCase()}
              </Badge>
            </div>

            <AlertDescription className={`${colors.text} mb-3 text-base leading-relaxed`}>
              {alert.message}
            </AlertDescription>

            {/* Time Window */}
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700">
                {daysRemaining > 0
                  ? `${daysRemaining} days ${hoursRemaining % 24} hours remaining`
                  : hoursRemaining > 0
                    ? `${hoursRemaining} hours remaining`
                    : 'Action required immediately'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {alert.actions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={action.type === 'primary' ? 'default' : 'outline'}
                  className={action.type === 'primary' ? colors.button : ''}
                  onClick={() => handleAlertAction(alert, index)}
                >
                  {action.label}
                  {action.type === 'primary' && <ChevronRight className="ml-1 h-3 w-3" />}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Alert>
    )
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Critical Alerts - Always show first */}
      {criticalAlerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}

      {/* High Priority Alerts */}
      {highAlerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}

      {/* Summary Footer for multiple alerts */}
      {alerts.length > 3 && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700">
                {alerts.length} active alerts requiring your attention
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={() => onAlertAction('all', 'view_all')}>
              View All Alerts
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CriticalAlertsBanner
