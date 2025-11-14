'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { SupabaseService } from '@/lib/supabase-service'
import type { Recommendation } from '@/lib/lab-test-recommendations'
import { CheckCircle2, XCircle, Star, Loader2, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

interface OutcomeTrackerProps {
  testId: number
  testType: 'soil' | 'petiole'
  farmId: number
  recommendations: Recommendation[]
}

export function OutcomeTracker({
  testId,
  testType,
  farmId,
  recommendations
}: OutcomeTrackerProps) {
  const [loading, setLoading] = useState(true)
  const [outcomes, setOutcomes] = useState<any[]>([])
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)

  // Feedback form state
  const [feedbackData, setFeedbackData] = useState({
    followed: null as boolean | null,
    action_taken: '',
    satisfaction_rating: null as 1 | 2 | 3 | 4 | 5 | null,
    notes: ''
  })

  useEffect(() => {
    loadOutcomes()
  }, [testId])

  const loadOutcomes = async () => {
    setLoading(true)
    try {
      const data = await SupabaseService.getRecommendationOutcomes(testId)
      setOutcomes(data)
    } catch (error) {
      console.error('Error loading outcomes:', error)
      toast.error('Failed to load tracking data')
    } finally {
      setLoading(false)
    }
  }

  const openFeedbackDialog = (rec: Recommendation) => {
    setSelectedRec(rec)

    // Check if outcome already exists for this recommendation
    const existing = outcomes.find((o) => o.recommendation_parameter === rec.parameter)

    if (existing) {
      setFeedbackData({
        followed: existing.followed,
        action_taken: existing.action_taken || '',
        satisfaction_rating: existing.satisfaction_rating,
        notes: existing.notes || ''
      })
    } else {
      setFeedbackData({
        followed: null,
        action_taken: '',
        satisfaction_rating: null,
        notes: ''
      })
    }

    setShowFeedbackDialog(true)
  }

  const handleSaveFeedback = async () => {
    if (!selectedRec) return

    try {
      // Check if outcome already exists
      const existing = outcomes.find((o) => o.recommendation_parameter === selectedRec.parameter)

      if (existing) {
        // Update existing outcome
        await SupabaseService.updateRecommendationOutcome(existing.id, {
          followed: feedbackData.followed,
          action_taken: feedbackData.action_taken || null,
          satisfaction_rating: feedbackData.satisfaction_rating,
          notes: feedbackData.notes || null,
          action_date: feedbackData.followed ? new Date().toISOString().split('T')[0] : null
        })
      } else {
        // Create new outcome
        await SupabaseService.createRecommendationOutcome({
          test_id: testId,
          test_type: testType,
          farm_id: farmId,
          recommendation_parameter: selectedRec.parameter,
          recommendation_priority: selectedRec.priority,
          recommendation_text: selectedRec.simple,
          followed: feedbackData.followed,
          action_taken: feedbackData.action_taken || null,
          action_date: feedbackData.followed ? new Date().toISOString().split('T')[0] : null,
          satisfaction_rating: feedbackData.satisfaction_rating,
          notes: feedbackData.notes || null
        })
      }

      toast.success('Feedback saved successfully!')
      setShowFeedbackDialog(false)
      loadOutcomes()
    } catch (error) {
      console.error('Error saving feedback:', error)
      toast.error('Failed to save feedback')
    }
  }

  const getOutcomeStatus = (rec: Recommendation) => {
    const outcome = outcomes.find((o) => o.recommendation_parameter === rec.parameter)
    if (!outcome) return null

    return {
      followed: outcome.followed,
      satisfaction: outcome.satisfaction_rating,
      hasNotes: !!outcome.notes
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-red-600 text-red-700 bg-red-50'
      case 'high':
        return 'border-orange-600 text-orange-700 bg-orange-50'
      case 'moderate':
        return 'border-yellow-600 text-yellow-700 bg-yellow-50'
      case 'optimal':
        return 'border-green-600 text-green-700 bg-green-50'
      default:
        return 'border-blue-600 text-blue-700 bg-blue-50'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  // Get actionable recommendations (critical, high, moderate)
  const actionableRecs = recommendations.filter(
    (r) => r.priority === 'critical' || r.priority === 'high' || r.priority === 'moderate'
  )

  // Calculate tracking stats
  const trackedCount = actionableRecs.filter((r) => {
    const outcome = outcomes.find((o) => o.recommendation_parameter === r.parameter)
    return outcome?.followed !== null && outcome?.followed !== undefined
  }).length

  const followedCount = outcomes.filter((o) => o.followed === true).length

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            📊 Recommendation Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3 text-center">
                <div className="text-xl font-bold text-blue-700">{actionableRecs.length}</div>
                <div className="text-xs text-blue-600 font-medium">Recommendations</div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-3 text-center">
                <div className="text-xl font-bold text-purple-700">
                  {trackedCount}/{actionableRecs.length}
                </div>
                <div className="text-xs text-purple-600 font-medium">Tracked</div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-3 text-center">
                <div className="text-xl font-bold text-green-700">{followedCount}</div>
                <div className="text-xs text-green-600 font-medium">Followed</div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations List */}
          <div className="space-y-2">
            <div className="text-sm font-semibold">Track Your Actions:</div>

            {actionableRecs.map((rec, idx) => {
              const status = getOutcomeStatus(rec)

              return (
                <div key={idx} className={`border rounded-lg p-3 ${getPriorityColor(rec.priority)}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg">{rec.icon}</span>
                        <Badge variant="outline" className="text-xs">
                          {rec.priority.toUpperCase()}
                        </Badge>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {rec.parameter.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm leading-relaxed">{rec.simple}</p>

                      {/* Status indicators */}
                      {status && (
                        <div className="flex items-center gap-3 mt-2">
                          {status.followed !== null && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                status.followed
                                  ? 'bg-green-100 border-green-400 text-green-700'
                                  : 'bg-gray-100 border-gray-400 text-gray-700'
                              }`}
                            >
                              {status.followed ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Followed
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Not Followed
                                </>
                              )}
                            </Badge>
                          )}

                          {status.satisfaction && (
                            <div className="flex items-center gap-1">
                              {[...Array(status.satisfaction)].map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                              ))}
                            </div>
                          )}

                          {status.hasNotes && (
                            <Badge variant="outline" className="text-xs bg-blue-50">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Has notes
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openFeedbackDialog(rec)}
                      className="flex-shrink-0"
                    >
                      {status ? 'Update' : 'Track'}
                    </Button>
                  </div>
                </div>
              )
            })}

            {actionableRecs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">All parameters are in optimal range!</p>
                <p className="text-xs mt-1">No action items to track.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Track Recommendation Outcome</DialogTitle>
            <DialogDescription>
              {selectedRec && (
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{selectedRec.icon}</span>
                    <span className="font-medium capitalize">
                      {selectedRec.parameter.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm">{selectedRec.simple}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Did you follow? */}
            <div className="space-y-2">
              <Label>Did you follow this recommendation?</Label>
              <div className="flex gap-2">
                <Button
                  variant={feedbackData.followed === true ? 'default' : 'outline'}
                  onClick={() => setFeedbackData({ ...feedbackData, followed: true })}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Yes, I followed it
                </Button>
                <Button
                  variant={feedbackData.followed === false ? 'default' : 'outline'}
                  onClick={() => setFeedbackData({ ...feedbackData, followed: false })}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  No, I didn't
                </Button>
              </div>
            </div>

            {/* What action did you take? */}
            {feedbackData.followed === true && (
              <div className="space-y-2">
                <Label htmlFor="action_taken">What action did you take?</Label>
                <Textarea
                  id="action_taken"
                  placeholder="Describe what you did... (e.g., Applied 15 kg Gypsum per acre)"
                  value={feedbackData.action_taken}
                  onChange={(e) =>
                    setFeedbackData({ ...feedbackData, action_taken: e.target.value })
                  }
                  rows={3}
                />
              </div>
            )}

            {/* Satisfaction rating */}
            {feedbackData.followed !== null && (
              <div className="space-y-2">
                <Label>
                  {feedbackData.followed
                    ? 'How satisfied are you with the results?'
                    : 'How would you rate this recommendation?'}
                </Label>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() =>
                        setFeedbackData({
                          ...feedbackData,
                          satisfaction_rating: rating as 1 | 2 | 3 | 4 | 5
                        })
                      }
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          feedbackData.satisfaction_rating &&
                          rating <= feedbackData.satisfaction_rating
                            ? 'fill-yellow-500 text-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-xs text-center text-muted-foreground">
                  {feedbackData.satisfaction_rating
                    ? `${feedbackData.satisfaction_rating} star${feedbackData.satisfaction_rating > 1 ? 's' : ''}`
                    : 'Tap to rate'}
                </div>
              </div>
            )}

            {/* Additional notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any observations, challenges, or learnings..."
                value={feedbackData.notes}
                onChange={(e) => setFeedbackData({ ...feedbackData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveFeedback}
              disabled={feedbackData.followed === null}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Save Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
