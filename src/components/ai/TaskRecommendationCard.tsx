'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  CloudRain,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Droplets,
  Spray,
  Package,
  Scissors,
  Flask,
  FileText,
  Info
} from 'lucide-react'
import { type AITaskRecommendation } from '@/types/ai'
import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns'
import { TaskFeedbackModal } from './TaskFeedbackModal'

interface TaskRecommendationCardProps {
  task: AITaskRecommendation
  onAccept: () => Promise<void>
  onReject: (feedback?: string) => Promise<void>
  onComplete: (feedback?: string) => Promise<void>
}

export function TaskRecommendationCard({
  task,
  onAccept,
  onReject,
  onComplete
}: TaskRecommendationCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackAction, setFeedbackAction] = useState<'accept' | 'reject' | 'complete'>('accept')
  const [processing, setProcessing] = useState(false)

  const getTaskIcon = (taskType: string) => {
    const icons = {
      irrigation: Droplets,
      spray: Spray,
      harvest: Package,
      fertigation: Droplets,
      pruning: Scissors,
      soil_test: Flask,
      petiole_test: Flask,
      expense: FileText,
      note: FileText
    }
    const Icon = icons[taskType as keyof typeof icons] || CheckCircle2
    return <Icon className="h-5 w-5" />
  }

  const getTaskColor = (taskType: string) => {
    const colors = {
      irrigation: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-l-blue-500' },
      spray: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-l-purple-500' },
      harvest: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-l-green-500' },
      fertigation: { bg: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-l-cyan-500' },
      pruning: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-l-orange-500' },
      soil_test: { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-l-yellow-500' },
      petiole_test: { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-l-pink-500' }
    }
    return (
      colors[taskType as keyof typeof colors] || {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        border: 'border-l-gray-500'
      }
    )
  }

  const getPriorityBadge = () => {
    if (task.priorityScore >= 0.8) {
      return (
        <Badge variant="destructive" className="text-xs">
          High Priority
        </Badge>
      )
    }
    if (task.priorityScore >= 0.5) {
      return (
        <Badge variant="default" className="text-xs">
          Medium Priority
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="text-xs">
        Low Priority
      </Badge>
    )
  }

  const getDateDisplay = () => {
    const date = new Date(task.recommendedDate)

    if (isPast(date) && !isToday(date)) {
      return {
        text: format(date, 'MMM d, yyyy'),
        subtext: 'Overdue',
        color: 'text-red-600',
        urgent: true
      }
    }

    if (isToday(date)) {
      return {
        text: 'Today',
        subtext: format(date, 'h:mm a'),
        color: 'text-orange-600',
        urgent: true
      }
    }

    if (isTomorrow(date)) {
      return {
        text: 'Tomorrow',
        subtext: format(date, 'h:mm a'),
        color: 'text-blue-600',
        urgent: false
      }
    }

    return {
      text: format(date, 'MMM d, yyyy'),
      subtext: formatDistanceToNow(date, { addSuffix: true }),
      color: 'text-gray-600',
      urgent: false
    }
  }

  const handleAccept = async () => {
    setProcessing(true)
    try {
      await onAccept()
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectClick = () => {
    setFeedbackAction('reject')
    setShowFeedbackModal(true)
  }

  const handleCompleteClick = () => {
    setFeedbackAction('complete')
    setShowFeedbackModal(true)
  }

  const handleFeedbackSubmit = async (feedback?: string) => {
    setProcessing(true)
    try {
      if (feedbackAction === 'reject') {
        await onReject(feedback)
      } else if (feedbackAction === 'complete') {
        await onComplete(feedback)
      }
      setShowFeedbackModal(false)
    } finally {
      setProcessing(false)
    }
  }

  const colors = getTaskColor(task.taskType)
  const dateInfo = getDateDisplay()

  return (
    <>
      <Card className={`border-l-4 ${colors.border} ${dateInfo.urgent ? 'ring-1 ring-orange-100' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className={`p-2 rounded-lg ${colors.bg}`}>
                <div className={colors.text}>{getTaskIcon(task.taskType)}</div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-base capitalize">
                    {task.taskType.replace('_', ' ')}
                  </h3>
                  {getPriorityBadge()}
                  {task.weatherDependent && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <CloudRain className="h-3 w-3" />
                      Weather Dependent
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-700 mb-2">{task.reasoning}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className={`flex items-center gap-1 ${dateInfo.color}`}>
                    <Calendar className="h-3 w-3" />
                    {dateInfo.text}
                  </div>
                  {task.taskDetails.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {task.taskDetails.duration} min
                    </div>
                  )}
                </div>
                {dateInfo.urgent && (
                  <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    {dateInfo.subtext}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {/* Confidence Score */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">AI Confidence</span>
              <span className="font-medium">{Math.round(task.confidenceScore * 100)}%</span>
            </div>
            <Progress value={task.confidenceScore * 100} className="h-2" />
          </div>

          {/* Expandable Details */}
          {(task.taskDetails.resources ||
            task.taskDetails.conditions ||
            task.taskDetails.alternatives) && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="w-full justify-between text-xs h-8"
              >
                <span className="flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {expanded ? 'Hide' : 'Show'} Task Details
                </span>
                {expanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>

              {expanded && (
                <div className="mt-2 space-y-2 text-xs bg-gray-50 p-3 rounded-lg">
                  {task.taskDetails.resources && task.taskDetails.resources.length > 0 && (
                    <div>
                      <div className="font-medium text-gray-700 mb-1">Required Resources:</div>
                      <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                        {task.taskDetails.resources.map((resource, idx) => (
                          <li key={idx}>{resource}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {task.taskDetails.conditions && task.taskDetails.conditions.length > 0 && (
                    <div>
                      <div className="font-medium text-gray-700 mb-1">Conditions:</div>
                      <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                        {task.taskDetails.conditions.map((condition, idx) => (
                          <li key={idx}>{condition}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {task.taskDetails.alternatives && task.taskDetails.alternatives.length > 0 && (
                    <div>
                      <div className="font-medium text-gray-700 mb-1">Alternatives:</div>
                      <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                        {task.taskDetails.alternatives.map((alt, idx) => (
                          <li key={idx}>{alt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleAccept}
              disabled={processing}
              className="flex-1"
              variant={task.priorityScore >= 0.8 ? 'default' : 'outline'}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Accept
            </Button>
            <Button
              onClick={handleCompleteClick}
              disabled={processing}
              variant="outline"
              className="flex-1"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Mark Done
            </Button>
            <Button
              onClick={handleRejectClick}
              disabled={processing}
              variant="ghost"
              size="icon"
              className="w-10"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>

          {/* Expiration Notice */}
          {task.expiresAt && (
            <div className="text-xs text-gray-500 text-center">
              Expires {formatDistanceToNow(new Date(task.expiresAt), { addSuffix: true })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback Modal */}
      <TaskFeedbackModal
        open={showFeedbackModal}
        onOpenChange={setShowFeedbackModal}
        action={feedbackAction}
        taskType={task.taskType}
        onSubmit={handleFeedbackSubmit}
      />
    </>
  )
}
