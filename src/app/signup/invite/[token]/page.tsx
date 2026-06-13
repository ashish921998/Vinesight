'use client'

import type React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { VALIDATION } from '@/lib/constants'
import { normalizePhone } from '@/lib/phone'
import { Loader2, Sprout, TicketCheck } from 'lucide-react'
import { toast } from 'sonner'

interface ResolvedInvite {
  organizationName: string | null
  farmerName: string | null
  phone: string | null
}

export default function InvitedFarmerSignupPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState<ResolvedInvite | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState<'details' | 'otp'>('details')
  const [otp, setOtp] = useState('')
  const [binding, setBinding] = useState(false)
  const [showError, setShowError] = useState(false)

  const {
    sendPhoneOtp,
    verifyPhoneOtp,
    loading: authLoading,
    error,
    user,
    clearError
  } = useSupabaseAuth()

  // Resolve the invitation token (org name + prefill name/phone).
  const loadInvite = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/invite/resolve?token=${encodeURIComponent(token)}`)
      const data = await res.json()

      if (!data.valid) {
        const reasons: Record<string, string> = {
          expired: 'This invitation has expired. Please ask your consultant for a new link.',
          already_used: 'This invitation has already been used.',
          not_found: 'This invitation link is invalid.',
          missing_token: 'This invitation link is invalid.',
          error: 'We couldn’t load this invitation. Please try again in a moment.'
        }
        setInviteError(reasons[data.reason] || 'This invitation link is invalid.')
        return
      }

      setInvite({
        organizationName: data.organizationName,
        farmerName: data.farmerName,
        phone: data.phone
      })

      // Prefill the phone from the invite — the farmer signs up with the number they were
      // invited at, which is also the number the OTP is sent to (and that accept verifies).
      if (data.phone) setPhone(data.phone)

      // Prefill name from the invite (split on the first space).
      if (data.farmerName) {
        const trimmed = data.farmerName.trim()
        const spaceIdx = trimmed.indexOf(' ')
        if (spaceIdx === -1) {
          setFirstName(trimmed)
        } else {
          setFirstName(trimmed.slice(0, spaceIdx))
          setLastName(trimmed.slice(spaceIdx + 1))
        }
      }
    } catch {
      setInviteError('Failed to load invitation. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadInvite()
  }, [loadInvite])

  // An already-logged-in visitor has nothing to sign up for. Only redirect on the initial
  // details step — during OTP verification `user` becomes set and we must NOT bounce away
  // before the bind call below runs.
  useEffect(() => {
    if (step === 'details' && user && (user.phone_confirmed_at || user.email_confirmed_at)) {
      router.push('/dashboard')
    }
  }, [user, router, step])

  useEffect(() => {
    if (error) {
      setShowError(true)
      const timer = setTimeout(() => {
        setShowError(false)
        clearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  const namesValid = firstName.trim() !== '' && lastName.trim() !== ''
  const normalized = normalizePhone(phone)
  const canSendOtp = namesValid && Boolean(normalized)

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!namesValid || !normalized) return

    const result = await sendPhoneOtp({
      phone: normalized.e164,
      firstName: firstName.trim(),
      lastName: lastName.trim()
    })
    if (result.success) setStep('otp')
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!normalized || otp.trim().length === 0) return

    const result = await verifyPhoneOtp({ phone: normalized.e164, token: otp.trim() })
    if (!result.success || !result.user) return

    // Phone verified — bind the farmer to the inviting organization (service role).
    try {
      setBinding(true)
      const response = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: result.user.id, token })
      })
      if (!response.ok) {
        const data = await response.json()
        console.error('Error accepting invitation:', data.error)
        toast.error(
          'Phone verified but linking to the organization failed. Please contact your consultant.'
        )
      }
    } catch (err) {
      console.error('Error accepting invitation:', err)
      toast.error(
        'Phone verified but linking to the organization failed. Please contact your consultant.'
      )
    } finally {
      setBinding(false)
    }

    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (inviteError || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <TicketCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Invitation Unavailable</h1>
          <p className="text-muted-foreground mb-4">
            {inviteError || 'This invitation link is invalid'}
          </p>
          <Button asChild>
            <Link href="/signup">Go to Regular Signup</Link>
          </Button>
        </div>
      </div>
    )
  }

  const busy = authLoading || binding

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <div className="text-foreground text-2xl font-medium font-sans">Vinesight</div>
          </Link>
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm mb-4">
            <Sprout className="h-4 w-4" />
            Farmer Invitation
          </div>
          <h1 className="text-foreground text-2xl font-semibold font-sans mb-2">
            {invite.organizationName ? `Join ${invite.organizationName}` : 'Create your account'}
          </h1>
          <p className="text-muted-foreground text-base font-normal font-sans">
            {step === 'details'
              ? 'Confirm your details and we’ll text you a verification code'
              : `Enter the 6-digit code we sent to ${normalized?.e164 ?? phone}`}
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-[0px_0px_0px_1px_rgba(55,50,47,0.08)] p-8">
          {showError && error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {step === 'details' ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-card-foreground mb-2"
                  >
                    First name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value.trimStart())}
                    required
                    maxLength={VALIDATION.MAX_NAME_LENGTH}
                    className="w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[44px]"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-card-foreground mb-2"
                  >
                    Last name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value.trimStart())}
                    required
                    maxLength={VALIDATION.MAX_NAME_LENGTH}
                    className="w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[44px]"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-card-foreground mb-2"
                >
                  Phone number <span className="text-red-500">*</span>
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  readOnly
                  disabled
                  className="min-h-[44px] bg-muted/40"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  We’ll text a one-time code to this number. Contact your consultant if it’s wrong.
                </p>
              </div>

              <Button type="submit" disabled={busy || !canSendOtp} className="w-full min-h-[48px]">
                {authLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Sending code…
                  </div>
                ) : (
                  'Send verification code'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-card-foreground mb-2"
                >
                  Verification code <span className="text-red-500">*</span>
                </label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit code"
                  maxLength={6}
                  className="min-h-[44px] text-center text-lg tracking-widest"
                />
              </div>

              <Button
                type="submit"
                disabled={busy || otp.trim().length === 0}
                className="w-full min-h-[48px]"
              >
                {busy ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Verifying…
                  </div>
                ) : (
                  'Verify & continue'
                )}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep('details')
                    setOtp('')
                    clearError()
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (normalized) {
                      void sendPhoneOtp({
                        phone: normalized.e164,
                        firstName: firstName.trim(),
                        lastName: lastName.trim()
                      })
                    }
                  }}
                  className="font-medium text-primary hover:text-primary/80 disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:text-primary/80">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
