import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { IrrigationSchema, validateAndSanitize, globalRateLimiter } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'anonymous'
    if (!globalRateLimiter.checkLimit(`irrigation-get-${clientIP}`)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    const farmId = searchParams.get('farmId')

    if (!farmId || isNaN(parseInt(farmId))) {
      return NextResponse.json({ error: 'Valid farm ID required' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('irrigation_records')
      .select('*')
      .eq('farm_id', parseInt(farmId))
      .order('date', { ascending: false })

    if (error) {
      // Log error for debugging in development only
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Database error:', error)
      }
      return NextResponse.json({ error: 'Failed to fetch irrigation records' }, { status: 500 })
    }

    return NextResponse.json({ records: data || [] })
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
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'anonymous'
    if (!globalRateLimiter.checkLimit(`irrigation-post-${clientIP}`)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await request.json()
    
    const validation = validateAndSanitize(IrrigationSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors }, 
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('irrigation_records')
      .insert(validation.data as any)
      .select()
      .single()

    if (error) {
      // Log error for debugging in development only
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Database error:', error)
      }
      return NextResponse.json({ error: 'Failed to create irrigation record' }, { status: 500 })
    }

    return NextResponse.json({ record: data }, { status: 201 })
  } catch (error) {
    // Log error for debugging in development only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('API error:', error)
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}