import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import type { Database } from '@/types/database'

// Use service role to bypass RLS (for new user becoming client)
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// P0: Validate input schema
const AddClientSchema = z.object({
  userId: z.string().uuid(),
  organizationId: z.string().uuid()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input with Zod
    const parseResult = AddClientSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input: ' + parseResult.error.message },
        { status: 400 }
      )
    }
    const { userId, organizationId } = parseResult.data

    // Verify user is authenticated
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // Server-side, we don't set cookies
          }
        }
      }
    )

    const {
      data: { user: authUser },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized: User not authenticated' }, { status: 401 })
    }

    // Security Check
    // Scenario 1: User adding THEMSELVES (Self-service join from Settings)
    const isSelfAdd = authUser.id === userId

    if (!isSelfAdd) {
      // Scenario 2: Admin adding user (Service role flow, e.g. signup)
      // Enforce 5-minute creation window for security if not self-add
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('created_at')
        .eq('id', userId)
        .single()

      if (!profile || !profile.created_at) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const createdAt = new Date(profile.created_at)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      if (createdAt < fiveMinutesAgo) {
        return NextResponse.json(
          { error: 'Unauthorized - user session expired for signup flow' },
          { status: 401 }
        )
      }
    }

    // Update user profile with consultant organization
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ consultant_organization_id: organizationId })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json({ error: 'Failed to add as client' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Added as client successfully'
    })
  } catch (error) {
    console.error('Error in add-client API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
