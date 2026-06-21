'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/Skeleton'
import { FarmerDashboard } from '@/components/dashboard/FarmerDashboard'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import posthog from 'posthog-js'

const getErrorMessage = (value: unknown) =>
  value instanceof Error ? value.message : String(value ?? 'Unknown authentication error')

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
      <div className="min-h-screen bg-background px-4 py-6 space-y-6 sm:px-6 lg:px-10">
        {/* Header: farm selector + actions */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-28 rounded-full" />
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <Skeleton className="h-11 w-full rounded-full sm:h-12 sm:w-64" />
            <div className="flex gap-1.5">
              <Skeleton className="h-9 flex-1 rounded-full sm:h-11 sm:w-28" />
              <Skeleton className="h-9 flex-1 rounded-full sm:h-11 sm:w-28" />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>

        {/* Today at a glance: stat tiles */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>

        {/* Sections */}
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
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
                error_message: getErrorMessage(error)
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
