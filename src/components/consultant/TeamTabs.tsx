'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { label: 'Members', href: '/consultant/team' },
  { label: 'Assignments', href: '/consultant/team/assignments' }
]

/**
 * Sub-navigation for the Team section (Members | Assignments). Rendered at the
 * top of both Team pages so the otherwise-orphaned Assignments screen is
 * reachable. Assignments is an owner/admin tool, so the bar only appears when
 * the viewer can manage the whole org — agronomists see the Team page unchanged.
 */
interface TeamTabsProps {
  canViewAllFarmers: boolean
}

export function TeamTabs({ canViewAllFarmers }: TeamTabsProps) {
  const pathname = usePathname()

  if (!canViewAllFarmers) return null

  return (
    <div className="border-b">
      <nav className="-mb-px flex gap-1" aria-label="Team sections">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-muted hover:text-foreground'
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
