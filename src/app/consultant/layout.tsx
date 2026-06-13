'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Settings,
  Sprout,
  UsersRound
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConsultantAccess, getConsultantAccess, roleLabels } from '@/lib/consultant-access'
import { toast } from 'sonner'

interface ConsultantLayoutProps {
  children: React.ReactNode
}

const navItems = [
  {
    label: 'Command Center',
    href: '/consultant',
    icon: LayoutDashboard,
    description: 'Org overview',
    exact: true
  },
  {
    label: 'Client Farmers',
    href: '/consultant/farmers',
    icon: UsersRound,
    description: 'Directory and reports',
    exact: false
  },
  {
    label: 'Petiole Triage',
    href: '/consultant/triage',
    icon: ClipboardList,
    description: 'Review queue',
    exact: false
  }
]

const upcomingItems = [
  {
    label: 'Plans',
    icon: ClipboardCheck
  },
  {
    label: 'Templates',
    icon: FileText
  },
  {
    label: 'Team Settings',
    icon: Settings
  }
]

export default function ConsultantLayout({ children }: ConsultantLayoutProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [access, setAccess] = useState<ConsultantAccess | null>(null)

  useEffect(() => {
    async function checkAccess() {
      try {
        const access = await getConsultantAccess()

        if (!access) {
          toast.error('Access denied. Consultant team members only.')
          setAuthorized(false)
          return
        }

        setAccess(access)
        setAuthorized(true)
      } catch (error) {
        console.error('Access check failed:', error)
        toast.error('Unable to verify consultant access. Please try again.')
        setAuthorized(false)
      }
    }

    checkAccess()
  }, [])

  if (authorized === null) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </ProtectedRoute>
    )
  }

  if (!authorized) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              You don’t have access to the organization workspace.
            </p>
            <Link href="/dashboard" className="text-sm underline text-primary">
              Go to dashboard
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar */}
        <aside
          className={cn(
            'border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200 flex flex-col',
            collapsed ? 'w-20' : 'w-72'
          )}
        >
          <div className={cn('border-b', collapsed ? 'p-3' : 'p-4')}>
            <div
              className={cn(
                'flex items-center gap-3',
                collapsed ? 'justify-center' : 'justify-between'
              )}
            >
              <div className={cn('flex min-w-0 items-center gap-3', collapsed && 'min-w-0')}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building2 className="h-5 w-5" />
                </div>
                {!collapsed && (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">Organization Workspace</p>
                    <p className="truncate text-xs text-sidebar-foreground/70">
                      {access ? roleLabels[access.role] : 'Consultant team'}
                    </p>
                  </div>
                )}
              </div>
              {!collapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  onClick={() => setCollapsed(!collapsed)}
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
            </div>
            {collapsed && (
              <div className="mt-2 flex justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  onClick={() => setCollapsed(!collapsed)}
                  aria-label="Expand sidebar"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {!collapsed && (
            <div className="space-y-3 border-b px-4 py-3">
              <div className="rounded-lg bg-sidebar-accent/60 p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Sprout className="h-4 w-4 text-primary" />
                  Consultant Ops
                </div>
                <p className="mt-1 text-xs leading-5 text-sidebar-foreground/70">
                  Farmers, test reports, and crop review work scoped by organization access.
                </p>
              </div>
            </div>
          )}

          <nav className="flex-1 space-y-6 p-3">
            <div>
              {!collapsed && (
                <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-sidebar-foreground/60">
                  Workspace
                </p>
              )}
              <div className="space-y-1">
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href || (!item.exact && pathname.startsWith(`${item.href}/`))
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && (
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{item.label}</span>
                          <span
                            className={cn(
                              'block truncate text-xs',
                              isActive
                                ? 'text-sidebar-accent-foreground/75'
                                : 'text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground/75'
                            )}
                          >
                            {item.description}
                          </span>
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div>
              {!collapsed && (
                <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-sidebar-foreground/60">
                  Coming Next
                </p>
              )}
              <div className="space-y-1">
                {upcomingItems.map((item) => {
                  const Icon = item.icon

                  return (
                    <div
                      key={item.label}
                      className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/45"
                      aria-disabled="true"
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && (
                        <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                          <span className="truncate">{item.label}</span>
                          <span className="rounded-full bg-sidebar-accent px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sidebar-foreground/60">
                            Soon
                          </span>
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </nav>

          {!collapsed && (
            <div className="border-t p-4">
              <p className="text-xs font-medium text-sidebar-foreground/60">Access Mode</p>
              <p className="mt-1 text-sm">
                {access?.canViewAllFarmers ? 'All active client farmers' : 'Assigned farmers only'}
              </p>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
