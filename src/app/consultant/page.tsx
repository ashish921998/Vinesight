'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TriageService, type Classification } from '@/lib/triage-service'
import { TemplateService } from '@/lib/template-service'
import { ClusterService } from '@/lib/cluster-service'
import { getTypedSupabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  Eye,
  CheckCircle,
  Sprout,
  FileText,
  Users,
  ArrowRight,
  Loader2,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface MissionControlStats {
  triage: {
    total: number
    green: number
    yellow: number
    red: number
    pending: number
  }
  templates: {
    total: number
    active: number
  }
  clusters: {
    totalClusters: number
    totalAffectedFarms: number
    byDeficiency: Record<string, number>
    byRegion: Record<string, number>
  }
  acknowledgments: {
    total: number
    understood: number
    questions: number
    thanks: number
    pending: number
  }
}

export default function MissionControlPage() {
  const [stats, setStats] = useState<MissionControlStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [organizationId, setOrganizationId] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
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

      // Get organization
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (!membership?.organization_id) {
        toast.error('No organization found')
        return
      }

      setOrganizationId(membership.organization_id)

      // Load all stats in parallel
      const [triageStats, templateStats, clusterStats, ackStats] = await Promise.all([
        TriageService.getTriageStats(membership.organization_id),
        TemplateService.getTemplateCoverageStats(membership.organization_id),
        ClusterService.getClusterStats(membership.organization_id),
        TriageService.getAcknowledgmentStats(membership.organization_id)
      ])

      setStats({
        triage: triageStats,
        templates: templateStats,
        clusters: clusterStats,
        acknowledgments: ackStats
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
      // Gracefully handle missing tables (pre-migration)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading mission control...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
        <Button onClick={loadStats} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  const triageCard = (
    classification: Classification,
    count: number,
    label: string,
    color: string
  ) => (
    <Card className={cn('relative overflow-hidden', color)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1">{count}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-background/50 flex items-center justify-center">
            {classification === 'red' && <AlertTriangle className="h-6 w-6 text-destructive" />}
            {classification === 'yellow' && <Eye className="h-6 w-6 text-accent" />}
            {classification === 'green' && <CheckCircle className="h-6 w-6 text-green-600" />}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mission Control</h1>
          <p className="text-muted-foreground">
            Overview of your farm portfolio and pending actions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadStats}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href="/consultant/triage">
            <Button>
              View Triage Queue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Triage Stats */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sprout className="h-5 w-5 text-accent" />
          Petiole Test Triage
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {triageCard('red', stats.triage.red, 'Urgent (Red)', 'border-l-4 border-l-destructive')}
          {triageCard(
            'yellow',
            stats.triage.yellow,
            'Watch (Yellow)',
            'border-l-4 border-l-accent'
          )}
          {triageCard(
            'green',
            stats.triage.green,
            'Normal (Green)',
            'border-l-4 border-l-green-500'
          )}
        </div>

        {stats.triage.pending > 0 && (
          <Card className="mt-4 border-l-4 border-l-accent">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium">{stats.triage.pending} farms need review</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.triage.red} urgent, {stats.triage.yellow} watch, {stats.triage.green}{' '}
                    normal
                  </p>
                </div>
              </div>
              <Link href="/consultant/triage">
                <Button variant="secondary">Review Now</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Quick Actions Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Templates Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Plan Templates
            </CardTitle>
            <CardDescription>{stats.templates.active} active templates</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Templates enable auto-drafting for{' '}
              {stats.templates.active > 0 ? 'routine cases' : 'no cases yet'}
            </p>
            <Link href="/consultant/templates">
              <Button variant="outline" className="w-full">
                Manage Templates
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Clusters Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Farm Clusters
            </CardTitle>
            <CardDescription>{stats.clusters.totalClusters} clusters detected</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {stats.clusters.totalAffectedFarms} farms showing similar nutrient patterns
            </p>
            <Link href="/consultant/clusters">
              <Button variant="outline" className="w-full">
                View Clusters
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Acknowledgments Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Farmer Responses
            </CardTitle>
            <CardDescription>
              {stats.acknowledgments.understood +
                stats.acknowledgments.questions +
                stats.acknowledgments.thanks}{' '}
              acknowledged
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              {stats.acknowledgments.questions > 0 && (
                <Badge variant="secondary">{stats.acknowledgments.questions} questions</Badge>
              )}
              {stats.acknowledgments.pending > 0 && (
                <Badge variant="outline">{stats.acknowledgments.pending} pending</Badge>
              )}
            </div>
            <Link href="/clients">
              <Button variant="outline" className="w-full">
                View Clients
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
