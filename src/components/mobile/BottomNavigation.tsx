'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  Calculator,
  User,
  Users,
  Package,
  Wine,
  ClipboardList,
  FileSpreadsheet,
  FlaskConical
} from 'lucide-react'
import { useAppMode } from '@/hooks/useAppMode'

export function BottomNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { mode } = useAppMode()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Cleanup function
    return () => {
      // Any cleanup code can go here if needed in the future
    }
  }, [])

  return (
    <>
      {/* Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex justify-around items-center px-1 py-2">
          {(mode === 'winery'
            ? [
                { name: 'Winery', href: '/winery/dashboard', icon: Wine },
                { name: 'Lots', href: '/winery/lots', icon: FlaskConical },
                { name: 'Work', href: '/winery/work-orders', icon: ClipboardList },
                { name: 'Inventory', href: '/winery/inventory', icon: Package },
                { name: 'Exports', href: '/winery/reports', icon: FileSpreadsheet }
              ]
            : [
                { name: 'Dashboard', href: '/vineyard/dashboard', icon: Home },
                { name: 'Warehouse', href: '/vineyard/warehouse', icon: Package },
                { name: 'Workers', href: '/vineyard/workers', icon: Users },
                { name: 'Calculator', href: '/vineyard/calculators', icon: Calculator },
                { name: 'Profile', href: '/vineyard/settings', icon: User }
              ]
          ).map((item) => {
            const Icon = item.icon
            const isActive = mounted
              ? pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              : false

            const handleClick = () => {
              // Use window.location for reliable navigation that resets component state
              if (typeof window !== 'undefined') {
                window.location.href = item.href
              } else {
                router.push(item.href)
              }
            }

            return (
              <div
                key={item.href}
                onClick={handleClick}
                className={`
                  flex flex-col items-center justify-center
                  px-1 py-2 min-w-0 flex-1
                  transition-all duration-200
                  touch-manipulation
                  active:scale-95
                  ${isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}
                `}
              >
                <div
                  className={`
                  p-1.5 rounded-lg transition-all duration-200
                  ${isActive ? 'bg-secondary text-primary' : 'text-gray-400'}
                `}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`
                  text-[10px] font-medium mt-0.5 w-full text-center
                  overflow-hidden text-ellipsis whitespace-nowrap px-0.5
                  ${isActive ? 'text-primary' : 'text-gray-400'}
                `}
                >
                  {item.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
