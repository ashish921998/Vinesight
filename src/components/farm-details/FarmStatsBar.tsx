'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Droplets, Activity, CheckCircle, Wheat } from 'lucide-react'

interface FarmStatsBarProps {
  recordCounts?: {
    irrigation: number
    spray: number
    fertigation: number
    harvest: number
    expense: number
    soilTest: number
  }
  pendingTasksCount?: number
  waterLevel?: number | null
  totalHarvest?: number
  loading?: boolean
}

export function FarmStatsBar({
  recordCounts,
  pendingTasksCount = 0,
  waterLevel,
  totalHarvest = 0,
  loading = false
}: FarmStatsBarProps) {
  const totalLogs = recordCounts
    ? Object.values(recordCounts).reduce((sum, count) => sum + count, 0)
    : 0

  const getWaterLevelColor = (level: number) => {
    if (level < 6) return 'text-red-600 bg-red-50'
    if (level < 10) return 'text-orange-600 bg-orange-50'
    if (level < 25) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  const stats = [
    {
      label: 'Total Logs',
      value: totalLogs,
      icon: Activity,
      color: 'text-blue-600 bg-blue-50',
      show: true
    },
    {
      label: 'Pending Tasks',
      value: pendingTasksCount,
      icon: CheckCircle,
      color: pendingTasksCount > 0 ? 'text-orange-600 bg-orange-50' : 'text-gray-600 bg-gray-50',
      show: true
    },
    {
      label: 'Water Level',
      value: waterLevel !== null && waterLevel !== undefined ? `${waterLevel.toFixed(0)}mm` : 'N/A',
      icon: Droplets,
      color:
        waterLevel !== null && waterLevel !== undefined
          ? getWaterLevelColor(waterLevel)
          : 'text-gray-600 bg-gray-50',
      show: waterLevel !== null && waterLevel !== undefined
    },
    {
      label: 'Total Harvest',
      value: `${totalHarvest.toFixed(0)}kg`,
      icon: Wheat,
      color: 'text-green-600 bg-green-50',
      show: totalHarvest > 0
    },
    {
      label: 'Irrigation',
      value: recordCounts?.irrigation || 0,
      icon: Droplets,
      color: 'text-blue-600 bg-blue-50',
      show: (recordCounts?.irrigation || 0) > 0
    },
    {
      label: 'Spray Records',
      value: recordCounts?.spray || 0,
      icon: Activity,
      color: 'text-purple-600 bg-purple-50',
      show: (recordCounts?.spray || 0) > 0
    }
  ]

  const visibleStats = stats.filter((stat) => stat.show)

  if (loading) {
    return (
      <div className="px-4 -mt-2 mb-4">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="flex-shrink-0 w-32 border-gray-200">
              <CardContent className="p-3">
                <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse mb-2" />
                <div className="w-12 h-4 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 -mt-2 mb-4">
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {visibleStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="flex-shrink-0 w-32 border-gray-200 snap-start">
              <CardContent className="p-3">
                <div className={`inline-flex p-2 rounded-lg ${stat.color} mb-2`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
