'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { TaskReminder } from '@/types/types'
import { TodaysTasksSection } from '@/components/dashboard/TodaysTasksSection'
import { TaskModal } from './TaskModal'
import { SupabaseService } from '@/lib/supabase-service'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'

type TodaysTaskType =
  | 'irrigation'
  | 'spray'
  | 'harvest'
  | 'maintenance'
  | 'inspection'
  | 'fertilize'

interface TasksOverviewCardProps {
  farmId: number
  tasks: TaskReminder[]
  farmName?: string
  className?: string
  loading?: boolean
  onTasksUpdated?: () => Promise<void> | void
}

const mapTaskTypeForCard = (task: TaskReminder): TodaysTaskType => {
  switch (task.type) {
    case 'irrigation':
      return 'irrigation'
    case 'spray':
      return 'spray'
    case 'fertigation':
      return 'fertilize'
    case 'harvest':
      return 'harvest'
    case 'soil_test':
    case 'petiole_test':
      return 'inspection'
    case 'expense':
      return 'maintenance'
    case 'note':
      return 'maintenance'
    default:
      return 'maintenance'
  }
}

export function TasksOverviewCard({
  farmId,
  tasks,
  farmName,
  className,
  loading,
  onTasksUpdated
}: TasksOverviewCardProps) {
  const { user } = useSupabaseAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskReminder | null>(null)
  const [fetchingTask, setFetchingTask] = useState(false)

  const notifyRefresh = async () => {
    if (onTasksUpdated) {
      try {
        await onTasksUpdated()
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to refresh tasks:', error)
        }
      }
    }
  }

  const handleTaskComplete = async (taskId: string) => {
    const numericId = Number.parseInt(taskId, 10)
    if (!Number.isFinite(numericId)) return

    try {
      await SupabaseService.completeTask(numericId)
      toast.success('Task marked as completed.')
      await notifyRefresh()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unable to complete the task right now.'
      toast.error(errorMessage)
      if (process.env.NODE_ENV === 'development') {
        console.error('completeTask error', error)
      }
    }
  }

  const handleTaskAction = async (taskId: string) => {
    const numericId = Number.parseInt(taskId, 10)
    if (!Number.isFinite(numericId)) return

    const existing = tasks.find((task) => task.id === numericId)
    if (existing) {
      setSelectedTask(existing)
      setModalOpen(true)
      return
    }

    setFetchingTask(true)
    try {
      const taskRecord = await SupabaseService.getTaskById(numericId)
      if (!taskRecord) {
        toast.error('Task not found. It may have been deleted.')
        return
      }
      setSelectedTask(taskRecord)
      setModalOpen(true)
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? `Failed to load task: ${error.message}`
          : 'Failed to load task details.'
      toast.error(errorMessage)
      if (process.env.NODE_ENV === 'development') {
        console.error('getTaskById error', error)
      }
    } finally {
      setFetchingTask(false)
    }
  }

  const handleAddTask = () => {
    setSelectedTask(null)
    setModalOpen(true)
  }

  const mappedTasks = useMemo(() => {
    return tasks.map((task) => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null
      const scheduledTime =
        dueDate && !Number.isNaN(dueDate.getTime())
          ? dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : undefined

      return {
        id: task.id.toString(),
        title: task.title,
        type: mapTaskTypeForCard(task),
        priority: task.priority || 'medium',
        scheduledTime,
        location: task.location || '',
        estimatedDuration: task.estimatedDurationMinutes ?? undefined,
        completed: task.completed,
        description: task.description || undefined
      }
    })
  }, [tasks])

  return (
    <>
      <TodaysTasksSection
        className={className}
        tasks={mappedTasks}
        onTaskComplete={handleTaskComplete}
        onTaskAction={handleTaskAction}
        onAddTask={handleAddTask}
        loading={loading || fetchingTask}
        farmName={farmName}
        farmId={farmId}
      />
      <TaskModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) {
            setSelectedTask(null)
          }
        }}
        farmId={farmId}
        currentUserId={user?.id}
        task={selectedTask}
        onSaved={async () => {
          // Toast is already shown by TaskModal, just refresh the list
          await notifyRefresh()
        }}
        onDeleted={async () => {
          // Toast is already shown by TaskModal, just refresh the list
          await notifyRefresh()
        }}
      />
    </>
  )
}
