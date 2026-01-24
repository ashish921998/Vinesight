'use client'

import { usePathname } from 'next/navigation'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { useRouteTracking } from '@/hooks/useRouteTracking'
import Navigation from '@/components/navigation'
import { BottomNavigation } from '@/components/mobile/BottomNavigation'
import { Toaster } from '@/components/ui/sonner'
import dynamic from 'next/dynamic'

// Dynamically import VoiceAssistantHybrid to avoid SSR issues with Web Audio API
const VoiceAssistantHybrid = dynamic(
  () => import('@/components/voice/VoiceAssistantHybrid').then(mod => ({ default: mod.VoiceAssistantHybrid })),
  {
    ssr: false,
    loading: () => null // Don't show anything while loading
  }
)

interface LayoutContentProps {
  children: React.ReactNode
}

export function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname()
  const { user, loading } = useSupabaseAuth()

  // Track routes for authenticated users (for PWA state restoration)
  useRouteTracking(!!user)

  // Routes that should never show the sidebar (public pages)
  const publicRoutes = [
    '/', // Homepage
    '/auth'
  ]

  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(pathname)

  // Show sidebar only for authenticated users on private routes
  const showSidebar = !isPublicRoute && !!user

  // For loading state on public routes, don't show sidebar
  if (loading && isPublicRoute) {
    return (
      <div className="min-h-screen bg-background">
        <main>{children}</main>
        <Toaster />
      </div>
    )
  }

  // For loading state on private routes, show basic layout
  if (loading && !isPublicRoute) {
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

  // Public routes (homepage, auth, calculators) - no sidebar
  if (isPublicRoute) {
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
      {/* Only show VoiceAssistant for authenticated users */}
      {user && <VoiceAssistantHybrid />}
      <Toaster />
    </div>
  )
}
