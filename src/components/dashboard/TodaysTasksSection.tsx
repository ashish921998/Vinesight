'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import {
  Calendar,
  Droplets,
  SprayCan,
  Scissors,
  Wrench,
  Clock,
  MapPin,
  CheckCircle2,
  Plus,
  ArrowRight,
  Circle
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface Task {
  id: string
  title: string
  type: 'irrigation' | 'spray' | 'harvest' | 'maintenance' | 'inspection' | 'fertilize'
  priority: 'high' | 'medium' | 'low'
  scheduledTime?: string
  location?: string
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
  farmId?: number
  className?: string
}

export function TodaysTasksSection({
  tasks,
  onTaskComplete,
  onTaskAction,
  onAddTask,
  loading,
  farmName,
  farmId,
  className
}: TodaysTasksSectionProps) {
  const router = useRouter()
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
        return 'bg-red-100/80 text-red-800 border-red-200'
      case 'medium':
        return 'bg-amber-100/80 text-amber-800 border-amber-200'
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

  const containerClass = cn(
    'rounded-3xl border border-border/60 bg-background/95 px-5 py-5 shadow-sm backdrop-blur',
    className
  )

  if (loading) {
    return (
      <div className={containerClass}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/40">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-36 rounded-full bg-muted/40 animate-pulse" />
              <div className="h-3 w-24 rounded-full bg-muted/20 animate-pulse" />
            </div>
          </div>
          <div className="h-9 w-20 rounded-full bg-muted/30 animate-pulse" />
        </div>
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-[88px] rounded-2xl border border-border/40 bg-muted/10 animate-pulse"
            />
          ))}
        </div>
      </div>
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
    <div className={containerClass}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Calendar className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground md:text-base">
                {farmName ? `${farmName} — today's work` : "Today's work"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {pendingTasks.length > 0
                  ? `Stay on pace — ${pendingTasks.length} item${pendingTasks.length > 1 ? 's' : ''} queued for today.`
                  : 'Nothing on the board yet. Plan the next priority.'}
              </p>
            </div>
          </div>
          {onAddTask && (
            <Button
              size="icon"
              variant="outline"
              onClick={onAddTask}
              className="h-10 w-10 rounded-2xl border-border/60 bg-background/80 text-primary"
              aria-label="Add task"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className="rounded-full border-border/60 bg-background/80 px-2.5 py-1 text-[11px] uppercase tracking-wide text-muted-foreground"
          >
            {pendingTasks.length} active
          </Badge>
          {overdueTasks.length > 0 && (
            <Badge
              variant="outline"
              className="rounded-full border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] uppercase tracking-wide text-amber-700"
            >
              {overdueTasks.length} overdue
            </Badge>
          )}
          {completedTasks.length > 0 && (
            <Badge
              variant="outline"
              className="rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] uppercase tracking-wide text-emerald-700"
            >
              {completedTasks.length} done
            </Badge>
          )}
        </div>
      </div>

      {pendingTasks.length === 0 && completedTasks.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border/60 bg-background/70 px-5 py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Desk is clear</h4>
                <p className="text-xs text-muted-foreground">
                  Use the window to capture the next task before the day fills up.
                </p>
              </div>
            </div>
            {onAddTask && (
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full bg-primary/10 text-primary shadow-none"
                onClick={onAddTask}
              >
                <Plus className="mr-2 h-3.5 w-3.5" />
                New task
              </Button>
            )}
          </div>
        </div>
      ) : (
        <TooltipProvider delayDuration={300}>
          <div className="mt-4 space-y-2.5">
            {pendingTasks.map((task) => {
              const isOverdue = overdueTasks.includes(task)

              return (
                <div
                  key={task.id}
                  className={cn(
                    'group relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md',
                    isOverdue
                      ? 'border-red-200 bg-red-50/50'
                      : 'border-border/50 hover:border-border'
                  )}
                >
                  <div className="flex items-center gap-3 px-3 py-3">
                    {/* Complete Button with Tooltip */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onTaskComplete?.(task.id)}
                          className={cn(
                            'group/complete relative h-9 w-9 flex-shrink-0 rounded-full border-2 transition-all hover:scale-110 active:scale-95 hover:bg-transparent',
                            isOverdue
                              ? 'border-red-400 hover:border-red-500 hover:!bg-red-500 active:!bg-red-600'
                              : 'border-primary/40 hover:border-emerald-500 hover:!bg-emerald-500 active:!bg-emerald-600'
                          )}
                          aria-label="Mark task as complete"
                        >
                          <Circle
                            className={cn(
                              'h-5 w-5 transition-all md:group-hover/complete:opacity-0',
                              isOverdue ? 'text-red-400' : 'text-primary/40'
                            )}
                          />
                          <CheckCircle2
                            className={cn(
                              'absolute h-6 w-6 md:h-5 md:w-5 opacity-40 transition-all md:opacity-0 md:group-hover/complete:opacity-100',
                              isOverdue ? 'text-red-400' : 'text-primary'
                            )}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        <p>Mark as complete</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Task Icon */}
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      {getTaskIcon(task.type)}
                    </div>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title and Priority Row */}
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-foreground truncate">
                          {task.title}
                        </h4>
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-md px-2 py-0 text-[11px] font-medium capitalize flex-shrink-0',
                            getPriorityColor(task.priority)
                          )}
                        >
                          {task.priority}
                        </Badge>
                        {isOverdue && (
                          <Badge
                            variant="outline"
                            className="rounded-md border-red-300 bg-red-100 px-2 py-0 text-[11px] font-medium uppercase text-red-700 flex-shrink-0"
                          >
                            overdue
                          </Badge>
                        )}
                      </div>

                      {/* Description */}
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                          {task.description}
                        </p>
                      )}

                      {/* Metadata Row */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {task.scheduledTime && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span className={cn(isOverdue && 'font-semibold text-red-600')}>
                              {task.scheduledTime}
                            </span>
                          </span>
                        )}

                        {task.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[120px]">{task.location}</span>
                          </span>
                        )}

                        {task.estimatedDuration && (
                          <span className="ml-auto text-[11px] font-medium">
                            {formatDuration(task.estimatedDuration)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    {onTaskAction && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 rounded-lg px-3 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onTaskAction(task.id)}
                      >
                        Start
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}

            {completedTasks.length > 0 && (
              <div className="rounded-2xl border border-dashed border-border/60 bg-background/60 px-4 py-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  Completed ({completedTasks.length})
                </div>
                <div className="mt-3 space-y-2">
                  {completedTasks.slice(0, 2).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 rounded-xl border border-emerald-200/50 bg-emerald-50/30 px-3 py-2.5"
                    >
                      {/* Completed Check Icon */}
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>

                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100/50 text-emerald-600/70">
                        {getTaskIcon(task.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium text-muted-foreground/80 line-through truncate">
                          {task.title}
                        </h5>
                        {task.location && (
                          <p className="text-xs text-muted-foreground/60 truncate">
                            {task.location}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {completedTasks.length > 2 && (
                  <div className="mt-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 rounded-full px-4 text-xs text-muted-foreground"
                      onClick={() => farmId && router.push(`/farms/${farmId}/tasks`)}
                    >
                      View all {completedTasks.length} completed tasks
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </TooltipProvider>
      )}

      {farmId && tasks.length > 0 && (
        <div className="mt-4 border-t border-border/40 pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-full rounded-2xl text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            onClick={() => router.push(`/farms/${farmId}/tasks`)}
          >
            View all tasks
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
