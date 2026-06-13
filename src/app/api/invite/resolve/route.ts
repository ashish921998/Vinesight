import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Public lookup for the invited-farmer signup page. The visitor is unauthenticated,
// so RLS would hide farmer_invitations — we use the admin client and only return
// the minimal, non-sensitive fields needed to render the page (org name + display name).

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.json({ valid: false, reason: 'missing_token' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    const { data: invite, error } = await admin
      .from('farmer_invitations')
      .select('status, expires_at, farmer_name, organization_id, phone')
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

    const { data: org } = await admin
      .from('organizations')
      .select('name')
      .eq('id', invite.organization_id)
      .maybeSingle()

    return NextResponse.json({
      valid: true,
      organizationName: org?.name ?? null,
      farmerName: invite.farmer_name ?? null,
      phone: invite.phone ?? null
    })
  } catch (error) {
    console.error('Error in invite/resolve API:', error)
    return NextResponse.json({ valid: false, reason: 'error' }, { status: 500 })
  }
}
