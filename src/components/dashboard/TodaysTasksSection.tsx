'use client'

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
  className?: string
}

export function TodaysTasksSection({
  tasks,
  onTaskComplete,
  onTaskAction,
  onAddTask,
  loading,
  farmName,
  className
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
        <div className="mt-4 space-y-3">
          {pendingTasks.map((task) => {
            const isOverdue = overdueTasks.includes(task)

            return (
              <div
                key={task.id}
                className={cn(
                  'relative overflow-hidden rounded-2xl border border-border/60 bg-background/90 px-4 py-4 transition-all hover:-translate-y-0.5 hover:shadow-lg',
                  isOverdue && 'border-red-200/70 bg-red-50/80'
                )}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => onTaskComplete?.(task.id)}
                    className="mt-1 h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />

                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {getTaskIcon(task.type)}
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-semibold text-foreground">{task.title}</h4>
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-xs capitalize',
                            getPriorityColor(task.priority)
                          )}
                        >
                          {task.priority}
                        </Badge>
                        {isOverdue && (
                          <Badge
                            variant="outline"
                            className="rounded-full border-red-200 bg-red-100/80 px-2.5 py-0.5 text-xs uppercase tracking-wide text-red-800"
                          >
                            overdue
                          </Badge>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      {task.scheduledTime && (
                        <span className="inline-flex items-center gap-1 text-foreground">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className={isOverdue ? 'font-semibold text-red-600' : undefined}>
                            {task.scheduledTime}
                          </span>
                        </span>
                      )}

                      {(task.location || task.farmBlock) && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="text-foreground">{task.farmBlock || task.location}</span>
                        </span>
                      )}

                      {task.estimatedDuration && (
                        <span className="ml-auto text-xs uppercase tracking-wide text-muted-foreground">
                          ~{formatDuration(task.estimatedDuration)}
                        </span>
                      )}
                    </div>

                    {onTaskAction && (
                      <div className="pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 rounded-full border-border/60 bg-background/80 px-4 text-xs font-medium"
                          onClick={() => onTaskAction(task.id)}
                        >
                          Start task
                        </Button>
                      </div>
                    )}
                  </div>
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
              <div className="mt-3 space-y-3">
                {completedTasks.slice(0, 2).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-3 py-3"
                  >
                    <Checkbox
                      checked
                      disabled
                      className="h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary/80">
                      {getTaskIcon(task.type)}
                    </div>
                    <div className="flex-1">
                      <h5 className="text-sm font-medium text-muted-foreground line-through">
                        {task.title}
                      </h5>
                      {task.farmBlock && (
                        <p className="text-xs text-muted-foreground/80">{task.farmBlock}</p>
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
                  >
                    View all {completedTasks.length} completed tasks
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
