import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { globalRateLimiter } from '@/lib/validation'

// Public lookup for the invited-farmer signup page. The visitor is unauthenticated, so RLS
// would hide farmer_invitations — we use the admin client but return only the minimum the page
// needs: the org name (for branding) and the invited phone (the page sends the OTP to it
// client-side, so it can't be masked away here). We deliberately do NOT return the farmer's
// name: this token is a 7-day bearer secret that can leak (forwarded link, preview crawler),
// so PII exposed on it is kept to the unavoidable minimum.

export async function GET(request: NextRequest) {
  try {
    // Unauthenticated endpoint: rate-limit by IP so a holder of a token (or an attacker probing
    // random tokens) can't hammer it. Matches the tasks/route.ts convention.
    const clientIP =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'
    const rateLimit = globalRateLimiter.checkLimit(`invite-resolve-${clientIP}`)
    if (!rateLimit.allowed) {
      return NextResponse.json({ valid: false, reason: 'rate_limited' }, { status: 429 })
    }

    const token = request.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.json({ valid: false, reason: 'missing_token' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    const { data: invite, error } = await admin
      .from('farmer_invitations')
      .select('status, expires_at, organization_id, phone')
      .eq('token', token)
      .maybeSingle()

    if (error) {
      console.error('Error resolving invitation:', error)
      return NextResponse.json({ valid: false, reason: 'error' }, { status: 500 })
    }
    if (!invite) {
      return NextResponse.json({ valid: false, reason: 'not_found' }, { status: 404 })
    }
    if (invite.status !== 'pending') {
      return NextResponse.json({ valid: false, reason: 'already_used' })
    }
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, reason: 'expired' })
    }

    // A pending invite without a phone is unusable — the signup page renders a read-only,
    // empty phone field and the Send button stays permanently disabled. Reject it here
    // instead of stranding the farmer on a form they can never submit.
    if (!invite.phone) {
      return NextResponse.json({ valid: false, reason: 'invalid' })
    }

    const { data: org, error: orgError } = await admin
      .from('organizations')
      .select('name, is_active')
      .eq('id', invite.organization_id)
      .maybeSingle()

    // Surface a transient org-lookup failure as an error instead of returning a "valid"
    // invite with a null org name (which would render the page unbranded and hide the
    // backend failure).
    if (orgError) {
      console.error('Error resolving invitation organization:', orgError)
      return NextResponse.json({ valid: false, reason: 'error' }, { status: 500 })
    }

    // Don't let a farmer burn an OTP on a deactivated org. resolve is the earliest gate;
    // accept would only reject them (400) after they'd already created a confirmed phone
    // account that then blocks that number from ever being re-invited.
    if (!org?.is_active) {
      return NextResponse.json({ valid: false, reason: 'org_inactive' })
    }

    return NextResponse.json({
      valid: true,
      organizationName: org.name,
      phone: invite.phone
    })
  } catch (error) {
    console.error('Error in invite/resolve API:', error)
    return NextResponse.json({ valid: false, reason: 'error' }, { status: 500 })
  }
}
