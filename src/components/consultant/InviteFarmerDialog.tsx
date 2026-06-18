'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { UserPlus, Copy, Check, MessageCircle, Send, Loader2, RefreshCw } from 'lucide-react'
import { normalizePhone, toIndianNationalDigits } from '@/lib/phone'
import posthog from 'posthog-js'

interface InviteResult {
  inviteUrl: string
  organizationName: string
  /** E.164, e.g. +919876543210 — sms: uses it directly; wa.me uses it with the + stripped */
  e164: string
}

interface InviteFarmerDialogProps {
  organizationId: string
  /** Optional custom trigger; defaults to an "Invite Farmer" button. */
  trigger?: React.ReactNode
}

export function InviteFarmerDialog({ organizationId, trigger }: InviteFarmerDialogProps) {
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<InviteResult | null>(null)
  const [copied, setCopied] = useState(false)

  const reset = () => {
    setPhone('')
    setResult(null)
    setCopied(false)
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) reset()
  }

  const message = result
    ? `${result.organizationName} invited you to VineSight to manage your farm. Create your account here: ${result.inviteUrl}`
    : ''

  const handleCreate = async () => {
    // `phone` holds the 10-digit national number; the +91 country code is fixed in the UI.
    const normalized = normalizePhone(`+91${phone}`)
    if (!normalized) {
      toast.error('Enter a valid 10-digit mobile number')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/invite/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          phone: normalized.e164
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create invite')
      }

      setResult({
        inviteUrl: data.inviteUrl,
        organizationName: data.organizationName,
        e164: normalized.e164
      })
      posthog.capture('consultant_farmer_invite_created', { organization_id: organizationId })
    } catch (err) {
      // Don't forward raw error text to analytics: server messages can carry the invitee's
      // phone number (PII) and are unbounded/high-cardinality. Send a bounded category instead.
      const reason =
        err instanceof TypeError ? 'network_error' : err instanceof Error ? 'api_error' : 'unknown'
      posthog.capture('consultant_farmer_invite_failed', {
        organization_id: organizationId,
        reason
      })
      toast.error(err instanceof Error ? err.message : 'Failed to create invite')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.inviteUrl)
      setCopied(true)
      posthog.capture('consultant_invite_shared', {
        organization_id: organizationId,
        channel: 'copy'
      })
      toast.success('Invite link copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy link')
    }
  }

  const waHref = result
    ? `https://wa.me/${result.e164.replace('+', '')}?text=${encodeURIComponent(message)}`
    : '#'
  // iOS Messages only honors `&body=` (not `?body=`); Android accepts both. The leading `?`
  // opens the query string so the whole `&body=…` isn't parsed as the recipient on iOS.
  const smsHref = result ? `sms:${result.e164}?&body=${encodeURIComponent(message)}` : '#'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Farmer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Farmer</DialogTitle>
          <DialogDescription>
            {result
              ? 'Share this link with the farmer. They’ll be linked to your organization when they sign up.'
              : 'Generate a signup link to send to a farmer’s phone via WhatsApp or SMS.'}
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-phone">Phone number</Label>
              {/* +91 is a fixed, non-editable prefix; the input takes only the 10-digit
                  national number. toIndianNationalDigits keeps it digits-only and strips a
                  redundant 91/0 if the user pastes a full number, so the prefix never doubles up. */}
              <div className="flex">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                  +91
                </span>
                <Input
                  id="invite-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  className="rounded-l-none"
                  value={phone}
                  onChange={(e) => setPhone(toIndianNationalDigits(e.target.value))}
                  placeholder="98765 43210"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the 10-digit Indian mobile number, without the +91 country code.
              </p>
            </div>
            <Button
              onClick={handleCreate}
              disabled={submitting || phone.length !== 10}
              className="w-full gap-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {submitting ? 'Generating…' : 'Generate invite link'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Invite link</p>
              <p className="break-all text-sm">{result.inviteUrl}</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" onClick={handleCopy} className="gap-2">
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    posthog.capture('consultant_invite_shared', {
                      organization_id: organizationId,
                      channel: 'whatsapp'
                    })
                  }
                >
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <a
                  href={smsHref}
                  onClick={() =>
                    posthog.capture('consultant_invite_shared', {
                      organization_id: organizationId,
                      channel: 'sms'
                    })
                  }
                >
                  <Send className="h-4 w-4" />
                  SMS
                </a>
              </Button>
            </div>

            <Button variant="ghost" onClick={reset} className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              Invite another farmer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
