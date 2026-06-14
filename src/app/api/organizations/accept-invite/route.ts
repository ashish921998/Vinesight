import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import type { Database } from '@/types/database'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const AcceptInviteSchema = z.object({
  token: z.string().min(1)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parseResult = AcceptInviteSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input: ' + parseResult.error.message },
        { status: 400 }
      )
    }
    const { token } = parseResult.data

    // Authenticate the caller via session cookie — never trust userId from the body.
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

    const userId = authUser.id
    const admin = getSupabaseAdmin()

    // Load invite by token
    const { data: invite, error: inviteError } = await admin
      .from('organization_member_invitations')
      .select(
        'id, organization_id, email, first_name, last_name, role, status, expires_at, accepted_user_id'
      )
      .eq('token', token)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    if (invite.status !== 'pending') {
      // Idempotent success: if THIS user already accepted, they're already a member, so a re-fire
      // or a revisit of a consumed link should not error. Any other non-pending status (revoked,
      // or accepted by someone else) is a genuine failure — callers must not redirect on it.
      if (invite.status === 'accepted' && invite.accepted_user_id === userId) {
        const { data: organization } = await admin
          .from('organizations')
          .select('slug')
          .eq('id', invite.organization_id)
          .single()
        return NextResponse.json({
          success: true,
          organizationSlug: organization?.slug ?? null
        })
      }
      return NextResponse.json({ error: 'Invitation is no longer valid' }, { status: 400 })
    }

    if (new Date(invite.expires_at) < new Date()) {
      await admin
        .from('organization_member_invitations')
        .update({ status: 'expired' })
        .eq('id', invite.id)
      return NextResponse.json({ error: 'expired' }, { status: 410 })
    }

    // Verify the authenticated user's email matches the invite email (case-insensitive)
    const userEmail = authUser.email ?? ''
    if (userEmail.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json({ error: 'Email mismatch' }, { status: 403 })
    }

    // Require a verified email before granting org membership. The acceptance flow
    // defers this call until after OTP confirmation, so a leaked invite link cannot
    // write a (privileged) membership row for an email the actor does not control.
    if (!authUser.email_confirmed_at) {
      return NextResponse.json({ error: 'Email not verified' }, { status: 403 })
    }

    // Atomically: insert membership, update profile, mark invite accepted.
    // Uses a Postgres RPC function so all three mutations are in a single transaction.
    const { error: rpcError } = await admin.rpc('accept_organization_invite', {
      p_user_id: userId,
      p_invite_id: invite.id,
      p_organization_id: invite.organization_id,
      p_role: invite.role,
      p_first_name: invite.first_name,
      p_last_name: invite.last_name
    })

    if (rpcError) {
      console.error('Error in accept_organization_invite RPC:', rpcError)
      return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 })
    }

    // Fetch the organization slug for the response
    const { data: organization } = await admin
      .from('organizations')
      .select('slug')
      .eq('id', invite.organization_id)
      .single()

    return NextResponse.json({
      success: true,
      organizationSlug: organization?.slug ?? null
    })
  } catch (error) {
    console.error('Error in accept-invite API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
