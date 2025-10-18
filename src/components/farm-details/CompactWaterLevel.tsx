'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Droplets, Calculator, AlertTriangle } from 'lucide-react'
import type { Farm } from '@/types/types'

interface CompactWaterLevelProps {
  farm: Farm
  onCalculateClick: () => void
}

export function CompactWaterLevel({ farm, onCalculateClick }: CompactWaterLevelProps) {
  // Don't show if no tank capacity configured
  if (!farm.totalTankCapacity) {
    return null
  }

  const hasWaterData = farm.remainingWater !== null && farm.remainingWater !== undefined

  const getWaterLevelColor = (level: number) => {
    if (level < 6)
      return {
        bg: 'bg-red-50',
        text: 'text-red-600',
        border: 'border-red-200',
        icon: 'text-red-500'
      }
    if (level < 10)
      return {
        bg: 'bg-orange-50',
        text: 'text-orange-600',
        border: 'border-orange-200',
        icon: 'text-orange-500'
      }
    if (level < 25)
      return {
        bg: 'bg-yellow-50',
        text: 'text-yellow-600',
        border: 'border-yellow-200',
        icon: 'text-yellow-500'
      }
    return {
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200',
      icon: 'text-green-500'
    }
  }

  const colors = hasWaterData
    ? getWaterLevelColor(farm.remainingWater!)
    : { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', icon: 'text-gray-400' }

  return (
    <Card className={`${colors.border} ${colors.bg} border`}>
      <CardContent className="p-4">
        {hasWaterData ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-white/80 rounded-xl ${colors.text}`}>
                {farm.remainingWater! < 6 ? (
                  <AlertTriangle className={`h-5 w-5 ${colors.icon}`} />
                ) : (
                  <Droplets className={`h-5 w-5 ${colors.icon}`} />
                )}
              </div>
              <div>
                <div className={`text-2xl font-bold ${colors.text}`}>
                  {farm.remainingWater!.toFixed(1)}mm
                </div>
                <div className="text-xs text-gray-600">Soil Water Level</div>
              </div>
            </div>
            <Button
              onClick={onCalculateClick}
              size="sm"
              variant="ghost"
              className={`${colors.text} hover:bg-white/50`}
            >
              <Calculator className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/80 rounded-xl">
                <Droplets className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Water Level</div>
                <div className="text-xs text-gray-600">Not calculated yet</div>
              </div>
            </div>
            <Button
              onClick={onCalculateClick}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Calculator className="h-4 w-4 mr-1" />
              Calculate
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
