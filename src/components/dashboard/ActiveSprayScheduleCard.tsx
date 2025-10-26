'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SprayCan, Calendar, CheckCircle2, Clock, AlertCircle, Package } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface SpraySchedule {
  id: string
  type: string // 'pesticide' | 'fungicide' | 'herbicide' | 'nutrient'
  targetPest?: string
  scheduledDate: Date
  status: 'upcoming' | 'today' | 'overdue' | 'completed'
  priority: 'high' | 'medium' | 'low'
  weatherDependent: boolean
  resources: {
    product: string
    quantity: string
    unit: string
    available: boolean
  }[]
  estimatedDuration?: number // minutes
  conditions?: string[]
}

interface ActiveSprayScheduleCardProps {
  farmId?: number
  tasks?: any[] // Existing tasks from dashboard
  loading?: boolean
  className?: string
  onStartSpray?: (sprayId: string) => void
  onScheduleSpray?: () => void
}

export function ActiveSprayScheduleCard({
  farmId,
  tasks = [],
  loading,
  className,
  onStartSpray,
  onScheduleSpray
}: ActiveSprayScheduleCardProps) {
  const [spraySchedules, setSpraySchedules] = useState<SpraySchedule[]>([])
  const [loadingSchedules, setLoadingSchedules] = useState(true)

  useEffect(() => {
    const fetchSpraySchedules = async () => {
      setLoadingSchedules(true)
      try {
        // TODO: Replace with actual spray schedule API
        // const schedules = await SupabaseService.getSpraySchedules(farmId)

        // For now, extract spray tasks from existing tasks and add mock data
        const sprayTasks = tasks
          .filter((task) => task.type === 'spray' || task.title?.toLowerCase().includes('spray'))
          .map((task) => {
            const scheduledDate = task.scheduledTime
              ? new Date(task.scheduledTime)
              : new Date(task.due_date || Date.now())
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            let status: SpraySchedule['status'] = 'upcoming'
            if (task.completed) {
              status = 'completed'
            } else if (scheduledDate < today) {
              status = 'overdue'
            } else if (
              scheduledDate.toDateString() === today.toDateString() ||
              scheduledDate <= new Date(today.getTime() + 24 * 60 * 60 * 1000)
            ) {
              status = 'today'
            }

            return {
              id: task.id,
              type: 'fungicide',
              targetPest: 'Powdery Mildew',
              scheduledDate,
              status,
              priority: task.priority || 'medium',
              weatherDependent: true,
              resources: [
                {
                  product: 'Sulfur WDG',
                  quantity: '2.5',
                  unit: 'kg',
                  available: true
                }
              ],
              estimatedDuration: task.estimatedDuration || 90
            } as SpraySchedule
          })

        // Add mock upcoming spray if no spray tasks exist
        if (sprayTasks.length === 0) {
          sprayTasks.push({
            id: 'mock-1',
            type: 'fungicide',
            targetPest: 'Downy Mildew Prevention',
            scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
            status: 'upcoming',
            priority: 'high',
            weatherDependent: true,
            resources: [
              {
                product: 'Mancozeb 75% WP',
                quantity: '2.0',
                unit: 'kg',
                available: true
              },
              {
                product: 'Spreader/Sticker',
                quantity: '100',
                unit: 'ml',
                available: false
              }
            ],
            estimatedDuration: 120,
            conditions: ['Temperature < 30°C', 'No rain expected for 6 hours', 'Low wind']
          })
        }

        setSpraySchedules(sprayTasks)
      } catch (error) {
        console.error('Failed to fetch spray schedules:', error)
      } finally {
        setLoadingSchedules(false)
      }
    }

    fetchSpraySchedules()
  }, [farmId, tasks])

  const getStatusBadge = (status: SpraySchedule['status']) => {
    switch (status) {
      case 'today':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            Today
          </Badge>
        )
      case 'overdue':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        )
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <Calendar className="h-3 w-3 mr-1" />
            Upcoming
          </Badge>
        )
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50/50'
      case 'medium':
        return 'border-l-amber-500 bg-amber-50/50'
      default:
        return 'border-l-blue-500 bg-blue-50/50'
    }
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    const diffDays = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`
    if (diffDays <= 7) return `In ${diffDays} days`

    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  }

  if (loading || loadingSchedules) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <SprayCan className="h-5 w-5" />
            Spray Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (spraySchedules.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <SprayCan className="h-5 w-5" />
            Spray Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">No upcoming sprays scheduled.</p>
          <Button size="sm" onClick={onScheduleSpray} className="w-full">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Spray
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Sort: overdue/today first, then by date
  const sortedSchedules = [...spraySchedules].sort((a, b) => {
    const statusPriority = { overdue: 0, today: 1, upcoming: 2, completed: 3 }
    if (statusPriority[a.status] !== statusPriority[b.status]) {
      return statusPriority[a.status] - statusPriority[b.status]
    }
    return a.scheduledDate.getTime() - b.scheduledDate.getTime()
  })

  const nextSpray = sortedSchedules.find((s) => s.status !== 'completed')

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <SprayCan className="h-5 w-5" />
          Spray Schedule
          {nextSpray && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {sortedSchedules.filter((s) => s.status !== 'completed').length} pending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Active/Next Spray - Highlighted */}
        {nextSpray && (
          <div
            className={cn(
              'border-l-4 rounded-lg p-4 transition-all',
              getPriorityColor(nextSpray.priority)
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm">{nextSpray.targetPest}</h4>
                  {getStatusBadge(nextSpray.status)}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(nextSpray.scheduledDate)}
                  {nextSpray.estimatedDuration && (
                    <>
                      <span className="mx-1">•</span>
                      <Clock className="h-3 w-3" />
                      {nextSpray.estimatedDuration} min
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Resources Needed */}
            <div className="space-y-2 mb-3">
              <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Package className="h-3 w-3" />
                Resources Needed
              </div>
              {nextSpray.resources.map((resource, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs bg-white rounded p-2"
                >
                  <div className="flex items-center gap-2">
                    {resource.available ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-red-600" />
                    )}
                    <span>{resource.product}</span>
                  </div>
                  <span className="font-medium">
                    {resource.quantity} {resource.unit}
                  </span>
                </div>
              ))}
            </div>

            {/* Conditions */}
            {nextSpray.conditions && nextSpray.conditions.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Ideal Conditions
                </div>
                <div className="flex flex-wrap gap-1">
                  {nextSpray.conditions.map((condition, idx) => (
                    <Badge key={idx} variant="outline" className="text-[10px]">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            {(nextSpray.status === 'today' || nextSpray.status === 'overdue') && (
              <Button size="sm" className="w-full" onClick={() => onStartSpray?.(nextSpray.id)}>
                <SprayCan className="h-4 w-4 mr-2" />
                Start Spray Application
              </Button>
            )}
          </div>
        )}

        {/* Other Upcoming Sprays */}
        {sortedSchedules.length > 1 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Other Scheduled</div>
            {sortedSchedules
              .filter((spray) => spray.id !== nextSpray?.id && spray.status !== 'completed')
              .slice(0, 2)
              .map((spray) => (
                <div
                  key={spray.id}
                  className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-200"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <SprayCan className="h-3 w-3 text-muted-foreground" />
                    <div className="text-xs">
                      <div className="font-medium">{spray.targetPest}</div>
                      <div className="text-muted-foreground">{formatDate(spray.scheduledDate)}</div>
                    </div>
                  </div>
                  {getStatusBadge(spray.status)}
                </div>
              ))}
          </div>
        )}

        {/* Schedule New Spray */}
        <Button variant="outline" size="sm" className="w-full text-xs" onClick={onScheduleSpray}>
          <Calendar className="h-3 w-3 mr-2" />
          Schedule Another Spray
        </Button>
      </CardContent>
    </Card>
  )
}
