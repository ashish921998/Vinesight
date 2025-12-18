'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  Wine,
  FlaskConical,
  ClipboardList,
  Boxes,
  Warehouse,
  FileSpreadsheet
} from 'lucide-react'
import { LoginButton } from './auth/LoginButton'
import { UserMenu } from './auth/UserMenu'
import { LanguageSwitcher } from './ui/language-switcher'
import { useTranslation } from 'react-i18next'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { getTypedSupabaseClient } from '@/lib/supabase'
import { useAppMode } from '@/hooks/useAppMode'

// Base navigation (shown to all users)
export const getBaseNavigation = (t: (key: string) => string) => [
  { name: t('navigation.dashboard'), href: '/vineyard/dashboard', icon: Home },
  { name: t('navigation.farmManagement'), href: '/vineyard/farms', icon: Sprout },
  { name: t('navigation.warehouse'), href: '/vineyard/warehouse', icon: Package },
  { name: t('navigation.calculators'), href: '/vineyard/calculators', icon: Calculator },
  { name: t('navigation.aiAssistant'), href: '/vineyard/ai-assistant', icon: Brain },
  { name: t('navigation.analytics'), href: '/vineyard/analytics', icon: Activity },
  { name: t('navigation.weather'), href: '/vineyard/weather', icon: CloudSun },
  { name: t('navigation.reminders'), href: '/vineyard/reminders', icon: Bell },
  { name: t('navigation.reports'), href: '/vineyard/reports', icon: BarChart3 },
  { name: t('navigation.farmEfficiency'), href: '/vineyard/performance', icon: TrendingUp },
  { name: t('navigation.settings'), href: '/vineyard/settings', icon: Settings }
]

// Org-only navigation items - P2: Use translation function
const getOrgNavigation = (t: (key: string) => string) => [
  { name: t('navigation.clients'), href: '/vineyard/clients', icon: Contact },
  { name: t('navigation.users'), href: '/vineyard/users', icon: Users }
]

const wineryNavigation = [
  { name: 'Winery Dashboard', href: '/winery/dashboard', icon: Wine },
  { name: 'Wine Lots', href: '/winery/lots', icon: FlaskConical },
  { name: 'Tanks', href: '/winery/tanks', icon: Warehouse },
  { name: 'Barrels', href: '/winery/barrels', icon: Boxes },
  { name: 'Fermentation', href: '/winery/fermentation', icon: FlaskConical },
  { name: 'Work Orders', href: '/winery/work-orders', icon: ClipboardList },
  { name: 'Inventory', href: '/winery/inventory', icon: Package },
  { name: 'Reports & Exports', href: '/winery/reports', icon: FileSpreadsheet }
]

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation()
  const { user, loading } = useSupabaseAuth()
  const { mode, setMode } = useAppMode()
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
  const vineyardNavigation = isOrgMember
    ? [...baseNav.slice(0, 2), ...orgNav, ...baseNav.slice(2)]
    : baseNav
  const navigation = mode === 'winery' ? wineryNavigation : vineyardNavigation

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-card px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <Link href="/" className="flex items-center gap-2">
              <Sprout className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-primary">VineSight</span>
            </Link>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-2">
            <div className="text-xs font-semibold">
              Mode:{' '}
              <span
                className={mode === 'winery' ? 'text-rose-700' : 'text-green-700'}
                aria-label={`Current mode ${mode}`}
              >
                {mode === 'winery' ? 'Winery' : 'Vineyard'}
              </span>
            </div>
            <div className="flex gap-1">
              <span className="h-2 w-8 rounded-full bg-green-500" aria-hidden />
              <span
                className={`h-2 w-8 rounded-full ${mode === 'winery' ? 'bg-rose-500' : 'bg-muted-foreground/30'}`}
                aria-hidden
              />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/50 p-2 flex items-center gap-2">
            <button
              className={`flex-1 text-sm font-semibold rounded-md px-3 py-2 transition ${
                mode === 'vineyard'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => {
                setMode('vineyard')
                router.push('/vineyard/dashboard')
              }}
            >
              Vineyard Mode
            </button>
            <button
              className={`flex-1 text-sm font-semibold rounded-md px-3 py-2 transition ${
                mode === 'winery'
                  ? 'bg-rose-100 text-rose-900 border border-rose-200'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => {
                setMode('winery')
                router.push('/winery')
              }}
            >
              Winery Mode
            </button>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    const isWinery = mode === 'winery'
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`
                            group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold
                            ${
                              isActive
                                ? isWinery
                                  ? 'bg-rose-100 text-rose-900'
                                  : 'bg-secondary text-primary'
                                : isWinery
                                  ? 'text-muted-foreground hover:text-rose-900 hover:bg-rose-50'
                                  : 'text-foreground hover:text-primary hover:bg-secondary'
                            }
                          `}
                        >
                          <Icon
                            className={`h-6 w-6 shrink-0 ${
                              isActive
                                ? isWinery
                                  ? 'text-rose-700'
                                  : 'text-primary'
                                : isWinery
                                  ? 'text-muted-foreground group-hover:text-rose-700'
                                  : 'text-muted-foreground group-hover:text-primary'
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
          <div className="border-t border-border pt-4 space-y-3">
            <div className="px-2">
              <LanguageSwitcher />
            </div>
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
