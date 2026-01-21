import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import type { Database } from '@/types/database'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { SUPPORT_EMAIL } from '@/lib/constants'

const DeleteAccountRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  reason: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parseResult = DeleteAccountRequestSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input: ' + parseResult.error.message },
        { status: 400 }
      )
    }
    const { email, password, reason } = parseResult.data

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {}
      }
    })

    const {
      data: { user: authUser },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized: User not authenticated' }, { status: 401 })
    }

    if (email !== authUser.email) {
      return NextResponse.json(
        { error: 'Email does not match authenticated user' },
        { status: 400 }
      )
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password
    })

    if (verifyError) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const userId = authUser.id

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single()

    const userName = profile?.full_name || authUser.email

    const deletionData = {
      user_id: userId,
      user_email: authUser.email,
      user_name: userName,
      reason: reason || null,
      status: 'pending',
      requested_at: new Date().toISOString()
    }

    console.warn('[DELETE ACCOUNT REQUEST]', JSON.stringify(deletionData, null, 2))

    return NextResponse.json({
      success: true,
      message: `Account deletion request submitted. Your account will be deleted within 30 days. If you change your mind, please contact ${SUPPORT_EMAIL} immediately.`
    })
  } catch (error) {
    console.error('Error in delete-account API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
