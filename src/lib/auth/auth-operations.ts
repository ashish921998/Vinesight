import {
  type AuthOperationDeps,
  type ResetPasswordParams,
  type ResendVerificationEmailParams,
  type ResendVerificationEmailResult,
  type ResetPasswordResult,
  type SendPhoneOtpParams,
  type SendPhoneOtpResult,
  type SignInWithEmailParams,
  type SignInWithEmailResult,
  type SignInWithGoogleParams,
  type SignInWithGoogleResult,
  type SignOutResult,
  type SignUpWithEmailParams,
  type SignUpWithEmailResult,
  type VerifyOtpParams,
  type VerifyOtpResult,
  type VerifyPhoneOtpParams,
  type VerifyPhoneOtpResult
} from './types'
import { composeFullNameMetadata, sanitizeAndValidateName } from './name-validator'
import { AUTH } from '../constants'

/**
 * Auth operations extracted from `useSupabaseAuth` as plain, dependency-injected
 * functions. Each accepts a `deps` object (a Supabase client, a `toast` seam, and
 * a `posthog` seam) and returns the exact result shape the hook returned before
 * extraction. They do NOT touch React state — the hook owns loading/error/user
 * state and derives it from these return values.
 *
 * Behavior is preserved bit-for-bit: the same Supabase calls, the same
 * success/error toasts, the same PostHog `identify`/`capture` calls, and the
 * same name validation/sanitization.
 */

function unexpectedErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'An unexpected error occurred'
}

export async function signInWithEmail(
  params: SignInWithEmailParams,
  deps: AuthOperationDeps
): Promise<SignInWithEmailResult> {
  const { supabase, toast } = deps
  const { email, password } = params

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      toast.error(`Login failed: ${error.message}`)
      return { success: false, error: error.message }
    }

    toast.success('Login successful!')
    return { success: true, user: data.user }
  } catch (err) {
    const errorMessage = unexpectedErrorMessage(err)
    toast.error(`Login failed: ${errorMessage}`)
    return { success: false, error: errorMessage }
  }
}

export async function signUpWithEmail(
  params: SignUpWithEmailParams,
  deps: AuthOperationDeps
): Promise<SignUpWithEmailResult> {
  const { supabase, toast } = deps
  const { email, password, confirmPassword, firstName, lastName } = params

  // Validate password confirmation if provided
  if (confirmPassword && password !== confirmPassword) {
    return { success: false, error: 'Passwords do not match' }
  }

  // Validate and sanitize name fields
  const userMetadata: Record<string, string> = {}

  const firstNameResult = sanitizeAndValidateName(firstName, 'First name')
  if (!firstNameResult.isValid) {
    const error = firstNameResult.error || 'Invalid first name'
    toast.error(error)
    return { success: false, error }
  }
  if (firstNameResult.value) {
    userMetadata.first_name = firstNameResult.value
  }

  const lastNameResult = sanitizeAndValidateName(lastName, 'Last name')
  if (!lastNameResult.isValid) {
    const error = lastNameResult.error || 'Invalid last name'
    toast.error(error)
    return { success: false, error }
  }
  if (lastNameResult.value) {
    userMetadata.last_name = lastNameResult.value
  }

  // Create full_name field for UI display
  const fullName = composeFullNameMetadata(userMetadata.first_name, userMetadata.last_name)
  if (fullName.full_name) {
    userMetadata.full_name = fullName.full_name
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: userMetadata
      }
    })

    if (error) {
      toast.error(`Sign up failed: ${error.message}`)
      return { success: false, error: error.message }
    }

    const needsOtpVerification = !data.user?.email_confirmed_at
    if (needsOtpVerification) {
      toast.success('Account created! Please check your email for the verification code.')
    } else {
      toast.success('Account created successfully!')
    }

    return {
      success: true,
      user: data.user,
      needsOtpVerification
    }
  } catch (err) {
    const errorMessage = unexpectedErrorMessage(err)
    toast.error(`Sign up failed: ${errorMessage}`)
    return { success: false, error: errorMessage }
  }
}

export async function verifyOtp(
  params: VerifyOtpParams,
  deps: AuthOperationDeps
): Promise<VerifyOtpResult> {
  const { supabase, toast, posthog } = deps
  const { email, token, otpType = 'email' } = params

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: otpType
    })

    if (error) {
      toast.error(`Verification failed: ${error.message}`)
      return { success: false, error: error.message }
    }

    toast.success('Email verified successfully!')

    // 'email' is the only otpType this app ever passes here (verify-otp page is signup-only).
    // Identity (PostHog `identify`, including email PII) is owned by the single
    // onAuthStateChange listener in AuthProvider — this operation fires only the
    // acquisition-funnel `capture`, keeping PII out of capture events.
    if (otpType === 'email') {
      posthog.capture('New user created', {
        user_id: data.user?.id,
        timestamp: new Date().toISOString()
      })
    }

    return { success: true, user: data.user }
  } catch (err) {
    const errorMessage = unexpectedErrorMessage(err)
    toast.error(`Verification failed: ${errorMessage}`)
    return { success: false, error: errorMessage }
  }
}

// Sends an SMS OTP to the given phone, creating the account if it doesn't exist. Names are
// attached as user metadata here because Supabase only applies it at user-creation time
// (this call) — the same full_name the handle_new_user trigger reads into profiles.
export async function sendPhoneOtp(
  params: SendPhoneOtpParams,
  deps: AuthOperationDeps
): Promise<SendPhoneOtpResult> {
  const { supabase, toast } = deps
  const { phone, firstName, lastName, shouldCreateUser = true } = params

  const userMetadata: Record<string, string> = {}

  const firstNameResult = sanitizeAndValidateName(firstName, 'First name')
  if (!firstNameResult.isValid) {
    const error = firstNameResult.error || 'Invalid first name'
    toast.error(error)
    return { success: false, error }
  }
  if (firstNameResult.value) userMetadata.first_name = firstNameResult.value

  const lastNameResult = sanitizeAndValidateName(lastName, 'Last name')
  if (!lastNameResult.isValid) {
    const error = lastNameResult.error || 'Invalid last name'
    toast.error(error)
    return { success: false, error }
  }
  if (lastNameResult.value) userMetadata.last_name = lastNameResult.value

  const fullName = composeFullNameMetadata(userMetadata.first_name, userMetadata.last_name)
  if (fullName.full_name) {
    userMetadata.full_name = fullName.full_name
  }

  try {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: { channel: 'sms', shouldCreateUser, data: userMetadata }
    })

    if (error) {
      toast.error(`Couldn't send code: ${error.message}`)
      return { success: false, error: error.message }
    }

    toast.success('Verification code sent')
    return { success: true }
  } catch (err) {
    const errorMessage = unexpectedErrorMessage(err)
    toast.error(`Couldn't send code: ${errorMessage}`)
    return { success: false, error: errorMessage }
  }
}

// Verifies the SMS OTP. On success the user has a confirmed phone and an active session
// (cookie-based), which the invite/accept route reads to prove phone ownership.
export async function verifyPhoneOtp(
  params: VerifyPhoneOtpParams,
  deps: AuthOperationDeps
): Promise<VerifyPhoneOtpResult> {
  const { supabase, toast, posthog } = deps
  const { phone, token } = params

  try {
    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' })

    if (error) {
      toast.error(`Verification failed: ${error.message}`)
      return { success: false, error: error.message }
    }

    toast.success('Phone verified')

    // Phone-OTP verify is the acquisition funnel for the consultant-invite feature: fire
    // 'New user created' for genuinely new accounts (created within the last couple of
    // minutes), mirroring the email verify path. Identity (PostHog `identify`, including
    // phone PII) is owned by the single onAuthStateChange listener in AuthProvider, so the
    // capture event is the only analytics call left here — PII stays out of captures.
    if (data.user) {
      const createdMs = data.user.created_at ? new Date(data.user.created_at).getTime() : 0
      if (createdMs && Date.now() - createdMs < AUTH.NEW_USER_THRESHOLD_MS) {
        posthog.capture('New user created', {
          user_id: data.user.id,
          timestamp: new Date().toISOString()
        })
      }
    }

    return { success: true, user: data.user }
  } catch (err) {
    const errorMessage = unexpectedErrorMessage(err)
    toast.error(`Verification failed: ${errorMessage}`)
    return { success: false, error: errorMessage }
  }
}

export async function resendVerificationEmail(
  params: ResendVerificationEmailParams,
  deps: AuthOperationDeps
): Promise<ResendVerificationEmailResult> {
  const { supabase } = deps
  const { email } = params

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, message: 'Verification code resent successfully' }
  } catch (err) {
    return { success: false, error: unexpectedErrorMessage(err) }
  }
}

export async function resetPassword(
  params: ResetPasswordParams,
  deps: AuthOperationDeps
): Promise<ResetPasswordResult> {
  const { supabase, toast } = deps
  const { email } = params

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (error) {
      toast.error(`Password reset failed: ${error.message}`)
      return { success: false, error: error.message }
    }

    toast.success('Password reset email sent! Please check your inbox.')
    return { success: true, message: 'Password reset email sent' }
  } catch (err) {
    const errorMessage = unexpectedErrorMessage(err)
    toast.error(`Password reset failed: ${errorMessage}`)
    return { success: false, error: errorMessage }
  }
}

export async function signInWithGoogle(
  params: SignInWithGoogleParams,
  deps: AuthOperationDeps
): Promise<SignInWithGoogleResult> {
  const { supabase, toast } = deps
  const { redirectTo = `${window.location.origin}/auth/callback` } = params

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'online',
          prompt: 'consent'
        }
      }
    })

    if (error) {
      toast.error(`Google sign in failed: ${error.message}`)
      return { success: false, error: error.message }
    }

    // The user will be redirected to the OAuth provider; we don't set the user here.
    return { success: true }
  } catch (err) {
    const errorMessage = unexpectedErrorMessage(err)
    toast.error(`Google sign in failed: ${errorMessage}`)
    return { success: false, error: errorMessage }
  }
}

export async function signOut(deps: AuthOperationDeps): Promise<SignOutResult> {
  const { supabase, toast } = deps

  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error(`Sign out failed: ${error.message}`)
      return { success: false, error: error.message }
    }

    toast.success('Signed out successfully')
    return { success: true }
  } catch (err) {
    const errorMessage = unexpectedErrorMessage(err)
    toast.error(`Sign out failed: ${errorMessage}`)
    return { success: false, error: errorMessage }
  }
}
