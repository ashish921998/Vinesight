'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode
} from 'react'
import { createClient } from '@/lib/supabase'
import { type User } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { clearLastRoute } from '@/lib/route-persistence'
import posthog from 'posthog-js'
import {
  type AuthState,
  type ResetPasswordParams,
  type ResendVerificationEmailParams,
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
import { DEFAULT_CURRENCY, type CurrencyCode } from '@/lib/currency-utils'
import { fetchAndValidateCurrency } from '@/lib/currency-preference'

// ─── context shape ─────────────────────────────────────────────────────────────

export interface AuthContextValue {
  user: User | null
  loading: boolean
  error: string | null
  // currency preference for the logged-in user
  currencyPreference: CurrencyCode
  currencyLoading: boolean
  refreshCurrency: () => Promise<void>
  // auth actions (same shapes as src/lib/auth result types)
  signInWithEmail: (
    p: SignInWithEmailParams
  ) => Promise<{ success: boolean; user?: User | null; error?: string }>
  signUpWithEmail: (p: SignUpWithEmailParams) => Promise<{
    success: boolean
    user?: User | null
    needsOtpVerification?: boolean
    error?: string
  }>
  verifyOtp: (
    p: VerifyOtpParams
  ) => Promise<{ success: boolean; user?: User | null; error?: string }>
  sendPhoneOtp: (p: SendPhoneOtpParams) => Promise<{ success: boolean; error?: string }>
  verifyPhoneOtp: (
    p: VerifyPhoneOtpParams
  ) => Promise<{ success: boolean; user?: User | null; error?: string }>
  signInWithGoogle: (p?: SignInWithGoogleParams) => Promise<{ success: boolean; error?: string }>
  resendVerificationEmail: (
    p: ResendVerificationEmailParams
  ) => Promise<{ success: boolean; message?: string; error?: string }>
  resetPassword: (
    p: ResetPasswordParams
  ) => Promise<{ success: boolean; message?: string; error?: string }>
  signOut: () => Promise<{ success: boolean; error?: string }>
  clearError: () => void
}

// ─── context ───────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextValue | null>(null)

// ─── helpers ───────────────────────────────────────────────────────────────────

type AuthOperationResult = { success: true; user?: User | null } | { success: false; error: string }
type ApplyMode = 'setUser' | 'keepUser' | 'resetUser'

/**
 * Maps an auth-operation result onto React state. The extracted operations own
 * the Supabase calls, validation, toasts, and PostHog events; this thin glue
 * owns only the loading/error/user state transitions derived from the result.
 */
function applyResult<T extends AuthOperationResult>(
  result: T,
  mode: ApplyMode,
  setAuthState: (updater: (prev: AuthState) => AuthState) => void
): T {
  if (!result.success) {
    setAuthState((prev) => ({ ...prev, error: result.error, loading: false }))
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

// ─── provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  })
  const [currencyPreference, setCurrencyPreference] = useState<CurrencyCode>(DEFAULT_CURRENCY)
  const [currencyLoading, setCurrencyLoading] = useState(true)
  // Guards against stale writes when the user changes during an in-flight fetch.
  const currencyFetchUserRef = useRef<string | undefined>(undefined)

  // Single auth subscription
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

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      const { user } = reduceAuthStateChange(event, session, { posthog })
      setAuthState((prev) => ({ ...prev, user }))
    })

    getInitialUser()
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Load currency preference once per login. Guards against stale writes: if the user
  // changes (logout / account switch) while the fetch is in flight, the result is dropped.
  const refreshCurrency = useCallback(async () => {
    const userId = authState.user?.id
    if (!userId) return
    currencyFetchUserRef.current = userId
    setCurrencyLoading(true)
    const pref = await fetchAndValidateCurrency(userId)
    if (currencyFetchUserRef.current === userId) {
      setCurrencyPreference(pref)
      setCurrencyLoading(false)
    }
  }, [authState.user?.id])

  useEffect(() => {
    if (authState.user?.id) {
      refreshCurrency()
    } else {
      currencyFetchUserRef.current = undefined
      setCurrencyPreference(DEFAULT_CURRENCY)
      setCurrencyLoading(false)
    }
  }, [authState.user?.id, refreshCurrency])

  // ─── auth actions ──────────────────────────────────────────────────────────

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

  const resendVerificationEmail = async (params: ResendVerificationEmailParams) => {
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
      clearLastRoute()
    }
    return applyResult(result, 'resetUser', setAuthState)
  }

  const clearError = useCallback(() => {
    setAuthState((prev) => ({ ...prev, error: null }))
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        loading: authState.loading,
        error: authState.error,
        currencyPreference,
        currencyLoading,
        refreshCurrency,
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
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>')
  return ctx
}
