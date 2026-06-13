import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const AcceptInviteSchema = z.object({
  userId: z.string().uuid(),
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
    const { userId, token } = parseResult.data

    const admin = getSupabaseAdmin()

    // Load invite by token
    const { data: invite, error: inviteError } = await admin
      .from('organization_member_invitations')
      .select('id, organization_id, email, first_name, last_name, role, status, expires_at')
      .eq('token', token)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'Invitation is no longer valid' }, { status: 400 })
    }

    if (new Date(invite.expires_at) < new Date()) {
      await admin
        .from('organization_member_invitations')
        .update({ status: 'expired' })
        .eq('id', invite.id)
      return NextResponse.json({ error: 'expired' }, { status: 410 })
    }

    // Verify the auth user's email matches the invite email (case-insensitive)
    const { data: authData, error: authError } = await admin.auth.admin.getUserById(userId)
    if (authError || !authData?.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userEmail = authData.user.email ?? ''
    if (userEmail.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json({ error: 'Email mismatch' }, { status: 403 })
    }

    // Require a verified email before granting org membership. The acceptance flow
    // defers this call until after OTP confirmation, so a leaked invite link cannot
    // write a (privileged) membership row for an email the actor does not control.
    if (!authData.user.email_confirmed_at) {
      return NextResponse.json({ error: 'Email not verified' }, { status: 403 })
    }

    // Insert membership only if not already a member. Never overwrite an existing
    // role/is_owner — that would let a stray invite demote an owner or admin.
    const { data: existingMember } = await admin
      .from('organization_members')
      .select('id')
      .eq('organization_id', invite.organization_id)
      .eq('user_id', userId)
      .maybeSingle()

    if (!existingMember) {
      const { error: memberError } = await admin.from('organization_members').insert({
        organization_id: invite.organization_id,
        user_id: userId,
        role: invite.role,
        is_owner: false
      })

      if (memberError) {
        console.error('Error inserting member:', memberError)
        return NextResponse.json({ error: 'Failed to join organization' }, { status: 500 })
      }
    }

    // Update the user's profile; set full_name only if currently empty
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single()

    const profileUpdate: {
      user_type: string
      consultant_organization_id: string
      full_name?: string
    } = {
      user_type: 'org_member',
      consultant_organization_id: invite.organization_id
    }

    if (!existingProfile?.full_name) {
      const fullName = `${invite.first_name} ${invite.last_name}`.trim()
      if (fullName) {
        profileUpdate.full_name = fullName
      }
    }

    const { error: profileError } = await admin
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userId)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    // Mark invitation accepted
    const { error: acceptError } = await admin
      .from('organization_member_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_user_id: userId
      })
      .eq('id', invite.id)

    if (acceptError) {
      console.error('Error marking invitation accepted:', acceptError)
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
