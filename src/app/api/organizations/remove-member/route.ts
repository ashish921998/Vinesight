import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import type { Database } from '@/types/database'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const RemoveMemberSchema = z.object({
  organizationId: z.string().uuid(),
  userId: z.string().uuid()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parseResult = RemoveMemberSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input: ' + parseResult.error.message },
        { status: 400 }
      )
    }
    const { organizationId, userId } = parseResult.data

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Verify requester is authenticated
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

    // Cannot remove yourself
    if (userId === authUser.id) {
      return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 403 })
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

    // Load target member; reject removing the owner
    const { data: target, error: targetError } = await getSupabaseAdmin()
      .from('organization_members')
      .select('role, is_owner')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single()

    if (targetError && targetError.code !== 'PGRST116') {
      console.error('Error loading target member:', targetError)
      return NextResponse.json({ error: 'Failed to load member' }, { status: 500 })
    }

    if (!target) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (target.is_owner || target.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove the owner' }, { status: 403 })
    }

    // Atomically: unassign the member's farmers, delete the membership, reset the
    // profile. A Postgres RPC wraps all three in one transaction so a partial
    // failure can't strip access while leaving dangling assignments or a stale
    // profile org linkage (the farmer FK references auth.users(id), not the
    // membership row, so deleting the membership does NOT auto-null it).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- RPC not yet in generated types; remove after running migration + type regen
    const { error: rpcError } = await (getSupabaseAdmin() as any).rpc(
      'remove_organization_member',
      {
        p_organization_id: organizationId,
        p_user_id: userId
      }
    )

    if (rpcError) {
      console.error('Error in remove_organization_member RPC:', rpcError)
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in remove-member API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
