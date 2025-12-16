/**
 * Route Tracking Hook for PWA State Restoration
 *
 * Tracks route changes and saves them to localStorage for restoration
 * Also listens for page visibility changes to capture backgrounding events
 */

'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { saveLastRoute } from '@/lib/route-persistence'

/**
 * Hook to track and persist route changes for PWA state restoration
 * Only active for authenticated users
 */
export function useRouteTracking(isAuthenticated: boolean) {
  const pathname = usePathname()

  useEffect(() => {
    // Only track routes for authenticated users
    if (!isAuthenticated) return

    // Save current route on mount and when pathname changes
    saveLastRoute(pathname)

    // Also save route when page becomes hidden (user backgrounds the app)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveLastRoute(pathname)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [pathname, isAuthenticated])
}
