'use client'

/**
 * OrganizationSettings - Manage organization details and settings
 */

import { useState, useEffect } from 'react'
import { useOrganization } from '@/contexts/OrganizationContext'
import { organizationService } from '@/lib/organization-service'
import type { OrganizationUpdate } from '@/types/rbac'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import {
  Building2,
  Save,
  AlertTriangle,
  Check,
  Trash2,
  Users,
  Package,
  CreditCard
} from 'lucide-react'
import { RequireAdmin, RequireOwner } from '@/components/rbac/PermissionGuard'

export function OrganizationSettings() {
  const { currentOrganization, isOrgOwner, refreshMembership } = useOrganization()
  const [formData, setFormData] = useState({
    name: '',
    registrationNumber: '',
    taxId: '',
    address: '',
    contactEmail: '',
    contactPhone: ''
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [memberCount, setMemberCount] = useState(0)
  const [farmCount, setFarmCount] = useState(0)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (currentOrganization) {
      setFormData({
        name: currentOrganization.name,
        registrationNumber: currentOrganization.registrationNumber || '',
        taxId: currentOrganization.taxId || '',
        address: currentOrganization.address || '',
        contactEmail: currentOrganization.contactEmail || '',
        contactPhone: currentOrganization.contactPhone || ''
      })
      loadStats()
    }
  }, [currentOrganization])

  const loadStats = async () => {
    if (!currentOrganization) return

    setLoadingStats(true)
    try {
      const [members, farms] = await Promise.all([
        organizationService.getMemberCount(currentOrganization.id),
        organizationService.getFarmCount(currentOrganization.id)
      ])
      setMemberCount(members)
      setFarmCount(farms)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleSave = async () => {
    if (!currentOrganization) return

    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const updates: OrganizationUpdate = {
        name: formData.name,
        registrationNumber: formData.registrationNumber || undefined,
        taxId: formData.taxId || undefined,
        address: formData.address || undefined,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined
      }

      const updated = await organizationService.updateOrganization(currentOrganization.id, updates)

      if (updated) {
        setSaved(true)
        await refreshMembership()
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError('Failed to update organization')
      }
    } catch (err) {
      console.error('Error updating organization:', err)
      setError('An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteOrganization = async () => {
    if (!currentOrganization) return

    try {
      const success = await organizationService.deleteOrganization(currentOrganization.id)
      if (success) {
        // Redirect to home or show success message
        window.location.href = '/dashboard'
      } else {
        setError('Failed to delete organization')
      }
    } catch (err) {
      console.error('Error deleting organization:', err)
      setError('An error occurred while deleting')
    }
  }

  const getSubscriptionBadgeColor = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-700'
      case 'business':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (!currentOrganization) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Organization Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Overview
          </CardTitle>
          <CardDescription>View your organization's key information and usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Team Members</p>
                <p className="text-2xl font-bold">
                  {loadingStats ? '...' : memberCount}/{currentOrganization.maxUsers}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Farms</p>
                <p className="text-2xl font-bold">
                  {loadingStats ? '...' : farmCount}/{currentOrganization.maxFarms}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subscription</p>
                <Badge className={getSubscriptionBadgeColor(currentOrganization.subscriptionTier)}>
                  {currentOrganization.subscriptionTier}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization Details */}
      <RequireAdmin>
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>Update your organization's information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Organization"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Organization Type</Label>
                <Input id="type" value={currentOrganization.type} disabled className="capitalize" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Registration Number</Label>
                <Input
                  id="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  placeholder="REG123456"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID / GSTIN</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  placeholder="29AABCU9603R1ZV"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter organization address"
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="contact@organization.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {saved && (
              <Alert className="bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Settings saved successfully!
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving || !formData.name} className="gap-2">
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </RequireAdmin>

      {/* Danger Zone */}
      <RequireOwner>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions for organization management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Delete Organization</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this organization and all associated data
                </p>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete Organization
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>
                        This action cannot be undone. This will permanently delete the organization
                        <strong> {currentOrganization.name}</strong> and remove all associated data
                        including:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>{memberCount} team member(s)</li>
                        <li>{farmCount} farm(s)</li>
                        <li>All farm records and data</li>
                        <li>All audit logs</li>
                      </ul>
                      <p className="font-medium text-destructive pt-2">
                        Type the organization name to confirm:
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Input
                    placeholder={currentOrganization.name}
                    onChange={(e) => {
                      const button = document.getElementById('confirm-delete-btn') as HTMLButtonElement
                      if (button) {
                        button.disabled = e.target.value !== currentOrganization.name
                      }
                    }}
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      id="confirm-delete-btn"
                      onClick={handleDeleteOrganization}
                      disabled
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Organization
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </RequireOwner>
    </div>
  )
}
