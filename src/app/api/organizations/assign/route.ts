import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import type { Database } from '@/types/database'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const AssignSchema = z.object({
  organizationId: z.string().uuid(),
  agronomistUserId: z.string().uuid().nullable(),
  clientUserIds: z.array(z.string().uuid()).min(1)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parseResult = AssignSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input: ' + parseResult.error.message },
        { status: 400 }
      )
    }
    const { organizationId, agronomistUserId, clientUserIds } = parseResult.data

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

    // Verify requester is an admin/owner of the organization
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

    // If assigning to an agronomist, verify they belong to the organization
    if (agronomistUserId) {
      const { data: assigneeMembership, error: assigneeMembershipError } = await getSupabaseAdmin()
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', agronomistUserId)
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

    // Bulk reassign via the authed client so RLS enforces admin-only writes
    const { data: updated, error: updateError } = await supabase
      .from('organization_clients')
      .update({
        assigned_to: agronomistUserId,
        assigned_by: authUser.id,
        assigned_at: new Date().toISOString()
      })
      .eq('organization_id', organizationId)
      .in('client_user_id', clientUserIds)
      .eq('status', 'active')
      .select('id')

    if (updateError) {
      console.error('Error reassigning organization clients:', updateError)
      return NextResponse.json({ error: 'Failed to update assignments' }, { status: 500 })
    }

    return NextResponse.json({ success: true, updated: updated?.length ?? 0 })
  } catch (error) {
    console.error('Error in assign API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
