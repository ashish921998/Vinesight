'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface PendingTasksCardProps {
  tasks: any[]
  onCompleteTask: (taskId: number) => Promise<void>
}

export function PendingTasksCard({ tasks = [], onCompleteTask }: PendingTasksCardProps) {
  if (!tasks || tasks.length === 0) {
    return null
  }

  const topTasks = tasks.slice(0, 3)
  const hasMoreTasks = tasks.length > 3

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-orange-900">
          <AlertCircle className="h-5 w-5" />
          Pending Tasks ({tasks.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {topTasks.map((task, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-3 p-3 bg-white rounded-xl border border-orange-200"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {task.title || task.task_type || 'Task'}
                </p>
                <p className="text-xs text-gray-600">
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                </p>
              </div>
            </div>
            <Button
              onClick={() => onCompleteTask(task.id)}
              size="sm"
              variant="ghost"
              className="flex-shrink-0 h-8 px-3 bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              <span className="text-xs">Done</span>
            </Button>
          </div>
        ))}

        {hasMoreTasks && (
          <p className="text-xs text-center text-gray-600 pt-2">
            +{tasks.length - 3} more tasks pending
          </p>
        )}
      </CardContent>
    </Card>
  )
}
