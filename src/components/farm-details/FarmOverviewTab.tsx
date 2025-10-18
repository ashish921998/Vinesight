'use client'

import { CompactWeatherWidget } from './CompactWeatherWidget'
import { CompactWaterLevel } from './CompactWaterLevel'
import { PendingTasksCard } from './PendingTasksCard'
import { QuickActivityList } from './QuickActivityList'
import type { Farm } from '@/types/types'

interface FarmOverviewTabProps {
  farm: Farm
  pendingTasks?: any[]
  recentActivities?: any[]
  onCompleteTask: (taskId: number) => Promise<void>
  onCalculateWater: () => void
  onSeeAllActivities?: () => void
}

export function FarmOverviewTab({
  farm,
  pendingTasks = [],
  recentActivities = [],
  onCompleteTask,
  onCalculateWater,
  onSeeAllActivities
}: FarmOverviewTabProps) {
  const hasLocation = farm.latitude !== undefined && farm.longitude !== undefined

  return (
    <div className="space-y-4 pb-24 px-4">
      {/* Weather Widget */}
      {hasLocation && <CompactWeatherWidget farm={farm} />}

      {/* Water Level - Show if user has irrigation records or tank capacity configured */}
      {farm.totalTankCapacity && (
        <CompactWaterLevel farm={farm} onCalculateClick={onCalculateWater} />
      )}

      {/* Pending Tasks */}
      {pendingTasks && pendingTasks.length > 0 && (
        <PendingTasksCard tasks={pendingTasks} onCompleteTask={onCompleteTask} />
      )}

      {/* Recent Activity */}
      <QuickActivityList activities={recentActivities} onSeeAll={onSeeAllActivities} />
    </div>
  )
}
