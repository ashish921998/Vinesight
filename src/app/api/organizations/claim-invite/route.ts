import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { globalRateLimiter } from '@/lib/validation'

// Claim an invite directly from the shared link — no email round-trip. The invitee
// arrives logged-out with only the token, sets a password, and joins. This deliberately
// trades the email-ownership proof of the emailed flow for link-possession: anyone who
// holds the link can claim the seat. To bound the blast radius we (a) restrict this path
// to the `agronomist` role (admins must still use the emailed/verified flow), (b) keep the
// invite single-use (the accept RPC flips it to `accepted`), and (c) honour the existing
// expiry + revoke controls. Share the link only over a private channel.
const ClaimInviteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6)
})

// Escape LIKE/ILIKE wildcards so an email is matched literally. `_` and `%` are
// legal email characters (e.g. john_doe@gmail.com); an unescaped `.ilike('email', email)`
// would treat `_` as "any char" and resolve a DIFFERENT account — which here would set a
// password on the wrong user. Backslash is Postgres's default LIKE escape character.
function escapeLikePattern(value: string): string {
  return value.replace(/([\\%_])/g, '\\$1')
}

/**
 * Resolve the auth user id for an email. Invites are always issued via
 * inviteUserByEmail, which creates a confirmed, passwordless auth user with a
 * profile row — so the profiles lookup is the reliable path. The listUsers
 * fallback covers the rare case where no profile row exists yet.
 */
async function findAuthUserIdByEmail(
  admin: ReturnType<typeof getSupabaseAdmin>,
  email: string
): Promise<string | null> {
  // Case-insensitive but wildcard-literal exact match on the email.
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .ilike('email', escapeLikePattern(email))
    .maybeSingle()
  if (profile?.id) return profile.id

  // Fallback: page through auth users (small project; a few pages at most).
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !data?.users?.length) break
    const match = data.users.find((u) => (u.email ?? '').toLowerCase() === email.toLowerCase())
    if (match) return match.id
    if (data.users.length < 1000) break
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    // Rate-limit before any work — this endpoint creates/updates an auth user, so cap
    // how fast a single caller can hammer it. Unauthenticated tier (the claimant has no
    // session yet); 50/min/IP is ample for a real person setting one password.
    const clientIP =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'
    const rateLimit = globalRateLimiter.checkLimit(`claim-invite-${clientIP}`, false)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: rateLimit.reason || 'Too many requests' }, { status: 429 })
    }

    const body = await request.json()
    const parseResult = ClaimInviteSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input: ' + parseResult.error.message },
        { status: 400 }
      )
    }
    const { token, password } = parseResult.data

    const admin = getSupabaseAdmin()

    // Load and validate the invite.
    const { data: invite, error: inviteError } = await admin
      .from('organization_member_invitations')
      .select('id, organization_id, email, first_name, last_name, role, status, expires_at')
      .eq('token', token)
      .maybeSingle()

    if (inviteError) {
      console.error('Error loading invite for claim:', inviteError)
      return NextResponse.json({ error: 'Failed to load invitation' }, { status: 500 })
    }
    if (!invite || invite.status === 'revoked' || invite.status === 'accepted') {
      return NextResponse.json({ error: 'This invite is no longer valid' }, { status: 404 })
    }
    if (invite.status === 'expired' || new Date(invite.expires_at) < new Date()) {
      if (invite.status !== 'expired') {
        await admin
          .from('organization_member_invitations')
          .update({ status: 'expired' })
          .eq('id', invite.id)
      }
      return NextResponse.json({ error: 'This invite has expired' }, { status: 410 })
    }

    // Guardrail: only agronomist invites can be claimed via the link. Admin access must
    // go through the emailed (email-verified) flow.
    if (invite.role !== 'agronomist') {
      return NextResponse.json(
        { error: 'This invite must be accepted from the email link. Please check your inbox.' },
        { status: 403 }
      )
    }

    const email = invite.email.toLowerCase()
    const userId = await findAuthUserIdByEmail(admin, email)

    if (userId) {
      // Account-takeover guard. This endpoint sets a password from a logged-out, link-only
      // request, so it must only ever touch an UNCLAIMED invited account: created by
      // inviteUserByEmail (confirmed, passwordless) and never signed in. If the email already
      // belongs to a real account that has signed in, overwriting its password would be
      // account takeover — refuse and route them to sign in instead.
      const { data: existing, error: getUserError } = await admin.auth.admin.getUserById(userId)
      if (getUserError || !existing?.user) {
        console.error('Error loading invitee during claim:', getUserError)
        return NextResponse.json({ error: 'Failed to verify invitee' }, { status: 500 })
      }
      if (existing.user.last_sign_in_at) {
        return NextResponse.json(
          { error: 'This email already has an account. Please sign in to accept the invite.' },
          { status: 409 }
        )
      }

      // Already a member of another org? Refuse rather than touch it. The accept RPC enforces
      // single-org too, but checking here returns a clearer message before any mutation.
      const { data: memberships, error: membershipError } = await admin
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', userId)
      if (membershipError) {
        console.error('Error checking memberships during claim:', membershipError)
        return NextResponse.json({ error: 'Failed to verify invitee' }, { status: 500 })
      }
      if (memberships?.some((m) => m.organization_id === invite.organization_id)) {
        return NextResponse.json(
          { error: 'You are already a member. Please sign in instead.' },
          { status: 409 }
        )
      }
      if ((memberships?.length ?? 0) > 0) {
        return NextResponse.json(
          { error: 'This account already belongs to another organization.' },
          { status: 409 }
        )
      }
      // Password is set AFTER the join RPC succeeds (below), so a rejected join never leaves a
      // mutated credential behind.
    } else {
      // No auth user yet — create one confirmed (no email round-trip).
      const { error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name: invite.first_name, last_name: invite.last_name }
      })
      if (createError) {
        console.error('Error creating user during claim:', createError)
        return NextResponse.json({ error: 'Could not create your account' }, { status: 500 })
      }
    }

    const resolvedUserId = userId ?? (await findAuthUserIdByEmail(admin, email))
    if (!resolvedUserId) {
      console.error('Could not resolve user id after claim for invite', invite.id)
      return NextResponse.json({ error: 'Could not complete sign-up' }, { status: 500 })
    }

    // Atomically join: membership + profile + mark invite accepted. The RPC re-guards
    // role, single-org, and status = 'pending'.
    const { error: rpcError } = await admin.rpc('accept_organization_invite', {
      p_user_id: resolvedUserId,
      p_invite_id: invite.id,
      p_organization_id: invite.organization_id,
      p_role: invite.role,
      p_first_name: invite.first_name,
      p_last_name: invite.last_name
    })
    if (rpcError) {
      console.error('Error in accept_organization_invite RPC during claim:', rpcError)
      return NextResponse.json({ error: 'Failed to join organization' }, { status: 500 })
    }

    // For an existing (unclaimed, never-signed-in) invitee, set the password only now that the
    // join has succeeded — a rejected join above never reaches here, so it can't leave a mutated
    // credential. The create path already set the password at account creation.
    if (userId) {
      const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true
      })
      if (updateError) {
        console.error('Error setting password during claim:', updateError)
        return NextResponse.json({ error: 'Could not set your password' }, { status: 500 })
      }
    }

    // Client signs in with these credentials next; return the email for convenience.
    return NextResponse.json({ success: true, email })
  } catch (error) {
    console.error('Error in claim-invite API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
