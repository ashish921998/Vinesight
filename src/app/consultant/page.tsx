'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, UserPlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/Skeleton'
import { roleLabels } from '@/lib/consultant-access'
import { CommandCenterDashboard } from '@/components/consultant/dashboard/CommandCenterDashboard'
import { useConsultantAccess, useFarmerClients } from '@/hooks/consultant/useConsultantQueries'

export default function ConsultantOverviewPage() {
  const accessQuery = useConsultantAccess()
  const access = accessQuery.data ?? null
  // Owner/admin only: used solely for the "needs an agronomist" nudge below.
  // Shares the React Query cache with the dashboard's own clients fetch.
  const farmerAccess = access?.canViewAllFarmers ? access : null
  const farmersQuery = useFarmerClients(farmerAccess)

  useEffect(() => {
    if (farmersQuery.error) {
      // The count is a non-critical nudge; never block the workspace on it.
      console.error('Failed to load unassigned farmer count:', farmersQuery.error)
    }
  }, [farmersQuery.error])

  const unassignedCount = useMemo(() => {
    if (!access?.canViewAllFarmers || !farmersQuery.data) return null
    return farmersQuery.data.filter((client) => !client.assigned_to).length
  }, [access?.canViewAllFarmers, farmersQuery.data])

  if (accessQuery.isPending) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-80 w-full rounded-xl lg:col-span-2" />
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (accessQuery.isError || !access) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Access unavailable. Please refresh or return to the dashboard.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Overview</h1>
          <Badge variant="secondary">{roleLabels[access.role]}</Badge>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Your proactive daily panel — what needs attention across your farmers.
        </p>
      </div>

      {/* Owner/admin nudge: farmers who self-joined the org but have no
          agronomist yet. unassignedCount is non-null only for canViewAllFarmers. */}
      {unassignedCount !== null && unassignedCount > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-500">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base">
                {unassignedCount} farmer{unassignedCount !== 1 ? 's' : ''} need
                {unassignedCount === 1 ? 's' : ''} an agronomist
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                These farmers joined your organization but have not been assigned yet.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="flex-shrink-0">
              <Link href="/consultant/team/assignments">
                Assign
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
        </Card>
      )}

      <CommandCenterDashboard access={access} />
    </div>
  )
}
