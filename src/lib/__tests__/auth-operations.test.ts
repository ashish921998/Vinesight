import { describe, it, expect, vi } from 'vitest'
import {
  signInWithEmail,
  signUpWithEmail,
  verifyOtp,
  sendPhoneOtp,
  verifyPhoneOtp,
  signInWithGoogle,
  resendVerificationEmail,
  resetPassword,
  signOut
} from '../auth/auth-operations'
import type { AuthOperationDeps, PosthogSeam, SupabaseAuthClient } from '../auth/types'
import type { User } from '@supabase/supabase-js'

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'user@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    ...overrides
  } as unknown as User
}

interface DepsKit {
  deps: AuthOperationDeps
  supabaseAuth: Record<string, ReturnType<typeof vi.fn>>
  toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> }
  posthog: PosthogSeam & {
    identify: ReturnType<typeof vi.fn>
    capture: ReturnType<typeof vi.fn>
    get_distinct_id: ReturnType<typeof vi.fn>
    reset: ReturnType<typeof vi.fn>
  }
}

function buildDeps(auth: Record<string, any> = {}): DepsKit {
  const supabaseAuth: Record<string, ReturnType<typeof vi.fn>> = { ...auth }
  const success = vi.fn()
  const error = vi.fn()
  const toast = { success, error }
  const identify = vi.fn()
  const capture = vi.fn()
  const get_distinct_id = vi.fn().mockReturnValue('anon')
  const reset = vi.fn()
  const setPersonProperties = vi.fn()
  const posthog: DepsKit['posthog'] = {
    identify,
    capture,
    get_distinct_id,
    reset,
    setPersonProperties
  }
  const deps: AuthOperationDeps = {
    supabase: { auth: supabaseAuth } as unknown as SupabaseAuthClient,
    toast,
    posthog
  }
  return { deps, supabaseAuth, toast, posthog }
}

describe('signInWithEmail', () => {
  it('succeeds, toasts success, and returns the user', async () => {
    const user = makeUser({ id: 'u-signin' })
    const kit = buildDeps({
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user }, error: null })
    })

    const result = await signInWithEmail({ email: 'a@b.com', password: 'pw' }, kit.deps)

    expect(result).toEqual({ success: true, user })
    expect(kit.supabaseAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'pw'
    })
    expect(kit.toast.success).toHaveBeenCalledWith('Login successful!')
    expect(kit.toast.error).not.toHaveBeenCalled()
  })

  it('returns an error and toasts on a Supabase error', async () => {
    const kit = buildDeps({
      signInWithPassword: vi.fn().mockResolvedValue({
        data: {},
        error: { message: 'Invalid login credentials' }
      })
    })

    const result = await signInWithEmail({ email: 'a@b.com', password: 'pw' }, kit.deps)

    expect(result).toEqual({ success: false, error: 'Invalid login credentials' })
    expect(kit.toast.error).toHaveBeenCalledWith('Login failed: Invalid login credentials')
    expect(kit.toast.success).not.toHaveBeenCalled()
  })

  it('returns an error and toasts when the call throws', async () => {
    const kit = buildDeps({
      signInWithPassword: vi.fn().mockRejectedValue(new Error('network down'))
    })

    const result = await signInWithEmail({ email: 'a@b.com', password: 'pw' }, kit.deps)

    expect(result).toEqual({ success: false, error: 'network down' })
    expect(kit.toast.error).toHaveBeenCalledWith('Login failed: network down')
  })
})

describe('signUpWithEmail', () => {
  it('succeeds, toasts the OTP prompt, and returns needsOtpVerification=true for an unconfirmed email', async () => {
    const user = makeUser({ email_confirmed_at: undefined as unknown as string })
    const kit = buildDeps({ signUp: vi.fn().mockResolvedValue({ data: { user }, error: null }) })

    const result = await signUpWithEmail({ email: 'A@B.com', password: 'pw' }, kit.deps)

    expect(result).toEqual({ success: true, user, needsOtpVerification: true })
    expect(kit.toast.success).toHaveBeenCalledWith(
      'Account created! Please check your email for the verification code.'
    )
    expect(kit.supabaseAuth.signUp).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'pw',
      options: { emailRedirectTo: `${window.location.origin}/auth/callback`, data: {} }
    })
  })

  it('toasts a plain success when the email is already confirmed', async () => {
    const user = makeUser({ email_confirmed_at: '2025-01-01' as unknown as string })
    const kit = buildDeps({ signUp: vi.fn().mockResolvedValue({ data: { user }, error: null }) })

    const result = await signUpWithEmail({ email: 'a@b.com', password: 'pw' }, kit.deps)

    expect(result).toEqual({ success: true, user, needsOtpVerification: false })
    expect(kit.toast.success).toHaveBeenCalledWith('Account created successfully!')
  })

  it('gates on password confirmation mismatch without calling signUp or toasting', async () => {
    const kit = buildDeps({ signUp: vi.fn() })

    const result = await signUpWithEmail(
      { email: 'a@b.com', password: 'pw', confirmPassword: 'different' },
      kit.deps
    )

    expect(result).toEqual({ success: false, error: 'Passwords do not match' })
    expect(kit.supabaseAuth.signUp).not.toHaveBeenCalled()
    expect(kit.toast.error).not.toHaveBeenCalled()
  })

  it('treats an explicit empty-string confirmPassword as a mismatch', async () => {
    const kit = buildDeps({ signUp: vi.fn() })

    const result = await signUpWithEmail(
      { email: 'a@b.com', password: 'pw', confirmPassword: '' },
      kit.deps
    )

    expect(result).toEqual({ success: false, error: 'Passwords do not match' })
    expect(kit.supabaseAuth.signUp).not.toHaveBeenCalled()
    expect(kit.toast.error).not.toHaveBeenCalled()
  })

  it('gates on an invalid name, toasts the error, and does not call signUp', async () => {
    const kit = buildDeps({ signUp: vi.fn() })

    const result = await signUpWithEmail(
      { email: 'a@b.com', password: 'pw', firstName: '   ' },
      kit.deps
    )

    expect(result.success).toBe(false)
    expect(kit.supabaseAuth.signUp).not.toHaveBeenCalled()
    expect(kit.toast.error).toHaveBeenCalledTimes(1)
    expect(kit.toast.error).toHaveBeenCalledWith(expect.stringMatching(/First name/))
  })

  it('sanitizes names and composes full_name metadata into the signUp call', async () => {
    const user = makeUser()
    const kit = buildDeps({ signUp: vi.fn().mockResolvedValue({ data: { user }, error: null }) })

    await signUpWithEmail(
      { email: 'a@b.com', password: 'pw', firstName: '  Ashish  Kumar ', lastName: 'Huddar' },
      kit.deps
    )

    expect(kit.supabaseAuth.signUp).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'pw',
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { first_name: 'Ashish Kumar', last_name: 'Huddar', full_name: 'Ashish Kumar Huddar' }
      }
    })
  })

  it('returns an error and toasts on a Supabase error', async () => {
    const kit = buildDeps({
      signUp: vi.fn().mockResolvedValue({ data: {}, error: { message: 'User already registered' } })
    })

    const result = await signUpWithEmail({ email: 'a@b.com', password: 'pw' }, kit.deps)

    expect(result).toEqual({ success: false, error: 'User already registered' })
    expect(kit.toast.error).toHaveBeenCalledWith('Sign up failed: User already registered')
  })

  it('returns an error and toasts when the call throws', async () => {
    const kit = buildDeps({ signUp: vi.fn().mockRejectedValue(new Error('boom')) })

    const result = await signUpWithEmail({ email: 'a@b.com', password: 'pw' }, kit.deps)

    expect(result).toEqual({ success: false, error: 'boom' })
    expect(kit.toast.error).toHaveBeenCalledWith('Sign up failed: boom')
  })
})

describe('verifyOtp (email)', () => {
  it('succeeds, toasts, and fires "New user created" once for email (identity left to the listener)', async () => {
    const user = makeUser({ id: 'u-verify', email: 'a@b.com' })
    const kit = buildDeps({ verifyOtp: vi.fn().mockResolvedValue({ data: { user }, error: null }) })

    const result = await verifyOtp({ email: 'a@b.com', token: '123456' }, kit.deps)

    expect(result).toEqual({ success: true, user })
    expect(kit.toast.success).toHaveBeenCalledWith('Email verified successfully!')
    expect(kit.posthog.identify).not.toHaveBeenCalled()
    expect(kit.posthog.capture).toHaveBeenCalledWith('New user created', {
      user_id: 'u-verify',
      timestamp: expect.any(String)
    })
    expect(kit.posthog.capture).toHaveBeenCalledTimes(1)
  })

  it('does not capture "New user created" for a non-email otpType', async () => {
    const user = makeUser()
    const kit = buildDeps({ verifyOtp: vi.fn().mockResolvedValue({ data: { user }, error: null }) })

    const result = await verifyOtp(
      { email: 'a@b.com', token: '123456', otpType: 'recovery' },
      kit.deps
    )

    expect(result.success).toBe(true)
    expect(kit.posthog.capture).not.toHaveBeenCalled()
    expect(kit.posthog.identify).not.toHaveBeenCalled()
  })

  it('returns an error and toasts on a Supabase error', async () => {
    const kit = buildDeps({
      verifyOtp: vi.fn().mockResolvedValue({ data: {}, error: { message: 'Token expired' } })
    })

    const result = await verifyOtp({ email: 'a@b.com', token: '123456' }, kit.deps)

    expect(result).toEqual({ success: false, error: 'Token expired' })
    expect(kit.toast.error).toHaveBeenCalledWith('Verification failed: Token expired')
    expect(kit.posthog.capture).not.toHaveBeenCalled()
  })

  it('returns an error and toasts when the call throws', async () => {
    const kit = buildDeps({ verifyOtp: vi.fn().mockRejectedValue(new Error('boom')) })

    const result = await verifyOtp({ email: 'a@b.com', token: '123456' }, kit.deps)

    expect(result).toEqual({ success: false, error: 'boom' })
    expect(kit.toast.error).toHaveBeenCalledWith('Verification failed: boom')
  })
})

describe('sendPhoneOtp', () => {
  it('succeeds, toasts, and defaults shouldCreateUser to true', async () => {
    const kit = buildDeps({ signInWithOtp: vi.fn().mockResolvedValue({ error: null }) })

    const result = await sendPhoneOtp({ phone: '+919876543210' }, kit.deps)

    expect(result).toEqual({ success: true })
    expect(kit.toast.success).toHaveBeenCalledWith('Verification code sent')
    expect(kit.supabaseAuth.signInWithOtp).toHaveBeenCalledWith({
      phone: '+919876543210',
      options: { channel: 'sms', shouldCreateUser: true, data: {} }
    })
  })

  it('passes shouldCreateUser=false through to the client', async () => {
    const kit = buildDeps({ signInWithOtp: vi.fn().mockResolvedValue({ error: null }) })

    await sendPhoneOtp({ phone: '+919876543210', shouldCreateUser: false }, kit.deps)

    expect(kit.supabaseAuth.signInWithOtp).toHaveBeenCalledWith({
      phone: '+919876543210',
      options: { channel: 'sms', shouldCreateUser: false, data: {} }
    })
  })

  it('sanitizes names and composes full_name metadata', async () => {
    const kit = buildDeps({ signInWithOtp: vi.fn().mockResolvedValue({ error: null }) })

    await sendPhoneOtp(
      { phone: '+919876543210', firstName: ' Riya  ', lastName: 'Sharma' },
      kit.deps
    )

    expect(kit.supabaseAuth.signInWithOtp).toHaveBeenCalledWith({
      phone: '+919876543210',
      options: {
        channel: 'sms',
        shouldCreateUser: true,
        data: { first_name: 'Riya', last_name: 'Sharma', full_name: 'Riya Sharma' }
      }
    })
  })

  it('gates on an invalid name, toasts, and does not call the client', async () => {
    const kit = buildDeps({ signInWithOtp: vi.fn() })

    const result = await sendPhoneOtp(
      { phone: '+919876543210', lastName: 'A'.repeat(51) },
      kit.deps
    )

    expect(result.success).toBe(false)
    expect(kit.supabaseAuth.signInWithOtp).not.toHaveBeenCalled()
    expect(kit.toast.error).toHaveBeenCalledWith(expect.stringMatching(/Last name/))
  })

  it('returns an error and toasts on a Supabase error', async () => {
    const kit = buildDeps({
      signInWithOtp: vi.fn().mockResolvedValue({ error: { message: 'Rate limited' } })
    })

    const result = await sendPhoneOtp({ phone: '+919876543210' }, kit.deps)

    expect(result).toEqual({ success: false, error: 'Rate limited' })
    expect(kit.toast.error).toHaveBeenCalledWith("Couldn't send code: Rate limited")
  })

  it('returns an error and toasts when the call throws', async () => {
    const kit = buildDeps({ signInWithOtp: vi.fn().mockRejectedValue(new Error('boom')) })

    const result = await sendPhoneOtp({ phone: '+919876543210' }, kit.deps)

    expect(result).toEqual({ success: false, error: 'boom' })
    expect(kit.toast.error).toHaveBeenCalledWith("Couldn't send code: boom")
  })

  it('translates the sign-in-only "Signups not allowed" error to a no-account message', async () => {
    const kit = buildDeps({
      signInWithOtp: vi.fn().mockResolvedValue({
        error: { message: 'Signups not allowed for otp', code: 'otp_disabled' }
      })
    })

    const result = await sendPhoneOtp({ phone: '+919876543210', shouldCreateUser: false }, kit.deps)

    expect(result).toEqual({
      success: false,
      error: expect.stringMatching(/No account found for this number/)
    })
    expect(kit.toast.error).toHaveBeenCalledWith(
      expect.stringMatching(/No account found for this number/)
    )
  })

  it('does NOT translate the error for the invite flow (shouldCreateUser defaults to true)', async () => {
    const kit = buildDeps({
      signInWithOtp: vi.fn().mockResolvedValue({
        error: { message: 'Signups not allowed for otp', code: 'otp_disabled' }
      })
    })

    // No shouldCreateUser → defaults to true (the invite flow). The no-account
    // translation must stay off so invited farmers still see the raw error.
    const result = await sendPhoneOtp({ phone: '+919876543210' }, kit.deps)

    expect(result).toEqual({ success: false, error: 'Signups not allowed for otp' })
    expect(kit.toast.error).toHaveBeenCalledWith("Couldn't send code: Signups not allowed for otp")
  })

  it('translates via the message regex even when the error code is absent', async () => {
    const kit = buildDeps({
      signInWithOtp: vi.fn().mockResolvedValue({
        error: { message: 'Signups not allowed for otp' }
      })
    })

    const result = await sendPhoneOtp({ phone: '+919876543210', shouldCreateUser: false }, kit.deps)

    expect(result).toEqual({
      success: false,
      error: expect.stringMatching(/No account found for this number/)
    })
  })

  it('translates via the error code even when the message does not match the regex', async () => {
    const kit = buildDeps({
      signInWithOtp: vi.fn().mockResolvedValue({
        error: { message: 'otp is disabled', code: 'otp_disabled' }
      })
    })

    const result = await sendPhoneOtp({ phone: '+919876543210', shouldCreateUser: false }, kit.deps)

    expect(result).toEqual({
      success: false,
      error: expect.stringMatching(/No account found for this number/)
    })
  })

  it('does NOT translate when sign-in only and neither code nor message matches', async () => {
    const kit = buildDeps({
      signInWithOtp: vi.fn().mockResolvedValue({
        error: { message: 'Rate limited', code: 'rate_limit' }
      })
    })

    const result = await sendPhoneOtp({ phone: '+919876543210', shouldCreateUser: false }, kit.deps)

    expect(result).toEqual({ success: false, error: 'Rate limited' })
    expect(kit.toast.error).toHaveBeenCalledWith("Couldn't send code: Rate limited")
  })
})

describe('verifyPhoneOtp', () => {
  it('succeeds and captures "New user created" once for a genuinely new account (identity left to the listener)', async () => {
    const user = makeUser({
      id: 'u-phone',
      phone: '+919876543210',
      created_at: new Date(Date.now() - 60_000).toISOString() // 1 minute ago
    })
    const kit = buildDeps({ verifyOtp: vi.fn().mockResolvedValue({ data: { user }, error: null }) })

    const result = await verifyPhoneOtp({ phone: '+919876543210', token: '123456' }, kit.deps)

    expect(result).toEqual({ success: true, user })
    expect(kit.toast.success).toHaveBeenCalledWith('Phone verified')
    expect(kit.posthog.identify).not.toHaveBeenCalled()
    expect(kit.posthog.capture).toHaveBeenCalledTimes(1)
    expect(kit.posthog.capture).toHaveBeenCalledWith('New user created', {
      user_id: 'u-phone',
      timestamp: expect.any(String)
    })
  })

  it('does NOT capture "New user created" for an existing account', async () => {
    const user = makeUser({
      id: 'u-phone',
      phone: '+919876543210',
      created_at: new Date(Date.now() - 60 * 60_000).toISOString() // 1 hour ago
    })
    const kit = buildDeps({ verifyOtp: vi.fn().mockResolvedValue({ data: { user }, error: null }) })

    const result = await verifyPhoneOtp({ phone: '+919876543210', token: '123456' }, kit.deps)

    expect(result).toEqual({ success: true, user })
    expect(kit.posthog.identify).not.toHaveBeenCalled()
    expect(kit.posthog.capture).not.toHaveBeenCalled()
  })

  it('returns an error and toasts on a Supabase error', async () => {
    const kit = buildDeps({
      verifyOtp: vi.fn().mockResolvedValue({ data: {}, error: { message: 'Invalid otp' } })
    })

    const result = await verifyPhoneOtp({ phone: '+919876543210', token: '123456' }, kit.deps)

    expect(result).toEqual({ success: false, error: 'Invalid otp' })
    expect(kit.toast.error).toHaveBeenCalledWith('Verification failed: Invalid otp')
    expect(kit.posthog.identify).not.toHaveBeenCalled()
    expect(kit.posthog.capture).not.toHaveBeenCalled()
  })

  it('returns an error and toasts when the call throws', async () => {
    const kit = buildDeps({ verifyOtp: vi.fn().mockRejectedValue(new Error('boom')) })

    const result = await verifyPhoneOtp({ phone: '+919876543210', token: '123456' }, kit.deps)

    expect(result).toEqual({ success: false, error: 'boom' })
    expect(kit.toast.error).toHaveBeenCalledWith('Verification failed: boom')
  })
})

describe('signInWithGoogle', () => {
  it('succeeds without a toast and calls OAuth with the google provider', async () => {
    const kit = buildDeps({ signInWithOAuth: vi.fn().mockResolvedValue({ error: null }) })

    const result = await signInWithGoogle({ redirectTo: 'https://host/cb' }, kit.deps)

    expect(result).toEqual({ success: true })
    expect(kit.supabaseAuth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'https://host/cb',
        queryParams: { access_type: 'online', prompt: 'consent' }
      }
    })
    expect(kit.toast.success).not.toHaveBeenCalled()
    expect(kit.toast.error).not.toHaveBeenCalled()
  })

  it('returns an error and toasts on a Supabase error', async () => {
    const kit = buildDeps({
      signInWithOAuth: vi.fn().mockResolvedValue({ error: { message: 'No provider' } })
    })

    const result = await signInWithGoogle({}, kit.deps)

    expect(result).toEqual({ success: false, error: 'No provider' })
    expect(kit.toast.error).toHaveBeenCalledWith('Google sign in failed: No provider')
  })

  it('returns an error and toasts when the call throws', async () => {
    const kit = buildDeps({ signInWithOAuth: vi.fn().mockRejectedValue(new Error('boom')) })

    const result = await signInWithGoogle({}, kit.deps)

    expect(result).toEqual({ success: false, error: 'boom' })
    expect(kit.toast.error).toHaveBeenCalledWith('Google sign in failed: boom')
  })
})

describe('resendVerificationEmail', () => {
  it('succeeds with a message and no toast', async () => {
    const kit = buildDeps({ resend: vi.fn().mockResolvedValue({ error: null }) })

    const result = await resendVerificationEmail({ email: 'A@B.com' }, kit.deps)

    expect(result).toEqual({ success: true, message: 'Verification code resent successfully' })
    expect(kit.supabaseAuth.resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'a@b.com',
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    })
    expect(kit.toast.success).not.toHaveBeenCalled()
    expect(kit.toast.error).not.toHaveBeenCalled()
  })

  it('returns an error and no toast on a Supabase error', async () => {
    const kit = buildDeps({ resend: vi.fn().mockResolvedValue({ error: { message: 'Too many' } }) })

    const result = await resendVerificationEmail({ email: 'a@b.com' }, kit.deps)

    expect(result).toEqual({ success: false, error: 'Too many' })
    expect(kit.toast.error).not.toHaveBeenCalled()
  })

  it('returns an error when the call throws', async () => {
    const kit = buildDeps({ resend: vi.fn().mockRejectedValue(new Error('boom')) })

    const result = await resendVerificationEmail({ email: 'a@b.com' }, kit.deps)

    expect(result).toEqual({ success: false, error: 'boom' })
  })
})

describe('resetPassword', () => {
  it('succeeds, toasts success, and returns the message', async () => {
    const kit = buildDeps({
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null })
    })

    const result = await resetPassword({ email: 'a@b.com' }, kit.deps)

    expect(result).toEqual({ success: true, message: 'Password reset email sent' })
    expect(kit.toast.success).toHaveBeenCalledWith(
      'Password reset email sent! Please check your inbox.'
    )
    expect(kit.supabaseAuth.resetPasswordForEmail).toHaveBeenCalledWith('a@b.com', {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
  })

  it('returns an error and toasts on a Supabase error', async () => {
    const kit = buildDeps({
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: { message: 'No user' } })
    })

    const result = await resetPassword({ email: 'a@b.com' }, kit.deps)

    expect(result).toEqual({ success: false, error: 'No user' })
    expect(kit.toast.error).toHaveBeenCalledWith('Password reset failed: No user')
  })

  it('returns an error and toasts when the call throws', async () => {
    const kit = buildDeps({
      resetPasswordForEmail: vi.fn().mockRejectedValue(new Error('boom'))
    })

    const result = await resetPassword({ email: 'a@b.com' }, kit.deps)

    expect(result).toEqual({ success: false, error: 'boom' })
    expect(kit.toast.error).toHaveBeenCalledWith('Password reset failed: boom')
  })
})

describe('signOut', () => {
  it('succeeds, toasts, and calls supabase.auth.signOut', async () => {
    const kit = buildDeps({ signOut: vi.fn().mockResolvedValue({}) })

    const result = await signOut(kit.deps)

    expect(result).toEqual({ success: true })
    expect(kit.supabaseAuth.signOut).toHaveBeenCalledTimes(1)
    expect(kit.toast.success).toHaveBeenCalledWith('Signed out successfully')
  })

  it('returns an error and toasts when the call throws', async () => {
    const kit = buildDeps({ signOut: vi.fn().mockRejectedValue(new Error('boom')) })

    const result = await signOut(kit.deps)

    expect(result).toEqual({ success: false, error: 'boom' })
    expect(kit.toast.error).toHaveBeenCalledWith('Sign out failed: boom')
  })
})
