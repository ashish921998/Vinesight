'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  OrganizationService,
  type OrganizationClient,
  type Organization
} from '@/lib/organization-service'
import { getTypedSupabaseClient } from '@/lib/supabase'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Users, UserPlus, Mail, Building2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

function ClientsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [clients, setClients] = useState<OrganizationClient[]>([])
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  // Invite form state
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = await getTypedSupabaseClient()
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const orgs = await OrganizationService.getUserOrganizations(user.id)
      if (orgs.length === 0) {
        setOrganization(null)
        return
      }

      const org = orgs[0]
      setOrganization(org)

      const orgClients = await OrganizationService.getOrganizationClients(org.id)
      setClients(orgClients)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadData()
  }, [loadData])

  // P2: Email format validation
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const sendInvite = async () => {
    if (!organization || !inviteName.trim()) return

    const email = inviteEmail.trim()
    if (!email || !isValidEmail(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    try {
      setSending(true)

      const signupLink = `${window.location.origin}/signup`

      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization.id,
          organizationName: organization.name,
          farmerName: inviteName.trim(),
          farmerEmail: inviteEmail.trim(),
          signupLink
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send invite')
      }

      setInviteSent(true)
      toast.success('Invitation sent successfully!')
    } catch (error) {
      console.error('Error sending invite:', error)
      toast.error('Failed to send invitation')
    } finally {
      setSending(false)
    }
  }

  const resetInviteDialog = () => {
    setShowInviteDialog(false)
    setInviteName('')
    setInviteEmail('')
    setInviteSent(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Organization</h2>
            <p className="text-muted-foreground text-center max-w-md">
              You are not part of any organization.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground mt-1">
            Manage farmers connected to {organization.name}
          </p>
        </div>

        <Dialog open={showInviteDialog} onOpenChange={(open) => !open && resetInviteDialog()}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Farmer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Farmer</DialogTitle>
              <DialogDescription>
                Send an email invitation to a farmer to join your organization.
              </DialogDescription>
            </DialogHeader>

            {inviteSent ? (
              <div className="py-8 text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Invitation Sent!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    An email has been sent to {inviteEmail}
                  </p>
                </div>
                <Button onClick={resetInviteDialog}>Done</Button>
              </div>
            ) : (
              <>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="farmerName">Farmer Name</Label>
                    <Input
                      id="farmerName"
                      placeholder="John Doe"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="farmerEmail">Email Address</Label>
                    <Input
                      id="farmerEmail"
                      type="email"
                      placeholder="farmer@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={resetInviteDialog}>
                    Cancel
                  </Button>
                  <Button
                    onClick={sendInvite}
                    disabled={sending || !inviteName.trim() || !inviteEmail.trim()}
                    className="gap-2"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Clients List */}
      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Clients Yet</h2>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Start by inviting farmers to connect with your organization
            </p>
            <Button onClick={() => setShowInviteDialog(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Your First Farmer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {clients.map((client) => (
            <Card
              key={client.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => router.push(`/clients/${client.client_user_id}`)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {client.full_name || client.email || 'Unknown Farmer'}
                </CardTitle>
                <CardDescription>{client.email || 'No email'}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Added:{' '}
                  {client.assigned_at ? new Date(client.assigned_at).toLocaleDateString() : 'N/A'}
                </p>
                {client.notes && <p className="text-sm mt-2">{client.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ClientsPageWithAuth() {
  return (
    <ProtectedRoute>
      <ClientsPage />
    </ProtectedRoute>
  )
}
