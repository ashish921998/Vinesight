'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { OrganizationService, type Organization } from '@/lib/organization-service'
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
import { Loader2, Users, UserPlus, Copy, Check, Building2, Shield, Leaf } from 'lucide-react'
import { toast } from 'sonner'

interface OrgMember {
  id: string
  user_id: string
  role: string
  is_owner: boolean | null
  joined_at: string | null
}

function UsersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [members, setMembers] = useState<OrgMember[]>([])
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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

      // Load members
      const { data: orgMembers } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', org.id)

      setMembers(orgMembers || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadData()
  }, [loadData])

  const generateInviteLink = () => {
    if (!organization) return
    const baseUrl = window.location.origin
    const slug = organization.slug || organization.id
    setInviteLink(`${baseUrl}/signup/user/${slug}`)
  }

  const copyToClipboard = async () => {
    if (!inviteLink) return

    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const resetInviteDialog = () => {
    setShowInviteDialog(false)
    setInviteLink(null)
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
          <h1 className="text-2xl sm:text-3xl font-bold">Team Members</h1>
          <p className="text-muted-foreground mt-1">Manage your organization&apos;s team</p>
        </div>

        <Dialog open={showInviteDialog} onOpenChange={(open) => !open && resetInviteDialog()}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Team Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Share this link with agronomists or admins to join your organization.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {!inviteLink ? (
                <Button onClick={generateInviteLink} className="w-full gap-2">
                  <Copy className="h-4 w-4" />
                  Get Invite Link
                </Button>
              ) : (
                <div className="space-y-3">
                  <Label>Invite Link</Label>
                  <div className="flex gap-2">
                    <Input value={inviteLink} readOnly className="font-mono text-sm" />
                    <Button variant="outline" size="icon" onClick={copyToClipboard}>
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    New team members will join as agronomists
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={resetInviteDialog}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Members List */}
      {members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Team Members</h2>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Invite agronomists and admins to join your organization
            </p>
            <Button onClick={() => setShowInviteDialog(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invite First Team Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {members.map((member) => (
            <Card key={member.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {member.role === 'admin' ? (
                      <Shield className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Leaf className="h-5 w-5 text-green-600" />
                    )}
                    <div>
                      <CardTitle className="text-lg capitalize">{member.role}</CardTitle>
                      <CardDescription>User ID: {member.user_id}</CardDescription>
                    </div>
                  </div>
                  {member.is_owner && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                      Owner
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Joined:{' '}
                  {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'N/A'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function UsersPageWithAuth() {
  return (
    <ProtectedRoute>
      <UsersPage />
    </ProtectedRoute>
  )
}
