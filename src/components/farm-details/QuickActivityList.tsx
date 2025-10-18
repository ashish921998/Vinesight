'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, ArrowRight } from 'lucide-react'
import { getActivityDisplayData } from '@/lib/activity-display-utils'
import { getLogTypeIcon, getLogTypeBgColor, getLogTypeColor } from '@/lib/log-type-config'

interface QuickActivityListProps {
  activities: any[]
  onSeeAll?: () => void
}

export function QuickActivityList({ activities = [], onSeeAll }: QuickActivityListProps) {
  const topActivities = activities.slice(0, 3)

  if (!activities || activities.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-gray-500 text-sm">
          No activity logged yet. Start adding your farm updates.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topActivities.map((activity, index) => {
          const Icon = getLogTypeIcon(activity.type)
          return (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
            >
              <div
                className={`p-2 rounded-lg ${getLogTypeBgColor(activity.type)} ${getLogTypeColor(activity.type)}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {getActivityDisplayData(activity)}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(activity.date || activity.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )
        })}

        {onSeeAll && (
          <Button
            onClick={onSeeAll}
            variant="ghost"
            className="w-full h-9 text-sm text-green-700 hover:text-green-800 hover:bg-green-50"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            View full log
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
