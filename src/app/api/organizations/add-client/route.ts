import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import type { Database } from '@/types/database'

// Lazy initialization to avoid build-time errors
function getSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set')
  }
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)
}

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

    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Verify user is authenticated
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Server-side, we don't set cookies
        }
      }
    })

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

    if (isSelfAdd) {
      // Self-add flow: User is connecting themselves to an organization
      // This is allowed - users can choose their consultant organization
      // The organization must exist and be active
      const { data: org, error: orgError } = await getSupabaseAdmin()
        .from('organizations')
        .select('id, is_active')
        .eq('id', organizationId)
        .single()

      if (orgError || !org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }

      if (!org.is_active) {
        return NextResponse.json({ error: 'Organization is not active' }, { status: 400 })
      }
    } else {
      // Scenario 2: Admin/member adding another user
      // CRITICAL: Verify requester is an admin/owner of the organization
      const { data: membership, error: membershipError } = await getSupabaseAdmin()
        .from('organization_members')
        .select('role, is_owner')
        .eq('organization_id', organizationId)
        .eq('user_id', authUser.id)
        .single()

      if (membershipError && membershipError.code !== 'PGRST116') {
        console.error('Error checking membership:', membershipError)
        return NextResponse.json({ error: 'Failed to verify permissions' }, { status: 500 })
      }

      if (!membership || (membership.role !== 'admin' && !membership.is_owner)) {
        return NextResponse.json(
          { error: 'Unauthorized - must be organization admin or owner' },
          { status: 403 }
        )
      }

      // Additional check: Enforce 5-minute creation window for newly created users
      // This prevents adding arbitrary existing users
      const { data: profile } = await getSupabaseAdmin()
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
          { error: 'Unauthorized - can only add recently created users via this endpoint' },
          { status: 401 }
        )
      }
    }

    // Update user profile with consultant organization
    const { error: updateError } = await getSupabaseAdmin()
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
