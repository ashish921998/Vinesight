'use client'

import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { resolveModuleHome } from '@/lib/auth/module-home'

function AuthCallbackContent() {
  const router = useRouter()

  useEffect(() => {
    // The callback is async and can resume after this component unmounts (e.g. the
    // user navigates away). Guard every redirect/timer with `isMounted` so we never
    // schedule a timer or push a route after cleanup has already run.
    let isMounted = true
    let redirectTimer: ReturnType<typeof setTimeout> | null = null
    const handleAuthCallback = async () => {
      try {
        const supabase = createClient()

        // Check if we have a code in the URL (OAuth callback)
        const currentUrl = new URL(window.location.href)
        const code = currentUrl.searchParams.get('code')
        const error = currentUrl.searchParams.get('error')

        // Handle errors
        if (error) {
          if (isMounted) router.push(`/auth/auth-code-error?error=${error}`)
          return
        }

        // If we have a code, exchange it for a session
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (!isMounted) return

          if (exchangeError) {
            router.push(
              `/auth/auth-code-error?error=code_exchange_failed&message=${encodeURIComponent(exchangeError.message)}`
            )
            return
          }

          if (data?.session) {
            // Successfully exchanged code for session
            // Add a small delay to ensure the auth state is properly set
            const home = await resolveModuleHome(data.session.user.id)
            if (!isMounted) return
            redirectTimer = setTimeout(() => {
              router.push(home)
            }, 500)
            return
          }
        }

        // If no code, check if we already have a valid authenticated user
        const { data, error: userError } = await supabase.auth.getUser()
        if (!isMounted) return

        if (userError) {
          router.push(
            `/auth/auth-code-error?error=session_failed&message=${encodeURIComponent(userError.message)}`
          )
          return
        }

        if (data?.user) {
          // User is authenticated, redirect to dashboard
          // Add a small delay to ensure the auth state is properly set
          const home = await resolveModuleHome(data.user.id)
          if (!isMounted) return
          redirectTimer = setTimeout(() => {
            router.push(home)
          }, 500)
          return
        }

        // If we get here, there's no session and no code
        router.push(`/auth/auth-code-error?error=no_tokens`)
      } catch (error) {
        console.error('Auth callback error:', error)
        if (isMounted) router.push(`/auth/auth-code-error?error=unexpected`)
      }
    }

    handleAuthCallback()

    return () => {
      isMounted = false
      if (redirectTimer) {
        clearTimeout(redirectTimer)
      }
    }
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
