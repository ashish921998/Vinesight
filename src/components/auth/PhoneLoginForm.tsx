'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowLeft } from 'lucide-react'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { normalizePhone } from '@/lib/phone'
import posthog from 'posthog-js'

interface PhoneLoginFormProps {
  onSuccess: () => void
}

/**
 * Two-step phone OTP sign-in: enter phone → receive SMS code → verify.
 * Reuses the same Supabase phone-OTP plumbing as the farmer invite flow.
 */
export function PhoneLoginForm({ onSuccess }: PhoneLoginFormProps) {
  const { sendPhoneOtp, verifyPhoneOtp, loading } = useSupabaseAuth()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [e164, setE164] = useState('')
  const [token, setToken] = useState('')

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const normalized = normalizePhone(phone)
    if (!normalized) return

    // Login must not create accounts: an unknown number should fail, not spin up
    // an orphaned auth user with no profile/org. Farmer accounts come from invites.
    const result = await sendPhoneOtp({ phone: normalized.e164, shouldCreateUser: false })
    posthog.capture('login_otp_requested', { method: 'phone', success: result.success })
    if (result.success) {
      setE164(normalized.e164)
      setStep('otp')
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (token.length < 6) return

    const result = await verifyPhoneOtp({ phone: e164, token })
    posthog.capture('login_submitted', { method: 'phone', success: result.success })
    if (result.success) {
      onSuccess()
    }
  }

  if (step === 'otp') {
    return (
      <form onSubmit={handleVerify} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone-otp">Enter the code sent to {e164}</Label>
          <Input
            id="phone-otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
            placeholder="6-digit code"
            className="tracking-[0.5em] text-center text-lg"
          />
        </div>
        <Button type="submit" disabled={loading || token.length < 6} className="w-full h-12">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify & sign in'}
        </Button>
        <button
          type="button"
          onClick={() => {
            setStep('phone')
            setToken('')
          }}
          className="flex items-center justify-center gap-1 w-full text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Use a different number
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSend} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone-login">Phone number</Label>
        <Input
          id="phone-login"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s]/g, ''))}
          placeholder="e.g. 98765 43210"
          className="min-h-[44px]"
        />
        <p className="text-xs text-muted-foreground">
          Indian numbers default to +91. Include the country code for other countries.
        </p>
      </div>
      <Button type="submit" disabled={loading || !phone.trim()} className="w-full h-12">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send code'}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Phone sign-in works for existing accounts. New farmers join through their consultant&apos;s
        invite.
      </p>
    </form>
  )
}
