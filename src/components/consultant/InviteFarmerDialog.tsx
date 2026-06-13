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
import { normalizePhone } from '@/lib/phone'

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
    const normalized = normalizePhone(phone)
    if (!normalized) {
      toast.error('Enter a valid phone number')
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
    } catch (err) {
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
      toast.success('Invite link copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy link')
    }
  }

  const waHref = result
    ? `https://wa.me/${result.e164.replace('+', '')}?text=${encodeURIComponent(message)}`
    : '#'
  // iOS Messages ignores `?body=` and only honors `&body=` (which Android accepts too).
  const smsHref = result ? `sms:${result.e164}&body=${encodeURIComponent(message)}` : '#'

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
              {/* type=tel stays free-form, but strip anything that isn't a digit, +, or
                  space as it's typed so letters can't be entered. normalizePhone still
                  validates and cleans the value on submit. */}
              <Input
                id="invite-phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s]/g, ''))}
                placeholder="e.g. 98765 43210"
              />
              <p className="text-xs text-muted-foreground">
                Indian numbers default to +91. Include the country code for other countries.
              </p>
            </div>
            <Button
              onClick={handleCreate}
              disabled={submitting || !phone.trim()}
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
                <a href={waHref} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <a href={smsHref}>
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
