'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PasswordInput } from '@/components/ui/password-input'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { VALIDATION } from '@/lib/constants'
import { Loader2, Building2 } from 'lucide-react'
import { toast } from 'sonner'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export default function OrganizationSignupPage() {
  const router = useRouter()

  // User fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Organization fields
  const [orgName, setOrgName] = useState('')
  const [orgSlug, setOrgSlug] = useState('')

  const [showError, setShowError] = useState(false)
  const [creatingOrg, setCreatingOrg] = useState(false)

  const { signUpWithEmail, loading: authLoading, error, user, clearError } = useSupabaseAuth()

  // Auto-generate slug from org name
  useEffect(() => {
    setOrgSlug(generateSlug(orgName))
  }, [orgName])

  // Redirect if user is logged in
  useEffect(() => {
    if (user && user.email_confirmed_at) {
      router.push('/dashboard')
    }
  }, [user, router])

  // Show error timeout
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

    const trimmedFirstName = firstName.trim()
    const trimmedLastName = lastName.trim()
    const trimmedEmail = email.trim()
    const trimmedOrgName = orgName.trim()
    const trimmedOrgSlug = orgSlug.trim()

    if (
      !trimmedFirstName ||
      !trimmedLastName ||
      !trimmedEmail ||
      !password ||
      !confirmPassword ||
      !trimmedOrgName ||
      !trimmedOrgSlug
    ) {
      return
    }

    if (password !== confirmPassword) {
      return
    }

    // Sign up the user
    const result = await signUpWithEmail({
      email: trimmedEmail,
      password,
      confirmPassword,
      firstName: trimmedFirstName,
      lastName: trimmedLastName
    })

    if (result.success && result.user) {
      setCreatingOrg(true)

      try {
        // Create org via API (uses service role to bypass RLS)
        const response = await fetch('/api/organizations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: result.user.id,
            name: trimmedOrgName,
            slug: trimmedOrgSlug
          })
        })

        if (!response.ok) {
          const data = await response.json()
          toast.error(data.error || 'Failed to create organization')
          setCreatingOrg(false)
          return
        }
      } catch (err) {
        toast.error('Failed to create organization')
        setCreatingOrg(false)
        return
      }
      setCreatingOrg(false)

      if (result.needsOtpVerification) {
        router.push(
          `/auth/verify-otp?email=${encodeURIComponent(trimmedEmail)}&org=${encodeURIComponent(trimmedOrgSlug)}`
        )
      } else {
        router.push('/clients')
      }
    }
  }

  const isLoading = authLoading || creatingOrg

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <div className="text-foreground text-2xl font-medium font-sans">Vinesight</div>
          </Link>
          <div className="inline-flex items-center gap-2 bg-accent/10 text-primary px-3 py-1 rounded-full text-sm mb-4">
            <Building2 className="h-4 w-4" />
            For Organizations
          </div>
          <h1 className="text-foreground text-2xl font-semibold font-sans mb-2">
            Create your organization
          </h1>
          <p className="text-muted-foreground text-base font-normal font-sans">
            Set up your consulting business on VineSight
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-[0px_0px_0px_1px_rgba(55,50,47,0.08)] p-8">
          {showError && error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Info */}
            <div className="space-y-4 pb-4 border-b">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Organization
              </h3>
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                  placeholder="Acme Agri Consultants"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgSlug">Signup URL</Label>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground mr-2">vinesight.com/signup/</span>
                  <Input
                    id="orgSlug"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value)}
                    required
                    placeholder="acme-agri"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Farmers will use this link to sign up
                </p>
              </div>
            </div>

            {/* User Info */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Your Account
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value.trimStart())}
                    required
                    maxLength={VALIDATION.MAX_NAME_LENGTH}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value.trimStart())}
                    required
                    maxLength={VALIDATION.MAX_NAME_LENGTH}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  required
                  placeholder="john@acme-agri.com"
                />
              </div>

              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Create a password"
                label="Password"
              />

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
                !email.trim() ||
                !password ||
                !confirmPassword ||
                !orgName.trim() ||
                !orgSlug.trim()
              }
              className="w-full min-h-[48px]"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  {creatingOrg ? 'Creating organization...' : 'Creating account...'}
                </div>
              ) : (
                'Create Organization'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary hover:text-primary/80">
                Sign in
              </Link>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Are you a farmer?{' '}
              <Link href="/signup" className="font-medium text-primary hover:text-primary/80">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
