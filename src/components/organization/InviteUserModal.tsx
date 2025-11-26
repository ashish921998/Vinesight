'use client'

/**
 * InviteUserModal - Invite new members to organization
 * Generates invitation link and optionally sends email
 */

import { useState } from 'react'
import { useOrganization } from '@/contexts/OrganizationContext'
import { organizationService } from '@/lib/organization-service'
import type { UserRole } from '@/types/rbac'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Link2, Check, AlertCircle, Info } from 'lucide-react'
import { ROLE_DESCRIPTIONS, USER_ROLES } from '@/types/rbac'

interface InviteUserModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function InviteUserModal({ open, onClose, onSuccess }: InviteUserModalProps) {
  const { currentOrganization, userMembership } = useOrganization()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('field_worker')
  const [message, setMessage] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInvite = async () => {
    if (!currentOrganization || !userMembership) return

    // Validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    // Check if can add member
    const canAdd = await organizationService.canAddMember(currentOrganization.id)
    if (!canAdd) {
      setError(`Member limit reached (${currentOrganization.maxUsers} max)`)
      return
    }

    setInviting(true)
    setError(null)

    try {
      // Generate invitation
      const token = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

      const invitation = await organizationService.createInvitation({
        organizationId: currentOrganization.id,
        email,
        role,
        token,
        expiresAt: expiresAt.toISOString(),
        invitedBy: userMembership.userId,
        message: message || undefined
      })

      if (invitation) {
        // Generate invitation link
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const link = `${baseUrl}/invite/${token}`
        setInviteLink(link)

        // TODO: Send email notification (implement email service)
        // await sendInvitationEmail(email, link, currentOrganization.name, message)

        onSuccess()
      } else {
        setError('Failed to create invitation. Please try again.')
      }
    } catch (err) {
      console.error('Error creating invitation:', err)
      setError('An error occurred while creating the invitation')
    } finally {
      setInviting(false)
    }
  }

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setEmail('')
    setRole('field_worker')
    setMessage('')
    setInviteLink(null)
    setCopied(false)
    setError(null)
    onClose()
  }

  const formatRoleName = (role: string) => {
    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Filter roles - don't allow inviting as owner
  const availableRoles = USER_ROLES.filter((r) => r !== 'owner')

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join {currentOrganization?.name}
          </DialogDescription>
        </DialogHeader>

        {!inviteLink ? (
          <div className="space-y-4 py-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={inviting}
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      <div className="flex flex-col gap-1 py-1">
                        <span className="font-medium">{formatRoleName(r)}</span>
                        <span className="text-xs text-muted-foreground">
                          {ROLE_DESCRIPTIONS[r]}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
            </div>

            {/* Optional Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Welcome Message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personal message to the invitation..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={inviting}
                rows={3}
              />
            </div>

            {/* Info Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Invitation link will be valid for 7 days. The recipient will be able to accept the
                invitation and join your organization with the {formatRoleName(role)} role.
              </AlertDescription>
            </Alert>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Success Message */}
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Invitation created successfully! Share the link below with {email}.
              </AlertDescription>
            </Alert>

            {/* Invitation Link */}
            <div className="space-y-2">
              <Label>Invitation Link</Label>
              <div className="flex gap-2">
                <Input value={inviteLink} readOnly className="font-mono text-sm" />
                <Button onClick={handleCopyLink} variant="outline" className="gap-2">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Role Badge */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Role:</span>
              <Badge variant="outline">{formatRoleName(role)}</Badge>
            </div>

            {/* Info */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                The recipient will need to sign in or create an account before accepting the
                invitation. The link expires in 7 days.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter>
          {!inviteLink ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={inviting}>
                Cancel
              </Button>
              <Button onClick={handleInvite} disabled={inviting || !email || !role}>
                {inviting ? 'Creating Invitation...' : 'Create Invitation'}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
