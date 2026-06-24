'use client'

import { useRef, useState } from 'react'
import { Building2, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { roleLabels, type ConsultantAccess } from '@/lib/consultant-access'
import {
  removeOrganizationLogo,
  updateOrganizationName,
  uploadOrganizationLogo
} from '@/lib/consultant-org-service'

const MAX_LOGO_BYTES = 2 * 1024 * 1024 // keep in sync with the API route

// The org's logo + name (what shows in the workspace sidebar), plus read-only
// role/access context. Owners and admins can edit; agronomists see it locked.
export function OrganizationIdentityCard({
  access,
  onUpdated
}: {
  access: ConsultantAccess
  onUpdated: () => void
}) {
  const canManage = access.role === 'owner' || access.role === 'admin'
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(access.organizationName ?? '')
  const [savingName, setSavingName] = useState(false)
  const [logoBusy, setLogoBusy] = useState(false)

  const trimmedName = name.trim()
  const nameValid = trimmedName.length >= 1 && trimmedName.length <= 120
  const nameDirty = trimmedName !== (access.organizationName ?? '').trim()

  const handleSaveName = async () => {
    if (!nameValid || !nameDirty) return
    try {
      setSavingName(true)
      await updateOrganizationName(trimmedName)
      toast.success('Organization name updated')
      onUpdated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update name')
    } finally {
      setSavingName(false)
    }
  }

  const handleLogoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = '' // let the same file be re-selected after an error
    if (!file) return
    if (file.size > MAX_LOGO_BYTES) {
      toast.error('Logo must be 2 MB or smaller')
      return
    }
    try {
      setLogoBusy(true)
      await uploadOrganizationLogo(file)
      toast.success('Logo updated')
      onUpdated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload logo')
    } finally {
      setLogoBusy(false)
    }
  }

  const handleRemoveLogo = async () => {
    try {
      setLogoBusy(true)
      await removeOrganizationLogo()
      toast.success('Logo removed')
      onUpdated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove logo')
    } finally {
      setLogoBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization</CardTitle>
        <CardDescription>Your logo and name appear in the workspace sidebar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 shrink-0 rounded-lg border border-border">
            <AvatarImage
              src={access.logoUrl ?? undefined}
              alt={access.organizationName ?? 'Organization logo'}
              className="object-contain"
            />
            <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-7 w-7" />
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-2">
            {canManage ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={logoBusy}
                  >
                    {logoBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ImagePlus className="h-3.5 w-3.5" />
                    )}
                    {access.logoUrl ? 'Replace logo' : 'Upload logo'}
                  </Button>
                  {access.logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveLogo}
                      disabled={logoBusy}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  PNG, JPG, WEBP, or SVG · up to 2 MB · a square image works best.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoSelected}
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Only an owner or admin can change the logo and name.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="org-name">Organization name</Label>
          {canManage ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                placeholder="Your organization name"
                className="sm:flex-1"
              />
              <Button
                type="button"
                onClick={handleSaveName}
                disabled={!nameValid || !nameDirty || savingName}
              >
                {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save
              </Button>
            </div>
          ) : (
            <p className="text-sm font-medium">{access.organizationName ?? '—'}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Your role</p>
            <p className="font-medium">{roleLabels[access.role]}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Access</p>
            <p className="font-medium">
              {access.canViewAllFarmers ? 'All client farmers' : 'Assigned farmers only'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
