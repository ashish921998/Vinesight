'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Copy, MessageSquareShare } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { type ConsultantAccess } from '@/lib/consultant-access'
import { useConsultantAccess } from '@/hooks/consultant/useConsultantQueries'
import { buildJoinMessage } from '@/lib/join-message'
import posthog from 'posthog-js'

interface JoinCodeCardProps {
  /**
   * Consultant access already loaded by the parent page. When provided, the card
   * reuses it instead of issuing its own `getConsultantAccess()` round-trip.
   */
  access?: ConsultantAccess | null
}

export function JoinCodeCard(props: JoinCodeCardProps = {}) {
  const hasProvidedAccess = Object.prototype.hasOwnProperty.call(props, 'access')
  const providedAccess = props.access ?? null
  const fallbackAccessQuery = useConsultantAccess(!hasProvidedAccess)

  // Derive the effective state: a parent-provided access is authoritative and is
  // never loading or errored; otherwise fall back to the cached access query.
  const access = hasProvidedAccess ? providedAccess : (fallbackAccessQuery.data ?? null)
  const loading = !hasProvidedAccess && fallbackAccessQuery.isPending
  const error = !hasProvidedAccess && fallbackAccessQuery.isError

  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-4">
          <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-40" />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
          </div>
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
        <Card className="gap-0 bg-muted/40 p-4">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Join code</p>
          <p className="font-mono text-2xl font-semibold tracking-wide tabular-nums break-all">
            {joinCode}
          </p>
        </Card>

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
