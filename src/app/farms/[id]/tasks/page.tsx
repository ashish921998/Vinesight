'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  CheckCircle2,
  ChevronLeft,
  Clock,
  Layers,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Repeat,
  Timer,
  Trash2
} from 'lucide-react'

import { SupabaseService } from '@/lib/supabase-service'
import type { TaskReminder } from '@/types/types'
import { capitalize, cn } from '@/lib/utils'
import { TaskModal } from '@/components/tasks/TaskModal'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'

type StatusFilter = 'all' | TaskReminder['status']
type PriorityFilter = 'all' | TaskReminder['priority']
type TaskTypeFilter = 'all' | string

interface TaskGroupSummary {
  active: number
  overdue: number
  completed: number
  scheduled: number
}

const taskTypeLabels: Record<string, string> = {
  irrigation: 'Irrigation',
  spray: 'Spray',
  fertigation: 'Fertigation',
  harvest: 'Harvest',
  soil_test: 'Soil Test',
  petiole_test: 'Petiole Test',
  expense: 'Expense',
  note: 'Note / Observation'
}

const statusVariants: Record<TaskReminder['status'], string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  in_progress: 'bg-sky-100 text-sky-800 border-sky-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-700 border-slate-200'
}

export default function FarmTasksPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const farmIdParam = params.id
  const farmId = Number.parseInt(Array.isArray(farmIdParam) ? farmIdParam[0] : farmIdParam, 10)
  const { user } = useSupabaseAuth()

  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<TaskReminder[]>([])
  const [farmName, setFarmName] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TaskTypeFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskReminder | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<TaskReminder | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadTasks = useCallback(async () => {
    if (!Number.isFinite(farmId)) return

    setLoading(true)
    try {
      const [taskList, farm] = await Promise.all([
        SupabaseService.getTaskReminders(farmId),
        SupabaseService.getFarmById(farmId)
      ])
      setTasks(taskList || [])
      if (farm?.name) {
        setFarmName(capitalize(farm.name))
      }
    } catch (error) {
      // Log detailed error for debugging without exposing to user
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load tasks:', error)
      }
      // Show generic error message to user (don't expose internal error details)
      toast.error('Unable to load tasks for this farm.')
    } finally {
      setLoading(false)
    }
  }, [farmId])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const refreshTasks = useCallback(async () => {
    setRefreshing(true)
    try {
      await loadTasks()
      // Silent refresh - no toast notification
    } catch (error) {
      const errorMessage =
        error instanceof Error ? `Failed to refresh: ${error.message}` : 'Failed to refresh tasks'
      toast.error(errorMessage)
    } finally {
      setRefreshing(false)
    }
  }, [loadTasks])

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false
      if (priorityFilter !== 'all' && (task.priority ?? 'medium') !== priorityFilter) return false
      if (typeFilter !== 'all' && task.type !== typeFilter) return false
      if (searchQuery.trim().length > 0) {
        const haystack =
          `${task.title} ${task.description ?? ''} ${task.location ?? ''}`.toLowerCase()
        if (!haystack.includes(searchQuery.toLowerCase())) return false
      }
      return true
    })
  }, [tasks, statusFilter, priorityFilter, typeFilter, searchQuery])

  const summary: TaskGroupSummary = useMemo(() => {
    const active = tasks.filter(
      (task) => task.status === 'pending' || task.status === 'in_progress'
    )
    const overdue = active.filter((task) => {
      if (!task.dueDate) return false
      const dueDate = new Date(task.dueDate)
      if (Number.isNaN(dueDate.getTime())) return false
      return dueDate < new Date()
    })
    const completed = tasks.filter((task) => task.status === 'completed')
    const scheduled = tasks.filter((task) => task.dueDate !== null)

    return {
      active: active.length,
      overdue: overdue.length,
      completed: completed.length,
      scheduled: scheduled.length
    }
  }, [tasks])

  const openNewTaskModal = () => {
    setSelectedTask(null)
    setTaskModalOpen(true)
  }

  const openEditTaskModal = async (taskId: number) => {
    const existing = tasks.find((task) => task.id === taskId)
    if (existing) {
      setSelectedTask(existing)
      setTaskModalOpen(true)
      return
    }
    try {
      const taskRecord = await SupabaseService.getTaskById(taskId)
      if (!taskRecord) {
        toast.error('Task not found. It may have been deleted.')
        return
      }
      setSelectedTask(taskRecord)
      setTaskModalOpen(true)
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? `Unable to load task: ${error.message}`
          : 'Unable to load the selected task.'
      toast.error(errorMessage)
    }
  }

  const handleCompleteTask = async (taskId: number) => {
    try {
      await SupabaseService.completeTask(taskId)
      toast.success('Task marked as completed.')
      await loadTasks()
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? `Failed to complete task: ${error.message}`
          : 'Failed to update task status.'
      toast.error(errorMessage)
    }
  }

  const handleReopenTask = async (taskId: number) => {
    try {
      await SupabaseService.reopenTask(taskId)
      toast.success('Task moved back to pending.')
      await loadTasks()
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? `Failed to reopen task: ${error.message}`
          : 'Failed to reopen task.'
      toast.error(errorMessage)
    }
  }

  const handleDeleteTask = async () => {
    if (!taskToDelete) return
    try {
      await SupabaseService.deleteTask(taskToDelete.id)
      toast.success('Task deleted.')
      await loadTasks()
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? `Failed to delete task: ${error.message}`
          : 'Unable to delete this task.'
      toast.error(errorMessage)
    } finally {
      setTaskToDelete(null)
    }
  }

  const taskTypes = useMemo(() => {
    const unique = new Set(tasks.map((task) => task.type))
    return Array.from(unique)
  }, [tasks])

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-8">
      <header className="sticky top-0 z-10 border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/farms/${farmId}`)}
              className="h-8 w-8 p-0 sm:w-auto sm:px-2"
            >
              <ChevronLeft className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-foreground truncate sm:text-xl">
                {farmName ? `${farmName} Tasks` : 'Farm tasks'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshTasks}
              disabled={refreshing}
              className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="hidden sm:inline sm:ml-2">Reload</span>
            </Button>
            <Button onClick={openNewTaskModal} size="sm" className="h-8 gap-1.5 sm:h-9 sm:gap-2">
              <Plus className="h-4 w-4" />
              <span className="text-sm">New</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3 py-3 sm:py-6 sm:px-6 lg:px-8">
        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            <Card className="border-accent/40 bg-accent/5">
              <CardHeader className="p-3 space-y-0.5 sm:p-4">
                <CardTitle className="text-[10px] font-medium text-primary sm:text-xs leading-tight">
                  Active
                </CardTitle>
                <CardDescription className="text-lg font-bold text-primary sm:text-xl">
                  {summary.active}
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="p-3 space-y-0.5 sm:p-4">
                <CardTitle className="text-[10px] font-medium text-amber-800 sm:text-xs leading-tight">
                  Overdue
                </CardTitle>
                <CardDescription className="text-lg font-bold text-amber-800 sm:text-xl">
                  {summary.overdue}
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-emerald-200 bg-emerald-50">
              <CardHeader className="p-3 space-y-0.5 sm:p-4">
                <CardTitle className="text-[10px] font-medium text-emerald-800 sm:text-xs leading-tight">
                  Done
                </CardTitle>
                <CardDescription className="text-lg font-bold text-emerald-800 sm:text-xl">
                  {summary.completed}
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-slate-200 bg-white">
              <CardHeader className="p-3 space-y-0.5 sm:p-4">
                <CardTitle className="text-[10px] font-medium text-slate-700 sm:text-xs leading-tight">
                  Scheduled
                </CardTitle>
                <CardDescription className="text-lg font-bold text-slate-800 sm:text-xl">
                  {summary.scheduled}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card className="border border-border bg-white shadow-sm">
            <CardHeader className="space-y-2.5 p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground sm:text-base">Task board</h2>
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-8 w-24 text-xs sm:h-9 sm:w-32 sm:text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as StatusFilter)}
                >
                  <SelectTrigger className="h-8 text-xs sm:h-9 sm:text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={priorityFilter}
                  onValueChange={(value) => setPriorityFilter(value as PriorityFilter)}
                >
                  <SelectTrigger className="h-8 text-xs sm:h-9 sm:text-sm">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={typeFilter}
                  onValueChange={(value) => setTypeFilter(value as TaskTypeFilter)}
                >
                  <SelectTrigger className="h-8 text-xs sm:h-9 sm:text-sm">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {taskTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {taskTypeLabels[type] || capitalize(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-3 sm:p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading tasks…
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center sm:px-6 sm:py-10">
                  <h3 className="text-sm font-semibold text-foreground sm:text-base">
                    No tasks match the current filters
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                    Try adjusting filters or create a new task to get started.
                  </p>
                  <Button className="mt-4" onClick={openNewTaskModal} size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Add a task
                  </Button>
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const dueDate = task.dueDate ? new Date(task.dueDate) : null
                  const dueLabel =
                    dueDate && !Number.isNaN(dueDate.getTime())
                      ? dueDate.toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'No due date'

                  return (
                    <div
                      key={task.id}
                      className="flex flex-col gap-2 rounded-lg border border-border/70 bg-white p-3 shadow-sm transition hover:border-accent/30 sm:gap-3 sm:rounded-xl sm:p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex flex-1 flex-col gap-1.5 sm:gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="text-sm font-semibold text-foreground sm:text-base">
                            {task.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className={cn(
                              'border px-1.5 py-0 text-[10px] capitalize sm:px-2 sm:text-xs',
                              statusVariants[task.status]
                            )}
                          >
                            {task.status.replace('_', ' ')}
                          </Badge>
                          {task.priority !== 'medium' && (
                            <Badge
                              variant="outline"
                              className="border-accent/30 bg-accent/10 px-1.5 py-0 text-[10px] capitalize text-primary sm:px-2 sm:text-xs"
                            >
                              {task.priority}
                            </Badge>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 sm:text-sm">
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2.5 text-[10px] text-muted-foreground sm:gap-3 sm:text-xs">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {dueLabel}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Layers className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            {taskTypeLabels[task.type] || capitalize(task.type)}
                          </span>
                          {task.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {task.location}
                            </span>
                          )}
                          {task.estimatedDurationMinutes && (
                            <span className="inline-flex items-center gap-1">
                              <Timer className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{' '}
                              {task.estimatedDurationMinutes}m
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex w-full items-center gap-1.5 sm:gap-2 md:w-auto">
                        {task.status !== 'completed' && task.status !== 'cancelled' && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleCompleteTask(task.id)}
                            className="h-8 flex-1 text-xs sm:flex-none sm:h-9"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 sm:mr-1.5 sm:h-4 sm:w-4" />
                            <span className="sm:inline">Done</span>
                          </Button>
                        )}
                        {task.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleReopenTask(task.id)}
                            className="h-8 flex-1 text-xs sm:flex-none sm:h-9"
                          >
                            <Repeat className="h-3.5 w-3.5 sm:mr-1.5 sm:h-4 sm:w-4" />
                            <span className="sm:inline">Reopen</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditTaskModal(task.id)}
                          className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                        >
                          <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setTaskToDelete(task)}
                          className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <TaskModal
        open={taskModalOpen}
        onOpenChange={(open) => {
          setTaskModalOpen(open)
          if (!open) setSelectedTask(null)
        }}
        farmId={farmId}
        currentUserId={user?.id}
        task={selectedTask}
        onSaved={async () => {
          // Toast is already shown by TaskModal, just refresh the list
          await loadTasks()
        }}
      />

      <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently remove &ldquo;{taskToDelete?.title}&rdquo;. You can
              always create it again later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
