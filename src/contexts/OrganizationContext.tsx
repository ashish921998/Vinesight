'use client'

/**
 * OrganizationContext - Manages multi-tenant organization state
 * Provides current organization and user membership information
 */

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import type {
  Organization,
  OrganizationMember,
  UserRole,
  OrganizationWithMembers
} from '@/types/rbac'

interface OrganizationContextType {
  // Current organization state
  currentOrganization: Organization | null
  userMembership: OrganizationMember | null
  userRole: UserRole | null

  // Permission helpers
  isOrgAdmin: boolean
  isOrgOwner: boolean
  canManageUsers: boolean
  canManageFarms: boolean

  // Organization actions
  setCurrentOrganization: (org: Organization | null) => void
  refreshMembership: () => Promise<void>
  switchOrganization: (orgId: string) => Promise<void>

  // Loading states
  loading: boolean
  error: string | null

  // Available organizations for current user
  availableOrganizations: Organization[]
  loadOrganizations: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

interface OrganizationProviderProps {
  children: ReactNode
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const [currentOrganization, setCurrentOrganizationState] = useState<Organization | null>(null)
  const [userMembership, setUserMembership] = useState<OrganizationMember | null>(null)
  const [availableOrganizations, setAvailableOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = getSupabaseClient()

  /**
   * Load all organizations the current user is a member of
   */
  const loadOrganizations = useCallback(async () => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) {
        setAvailableOrganizations([])
        setLoading(false)
        return
      }

      // Get all organizations user is member of
      const { data: memberships, error: membershipsError } = await supabase
        .from('organization_members')
        .select(
          `
          organization_id,
          role,
          status,
          organizations (*)
        `
        )
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (membershipsError) {
        console.error('Error loading organizations:', membershipsError)
        setError('Failed to load organizations')
        return
      }

      if (memberships && memberships.length > 0) {
        // Extract organizations from memberships
        const orgs = memberships
          .map((m: any) => m.organizations)
          .filter(Boolean)
          .map((org: any) => ({
            ...org,
            createdAt: org.created_at,
            updatedAt: org.updated_at,
            createdBy: org.created_by,
            subscriptionTier: org.subscription_tier,
            subscriptionStatus: org.subscription_status,
            maxUsers: org.max_users,
            maxFarms: org.max_farms,
            registrationNumber: org.registration_number,
            taxId: org.tax_id,
            contactEmail: org.contact_email,
            contactPhone: org.contact_phone
          }))

        setAvailableOrganizations(orgs)

        // Auto-select first org if none selected and user has orgs
        if (!currentOrganization && orgs.length > 0) {
          setCurrentOrganizationState(orgs[0])
        }
      }
    } catch (err) {
      console.error('Error in loadOrganizations:', err)
      setError('Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }, [currentOrganization, supabase])

  /**
   * Refresh current user's membership details
   */
  const refreshMembership = useCallback(async () => {
    if (!currentOrganization) {
      setUserMembership(null)
      return
    }

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) {
        setUserMembership(null)
        return
      }

      const { data, error: membershipError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (membershipError) {
        console.error('Error loading membership:', membershipError)
        setError('Failed to load membership details')
        return
      }

      if (data) {
        setUserMembership({
          ...data,
          organizationId: data.organization_id,
          userId: data.user_id,
          customPermissions: data.custom_permissions || {},
          assignedFarmIds: data.assigned_farm_ids,
          invitedBy: data.invited_by,
          joinedAt: data.joined_at,
          lastActiveAt: data.last_active_at,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        })

        // Update last active timestamp
        await supabase
          .from('organization_members')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', data.id)
      }
    } catch (err) {
      console.error('Error in refreshMembership:', err)
      setError('Failed to refresh membership')
    }
  }, [currentOrganization, supabase])

  /**
   * Switch to a different organization
   */
  const switchOrganization = useCallback(
    async (orgId: string) => {
      const org = availableOrganizations.find((o) => o.id === orgId)
      if (org) {
        setCurrentOrganizationState(org)
        // Save preference to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('selectedOrganizationId', orgId)
        }
      }
    },
    [availableOrganizations]
  )

  /**
   * Set current organization (with localStorage persistence)
   */
  const setCurrentOrganization = useCallback((org: Organization | null) => {
    setCurrentOrganizationState(org)
    if (typeof window !== 'undefined') {
      if (org) {
        localStorage.setItem('selectedOrganizationId', org.id)
      } else {
        localStorage.removeItem('selectedOrganizationId')
      }
    }
  }, [])

  /**
   * Load organizations on mount and restore last selected org
   */
  useEffect(() => {
    const initializeOrganizations = async () => {
      await loadOrganizations()

      // Try to restore last selected organization
      if (typeof window !== 'undefined') {
        const savedOrgId = localStorage.getItem('selectedOrganizationId')
        if (savedOrgId) {
          const savedOrg = availableOrganizations.find((o) => o.id === savedOrgId)
          if (savedOrg) {
            setCurrentOrganizationState(savedOrg)
          }
        }
      }
    }

    initializeOrganizations()
  }, []) // Only run once on mount

  /**
   * Refresh membership when organization changes
   */
  useEffect(() => {
    refreshMembership()
  }, [currentOrganization?.id]) // Refresh when org changes

  // Compute derived values
  const userRole = userMembership?.role || null
  const isOrgOwner = userRole === 'owner'
  const isOrgAdmin = ['owner', 'admin'].includes(userRole || '')
  const canManageUsers = ['owner', 'admin', 'farm_manager'].includes(userRole || '')
  const canManageFarms = ['owner', 'admin', 'farm_manager'].includes(userRole || '')

  const value: OrganizationContextType = {
    currentOrganization,
    userMembership,
    userRole,
    isOrgAdmin,
    isOrgOwner,
    canManageUsers,
    canManageFarms,
    setCurrentOrganization,
    refreshMembership,
    switchOrganization,
    loading,
    error,
    availableOrganizations,
    loadOrganizations
  }

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>
}

/**
 * Hook to access organization context
 * @throws Error if used outside OrganizationProvider
 */
export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider')
  }
  return context
}

/**
 * Hook to check if user is in an organization context
 * Returns false for individual users (backwards compatible)
 */
export function useIsOrganizationUser() {
  const context = useContext(OrganizationContext)
  return context?.currentOrganization !== null && context?.currentOrganization !== undefined
}

/**
 * Hook to get user's assigned farm IDs
 * Returns null if user has access to all farms
 */
export function useAssignedFarmIds(): number[] | null {
  const { userMembership } = useOrganization()
  return userMembership?.assignedFarmIds || null
}
