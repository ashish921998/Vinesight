'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import Link from 'next/link'
import { Input } from '@/components/ui/input'

function VerifyOtpContent() {
  const [loading, setLoading] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [email, setEmail] = useState<string | null>(null)
  const [orgSlug, setOrgSlug] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, loading: authLoading, verifyOtp, resendVerificationEmail } = useSupabaseAuth()

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ]

  useEffect(() => {
    const emailParam = searchParams.get('email')
    const orgParam = searchParams.get('org')
    if (emailParam) {
      setEmail(emailParam)
    }
    if (orgParam) {
      setOrgSlug(orgParam)
    }
  }, [searchParams])

  useEffect(() => {
    if (user && user.email_confirmed_at && !authLoading) {
      router.push(orgSlug ? '/clients' : '/dashboard')
    }
  }, [user, authLoading, router, orgSlug])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0]
    }

    if (!/^\d*$/.test(value)) {
      return
    }

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  const handleVerifyOtp = async () => {
    if (!email) return

    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await verifyOtp({ email, token: otpCode })

      if (result.success) {
        router.push(orgSlug ? '/clients' : '/dashboard')
      } else {
        setError(result.error || 'Verification failed')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!email) return

    setLoading(true)
    setError(null)

    try {
      const result = await resendVerificationEmail({ email })

      if (result.success) {
        setResent(true)
        setTimeout(() => setResent(false), 5000)
      } else {
        setError(result.error || 'Failed to resend verification code')
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
            We&apos;ve sent a 6-digit verification code to{' '}
            <span className="font-medium">{email || 'your email address'}</span>. Please check your
            inbox and enter the code below.
          </p>

          <div className="space-y-4">
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-2xl font-bold"
                />
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800 text-left">
                  <p className="font-medium mb-1">What&apos;s next?</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Check your email inbox</li>
                    <li>Enter the 6-digit code from the email</li>
                    <li>You&apos;ll be automatically redirected to your dashboard</li>
                  </ul>
                </div>
              </div>
            </div>

            {resent && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  Verification code resent successfully!
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
                onClick={handleVerifyOtp}
                disabled={loading || otp.join('').length !== 6}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>

              <Button
                onClick={handleResendOtp}
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
                    Resend Verification Code
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

export default function VerifyOtp() {
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
      <VerifyOtpContent />
    </Suspense>
  )
}
