/**
 * Auth utility functions for handling authentication errors and cleanup
 */

import { getSupabaseClient } from './supabase'

/**
 * Clear all authentication data from browser storage
 * This helps resolve refresh token issues
 */
export async function clearAuthStorage(): Promise<void> {
  try {
    // Clear Supabase session
    const supabase = getSupabaseClient()
    await supabase.auth.signOut({ scope: 'local' })

    // Clear localStorage items related to auth
    const authKeys = Object.keys(localStorage).filter(
      (key) =>
        key.includes('supabase') ||
        key.includes('auth') ||
        key.includes('session') ||
        key.includes('token')
    )

    authKeys.forEach((key) => {
      localStorage.removeItem(key)
    })

    // Clear sessionStorage items
    const sessionAuthKeys = Object.keys(sessionStorage).filter(
      (key) =>
        key.includes('supabase') ||
        key.includes('auth') ||
        key.includes('session') ||
        key.includes('token')
    )

    sessionAuthKeys.forEach((key) => {
      sessionStorage.removeItem(key)
    })

    // Auth storage cleared successfully
  } catch (error) {
    console.error('Error clearing auth storage:', error)
  }
}

/**
 * Check if error is a refresh token error
 */
export function isRefreshTokenError(error: any): boolean {
  if (!error) return false

  const errorMessage = error.message || error.error_description || ''
  return (
    errorMessage.includes('refresh_token_not_found') ||
    errorMessage.includes('Invalid Refresh Token') ||
    errorMessage.includes('refresh token not found') ||
    errorMessage.includes('invalid_grant')
  )
}

/**
 * Handle refresh token errors by clearing storage and redirecting
 */
export async function handleRefreshTokenError(): Promise<void> {
  // Handling refresh token error - clearing auth state
  await clearAuthStorage()

  // Redirect to auth page if not already there
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
    window.location.href = '/auth?message=session_expired'
  }
}

/**
 * Server-side authentication middleware for API routes
 * Validates user session using Supabase auth
 */
export async function validateUserSession(
  request: Request
): Promise<{ user: any; error?: string }> {
  try {
    const { createServerClient } = await import('@supabase/ssr')
    const { cookies } = await import('next/headers')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const envMissing = (value?: string | null) =>
      !value || value === 'undefined' || value === 'null'

    if (envMissing(supabaseUrl) || envMissing(supabaseAnonKey)) {
      return { user: null, error: 'Supabase client is not configured' }
    }

    const cookieStore = await cookies()

    const supabase = createServerClient(supabaseUrl as string, supabaseAnonKey as string, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        }
      }
    })

    const {
      data: { session },
      error
    } = await supabase.auth.getSession()

    if (error) {
      console.error('Session validation error:', error)
      return { user: null, error: 'Authentication failed' }
    }

    if (!session || !session.user) {
      return { user: null, error: 'No valid session found' }
    }

    return { user: session.user }
  } catch (error) {
    console.error('Auth middleware error:', error)
    return { user: null, error: 'Authentication service unavailable' }
  }
}
