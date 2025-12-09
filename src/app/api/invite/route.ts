import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Resend } from 'resend'
import type { Database } from '@/types/database'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { organizationId, organizationName, farmerName, farmerEmail, signupLink } =
      await request.json()

    // P2: Validate required fields including organizationName
    if (!organizationId || !organizationName || !farmerName || !farmerEmail || !signupLink) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // Server-side, we don't set cookies
          }
        }
      }
    )

    // Verify user is authenticated and is an org member
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a member of the organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not authorized for this organization' }, { status: 403 })
    }

    // Create invitation record
    const { data: invitation, error: invError } = await supabase
      .from('farmer_invitations')
      .insert({
        organization_id: organizationId,
        token: crypto.randomUUID(),
        status: 'pending'
      })
      .select()
      .single()

    if (invError) {
      console.error('Error creating invitation:', invError)
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }

    // Send email using Resend
    // Validate email configuration
    const fromEmail = process.env.RESEND_FROM_EMAIL
    if (!fromEmail) {
      console.error('RESEND_FROM_EMAIL not configured')
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: farmerEmail,
      subject: `${organizationName} invites you to VineSight`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h1 style="color: #18181b; font-size: 24px; margin: 0 0 16px 0;">
                Hello ${farmerName}! 👋
              </h1>
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                <strong>${organizationName}</strong> has invited you to join VineSight, a platform to manage your farm operations and get expert consultation.
              </p>
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                Click the button below to create your account and connect with your consultant:
              </p>
              <div style="text-align: center; margin: 0 0 32px 0;">
                <a href="${signupLink}" style="display: inline-block; background-color: #16a34a; color: white; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  Create Your Account
                </a>
              </div>
              <p style="color: #71717a; font-size: 14px; line-height: 1.5; margin: 0;">
                Or copy this link into your browser:<br>
                <a href="${signupLink}" style="color: #16a34a; word-break: break-all;">${signupLink}</a>
              </p>
            </div>
            <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 24px 0 0 0;">
              © ${new Date().getFullYear()} VineSight. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `
    })

    if (emailError) {
      console.error('Error sending email:', emailError)
      // P2: Update invitation status to 'failed' (not 'expired' which is misleading)
      await supabase.from('farmer_invitations').update({ status: 'failed' }).eq('id', invitation.id)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent',
      invitationId: invitation.id
    })
  } catch (error) {
    console.error('Error in invite API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
