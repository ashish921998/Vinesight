'use client'

import { useState, useCallback, useReducer } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ClipboardCheck, Loader2 } from 'lucide-react'
import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'
import { type ConsultantAccess } from '@/lib/consultant-access'
import {
  getVisitableRecommendations,
  FOLLOWED_STATUSES,
  followedStatusLabels,
  type FollowedStatus,
  type VisitableRecommendation,
  type Visit
} from '@/lib/consultant-visit-service'
import { useCreateVisit } from '@/hooks/consultant/useConsultantQueries'

interface RecordVisitDialogProps {
  access: ConsultantAccess
  farmerId: string
  /** Farms belonging to this farmer, for the optional farm selector. */
  farms: { id: number; name: string }[]
  /** Pre-select this farm in the selector (e.g. when opened from a farm page). */
  defaultFarmId?: number
  onRecorded?: (visit: Visit) => void
}

interface FollowupDraft {
  status: FollowedStatus | ''
  note: string
}

/** Local YYYY-MM-DD without UTC shift from toISOString(). */
function todayLocal(): string {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10)
}

interface VisitFormState {
  visitDate: string
  farmId: string
  summary: string
  drafts: Record<string, FollowupDraft>
}

type VisitFormAction =
  | { type: 'reset'; defaultFarmId: number | undefined }
  | { type: 'setVisitDate'; value: string }
  | { type: 'setFarmId'; value: string }
  | { type: 'setSummary'; value: string }
  | { type: 'setStatus'; triageId: string; status: FollowedStatus }
  | { type: 'setNote'; triageId: string; note: string }
  | { type: 'setDrafts'; drafts: Record<string, FollowupDraft> }

function initVisitForm(defaultFarmId: number | undefined): VisitFormState {
  return {
    visitDate: todayLocal(),
    farmId: defaultFarmId != null ? String(defaultFarmId) : 'none',
    summary: '',
    drafts: {}
  }
}

function visitFormReducer(state: VisitFormState, action: VisitFormAction): VisitFormState {
  switch (action.type) {
    case 'reset':
      return initVisitForm(action.defaultFarmId)
    case 'setVisitDate':
      return { ...state, visitDate: action.value }
    case 'setFarmId':
      return { ...state, farmId: action.value }
    case 'setSummary':
      return { ...state, summary: action.value }
    case 'setStatus':
      return {
        ...state,
        drafts: {
          ...state.drafts,
          [action.triageId]: { ...state.drafts[action.triageId], status: action.status }
        }
      }
    case 'setNote':
      return {
        ...state,
        drafts: {
          ...state.drafts,
          [action.triageId]: { ...state.drafts[action.triageId], note: action.note }
        }
      }
    case 'setDrafts':
      return { ...state, drafts: action.drafts }
    default:
      return state
  }
}

export function RecordVisitDialog({
  access,
  farmerId,
  farms,
  defaultFarmId,
  onRecorded
}: RecordVisitDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<VisitableRecommendation[]>([])

  // Visit form fields are conceptually one unit (date, farm, summary, per-rec
  // follow-ups), so they live in a single reducer instead of four useStates —
  // one logical update (e.g. reset) becomes a single state transition.
  const [form, dispatchForm] = useReducer(visitFormReducer, defaultFarmId, initVisitForm)
  const createVisitMutation = useCreateVisit(access, farmerId)
  const submitting = createVisitMutation.isPending

  const reset = useCallback(() => {
    dispatchForm({ type: 'reset', defaultFarmId })
  }, [defaultFarmId])

  const loadRecommendations = useCallback(async () => {
    try {
      setLoading(true)
      const recs = await getVisitableRecommendations(access, farmerId)
      setRecommendations(recs)
      dispatchForm({
        type: 'setDrafts',
        drafts: Object.fromEntries(recs.map((r) => [r.triageId, { status: '', note: '' }]))
      })
    } catch (err) {
      Sentry.captureException(err, {
        tags: { context: 'getVisitableRecommendations' },
        extra: { farmerId }
      })
      toast.error(err instanceof Error ? err.message : 'Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }, [access, farmerId])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      reset()
      loadRecommendations()
      posthog.capture('consultant_visit_started', { farmer_id: farmerId })
    }
  }

  const setStatus = (triageId: string, status: FollowedStatus) => {
    dispatchForm({ type: 'setStatus', triageId, status })
  }
  const setNote = (triageId: string, note: string) => {
    dispatchForm({ type: 'setNote', triageId, note })
  }

  const verifiedCount = Object.values(form.drafts).filter((d) => d.status !== '').length

  const handleSubmit = async () => {
    const followups = Object.entries(form.drafts)
      .filter(([, d]) => d.status !== '')
      .map(([triageId, d]) => ({
        triageId,
        followedStatus: d.status as FollowedStatus,
        note: d.note
      }))

    if (followups.length === 0 && !form.summary.trim()) {
      toast.error('Verify at least one recommendation or add a visit note')
      return
    }

    try {
      const visit = await createVisitMutation.mutateAsync({
        farmerId,
        farmId: form.farmId === 'none' ? null : Number(form.farmId),
        visitDate: form.visitDate,
        summary: form.summary,
        followups
      })
      posthog.capture('consultant_visit_recorded', {
        farmer_id: farmerId,
        farm_scoped: form.farmId !== 'none',
        total_recommendations: recommendations.length,
        recommendations_verified: followups.length,
        followed_count: followups.filter((f) => f.followedStatus === 'followed').length,
        partially_followed_count: followups.filter((f) => f.followedStatus === 'partially_followed')
          .length,
        not_followed_count: followups.filter((f) => f.followedStatus === 'not_followed').length,
        has_summary: form.summary.trim().length > 0,
        role: access.role
      })
      toast.success('Visit recorded')
      onRecorded?.(visit)
      setOpen(false)
    } catch (err) {
      Sentry.captureException(err, {
        tags: { context: 'createVisit' },
        extra: { farmerId }
      })
      toast.error(err instanceof Error ? err.message : 'Failed to record visit')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <ClipboardCheck className="h-4 w-4" />
          Record Visit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Record Visit</DialogTitle>
          <DialogDescription>
            Log this visit and verify whether the farmer has followed each prior recommendation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Visit metadata */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="visit-date">Visit date</Label>
              <Input
                id="visit-date"
                type="date"
                value={form.visitDate}
                max={todayLocal()}
                onChange={(e) => dispatchForm({ type: 'setVisitDate', value: e.target.value })}
              />
            </div>
            {farms.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="visit-farm">Farm (optional)</Label>
                <Select
                  value={form.farmId}
                  onValueChange={(value) => dispatchForm({ type: 'setFarmId', value })}
                >
                  <SelectTrigger id="visit-farm">
                    <SelectValue placeholder="Select a farm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific farm</SelectItem>
                    {farms.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Recommendation follow-up */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Recommendation follow-up</Label>
              {recommendations.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  <span className="font-mono tabular-nums">
                    {verifiedCount}/{recommendations.length}
                  </span>{' '}
                  verified
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-2 py-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : recommendations.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No prior recommendations to verify for this farmer yet. You can still log this visit
                with a note below.
              </p>
            ) : (
              <div className="space-y-3">
                {recommendations.map((rec) => {
                  const draft = form.drafts[rec.triageId]
                  return (
                    <div key={rec.triageId} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {rec.classification && (
                          <Badge variant="secondary">{rec.classification}</Badge>
                        )}
                        {rec.farmName && (
                          <span className="text-xs text-muted-foreground">{rec.farmName}</span>
                        )}
                      </div>
                      <p className="mt-2 text-sm">{rec.recommendation}</p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {FOLLOWED_STATUSES.map((status) => (
                          <Button
                            key={status}
                            type="button"
                            size="sm"
                            variant={draft?.status === status ? 'default' : 'outline'}
                            onClick={() => setStatus(rec.triageId, status)}
                          >
                            {followedStatusLabels[status]}
                          </Button>
                        ))}
                      </div>

                      {draft?.status && (
                        <Textarea
                          value={draft.note}
                          onChange={(e) => setNote(rec.triageId, e.target.value)}
                          placeholder="Add a note (optional)"
                          className="mt-3"
                          rows={2}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Overall visit note */}
          <div className="space-y-2">
            <Label htmlFor="visit-summary">Visit notes (optional)</Label>
            <Textarea
              id="visit-summary"
              value={form.summary}
              onChange={(e) => dispatchForm({ type: 'setSummary', value: e.target.value })}
              placeholder="Overall observations from this visit"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || loading} className="gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? 'Saving…' : 'Save visit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
