'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { User, AuthError } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { VALIDATION } from '@/lib/constants'

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
  firstName?: string
  lastName?: string
}

interface ResetPasswordParams {
  email: string
}

interface SignInWithGoogleParams {
  redirectTo?: string
}

interface SanitizedNameResult {
  isValid: boolean
  value?: string
  error?: string
}

/**
 * Sanitizes and validates a name field
 * - Returns valid for undefined (optional parameter)
 * - Trims whitespace
 * - Removes control characters and newlines
 * - Collapses repeated spaces
 * - Enforces max length of 50 characters
 */
function sanitizeAndValidateName(name: string | undefined, fieldName: string): SanitizedNameResult {
  // Return valid if name is undefined (optional parameter)
  if (name === undefined) {
    return {
      isValid: true
    }
  }

  // Trim whitespace
  let sanitized = name.trim()

  // Check if empty after trimming
  if (!sanitized) {
    return {
      isValid: false,
      error: `${fieldName} cannot be empty or contain only whitespace`
    }
  }

  // Remove control characters and newlines (ASCII 0-31 and 127)
  // Using character-code filter instead of regex to avoid lint warnings
  sanitized = sanitized
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0)
      return code >= 32 && code !== 127
    })
    .join('')

  // Collapse repeated spaces into single space
  sanitized = sanitized.replace(/\s+/g, ' ')

  // Trim again after sanitization
  sanitized = sanitized.trim()

  // Check if empty after full sanitization
  if (!sanitized) {
    return {
      isValid: false,
      error: `${fieldName} contains only invalid characters`
    }
  }

  // Check length and truncate if necessary
  if (sanitized.length > VALIDATION.MAX_NAME_LENGTH) {
    return {
      isValid: false,
      error: `${fieldName} must not exceed ${VALIDATION.MAX_NAME_LENGTH} characters (currently ${sanitized.length} characters)`
    }
  }

  return {
    isValid: true,
    value: sanitized
  }
}

export function useSupabaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    const supabase = createClient()

    // Get initial user - use getUser() for secure verification
    const getInitialUser = async () => {
      try {
        const {
          data: { user },
          error
        } = await supabase.auth.getUser()

        if (error) {
          setAuthState((prev) => ({ ...prev, error: error.message }))
        } else {
          setAuthState((prev) => ({ ...prev, user: user ?? null }))
        }
      } catch (err) {
        setAuthState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'An unexpected error occurred'
        }))
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
      setAuthState((prev) => ({
        ...prev,
        user: session?.user ?? null
      }))
    })

    getInitialUser()

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
        password
      })

      if (error) {
        setAuthState((prev) => ({ ...prev, error: error.message, loading: false }))
        toast.error(`Login failed: ${error.message}`)
        return { success: false, error: error.message }
      }

      setAuthState((prev) => ({
        ...prev,
        user: data.user ?? null,
        loading: false
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

  const signUpWithEmail = async ({
    email,
    password,
    confirmPassword,
    firstName,
    lastName
  }: SignUpWithEmailParams) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }))

    // Validate password confirmation if provided
    if (confirmPassword && password !== confirmPassword) {
      const error = 'Passwords do not match'
      setAuthState((prev) => ({ ...prev, error, loading: false }))
      return { success: false, error }
    }

    // Validate and sanitize name fields
    const userMetadata: Record<string, string> = {}

    const firstNameResult = sanitizeAndValidateName(firstName, 'First name')
    if (!firstNameResult.isValid) {
      const error = firstNameResult.error || 'Invalid first name'
      setAuthState((prev) => ({ ...prev, error, loading: false }))
      toast.error(error)
      return { success: false, error }
    }
    if (firstNameResult.value) {
      userMetadata.first_name = firstNameResult.value
    }

    const lastNameResult = sanitizeAndValidateName(lastName, 'Last name')
    if (!lastNameResult.isValid) {
      const error = lastNameResult.error || 'Invalid last name'
      setAuthState((prev) => ({ ...prev, error, loading: false }))
      toast.error(error)
      return { success: false, error }
    }
    if (lastNameResult.value) {
      userMetadata.last_name = lastNameResult.value
    }

    // Create full_name field for UI display
    if (userMetadata.first_name && userMetadata.last_name) {
      userMetadata.full_name = `${userMetadata.first_name} ${userMetadata.last_name}`
    } else if (userMetadata.first_name) {
      userMetadata.full_name = userMetadata.first_name
    } else if (userMetadata.last_name) {
      userMetadata.full_name = userMetadata.last_name
    }

    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          ...(Object.keys(userMetadata).length > 0 && { data: userMetadata })
        }
      })

      if (error) {
        setAuthState((prev) => ({ ...prev, error: error.message, loading: false }))
        toast.error(`Sign up failed: ${error.message}`)
        return { success: false, error: error.message }
      }

      setAuthState((prev) => ({
        ...prev,
        user: data.user ?? null,
        loading: false
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
        needsEmailConfirmation
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setAuthState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      toast.error(`Sign up failed: ${errorMessage}`)
      return { success: false, error: errorMessage }
    }
  }

  const resendVerificationEmail = async ({ email }: { email: string }) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const supabase = createClient()

      // Check if user exists first
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser()

      if (userError) {
        setAuthState((prev) => ({ ...prev, error: userError.message, loading: false }))
        return { success: false, error: userError.message }
      }

      // If user exists but not confirmed, resend verification email
      if (user && !user.email_confirmed_at) {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        })

        if (error) {
          setAuthState((prev) => ({ ...prev, error: error.message, loading: false }))
          return { success: false, error: error.message }
        }
      } else {
        // If user doesn't exist or is already confirmed, try to sign up again
        // This will trigger a new verification email
        const { error } = await supabase.auth.signUp({
          email,
          password: 'temp-password-for-resend',
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        })

        if (error) {
          setAuthState((prev) => ({ ...prev, error: error.message, loading: false }))
          return { success: false, error: error.message }
        }
      }

      setAuthState((prev) => ({ ...prev, loading: false }))
      return { success: true, message: 'Verification email resent successfully' }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setAuthState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      return { success: false, error: errorMessage }
    }
  }

  const resetPassword = async ({ email }: ResetPasswordParams) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
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
    redirectTo = `${window.location.origin}/auth/callback`
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
            prompt: 'consent'
          }
        }
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
        error: null
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
    resendVerificationEmail,
    resetPassword,
    signOut,
    clearError
  }
}
