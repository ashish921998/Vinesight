'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet'
import { toast } from 'sonner'
import { Search, Loader2, ClipboardList, ChevronRight, FlaskConical } from 'lucide-react'
import { getConsultantAccess, type ConsultantAccess } from '@/lib/consultant-access'
import posthog from 'posthog-js'
import {
  getTriageItems,
  getTriageItem,
  updateTriageReview,
  TRIAGE_STATUSES,
  TRIAGE_SEVERITIES,
  type TriageItem,
  type TriageDetail,
  type TriageStatus,
  type TriageSeverity
} from '@/lib/consultant-triage-service'

const STATUS_LABELS: Record<TriageStatus, string> = {
  pending: 'Pending',
  in_review: 'In Review',
  reviewed: 'Reviewed',
  escalated: 'Escalated',
  resolved: 'Resolved'
}

const SEVERITY_LABELS: Record<TriageSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical'
}

function severityVariant(severity: TriageSeverity | null) {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'destructive' as const
    case 'medium':
      return 'default' as const
    default:
      return 'secondary' as const
  }
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
  return date.toLocaleDateString()
}

export default function TriagePage() {
  const [items, setItems] = useState<TriageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [access, setAccess] = useState<ConsultantAccess | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')

  const [selected, setSelected] = useState<TriageDetail | null>(null)
  const detailRequestRef = useRef<string | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Review form state
  const [formStatus, setFormStatus] = useState<TriageStatus>('pending')
  const [formSeverity, setFormSeverity] = useState<string>('none')
  const [formClassification, setFormClassification] = useState('')
  const [formSummary, setFormSummary] = useState('')
  const [formRecommendation, setFormRecommendation] = useState('')
  const [formReviewNotes, setFormReviewNotes] = useState('')

  useEffect(() => {
    loadTriage()
  }, [])

  const loadTriage = async () => {
    try {
      setLoading(true)
      const currentAccess = await getConsultantAccess()
      if (!currentAccess) {
        toast.error('Not authenticated')
        return
      }
      setAccess(currentAccess)
      const data = await getTriageItems(currentAccess)
      setItems(data)
      posthog.capture('consultant_triage_viewed', {
        org_id: currentAccess.organizationId,
        role: currentAccess.role,
        item_count: data.length
      })
    } catch (error) {
      console.error('Failed to load triage:', error)
      toast.error('Failed to load triage queue')
    } finally {
      setLoading(false)
    }
  }

  const counts = useMemo(() => {
    let pending = 0
    let highSeverity = 0
    let reviewed = 0
    for (const item of items) {
      if (item.status === 'pending') pending++
      if (item.severity === 'high' || item.severity === 'critical') highSeverity++
      if (item.status === 'reviewed' || item.status === 'resolved') reviewed++
    }
    return { pending, highSeverity, reviewed }
  }, [items])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (severityFilter !== 'all' && item.severity !== severityFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const nameMatch = item.farmerName?.toLowerCase().includes(q)
        const farmMatch = item.farmName?.toLowerCase().includes(q)
        if (!nameMatch && !farmMatch) return false
      }
      return true
    })
  }, [items, statusFilter, severityFilter, searchQuery])

  const openDetail = async (item: TriageItem) => {
    if (!access) return
    setDetailLoading(true)
    setSelected({ ...item, petioleTest: null })
    detailRequestRef.current = item.id
    try {
      const detail = await getTriageItem(access, item.id)
      // Ignore a stale response if a different item was opened in the meantime.
      if (detailRequestRef.current !== item.id) return
      if (!detail) {
        toast.error('Triage item is no longer available')
        setSelected(null)
        return
      }
      setSelected(detail)
      setFormStatus(detail.status)
      setFormSeverity(detail.severity ?? 'none')
      setFormClassification(detail.classification ?? '')
      setFormSummary(detail.summary ?? '')
      setFormRecommendation(detail.recommendation ?? '')
      setFormReviewNotes(detail.reviewNotes ?? '')
    } catch (error) {
      if (detailRequestRef.current !== item.id) return
      console.error('Failed to load triage detail:', error)
      toast.error('Failed to load triage detail')
      setSelected(null)
    } finally {
      if (detailRequestRef.current === item.id) setDetailLoading(false)
    }
  }

  // Close the drawer and invalidate any in-flight detail fetch, so a slow
  // request that resolves after the user closes can't re-open the sheet.
  const closeDetail = () => {
    detailRequestRef.current = null
    setSelected(null)
  }

  const handleSave = async () => {
    if (!access || !selected) return
    setSaving(true)
    try {
      const updated = await updateTriageReview(access, selected.id, {
        status: formStatus,
        severity: formSeverity === 'none' ? null : (formSeverity as TriageSeverity),
        classification: formClassification.trim() || null,
        summary: formSummary.trim() || null,
        recommendation: formRecommendation.trim() || null,
        reviewNotes: formReviewNotes.trim() || null
      })
      // Merge updated review fields back into the list (preserve display fields).
      setItems((prev) =>
        prev.map((it) =>
          it.id === updated.id
            ? {
                ...it,
                status: updated.status,
                severity: updated.severity,
                classification: updated.classification,
                summary: updated.summary,
                recommendation: updated.recommendation,
                reviewNotes: updated.reviewNotes,
                reviewedBy: updated.reviewedBy,
                reviewedAt: updated.reviewedAt
              }
            : it
        )
      )
      posthog.capture('consultant_triage_item_actioned', {
        status: formStatus,
        severity: formSeverity === 'none' ? null : formSeverity,
        has_recommendation: formRecommendation.trim().length > 0
      })
      toast.success('Triage updated')
      closeDetail()
    } catch (error) {
      console.error('Failed to update triage:', error)
      toast.error('Failed to update triage')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading triage queue...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Triage</h1>
        <p className="text-muted-foreground">
          Review petiole test issues for{' '}
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
            <p className="text-xs text-muted-foreground">High severity</p>
            <p className="text-2xl font-bold text-destructive">{counts.highSeverity}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Reviewed</p>
            <p className="text-2xl font-bold">{counts.reviewed}</p>
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
          <SelectTrigger className="w-full sm:w-[170px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {TRIAGE_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-full sm:w-[170px]">
            <SelectValue placeholder="All severities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severities</SelectItem>
            {TRIAGE_SEVERITIES.map((severity) => (
              <SelectItem key={severity} value={severity}>
                {SEVERITY_LABELS[severity]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Queue */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No Triage Items</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              {items.length === 0
                ? 'There are no petiole test issues to review yet.'
                : 'No items match your current filters. Try adjusting your search.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Header row (md+) */}
            <div className="hidden md:grid grid-cols-[1.5fr_1.2fr_0.9fr_0.9fr_1fr_1.1fr_auto] gap-3 px-4 py-2 border-b text-xs font-medium text-muted-foreground">
              <span>Farmer</span>
              <span>Farm</span>
              <span>Test date</span>
              <span>Severity</span>
              <span>Classification</span>
              <span>Status</span>
              <span />
            </div>
            <ul className="divide-y">
              {filteredItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openDetail(item)}
                    className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors md:grid md:grid-cols-[1.5fr_1.2fr_0.9fr_0.9fr_1fr_1.1fr_auto] md:items-center md:gap-3"
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
                      <Badge variant={severityVariant(item.severity)}>
                        {item.severity ? SEVERITY_LABELS[item.severity] : 'Unset'}
                      </Badge>
                    </span>
                    <span className="text-sm text-muted-foreground block md:truncate">
                      {item.classification || '—'}
                    </span>
                    <span className="mt-1 md:mt-0">
                      <Badge variant={statusVariant(item.status)}>
                        {STATUS_LABELS[item.status]}
                      </Badge>
                    </span>
                    <ChevronRight className="hidden md:block h-4 w-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Detail / review drawer */}
      <Sheet open={selected !== null} onOpenChange={(open) => !open && closeDetail()}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selected?.farmerName || 'Triage review'}</SheetTitle>
            <SheetDescription>
              {selected?.farmName || '—'} · Test {formatDate(selected?.testDate ?? null)}
            </SheetDescription>
          </SheetHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : selected ? (
            <div className="px-4 space-y-5">
              {/* Linked petiole test values */}
              {selected.petioleTest && (
                <div className="rounded-lg border bg-muted/40 p-3">
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                    <FlaskConical className="h-4 w-4 text-accent" />
                    Petiole test values
                  </div>
                  <PetioleParameters parameters={selected.petioleTest.parameters} />
                  {selected.petioleTest.recommendations && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {selected.petioleTest.recommendations}
                    </p>
                  )}
                </div>
              )}

              {/* Review form */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formStatus}
                  onValueChange={(value) => setFormStatus(value as TriageStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIAGE_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={formSeverity} onValueChange={setFormSeverity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unset</SelectItem>
                    {TRIAGE_SEVERITIES.map((severity) => (
                      <SelectItem key={severity} value={severity}>
                        {SEVERITY_LABELS[severity]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Classification</Label>
                <Input
                  value={formClassification}
                  onChange={(e) => setFormClassification(e.target.value)}
                  placeholder="e.g. Nitrogen deficiency"
                />
              </div>

              <div className="space-y-2">
                <Label>Summary</Label>
                <Textarea
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="Short summary of the issue"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Recommendation</Label>
                <Textarea
                  value={formRecommendation}
                  onChange={(e) => setFormRecommendation(e.target.value)}
                  placeholder="Recommended action for the farmer"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Review notes</Label>
                <Textarea
                  value={formReviewNotes}
                  onChange={(e) => setFormReviewNotes(e.target.value)}
                  placeholder="Internal notes (not shown to farmer)"
                  rows={2}
                />
              </div>

              {selected.reviewedAt && (
                <p className="text-xs text-muted-foreground">
                  Last reviewed {formatDate(selected.reviewedAt)}
                </p>
              )}
            </div>
          ) : null}

          <SheetFooter>
            <Button onClick={handleSave} disabled={saving || detailLoading || !selected}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save review
            </Button>
            <Button variant="outline" onClick={closeDetail} disabled={saving}>
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function PetioleParameters({ parameters }: { parameters: unknown }) {
  const entries =
    parameters && typeof parameters === 'object' && !Array.isArray(parameters)
      ? Object.entries(parameters as Record<string, unknown>)
      : []

  if (entries.length === 0) {
    return <p className="text-xs text-muted-foreground">No parameter values recorded.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{key}</span>
          <span className="font-medium">
            {value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value)}
          </span>
        </div>
      ))}
    </div>
  )
}
