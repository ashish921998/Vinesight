import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { validateUserSession } from '@/lib/auth-utils'
import { globalRateLimiter } from '@/lib/validation'

// Binds an invited farmer to the inviting organization as an active client. Called from the
// invited-farmer signup page right after the farmer verifies the OTP sent to their phone.
// Authorization is by phone-ownership proof: the caller has an authenticated session whose
// confirmed phone matches the invitation's phone (see the checks below).

const AcceptSchema = z.object({
  userId: z.string().uuid(),
  token: z.string().min(1)
})

// True when the user is already an active client of the org, false when they aren't, and null
// when the link status can't be determined (a transient DB error). Used to keep acceptance
// idempotent: a retry/double-submit of an already-successful accept should report success, not a
// false "already used" error, whether the second request arrives after the first committed
// (status already 'accepted') or merely lost the concurrent claim race. Returning null on error —
// instead of collapsing it to false — lets the retry call sites fail with a 500 rather than
// mistaking the error for "not linked" and answering a benign retry with a wrong 409. This
// matches the fail-closed convention used by the guards below (membership / existing-client).
async function hasActiveClientLink(
  admin: ReturnType<typeof getSupabaseAdmin>,
  organizationId: string,
  userId: string
): Promise<boolean | null> {
  const { data, error } = await admin
    .from('organization_clients')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('client_user_id', userId)
    .eq('status', 'active')
    .maybeSingle()
  if (error) {
    console.error('Error checking active client link:', error)
    return null
  }
  return Boolean(data)
}

export async function POST(request: NextRequest) {
  try {
    // Rate-limit before any DB work. Matches the tasks/route.ts convention; authenticated
    // callers get the higher limit.
    const clientIP =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'
    const rateLimit = globalRateLimiter.checkLimit(`invite-accept-${clientIP}`, true)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: rateLimit.reason || 'Too many requests' }, { status: 429 })
    }

    const body = await request.json()

    const parsed = AcceptSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input: ' + parsed.error.message }, { status: 400 })
    }
    const { userId, token } = parsed.data

    const admin = getSupabaseAdmin()

    // Load and validate the invitation.
    const { data: invite, error: invError } = await admin
      .from('farmer_invitations')
      .select('id, organization_id, status, expires_at, invited_by, phone')
      .eq('token', token)
      .maybeSingle()

    if (invError) {
      console.error('Error loading invitation:', invError)
      return NextResponse.json({ error: 'Failed to load invitation' }, { status: 500 })
    }
    if (!invite) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Authenticate the caller and prove they own the invited number. The signup page calls
    // this right after the farmer verifies the OTP, so there is a real session whose phone is
    // confirmed. Requiring session.phone == invite.phone (instead of the old "account created
    // < 5 min ago" heuristic) means a forwarded link opened on a different number is rejected,
    // an already-registered farmer can still accept, and nobody can bind a farmer to an org
    // without that farmer's own verified session.
    const { user: sessionUser } = await validateUserSession(request)
    if (!sessionUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (sessionUser.id !== userId) {
      return NextResponse.json({ error: 'Session does not match user' }, { status: 403 })
    }
    const invitePhoneDigits = (invite.phone ?? '').replace(/\D/g, '')
    const sessionPhoneDigits = (sessionUser.phone ?? '').replace(/\D/g, '')
    if (
      !sessionUser.phone_confirmed_at ||
      !invitePhoneDigits ||
      sessionPhoneDigits !== invitePhoneDigits
    ) {
      return NextResponse.json(
        { error: 'Your verified phone number does not match this invitation' },
        { status: 403 }
      )
    }

    if (invite.status !== 'pending') {
      // The token's already consumed. If it was accepted and THIS user is the org's active
      // client, it's a benign retry of their own successful accept (e.g. the first response
      // was lost, or a delayed double-submit) — report success instead of a false "already
      // used" error. Otherwise the token is genuinely spent (someone else, or revoked/expired).
      if (invite.status === 'accepted') {
        const link = await hasActiveClientLink(admin, invite.organization_id, userId)
        if (link === null) {
          return NextResponse.json({ error: 'Failed to verify client status' }, { status: 500 })
        }
        if (link) {
          return NextResponse.json({ success: true, message: 'Linked to organization' })
        }
      }
      return NextResponse.json({ error: 'Invitation already used or revoked' }, { status: 409 })
    }
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      await admin.from('farmer_invitations').update({ status: 'expired' }).eq('id', invite.id)
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 })
    }

    // These reads are independent and the invitation is already validated, so fetch them
    // concurrently: the farmer's profile (to backfill their phone), any existing active client
    // link (across orgs), the inviting org's current active flag, whether the caller is staff,
    // and the farmer's existing client row IN THIS ORG (any status). create() checked is_active
    // up to 7 days ago, so we re-check at bind time — a since-deactivated org shouldn't acquire
    // new clients (mirrors /api/organizations/add-client, the sibling client-binding path).
    const [
      { data: profile, error: profileError },
      { data: activeLink, error: activeLinkError },
      { data: org, error: orgError },
      { data: orgMember, error: orgMemberError },
      { data: existingClient, error: existingClientError }
    ] = await Promise.all([
      admin.from('profiles').select('phone').eq('id', userId).maybeSingle(),
      admin
        .from('organization_clients')
        .select('organization_id')
        .eq('client_user_id', userId)
        .eq('status', 'active')
        .maybeSingle(),
      admin.from('organizations').select('is_active').eq('id', invite.organization_id).single(),
      admin
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', invite.organization_id)
        .eq('user_id', userId)
        .maybeSingle(),
      admin
        .from('organization_clients')
        .select('status')
        .eq('organization_id', invite.organization_id)
        .eq('client_user_id', userId)
        .maybeSingle()
    ])

    // The two guards below (staff-as-farmer block, removed-client re-admission block) are
    // authorization checks, so a transient DB error on either query must fail CLOSED. Without
    // capturing these errors, a failed query returns null/undefined data that reads as "no row
    // found" — silently passing the guard and letting a staff member bind as a farmer, or a
    // deliberately-removed client re-admit themselves via a leftover token.
    if (orgMemberError) {
      console.error('Error checking organization membership:', orgMemberError)
      return NextResponse.json({ error: 'Failed to verify account status' }, { status: 500 })
    }
    if (existingClientError) {
      console.error('Error checking existing client link:', existingClientError)
      return NextResponse.json({ error: 'Failed to verify client status' }, { status: 500 })
    }

    // A team member (staff) of the inviting org must not be bound as a client of that same org —
    // that would make one account both staff and farmer. This is the reliable backstop for the
    // create-time block, which can't see email-only accounts. Checked before claiming the token.
    if (orgMember) {
      return NextResponse.json(
        { error: 'This account is a team member of the organization and can’t join as a farmer.' },
        { status: 403 }
      )
    }

    // A client the org deliberately deactivated must not re-activate themselves by accepting a
    // leftover/duplicate invite — re-admitting a removed farmer is the org's decision, not the
    // farmer's. Checked before claiming the token. (A brand-new or still-active client falls
    // through; the link step below decides insert vs. idempotent no-op.)
    if (existingClient?.status === 'inactive') {
      return NextResponse.json(
        { error: 'You were removed from this organization. Please contact them to be re-added.' },
        { status: 403 }
      )
    }

    // A client can only be active in one organization at a time.
    if (activeLinkError) {
      console.error('Error checking active client link:', activeLinkError)
      return NextResponse.json({ error: 'Failed to verify client status' }, { status: 500 })
    }
    if (activeLink && activeLink.organization_id !== invite.organization_id) {
      return NextResponse.json(
        { error: 'You are already linked to another organization' },
        { status: 409 }
      )
    }

    // The inviting org must still be active — it may have been deactivated in the days
    // between invite creation and acceptance. Checked before claiming the token below so a
    // dead org can't consume the invitation.
    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }
    if (!org.is_active) {
      return NextResponse.json({ error: 'Organization is no longer active' }, { status: 400 })
    }

    // Atomically claim the single-use token. The earlier `status !== 'pending'` check is a
    // fast path, not the guarantee: reading the status and later writing 'accepted' is a
    // TOCTOU race, so two concurrent accepts of one forwarded link (two distinct fresh
    // accounts) could both pass the read and both create a client link. This conditional
    // update IS the gate — of any concurrent callers, exactly one flips pending→accepted
    // and proceeds; the rest match zero rows and stop here.
    const { data: claimed, error: claimError } = await admin
      .from('farmer_invitations')
      .update({ status: 'accepted' })
      .eq('id', invite.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle()

    if (claimError) {
      console.error('Error claiming invitation:', claimError)
      return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 })
    }
    if (!claimed) {
      // Lost the concurrent claim race (another request flipped pending→accepted between our
      // read and update). Same benign-retry rule as the early guard: success if this user is
      // already the org's active client, otherwise the token's genuinely spent.
      const link = await hasActiveClientLink(admin, invite.organization_id, userId)
      if (link === null) {
        return NextResponse.json({ error: 'Failed to verify client status' }, { status: 500 })
      }
      if (link) {
        return NextResponse.json({ success: true, message: 'Linked to organization' })
      }
      return NextResponse.json({ error: 'Invitation already used or revoked' }, { status: 409 })
    }

    // Token claimed — link the farmer to the org. An already-active client of this org is a
    // benign duplicate/leftover-token re-accept: leave their row (and its assignment) intact
    // instead of re-asserting it, so a stray invite can't silently reassign them to a different
    // staff member. Only a brand-new client gets a row. (A deactivated row was already refused
    // above, so existingClient is undefined or active.)
    if (existingClient?.status === 'active') {
      return NextResponse.json({ success: true, message: 'Linked to organization' })
    }

    // An Assignment may only ever target an agronomist. Inherit the inviter as the
    // assigned agronomist only when they actually hold that role; an owner/admin invite
    // lands the client Unassigned so the assignment screen's "Unassigned" signal stays
    // trustworthy (see docs/adr/0001-assignment-targets-agronomist.md). assigned_by still
    // records who enrolled them, regardless of role. A DB trigger backstops this.
    let assignedAgronomist: string | null = null
    if (invite.invited_by) {
      const { data: inviterMembership } = await admin
        .from('organization_members')
        .select('role')
        .eq('organization_id', invite.organization_id)
        .eq('user_id', invite.invited_by)
        .maybeSingle()
      if (inviterMembership?.role === 'agronomist') {
        assignedAgronomist = invite.invited_by
      }
    }

    const { error: clientError } = await admin.from('organization_clients').insert({
      organization_id: invite.organization_id,
      client_user_id: userId,
      assigned_to: assignedAgronomist,
      assigned_by: invite.invited_by ?? null,
      status: 'active'
    })

    if (clientError) {
      // 23505 = a permanent conflict: a concurrent request linked this farmer first, or (rare) a
      // pending organization_clients row already exists in THIS org. The token is genuinely spent,
      // not retryable, so expire it — otherwise resetting it to 'pending' would resurrect a
      // re-bindable bearer secret that could later silently re-bind the farmer (e.g. after they're
      // removed from whichever org now holds them).
      if (clientError.code === '23505') {
        await admin.from('farmer_invitations').update({ status: 'expired' }).eq('id', invite.id)
        // If they're now an active client of THIS org it's a benign concurrent race → success;
        // otherwise the one-active-org-per-client index rejected them because they're active
        // elsewhere.
        const link = await hasActiveClientLink(admin, invite.organization_id, userId)
        if (link === null) {
          return NextResponse.json({ error: 'Failed to verify client status' }, { status: 500 })
        }
        if (link) {
          return NextResponse.json({ success: true, message: 'Linked to organization' })
        }
        return NextResponse.json(
          { error: 'You are already linked to another organization' },
          { status: 409 }
        )
      }

      // Transient error (connection drop, statement timeout) — the token is still retryable. Release
      // THIS request's claim, gated on the status still being 'accepted', so the farmer can retry
      // the same link instead of being locked out by a now-spent invitation. The status predicate
      // avoids resurrecting a token that a concurrent create-route sweep (which only expires
      // 'pending' rows) or another accept already moved past.
      console.error('Error linking client:', clientError)
      await admin
        .from('farmer_invitations')
        .update({ status: 'pending' })
        .eq('id', invite.id)
        .eq('status', 'accepted')
      return NextResponse.json({ error: 'Failed to link to organization' }, { status: 500 })
    }

    // Keep the legacy profiles.consultant_organization_id mirror in sync (older screens
    // read it), backfilling the invited phone in the same write when the farmer has none.
    // Only backfill when the profile read above actually succeeded — a failed read leaves
    // `profile` undefined, which must not be mistaken for "farmer has no phone".
    const profilePatch: { consultant_organization_id: string; phone?: string } = {
      consultant_organization_id: invite.organization_id
    }
    if (!profileError && invite.phone && !profile?.phone) {
      profilePatch.phone = invite.phone
    }

    // Non-fatal: organization_clients (linked above) is the source of truth for scoping, so a
    // failed mirror write only leaves legacy screens stale — log it rather than failing the
    // accept, since the farmer is already correctly linked.
    const { error: mirrorError } = await admin
      .from('profiles')
      .update(profilePatch)
      .eq('id', userId)
    if (mirrorError) {
      console.error('Error syncing legacy profile org mirror:', mirrorError)
    }

    return NextResponse.json({ success: true, message: 'Linked to organization' })
  } catch (error) {
    console.error('Error in invite/accept API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
