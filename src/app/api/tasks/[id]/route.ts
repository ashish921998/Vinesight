import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseClient } from '@/lib/supabase'
import { TaskReminderSchema, validateAndSanitize, globalRateLimiter } from '@/lib/validation'
import {
  TaskReminderUpdateInput,
  toApplicationTaskReminder,
  toDatabaseTaskReminderUpdate
} from '@/lib/supabase-types'

const TaskReminderUpdateSchema = TaskReminderSchema.partial()

const parseTaskId = (raw?: string): number | null => {
  if (!raw) return null
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : null
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await context.params
    const clientIP =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'
    const rateLimit = globalRateLimiter.checkLimit(`tasks-id-get-${clientIP}`)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: rateLimit.reason || 'Too many requests' }, { status: 429 })
    }

    const taskId = parseTaskId(idParam)
    if (!taskId) {
      return NextResponse.json({ error: 'Invalid task id' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('task_reminders')
      .select('*')
      .eq('id', taskId)
      .maybeSingle()

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch task:', error)
      }
      return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const task = toApplicationTaskReminder(
      data as any as Parameters<typeof toApplicationTaskReminder>[0]
    )
    return NextResponse.json({ task })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Tasks API error (GET by id):', error)
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await context.params
    const clientIP =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'
    const rateLimit = globalRateLimiter.checkLimit(`tasks-id-patch-${clientIP}`, true)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: rateLimit.reason || 'Too many requests' }, { status: 429 })
    }

    const taskId = parseTaskId(idParam)
    if (!taskId) {
      return NextResponse.json({ error: 'Invalid task id' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    let payload: unknown
    try {
      payload = await request.json()
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const validation = validateAndSanitize(TaskReminderUpdateSchema, payload)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const updates: TaskReminderUpdateInput = {}
    const data = validation.data

    if (data.title !== undefined) updates.title = data.title
    if (data.description !== undefined) updates.description = data.description ?? null
    if (data.task_type !== undefined) updates.type = data.task_type
    if (data.status !== undefined) updates.status = data.status
    if (data.priority !== undefined) updates.priority = data.priority
    if (data.due_date !== undefined) updates.dueDate = data.due_date ?? null
    if (data.estimated_duration_minutes !== undefined)
      updates.estimatedDurationMinutes = data.estimated_duration_minutes ?? null
    if (data.location !== undefined) updates.location = data.location ?? null
    if (data.assigned_to_user_id !== undefined)
      updates.assignedToUserId = data.assigned_to_user_id ?? null
    if (data.linked_record_type !== undefined)
      updates.linkedRecordType = data.linked_record_type ?? null
    if (data.linked_record_id !== undefined) updates.linkedRecordId = data.linked_record_id ?? null
    if (data.completed_at !== undefined) updates.completedAt = data.completed_at ?? null
    if (data.farm_id !== undefined) updates.farmId = data.farm_id

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 })
    }

    const dbUpdates = toDatabaseTaskReminderUpdate(updates)

    const { data: updated, error } = await supabase
      .from('task_reminders')
      .update(dbUpdates as any)
      .eq('id', taskId)
      .select()
      .single()

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Failed to update task:', error)
      }
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }

    const task = toApplicationTaskReminder(
      updated as any as Parameters<typeof toApplicationTaskReminder>[0]
    )

    return NextResponse.json({ task })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Tasks API error (PATCH):', error)
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await context.params
    const clientIP =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'
    const rateLimit = globalRateLimiter.checkLimit(`tasks-id-delete-${clientIP}`, true)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: rateLimit.reason || 'Too many requests' }, { status: 429 })
    }

    const taskId = parseTaskId(idParam)
    if (!taskId) {
      return NextResponse.json({ error: 'Invalid task id' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { error } = await supabase.from('task_reminders').delete().eq('id', taskId)

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Failed to delete task:', error)
      }
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Tasks API error (DELETE):', error)
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
