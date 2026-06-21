'use client'

import type React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { VALIDATION } from '@/lib/constants'
import { normalizePhone } from '@/lib/phone'
import { Loader2, Sprout, TicketCheck } from 'lucide-react'
import { toast } from 'sonner'

interface ResolvedInvite {
  organizationName: string | null
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
    signOut,
    loading: authLoading,
    error,
    user,
    clearError
  } = useSupabaseAuth()

  // Resolve the invitation token (org name + prefilled phone).
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
          org_inactive: 'This organization is no longer active. Please contact your consultant.',
          invalid:
            'This invitation is missing required details. Please ask your consultant for a new link.',
          error: 'We couldn’t load this invitation. Please try again in a moment.',
          rate_limited: 'Too many attempts. Please wait a minute and try again.'
        }
        setInviteError(reasons[data.reason] || 'This invitation link is invalid.')
        return
      }

      setInvite({
        organizationName: data.organizationName,
        phone: data.phone
      })

      // Prefill the phone from the invite — the farmer signs up with the number they were
      // invited at, which is also the number the OTP is sent to (and that accept verifies).
      if (data.phone) setPhone(data.phone)
    } catch {
      setInviteError('Failed to load invitation. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadInvite()
  }, [loadInvite])

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

  // A visitor who's already signed in can't "sign up" again. Compare their session phone to
  // the invited number (the same digit-only comparison the accept route uses): a match means
  // we can link them in one tap without another OTP; anything else means they're signed in as
  // a different account and need to sign out first.
  const sessionPhoneDigits = (user?.phone ?? '').replace(/\D/g, '')
  const invitePhoneDigits = (invite?.phone ?? '').replace(/\D/g, '')
  const isSignedIn = Boolean(user)
  const signedInPhoneMatches =
    Boolean(user?.phone_confirmed_at) &&
    invitePhoneDigits.length > 0 &&
    sessionPhoneDigits === invitePhoneDigits

  // Which UI the card shows. The OTP step always wins (we must not swap the form out from
  // under an in-progress verification); otherwise a signed-in visitor gets the join /
  // wrong-account panel and everyone else gets the normal details form.
  const mode: 'details' | 'otp' | 'join-current' | 'wrong-account' =
    step === 'otp'
      ? 'otp'
      : isSignedIn && signedInPhoneMatches
        ? 'join-current'
        : isSignedIn
          ? 'wrong-account'
          : 'details'

  // POST the accept route to bind `userId` to the inviting org. Returns true on success; on
  // failure it surfaces a toast and returns false so the caller keeps the user on the page.
  const bindToOrg = async (userId: string): Promise<boolean> => {
    try {
      setBinding(true)
      const response = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token })
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        console.error('Error accepting invitation:', data.error)
        // Surface the route's specific reason (e.g. 410 expired, 409 already-linked-elsewhere,
        // 403 removed-as-client) instead of collapsing every failure to a generic message.
        toast.error(
          data.error ||
            'Couldn’t link your account to the organization. Please contact your consultant.'
        )
        return false
      }
      return true
    } catch (err) {
      console.error('Error accepting invitation:', err)
      toast.error('Couldn’t link your account to the organization. Please contact your consultant.')
      return false
    } finally {
      setBinding(false)
    }
  }

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

    // Phone verified — bind to the org, and only navigate once that link succeeds. On failure
    // we stay on this page (with the error + Back/Resend) instead of dropping the farmer on an
    // unlinked dashboard where the toast is lost.
    if (await bindToOrg(result.user.id)) {
      router.push('/dashboard')
    }
  }

  // Already signed in with the invited number: the existing session already proves phone
  // ownership, so skip the OTP and link straight to the org.
  const handleJoinAsCurrentUser = async () => {
    if (!user) return
    if (await bindToOrg(user.id)) {
      router.push('/dashboard')
    }
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
          <Badge
            variant="secondary"
            className="h-auto gap-2 bg-green-100 px-3 py-1 text-green-700 text-sm mb-4 [&>svg]:size-4!"
          >
            <Sprout className="h-4 w-4" />
            Farmer Invitation
          </Badge>
          <h1 className="text-foreground text-2xl font-semibold font-sans mb-2">
            {invite.organizationName ? `Join ${invite.organizationName}` : 'Create your account'}
          </h1>
          <p className="text-muted-foreground text-base font-normal font-sans">
            {mode === 'otp'
              ? `Enter the 6-digit code we sent to ${normalized?.e164 ?? phone}`
              : mode === 'join-current'
                ? 'You’re already signed in — confirm to join.'
                : mode === 'wrong-account'
                  ? 'You’re signed in as a different account.'
                  : 'Confirm your details and we’ll text you a verification code'}
          </p>
        </div>

        <Card className="p-8">
          {showError && error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {mode === 'details' ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value.trimStart())}
                    required
                    maxLength={VALIDATION.MAX_NAME_LENGTH}
                    className="w-full min-h-[44px]"
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value.trimStart())}
                    required
                    maxLength={VALIDATION.MAX_NAME_LENGTH}
                    className="w-full min-h-[44px]"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone number <span className="text-red-500">*</span>
                </Label>
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
          ) : mode === 'otp' ? (
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp">
                  Verification code <span className="text-red-500">*</span>
                </Label>
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
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setStep('details')
                    setOtp('')
                    clearError()
                  }}
                  className="h-auto p-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="link"
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
                  className="h-auto p-0 font-medium"
                >
                  Resend code
                </Button>
              </div>
            </form>
          ) : mode === 'join-current' ? (
            <div className="space-y-6">
              <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                <p className="text-card-foreground">
                  You’re signed in as <span className="font-medium">+{sessionPhoneDigits}</span>.
                </p>
                <p className="mt-1 text-muted-foreground">
                  {invite.organizationName
                    ? `Tap below to join ${invite.organizationName} with this account.`
                    : 'Tap below to join the organization with this account.'}
                </p>
              </div>

              <Button
                onClick={handleJoinAsCurrentUser}
                disabled={busy}
                className="w-full min-h-[48px]"
              >
                {binding ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Joining…
                  </div>
                ) : invite.organizationName ? (
                  `Join ${invite.organizationName}`
                ) : (
                  'Join organization'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => void signOut()}
                className="w-full text-sm text-muted-foreground hover:bg-transparent hover:text-foreground"
              >
                Use a different account
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <Alert className="border-amber-200 bg-amber-50">
                <AlertDescription className="text-amber-800">
                  You’re signed in as a different account
                  {user?.phone
                    ? ` (+${sessionPhoneDigits})`
                    : user?.email
                      ? ` (${user.email})`
                      : ''}
                  , but this invitation is for a different number. Sign out to continue with the
                  invited number.
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => void signOut()}
                disabled={busy}
                className="w-full min-h-[48px]"
              >
                {authLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Signing out…
                  </div>
                ) : (
                  'Sign out & continue'
                )}
              </Button>
            </div>
          )}

          {!isSignedIn && (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary hover:text-primary/80">
                Sign in
              </Link>
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}
