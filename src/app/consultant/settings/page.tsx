'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { LogOut, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { useConsultantAccess } from '@/hooks/consultant/useConsultantQueries'
import { OrganizationIdentityCard } from '@/components/consultant/OrganizationIdentityCard'
import { JoinCodeCard } from '@/components/consultant/JoinCodeCard'

export default function ConsultantSettingsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, signOut } = useSupabaseAuth()
  const accessQuery = useConsultantAccess()
  const access = accessQuery.data ?? null
  const [signingOut, setSigningOut] = useState(false)

  // Re-fetch the consultant-access query so the sidebar (logo + org name) picks
  // up branding edits without a full reload.
  const refreshAccess = () => {
    queryClient.invalidateQueries({ queryKey: ['consultant', 'access'] })
  }

  const handleSignOut = async () => {
    try {
      setSigningOut(true)
      const result = await signOut()
      if (result.success) router.push('/')
    } catch {
      toast.error('Failed to sign out. Please try again.')
    } finally {
      setSigningOut(false)
    }
  }

  const displayName = user?.user_metadata?.full_name || user?.email || 'You'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your organization and account</p>
      </div>

      {accessQuery.isPending ? (
        <div className="space-y-6">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      ) : access ? (
        <>
          <OrganizationIdentityCard access={access} onUpdated={refreshAccess} />
          <JoinCodeCard access={access} />
        </>
      ) : (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Couldn’t load your organization. Please refresh to try again.
          </CardContent>
        </Card>
      )}

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>You’re signed in to the organization workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-sm font-medium">{displayName}</p>
            {user?.email ? <p className="text-xs text-muted-foreground">{user.email}</p> : null}
          </div>
          <Button variant="outline" onClick={handleSignOut} disabled={signingOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>Irreversible account actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => router.push('/delete-account')}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
