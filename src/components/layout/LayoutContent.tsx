'use client'

import { usePathname } from 'next/navigation'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import Navigation from '@/components/navigation'
import { BottomNavigation } from '@/components/mobile/BottomNavigation'
import { Toaster } from '@/components/ui/sonner'
import { AppModeProvider, useAppMode } from '@/hooks/useAppMode'
import { useEffect } from 'react'

interface LayoutContentProps {
  children: React.ReactNode
}

export function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname()
  const { user, loading } = useSupabaseAuth()

  // Routes that should never show the sidebar (public pages)
  const publicRoutes = [
    '/', // Homepage
    '/auth'
  ]

  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(pathname)

  // Show sidebar only for authenticated users on private routes
  const showSidebar = !isPublicRoute && !!user

  let content: React.ReactNode

  // For loading state on public routes, don't show sidebar
  if (loading && isPublicRoute) {
    content = (
      <div className="min-h-screen bg-background">
        <main>{children}</main>
        <Toaster />
      </div>
    )
  } else if (loading && !isPublicRoute) {
    // For loading state on private routes, show basic layout
    content = (
      <div className="min-h-screen bg-background">
        <main className="lg:pl-72">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </main>
        <Toaster />
      </div>
    )
  } else if (isPublicRoute) {
    // Public routes (homepage, auth, calculators) - no sidebar
    content = (
      <div className="min-h-screen bg-background">
        <main>{children}</main>
        <Toaster />
      </div>
    )
  } else {
    // Private routes with authentication - show sidebar
    content = (
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

  return (
    <AppModeProvider>
      <ModeSync pathname={pathname} />
      {content}
    </AppModeProvider>
  )
}

function ModeSync({ pathname }: { pathname: string }) {
  const { setMode } = useAppMode()

  useEffect(() => {
    if (pathname.startsWith('/winery')) {
      setMode('winery')
    } else if (pathname.startsWith('/vineyard')) {
      setMode('vineyard')
    }
  }, [pathname, setMode])

  return null
}
