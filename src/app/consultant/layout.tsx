'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  ListTodo,
  FileText,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Eye,
  Sprout
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTypedSupabaseClient } from '@/lib/supabase'
import { toast } from 'sonner'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navItems = [
  {
    label: 'Mission Control',
    href: '/consultant',
    icon: LayoutDashboard,
    badge: 'urgent'
  },
  {
    label: 'Triage Queue',
    href: '/consultant/triage',
    icon: ListTodo,
    badge: 'pending'
  },
  {
    label: 'Templates',
    href: '/consultant/templates',
    icon: FileText
  },
  {
    label: 'Clusters',
    href: '/consultant/clusters',
    icon: Users
  },
  {
    label: 'Settings',
    href: '/consultant/settings',
    icon: Settings
  }
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [stats, setStats] = useState({
    urgent: 0,
    pending: 0,
    total: 0
  })
  const [organizationId, setOrganizationId] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const supabase = await getTypedSupabaseClient()
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) return

      // Get organization
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (membership?.organization_id) {
        setOrganizationId(membership.organization_id)

        // Get triage stats
        const { data: triageData } = await supabase
          .from('petiole_triage')
          .select('classification, reviewed_by')
          .eq('organization_id', membership.organization_id)
          .is('reviewed_by', null)
          .gt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

        const urgent = triageData?.filter((t) => t.classification === 'red').length || 0
        const pending = triageData?.length || 0

        setStats({ urgent, pending, total: triageData?.length || 0 })
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const getBadge = (badgeType?: string) => {
    if (badgeType === 'urgent' && stats.urgent > 0) {
      return (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
          {stats.urgent > 9 ? '9+' : stats.urgent}
        </span>
      )
    }
    if (badgeType === 'pending' && stats.pending > 0) {
      return (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground">
          {stats.pending > 9 ? '9+' : stats.pending}
        </span>
      )
    }
    return null
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300',
            collapsed ? 'w-16' : 'w-64'
          )}
        >
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            {!collapsed && (
              <Link href="/consultant" className="flex items-center gap-2">
                <Sprout className="h-6 w-6 text-accent" />
                <span className="text-lg font-semibold">Consultant</span>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className={cn('h-8 w-8', collapsed && 'mx-auto')}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1 p-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {getBadge(item.badge)}
                    </>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Quick Stats - Desktop Only */}
          {!collapsed && (
            <div className="absolute bottom-0 left-0 right-0 border-t p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-muted-foreground">{stats.urgent} urgent</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4 text-accent" />
                  <span className="text-muted-foreground">{stats.pending} to review</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">{stats.total} this month</span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className={cn('flex-1 transition-all duration-300', collapsed ? 'ml-16' : 'ml-64')}>
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
