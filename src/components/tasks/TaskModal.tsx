import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { SupabaseService } from '@/lib/supabase-service'
import type { TaskReminder } from '@/types/types'
import type { TaskReminderCreateInput, TaskReminderUpdateInput } from '@/lib/supabase-types'
import { cn } from '@/lib/utils'

const taskTypeOptions = [
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'spray', label: 'Spray / Foliar' },
  { value: 'fertigation', label: 'Fertigation' },
  { value: 'harvest', label: 'Harvest' },
  { value: 'soil_test', label: 'Soil Test' },
  { value: 'petiole_test', label: 'Petiole Test' },
  { value: 'expense', label: 'Expense' },
  { value: 'note', label: 'Note / Observation' }
]

const priorityOptions: Array<{ value: TaskReminder['priority']; label: string }> = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
]

const statusOptions: Array<{ value: TaskReminder['status']; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
]

type AssignmentOption = 'unassigned' | 'me'

interface TaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  farmId: number
  currentUserId: string | null | undefined
  task?: TaskReminder | null
  onSaved?: (task: TaskReminder) => void
  onDeleted?: (taskId: number) => void
}

interface TaskFormState {
  title: string
  description: string
  type: string
  priority: TaskReminder['priority']
  status: TaskReminder['status']
  dueDateLocal: string
  estimatedDurationMinutes: string
  location: string
  assignment: AssignmentOption
}

const toLocalDateTimeInput = (iso?: string | null) => {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const fromLocalDateTimeInput = (value: string): string => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString()
}

const defaultFormState: TaskFormState = {
  title: '',
  description: '',
  type: 'irrigation',
  priority: 'medium',
  status: 'pending',
  dueDateLocal: '',
  estimatedDurationMinutes: '',
  location: '',
  assignment: 'unassigned'
}

export function TaskModal({
  open,
  onOpenChange,
  farmId,
  currentUserId,
  task,
  onSaved,
  onDeleted
}: TaskModalProps) {
  const isEditMode = !!task
  const [formState, setFormState] = useState<TaskFormState>(defaultFormState)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (task) {
        setFormState({
          title: task.title,
          description: task.description || '',
          type: task.type || 'irrigation',
          priority: task.priority ?? 'medium',
          status: task.status ?? 'pending',
          dueDateLocal: toLocalDateTimeInput(task.dueDate),
          estimatedDurationMinutes: task.estimatedDurationMinutes
            ? String(task.estimatedDurationMinutes)
            : '',
          location: task.location || '',
          assignment: currentUserId && task.assignedToUserId === currentUserId ? 'me' : 'unassigned'
        })
      } else {
        setFormState((state) => ({
          ...defaultFormState,
          assignment: currentUserId ? 'me' : 'unassigned'
        }))
      }
      setError(null)
      setSaving(false)
      setDeleting(false)
    }
  }, [open, task, currentUserId])

  const handleChange = <Field extends keyof TaskFormState>(
    field: Field,
    value: TaskFormState[Field]
  ) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return

    if (!formState.title.trim()) {
      setError('Task title is required.')
      return
    }

    const dueDateIso = fromLocalDateTimeInput(formState.dueDateLocal)

    if (formState.dueDateLocal && !dueDateIso) {
      setError('Please provide a valid due date.')
      return
    }

    const estimatedDuration =
      formState.estimatedDurationMinutes.trim().length > 0
        ? Number(formState.estimatedDurationMinutes)
        : null

    if (estimatedDuration !== null && (Number.isNaN(estimatedDuration) || estimatedDuration < 0)) {
      setError('Estimated duration must be a positive number.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (isEditMode && task) {
        const updates: TaskReminderUpdateInput = {
          title: formState.title.trim(),
          description: formState.description.trim() || null,
          type: formState.type,
          priority: formState.priority,
          status: formState.status,
          dueDate: dueDateIso,
          estimatedDurationMinutes: estimatedDuration,
          location: formState.location.trim() || null,
          assignedToUserId: formState.assignment === 'me' ? (currentUserId ?? null) : null
        }

        const desiredStatus = formState.status
        if (desiredStatus === 'completed') {
          updates.completedAt = task.completedAt ?? new Date().toISOString()
        } else {
          updates.completedAt = null
        }

        const updated = await SupabaseService.updateTask(task.id, updates)
        toast.success('Task updated successfully')
        onSaved?.(updated)
      } else {
        const payload: TaskReminderCreateInput = {
          farmId,
          title: formState.title.trim(),
          description: formState.description.trim() || null,
          type: formState.type,
          priority: formState.priority,
          status: formState.status ?? 'pending',
          dueDate: dueDateIso,
          estimatedDurationMinutes: estimatedDuration,
          location: formState.location.trim() || null,
          assignedToUserId: formState.assignment === 'me' ? (currentUserId ?? null) : null,
          createdBy: currentUserId ?? null
        }

        const created = await SupabaseService.addTaskReminder(payload)
        toast.success('Task created successfully')
        onSaved?.(created)
      }

      onOpenChange(false)
    } catch (submissionError: any) {
      const errorMessage = submissionError?.message || 'Failed to save task. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!task || deleting) return
    setDeleting(true)
    setError(null)

    try {
      await SupabaseService.deleteTask(task.id)
      toast.success('Task deleted successfully')
      onDeleted?.(task.id)
      onOpenChange(false)
    } catch (deleteError: any) {
      const errorMessage = deleteError?.message || 'Failed to delete task. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden p-0">
        <div className="flex max-h-[90vh] flex-col">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>{isEditMode ? 'Edit task' : 'Create task'}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update the task details and keep the crew aligned.'
                : 'Capture the work that needs to get done on this farm.'}
            </DialogDescription>
          </DialogHeader>

          <form className="flex flex-1 flex-col overflow-hidden" onSubmit={handleSubmit}>
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="task-title">Task title</Label>
                  <Input
                    id="task-title"
                    placeholder="E.g. Flush irrigation block A"
                    value={formState.title}
                    onChange={(event) => handleChange('title', event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Task type</Label>
                  <Select
                    value={formState.type}
                    onValueChange={(value) => handleChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent>
                      {taskTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={formState.priority}
                    onValueChange={(value) =>
                      handleChange('priority', value as TaskReminder['priority'])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due-date">Due date</Label>
                  <Input
                    id="due-date"
                    type="datetime-local"
                    value={formState.dueDateLocal}
                    onChange={(event) => handleChange('dueDateLocal', event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated-duration">Estimated duration (minutes)</Label>
                  <Input
                    id="estimated-duration"
                    type="number"
                    min={0}
                    placeholder="60"
                    value={formState.estimatedDurationMinutes}
                    onChange={(event) =>
                      handleChange('estimatedDurationMinutes', event.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location / crew note</Label>
                  <Input
                    id="location"
                    placeholder="Spray team contact or coordinates"
                    value={formState.location}
                    onChange={(event) => handleChange('location', event.target.value)}
                  />
                </div>

                {isEditMode && (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formState.status}
                      onValueChange={(value) =>
                        handleChange('status', value as TaskReminder['status'])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {currentUserId && (
                  <div
                    className={cn(
                      'flex items-center justify-between rounded-lg border p-4 md:col-span-2',
                      {
                        'border-accent/40 bg-accent/5': formState.assignment === 'me'
                      }
                    )}
                  >
                    <div>
                      <Label className="text-sm font-medium">Assign to me</Label>
                      <p className="text-xs text-muted-foreground">
                        Keep this task on your radar and receive reminders.
                      </p>
                    </div>
                    <Switch
                      checked={formState.assignment === 'me'}
                      onCheckedChange={(checked) =>
                        handleChange('assignment', checked ? 'me' : 'unassigned')
                      }
                    />
                  </div>
                )}

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="task-description">Notes</Label>
                  <Textarea
                    id="task-description"
                    placeholder="Add instructions, chemical dose, crew reminder, or checklist."
                    value={formState.description}
                    onChange={(event) => handleChange('description', event.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>

            <DialogFooter className="border-t px-6 py-4">
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                {isEditMode && onDeleted && task && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting…' : 'Delete task'}
                  </Button>
                )}
                <div className="flex w-full justify-end gap-2 sm:w-auto">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving…' : isEditMode ? 'Save changes' : 'Create task'}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
