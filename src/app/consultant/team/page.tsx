'use client'

import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Loader2, UserPlus, Users, Mail, Copy, Trash2, Clock } from 'lucide-react'
import { roleLabels } from '@/lib/consultant-access'
import { consultantKeys } from '@/lib/consultant-query-keys'
import {
  useConsultantAccess,
  useOrgMembers,
  usePendingInvites
} from '@/hooks/consultant/useConsultantQueries'
import posthog from 'posthog-js'
import { type OrgMember, type PendingInvite } from '@/lib/team-service'
import { TeamTabs } from '@/components/consultant/TeamTabs'

// Stable empty lists so derived memos keep a stable reference before the
// queries resolve.
const EMPTY_MEMBERS: OrgMember[] = []
const EMPTY_INVITES: PendingInvite[] = []

type InviteRole = 'admin' | 'agronomist'

function inviteLink(token: string) {
  return `${window.location.origin}/signup/member/${token}`
}

async function copyLink(token: string) {
  try {
    await navigator.clipboard.writeText(inviteLink(token))
    toast.success('Invite link copied to clipboard')
  } catch {
    toast.error('Failed to copy link')
  }
}

export default function TeamSettingsPage() {
  const accessQuery = useConsultantAccess()
  const access = accessQuery.data ?? null
  const isAdmin = access?.canViewAllFarmers ?? false
  // Members/invites live in the query cache; pending/error/data come from the
  // hooks instead of a `loading` useState mirrored from a fetch effect (which
  // flagged as derived state). Invites only load for admins, matching the old
  // canViewAllFarmers gate inside loadTeam.
  const membersQuery = useOrgMembers(access)
  const invitesQuery = usePendingInvites(isAdmin ? access : null)
  const members = membersQuery.data ?? EMPTY_MEMBERS
  const invites = invitesQuery.data ?? EMPTY_INVITES
  const queryClient = useQueryClient()

  // Invite dialog state
  const [inviteOpen, setInviteOpen] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<InviteRole>('agronomist')
  const [inviting, setInviting] = useState(false)
  const [createdToken, setCreatedToken] = useState<string | null>(null)
  const [createdReason, setCreatedReason] = useState<'existing_account' | 'email_failed' | null>(
    null
  )

  // Remove member state
  const [memberToRemove, setMemberToRemove] = useState<OrgMember | null>(null)
  const [removing, setRemoving] = useState(false)

  // Surface auth + fetch failures once each (side-effects only, never setState).
  useEffect(() => {
    if (accessQuery.isError) toast.error('Not authenticated')
  }, [accessQuery.isError])

  useEffect(() => {
    if (membersQuery.isError) toast.error('Failed to load team')
  }, [membersQuery.isError])

  // Fire the "viewed" analytics event once per resolved scope when member data
  // first lands (not on every background refetch).
  const capturedScopeRef = useRef<string | null>(null)
  useEffect(() => {
    if (!membersQuery.isSuccess || !access) return
    const scopeKey = `${access.organizationId}:${access.role}`
    if (capturedScopeRef.current === scopeKey) return
    capturedScopeRef.current = scopeKey
    posthog.capture('consultant_team_viewed', {
      org_id: access.organizationId,
      role: access.role,
      member_count: membersQuery.data?.length ?? 0
    })
  }, [membersQuery.isSuccess, membersQuery.data, access])

  const reloadMembers = () => {
    if (!access) return Promise.resolve()
    return queryClient.invalidateQueries({
      queryKey: consultantKeys.orgMembers(access.organizationId)
    })
  }

  const reloadInvites = () => {
    if (!access) return Promise.resolve()
    return queryClient.invalidateQueries({
      queryKey: consultantKeys.pendingInvites(access.organizationId)
    })
  }

  const resetInviteForm = () => {
    setFirstName('')
    setLastName('')
    setEmail('')
    setRole('agronomist')
    setCreatedToken(null)
    setCreatedReason(null)
  }

  const handleInviteOpenChange = (open: boolean) => {
    setInviteOpen(open)
    if (!open) {
      resetInviteForm()
      reloadInvites()
    }
  }

  const handleInviteSubmit = async () => {
    if (!access) return
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      setInviting(true)
      const res = await fetch('/api/organizations/invite-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: access.organizationId,
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      if (data.emailed) {
        // Supabase delivered the invite email — no link to copy, just confirm and close.
        toast.success(`Invitation emailed to ${email.trim()}`)
        handleInviteOpenChange(false)
      } else {
        // No email was sent (the invitee already has an account, or delivery failed). Fall back to
        // the shareable link so the admin can still get them in.
        setCreatedToken(data.invitation.token)
        setCreatedReason(data.reason ?? 'email_failed')
        toast.success('Invitation created')
      }
    } catch (error) {
      console.error('Failed to invite member:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!access || !memberToRemove) return

    try {
      setRemoving(true)
      const res = await fetch('/api/organizations/remove-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: access.organizationId,
          userId: memberToRemove.id
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove member')
      }

      toast.success('Member removed')
      setMemberToRemove(null)
      await reloadMembers()
    } catch (error) {
      console.error('Failed to remove member:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to remove member')
    } finally {
      setRemoving(false)
    }
  }

  const handleRevoke = async (invitationId: string) => {
    try {
      const res = await fetch('/api/organizations/invite-member/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to revoke invitation')
      }

      toast.success('Invitation revoked')
      await reloadInvites()
    } catch (error) {
      console.error('Failed to revoke invitation:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to revoke invitation')
    }
  }

  // Busy while access is resolving or either team query is still loading.
  // Derived directly from the query states during render.
  const busy =
    accessQuery.isPending ||
    (Boolean(access) && membersQuery.isPending) ||
    (isAdmin && invitesQuery.isPending)

  if (busy) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>

        {/* Members */}
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-28" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <TeamTabs canViewAllFarmers={isAdmin} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-muted-foreground">
            {members.length} member{members.length !== 1 ? 's' : ''} in your organization
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Invite member
          </Button>
        )}
      </div>

      {/* Members */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.map((member) => {
              const isSelf = member.id === access?.userId
              const canRemove = isAdmin && !member.is_owner && !isSelf
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">
                        {member.full_name || 'Unnamed member'}
                      </span>
                      <Badge variant={member.role === 'agronomist' ? 'secondary' : 'default'}>
                        {roleLabels[member.role]}
                      </Badge>
                      {isSelf && (
                        <Badge variant="outline" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                    {member.email && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    )}
                  </div>
                  {canRemove && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setMemberToRemove(member)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invites (admins only) */}
      {isAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              Pending invites
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invites.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending invitations.</p>
            ) : (
              <div className="space-y-2">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{invite.email}</span>
                        <Badge variant={invite.role === 'agronomist' ? 'secondary' : 'default'}>
                          {roleLabels[invite.role]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Expires {new Date(invite.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => copyLink(invite.token)}>
                        <Copy className="h-4 w-4" />
                        Copy link
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleRevoke(invite.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Revoke
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={handleInviteOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite member</DialogTitle>
            <DialogDescription>
              Send an invite link to add a new admin or agronomist to your organization.
            </DialogDescription>
          </DialogHeader>

          {createdToken ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {createdReason === 'existing_account'
                  ? 'This person already has a VineSight account, so we couldn’t email a new invite. Share this link — they can sign in to accept. It expires in 7 days.'
                  : 'We couldn’t send the invite email. Share this link with the invitee instead. It expires in 7 days.'}
              </p>
              <div className="flex items-center gap-2">
                <Input readOnly value={inviteLink(createdToken)} className="text-xs" />
                <Button variant="outline" onClick={() => copyLink(createdToken)}>
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="invite-first-name">First name</Label>
                  <Input
                    id="invite-first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Asha"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invite-last-name">Last name</Label>
                  <Input
                    id="invite-last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Patil"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="asha@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invite-role">Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as InviteRole)}>
                  <SelectTrigger id="invite-role" className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="agronomist">Agronomist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            {createdToken ? (
              <Button onClick={() => handleInviteOpenChange(false)}>Done</Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleInviteOpenChange(false)}
                  disabled={inviting}
                >
                  Cancel
                </Button>
                <Button onClick={handleInviteSubmit} disabled={inviting}>
                  {inviting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send invite
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove member confirmation */}
      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              {memberToRemove?.full_name || memberToRemove?.email || 'This member'} will lose access
              to the organization and any assigned farmers will be unassigned. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={removing}
            >
              {removing && <Loader2 className="h-4 w-4 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
