'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  type TriageSeverity,
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

const SEVERITY_LABELS: Record<TriageSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical'
}

// Severity chip on the diverging/status spine, never color alone (always
// labelled). Only high/critical get tinted; low/medium stay neutral.
function severityStyle(severity: TriageSeverity): React.CSSProperties | undefined {
  if (severity === 'critical') return { backgroundColor: '#fee2e2', color: '#7f1d1d' }
  if (severity === 'high')
    return { backgroundColor: 'var(--nutrient-deficient-bg)', color: 'var(--nutrient-deficient)' }
  return undefined
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
  const router = useRouter()

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

        <Skeleton className="h-5 w-80 max-w-full" />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-full sm:w-[170px]" />
        </div>

        <div className="rounded-xl border border-border">
          <div className="border-b border-border px-4 py-2">
            <Skeleton className="h-3 w-full max-w-md" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0"
            >
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/5" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="ml-auto h-6 w-20" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-semibold">Reports to Review</h1>
        <p className="text-muted-foreground">
          Petiole reports awaiting a fertilizer plan for{' '}
          {access?.isAgronomist ? 'farmers assigned to you' : 'your organization'}
        </p>
      </div>

      {/* Header counter — "N reports awaiting judgment" + a compact mono
          breakdown, instead of a 3-card metric grid (anti-slop). */}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p className="text-sm">
          <span className="font-mono text-lg font-semibold tabular-nums">
            {counts.pending + counts.inProgress}
          </span>{' '}
          report{counts.pending + counts.inProgress === 1 ? '' : 's'} awaiting judgment
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">{counts.pending}</span> pending ·{' '}
          <span className="font-mono tabular-nums">{counts.inProgress}</span> in progress ·{' '}
          <span className="font-mono tabular-nums">{counts.completed}</span> completed
        </p>
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
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-semibold">Farmer</th>
                <th className="px-4 py-2 font-semibold">Farm</th>
                <th className="px-4 py-2 font-semibold">Sampled</th>
                <th className="px-4 py-2 font-semibold">Severity</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.map((item) => {
                const href = `/consultant/farmers/${item.clientUserId}/farms/${item.farmId}?reviewId=${item.id}`
                return (
                  <tr
                    key={item.id}
                    onClick={() => router.push(href)}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={href}
                        onClick={(e) => e.stopPropagation()}
                        className="font-serif font-medium text-foreground hover:underline"
                      >
                        {item.farmerName || 'Unknown farmer'}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{item.farmName || '—'}</td>
                    <td className="px-4 py-2.5 font-mono tabular-nums text-muted-foreground">
                      {formatDate(item.testDate)}
                    </td>
                    <td className="px-4 py-2.5">
                      {item.severity ? (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            item.severity === 'critical' || item.severity === 'high'
                              ? ''
                              : 'bg-muted text-muted-foreground'
                          }`}
                          style={severityStyle(item.severity)}
                        >
                          {SEVERITY_LABELS[item.severity]}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={statusVariant(item.status)}>
                        {STATUS_LABELS[item.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-primary">
                        Review
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
