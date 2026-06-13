'use client'

import type React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PasswordInput } from '@/components/ui/password-input'
import { Badge } from '@/components/ui/badge'
import { VALIDATION } from '@/lib/constants'
import { Loader2, Building2, Mail } from 'lucide-react'
import { toast } from 'sonner'

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

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showError, setShowError] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const submittingRef = useRef(false)

  const { signUpWithEmail, loading: authLoading, error, user, clearError } = useSupabaseAuth()

  // Load invite by token
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
      setFirstName(data.firstName ?? '')
      setLastName(data.lastName ?? '')
    } catch {
      setInviteError('This invite is invalid or has expired')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadInvite()
  }, [loadInvite])

  useEffect(() => {
    // Only auto-redirect an already-signed-in user who lands here directly.
    // During submission, handleSubmit owns the redirect (after accept-invite completes).
    if (user && user.email_confirmed_at && !submittingRef.current) {
      router.push('/consultant')
    }
  }, [user, router])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!invite) return

    const trimmedFirstName = firstName.trim()
    const trimmedLastName = lastName.trim()

    if (!trimmedFirstName || !trimmedLastName || !password || !confirmPassword) {
      return
    }

    if (password !== confirmPassword) {
      return
    }

    submittingRef.current = true
    const result = await signUpWithEmail({
      email: invite.email,
      password,
      confirmPassword,
      firstName: trimmedFirstName,
      lastName: trimmedLastName
    })

    if (result.success && result.user) {
      // Email not yet verified: defer the membership write to after OTP confirmation.
      // accept-invite requires a verified email, so a leaked link can't grant access.
      if (result.needsOtpVerification) {
        const params = new URLSearchParams({ email: invite.email, inviteToken: token })
        if (invite.organizationSlug) {
          params.set('org', invite.organizationSlug)
        }
        router.push(`/auth/verify-otp?${params.toString()}`)
        return
      }

      // Email already confirmed (auto-confirm projects): bind to the org now.
      setAccepting(true)
      try {
        const response = await fetch('/api/organizations/accept-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: result.user.id,
            token
          })
        })

        if (!response.ok) {
          const data = await response.json()
          console.error('Error accepting invite:', data.error)
          toast.error(
            data.error || 'Account created but failed to join organization. Please contact support.'
          )
          setAccepting(false)
          submittingRef.current = false
          return
        }
      } catch (err) {
        console.error('Error accepting invite:', err)
        toast.error('Account created but failed to join organization. Please contact support.')
        setAccepting(false)
        submittingRef.current = false
        return
      }
      setAccepting(false)
      router.push('/consultant')
    } else {
      submittingRef.current = false
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

  const isLoading = authLoading || accepting

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md">
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
          <p className="text-muted-foreground text-base font-normal font-sans">
            Set up your account to accept the invitation
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-[0px_0px_0px_1px_rgba(55,50,47,0.08)] p-8">
          {showError && error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
                <span className="block mt-1">
                  Already have an account?{' '}
                  <Link href="/login" className="font-medium underline hover:no-underline">
                    Sign in
                  </Link>
                </span>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-card-foreground mb-2"
                >
                  First name
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
                  Last name
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
                htmlFor="email"
                className="block text-sm font-medium text-card-foreground mb-2"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={invite.email}
                  readOnly
                  disabled
                  className="w-full pl-9 pr-3 py-2 border border-border rounded-md shadow-sm bg-muted text-muted-foreground cursor-not-allowed focus:outline-none min-h-[44px]"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                This invite is locked to this email
              </p>
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
                isLoading ||
                password !== confirmPassword ||
                !firstName.trim() ||
                !lastName.trim() ||
                !password ||
                !confirmPassword
              }
              className="w-full min-h-[48px]"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  {accepting ? 'Joining organization...' : 'Creating account...'}
                </div>
              ) : (
                'Accept Invite'
              )}
            </Button>
          </form>

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
