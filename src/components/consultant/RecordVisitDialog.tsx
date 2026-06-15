'use client'

import { useState, useCallback } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ClipboardCheck, Loader2 } from 'lucide-react'
import { type ConsultantAccess } from '@/lib/consultant-access'
import {
  getVisitableRecommendations,
  createVisit,
  FOLLOWED_STATUSES,
  followedStatusLabels,
  type FollowedStatus,
  type VisitableRecommendation,
  type Visit
} from '@/lib/consultant-visit-service'

interface RecordVisitDialogProps {
  access: ConsultantAccess
  farmerId: string
  /** Farms belonging to this farmer, for the optional farm selector. */
  farms: { id: number; name: string }[]
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

export function RecordVisitDialog({ access, farmerId, farms, onRecorded }: RecordVisitDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [recommendations, setRecommendations] = useState<VisitableRecommendation[]>([])

  const [visitDate, setVisitDate] = useState(todayLocal())
  const [farmId, setFarmId] = useState<string>('none')
  const [summary, setSummary] = useState('')
  const [drafts, setDrafts] = useState<Record<string, FollowupDraft>>({})

  const reset = useCallback(() => {
    setVisitDate(todayLocal())
    setFarmId('none')
    setSummary('')
    setDrafts({})
    setRecommendations([])
  }, [])

  const loadRecommendations = useCallback(async () => {
    try {
      setLoading(true)
      const recs = await getVisitableRecommendations(access, farmerId)
      setRecommendations(recs)
      setDrafts(Object.fromEntries(recs.map((r) => [r.triageId, { status: '', note: '' }])))
    } catch (err) {
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
    }
  }

  const setStatus = (triageId: string, status: FollowedStatus) => {
    setDrafts((prev) => ({ ...prev, [triageId]: { ...prev[triageId], status } }))
  }
  const setNote = (triageId: string, note: string) => {
    setDrafts((prev) => ({ ...prev, [triageId]: { ...prev[triageId], note } }))
  }

  const verifiedCount = Object.values(drafts).filter((d) => d.status !== '').length

  const handleSubmit = async () => {
    const followups = Object.entries(drafts)
      .filter(([, d]) => d.status !== '')
      .map(([triageId, d]) => ({
        triageId,
        followedStatus: d.status as FollowedStatus,
        note: d.note
      }))

    if (followups.length === 0 && !summary.trim()) {
      toast.error('Verify at least one recommendation or add a visit note')
      return
    }

    try {
      setSubmitting(true)
      const visit = await createVisit(access, {
        farmerId,
        farmId: farmId === 'none' ? null : Number(farmId),
        visitDate,
        summary,
        followups
      })
      toast.success('Visit recorded')
      onRecorded?.(visit)
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record visit')
    } finally {
      setSubmitting(false)
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
                value={visitDate}
                max={todayLocal()}
                onChange={(e) => setVisitDate(e.target.value)}
              />
            </div>
            {farms.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="visit-farm">Farm (optional)</Label>
                <Select value={farmId} onValueChange={setFarmId}>
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
                  {verifiedCount}/{recommendations.length} verified
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading recommendations…
              </div>
            ) : recommendations.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No prior recommendations to verify for this farmer yet. You can still log this visit
                with a note below.
              </p>
            ) : (
              <div className="space-y-3">
                {recommendations.map((rec) => {
                  const draft = drafts[rec.triageId]
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
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
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
