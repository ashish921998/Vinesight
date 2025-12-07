'use client'

/**
 * Invitation Acceptance Page
 * Users land here when clicking invitation links
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { organizationService } from '@/lib/organization-service'
import { getSupabaseClient } from '@/lib/supabase'
import type { OrganizationInvitation } from '@/types/rbac'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Building2, Check, X, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function InvitationPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = getSupabaseClient()
  const token = params.token as string

  const [invitation, setInvitation] = useState<OrganizationInvitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkUser()
    loadInvitation()
  }, [token])

  const checkUser = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadInvitation = async () => {
    setLoading(true)
    setError(null)

    try {
      const inv = await organizationService.getInvitationByToken(token)

      if (!inv) {
        setError('Invitation not found or invalid')
        return
      }

      if (inv.status !== 'pending') {
        setError('This invitation has already been used')
        return
      }

      if (new Date(inv.expiresAt) < new Date()) {
        setError('This invitation has expired')
        return
      }

      setInvitation(inv)
    } catch (err) {
      console.error('Error loading invitation:', err)
      setError('Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!invitation || !user) return

    setAccepting(true)
    setError(null)

    try {
      const member = await organizationService.acceptInvitation(token, user.id)

      if (member) {
        // Success! Redirect to organization
        router.push('/organization/settings')
      } else {
        setError('Failed to accept invitation. Please try again.')
      }
    } catch (err) {
      console.error('Error accepting invitation:', err)
      setError('An error occurred while accepting the invitation')
    } finally {
      setAccepting(false)
    }
  }

  const handleSignIn = () => {
    // Store return URL to come back after sign in
    sessionStorage.setItem('redirectAfterAuth', `/invite/${token}`)
    router.push('/auth')
  }

  const formatRoleName = (role: string) => {
    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (loading) {
    return (
      <div className="container max-w-2xl py-16">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container max-w-2xl py-16">
        <Card>
          <CardContent className="py-12 text-center">
            <X className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invitation) {
    return null
  }

  return (
    <div className="container max-w-2xl py-16">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">You've Been Invited!</CardTitle>
          <CardDescription>You've received an invitation to join an organization</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Invitation Details */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Organization</p>
                <p className="font-medium">
                  Organization ID: {invitation.organizationId.slice(0, 8)}...
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                {formatRoleName(invitation.role)}
              </Badge>
              <div>
                <p className="text-sm text-muted-foreground">Your Role</p>
              </div>
            </div>

            {invitation.assignedFarmIds && invitation.assignedFarmIds.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Assigned Farms</p>
                <p className="font-medium">{invitation.assignedFarmIds.length} farm(s)</p>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Expires {formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })}
              </span>
            </div>

            {invitation.message && (
              <div className="pt-3 border-t">
                <p className="text-sm text-muted-foreground mb-1">Message from inviter:</p>
                <p className="text-sm italic">&quot;{invitation.message}&quot;</p>
              </div>
            )}
          </div>

          {/* Sign In Required */}
          {!user ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to sign in or create an account before accepting this invitation
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-blue-50 border-blue-200">
              <Check className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                You're signed in as {user.email}. Ready to accept the invitation!
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {user ? (
              <>
                <Button
                  onClick={handleAccept}
                  disabled={accepting}
                  size="lg"
                  className="w-full gap-2"
                >
                  {accepting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Accepting...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Accept Invitation
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  disabled={accepting}
                  size="lg"
                  className="w-full"
                >
                  Decline
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleSignIn} size="lg" className="w-full">
                  Sign In to Accept
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/')}
                  size="lg"
                  className="w-full"
                >
                  Back to Home
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
