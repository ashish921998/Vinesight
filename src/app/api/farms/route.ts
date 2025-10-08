import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import {
  FarmSchema,
  validateAndSanitize,
  globalRateLimiter,
  generateCSRFToken
} from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    // Enhanced rate limiting with security
    const clientIP =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'

    const rateLimitResult = globalRateLimiter.checkLimit(`farms-get-${clientIP}`)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.reason || 'Too many requests' },
        { status: 429 }
      )
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      // Log error for debugging in development only
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Database error:', error)
      }
      return NextResponse.json({ error: 'Failed to fetch farms' }, { status: 500 })
    }

    return NextResponse.json({ farms: data || [] })
  } catch (error) {
    // Log error for debugging in development only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('API error:', error)
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Enhanced rate limiting and security
    const clientIP =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'

    // Check authentication status for better rate limiting
    const authHeader = request.headers.get('authorization')
    const isAuthenticated = !!authHeader

    const rateLimitResult = globalRateLimiter.checkLimit(`farms-post-${clientIP}`, isAuthenticated)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.reason || 'Too many requests' },
        { status: 429 }
      )
    }

    // Content-Type validation
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Invalid content type. Expected application/json' },
        { status: 400 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    // Check for excessive payload size (basic protection)
    const bodyString = JSON.stringify(body)
    if (bodyString.length > 10000) {
      // 10KB limit
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }

    // Validate and sanitize input
    const validation = validateAndSanitize(FarmSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('farms')
      .insert(validation.data as any)
      .select()
      .single()

    if (error) {
      // Log error for debugging in development only
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Database error:', error)
      }
      return NextResponse.json({ error: 'Failed to create farm' }, { status: 500 })
    }

    return NextResponse.json({ farm: data }, { status: 201 })
  } catch (error) {
    // Log error for debugging in development only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('API error:', error)
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
