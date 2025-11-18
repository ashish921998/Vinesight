'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { checkTestReminders } from '@/lib/lab-test-integration'
import { SupabaseService } from '@/lib/supabase-service'
import { FlaskConical, Calendar, Plus, X, Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface TestReminderNotificationProps {
  farmId: number
  compact?: boolean
}

export function TestReminderNotification({
  farmId,
  compact = false
}: TestReminderNotificationProps) {
  const router = useRouter()
  const [reminders, setReminders] = useState<{
    soilTestNeeded: boolean
    petioleTestNeeded: boolean
    soilTestAge?: number
    petioleTestAge?: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [creatingTask, setCreatingTask] = useState(false)
  const [hasSoilTestTask, setHasSoilTestTask] = useState(false)
  const [hasPetioleTestTask, setHasPetioleTestTask] = useState(false)

  useEffect(() => {
    setDismissed(false)
  }, [farmId])

  const loadReminders = useCallback(async () => {
    setLoading(true)
    try {
      const [reminderData, tasks] = await Promise.all([
        checkTestReminders(farmId),
        SupabaseService.getPendingTasks(farmId)
      ])

      setReminders(reminderData)

      // Check if there are already pending tasks for soil or petiole tests
      const hasSoilTask = tasks.some(
        (task) =>
          task.type === 'soil_test' && (task.status === 'pending' || task.status === 'in_progress')
      )
      const hasPetioleTask = tasks.some(
        (task) =>
          task.type === 'petiole_test' &&
          (task.status === 'pending' || task.status === 'in_progress')
      )

      setHasSoilTestTask(hasSoilTask)
      setHasPetioleTestTask(hasPetioleTask)
    } catch (error) {
      console.error('Error loading test reminders:', error)
    } finally {
      setLoading(false)
    }
  }, [farmId])

  useEffect(() => {
    loadReminders()
  }, [loadReminders])

  const handleAddTest = () => {
    router.push(`/farms/${farmId}/lab-tests`)
  }

  const handleCreateReminder = async (testType: 'soil' | 'petiole') => {
    setCreatingTask(true)
    try {
      const title = testType === 'soil' ? 'Conduct Soil Test' : 'Conduct Petiole Test'
      const description =
        testType === 'soil'
          ? 'It has been over 2 years since the last soil test. Schedule a new soil test to check pH, EC, and nutrient levels for optimal fertilizer planning.'
          : 'It has been over 3 months since the last petiole test. Conduct a petiole test during active growth to monitor plant nutrient uptake and adjust fertigation.'

      await SupabaseService.addTaskReminder({
        farmId,
        title,
        description,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        priority: 'medium',
        type: testType === 'soil' ? 'soil_test' : 'petiole_test',
        status: 'pending'
      })

      toast.success(`Reminder task created: ${title}`)
      setDismissed(true)
    } catch (error) {
      console.error('Error creating reminder task:', error)
      toast.error('Failed to create reminder task')
    } finally {
      setCreatingTask(false)
    }
  }

  // Don't show if loading, dismissed, or no reminders needed
  if (loading || dismissed || !reminders) return null

  // Don't show soil test reminder if there's already a pending/in-progress task for it
  const showSoilReminder = reminders.soilTestNeeded && !hasSoilTestTask
  const showPetioleReminder = reminders.petioleTestNeeded && !hasPetioleTestTask

  // Don't show component if there are no reminders to show
  if (!showSoilReminder && !showPetioleReminder) return null

  // Compact version for dashboard cards
  if (compact) {
    return (
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm text-foreground">Lab Test Reminder</h3>
                <Badge
                  variant="outline"
                  className="text-xs bg-primary/10 border-primary/30 text-primary whitespace-nowrap"
                >
                  {showSoilReminder && showPetioleReminder
                    ? 'Both Due'
                    : showSoilReminder
                      ? 'Soil Test'
                      : 'Petiole Test'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {showSoilReminder && (
                  <>
                    <strong className="text-foreground">Soil test:</strong> Last test was{' '}
                    {reminders.soilTestAge
                      ? `${reminders.soilTestAge} days ago`
                      : 'over 2 years ago'}
                    {'.'}
                    {showPetioleReminder && <br />}
                  </>
                )}
                {showPetioleReminder && (
                  <>
                    <strong className="text-foreground">Petiole test:</strong> Last test was{' '}
                    {reminders.petioleTestAge
                      ? `${reminders.petioleTestAge} days ago`
                      : 'over 3 months ago'}
                    .
                  </>
                )}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" onClick={handleAddTest} className="h-8 text-xs px-3">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Test
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDismissed(true)}
                  className="h-8 w-8 p-0"
                  aria-label="Dismiss reminder"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Full version for main pages
  return (
    <Alert className="bg-primary/5 border-primary/20 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <FlaskConical className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <AlertTitle className="text-foreground font-semibold text-base mb-1">
            Lab Test Reminder
          </AlertTitle>
          {showSoilReminder && showPetioleReminder ? (
            <Badge
              variant="outline"
              className="bg-primary/10 border-primary/30 text-primary text-xs"
            >
              Both Tests Due
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-primary/10 border-primary/30 text-primary text-xs"
            >
              {showSoilReminder ? 'Soil Test Due' : 'Petiole Test Due'}
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setDismissed(true)}
          className="h-9 w-9 p-0 -mt-1 -mr-2"
          aria-label="Dismiss reminder"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <AlertDescription className="space-y-2">
        {showSoilReminder && (
          <div className="rounded-2xl bg-background/50 border border-border/40 p-3">
            <div className="flex items-start gap-2.5 mb-2.5">
              <div className="text-lg leading-none mt-0.5">🌱</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground text-sm mb-1">Soil Test</div>
                <p className="text-muted-foreground text-xs leading-snug">
                  Last test{' '}
                  {reminders.soilTestAge ? (
                    <span className="font-semibold text-primary">
                      {reminders.soilTestAge} days ago
                    </span>
                  ) : (
                    <span className="font-semibold text-primary">2+ years ago</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={handleAddTest} size="sm" className="w-full h-9 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Test
              </Button>
              {!hasSoilTestTask && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreateReminder('soil')}
                  disabled={creatingTask}
                  className="w-full h-9 text-xs"
                >
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  {creatingTask ? 'Creating...' : 'Remind Later'}
                </Button>
              )}
            </div>
          </div>
        )}

        {showPetioleReminder && (
          <div className="rounded-2xl bg-background/50 border border-border/40 p-3">
            <div className="flex items-start gap-2.5 mb-2.5">
              <div className="text-lg leading-none mt-0.5">🍃</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground text-sm mb-1">Petiole Test</div>
                <p className="text-muted-foreground text-xs leading-snug">
                  Last test{' '}
                  {reminders.petioleTestAge ? (
                    <span className="font-semibold text-primary">
                      {reminders.petioleTestAge} days ago
                    </span>
                  ) : (
                    <span className="font-semibold text-primary">3+ months ago</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={handleAddTest} size="sm" className="w-full h-9 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Test
              </Button>
              {!hasPetioleTestTask && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreateReminder('petiole')}
                  disabled={creatingTask}
                  className="w-full h-9 text-xs"
                >
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  {creatingTask ? 'Creating...' : 'Remind Later'}
                </Button>
              )}
            </div>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}
