'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { DiseaseRiskAlert } from '@/lib/ai-intelligence'
import { AlertTriangle, Shield, CheckCircle2 } from 'lucide-react'

interface DiseaseRiskAlertsProps {
  alerts: DiseaseRiskAlert[]
}

export function DiseaseRiskAlerts({ alerts }: DiseaseRiskAlertsProps) {
  if (alerts.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">No disease risks detected</p>
              <p className="text-sm text-green-700">
                Your nutrient levels are in healthy ranges that minimize disease susceptibility.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'border-red-300 bg-red-50'
      case 'high':
        return 'border-orange-300 bg-orange-50'
      case 'medium':
        return 'border-yellow-300 bg-yellow-50'
      default:
        return 'border-blue-300 bg-blue-50'
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      default:
        return <AlertTriangle className="h-5 w-5 text-blue-600" />
    }
  }

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      default:
        return 'bg-blue-100 text-blue-700 border-blue-300'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-orange-600" />
          🛡️ Disease Risk Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2 text-sm text-amber-900">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p className="leading-relaxed">
              <strong>AI Analysis:</strong> Based on your test results, certain nutrient deficiencies
              increase disease susceptibility. Take preventive action now to protect your crop.
            </p>
          </div>
        </div>

        {alerts.map((alert, idx) => (
          <Alert key={idx} className={getRiskColor(alert.risk_level)}>
            {getRiskIcon(alert.risk_level)}
            <AlertTitle className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold capitalize">
                {alert.nutrient_deficiency.replace('_', ' ')} Deficiency
              </span>
              <Badge variant="outline" className={getRiskBadgeColor(alert.risk_level)}>
                {alert.risk_level.toUpperCase()} RISK
              </Badge>
            </AlertTitle>
            <AlertDescription className="space-y-3 mt-2">
              {/* Risk Explanation */}
              <div>
                <div className="text-sm font-semibold mb-1">Disease Risks:</div>
                <div className="flex flex-wrap gap-2">
                  {alert.disease_risks.map((disease, didx) => (
                    <Badge
                      key={didx}
                      variant="outline"
                      className="text-xs bg-white/50"
                    >
                      {disease}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              <div className="text-sm leading-relaxed opacity-90">
                {alert.risk_explanation}
              </div>

              {/* Preventive Actions */}
              {alert.preventive_actions && alert.preventive_actions.length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Preventive Actions:
                  </div>
                  <ul className="space-y-1 text-sm">
                    {alert.preventive_actions.map((action, aidx) => (
                      <li key={aidx} className="flex items-start gap-2">
                        <span className="mt-1">•</span>
                        <span className="flex-1 leading-relaxed">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        ))}

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-red-700">
                {alerts.filter((a) => a.risk_level === 'critical' || a.risk_level === 'high').length}
              </div>
              <div className="text-xs text-red-600 font-medium">High Risk Alerts</div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-yellow-700">
                {alerts.filter((a) => a.risk_level === 'medium' || a.risk_level === 'low').length}
              </div>
              <div className="text-xs text-yellow-600 font-medium">Monitor</div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}
