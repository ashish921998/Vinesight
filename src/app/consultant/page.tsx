'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronRight, FlaskConical, Loader2, UserPlus, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { roleLabels } from '@/lib/consultant-access'
import { InviteFarmerDialog } from '@/components/consultant/InviteFarmerDialog'
import { JoinCodeCard } from '@/components/consultant/JoinCodeCard'
import {
  useConsultantAccess,
  useFarmerClients,
  useReviewQueue
} from '@/hooks/consultant/useConsultantQueries'

// Newest pending Petiole Reviews surfaced directly in the Command Center.
const REVIEW_PREVIEW_LIMIT = 5

function formatReviewDate(value: string | null) {
  if (!value) return '—'
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
  const date = dateOnly
    ? new Date(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, Number(value.slice(8, 10)))
    : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const workspaceLinks = [
  {
    title: 'Farmer Directory',
    description: 'Review client farmers, farm access, and linked lab reports.',
    href: '/consultant/farmers',
    action: 'Open farmers',
    icon: Users
  }
]

export default function ConsultantOverviewPage() {
  const accessQuery = useConsultantAccess()
  const access = accessQuery.data ?? null
  const farmerAccess = access?.canViewAllFarmers ? access : null
  const farmersQuery = useFarmerClients(farmerAccess)
  const reviewsQuery = useReviewQueue(access)

  const reviews = reviewsQuery.data ?? []
  const previewReviews = reviews.slice(0, REVIEW_PREVIEW_LIMIT)

  useEffect(() => {
    if (farmersQuery.error) {
      // The count is a non-critical nudge; never block the workspace on it.
      console.error('Failed to load unassigned farmer count:', farmersQuery.error)
    }
  }, [farmersQuery.error])

  useEffect(() => {
    if (reviewsQuery.error) {
      console.error('Failed to load review queue:', reviewsQuery.error)
    }
  }, [reviewsQuery.error])

  const unassignedCount = useMemo(() => {
    if (!access?.canViewAllFarmers || !farmersQuery.data) return null
    return farmersQuery.data.filter((client) => !client.assigned_to).length
  }, [access?.canViewAllFarmers, farmersQuery.data])

  if (accessQuery.isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Consultant Workspace</h1>
            <Badge variant="secondary">{roleLabels[access.role]}</Badge>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Manage assigned farmers, lab visibility, and consultant review work from one place.
          </p>
        </div>
        <InviteFarmerDialog organizationId={access.organizationId} />
      </div>

      <JoinCodeCard access={access} />

      {/* Owner/admin nudge: farmers who self-joined the org but have no
          agronomist yet. unassignedCount is non-null only for canViewAllFarmers. */}
      {unassignedCount !== null &&
        (unassignedCount > 0 ? (
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
        ) : (
          <p className="text-sm text-muted-foreground">
            All farmers are assigned to an agronomist.
          </p>
        ))}

      {/* Command Center: newest pending Petiole Reviews as work items. Each
          deep-links into the Farm workspace for that exact review. */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Reports to Review</CardTitle>
              <p className="text-sm text-muted-foreground">
                Newest petiole reports awaiting a fertilizer plan
              </p>
            </div>
          </div>
          {reviews.length > 0 && (
            <Badge variant="secondary" className="tabular-nums">
              {reviews.length} pending
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {reviewsQuery.isPending ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : reviewsQuery.isError ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Couldn&apos;t load reports to review. Please refresh.
            </p>
          ) : previewReviews.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No pending reports. New petiole uploads from your farmers will appear here.
            </p>
          ) : (
            <ul className="divide-y">
              {previewReviews.map((review) => (
                <li key={review.id}>
                  <Link
                    href={`/consultant/farmers/${review.clientUserId}/farms/${review.farmId}?reviewId=${review.id}`}
                    className="flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {review.farmerName || 'Unknown farmer'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {review.farmName || 'Farm'} · Sampled {formatReviewDate(review.testDate)}
                      </p>
                    </div>
                    {review.status === 'in_review' && (
                      <Badge variant="outline" className="shrink-0">
                        In progress
                      </Badge>
                    )}
                    <span className="shrink-0 text-xs font-medium text-primary inline-flex items-center gap-0.5">
                      Review
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {reviews.length > REVIEW_PREVIEW_LIMIT && (
            <div className="pt-3">
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link href="/consultant/triage">
                  See all {reviews.length} reports
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {workspaceLinks.map((item) => {
          const Icon = item.icon

          return (
            <Card key={item.href} className="border-border/80">
              <CardHeader className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href={item.href}>
                    {item.action}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
