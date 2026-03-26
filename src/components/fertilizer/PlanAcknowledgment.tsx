'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { TriageService, type AcknowledgmentType } from '@/lib/triage-service'
import { toast } from 'sonner'
import { CheckCircle2, HelpCircle, ThumbsUp, Loader2, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlanAcknowledgmentProps {
  triageId: string
  planTitle: string
  initialAcknowledgment?: AcknowledgmentType | null
  onAcknowledge?: (type: AcknowledgmentType) => void
}

const acknowledgmentOptions: {
  type: AcknowledgmentType
  emoji: string
  label: string
  description: string
  icon: typeof CheckCircle2
  color: string
}[] = [
  {
    type: 'understood',
    emoji: '👍',
    label: 'Understood',
    description: 'I understand the plan and will follow it',
    icon: CheckCircle2,
    color: 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100'
  },
  {
    type: 'questions',
    emoji: '❓',
    label: 'Questions',
    description: 'I have questions about the recommendations',
    icon: HelpCircle,
    color: 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100'
  },
  {
    type: 'thanks',
    emoji: '🙏',
    label: 'Thanks',
    description: 'Thank you for the guidance',
    icon: ThumbsUp,
    color: 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100'
  }
]

export function PlanAcknowledgment({
  triageId,
  planTitle,
  initialAcknowledgment,
  onAcknowledge
}: PlanAcknowledgmentProps) {
  const [selected, setSelected] = useState<AcknowledgmentType | null>(initialAcknowledgment || null)
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (type: AcknowledgmentType) => {
    if (loading) return

    try {
      setLoading(true)
      setSelected(type)

      await TriageService.submitAcknowledgment({
        triageId,
        acknowledgment: type,
        notes: notes.trim() || undefined
      })

      toast.success(
        type === 'understood'
          ? 'Marked as understood. Your agronomist will be notified.'
          : type === 'questions'
            ? 'Questions noted. Your agronomist will reach out to you.'
            : 'Thanks for your feedback!'
      )

      onAcknowledge?.(type)
      setShowNotes(false)
    } catch (error) {
      console.error('Failed to submit acknowledgment:', error)
      toast.error('Failed to submit. Please try again.')
      setSelected(initialAcknowledgment || null)
    } finally {
      setLoading(false)
    }
  }

  // If already acknowledged, show a read-only summary
  if (initialAcknowledgment) {
    const option = acknowledgmentOptions.find((o) => o.type === initialAcknowledgment)
    if (!option) return null

    const Icon = option.icon

    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon className="h-5 w-5 text-green-600" />
            Plan Acknowledged
          </CardTitle>
          <CardDescription>You {option.label.toLowerCase()} this fertilizer plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200">
            <span className="text-2xl" role="img" aria-label={option.label}>
              {option.emoji}
            </span>
            <div>
              <p className="font-medium text-green-900">{option.label}</p>
              <p className="text-sm text-green-700">{option.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-accent">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-accent" />
          Acknowledge Plan
        </CardTitle>
        <CardDescription>
          Let your agronomist know you received this fertilizer plan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Emoji buttons */}
        <div className="grid grid-cols-3 gap-2">
          {acknowledgmentOptions.map((option) => {
            const Icon = option.icon
            const isSelected = selected === option.type
            const isLoading = loading && selected === option.type

            return (
              <button
                key={option.type}
                onClick={() => handleSubmit(option.type)}
                disabled={loading}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                  isSelected ? 'border-accent bg-accent/10' : 'border-transparent hover:bg-muted',
                  option.color.split(' ').slice(1).join(' ') // Apply background colors
                )}
                aria-label={option.label}
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <span className="text-3xl" role="img" aria-label={option.label}>
                    {option.emoji}
                  </span>
                )}
                <span
                  className={cn(
                    'text-xs font-medium',
                    option.color.split(' ')[0] // Apply text color
                  )}
                >
                  {option.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Optional notes toggle */}
        {!showNotes ? (
          <Button variant="ghost" size="sm" onClick={() => setShowNotes(true)} className="w-full">
            Add a note (optional)
          </Button>
        ) : (
          <div className="space-y-2">
            <Textarea
              placeholder="Any questions or comments about this plan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNotes(false)
                  setNotes('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Your agronomist will see your response and follow up if needed
        </p>
      </CardContent>
    </Card>
  )
}
