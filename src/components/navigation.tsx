'use client'

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
  Brain
} from 'lucide-react'
import { LoginButton } from './auth/LoginButton'
import { UserMenu } from './auth/UserMenu'
import { LanguageSwitcher } from './ui/language-switcher'
import { OrganizationSelector } from './organization/OrganizationSelector'
import { useTranslation } from 'react-i18next'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'

export const getNavigation = (t: any) => [
  { name: t('navigation.dashboard'), href: '/dashboard', icon: Home },
  { name: t('navigation.farmManagement'), href: '/farms', icon: Sprout },
  { name: t('navigation.calculators'), href: '/calculators', icon: Calculator },
  { name: t('navigation.aiAssistant'), href: '/ai-assistant', icon: Brain },
  { name: t('navigation.analytics'), href: '/analytics', icon: Activity },
  { name: t('navigation.weather'), href: '/weather', icon: CloudSun },
  { name: t('navigation.reminders'), href: '/reminders', icon: Users },
  { name: t('navigation.reports'), href: '/reports', icon: BarChart3 },
  { name: 'Farm Efficiency', href: '/performance', icon: TrendingUp },
  { name: t('navigation.settings'), href: '/settings', icon: Settings }
]

export default function Navigation() {
  const pathname = usePathname()
  const { t } = useTranslation()
  const { user, loading } = useSupabaseAuth()

  const navigation = getNavigation(t)

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
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`
                            group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold
                            ${
                              isActive
                                ? 'bg-secondary text-primary'
                                : 'text-foreground hover:text-primary hover:bg-secondary'
                            }
                          `}
                        >
                          <Icon
                            className={`h-6 w-6 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}
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
            {user && (
              <div className="px-2">
                <OrganizationSelector />
              </div>
            )}
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
