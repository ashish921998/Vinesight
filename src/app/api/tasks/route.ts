import { NextRequest, NextResponse } from 'next/server'

import { createServerSupabaseClient } from '@/lib/auth-utils'
import { TaskReminderSchema, validateAndSanitize, globalRateLimiter } from '@/lib/validation'
import {
  TaskReminderCreateInput,
  toApplicationTaskReminder,
  toDatabaseTaskReminderInsert
} from '@/lib/supabase-types'
import type { TaskReminder } from '@/types/types'

const parseStatusFilter = (raw: string | null): TaskReminder['status'][] | undefined => {
  if (!raw) return undefined
  const allowed: TaskReminder['status'][] = ['pending', 'in_progress', 'completed', 'cancelled']
  return raw
    .split(',')
    .map((status) => status.trim() as TaskReminder['status'])
    .filter((status) => allowed.includes(status))
}

export async function GET(request: NextRequest) {
  try {
    const clientIP =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'

    const rateLimit = globalRateLimiter.checkLimit(`tasks-get-${clientIP}`)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: rateLimit.reason || 'Too many requests' }, { status: 429 })
    }

    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const farmIdParam = searchParams.get('farmId')
    const statusFilter = parseStatusFilter(searchParams.get('status'))

    let query = supabase
      .from('task_reminders')
      .select('*')
      .order('due_date', { ascending: true })
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })

    if (farmIdParam) {
      const parsedFarmId = Number.parseInt(farmIdParam, 10)
      if (!Number.isFinite(parsedFarmId)) {
        return NextResponse.json({ error: 'Invalid farmId' }, { status: 400 })
      }
      query = query.eq('farm_id', parsedFarmId)
    }

    if (statusFilter && statusFilter.length > 0) {
      query = query.in('status', statusFilter as string[])
    }

    const { data, error } = await query

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch tasks:', error)
      }
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    const tasks = (data || []).map((row) =>
      toApplicationTaskReminder(row as any as Parameters<typeof toApplicationTaskReminder>[0])
    )

    return NextResponse.json({ tasks })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Tasks API error (GET):', error)
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIP =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'

    const rateLimit = globalRateLimiter.checkLimit(`tasks-post-${clientIP}`, true)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: rateLimit.reason || 'Too many requests' }, { status: 429 })
    }

    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Invalid content type. Expected application/json' },
        { status: 400 }
      )
    }

    let payload: unknown
    try {
      payload = await request.json()
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const validation = validateAndSanitize(TaskReminderSchema, payload)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const data = validation.data
    // Default to 7 days from now if no due date provided
    const defaultDueDate = new Date()
    defaultDueDate.setDate(defaultDueDate.getDate() + 7)

    const createInput: TaskReminderCreateInput = {
      farmId: data.farm_id,
      title: data.title,
      description: data.description ?? null,
      type: data.task_type,
      status: data.status ?? 'pending',
      priority: data.priority ?? 'medium',
      dueDate: data.due_date ?? defaultDueDate.toISOString(),
      estimatedDurationMinutes: data.estimated_duration_minutes ?? null,
      location: data.location ?? null,
      assignedToUserId: data.assigned_to_user_id ?? null,
      createdBy: user.id,
      linkedRecordType: data.linked_record_type ?? null,
      linkedRecordId: data.linked_record_id ?? null,
      completedAt: data.completed_at ?? null
    }

    const dbInsert = toDatabaseTaskReminderInsert(createInput)

    const { data: inserted, error } = await supabase
      .from('task_reminders')
      .insert(dbInsert as any)
      .select()
      .single()

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to create task:', error)
      }
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }

    const task = toApplicationTaskReminder(
      inserted as any as Parameters<typeof toApplicationTaskReminder>[0]
    )

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Tasks API error (POST):', error)
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
