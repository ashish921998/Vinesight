import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { globalRateLimiter } from '@/lib/validation'
import { classifyMembership, findAuthUserIdByEmail } from '@/lib/org-membership'

// Claim an invite directly from the shared link — no email round-trip. The invitee
// arrives logged-out with only the token, sets a password, and joins. This deliberately
// trades the email-ownership proof of the emailed flow for link-possession: anyone who
// holds the link can claim the seat. To bound the blast radius we (a) restrict this path
// to the `agronomist` role (admins must still use the emailed/verified flow), (b) keep the
// invite single-use (the accept RPC consumes it atomically and rejects a claim that didn't
// win the race — see accept_organization_invite), and (c) honour the existing expiry +
// revoke controls. Share the link only over a private channel.
const ClaimInviteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6)
})

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
    let createdUserId: string | null = null

    if (userId) {
      // Account-takeover guard. This endpoint sets a password from a logged-out, link-only
      // request, so it must only ever touch a PASSWORDLESS account — an unclaimed invite stub
      // created by inviteUserByEmail. If the email already has a real password, overwriting it
      // would be account takeover, so refuse and route them to sign in.
      //
      // We gate on the actual credential (encrypted_password), NOT last_sign_in_at: opening the
      // Supabase invite email signs the user in without setting a password, so last_sign_in_at
      // would falsely block legitimately-passwordless invitees who clicked the email.
      const { data: hasPassword, error: pwError } = await admin.rpc(
        'claim_invite_account_has_password',
        { p_user_id: userId }
      )
      // Fail closed: the function returns NULL when no auth.users row matches (e.g. an orphaned
      // profile id). NULL means "could not confirm this account is passwordless", which must NOT
      // be treated as "no password → safe to set one". Refuse instead of proceeding on an
      // unverified id.
      if (pwError || hasPassword === null) {
        console.error('Error checking credential during claim:', pwError, 'invite', invite.id)
        return NextResponse.json({ error: 'Failed to verify invitee' }, { status: 500 })
      }
      if (hasPassword) {
        return NextResponse.json(
          { error: 'This email already has an account. Please sign in to accept the invite.' },
          { status: 409 }
        )
      }

      // Already a member of another org? Refuse rather than touch it. The accept RPC enforces
      // single-org too, but checking here returns a clearer message before any mutation.
      const membership = await classifyMembership(admin, userId, invite.organization_id)
      if ('error' in membership) {
        console.error('Error checking memberships during claim:', membership.error)
        return NextResponse.json({ error: 'Failed to verify invitee' }, { status: 500 })
      }
      if (membership.status === 'member-of-target') {
        return NextResponse.json(
          { error: 'You are already a member. Please sign in instead.' },
          { status: 409 }
        )
      }
      if (membership.status === 'member-of-other') {
        return NextResponse.json(
          { error: 'This account already belongs to another organization.' },
          { status: 409 }
        )
      }
      // Password is set only after the join RPC succeeds (below).
    } else {
      // No auth user yet — create one confirmed (no email round-trip).
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name: invite.first_name, last_name: invite.last_name }
      })
      if (createError || !created?.user) {
        console.error('Error creating user during claim:', createError)
        return NextResponse.json({ error: 'Could not create your account' }, { status: 500 })
      }
      createdUserId = created.user.id
    }

    const resolvedUserId = userId ?? createdUserId
    if (!resolvedUserId) {
      console.error('Could not resolve user id after claim for invite', invite.id)
      return NextResponse.json({ error: 'Could not complete sign-up' }, { status: 500 })
    }

    // Atomically join: membership + profile + consume invite. The RPC re-guards role and
    // single-org, and raises if the invite is no longer pending — so a claim that lost a
    // concurrent race fails here (rpcError) and never reaches the password write below.
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
      // Compensating cleanup: if we created the account for THIS claim, remove it so a failed
      // join (e.g. the invite was claimed concurrently) doesn't strand an orphaned confirmed
      // account the user never knowingly created. Only the create path is rolled back — the
      // existing-user path never mutated anything before this point. Best-effort.
      if (createdUserId) {
        const { error: cleanupError } = await admin.auth.admin.deleteUser(createdUserId)
        if (cleanupError) {
          console.error('Failed to clean up orphaned user after claim failure:', cleanupError)
        }
      }
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
        // Irreducible seam: the join already committed (this user is now a member), but the
        // password write lives in auth.users and can't share the RPC's transaction. Don't delete
        // the account — they legitimately joined — and don't pretend success. Point them at
        // password reset so they can finish; the membership is already valid. Logged loudly so
        // this rare inconsistency is visible.
        console.error('Claim joined but password write failed (recoverable via reset):', {
          inviteId: invite.id,
          updateError
        })
        return NextResponse.json(
          {
            error:
              'You’ve joined, but we couldn’t set your password. Use “Forgot password” on the sign-in page to finish.'
          },
          { status: 500 }
        )
      }
    }

    // Client signs in with these credentials next; return the email for convenience.
    return NextResponse.json({ success: true, email })
  } catch (error) {
    console.error('Error in claim-invite API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
