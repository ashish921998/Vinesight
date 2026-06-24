'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { UserMenu } from '@/components/auth/UserMenu'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar'
import { Building2, FlaskConical, LayoutDashboard, UserCog, Users } from 'lucide-react'
import { roleLabels } from '@/lib/consultant-access'
import {
  getConsultantAccessState,
  useConsultantAccess
} from '@/hooks/consultant/useConsultantQueries'
import type { ConsultantAccess } from '@/lib/consultant-access'
import posthog from 'posthog-js'
import { toast } from 'sonner'

interface ConsultantLayoutProps {
  children: React.ReactNode
}

const navItems = [
  {
    label: 'Overview',
    href: '/consultant',
    icon: LayoutDashboard,
    description: 'Org overview',
    exact: true
  },
  {
    label: 'Farmers',
    href: '/consultant/farmers',
    icon: Users,
    description: 'Directory & reports',
    exact: false
  },
  {
    label: 'Petiole Review',
    href: '/consultant/triage',
    icon: FlaskConical,
    description: 'Review queue',
    exact: false
  },
  {
    label: 'Team',
    href: '/consultant/team',
    icon: UserCog,
    description: 'Members & assignments',
    exact: false
  }
]

// The active nav item for a pathname, used both for sidebar highlighting and
// the top-bar section label. Exact items match only their own href; the rest
// match their href or any sub-route. Reversed so the deepest prefix wins.
function activeNavItem(pathname: string) {
  // next.config sets skipTrailingSlashRedirect, so a manually-entered or
  // external "/consultant/" is served as-is (no redirect) and usePathname()
  // keeps the trailing slash. Strip it (except the root "/") before matching,
  // otherwise "/consultant/" === "/consultant" is false and nothing highlights.
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  return (
    navItems.find((item) => path === item.href) ??
    [...navItems].reverse().find((item) => !item.exact && path.startsWith(`${item.href}/`))
  )
}

// Sidebar internals live in a child so they can read useSidebar() for the
// collapsed state the UserMenu needs. Must render inside <SidebarProvider>.
function ConsultantSidebar({ access }: { access: ConsultantAccess | null }) {
  const pathname = usePathname()
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'
  // Single source of truth for "which item is active" — shared with the
  // top-bar breadcrumb and trailing-slash-normalized in activeNavItem.
  const active = activeNavItem(pathname)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground group-data-[collapsible=icon]:size-8">
            <Building2 className="h-5 w-5 group-data-[collapsible=icon]:size-4" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold">Organization Workspace</p>
            <p className="truncate text-xs text-sidebar-foreground/70">
              {access ? roleLabels[access.role] : 'Consultant team'}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = active?.href === item.href
                const Icon = item.icon

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label} size="lg">
                      <Link href={item.href}>
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
                          <span className="truncate font-medium">{item.label}</span>
                          <span className="truncate text-xs text-sidebar-foreground/60">
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3 p-3 group-data-[collapsible=icon]:p-2">
        <div className="group-data-[collapsible=icon]:hidden">
          <p className="text-xs font-medium text-sidebar-foreground/60">Access Mode</p>
          <p className="mt-1 text-sm">
            {access?.canViewAllFarmers ? 'All active client farmers' : 'Assigned farmers only'}
          </p>
        </div>
        <UserMenu collapsed={collapsed} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

export default function ConsultantLayout({ children }: ConsultantLayoutProps) {
  // 'loading' → checking access; 'ok' → admitted; 'denied' → not a consultant;
  // 'error' → couldn’t verify (transient). Kept distinct so an outage isn’t shown
  // to a valid consultant as an authorization denial.
  const pathname = usePathname()
  const section = activeNavItem(pathname)
  const { data: access, isPending, isError, error } = useConsultantAccess()
  const accessState = getConsultantAccessState(isPending, isError && !access, access)

  // Persist sidebar collapse across reloads. The shadcn provider writes the
  // `sidebar_state` cookie but only restores it when a server component seeds
  // `defaultOpen`; this layout is a client component, so we restore it here
  // (controlled mode) after mount. Initial render stays expanded to match SSR.
  const [sidebarOpen, setSidebarOpen] = useState(true)
  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)sidebar_state=(true|false)/)
    // react-doctor-disable-next-line react-doctor/no-initialize-state, no-initialize-state -- intentional: initial render stays expanded to match SSR, then restores the cookie client-side; a lazy initializer reading document.cookie would hydration-mismatch
    if (match) setSidebarOpen(match[1] === 'true')
  }, [])

  useEffect(() => {
    if (accessState === 'denied') {
      toast.error('Access denied. Consultant team members only.')
      return
    }

    if (accessState === 'error') {
      console.error('Access check failed:', error)
      toast.error('Unable to verify consultant access. Please try again.')
      return
    }

    if (!access) return

    posthog.identify(access.userId, {
      role: access.role,
      org_id: access.organizationId,
      can_view_all_farmers: access.canViewAllFarmers
    })
  }, [access, accessState, error])

  if (accessState === 'loading') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </ProtectedRoute>
    )
  }

  if (accessState === 'denied' || accessState === 'error') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              {accessState === 'error'
                ? 'We couldn’t verify your access right now. Please try again.'
                : 'You don’t have access to the organization workspace.'}
            </p>
            {accessState === 'error' ? (
              <Button
                variant="link"
                className="h-auto p-0 text-sm text-primary"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            ) : (
              <Link href="/dashboard" className="text-sm underline text-primary">
                Go to dashboard
              </Link>
            )}
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <ConsultantSidebar access={access ?? null} />
        {/* min-w-0 lets the flex main shrink below its content's intrinsic
            width, so wide children (recharts ResponsiveContainer, the KPI grid)
            reflow instead of overflowing and clipping on the right. */}
        <SidebarInset className="min-w-0">
          {/* Top bar — SidebarTrigger toggles the drawer (mobile) or icon-collapse
              (desktop); ⌘B / Ctrl+B also toggles. The label is the current section
              (wayfinding), not a repeat of the sidebar's workspace title. */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur">
            <SidebarTrigger className="size-8" />
            <span className="h-5 w-px bg-border" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground">
              {section?.label ?? 'Workspace'}
            </span>
          </header>
          <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full min-w-0">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
