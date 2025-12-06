'use client'

/**
 * MemberManagement - Manage organization members
 * List, invite, edit roles, and remove members
 */

import { useState, useEffect } from 'react'
import { useOrganization } from '@/contexts/OrganizationContext'
import { organizationService } from '@/lib/organization-service'
import type { OrganizationMember, UserRole } from '@/types/rbac'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
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
import {
  Users,
  MoreVertical,
  Mail,
  Shield,
  UserMinus,
  Crown,
  Clock,
  UserPlus
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ROLE_DESCRIPTIONS } from '@/types/rbac'
import { InviteUserModal } from './InviteUserModal'
import { RequireAdmin } from '@/components/rbac/PermissionGuard'

export function MemberManagement() {
  const { currentOrganization, userMembership, isOrgAdmin } = useOrganization()
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<OrganizationMember | null>(null)
  const [removingMember, setRemovingMember] = useState(false)

  useEffect(() => {
    if (currentOrganization) {
      loadMembers()
    }
  }, [currentOrganization])

  const loadMembers = async () => {
    if (!currentOrganization) return

    setLoading(true)
    try {
      const membersList = await organizationService.getMembers(currentOrganization.id)
      setMembers(membersList)
    } catch (error) {
      console.error('Error loading members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!memberToRemove || !currentOrganization) return

    setRemovingMember(true)
    try {
      const success = await organizationService.removeMember(
        memberToRemove.id,
        currentOrganization.id
      )

      if (success) {
        await loadMembers()
        setMemberToRemove(null)
      }
    } catch (error) {
      console.error('Error removing member:', error)
    } finally {
      setRemovingMember(false)
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'admin':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'farm_manager':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'supervisor':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'field_worker':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'consultant':
        return 'bg-cyan-100 text-cyan-700 border-cyan-200'
      case 'accountant':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200'
      case 'viewer':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3" />
      case 'admin':
        return <Shield className="h-3 w-3" />
      default:
        return null
    }
  }

  const formatRoleName = (role: string) => {
    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (!currentOrganization) {
    return null
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>
                Manage your organization's members and their roles
              </CardDescription>
            </div>

            <RequireAdmin>
              <Button onClick={() => setShowInviteModal(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite Member
              </Button>
            </RequireAdmin>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading members...</div>
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                No team members yet. Invite your first member to get started.
              </p>
              <RequireAdmin>
                <Button onClick={() => setShowInviteModal(true)}>Invite Member</Button>
              </RequireAdmin>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Active</TableHead>
                    <RequireAdmin>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </RequireAdmin>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{member.userId.slice(0, 8)}...</div>
                            {member.userId === userMembership?.userId && (
                              <Badge variant="outline" className="text-xs">
                                You
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className={getRoleBadgeColor(member.role)}>
                          <span className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {formatRoleName(member.role)}
                          </span>
                        </Badge>
                        {member.assignedFarmIds && member.assignedFarmIds.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {member.assignedFarmIds.length} farm(s) assigned
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={member.status === 'active' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {member.status}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {member.lastActiveAt
                            ? formatDistanceToNow(new Date(member.lastActiveAt), {
                                addSuffix: true
                              })
                            : 'Never'}
                        </div>
                      </TableCell>

                      <RequireAdmin>
                        <TableCell>
                          {member.role !== 'owner' && member.userId !== userMembership?.userId && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Member Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive cursor-pointer"
                                  onClick={() => setMemberToRemove(member)}
                                >
                                  <UserMinus className="h-4 w-4 mr-2" />
                                  Remove Member
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </RequireAdmin>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 text-xs text-muted-foreground">
            {members.length} of {currentOrganization.maxUsers} members
          </div>
        </CardContent>
      </Card>

      {/* Invite Modal */}
      <InviteUserModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={loadMembers}
      />

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from your organization? They will lose
              access to all organization data and farms.
              {memberToRemove && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <div className="text-sm font-medium text-foreground">
                    Role: {formatRoleName(memberToRemove.role)}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removingMember}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={removingMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removingMember ? 'Removing...' : 'Remove Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
