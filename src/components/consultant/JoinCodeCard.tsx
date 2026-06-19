'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Copy, Loader2, MessageSquareShare } from 'lucide-react'
import { getConsultantAccess, type ConsultantAccess } from '@/lib/consultant-access'
import { buildJoinMessage } from '@/lib/join-message'
import posthog from 'posthog-js'

interface JoinCodeCardProps {
  /**
   * Consultant access already loaded by the parent page. When provided, the card
   * reuses it instead of issuing its own `getConsultantAccess()` round-trip.
   */
  access?: ConsultantAccess | null
}

export function JoinCodeCard({ access: providedAccess = null }: JoinCodeCardProps = {}) {
  const [access, setAccess] = useState<ConsultantAccess | null>(providedAccess)
  const [loading, setLoading] = useState(providedAccess === null)
  const [error, setError] = useState(false)

  useEffect(() => {
    // Reuse the parent's access when it has it; only fetch as a fallback.
    if (providedAccess !== null) {
      setAccess(providedAccess)
      setLoading(false)
      setError(false)
      return
    }

    let active = true
    const load = async () => {
      try {
        const currentAccess = await getConsultantAccess()
        if (active) {
          setAccess(currentAccess)
          setError(false)
        }
      } catch (err) {
        console.error('Failed to load join code:', err)
        if (active) {
          setError(true)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      active = false
    }
  }, [providedAccess])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your join code…
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <p className="text-sm text-muted-foreground">
        Couldn’t load your join code. Please refresh to try again.
      </p>
    )
  }

  const joinCode = access?.joinCode ?? null

  if (!joinCode) {
    return (
      <p className="text-sm text-muted-foreground">
        No join code is set up for your organization yet.
      </p>
    )
  }

  const organizationName = access?.organizationName ?? null

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(joinCode)
      posthog.capture('consultant_join_code_copied', { org_id: access?.organizationId })
      toast.success('Join code copied')
    } catch {
      toast.error('Could not copy code')
    }
  }

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(buildJoinMessage(organizationName ?? '', joinCode))
      posthog.capture('consultant_join_message_copied', { org_id: access?.organizationId })
      toast.success('Invite message copied')
    } catch {
      toast.error('Could not copy message')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Onboard your farmers</CardTitle>
        <CardDescription>
          Farmers enter this code in the app’s Settings to connect to you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Join code</p>
          <p className="font-mono text-2xl font-semibold tracking-wide break-all">{joinCode}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleCopyCode} className="gap-2">
            <Copy className="h-4 w-4" />
            Copy code
          </Button>
          <Button variant="outline" onClick={handleCopyMessage} className="gap-2">
            <MessageSquareShare className="h-4 w-4" />
            Copy invite message
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
