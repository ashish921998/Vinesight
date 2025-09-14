'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, MapPin, Activity, AlertTriangle, TrendingUp, ArrowLeft } from 'lucide-react'

interface Farm {
  id: string
  name: string
  location: string
  status: 'healthy' | 'attention' | 'critical'
  healthScore: number
  criticalAlerts: number
  profitMargin: number
}

interface FarmSelectorProps {
  farms: Farm[]
  selectedFarmId?: string
  showPortfolio?: boolean
  onFarmSelect: (farmId: string) => void
  onPortfolioSelect?: () => void
}

export function FarmSelector({
  farms,
  selectedFarmId,
  showPortfolio = false,
  onFarmSelect,
  onPortfolioSelect,
}: FarmSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedFarm = farms.find((farm) => farm.id === selectedFarmId)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100'
      case 'attention':
        return 'text-amber-600 bg-amber-100'
      case 'critical':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-amber-600'
    return 'text-red-600'
  }

  return (
    <div className="relative">
      {/* Current Selection Button */}
      <Button
        variant="outline"
        className="w-full h-auto p-3 justify-between text-left touch-manipulation"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {!selectedFarmId ? (
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="font-medium">Portfolio Overview</span>
            </div>
          ) : selectedFarm ? (
            <>
              <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedFarm.status)}`} />
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{selectedFarm.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {selectedFarm.location}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {selectedFarm.criticalAlerts > 0 && (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <div
                  className={`text-sm font-semibold ${getHealthScoreColor(selectedFarm.healthScore)}`}
                >
                  {selectedFarm.healthScore}
                </div>
              </div>
            </>
          ) : null}
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-2 shadow-lg">
          <CardContent className="p-2">
            <div className="space-y-1">
              {/* Portfolio Option */}
              {showPortfolio && (
                <button
                  className={`w-full p-3 text-left rounded-lg transition-all hover:bg-muted touch-manipulation ${
                    !selectedFarmId ? 'bg-primary/10 border border-primary/20' : ''
                  }`}
                  onClick={() => {
                    onPortfolioSelect?.()
                    setIsOpen(false)
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium text-primary">Portfolio Overview</div>
                      <div className="text-xs text-muted-foreground">
                        View all {farms.length} farms
                      </div>
                    </div>
                  </div>
                </button>
              )}

              {/* Farm Options */}
              {farms.map((farm) => (
                <button
                  key={farm.id}
                  className={`w-full p-3 text-left rounded-lg transition-all hover:bg-muted touch-manipulation ${
                    selectedFarmId === farm.id ? 'bg-primary/10 border border-primary/20' : ''
                  }`}
                  onClick={() => {
                    onFarmSelect(farm.id)
                    setIsOpen(false)
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${getStatusColor(farm.status)}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{farm.name}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{farm.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {farm.criticalAlerts > 0 && (
                        <Badge variant="destructive" className="text-xs px-1">
                          {farm.criticalAlerts}
                        </Badge>
                      )}
                      <div className="text-center">
                        <div
                          className={`text-sm font-semibold ${getHealthScoreColor(farm.healthScore)}`}
                        >
                          {farm.healthScore}
                        </div>
                        <div className="text-xs text-green-600">
                          +{farm.profitMargin.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Click Outside Handler */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  )
}

// Quick Access Farm Tabs (for frequent switching)
export function FarmTabs({
  farms,
  selectedFarmId,
  onFarmSelect,
  maxTabs = 3,
}: {
  farms: Farm[]
  selectedFarmId?: string
  onFarmSelect: (farmId: string) => void
  maxTabs?: number
}) {
  // Show most critical/important farms as quick tabs
  const priorityFarms = farms
    .sort((a, b) => {
      // Priority: critical alerts > attention status > healthy but high profit
      if (a.criticalAlerts !== b.criticalAlerts) return b.criticalAlerts - a.criticalAlerts
      if (a.status === 'critical' && b.status !== 'critical') return -1
      if (b.status === 'critical' && a.status !== 'critical') return 1
      if (a.status === 'attention' && b.status === 'healthy') return -1
      if (b.status === 'attention' && a.status === 'healthy') return 1
      return b.profitMargin - a.profitMargin
    })
    .slice(0, maxTabs)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'border-green-200 bg-green-50 text-green-800'
      case 'attention':
        return 'border-amber-200 bg-amber-50 text-amber-800'
      case 'critical':
        return 'border-red-200 bg-red-50 text-red-800'
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800'
    }
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {priorityFarms.map((farm) => (
        <button
          key={farm.id}
          className={`flex-shrink-0 p-2 rounded-lg border-2 transition-all touch-manipulation ${
            selectedFarmId === farm.id
              ? 'border-primary bg-primary/10 text-primary'
              : `${getStatusColor(farm.status)} hover:shadow-md`
          }`}
          onClick={() => onFarmSelect(farm.id)}
        >
          <div className="text-center min-w-16">
            <div className="text-xs font-medium truncate max-w-20">{farm.name.split(' ')[0]}</div>
            <div className="flex items-center justify-center gap-1 mt-1">
              {farm.criticalAlerts > 0 && <AlertTriangle className="h-3 w-3 text-red-600" />}
              <span className="text-xs font-bold">{farm.healthScore}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
