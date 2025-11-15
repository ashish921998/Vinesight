'use client'

import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

function AuthCallbackContent() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createClient()

        // Check if we have a code in the URL (OAuth callback)
        const currentUrl = new URL(window.location.href)
        const code = currentUrl.searchParams.get('code')
        const error = currentUrl.searchParams.get('error')

        // Handle errors
        if (error) {
          router.push(`/auth/auth-code-error?error=${error}`)
          return
        }

        // If we have a code, exchange it for a session
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            router.push(
              `/auth/auth-code-error?error=code_exchange_failed&message=${encodeURIComponent(exchangeError.message)}`
            )
            return
          }

          if (data?.session) {
            // Successfully exchanged code for session
            // Add a small delay to ensure the auth state is properly set
            setTimeout(() => {
              router.push('/dashboard')
            }, 500)
            return
          }
        }

        // If no code, check if we already have a valid authenticated user
        const { data, error: userError } = await supabase.auth.getUser()

        if (userError) {
          router.push(
            `/auth/auth-code-error?error=session_failed&message=${encodeURIComponent(userError.message)}`
          )
          return
        }

        if (data?.user) {
          // User is authenticated, redirect to dashboard
          // Add a small delay to ensure the auth state is properly set
          setTimeout(() => {
            router.push('/dashboard')
          }, 500)
          return
        }

        // If we get here, there's no session and no code
        router.push(`/auth/auth-code-error?error=no_tokens`)
      } catch (error) {
        console.error('Auth callback error:', error)
        router.push(`/auth/auth-code-error?error=unexpected`)
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}
