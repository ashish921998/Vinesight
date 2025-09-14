'use client'

import { useEffect } from 'react'
import { isRefreshTokenError, handleRefreshTokenError } from '@/lib/auth-utils'

/**
 * Global error handler for unhandled authentication errors
 * This catches Promise rejections and other auth errors that bubble up
 */
export function GlobalAuthErrorHandler() {
  useEffect(() => {
    const handleUnhandledRejection = async (event: PromiseRejectionEvent) => {
      const error = event.reason

      // Check if this is a Supabase auth error
      if (error && isRefreshTokenError(error)) {
        console.log('Caught unhandled refresh token error, handling...')
        event.preventDefault() // Prevent the error from showing in console
        await handleRefreshTokenError()
      }
    }

    const handleError = async (event: ErrorEvent) => {
      const error = event.error

      // Check if this is a Supabase auth error
      if (error && isRefreshTokenError(error)) {
        console.log('Caught global auth error, handling...')
        event.preventDefault() // Prevent the error from showing in console
        await handleRefreshTokenError()
      }
    }

    // Add global error listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])

  return null // This component doesn't render anything
}
