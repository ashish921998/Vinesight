'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CheckCircle2, XCircle, MessageSquare } from 'lucide-react'

interface TaskFeedbackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: 'accept' | 'reject' | 'complete'
  taskType: string
  onSubmit: (feedback?: string) => Promise<void>
}

export function TaskFeedbackModal({
  open,
  onOpenChange,
  action,
  taskType,
  onSubmit
}: TaskFeedbackModalProps) {
  const [feedback, setFeedback] = useState('')
  const [selectedReason, setSelectedReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const getRejectReasons = () => {
    return [
      { value: 'not_applicable', label: 'Not applicable to my farm' },
      { value: 'wrong_timing', label: 'Wrong timing' },
      { value: 'already_done', label: 'Already completed this task' },
      { value: 'different_approach', label: 'I prefer a different approach' },
      { value: 'resource_unavailable', label: 'Required resources not available' },
      { value: 'other', label: 'Other reason' }
    ]
  }

  const getCompleteReasons = () => {
    return [
      { value: 'successful', label: 'Task completed successfully' },
      { value: 'partial', label: 'Partially completed' },
      { value: 'modified', label: 'Completed with modifications' },
      { value: 'delayed', label: 'Completed but later than recommended' },
      { value: 'other', label: 'Other' }
    ]
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const feedbackText =
        selectedReason && selectedReason !== 'other'
          ? `${selectedReason}: ${feedback}`.trim()
          : feedback
      await onSubmit(feedbackText || undefined)
      // Reset form
      setFeedback('')
      setSelectedReason('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkip = async () => {
    setSubmitting(true)
    try {
      await onSubmit(undefined)
      setFeedback('')
      setSelectedReason('')
    } finally {
      setSubmitting(false)
    }
  }

  const getDialogContent = () => {
    if (action === 'reject') {
      return {
        icon: <XCircle className="h-6 w-6 text-red-500" />,
        title: 'Reject Task Recommendation',
        description:
          'Help us improve future recommendations by sharing why this task is not suitable.',
        reasons: getRejectReasons()
      }
    } else if (action === 'complete') {
      return {
        icon: <CheckCircle2 className="h-6 w-6 text-green-500" />,
        title: 'Mark Task as Completed',
        description: 'How did the task go? Your feedback helps improve our recommendations.',
        reasons: getCompleteReasons()
      }
    }
    // accept case (though we might not show modal for accept)
    return {
      icon: <MessageSquare className="h-6 w-6 text-blue-500" />,
      title: 'Task Accepted',
      description: 'Any additional notes about this task?',
      reasons: []
    }
  }

  const content = getDialogContent()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            {content.icon}
            <DialogTitle>{content.title}</DialogTitle>
          </div>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quick Reasons (for reject/complete) */}
          {content.reasons.length > 0 && (
            <div className="space-y-2">
              <Label>Select a reason (optional)</Label>
              <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
                {content.reasons.map((reason) => (
                  <div key={reason.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={reason.value} id={reason.value} />
                    <Label htmlFor={reason.value} className="font-normal cursor-pointer">
                      {reason.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Additional Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback">
              Additional feedback (optional)
              {selectedReason === 'other' && (
                <span className="text-red-500 ml-1">- Please explain</span>
              )}
            </Label>
            <Textarea
              id="feedback"
              placeholder={
                action === 'reject'
                  ? 'Tell us why this recommendation was not helpful...'
                  : 'Share details about how the task went...'
              }
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Task Type Context */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <strong>Task:</strong> {taskType.replace('_', ' ').toUpperCase()}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleSkip} disabled={submitting} className="w-full sm:w-auto">
            Skip Feedback
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || (selectedReason === 'other' && !feedback.trim())}
            className="w-full sm:w-auto"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
