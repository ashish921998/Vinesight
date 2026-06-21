'use client'

import type React from 'react'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoginButton } from '@/components/auth/LoginButton'
import { PhoneLoginForm } from '@/components/auth/PhoneLoginForm'
import { PasswordInput } from '@/components/ui/password-input'
import { resolveModuleHome } from '@/lib/auth/module-home'
import { FARMER_HOME } from '@/lib/auth/homes'
import posthog from 'posthog-js'

function LoginPageContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showError, setShowError] = useState(false)
  const [method, setMethod] = useState<'email' | 'phone'>('email')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signInWithEmail, loading, error, user, clearError } = useSupabaseAuth()

  // Support ?redirect= for invite flows and other post-login redirects.
  // Only allow relative paths to prevent open-redirect attacks.
  const redirectTo = (() => {
    const param = searchParams.get('redirect')
    if (param && param.startsWith('/') && !param.startsWith('//')) return param
    return null
  })()

  // Login can redirect from three places — the auth-state effect below, the
  // email submit handler, and the phone onSuccess — because signInWithEmail and
  // verifyPhoneOtp both flip `user`, which re-fires this effect. The once-guard
  // collapses them to a single resolveModuleHome lookup and a single router.push
  // so a login never fires two parallel membership queries or double-pushes.
  const redirectHandledRef = useRef(false)

  useEffect(() => {
    if (redirectHandledRef.current) return
    // Email/Google users confirm via email; phone-OTP users confirm via SMS.
    if (user && (user.email_confirmed_at || user.phone_confirmed_at)) {
      redirectHandledRef.current = true
      if (redirectTo) {
        router.push(redirectTo)
      } else {
        resolveModuleHome(user.id).then((home) => router.push(home))
      }
    }
  }, [user, router, redirectTo])

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

    if (!email || !password) {
      return
    }

    const result = await signInWithEmail({ email, password })

    posthog.capture('login_submitted', { method: 'email', success: result.success })

    if (result.success && !redirectHandledRef.current) {
      redirectHandledRef.current = true
      const home =
        redirectTo || (result.user ? await resolveModuleHome(result.user.id) : FARMER_HOME)
      router.push(home)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      posthog.capture('password_reset_requested', { email_provided: false })
      return
    }

    posthog.capture('password_reset_requested', { email_provided: true })

    // This would typically open a modal or redirect to a forgot password page
    // For now, we'll just show an alert
    alert('Password reset functionality would be implemented here')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <div className="text-foreground text-2xl font-medium font-sans">Vinesight</div>
          </Link>
          <h1 className="text-foreground text-2xl font-semibold font-sans mb-2">Welcome back</h1>
          <p className="text-muted-foreground text-base font-normal font-sans">
            Sign in to your farm management dashboard
          </p>
        </div>

        {/* Login Form */}
        <Card className="p-8">
          {/* Error Alert */}
          {showError && error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Email / Phone method switch */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            <Button
              type="button"
              variant={method === 'email' ? 'default' : 'ghost'}
              onClick={() => setMethod('email')}
              className="py-2 text-sm font-medium"
            >
              Email
            </Button>
            <Button
              type="button"
              variant={method === 'phone' ? 'default' : 'ghost'}
              onClick={() => setMethod('phone')}
              className="py-2 text-sm font-medium"
            >
              Phone
            </Button>
          </div>

          {method === 'phone' ? (
            <PhoneLoginForm
              onSuccess={async (userId) => {
                if (redirectHandledRef.current) return
                redirectHandledRef.current = true
                const home = redirectTo || (userId ? await resolveModuleHome(userId) : FARMER_HOME)
                router.push(home)
              }}
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full min-h-[44px]"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  label="Password"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Checkbox id="remember-me" />
                  <Label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm font-normal text-muted-foreground"
                  >
                    Remember me
                  </Label>
                </div>

                <Button
                  type="button"
                  variant="link"
                  onClick={handleForgotPassword}
                  className="h-auto p-0 text-sm font-medium"
                >
                  Forgot your password?
                </Button>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 px-4">
                {loading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-accent-foreground"
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
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <LoginButton variant="outline" className="mt-6">
              Sign in with Google
            </LoginButton>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium">
              Create Account for free
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}
