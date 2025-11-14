'use client'

import { useState, useEffect } from 'react'
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

export function TestReminderNotification({ farmId, compact = false }: TestReminderNotificationProps) {
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

  useEffect(() => {
    loadReminders()
  }, [farmId])

  const loadReminders = async () => {
    setLoading(true)
    try {
      const reminderData = await checkTestReminders(farmId)
      setReminders(reminderData)
    } catch (error) {
      console.error('Error loading test reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTest = () => {
    router.push(`/farms/${farmId}/lab-tests`)
  }

  const handleCreateReminder = async (testType: 'soil' | 'petiole') => {
    setCreatingTask(true)
    try {
      const title = testType === 'soil' ? 'Conduct Soil Test' : 'Conduct Petiole Test'
      const description =
        testType === 'soil'
          ? 'It has been over 4 months since the last soil test. Schedule a new soil test to check pH, EC, and nutrient levels for optimal fertilizer planning.'
          : 'It has been over 3 months since the last petiole test. Conduct a petiole test during active growth to monitor plant nutrient uptake and adjust fertigation.'

      await SupabaseService.createTask({
        farm_id: farmId,
        title,
        description,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        priority: 'medium',
        category: 'other',
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
  if (!reminders.soilTestNeeded && !reminders.petioleTestNeeded) return null

  // Compact version for dashboard cards
  if (compact) {
    return (
      <Card className="bg-amber-50 border-amber-300">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Bell className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-amber-900">Lab Test Reminder</h3>
                <Badge variant="outline" className="text-xs bg-amber-100 border-amber-400">
                  {reminders.soilTestNeeded && reminders.petioleTestNeeded
                    ? 'Both Due'
                    : reminders.soilTestNeeded
                      ? 'Soil Test'
                      : 'Petiole Test'}
                </Badge>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                {reminders.soilTestNeeded && (
                  <>
                    <strong>Soil test:</strong> Last test was{' '}
                    {reminders.soilTestAge ? `${reminders.soilTestAge} days ago` : 'over 4 months ago'}.
                    {reminders.petioleTestNeeded && <br />}
                  </>
                )}
                {reminders.petioleTestNeeded && (
                  <>
                    <strong>Petiole test:</strong> Last test was{' '}
                    {reminders.petioleTestAge
                      ? `${reminders.petioleTestAge} days ago`
                      : 'over 3 months ago'}
                    .
                  </>
                )}
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddTest} className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Test
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDismissed(true)}
                  className="h-7 text-xs"
                >
                  <X className="h-3 w-3" />
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
    <Alert className="bg-amber-50 border-amber-300">
      <FlaskConical className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-900 font-semibold">Time for Lab Tests</AlertTitle>
      <AlertDescription className="space-y-3">
        <div className="text-sm text-amber-800">
          {reminders.soilTestNeeded && (
            <div className="flex items-start gap-2 mb-2">
              <div className="mt-0.5">🌱</div>
              <div>
                <strong>Soil Test Overdue:</strong> Your last soil test was{' '}
                {reminders.soilTestAge ? (
                  <>
                    <Badge variant="outline" className="mx-1 bg-amber-100 border-amber-400">
                      {reminders.soilTestAge} days ago
                    </Badge>
                  </>
                ) : (
                  'over 4 months ago'
                )}
                . Regular soil testing (every 3-4 months) helps track pH, salinity, and nutrient levels for
                better fertilizer planning.
              </div>
            </div>
          )}
          {reminders.petioleTestNeeded && (
            <div className="flex items-start gap-2">
              <div className="mt-0.5">🍃</div>
              <div>
                <strong>Petiole Test Overdue:</strong> Your last petiole test was{' '}
                {reminders.petioleTestAge ? (
                  <>
                    <Badge variant="outline" className="mx-1 bg-amber-100 border-amber-400">
                      {reminders.petioleTestAge} days ago
                    </Badge>
                  </>
                ) : (
                  'over 3 months ago'
                )}
                . Petiole tests during active growth help monitor nutrient uptake and adjust fertigation timing.
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button size="sm" onClick={handleAddTest} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Lab Test Now
          </Button>
          {reminders.soilTestNeeded && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCreateReminder('soil')}
              disabled={creatingTask}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              {creatingTask ? 'Creating...' : 'Remind Me (Soil)'}
            </Button>
          )}
          {reminders.petioleTestNeeded && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCreateReminder('petiole')}
              disabled={creatingTask}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              {creatingTask ? 'Creating...' : 'Remind Me (Petiole)'}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Dismiss
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
