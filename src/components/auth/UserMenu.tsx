'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronsUpDown, LogOut, Settings } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'

export function UserMenu() {
  const { user, signOut } = useSupabaseAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const displayName = user?.user_metadata?.full_name || user?.email || 'User'
  const displayEmail = user?.email || ''
  const initialsSource = user?.user_metadata?.full_name || user?.email || 'User'
  const initials = initialsSource
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2)

  const handleSignOut = async () => {
    try {
      setLoading(true)
      const result = await signOut()
      if (result.success) {
        router.push('/')
      }
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group flex w-full items-center gap-3 rounded-md p-2 text-left text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={displayName} />
            <AvatarFallback>{initials || 'US'}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{displayName}</p>
            {displayEmail ? (
              <p className="truncate text-xs text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground group-data-[state=open]:text-sidebar-accent-foreground">
                {displayEmail}
              </p>
            ) : null}
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground group-data-[state=open]:text-sidebar-accent-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start" side="top" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            {displayEmail ? (
              <p className="text-xs leading-none text-muted-foreground">{displayEmail}</p>
            ) : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => (window.location.href = '/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut} disabled={loading}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{loading ? 'Signing out...' : 'Sign out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
