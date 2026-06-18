'use client'

import { usePathname } from 'next/navigation'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { useRouteTracking } from '@/hooks/useRouteTracking'
import Navigation from '@/components/navigation'
import { BottomNavigation } from '@/components/mobile/BottomNavigation'
import { Toaster } from '@/components/ui/sonner'

interface LayoutContentProps {
  children: React.ReactNode
}

// Routes that should never show the sidebar (public / unauthenticated pages).
// The homepage is matched exactly; the auth & onboarding flows are matched by prefix so
// nested pages (/auth/verify-otp, /signup/invite/[token], …) count as public too.
//
// This matters beyond the sidebar: on a private route the loading branches below swap
// `children` out for a spinner, so any auth action that toggles `loading` (e.g. sending a
// phone OTP) unmounts and remounts the page — wiping local form state like the login
// method or a multi-step OTP form. Keeping these routes public renders an identical
// children wrapper across the loading toggle, so their state survives.
const publicRoutes = ['/'] // Homepage (exact match)
const publicPrefixes = ['/auth', '/login', '/signup']
const appShellExcludedPrefixes = ['/consultant']

export function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname()
  const { user, loading } = useSupabaseAuth()

  // Track routes for authenticated users (for PWA state restoration)
  useRouteTracking(!!user)

  // Check if current route is public. pathname is null briefly on first render;
  // treat it as non-public until it resolves so the public loading branch does not
  // run with a null path and the app shell stays in its default state.
  const isPublicRoute =
    pathname !== null &&
    (publicRoutes.includes(pathname) ||
      publicPrefixes.some((route) => pathname === route || pathname.startsWith(`${route}/`)))
  const isAppShellExcludedRoute =
    pathname !== null &&
    appShellExcludedPrefixes.some((route) => pathname === route || pathname.startsWith(`${route}/`))

  // Show sidebar only for authenticated users on private routes
  const showSidebar = !isPublicRoute && !isAppShellExcludedRoute && !!user

  // For loading state on public routes, don't show sidebar
  if (loading && isPublicRoute) {
    return (
      <div className="min-h-screen bg-background">
        <main>{children}</main>
        <Toaster />
      </div>
    )
  }

  // Hold consultant routes until the main auth check settles to avoid a race between
  // getConsultantAccess() and the Supabase session initialization.
  if (loading && isAppShellExcludedRoute) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <Toaster />
      </div>
    )
  }

  // For loading state on private routes, show basic layout
  if (loading && !isPublicRoute && !isAppShellExcludedRoute) {
    return (
      <div className="min-h-screen bg-background">
        <main className="lg:pl-72">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </main>
        <Toaster />
      </div>
    )
  }

  // Public routes and routes with their own shell (e.g. /consultant) — no farmer app shell
  if (isPublicRoute || isAppShellExcludedRoute) {
    return (
      <div className="min-h-screen bg-background">
        <main>{children}</main>
        <Toaster />
      </div>
    )
  }

  // Private routes with authentication - show sidebar
  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      {showSidebar && <Navigation />}
      <main className={showSidebar ? 'lg:pl-72 pt-0' : ''}>
        <div>{children}</div>
      </main>
      {showSidebar && <BottomNavigation />}
      <Toaster />
    </div>
  )
}
