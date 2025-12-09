'use client'

import type React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PasswordInput } from '@/components/ui/password-input'
import { VALIDATION } from '@/lib/constants'
import { getTypedSupabaseClient } from '@/lib/supabase'
import { Loader2, Building2, Users } from 'lucide-react'
import { toast } from 'sonner'

export default function OrgUserSignupPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.org as string

  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState<{ id: string; name: string } | null>(null)
  const [orgError, setOrgError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showError, setShowError] = useState(false)

  const { signUpWithEmail, loading: authLoading, error, user, clearError } = useSupabaseAuth()

  // Load organization by slug
  const loadOrganization = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = await getTypedSupabaseClient()

      const { data: org, error: fetchError } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('slug', orgSlug)
        .single()

      if (fetchError || !org) {
        setOrgError('Organization not found')
        return
      }

      setOrganization(org)
    } catch {
      setOrgError('Failed to load organization')
    } finally {
      setLoading(false)
    }
  }, [orgSlug])

  useEffect(() => {
    loadOrganization()
  }, [loadOrganization])

  useEffect(() => {
    if (user && user.email_confirmed_at) {
      router.push('/clients')
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

    if (!organization) return

    const trimmedFirstName = firstName.trim()
    const trimmedLastName = lastName.trim()
    const trimmedEmail = email.trim()

    if (!trimmedFirstName || !trimmedLastName || !trimmedEmail || !password || !confirmPassword) {
      return
    }

    if (password !== confirmPassword) {
      return
    }

    const result = await signUpWithEmail({
      email: trimmedEmail,
      password,
      confirmPassword,
      firstName: trimmedFirstName,
      lastName: trimmedLastName
    })

    if (result.success && result.user) {
      // Add user as organization member via API (uses service role)
      try {
        const response = await fetch('/api/organizations/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: result.user.id,
            organizationId: organization.id,
            role: 'agronomist'
          })
        })
        if (!response.ok) {
          const data = await response.json()
          console.error('Error joining organization:', data.error)
          toast.error('Account created but failed to join organization. Please contact support.')
        }
      } catch (err) {
        console.error('Error adding user as org member:', err)
        toast.error('Account created but failed to join organization. Please contact support.')
      }

      if (result.needsEmailConfirmation) {
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}&org=${orgSlug}`)
      } else {
        router.push('/clients')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (orgError || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Organization Not Found</h1>
          <p className="text-muted-foreground mb-4">{orgError || 'This signup link is invalid'}</p>
          <Button asChild>
            <Link href="/signup">Go to Regular Signup</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <div className="text-foreground text-2xl font-medium font-sans">Vinesight</div>
          </Link>
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm mb-4">
            <Users className="h-4 w-4" />
            Team Member
          </div>
          <h1 className="text-foreground text-2xl font-semibold font-sans mb-2">
            Join {organization.name}
          </h1>
          <p className="text-muted-foreground text-base font-normal font-sans">
            Create your team member account
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-[0px_0px_0px_1px_rgba(55,50,47,0.08)] p-8">
          {showError && error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
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
                  onChange={(e) => setFirstName(e.target.value)}
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
                  onChange={(e) => setLastName(e.target.value)}
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
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[44px]"
                placeholder="Enter your email"
              />
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
                authLoading ||
                password !== confirmPassword ||
                !firstName.trim() ||
                !lastName.trim() ||
                !email.trim() ||
                !password ||
                !confirmPassword
              }
              className="w-full min-h-[48px]"
            >
              {authLoading ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Creating account...
                </div>
              ) : (
                'Join Team'
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
