'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ClipboardList, Loader2, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConsultantAccess, getConsultantAccess, roleLabels } from '@/lib/consultant-access'
import { InviteFarmerDialog } from '@/components/consultant/InviteFarmerDialog'

const workspaceLinks = [
  {
    title: 'Farmer Directory',
    description: 'Review client farmers, farm access, and linked lab reports.',
    href: '/consultant/farmers',
    action: 'Open farmers',
    icon: Users
  },
  {
    title: 'Triage Queue',
    description: 'Review petiole issues for active farmers in your consultant scope.',
    href: '/consultant/triage',
    action: 'Open triage',
    icon: ClipboardList
  }
]

export default function ConsultantOverviewPage() {
  const [access, setAccess] = useState<ConsultantAccess | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessError, setAccessError] = useState(false)

  useEffect(() => {
    async function loadAccess() {
      try {
        const result = await getConsultantAccess()
        if (!result) {
          setAccessError(true)
          return
        }
        setAccess(result)
      } catch (error) {
        console.error('Failed to load consultant access:', error)
        setAccessError(true)
      } finally {
        setLoading(false)
      }
    }

    loadAccess()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (accessError || !access) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Access unavailable. Please refresh or return to the dashboard.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Consultant Workspace</h1>
            <Badge variant="secondary">{roleLabels[access.role]}</Badge>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Manage assigned farmers, lab visibility, and consultant review work from one place.
          </p>
        </div>
        <InviteFarmerDialog organizationId={access.organizationId} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {workspaceLinks.map((item) => {
          const Icon = item.icon

          return (
            <Card key={item.href} className="border-border/80">
              <CardHeader className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href={item.href}>
                    {item.action}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
