'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Loader2, ShieldCheck, Sprout } from 'lucide-react'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'

const PAGE_SHELL =
  'min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className={PAGE_SHELL}>
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8">{children}</CardContent>
      </Card>
    </div>
  )
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center mb-6">
      <div className="flex justify-center mb-4">
        <div className="p-3 bg-green-100 rounded-full">
          <Sprout className="h-8 w-8 text-green-600" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="text-gray-600 mt-2 text-sm">{subtitle}</p>
    </div>
  )
}

function ClaimContent() {
  const searchParams = useSearchParams()
  const claimAttemptToken = searchParams.get('claim_attempt_token')
  const { user, loading, signInWithGoogle } = useSupabaseAuth()

  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  // No token in the URL — the verification link is malformed or truncated.
  if (!claimAttemptToken) {
    return (
      <Shell>
        <Header title="Invalid link" subtitle="This connection link is missing or incomplete." />
        <p className="text-sm text-gray-500 text-center">
          Ask the agent to show you the connection link again, then open it in full.
        </p>
      </Shell>
    )
  }

  if (loading) {
    return (
      <Shell>
        <div className="text-center py-6">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-green-600" />
          <p className="text-gray-600 mt-2 text-sm">Loading…</p>
        </div>
      </Shell>
    )
  }

  // Not signed in — round-trip through Google sign-in and come back to this exact URL.
  if (!user) {
    const handleSignIn = () => {
      const returnTo = `${window.location.pathname}${window.location.search}`
      signInWithGoogle({
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnTo)}`
      })
    }
    return (
      <Shell>
        <Header
          title="Connect an agent"
          subtitle="Sign in to VineSight to review and approve this request."
        />
        <Button onClick={handleSignIn} className="h-12 w-full bg-green-600 hover:bg-green-700">
          Continue with Google
        </Button>
      </Shell>
    )
  }

  if (confirmed) {
    return (
      <Shell>
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Agent connected</h1>
          <p className="text-gray-600 mt-2 text-sm">
            You can return to your agent — it now has access on your behalf. You can revoke it
            anytime from your VineSight settings.
          </p>
        </div>
      </Shell>
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/agent/claim/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim_attempt_token: claimAttemptToken, user_code: code })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.status === 'confirmed') {
        setConfirmed(true)
      } else {
        setError(data?.error_description || 'Could not confirm the code. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Shell>
      <Header title="Approve agent access" subtitle={`Signed in as ${user.email}`} />

      <div className="flex items-start gap-3 rounded-lg bg-green-50 border border-green-100 p-3 mb-6">
        <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
        <p className="text-sm text-gray-600">
          An AI agent is requesting permission to <strong>read your farms and tasks</strong> on your
          behalf. Enter the 6-digit code it shows you to approve.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="user_code">Confirmation code</Label>
          <Input
            id="user_code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="text-center text-2xl tracking-[0.5em] font-mono h-14"
            aria-describedby={error ? 'claim-error' : undefined}
          />
        </div>

        {error && (
          <p id="claim-error" className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={submitting || code.length !== 6}
          className="h-12 w-full bg-green-600 hover:bg-green-700"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Approving…
            </>
          ) : (
            'Approve access'
          )}
        </Button>
      </form>
    </Shell>
  )
}

export default function AgentClaimPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <div className="text-center py-6">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-green-600" />
            <p className="text-gray-600 mt-2 text-sm">Loading…</p>
          </div>
        </Shell>
      }
    >
      <ClaimContent />
    </Suspense>
  )
}
