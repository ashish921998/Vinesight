'use client'

import { useState, useEffect, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import Link from 'next/link'

function VerifyEmailContent() {
  const [loading, setLoading] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, loading: authLoading, resendVerificationEmail } = useSupabaseAuth()

  // Get email from URL parameters
  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  // Redirect if user is already verified and logged in
  useEffect(() => {
    if (user && user.email_confirmed_at && !authLoading) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  const handleResendEmail = async () => {
    if (!email) return

    setLoading(true)
    setError(null)

    try {
      // Use the proper resend verification email method
      const result = await resendVerificationEmail({ email })

      if (result.success) {
        setResent(true)
        // Clear the success message after 5 seconds
        setTimeout(() => setResent(false), 5000)
      } else {
        setError(result.error || 'Failed to resend verification email')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToSignup = () => {
    router.push('/signup')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-xl">Verify Your Email</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground">
            We&apos;ve sent a verification link to{' '}
            <span className="font-medium">{email || 'your email address'}</span>. Please check your
            inbox and click the link to activate your account.
          </p>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800 text-left">
                  <p className="font-medium mb-1">What&apos;s next?</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Check your email inbox</li>
                    <li>Click the verification link in the email</li>
                    <li>You&apos;ll be automatically redirected to your dashboard</li>
                  </ul>
                </div>
              </div>
            </div>

            {resent && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  Verification email resent successfully!
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Button
                onClick={handleResendEmail}
                disabled={loading || !email}
                variant="outline"
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>

              <Button onClick={handleBackToSignup} variant="ghost" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign Up
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              Already verified?{' '}
              <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmail() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
