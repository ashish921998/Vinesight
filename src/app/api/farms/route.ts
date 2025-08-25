import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { FarmSchema, validateAndSanitize, globalRateLimiter } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'anonymous'
    if (!globalRateLimiter.checkLimit(`farms-get-${clientIP}`)) {
      return NextResponse.json(
        { error: 'Too many requests' }, 
        { status: 429 }
      )
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch farms' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ farms: data || [] })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'anonymous'
    if (!globalRateLimiter.checkLimit(`farms-post-${clientIP}`)) {
      return NextResponse.json(
        { error: 'Too many requests' }, 
        { status: 429 }
      )
    }

    const body = await request.json()
    
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
      .insert([validation.data])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create farm' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ farm: data }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}