'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { User, AuthError } from '@supabase/supabase-js'
import { toast } from 'sonner'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

interface SignInWithEmailParams {
  email: string
  password: string
}

interface SignUpWithEmailParams {
  email: string
  password: string
  confirmPassword?: string
}

interface ResetPasswordParams {
  email: string
}

interface SignInWithGoogleParams {
  redirectTo?: string
}

export function useSupabaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          setAuthState((prev) => ({ ...prev, error: error.message }))
        } else {
          setAuthState((prev) => ({ ...prev, user: session?.user ?? null }))
        }
      } catch (err) {
        setAuthState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'An unexpected error occurred',
        }))
      } finally {
        setAuthState((prev) => ({ ...prev, loading: false }))
      }
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Only update the user state, don't change loading state here
      // to avoid interfering with the loading states from auth operations
      setAuthState((prev) => ({
        ...prev,
        user: session?.user ?? null,
      }))
    })

    getSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signInWithEmail = async ({ email, password }: SignInWithEmailParams) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setAuthState((prev) => ({ ...prev, error: error.message, loading: false }))
        toast.error(`Login failed: ${error.message}`)
        return { success: false, error: error.message }
      }

      setAuthState((prev) => ({
        ...prev,
        user: data.user ?? null,
        loading: false,
      }))

      toast.success('Login successful!')
      return { success: true, user: data.user }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setAuthState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      toast.error(`Login failed: ${errorMessage}`)
      return { success: false, error: errorMessage }
    }
  }

  const signUpWithEmail = async ({ email, password, confirmPassword }: SignUpWithEmailParams) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }))

    // Validate password confirmation if provided
    if (confirmPassword && password !== confirmPassword) {
      const error = 'Passwords do not match'
      setAuthState((prev) => ({ ...prev, error, loading: false }))
      return { success: false, error }
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setAuthState((prev) => ({ ...prev, error: error.message, loading: false }))
        toast.error(`Sign up failed: ${error.message}`)
        return { success: false, error: error.message }
      }

      setAuthState((prev) => ({
        ...prev,
        user: data.user ?? null,
        loading: false,
      }))

      const needsEmailConfirmation = !data.user?.email_confirmed_at
      if (needsEmailConfirmation) {
        toast.success('Account created! Please check your email to confirm your account.')
      } else {
        toast.success('Account created successfully!')
      }

      return {
        success: true,
        user: data.user,
        needsEmailConfirmation,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setAuthState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      toast.error(`Sign up failed: ${errorMessage}`)
      return { success: false, error: errorMessage }
    }
  }

  const resetPassword = async ({ email }: ResetPasswordParams) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        setAuthState((prev) => ({ ...prev, error: error.message, loading: false }))
        toast.error(`Password reset failed: ${error.message}`)
        return { success: false, error: error.message }
      }

      setAuthState((prev) => ({ ...prev, loading: false }))
      toast.success('Password reset email sent! Please check your inbox.')
      return { success: true, message: 'Password reset email sent' }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setAuthState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      toast.error(`Password reset failed: ${errorMessage}`)
      return { success: false, error: errorMessage }
    }
  }

  const signInWithGoogle = async ({
    redirectTo = `${window.location.origin}/auth/callback`,
  }: SignInWithGoogleParams = {}) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'online',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        setAuthState((prev) => ({ ...prev, error: error.message, loading: false }))
        toast.error(`Google sign in failed: ${error.message}`)
        return { success: false, error: error.message }
      }

      // The user will be redirected to the OAuth provider
      // We don't set the user here as they will be redirected
      setAuthState((prev) => ({ ...prev, loading: false }))
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setAuthState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      toast.error(`Google sign in failed: ${errorMessage}`)
      return { success: false, error: errorMessage }
    }
  }

  const signOut = async () => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      setAuthState((prev) => ({
        user: null,
        loading: false,
        error: null,
      }))
      toast.success('Signed out successfully')
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setAuthState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      toast.error(`Sign out failed: ${errorMessage}`)
      return { success: false, error: errorMessage }
    }
  }

  const clearError = () => {
    setAuthState((prev) => ({ ...prev, error: null }))
  }

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    resetPassword,
    signOut,
    clearError,
  }
}
