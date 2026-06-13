import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Resend } from 'resend'
import type { Database } from '@/types/database'

// TypeScript interface for request body
interface InviteRequest {
  organizationId: string
  organizationName: string
  farmerName: string
  farmerEmail: string
}

// HTML escape utility to prevent XSS/HTML injection
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Invitation TTL in days
const INVITATION_TTL_DAYS = 7

// Lazy initialization to avoid build-time errors
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }
  return new Resend(apiKey)
}

// TODO: Consider implementing rate limiting per user/organization to prevent abuse
// Options: @upstash/ratelimit with Redis, or application-level tracking

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as InviteRequest
    const { organizationId, organizationName, farmerName, farmerEmail } = body

    // Validate required fields
    if (!organizationId || !organizationName || !farmerName || !farmerEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate email format
    if (!EMAIL_REGEX.test(farmerEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // NEXT_PUBLIC_APP_URL must be configured so we can build a token-bound signup link
    // (/signup/invite/<token>) on our own domain. This mirrors the phone-invite flow
    // (/api/invite/create) and ensures the farmer is auto-linked to the org on signup.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      console.error('NEXT_PUBLIC_APP_URL is not configured')
      return NextResponse.json(
        { error: 'Server misconfiguration: NEXT_PUBLIC_APP_URL not set' },
        { status: 500 }
      )
    }

    // Escape HTML in user-provided values for HTML body (prevents XSS)
    const safeFarmerName = escapeHtml(farmerName)
    const safeOrgName = escapeHtml(organizationName)

    // Validate Supabase environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Create Supabase client
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

    // Verify user is authenticated
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a member of the organization with appropriate role
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('id, role, is_owner')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (membershipError && membershipError.code !== 'PGRST116') {
      console.error('Error checking membership:', membershipError)
      return NextResponse.json({ error: 'Failed to verify permissions' }, { status: 500 })
    }

    if (!membership) {
      return NextResponse.json({ error: 'Not authorized for this organization' }, { status: 403 })
    }

    // Verify user has admin/owner role to send invitations
    if (!membership.is_owner && membership.role !== 'owner' && membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions: Only admins and owners can send invitations' },
        { status: 403 }
      )
    }

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + INVITATION_TTL_DAYS)

    // Token-bound signup link. On signup, /signup/invite/[token] -> /api/invite/accept
    // binds the farmer to this organization, assigned to whoever sent the invite.
    const token = crypto.randomUUID()

    // Create invitation record with expiration
    const { data: invitation, error: invError } = await supabase
      .from('farmer_invitations')
      .insert({
        organization_id: organizationId,
        token,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        farmer_name: farmerName.trim() || null,
        invited_by: user.id
      })
      .select()
      .single()

    if (invError) {
      console.error('Error creating invitation:', invError)
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }

    // Validate email configuration
    const fromEmail = process.env.RESEND_FROM_EMAIL
    if (!fromEmail) {
      console.error('RESEND_FROM_EMAIL not configured')
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    // Build the token-bound signup link on our own domain (escaped for the HTML body).
    const inviteUrl = `${appUrl.replace(/\/$/, '')}/signup/invite/${token}`
    const safeSignupLink = escapeHtml(inviteUrl)

    // Send email using Resend
    // Use raw organizationName for subject (plain text), escaped values for HTML body
    const resend = getResendClient()
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
                Hello ${safeFarmerName}! 👋
              </h1>
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                <strong>${safeOrgName}</strong> has invited you to join VineSight, a platform to manage your farm operations and get expert consultation.
              </p>
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                Click the button below to create your account and connect with your consultant:
              </p>
              <div style="text-align: center; margin: 0 0 32px 0;">
                <a href="${safeSignupLink}" style="display: inline-block; background-color: #16a34a; color: white; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  Create Your Account
                </a>
              </div>
              <p style="color: #71717a; font-size: 14px; line-height: 1.5; margin: 0;">
                Or copy this link into your browser:<br>
                <a href="${safeSignupLink}" style="color: #16a34a; word-break: break-all;">${safeSignupLink}</a>
              </p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 24px 0 0 0;">
                This invitation expires in ${INVITATION_TTL_DAYS} days.
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
      // Update invitation status to 'failed'
      await supabase.from('farmer_invitations').update({ status: 'failed' }).eq('id', invitation.id)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent',
      invitationId: invitation.id,
      token,
      inviteUrl,
      expiresAt: expiresAt.toISOString()
    })
  } catch (error) {
    console.error('Error in invite API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
