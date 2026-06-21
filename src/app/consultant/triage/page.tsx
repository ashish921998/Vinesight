'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Search, ClipboardList, ChevronRight } from 'lucide-react'
import { useConsultantAccess, useTriageItems } from '@/hooks/consultant/useConsultantQueries'
import posthog from 'posthog-js'
import {
  TRIAGE_STATUSES,
  type TriageItem,
  type TriageStatus
} from '@/lib/consultant-triage-service'

// Stable empty list so `counts`/`filteredItems` keep a stable reference before
// the triage query resolves, instead of getting a fresh [] every render.
const EMPTY_ITEMS: TriageItem[] = []

// User-facing labels. Note `reviewed` surfaces as "Completed" — we never expose
// the internal status term to consultants.
const STATUS_LABELS: Record<TriageStatus, string> = {
  pending: 'Pending',
  in_review: 'In progress',
  reviewed: 'Completed',
  escalated: 'Escalated',
  resolved: 'Resolved'
}

function statusVariant(status: TriageStatus) {
  switch (status) {
    case 'pending':
      return 'outline' as const
    case 'escalated':
      return 'destructive' as const
    case 'resolved':
    case 'reviewed':
      return 'secondary' as const
    default:
      return 'default' as const
  }
}

function formatDate(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ReportsToReviewPage() {
  const accessQuery = useConsultantAccess()
  const access = accessQuery.data ?? null
  // Triage data lives in the query cache (pending/error/data come from the
  // hook), so there's no `items`/`loading` useState mirrored from a fetch
  // effect — that pattern read as derived state and rendered twice per load.
  const triageQuery = useTriageItems(access)
  const items = triageQuery.data ?? EMPTY_ITEMS

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('open')

  // Surface auth + fetch failures once each (side-effects only — never setState
  // — so this does not reintroduce derived state).
  useEffect(() => {
    if (accessQuery.isError) toast.error('Not authenticated')
  }, [accessQuery.isError])

  useEffect(() => {
    if (triageQuery.isError) toast.error('Failed to load reports to review')
  }, [triageQuery.isError])

  // Fire the "viewed" analytics event once per resolved scope when the first
  // batch of data lands (not on every background refetch).
  const capturedScopeRef = useRef<string | null>(null)
  useEffect(() => {
    if (!triageQuery.isSuccess || !access) return
    const scopeKey = `${access.organizationId}:${access.role}`
    if (capturedScopeRef.current === scopeKey) return
    capturedScopeRef.current = scopeKey
    posthog.capture('consultant_reports_to_review_viewed', {
      org_id: access.organizationId,
      role: access.role,
      item_count: triageQuery.data?.length ?? 0
    })
  }, [triageQuery.isSuccess, triageQuery.data, access])

  const counts = useMemo(() => {
    let pending = 0
    let inProgress = 0
    let completed = 0
    for (const item of items) {
      if (item.status === 'pending') pending++
      if (item.status === 'in_review') inProgress++
      if (item.status === 'reviewed' || item.status === 'resolved') completed++
    }
    return { pending, inProgress, completed }
  }, [items])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter === 'open') {
        if (item.status !== 'pending' && item.status !== 'in_review') return false
      } else if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const nameMatch = item.farmerName?.toLowerCase().includes(q)
        const farmMatch = item.farmName?.toLowerCase().includes(q)
        if (!nameMatch && !farmMatch) return false
      }
      return true
    })
  }, [items, statusFilter, searchQuery])

  // Busy while access is resolving or the triage query is still loading.
  // Derived directly from the query states during render.
  const loading = accessQuery.isPending || (Boolean(access) && triageQuery.isPending)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-72" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-2 p-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-10" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-full sm:w-[170px]" />
        </div>

        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Reports to Review</h1>
        <p className="text-muted-foreground">
          Petiole reports awaiting a fertilizer plan for{' '}
          {access?.isAgronomist ? 'farmers assigned to you' : 'your organization'}
        </p>
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold">{counts.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">In progress</p>
            <p className="text-2xl font-bold">{counts.inProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold">{counts.completed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by farmer or farm name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Open reports" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open (to review)</SelectItem>
            <SelectItem value="all">All statuses</SelectItem>
            {TRIAGE_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List — each report deep-links into the Farm workspace for that review */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No reports</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              {items.length === 0
                ? 'There are no petiole reports to review yet.'
                : 'No reports match your current filters. Try adjusting your search.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Header row (md+) */}
            <div className="hidden md:grid grid-cols-[1.5fr_1.2fr_1fr_1fr_auto] gap-3 px-4 py-2 border-b text-xs font-medium text-muted-foreground">
              <span>Farmer</span>
              <span>Farm</span>
              <span>Sampled</span>
              <span>Status</span>
              <span />
            </div>
            <ul className="divide-y">
              {filteredItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/consultant/farmers/${item.clientUserId}/farms/${item.farmId}?reviewId=${item.id}`}
                    className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors md:grid md:grid-cols-[1.5fr_1.2fr_1fr_1fr_auto] md:items-center md:gap-3 block"
                  >
                    <span className="font-medium block md:truncate">
                      {item.farmerName || 'Unknown farmer'}
                    </span>
                    <span className="text-sm text-muted-foreground block md:truncate">
                      {item.farmName || '—'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(item.testDate)}
                    </span>
                    <span className="mt-1 md:mt-0">
                      <Badge variant={statusVariant(item.status)}>
                        {STATUS_LABELS[item.status]}
                      </Badge>
                    </span>
                    <ChevronRight className="hidden md:block h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
