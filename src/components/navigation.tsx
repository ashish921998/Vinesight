'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sprout,
  Calculator,
  Settings,
  Activity,
  Users,
  Home,
  CloudSun,
  BarChart3,
  TrendingUp,
  Brain,
  Package,
  Contact,
  Bell,
  UserCog
} from 'lucide-react'
import { LoginButton } from './auth/LoginButton'
import { UserMenu } from './auth/UserMenu'
import { useTranslation } from 'react-i18next'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { getTypedSupabaseClient } from '@/lib/supabase'

// Base navigation (shown to all users)
export const getBaseNavigation = (t: (key: string) => string) => [
  { name: t('navigation.dashboard'), href: '/dashboard', icon: Home },
  { name: t('navigation.farmManagement'), href: '/farms', icon: Sprout },
  { name: t('navigation.warehouse'), href: '/warehouse', icon: Package },
  { name: t('navigation.workers'), href: '/workers', icon: UserCog },
  { name: t('navigation.calculators'), href: '/calculators', icon: Calculator },
  { name: t('navigation.aiAssistant'), href: '/ai-assistant', icon: Brain },
  { name: t('navigation.analytics'), href: '/analytics', icon: Activity },
  { name: t('navigation.weather'), href: '/weather', icon: CloudSun },
  { name: t('navigation.reminders'), href: '/reminders', icon: Bell },
  { name: t('navigation.reports'), href: '/reports', icon: BarChart3 },
  { name: t('navigation.farmEfficiency'), href: '/performance', icon: TrendingUp },
  { name: t('navigation.settings'), href: '/settings', icon: Settings }
]

// Org-only navigation items - P2: Use translation function
const getOrgNavigation = (t: (key: string) => string) => [
  { name: t('navigation.clients'), href: '/clients', icon: Contact },
  { name: t('navigation.users'), href: '/users', icon: Users }
]

export default function Navigation() {
  const pathname = usePathname()
  const { t } = useTranslation()
  const { user, loading } = useSupabaseAuth()
  const [isOrgMember, setIsOrgMember] = useState(false)

  // Check if user is an org member
  useEffect(() => {
    let cancelled = false
    async function checkOrgMembership() {
      if (!user) {
        setIsOrgMember(false)
        return
      }

      try {
        const supabase = await getTypedSupabaseClient()
        const { data, error } = await supabase
          .from('organization_members')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)

        // P2: Handle Supabase error field
        if (error) {
          console.error('Error checking org membership:', error)
          if (!cancelled) setIsOrgMember(false)
          return
        }
        if (!cancelled) setIsOrgMember(data && data.length > 0)
      } catch {
        if (!cancelled) setIsOrgMember(false)
      }
    }

    checkOrgMembership()
    return () => {
      cancelled = true
    }
  }, [user])

  // Build navigation based on user type
  const baseNav = getBaseNavigation(t)
  const orgNav = getOrgNavigation(t)
  const navigation = isOrgMember
    ? [...baseNav.slice(0, 2), ...orgNav, ...baseNav.slice(2)]
    : baseNav

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-sidebar-border bg-sidebar px-6 pb-4 text-sidebar-foreground">
          <div className="flex h-16 shrink-0 items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="VineSight logo"
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg shadow-sm"
                priority
              />
              <span className="text-xl font-bold text-primary">VineSight</span>
            </Link>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon
                    const normalizedPathname = pathname === '/' ? '/' : pathname.replace(/\/$/, '')
                    const normalizedHref = item.href === '/' ? '/' : item.href.replace(/\/$/, '')
                    const isActive =
                      normalizedPathname === normalizedHref ||
                      (normalizedHref !== '/' &&
                        normalizedPathname.startsWith(normalizedHref + '/'))
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-medium transition-colors ${
                            isActive
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }`}
                        >
                          <Icon
                            className={`h-6 w-6 shrink-0 ${
                              isActive
                                ? 'text-sidebar-accent-foreground'
                                : 'text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground'
                            }`}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
            </ul>
          </nav>
          <div className="border-t border-sidebar-border pt-4 space-y-3">
            {loading ? (
              <div className="px-2 py-3">Loading...</div>
            ) : user ? (
              <UserMenu />
            ) : (
              <Link href="/auth" className="w-full">
                <LoginButton className="w-full" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
