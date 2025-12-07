'use client'

/**
 * OrganizationSelector - Dropdown to switch between organizations
 * Displays in navigation bar for users with multiple organizations
 */

import { useState } from 'react'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Building2, ChevronDown, Plus, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function OrganizationSelector() {
  const { currentOrganization, availableOrganizations, switchOrganization, loading } =
    useOrganization()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  // Don't show if user has no organizations (individual user)
  if (availableOrganizations.length === 0) {
    return null
  }

  const getSubscriptionBadgeColor = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-700'
      case 'business':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const handleSwitchOrganization = async (orgId: string) => {
    await switchOrganization(orgId)
    setIsOpen(false)
    // Refresh page to reload data for new organization
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4 animate-pulse" />
        <span>Loading...</span>
      </div>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-auto px-3 py-2 justify-between gap-2 min-w-[200px]">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex flex-col items-start min-w-0 flex-1">
              <span className="text-sm font-medium truncate max-w-[150px]">
                {currentOrganization?.name || 'Select Organization'}
              </span>
              {currentOrganization && (
                <span className="text-xs text-muted-foreground">{currentOrganization.type}</span>
              )}
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[280px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Your Organizations
        </DropdownMenuLabel>

        {availableOrganizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSwitchOrganization(org.id)}
            className="cursor-pointer"
          >
            <div className="flex items-start justify-between w-full gap-2">
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{org.name}</span>
                  {org.id === currentOrganization?.id && (
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground capitalize">{org.type}</span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getSubscriptionBadgeColor(org.subscriptionTier)}`}
                  >
                    {org.subscriptionTier}
                  </Badge>
                </div>
              </div>
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            setIsOpen(false)
            router.push('/organization/new')
          }}
          className="cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span>Create Organization</span>
        </DropdownMenuItem>

        {currentOrganization && (
          <DropdownMenuItem
            onClick={() => {
              setIsOpen(false)
              router.push('/organization/settings')
            }}
            className="cursor-pointer"
          >
            <Settings className="h-4 w-4 mr-2" />
            <span>Organization Settings</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Compact version for mobile/smaller screens
 */
export function OrganizationSelectorCompact() {
  const { currentOrganization, availableOrganizations, switchOrganization, loading } =
    useOrganization()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  if (availableOrganizations.length === 0) {
    return null
  }

  const handleSwitchOrganization = async (orgId: string) => {
    await switchOrganization(orgId)
    setIsOpen(false)
    router.refresh()
  }

  if (loading) {
    return (
      <Button variant="ghost" size="sm" className="gap-2" disabled>
        <Building2 className="h-4 w-4 animate-pulse" />
        <span className="truncate max-w-[100px]">...</span>
      </Button>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Building2 className="h-4 w-4" />
          <span className="truncate max-w-[100px]">{currentOrganization?.name || 'Org'}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[280px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Your Organizations
        </DropdownMenuLabel>

        {availableOrganizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSwitchOrganization(org.id)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-medium truncate flex-1">{org.name}</span>
              {org.id === currentOrganization?.id && (
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              )}
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            setIsOpen(false)
            router.push('/organization/new')
          }}
          className="cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span>Create Organization</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
