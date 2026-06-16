'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { clearLastRoute } from '@/lib/route-persistence'
import posthog from 'posthog-js'
import {
  type AuthState,
  type ResetPasswordParams,
  type SendPhoneOtpParams,
  type SignInWithEmailParams,
  type SignInWithGoogleParams,
  type SignUpWithEmailParams,
  type VerifyOtpParams,
  type VerifyPhoneOtpParams,
  reduceAuthStateChange,
  resolveInitialUser,
  signInWithEmail as performSignInWithEmail,
  signInWithGoogle as performSignInWithGoogle,
  resendVerificationEmail as performResendVerificationEmail,
  resetPassword as performResetPassword,
  sendPhoneOtp as performSendPhoneOtp,
  signOut as performSignOut,
  signUpWithEmail as performSignUpWithEmail,
  verifyOtp as performVerifyOtp,
  verifyPhoneOtp as performVerifyPhoneOtp
} from '@/lib/auth'

type AuthOperationResult = { success: true; user?: User | null } | { success: false; error: string }
type ApplyMode = 'setUser' | 'keepUser' | 'resetUser'

/**
 * Maps an auth-operation result onto React state. The extracted operations own
 * the Supabase calls, validation, toasts, and PostHog events; this thin glue
 * owns only the loading/error/user state transitions, derived from the result
 * shape — preserving the exact behavior of the pre-extraction hook.
 */
function applyResult<T extends AuthOperationResult>(
  result: T,
  mode: ApplyMode,
  setAuthState: (updater: (prev: AuthState) => AuthState) => void
): T {
  if (!result.success) {
    const error = result.error
    setAuthState((prev) => ({ ...prev, error, loading: false }))
    return result
  }

  if (mode === 'resetUser') {
    setAuthState(() => ({ user: null, loading: false, error: null }))
  } else if (mode === 'setUser') {
    const user = result.user ?? null
    setAuthState((prev) => ({ ...prev, user, loading: false }))
  } else {
    setAuthState((prev) => ({ ...prev, loading: false }))
  }

  return result
}

export function useSupabaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    const supabase = createClient()

    const getInitialUser = async () => {
      try {
        const { user, error } = await resolveInitialUser({ supabase, posthog })
        if (error) {
          setAuthState((prev) => ({ ...prev, error }))
        } else {
          setAuthState((prev) => ({ ...prev, user }))
        }
      } finally {
        setAuthState((prev) => ({ ...prev, loading: false }))
      }
    }

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Only update the user state, don't change loading state here
      // to avoid interfering with the loading states from auth operations
      const { user } = reduceAuthStateChange(event, session, { posthog })
      setAuthState((prev) => ({
        ...prev,
        user
      }))
    })

    getInitialUser()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signInWithEmail = async (params: SignInWithEmailParams) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }))
    const result = await performSignInWithEmail(params, {
      supabase: createClient(),
      toast,
      posthog
    })
    return applyResult(result, 'setUser', setAuthState)
  }

  const signUpWithEmail = async (params: SignUpWithEmailParams) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }))
    const result = await performSignUpWithEmail(params, {
      supabase: createClient(),
      toast,
      posthog
    })
    return applyResult(result, 'setUser', setAuthState)
  }

  const verifyOtp = async (params: VerifyOtpParams) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }))
    const result = await performVerifyOtp(params, { supabase: createClient(), toast, posthog })
    return applyResult(result, 'setUser', setAuthState)
  }

  const sendPhoneOtp = async (params: SendPhoneOtpParams) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }))
    const result = await performSendPhoneOtp(params, { supabase: createClient(), toast, posthog })
    return applyResult(result, 'keepUser', setAuthState)
  }

  const verifyPhoneOtp = async (params: VerifyPhoneOtpParams) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }))
    const result = await performVerifyPhoneOtp(params, { supabase: createClient(), toast, posthog })
    return applyResult(result, 'setUser', setAuthState)
  }

  const signInWithGoogle = async (params: SignInWithGoogleParams = {}) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }))
    const result = await performSignInWithGoogle(params, {
      supabase: createClient(),
      toast,
      posthog
    })
    return applyResult(result, 'keepUser', setAuthState)
  }

  const resendVerificationEmail = async (params: ResetPasswordParams) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }))
    const result = await performResendVerificationEmail(params, {
      supabase: createClient(),
      toast,
      posthog
    })
    return applyResult(result, 'keepUser', setAuthState)
  }

  const resetPassword = async (params: ResetPasswordParams) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }))
    const result = await performResetPassword(params, { supabase: createClient(), toast, posthog })
    return applyResult(result, 'keepUser', setAuthState)
  }

  const signOut = async () => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }))
    const result = await performSignOut({ supabase: createClient(), toast, posthog })
    if (result.success) {
      // Clear saved route to prevent restoring auth-protected pages
      clearLastRoute()
    }
    return applyResult(result, 'resetUser', setAuthState)
  }

  // Stable identity — it only calls the stable setAuthState setter — so callers can list it
  // in an effect's dependency array without the effect re-running (and re-arming timers) on
  // every render.
  const clearError = useCallback(() => {
    setAuthState((prev) => ({ ...prev, error: null }))
  }, [])

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    signInWithEmail,
    signUpWithEmail,
    verifyOtp,
    sendPhoneOtp,
    verifyPhoneOtp,
    signInWithGoogle,
    resendVerificationEmail,
    resetPassword,
    signOut,
    clearError
  }
}
