import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Public lookup for the invited-farmer signup page. The visitor is unauthenticated, so RLS
// would hide farmer_invitations — we use the admin client but return only the minimum the page
// needs: the org name (for branding) and the invited phone (the page sends the OTP to it
// client-side, so it can't be masked away here). We deliberately do NOT return the farmer's
// name: this token is a 7-day bearer secret that can leak (forwarded link, preview crawler),
// so PII exposed on it is kept to the unavoidable minimum.

export async function GET(request: NextRequest) {
  try {
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

    const { data: org, error: orgError } = await admin
      .from('organizations')
      .select('name')
      .eq('id', invite.organization_id)
      .maybeSingle()

    // Surface a transient org-lookup failure as an error instead of returning a "valid"
    // invite with a null org name (which would render the page unbranded and hide the
    // backend failure).
    if (orgError) {
      console.error('Error resolving invitation organization:', orgError)
      return NextResponse.json({ valid: false, reason: 'error' }, { status: 500 })
    }

    return NextResponse.json({
      valid: true,
      organizationName: org?.name ?? null,
      phone: invite.phone ?? null
    })
  } catch (error) {
    console.error('Error in invite/resolve API:', error)
    return NextResponse.json({ valid: false, reason: 'error' }, { status: 500 })
  }
}
