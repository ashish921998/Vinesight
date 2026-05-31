import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import type { Database } from '@/types/database'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// P0: Validate input schema
const AddClientSchema = z.object({
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  assignedTo: z.string().uuid().nullable().optional()
})

function isUniqueConstraintError(error: { code?: string; message?: string; details?: string }) {
  const text = `${error.message ?? ''} ${error.details ?? ''}`.toLowerCase()
  return error.code === '23505' || text.includes('duplicate') || text.includes('unique')
}

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
    const { userId, organizationId, assignedTo } = parseResult.data

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
      if (assignedTo) {
        return NextResponse.json(
          { error: 'Self-service clients cannot assign themselves to an agronomist' },
          { status: 400 }
        )
      }

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

      if (
        !membership ||
        (!membership.is_owner && membership.role !== 'owner' && membership.role !== 'admin')
      ) {
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
          { error: 'Forbidden - can only add recently created users via this endpoint' },
          { status: 403 }
        )
      }
    }

    if (assignedTo) {
      const { data: assigneeMembership, error: assigneeMembershipError } = await getSupabaseAdmin()
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', assignedTo)
        .maybeSingle()

      if (assigneeMembershipError) {
        console.error('Error checking assigned agronomist membership:', assigneeMembershipError)
        return NextResponse.json({ error: 'Failed to verify assigned agronomist' }, { status: 500 })
      }

      if (!assigneeMembership) {
        return NextResponse.json(
          { error: 'Assigned agronomist must belong to the organization' },
          { status: 400 }
        )
      }
    }

    const { data: activeClientLink, error: activeClientLinkError } = await getSupabaseAdmin()
      .from('organization_clients')
      .select('organization_id')
      .eq('client_user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (activeClientLinkError) {
      console.error('Error checking active organization client link:', activeClientLinkError)
      return NextResponse.json(
        { error: 'Failed to verify current client organization' },
        { status: 500 }
      )
    }

    if (activeClientLink && activeClientLink.organization_id !== organizationId) {
      return NextResponse.json(
        { error: 'Client is already active in another organization' },
        { status: 409 }
      )
    }

    const { error: clientError } = await getSupabaseAdmin()
      .from('organization_clients')
      .upsert(
        {
          organization_id: organizationId,
          client_user_id: userId,
          assigned_to: assignedTo ?? null,
          assigned_by: authUser.id,
          status: 'active'
        },
        { onConflict: 'organization_id,client_user_id' }
      )

    if (clientError) {
      if (isUniqueConstraintError(clientError)) {
        return NextResponse.json(
          { error: 'Client is already active in another organization' },
          { status: 409 }
        )
      }

      console.error('Error adding organization client:', clientError)
      return NextResponse.json({ error: 'Failed to add as client' }, { status: 500 })
    }

    // Keep this as a backward-compatible mirror while older screens migrate.
    const { error: updateError } = await getSupabaseAdmin()
      .from('profiles')
      .update({ consultant_organization_id: organizationId })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating legacy profile organization mirror:', {
        updateError,
        userId,
        organizationId
      })
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
