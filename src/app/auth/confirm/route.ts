import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Verifies email-link OTPs (invite, signup, recovery, magiclink) server-side using the
// token_hash flow recommended for @supabase/ssr. Unlike the PKCE `?code=` exchange, this works
// cross-device (the invitee can open the email on a different browser than the inviter), which is
// essential for the organization member invite emails sent via auth.admin.inviteUserByEmail.
//
// On success it sets the session cookies and redirects to `next` (an internal path only — the
// member invite points this at /signup/member/<token>). On failure it routes to the shared
// auth error page.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  // Only allow same-origin relative redirects — never an absolute or protocol-relative URL — so a
  // tampered invite link cannot turn this into an open redirect.
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

  if (tokenHash && type) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`)
    }
    console.error('Error verifying email OTP:', error.message)
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=verify_failed`)
}
