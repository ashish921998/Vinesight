'use client'

/**
 * Organization Settings Page
 * Tabbed interface for managing organization settings, members, and audit logs
 */

import { useState } from 'react'
import { OrganizationSettings } from '@/components/organization/OrganizationSettings'
import { MemberManagement } from '@/components/organization/MemberManagement'
import { AuditLogViewer } from '@/components/organization/AuditLogViewer'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Settings, Users, FileText, Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function OrganizationSettingsPage() {
  const router = useRouter()
  const { currentOrganization, loading } = useOrganization()
  const [activeTab, setActiveTab] = useState('details')

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading organization...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentOrganization) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Organization Selected</h2>
            <p className="text-muted-foreground mb-6">
              You need to create or join an organization to access these settings.
            </p>
            <Button asChild>
              <Link href="/organization/new">Create Organization</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Organization Settings</h1>
              <p className="text-muted-foreground">{currentOrganization.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="details" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Details</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Members</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Audit Logs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <OrganizationSettings />
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <MemberManagement />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <AuditLogViewer />
        </TabsContent>
      </Tabs>
    </div>
  )
}
