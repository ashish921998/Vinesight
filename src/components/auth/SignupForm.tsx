'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { LoginButton } from '@/components/auth/LoginButton'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'

export default function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showError, setShowError] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false)
  const router = useRouter()
  const { signUpWithEmail, loading, error, user, clearError } = useSupabaseAuth()

  // Redirect if user is already logged in and email is confirmed
  useEffect(() => {
    if (user && user.email_confirmed_at) {
      router.push('/dashboard')
    }
  }, [user, router])

  // Show error if authentication fails
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

    if (!email || !password || !confirmPassword) {
      return
    }

    if (password !== confirmPassword) {
      return
    }

    const result = await signUpWithEmail({
      email,
      password,
      confirmPassword
    })

    if (result.success) {
      if (result.needsEmailConfirmation) {
        // Redirect to verification page with email parameter
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`)
      } else {
        router.push('/dashboard')
      }
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <div className="text-foreground text-2xl font-medium font-sans">Vinesight</div>
          </Link>
          <h1 className="text-foreground text-2xl font-semibold font-sans mb-2">
            Create your account
          </h1>
          <p className="text-muted-foreground text-base font-normal font-sans">
            Start your free trial and manage your farm smarter
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-[0px_0px_0px_1px_rgba(55,50,47,0.08)] p-8">
          {/* Success Alert */}
          {showSuccess && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                {needsEmailConfirmation
                  ? 'Account created successfully! Please check your email to confirm your account.'
                  : 'Account created successfully! Redirecting to dashboard...'}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {showError && error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-card-foreground"
              >
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                className="min-h-[44px]"
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
                autoComplete="new-password"
                className="min-h-[44px]"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Password must be at least 6 characters long
              </p>
            </div>

            <div>
              <PasswordInput
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Re-enter your password"
                label="Confirm password"
                autoComplete="new-password"
                className="min-h-[44px]"
                error={
                  password !== confirmPassword && confirmPassword
                    ? 'Passwords do not match'
                    : undefined
                }
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={
                loading || password !== confirmPassword || !email || !password || !confirmPassword
              }
              className="w-full min-h-[48px]"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg
                    className="-ml-1 mr-3 h-5 w-5 animate-spin text-primary-foreground"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </Button>

            <LoginButton variant="outline" className="mt-6">
              Sign up with Google
            </LoginButton>
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
