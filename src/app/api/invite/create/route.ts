import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { validateUserSession } from '@/lib/auth-utils'
import { normalizePhone } from '@/lib/phone'

// Creates a phone-based farmer invitation and returns a shareable signup link.
// Unlike /api/invite (email), this endpoint does NOT send anything — the consultant
// shares the returned link via WhatsApp/SMS/copy from the UI.

const CreateInviteSchema = z.object({
  organizationId: z.string().uuid(),
  phone: z.string().min(1),
  farmerName: z.string().trim().max(255).optional()
})

const INVITATION_TTL_DAYS = 7

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parsed = CreateInviteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input: ' + parsed.error.message }, { status: 400 })
    }
    const { organizationId, phone, farmerName } = parsed.data

    const normalized = normalizePhone(phone)
    if (!normalized) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }

    // The invite link must point at our own domain.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      console.error('NEXT_PUBLIC_APP_URL is not configured')
      return NextResponse.json(
        { error: 'Server misconfiguration: NEXT_PUBLIC_APP_URL not set' },
        { status: 500 }
      )
    }

    // Identify the requester from their session.
    const { user, error: authError } = await validateUserSession(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Any active member of the org (owner/admin/agronomist) can invite farmers.
    // We use the admin client for the membership check + insert so agronomists aren't
    // blocked by the owner/admin-only RLS insert policy on farmer_invitations.
    const admin = getSupabaseAdmin()

    const { data: membership, error: membershipError } = await admin
      .from('organization_members')
      .select('role, is_owner')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (membershipError) {
      console.error('Error checking membership:', membershipError)
      return NextResponse.json({ error: 'Failed to verify permissions' }, { status: 500 })
    }
    if (!membership) {
      return NextResponse.json({ error: 'Not authorized for this organization' }, { status: 403 })
    }

    // Organization name is embedded in the invite message shown to the farmer.
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .select('name, is_active')
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }
    if (!org.is_active) {
      return NextResponse.json({ error: 'Organization is not active' }, { status: 400 })
    }

    // Block inviting a number that already belongs to a VineSight account. phone_in_use is a
    // SECURITY DEFINER function (migration 202606040006) because the auth schema isn't reachable
    // from app code — it checks auth.users.phone (every phone-login account) plus profiles.phone.
    // Caveat: an email-only account keeps no phone anywhere, so its number is undetectable here;
    // the accept route is the backstop that refuses to bind a number resolving to a team member.
    const { data: phoneInUse, error: phoneCheckError } = await admin.rpc('phone_in_use', {
      p_e164: normalized.e164
    })

    if (phoneCheckError) {
      console.error('Error checking existing phone:', phoneCheckError)
      return NextResponse.json({ error: 'Failed to verify phone number' }, { status: 500 })
    }
    if (phoneInUse) {
      return NextResponse.json(
        { error: 'This number already has a VineSight account and can’t be invited.' },
        { status: 409 }
      )
    }

    // Defense-in-depth: revoke any earlier still-pending invite for this same number+org before
    // issuing a new one, so at most one token is live per (org, phone). Each pending token is a
    // 7-day bearer secret, so leaving stale duplicates around only widens the leak surface (and
    // clutters the table). Non-fatal — a failed cleanup just leaves the prior token(s) live, which
    // is today's baseline and is already harmless (the accept route re-checks client status from a
    // live query, not the token), so it shouldn't block the consultant from issuing the new link.
    const { error: revokeError } = await admin
      .from('farmer_invitations')
      .update({ status: 'expired' })
      .eq('organization_id', organizationId)
      .eq('phone', normalized.e164)
      .eq('status', 'pending')

    if (revokeError) {
      console.error('Error revoking prior pending invitations (non-fatal):', revokeError)
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + INVITATION_TTL_DAYS)
    const token = crypto.randomUUID()

    const { error: invError } = await admin.from('farmer_invitations').insert({
      organization_id: organizationId,
      token,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      phone: normalized.e164,
      farmer_name: farmerName?.trim() || null,
      invited_by: user.id
    })

    if (invError) {
      console.error('Error creating invitation:', invError)
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }

    const inviteUrl = `${appUrl.replace(/\/$/, '')}/signup/invite/${token}`

    return NextResponse.json({
      success: true,
      token,
      inviteUrl,
      expiresAt: expiresAt.toISOString(),
      organizationName: org.name
    })
  } catch (error) {
    console.error('Error in invite/create API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
