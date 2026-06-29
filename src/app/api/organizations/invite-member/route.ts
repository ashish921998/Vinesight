import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import type { Database } from '@/types/database'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { globalRateLimiter } from '@/lib/validation'
import { escapeLikePattern } from '@/lib/org-membership'

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
    // Rate-limit before any work. Each accepted invite both sends an email (a spendable resource
    // under the project's SMTP quota) and creates an auth user via inviteUserByEmail, so cap how
    // fast a single caller can fan these out. This runs before the session is verified, so we use
    // the stricter (unauthenticated) tier — sending invites is low-frequency, so 50/min/IP is
    // ample for legitimate admins and an unauthenticated flood doesn't get the elevated limit.
    const clientIP =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'
    const rateLimit = globalRateLimiter.checkLimit(`invite-member-${clientIP}`, false)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: rateLimit.reason || 'Too many requests' }, { status: 429 })
    }

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

    // Reject if this email already belongs to an organization. The product is
    // single-org-per-user (profiles.consultant_organization_id holds one org),
    // and accept_organization_invite overwrites that pointer — so inviting a
    // user who already belongs to ANY org (this one or another) would silently
    // sever their original affiliation on accept. Guard against both cases here.
    const { data: existingProfile, error: profileError } = await getSupabaseAdmin()
      .from('profiles')
      .select('id, consultant_organization_id')
      .ilike('email', escapeLikePattern(email))
      .maybeSingle()

    if (profileError) {
      console.error('Error looking up profile by email:', profileError)
      return NextResponse.json({ error: 'Failed to verify invitee' }, { status: 500 })
    }

    if (existingProfile) {
      // Don't use .maybeSingle() here: it raises a PGRST116 error if legacy or
      // partial-failure data ever left this user with more than one membership row
      // (the table's only unique constraint is composite (organization_id, user_id),
      // so multiple rows per user are possible). Fetch the rows and reason over them
      // so a corrupt multi-row state still resolves to a clean 409 instead of a 500
      // that would block the admin from re-inviting.
      const { data: existingMemberships, error: existingMembershipError } = await getSupabaseAdmin()
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', existingProfile.id)

      if (existingMembershipError) {
        console.error('Error checking existing membership:', existingMembershipError)
        return NextResponse.json({ error: 'Failed to verify invitee' }, { status: 500 })
      }

      // Already a member of this org — nothing to invite.
      if (existingMemberships?.some((m) => m.organization_id === organizationId)) {
        return NextResponse.json({ error: 'Already a member' }, { status: 409 })
      }

      // Belongs to a different org (membership row or a lingering profile pointer).
      if ((existingMemberships?.length ?? 0) > 0 || existingProfile.consultant_organization_id) {
        return NextResponse.json(
          { error: 'This user already belongs to another organization' },
          { status: 409 }
        )
      }
    }

    // Expire any earlier still-pending invite for this email+org before issuing a new one, so
    // re-inviting just refreshes the link instead of colliding with the one-pending-per-email
    // unique index (which previously surfaced as a 409 the admin couldn't clear without revoking).
    const { error: expireError } = await getSupabaseAdmin()
      .from('organization_member_invitations')
      .update({ status: 'expired' })
      .eq('organization_id', organizationId)
      .eq('email', email)
      .eq('status', 'pending')

    if (expireError) {
      console.error('Error expiring prior pending invitations (non-fatal):', expireError)
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

    // Send the invite email via Supabase Auth. inviteUserByEmail creates a confirmed-on-click,
    // passwordless auth user and emails them a link; our custom invite email template turns
    // `org_invite_token` into a link to /auth/confirm?next=/signup/member/<token>, where the
    // invitee sets a password and the membership is written. This rides Supabase's mailer, so it
    // needs no sending domain (same channel as the existing OTP/verification emails).
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, '')
    const redirectTo = `${appUrl}/auth/confirm?next=${encodeURIComponent(`/signup/member/${token}`)}`

    let emailed = false
    let reason: 'existing_account' | 'email_failed' | undefined

    const { error: inviteEmailError } = await getSupabaseAdmin().auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          org_invite_token: token,
          first_name: firstName,
          last_name: lastName,
          invited_role: role
        },
        redirectTo
      }
    )

    if (!inviteEmailError) {
      emailed = true
    } else if (
      inviteEmailError.code === 'user_already_exists' ||
      inviteEmailError.code === 'email_exists' ||
      /already.*(registered|exists)/i.test(inviteEmailError.message)
    ) {
      // The invitee already has a VineSight account, so Supabase won't re-invite them. The
      // invitation row is still valid: they can open the share link while signed in to accept.
      reason = 'existing_account'
    } else {
      // Email delivery hiccup — don't fail the whole invite, the link still works as a fallback.
      console.error('Error sending member invite email:', inviteEmailError)
      reason = 'email_failed'
    }

    return NextResponse.json({
      success: true,
      emailed,
      reason,
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
