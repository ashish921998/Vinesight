import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import type { Database } from '@/types/database'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const RevokeSchema = z.object({
  invitationId: z.string().uuid()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parseResult = RevokeSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input: ' + parseResult.error.message },
        { status: 400 }
      )
    }
    const { invitationId } = parseResult.data

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

    // Load the invitation to resolve its organization
    const { data: invitation, error: invitationError } = await getSupabaseAdmin()
      .from('organization_member_invitations')
      .select('id, organization_id, status')
      .eq('id', invitationId)
      .single()

    if (invitationError && invitationError.code !== 'PGRST116') {
      console.error('Error loading invitation:', invitationError)
      return NextResponse.json({ error: 'Failed to load invitation' }, { status: 500 })
    }

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Verify requester is admin/owner of the invite's organization
    const { data: membership, error: membershipError } = await getSupabaseAdmin()
      .from('organization_members')
      .select('role, is_owner')
      .eq('organization_id', invitation.organization_id)
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

    const { error: updateError } = await getSupabaseAdmin()
      .from('organization_member_invitations')
      .update({ status: 'revoked' })
      .eq('id', invitationId)

    if (updateError) {
      console.error('Error revoking invitation:', updateError)
      return NextResponse.json({ error: 'Failed to revoke invitation' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in revoke invite API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
