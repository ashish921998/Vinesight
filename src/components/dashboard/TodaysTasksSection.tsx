'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Calendar,
  Droplets,
  SprayCan,
  Scissors,
  Wrench,
  Clock,
  MapPin,
  CheckCircle2,
  Plus
} from 'lucide-react'

interface Task {
  id: string
  title: string
  type: 'irrigation' | 'spray' | 'harvest' | 'maintenance' | 'inspection' | 'fertilize'
  priority: 'high' | 'medium' | 'low'
  scheduledTime?: string
  location?: string
  farmBlock?: string
  estimatedDuration?: number // in minutes
  completed: boolean
  description?: string
  dependencies?: string[]
}

interface TodaysTasksSectionProps {
  tasks: Task[]
  onTaskComplete?: (taskId: string) => void
  onTaskAction?: (taskId: string) => void
  onAddTask?: () => void
  loading?: boolean
  farmName?: string
}

export function TodaysTasksSection({
  tasks,
  onTaskComplete,
  onTaskAction,
  onAddTask,
  loading,
  farmName
}: TodaysTasksSectionProps) {
  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'irrigation':
        return <Droplets className="h-4 w-4 text-primary" />
      case 'spray':
        return <SprayCan className="h-4 w-4 text-primary" />
      case 'harvest':
        return <Scissors className="h-4 w-4 text-primary" />
      case 'maintenance':
        return <Wrench className="h-4 w-4 text-primary" />
      default:
        return <Calendar className="h-4 w-4 text-primary" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      default:
        return 'bg-primary/10 text-primary border-primary/20'
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`
  }

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="w-32 h-6 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg animate-pulse"
              >
                <div className="w-4 h-4 bg-gray-200 rounded" />
                <div className="w-6 h-6 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                  <div className="w-24 h-4 bg-gray-200 rounded mb-1" />
                  <div className="w-16 h-3 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const pendingTasks = tasks.filter((task) => !task.completed)
  const completedTasks = tasks.filter((task) => task.completed)
  const overdueTasks = pendingTasks.filter((task) => {
    if (!task.scheduledTime) return false
    const scheduled = new Date(`${new Date().toDateString()} ${task.scheduledTime}`)
    return scheduled < new Date()
  })

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        {/* Mobile-optimized header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              {farmName ? `${farmName} - Today's Tasks` : "Today's Tasks"}
            </CardTitle>

            {onAddTask && (
              <Button
                size="sm"
                variant="outline"
                onClick={onAddTask}
                className="h-9 px-3 text-xs touch-manipulation rounded-full"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            )}
          </div>

          {/* Status badges row */}
          {(pendingTasks.length > 0 || overdueTasks.length > 0) && (
            <div className="flex gap-2">
              {pendingTasks.length > 0 && (
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20 text-xs px-2"
                >
                  {pendingTasks.length} pending
                </Badge>
              )}
              {overdueTasks.length > 0 && (
                <Badge
                  variant="outline"
                  className="bg-red-100 text-red-800 border-red-200 text-xs px-2"
                >
                  {overdueTasks.length} overdue
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {pendingTasks.length === 0 && completedTasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 mx-auto text-primary mb-3" />
            <h3 className="font-semibold text-foreground mb-1">No tasks scheduled</h3>
            <p className="text-sm text-muted-foreground mb-3">Your schedule is clear for today</p>
            {onAddTask && (
              <Button size="sm" onClick={onAddTask}>
                <Plus className="h-4 w-4 mr-1" />
                Schedule a Task
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Pending Tasks */}
            {pendingTasks.map((task) => {
              const isOverdue = overdueTasks.includes(task)

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border transition-all hover:shadow-md touch-manipulation ${
                    isOverdue ? 'bg-red-50 border-red-200' : 'bg-card border-border'
                  }`}
                >
                  {/* Task header with checkbox and main info */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 pt-0.5">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => onTaskComplete?.(task.id)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary w-5 h-5"
                      />
                    </div>

                    <div className="flex-shrink-0">
                      <div className="p-2 rounded-lg bg-primary/10">{getTaskIcon(task.type)}</div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-base text-foreground mb-1">{task.title}</h4>

                      {/* Priority and status badges */}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getPriorityColor(task.priority)} px-2 py-0.5`}
                        >
                          {task.priority}
                        </Badge>
                        {isOverdue && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-red-100 text-red-800 border-red-200 px-2 py-0.5"
                          >
                            overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Task description */}
                  {task.description && (
                    <p className="text-sm text-muted-foreground mb-3 ml-11">{task.description}</p>
                  )}

                  {/* Task details in organized layout */}
                  <div className="ml-11 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        {task.scheduledTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span
                              className={isOverdue ? 'text-red-600 font-medium' : 'text-foreground'}
                            >
                              {task.scheduledTime}
                            </span>
                          </div>
                        )}

                        {(task.location || task.farmBlock) && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground">
                              {task.farmBlock || task.location}
                            </span>
                          </div>
                        )}
                      </div>

                      {task.estimatedDuration && (
                        <span className="text-muted-foreground">
                          ~{formatDuration(task.estimatedDuration)}
                        </span>
                      )}
                    </div>

                    {/* Action button */}
                    {onTaskAction && (
                      <div className="pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 px-4 text-sm touch-manipulation rounded-full"
                          onClick={() => onTaskAction(task.id)}
                        >
                          Start Task
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div className="pt-4 border-t border-border">
                <h4 className="text-base font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Completed ({completedTasks.length})
                </h4>

                <div className="space-y-3">
                  {completedTasks.slice(0, 2).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20"
                    >
                      <Checkbox
                        checked={true}
                        disabled
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary w-5 h-5"
                      />

                      <div className="flex-shrink-0">
                        <div className="p-2 rounded-lg bg-primary/10 opacity-60">
                          {getTaskIcon(task.type)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-muted-foreground line-through">
                          {task.title}
                        </h4>
                        {task.farmBlock && (
                          <p className="text-xs text-muted-foreground mt-1">{task.farmBlock}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {completedTasks.length > 2 && (
                  <div className="text-center mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-sm text-muted-foreground h-9 px-4 touch-manipulation"
                    >
                      View all {completedTasks.length} completed tasks
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
