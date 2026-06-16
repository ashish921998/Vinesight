'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useSupabaseAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Development mode - bypass auth for local testing ONLY
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isLocalhost =
    mounted &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  const bypassAuth = isDevelopment && isLocalhost && process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'

  // Once we know the user is unauthenticated, send them to the full login page
  // (email/password, phone OTP, and Google) rather than a Google-only fallback.
  // Preserve the page they wanted via ?redirect= so they return after signing in.
  const shouldRedirect = mounted && !loading && !user && !bypassAuth && !fallback

  useEffect(() => {
    if (!shouldRedirect) return
    const returnTo = window.location.pathname + window.location.search
    router.replace(`/login?redirect=${encodeURIComponent(returnTo)}`)
  }, [shouldRedirect, router])

  // Show loading until component is mounted, auth check is complete, or while
  // the redirect to /login is in flight.
  if (!mounted || (loading && !bypassAuth) || shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (!user && !bypassAuth) {
    // A caller-supplied fallback takes precedence over the login redirect.
    return <>{fallback}</>
  }

  return <>{children}</>
}
