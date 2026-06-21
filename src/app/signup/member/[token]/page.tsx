'use client'

import type React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { PasswordInput } from '@/components/ui/password-input'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Loader2, Building2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

interface InviteDetails {
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'agronomist'
  organizationId: string
  organizationName: string
  organizationSlug: string
}

const ROLE_LABELS: Record<InviteDetails['role'], string> = {
  admin: 'Admin',
  agronomist: 'Agronomist'
}

export default function InviteAcceptPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [acceptError, setAcceptError] = useState(false)
  const submittingRef = useRef(false)

  const { loading: authLoading, user } = useSupabaseAuth()

  // The invitee arrives here authenticated via the Supabase invite email (auth.admin
  // .inviteUserByEmail stamps `org_invite_token` into user_metadata). That account is
  // passwordless, so we collect a password before binding them to the org. Matching the token
  // guards against a stale metadata value left over from an unrelated invite.
  const inviteMetaToken = (user?.user_metadata as Record<string, unknown> | undefined)
    ?.org_invite_token
  const isInvitedUser = !!user?.email_confirmed_at && inviteMetaToken === token

  const loadInvite = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/organizations/invite-member?token=${encodeURIComponent(token)}`
      )

      if (!response.ok) {
        setInviteError('This invite is invalid or has expired')
        return
      }

      const data: InviteDetails = await response.json()
      setInvite(data)
    } catch {
      setInviteError('This invite is invalid or has expired')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadInvite()
  }, [loadInvite])

  // Returns true only on a 2xx. The route returns success for the idempotent
  // already-accepted-by-this-user case, so a non-2xx (e.g. a revoked invite, or one accepted by
  // someone else) is a genuine failure — surface an error + retry rather than redirecting into a
  // workspace the user has no membership in (mirrors the verify-otp invite path).
  const acceptInvite = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/organizations/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
      if (response.ok) return true
      const data = await response.json().catch(() => ({}))
      toast.error(data.error || 'Failed to join organization. Please contact support.')
      return false
    } catch {
      toast.error('Failed to join organization. Please contact support.')
      return false
    }
  }, [token])

  useEffect(() => {
    // An already-registered user who opens the invite link (e.g. the admin shared it because the
    // invitee already had an account) is signed in with a real password and no invite metadata —
    // accept for them directly. Invited (passwordless) users use the set-password form below.
    //
    // Wait for the invite fetch to settle first: without the `loading` guard an authenticated user
    // is redirected to /consultant while `invite` is still null, skipping acceptance entirely.
    if (loading || authLoading || !user || !user.email_confirmed_at) return
    if (isInvitedUser) return
    // Invite failed to load (revoked / expired / 404). `invite` is null only on a
    // failed fetch here, so don't redirect — let the render show the "Invite
    // Unavailable" error screen instead of silently bouncing the user to
    // /consultant (which strands a non-org user on an access-denied page).
    if (inviteError || !invite || !token) return
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)

    void (async () => {
      const ok = await acceptInvite()
      if (ok) {
        router.push('/consultant')
        return
      }
      // Acceptance failed — don't strand them in /consultant. Surface the error state with a
      // retry. submittingRef stays reset so the retry handler can run; the effect won't auto-loop
      // because acceptError isn't a dependency.
      submittingRef.current = false
      setSubmitting(false)
      setAcceptError(true)
    })()
  }, [loading, authLoading, user, isInvitedUser, inviteError, invite, token, router, acceptInvite])

  const retryAccept = async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    setAcceptError(false)

    const ok = await acceptInvite()
    if (ok) {
      router.push('/consultant')
      return
    }
    submittingRef.current = false
    setSubmitting(false)
    setAcceptError(true)
  }

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6 || password !== confirmPassword || submittingRef.current) return

    submittingRef.current = true
    setSubmitting(true)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast.error(error.message || 'Could not set your password. Please try again.')
      submittingRef.current = false
      setSubmitting(false)
      return
    }

    const ok = await acceptInvite()
    if (!ok) {
      // Password is set but membership failed. Keep them on the form (org_invite_token is still
      // present, so isInvitedUser stays true) so they can retry without re-entering anything.
      submittingRef.current = false
      setSubmitting(false)
      setAcceptError(true)
      return
    }

    // Joined — clear org_invite_token so revisiting the link doesn't re-trigger this flow.
    await supabase.auth.updateUser({ data: { org_invite_token: null } })
    router.push('/consultant')
  }

  if (loading || authLoading) {
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
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Invite Unavailable</h1>
          <p className="text-muted-foreground mb-4">
            {inviteError || 'This invite is invalid or has expired'}
          </p>
          <Button asChild>
            <Link href="/login">Go to Sign In</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Existing account: accepting in the background, or a recoverable failure with a retry.
  if (user?.email_confirmed_at && !isInvitedUser) {
    if (acceptError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center space-y-4 max-w-sm">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
            <h1 className="text-xl font-semibold">Couldn&apos;t join {invite.organizationName}</h1>
            <p className="text-sm text-muted-foreground">
              Something went wrong accepting the invitation. Please try again, or contact support if
              it keeps failing.
            </p>
            <Button onClick={retryAccept} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Try again'}
            </Button>
          </div>
        </div>
      )
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Joining {invite.organizationName}…</p>
        </div>
      </div>
    )
  }

  const header = (
    <div className="text-center mb-8">
      <Link href="/" className="inline-block mb-6">
        <div className="text-foreground text-2xl font-medium font-sans">Vinesight</div>
      </Link>
      <div className="inline-flex items-center gap-2 mb-4">
        <Badge variant="secondary">{ROLE_LABELS[invite.role]}</Badge>
      </div>
      <h1 className="text-foreground text-2xl font-semibold font-sans mb-2">
        Join {invite.organizationName}
      </h1>
    </div>
  )

  // Invited user: set a password to finish joining.
  if (isInvitedUser) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4">
        <div className="w-full max-w-md">
          {header}
          <p className="text-center text-muted-foreground text-base font-normal font-sans -mt-4 mb-6">
            Set a password to finish setting up your account
          </p>

          <Card className="p-8">
            <form onSubmit={handleSetPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="member-email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="member-email"
                    type="email"
                    value={invite.email}
                    readOnly
                    disabled
                    className="w-full pl-9 min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Create a password"
                  label="Password"
                />
                <p className="mt-1 text-xs text-muted-foreground">Minimum 6 characters</p>
              </div>

              <div>
                <PasswordInput
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Confirm password"
                  label="Confirm password"
                  error={
                    password !== confirmPassword && confirmPassword
                      ? 'Passwords do not match'
                      : undefined
                  }
                />
              </div>

              <Button
                type="submit"
                disabled={
                  submitting ||
                  password.length < 6 ||
                  password !== confirmPassword ||
                  !confirmPassword
                }
                className="w-full min-h-[48px]"
              >
                {submitting ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Joining organization…
                  </div>
                ) : (
                  'Set password & join'
                )}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    )
  }

  // Not signed in: the invite link establishes the session, so direct visitors are told to use
  // their email. Existing-account invitees (shared link) sign in and are auto-accepted above.
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md">
        {header}
        <Card className="p-8 text-center space-y-4">
          <Mail className="h-10 w-10 text-primary mx-auto" />
          <p className="text-card-foreground">
            We&apos;ve emailed an invitation to <span className="font-medium">{invite.email}</span>.
            Open the link in that email to set your password and join.
          </p>
          <p className="text-sm text-muted-foreground">
            Already have a VineSight account?{' '}
            <Link
              href={`/login?redirect=${encodeURIComponent(`/signup/member/${token}`)}`}
              className="font-medium text-primary hover:text-primary/80"
            >
              Sign in
            </Link>{' '}
            to accept.
          </p>
        </Card>
      </div>
    </div>
  )
}
