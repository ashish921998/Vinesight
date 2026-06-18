'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { IndianRupee, Loader2, CircleAlert } from 'lucide-react'
import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'
import { setClientPaymentStatus } from '@/lib/consultant-query-service'

interface PaidToggleButtonProps {
  /** organization_clients.id */
  clientRecordId: string
  isPaid: boolean
  size?: 'sm' | 'default'
  onChange?: (isPaid: boolean) => void
}

/**
 * Single button that toggles a farmer's payment status. Green when paid, amber
 * "Unpaid" otherwise. Optimistic with rollback on failure.
 */
export function PaidToggleButton({
  clientRecordId,
  isPaid,
  size = 'sm',
  onChange
}: PaidToggleButtonProps) {
  const [paid, setPaid] = useState(isPaid)
  const [saving, setSaving] = useState(false)

  const toggle = async (e: React.MouseEvent) => {
    // Cards often wrap the button in a link; don't navigate when toggling.
    e.preventDefault()
    e.stopPropagation()
    if (saving) return

    const next = !paid
    setPaid(next)
    setSaving(true)
    try {
      const confirmed = await setClientPaymentStatus(clientRecordId, next)
      setPaid(confirmed)
      onChange?.(confirmed)
      posthog.capture('consultant_client_payment_toggled', {
        client_record_id: clientRecordId,
        is_paid: confirmed
      })
      toast.success(confirmed ? 'Marked as paid' : 'Marked as unpaid')
    } catch (err) {
      setPaid(!next) // rollback
      Sentry.captureException(err, {
        tags: { context: 'set_client_payment_status' },
        extra: { clientRecordId }
      })
      toast.error(err instanceof Error ? err.message : 'Failed to update payment status')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant={paid ? 'default' : 'outline'}
      onClick={toggle}
      disabled={saving}
      className={
        paid
          ? 'gap-1.5 bg-green-600 text-white hover:bg-green-700'
          : 'gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50'
      }
    >
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : paid ? (
        <IndianRupee className="h-4 w-4" />
      ) : (
        <CircleAlert className="h-4 w-4" />
      )}
      {paid ? 'Paid' : 'Unpaid'}
    </Button>
  )
}
