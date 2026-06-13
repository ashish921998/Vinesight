import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import type { Database } from '@/types/database'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Invitation TTL in days
const INVITATION_TTL_DAYS = 7

// P0: Validate input schema
const InviteMemberSchema = z.object({
  organizationId: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  role: z.enum(['admin', 'agronomist'])
})

function isUniqueConstraintError(error: { code?: string; message?: string; details?: string }) {
  const text = `${error.message ?? ''} ${error.details ?? ''}`.toLowerCase()
  return error.code === '23505' || text.includes('duplicate') || text.includes('unique')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input with Zod
    const parseResult = InviteMemberSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input: ' + parseResult.error.message },
        { status: 400 }
      )
    }
    const { organizationId, firstName, lastName, role } = parseResult.data
    const email = parseResult.data.email.trim().toLowerCase()

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

    // Reject if an active member already has that email in this organization
    const { data: existingProfile, error: profileError } = await getSupabaseAdmin()
      .from('profiles')
      .select('id')
      .ilike('email', email)
      .maybeSingle()

    if (profileError) {
      console.error('Error looking up profile by email:', profileError)
      return NextResponse.json({ error: 'Failed to verify invitee' }, { status: 500 })
    }

    if (existingProfile) {
      const { data: existingMember, error: existingMemberError } = await getSupabaseAdmin()
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', existingProfile.id)
        .maybeSingle()

      if (existingMemberError) {
        console.error('Error checking existing membership:', existingMemberError)
        return NextResponse.json({ error: 'Failed to verify invitee' }, { status: 500 })
      }

      if (existingMember) {
        return NextResponse.json({ error: 'Already a member' }, { status: 409 })
      }
    }

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + INVITATION_TTL_DAYS)

    const token = crypto.randomUUID()

    const { data: invitation, error: insertError } = await getSupabaseAdmin()
      .from('organization_member_invitations')
      .insert({
        organization_id: organizationId,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        token,
        status: 'pending',
        invited_by: authUser.id,
        expires_at: expiresAt.toISOString()
      })
      .select('id, token, email, role, expires_at')
      .single()

    if (insertError) {
      if (isUniqueConstraintError(insertError)) {
        return NextResponse.json(
          { error: 'A pending invite already exists for this email' },
          { status: 409 }
        )
      }

      console.error('Error creating member invitation:', insertError)
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        token: invitation.token,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expires_at
      }
    })
  } catch (error) {
    console.error('Error in invite-member API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    const { data: invitation, error: lookupError } = await admin
      .from('organization_member_invitations')
      .select(
        'id, email, first_name, last_name, role, status, expires_at, organization_id, organizations(name, slug)'
      )
      .eq('token', token)
      .maybeSingle()

    if (lookupError) {
      console.error('Error looking up invitation:', lookupError)
      return NextResponse.json({ error: 'Failed to look up invitation' }, { status: 500 })
    }

    if (!invitation || invitation.status === 'revoked' || invitation.status === 'accepted') {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Expired (either already flagged, or past expiry)
    if (invitation.status === 'expired' || new Date(invitation.expires_at) < new Date()) {
      if (invitation.status !== 'expired') {
        await admin
          .from('organization_member_invitations')
          .update({ status: 'expired' })
          .eq('id', invitation.id)
      }
      return NextResponse.json({ error: 'expired' }, { status: 410 })
    }

    const organization = invitation.organizations as { name: string; slug: string | null } | null

    return NextResponse.json({
      email: invitation.email,
      firstName: invitation.first_name,
      lastName: invitation.last_name,
      role: invitation.role,
      organizationId: invitation.organization_id,
      organizationName: organization?.name ?? null,
      organizationSlug: organization?.slug ?? null
    })
  } catch (error) {
    console.error('Error in invite-member GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
