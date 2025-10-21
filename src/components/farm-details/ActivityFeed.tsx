'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, CheckCircle, Edit, Trash2, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  getActivityDisplayData,
  groupActivitiesByDate,
  getGroupedActivitiesSummary,
  formatGroupedDate
} from '@/lib/activity-display-utils'
import {
  getLogTypeIcon,
  getLogTypeBgColor,
  getLogTypeColor,
  getLogTypeLabel
} from '@/lib/log-type-config'

interface ActivityFeedProps {
  recentActivities: any[]
  pendingTasks: any[]
  loading: boolean
  onCompleteTask: (taskId: number) => Promise<void>
  onEditRecord: (record: any, recordType: string) => void
  onDeleteRecord: (record: any, recordType: string) => void
  onEditDateGroup?: (date: string, activities: any[]) => void
  onDeleteDateGroup?: (date: string, activities: any[]) => void
  farmId?: string
}

export function ActivityFeed({
  recentActivities,
  pendingTasks,
  loading,
  onCompleteTask,
  onEditRecord,
  onDeleteRecord,
  onEditDateGroup,
  onDeleteDateGroup,
  farmId
}: ActivityFeedProps) {
  const router = useRouter()

  // Group activities by date for better organization
  const groupedActivities = recentActivities ? groupActivitiesByDate(recentActivities) : []

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* Pending Tasks Loading */}
        <Card className="border-gray-200">
          <CardHeader>
            <div className="w-32 h-5 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="flex-1">
                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-1" />
                    <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities Loading */}
        <Card className="border-gray-200">
          <CardHeader>
            <div className="w-32 h-5 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border-l-4 border-gray-200">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="flex-1">
                    <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mb-1" />
                    <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-4 space-y-3">
      {/* Pending Tasks */}
      {pendingTasks && pendingTasks.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Tasks ({pendingTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTasks.slice(0, 3).map((task, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl border border-green-200"
                >
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">
                      {task.title || task.task_type || 'Task'}
                    </p>
                    <p className="text-xs text-gray-600">
                      Due:{' '}
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                    </p>
                  </div>

                  <button
                    onClick={() => onCompleteTask(task.id)}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors"
                  >
                    Complete
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activities */}
      <Card className="border-gray-200">
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-3 pb-3 space-y-2">
          {groupedActivities.length > 0 ? (
            <div className="space-y-2">
              {groupedActivities.slice(0, 5).map((grouped, index) => {
                const firstActivity = grouped.activities[0]
                const Icon = getLogTypeIcon(firstActivity.type)

                return (
                  <div
                    key={index}
                    className="flex items-start justify-between gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`p-2 ${getLogTypeBgColor(firstActivity.type)} rounded-lg flex-shrink-0`}
                      >
                        <Icon className={`h-4 w-4 ${getLogTypeColor(firstActivity.type)}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 text-sm">
                            {formatGroupedDate(grouped.date)}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {grouped.totalCount} log{grouped.totalCount !== 1 ? 's' : ''}
                          </Badge>
                        </div>

                        <div className="h-4">
                          <p className="text-xs text-gray-600">
                            {getGroupedActivitiesSummary(grouped)}
                          </p>
                        </div>

                        {/* Show first activity's notes if available */}
                        {firstActivity.notes && (
                          <div className="mt-1">
                            <p className="text-xs text-gray-500 break-words line-clamp-1">
                              {firstActivity.notes.length > 60
                                ? `${firstActivity.notes.substring(0, 60)}...`
                                : firstActivity.notes}
                            </p>
                          </div>
                        )}

                        {/* Show log type icons */}
                        {grouped.logTypes.length > 1 && (
                          <div className="flex items-center gap-1 mt-2">
                            {grouped.logTypes.slice(0, 4).map((type, typeIndex) => {
                              const TypeIcon = getLogTypeIcon(type)
                              return (
                                <div
                                  key={typeIndex}
                                  className={`p-1 ${getLogTypeBgColor(type)} rounded`}
                                >
                                  <TypeIcon className={`h-3 w-3 ${getLogTypeColor(type)}`} />
                                </div>
                              )
                            })}
                            {grouped.logTypes.length > 4 && (
                              <span className="text-xs text-gray-500 ml-1">
                                +{grouped.logTypes.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {onEditDateGroup && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditDateGroup(grouped.date, grouped.activities)}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-100 flex-shrink-0"
                          title="Edit all logs for this date"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDeleteDateGroup && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteDateGroup(grouped.date, grouped.activities)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-100 flex-shrink-0"
                          title="Delete all logs for this date"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No recent activities</p>
              <p className="text-xs text-gray-400 mt-1">
                Start logging activities to see them here
              </p>
            </div>
          )}

          {groupedActivities.length > 0 && (
            <div className="pt-2 border-t border-gray-100 mt-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/farms/${farmId}/logs`)}
                className="w-full h-8 text-sm text-green-700 hover:text-green-800 hover:bg-green-50 border-green-200"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                See all logs
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
