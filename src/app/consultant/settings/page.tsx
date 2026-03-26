'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { getTypedSupabaseClient } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Users,
  Settings,
  Bell,
  Shield,
  UserPlus,
  Loader2,
  Mail,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Building2,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

interface Agronomist {
  id: string
  user_id: string
  full_name: string | null
  email: string
  role: 'admin' | 'agronomist' | 'viewer'
  assigned_farm_count: number
  created_at: string
}

interface NotificationPreferences {
  triage_urgent: boolean
  triage_daily_digest: boolean
  cluster_alerts: boolean
  template_updates: boolean
  email_enabled: boolean
  sms_enabled: boolean
}

export default function DashboardSettingsPage() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [loading, setLoading] = useState(true)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [organizationName, setOrganizationName] = useState<string>('')
  const [agronomists, setAgronomists] = useState<Agronomist[]>([])
  const [isAdmin, setIsAdmin] = useState(false)

  // Invite dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'agronomist' | 'viewer'>('agronomist')
  const [inviteLoading, setInviteLoading] = useState(false)

  // Notification preferences
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    triage_urgent: true,
    triage_daily_digest: true,
    cluster_alerts: true,
    template_updates: false,
    email_enabled: true,
    sms_enabled: false
  })
  const [savingNotifications, setSavingNotifications] = useState(false)

  // Load initial data
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const supabase = await getTypedSupabaseClient()
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Not authenticated')
        return
      }

      // Get organization membership with role
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, role, organizations(id, name)')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (!membership?.organization_id) {
        toast.error('No organization found')
        return
      }

      const orgId = membership.organization_id
      setOrganizationId(orgId)
      setOrganizationName((membership.organizations as any)?.name || '')
      setIsAdmin(membership.role === 'admin')

      // Load agronomists
      await loadAgronomists(orgId)

      // Load notification preferences (from localStorage for MVP, could be DB later)
      const savedPrefs = localStorage.getItem(`notification_prefs_${orgId}`)
      if (savedPrefs) {
        setNotifications(JSON.parse(savedPrefs))
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const loadAgronomists = async (orgId: string) => {
    try {
      const supabase = await getTypedSupabaseClient()

      const { data: members, error } = await supabase
        .from('organization_members')
        .select(
          `
          user_id,
          role,
          created_at,
          profiles:user_id(id, full_name, email)
        `
        )
        .eq('organization_id', orgId)

      if (error) throw error

      // Get assigned farm counts for each agronomist
      const agronomistData: Agronomist[] = await Promise.all(
        (members || []).map(async (member: any) => {
          const { count } = await supabase
            .from('organization_clients')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('assigned_to', member.user_id)

          return {
            id: member.user_id,
            user_id: member.user_id,
            full_name: member.profiles?.full_name,
            email: member.profiles?.email || '',
            role: member.role,
            assigned_farm_count: count || 0,
            created_at: member.created_at
          }
        })
      )

      setAgronomists(agronomistData)
    } catch (error) {
      console.error('Failed to load agronomists:', error)
      toast.error('Failed to load team members')
    }
  }

  const handleInvite = async () => {
    if (!organizationId || !inviteEmail) return

    try {
      setInviteLoading(true)

      // In a real implementation, this would call an API to send an invite email
      // For MVP, we'll just show a success message and clear the form
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success(`Invitation sent to ${inviteEmail}`)
      setInviteDialogOpen(false)
      setInviteEmail('')
      setInviteRole('agronomist')
    } catch (error) {
      console.error('Failed to send invite:', error)
      toast.error('Failed to send invitation')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleNotificationChange = (key: keyof NotificationPreferences, value: boolean) => {
    const updated = { ...notifications, [key]: value }
    setNotifications(updated)
  }

  const saveNotifications = useCallback(async () => {
    if (!organizationId) return

    try {
      setSavingNotifications(true)
      localStorage.setItem(`notification_prefs_${organizationId}`, JSON.stringify(notifications))
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success('Notification preferences saved')
    } catch (error) {
      console.error('Failed to save notifications:', error)
      toast.error('Failed to save preferences')
    } finally {
      setSavingNotifications(false)
    }
  }, [notifications, organizationId])

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-primary">Admin</Badge>
      case 'agronomist':
        return <Badge variant="secondary">Agronomist</Badge>
      case 'viewer':
        return <Badge variant="outline">Viewer</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization, team, and notification preferences
        </p>
      </div>

      {/* Mobile: Single column layout */}
      {isMobile ? (
        <div className="space-y-4">
          {/* Organization Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Organization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{organizationName || 'Your Organization'}</p>
                  <p className="text-xs text-muted-foreground">
                    {agronomists.length} team member{agronomists.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Management */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Team
                </CardTitle>
                {isAdmin && (
                  <Button size="sm" onClick={() => setInviteDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Invite
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {agronomists.map((agronomist) => (
                <div
                  key={agronomist.user_id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{agronomist.full_name || 'Unnamed User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{agronomist.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getRoleBadge(agronomist.role)}
                    {agronomist.assigned_farm_count > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {agronomist.assigned_farm_count} farms
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Triage Alerts</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="text-sm">Urgent (Red) items</span>
                    </div>
                    <Switch
                      checked={notifications.triage_urgent}
                      onCheckedChange={(v) => handleNotificationChange('triage_urgent', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Daily digest</span>
                    </div>
                    <Switch
                      checked={notifications.triage_daily_digest}
                      onCheckedChange={(v) => handleNotificationChange('triage_daily_digest', v)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Other Alerts</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cluster alerts</span>
                    <Switch
                      checked={notifications.cluster_alerts}
                      onCheckedChange={(v) => handleNotificationChange('cluster_alerts', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Template updates</span>
                    <Switch
                      checked={notifications.template_updates}
                      onCheckedChange={(v) => handleNotificationChange('template_updates', v)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Channels</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Email</span>
                    </div>
                    <Switch
                      checked={notifications.email_enabled}
                      onCheckedChange={(v) => handleNotificationChange('email_enabled', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">SMS</span>
                    </div>
                    <Switch
                      checked={notifications.sms_enabled}
                      onCheckedChange={(v) => handleNotificationChange('sms_enabled', v)}
                    />
                  </div>
                </div>
              </div>

              <Button className="w-full" onClick={saveNotifications} disabled={savingNotifications}>
                {savingNotifications ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Save Preferences
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Desktop: Tabbed layout */
        <Tabs defaultValue="team" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Organization Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Organization
                  </CardTitle>
                  <CardDescription>Your consultant organization details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-lg">
                        {organizationName || 'Your Organization'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {agronomists.length} team member{agronomists.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invite Card */}
              {isAdmin && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Invite Team Member
                    </CardTitle>
                    <CardDescription>
                      Add agronomists or viewers to your organization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" onClick={() => setInviteDialogOpen(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Send Invitation
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Team Members Table */}
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage your agronomist team and their assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {agronomists.map((agronomist) => (
                    <div
                      key={agronomist.user_id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{agronomist.full_name || 'Unnamed User'}</p>
                            {getRoleBadge(agronomist.role)}
                          </div>
                          <p className="text-sm text-muted-foreground">{agronomist.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="text-right">
                          <p className="font-medium text-foreground">
                            {agronomist.assigned_farm_count}
                          </p>
                          <p>Assigned farms</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {agronomists.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No team members yet</p>
                      {isAdmin && (
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => setInviteDialogOpen(true)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invite your first team member
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Triage Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Triage Alerts
                  </CardTitle>
                  <CardDescription>Get notified about petiole test classifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Urgent (Red) Items</Label>
                      <p className="text-sm text-muted-foreground">
                        Immediate notification for critical deficiencies
                      </p>
                    </div>
                    <Switch
                      checked={notifications.triage_urgent}
                      onCheckedChange={(v) => handleNotificationChange('triage_urgent', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Daily Digest</Label>
                      <p className="text-sm text-muted-foreground">
                        Summary of all pending triage items
                      </p>
                    </div>
                    <Switch
                      checked={notifications.triage_daily_digest}
                      onCheckedChange={(v) => handleNotificationChange('triage_daily_digest', v)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Other Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Other Alerts
                  </CardTitle>
                  <CardDescription>Additional notifications from the dashboard</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Cluster Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        When new farm clusters are detected
                      </p>
                    </div>
                    <Switch
                      checked={notifications.cluster_alerts}
                      onCheckedChange={(v) => handleNotificationChange('cluster_alerts', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Template Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        When fertilizer templates are modified
                      </p>
                    </div>
                    <Switch
                      checked={notifications.template_updates}
                      onCheckedChange={(v) => handleNotificationChange('template_updates', v)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Channels */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Notification Channels
                  </CardTitle>
                  <CardDescription>How you want to receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Label>Email Notifications</Label>
                    </div>
                    <Switch
                      checked={notifications.email_enabled}
                      onCheckedChange={(v) => handleNotificationChange('email_enabled', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <Label>SMS Notifications</Label>
                    </div>
                    <Switch
                      checked={notifications.sms_enabled}
                      onCheckedChange={(v) => handleNotificationChange('sms_enabled', v)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button
              onClick={saveNotifications}
              disabled={savingNotifications}
              className="w-full sm:w-auto"
            >
              {savingNotifications ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Save Notification Preferences
                </>
              )}
            </Button>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Data Access & Security
                </CardTitle>
                <CardDescription>Review how farm data is accessed and protected</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Row Level Security Active</p>
                      <p className="text-sm text-muted-foreground">
                        All farm data is protected with organization-based access controls.
                        Agronomists can only access data for farms assigned to your organization.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Audit Logging</p>
                      <p className="text-sm text-muted-foreground">
                        All fertilizer plan approvals and triage reviews are logged for compliance.
                      </p>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="p-4 border border-destructive/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Settings className="h-5 w-5 text-destructive mt-0.5" />
                      <div>
                        <p className="font-medium text-destructive">Admin Controls</p>
                        <p className="text-sm text-muted-foreground">
                          As an admin, you can manage team access and view all organization
                          activity. Ensure proper role assignment for data security.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className={cn(isMobile && 'max-w-[calc(100%-2rem)]')}>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your organization as an agronomist or viewer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(v: 'agronomist' | 'viewer') => setInviteRole(v)}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agronomist">
                    Agronomist - Can review triage and create plans
                  </SelectItem>
                  <SelectItem value="viewer">Viewer - Read-only access to dashboard</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {inviteRole === 'agronomist'
                  ? 'Agronomists can review petiole triage, create fertilizer plans, and manage farm assignments.'
                  : 'Viewers can see all dashboard data but cannot make changes or approvals.'}
              </p>
            </div>
          </div>

          <DialogFooter className={cn(isMobile && 'flex-col gap-2')}>
            <Button
              variant="outline"
              onClick={() => setInviteDialogOpen(false)}
              className={cn(isMobile && 'w-full')}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={!inviteEmail || inviteLoading}
              className={cn(isMobile && 'w-full')}
            >
              {inviteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
