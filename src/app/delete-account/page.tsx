'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { toast } from 'sonner'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function DeleteAccountPage() {
  const { user } = useSupabaseAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('You must be logged in to delete your account')
      return
    }

    if (email !== user.email) {
      toast.error('Email does not match your account email')
      return
    }

    if (!password) {
      toast.error('Please enter your password')
      return
    }

    if (!confirmed) {
      toast.error('Please confirm you understand the consequences')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          reason
        })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to submit deletion request')
        setLoading(false)
        return
      }

      toast.success(data.message || 'Account deletion request submitted successfully')
      router.push('/settings')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      console.error('Error submitting deletion request:', errorMessage)
      toast.error('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 z-10">
          <div className="p-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="h-8 w-8 -ml-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-lg font-bold text-gray-900">Delete Account</h1>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-bold">Warning: This action is irreversible</AlertTitle>
            <AlertDescription>
              Deleting your account will permanently remove all your data including:
            </AlertDescription>
          </Alert>

          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
              <p className="text-gray-600">
                All farm data (farms, crops, soil profiles, lab tests)
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
              <p className="text-gray-600">
                All records (irrigation, spray, fertigation, harvest, expenses)
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
              <p className="text-gray-600">Worker information and attendance records</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
              <p className="text-gray-600">Organization memberships and connections</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
              <p className="text-gray-600">
                All uploaded files (soil test reports, photos, documents)
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
              <p className="text-gray-600">Your profile, preferences, and authentication data</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account Deletion Request</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Confirm your email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={user?.email || 'Enter your email'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value.trim())}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Enter your account email to confirm deletion
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Confirm your password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Enter your password to verify your identity
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="reason" className="text-sm font-medium">
                    Reason for deletion (optional)
                  </label>
                  <textarea
                    id="reason"
                    className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Tell us why you're leaving..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">This helps us improve the service</p>
                </div>

                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      required
                    />
                    <span className="text-sm text-gray-700">
                      I understand that my account and all associated data will be{' '}
                      <strong>permanently deleted</strong> and cannot be recovered. I also
                      understand that this action cannot be undone.
                    </span>
                  </label>
                </div>

                <Button type="submit" variant="destructive" disabled={loading} className="w-full">
                  {loading ? 'Processing...' : 'Delete My Account'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-gray-500">
            <p>
              Changed your mind?{' '}
              <button
                onClick={() => router.push('/settings')}
                className="text-blue-600 hover:underline"
              >
                Go back to settings
              </button>
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
