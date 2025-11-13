'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/auth-utils'
import { TaskReminderSchema, validateAndSanitize } from '@/lib/validation'
import {
  toApplicationTaskReminder,
  toDatabaseTaskReminderInsert,
  toDatabaseTaskReminderUpdate,
  type TaskReminderCreateInput,
  type TaskReminderUpdateInput
} from '@/lib/supabase-types'
import type { TaskReminder } from '@/types/types'

/**
 * Create a new task
 */
export async function createTask(taskData: Omit<TaskReminder, 'id' | 'createdAt' | 'updatedAt' | 'completed'>) {
  try {
    // Validate and sanitize input
    const validation = validateAndSanitize(TaskReminderSchema, {
      farm_id: taskData.farmId,
      title: taskData.title,
      description: taskData.description,
      task_type: taskData.type,
      status: taskData.status,
      priority: taskData.priority,
      due_date: taskData.dueDate,
      estimated_duration_minutes: taskData.estimatedDurationMinutes,
      location: taskData.location,
      assigned_to_user_id: taskData.assignedToUserId,
      linked_record_type: taskData.linkedRecordType,
      linked_record_id: taskData.linkedRecordId,
      completed_at: taskData.completedAt
    })

    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        details: validation.errors
      }
    }

    const supabase = await createServerSupabaseClient()

    // Get the current authenticated user
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // Verify farm ownership
    const { data: farm, error: farmError } = await supabase
      .from('farms')
      .select('user_id')
      .eq('id', taskData.farmId)
      .single()

    if (farmError || !farm || farm.user_id !== user.id) {
      return {
        success: false,
        error: 'Farm not found or unauthorized'
      }
    }

    // Create task input
    const createInput: TaskReminderCreateInput = {
      farmId: taskData.farmId,
      title: taskData.title,
      description: taskData.description ?? null,
      type: taskData.type,
      status: taskData.status ?? 'pending',
      priority: taskData.priority ?? 'medium',
      dueDate: taskData.dueDate ?? null,
      estimatedDurationMinutes: taskData.estimatedDurationMinutes ?? null,
      location: taskData.location ?? null,
      assignedToUserId: taskData.assignedToUserId ?? null,
      createdBy: user.id,
      linkedRecordType: taskData.linkedRecordType ?? null,
      linkedRecordId: taskData.linkedRecordId ?? null,
      completedAt: taskData.completedAt ?? null
    }

    const dbInsert = toDatabaseTaskReminderInsert(createInput)

    const { data, error } = await supabase
      .from('task_reminders')
      .insert(dbInsert as any)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        error: 'Failed to create task'
      }
    }

    // Revalidate paths
    revalidatePath(`/farms/${taskData.farmId}/tasks`)
    revalidatePath('/reminders')

    return {
      success: true,
      data: toApplicationTaskReminder(data as any)
    }
  } catch (error) {
    console.error('Create task error:', error)
    return {
      success: false,
      error: 'Internal server error'
    }
  }
}

/**
 * Update an existing task
 */
export async function updateTask(taskId: number, updates: Partial<TaskReminder>) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get the current authenticated user
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // Verify task exists and user has access
    const { data: existingTask, error: fetchError } = await supabase
      .from('task_reminders')
      .select('farm_id, farms(user_id)')
      .eq('id', taskId)
      .single()

    if (fetchError || !existingTask) {
      return {
        success: false,
        error: 'Task not found'
      }
    }

    const farms = existingTask.farms as any
    if (farms?.user_id !== user.id) {
      return {
        success: false,
        error: 'Unauthorized'
      }
    }

    // Convert updates to database format
    const updateInput: TaskReminderUpdateInput = {}
    if (updates.title !== undefined) updateInput.title = updates.title
    if (updates.description !== undefined) updateInput.description = updates.description
    if (updates.type !== undefined) updateInput.type = updates.type
    if (updates.status !== undefined) updateInput.status = updates.status
    if (updates.priority !== undefined) updateInput.priority = updates.priority
    if (updates.dueDate !== undefined) updateInput.dueDate = updates.dueDate
    if (updates.estimatedDurationMinutes !== undefined)
      updateInput.estimatedDurationMinutes = updates.estimatedDurationMinutes
    if (updates.location !== undefined) updateInput.location = updates.location
    if (updates.assignedToUserId !== undefined) updateInput.assignedToUserId = updates.assignedToUserId
    if (updates.completedAt !== undefined) updateInput.completedAt = updates.completedAt

    const dbUpdate = toDatabaseTaskReminderUpdate(updateInput)

    const { data, error } = await supabase
      .from('task_reminders')
      .update(dbUpdate as any)
      .eq('id', taskId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        error: 'Failed to update task'
      }
    }

    // Revalidate paths
    revalidatePath(`/farms/${existingTask.farm_id}/tasks`)
    revalidatePath('/reminders')

    return {
      success: true,
      data: toApplicationTaskReminder(data as any)
    }
  } catch (error) {
    console.error('Update task error:', error)
    return {
      success: false,
      error: 'Internal server error'
    }
  }
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: number) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get the current authenticated user
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // Verify task exists and user has access
    const { data: existingTask, error: fetchError } = await supabase
      .from('task_reminders')
      .select('farm_id, farms(user_id)')
      .eq('id', taskId)
      .single()

    if (fetchError || !existingTask) {
      return {
        success: false,
        error: 'Task not found'
      }
    }

    const farms = existingTask.farms as any
    if (farms?.user_id !== user.id) {
      return {
        success: false,
        error: 'Unauthorized'
      }
    }

    const { error } = await supabase.from('task_reminders').delete().eq('id', taskId)

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        error: 'Failed to delete task'
      }
    }

    // Revalidate paths
    revalidatePath(`/farms/${existingTask.farm_id}/tasks`)
    revalidatePath('/reminders')

    return {
      success: true
    }
  } catch (error) {
    console.error('Delete task error:', error)
    return {
      success: false,
      error: 'Internal server error'
    }
  }
}

/**
 * Mark a task as completed
 */
export async function completeTask(taskId: number) {
  return updateTask(taskId, {
    status: 'completed',
    completedAt: new Date().toISOString()
  })
}

/**
 * Get all tasks for a farm
 */
export async function getTasksByFarm(farmId: number, statusFilter?: TaskReminder['status'][]) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
        data: []
      }
    }

    // Verify farm ownership
    const { data: farm, error: farmError } = await supabase
      .from('farms')
      .select('user_id')
      .eq('id', farmId)
      .single()

    if (farmError || !farm || farm.user_id !== user.id) {
      return {
        success: false,
        error: 'Farm not found or unauthorized',
        data: []
      }
    }

    let query = supabase
      .from('task_reminders')
      .select('*')
      .eq('farm_id', farmId)
      .order('due_date', { ascending: true })
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })

    if (statusFilter && statusFilter.length > 0) {
      query = query.in('status', statusFilter as string[])
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        error: 'Failed to fetch tasks',
        data: []
      }
    }

    return {
      success: true,
      data: (data || []).map((row) => toApplicationTaskReminder(row as any))
    }
  } catch (error) {
    console.error('Get tasks error:', error)
    return {
      success: false,
      error: 'Internal server error',
      data: []
    }
  }
}
