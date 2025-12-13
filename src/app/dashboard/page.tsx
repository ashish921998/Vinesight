'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FarmerDashboard } from '@/components/dashboard/FarmerDashboard'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import posthog from 'posthog-js'

export default function DashboardPage() {
  const { user, loading, error } = useSupabaseAuth()
  const router = useRouter()

  // Redirect unauthenticated users to homepage
  // Don't redirect if there's an auth error (e.g., network failure) to prevent redirect loops
  useEffect(() => {
    if (!user && !loading && !error) {
      router.push('/')
    }
  }, [user, loading, error, router])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  // Show error state if auth check failed (e.g., network issues)
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
          <p className="text-muted-foreground mb-4">
            Unable to verify authentication. Please check your internet connection and try again.
          </p>
          <Button
            onClick={() => {
              posthog.capture('dashboard_connection_retry_clicked', {
                error_message: error instanceof Error ? error.message : String(error)
              })
              window.location.reload()
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // Don't show dashboard if user is not logged in (will redirect)
  if (!user) {
    return null
  }

  return <FarmerDashboard />
}
