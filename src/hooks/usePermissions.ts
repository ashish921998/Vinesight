/**
 * usePermissions - Hook for checking user permissions
 * Integrates with organization context for role-based access control
 */

import { useOrganization } from '@/contexts/OrganizationContext'
import { useMemo } from 'react'
import {
  Permission,
  ResourceType,
  UserRole,
  DEFAULT_ROLE_PERMISSIONS,
  PermissionMatrix,
  ResourcePermissions
} from '@/types/rbac'

interface PermissionHookReturn {
  /**
   * Check if user has specific permission for a resource
   * @param resource - Resource type to check
   * @param permission - Permission to check (create/read/update/delete)
   * @param farmId - Optional farm ID for farm-specific permissions
   * @returns boolean indicating if user has permission
   */
  hasPermission: (resource: ResourceType, permission: Permission, farmId?: number) => boolean

  /**
   * Get all permissions for a specific resource
   * @param resource - Resource type
   * @returns ResourcePermissions object
   */
  getResourcePermissions: (resource: ResourceType) => ResourcePermissions | null

  /**
   * Check if user can perform any action on a resource
   * @param resource - Resource type
   * @returns boolean indicating if user has any permission
   */
  hasAnyPermission: (resource: ResourceType) => boolean

  /**
   * Check if user can access a specific farm
   * @param farmId - Farm ID to check
   * @returns boolean indicating if user has access
   */
  canAccessFarm: (farmId: number) => boolean

  /**
   * Get user's current role
   */
  userRole: UserRole | null

  /**
   * Check if user is in organization context
   */
  isOrgUser: boolean

  /**
   * Check if user is organization admin (owner or admin)
   */
  isAdmin: boolean

  /**
   * Check if user is organization owner
   */
  isOwner: boolean

  /**
   * Get full permission matrix for current role
   */
  permissionMatrix: PermissionMatrix | null
}

/**
 * Hook to check permissions based on user's role and organization membership
 */
export function usePermissions(): PermissionHookReturn {
  const { currentOrganization, userMembership, userRole, isOrgAdmin, isOrgOwner } =
    useOrganization()

  /**
   * Memoized permission checker
   */
  const hasPermission = useMemo(() => {
    return (resource: ResourceType, permission: Permission, farmId?: number): boolean => {
      // No organization = individual user = full access (backwards compatibility)
      if (!currentOrganization) {
        return true
      }

      // No membership or role = no access
      if (!userRole || !userMembership) {
        return false
      }

      // Check farm access if farmId provided
      if (farmId !== undefined && !checkFarmAccess(farmId, userMembership)) {
        return false
      }

      // Get role permissions
      const rolePermissions = DEFAULT_ROLE_PERMISSIONS[userRole]
      if (!rolePermissions) {
        return false
      }

      // Check resource permissions
      const resourcePerms = rolePermissions[resource]
      if (!resourcePerms) {
        return false
      }

      // Handle special permission types for non-CRUD resources
      if (resource === 'users') {
        const userPerms = resourcePerms as any
        if (permission === 'create') return userPerms.invite || false
        if (permission === 'update') return userPerms.manage || false
        if (permission === 'delete') return userPerms.remove || false
        if (permission === 'read') return userPerms.invite || userPerms.manage || false
      }

      if (resource === 'reports') {
        const reportPerms = resourcePerms as any
        if (permission === 'create') return reportPerms.generate || false
        if (permission === 'read') return reportPerms.generate || reportPerms.export || false
        if (permission === 'update') return reportPerms.export || false
        if (permission === 'delete') return false
      }

      if (resource === 'ai_features') {
        const aiPerms = resourcePerms as any
        if (permission === 'read')
          return aiPerms.chat || aiPerms.disease_detection || aiPerms.analytics || false
        if (permission === 'create') return aiPerms.chat || false
        return false
      }

      if (resource === 'calculators') {
        const calcPerms = resourcePerms as any
        if (permission === 'read') return calcPerms.basic || calcPerms.advanced || false
        return false
      }

      // Standard CRUD permissions
      return (resourcePerms as ResourcePermissions)[permission] || false
    }
  }, [currentOrganization, userRole, userMembership])

  /**
   * Get all permissions for a resource
   */
  const getResourcePermissions = useMemo(() => {
    return (resource: ResourceType): ResourcePermissions | null => {
      if (!currentOrganization) {
        // Individual user has all permissions
        return { create: true, read: true, update: true, delete: true }
      }

      if (!userRole) {
        return null
      }

      const rolePermissions = DEFAULT_ROLE_PERMISSIONS[userRole]
      if (!rolePermissions) {
        return null
      }

      const resourcePerms = rolePermissions[resource]
      if (!resourcePerms) {
        return null
      }

      // Return as ResourcePermissions (may need conversion for special types)
      return resourcePerms as ResourcePermissions
    }
  }, [currentOrganization, userRole])

  /**
   * Check if user has any permission on a resource
   */
  const hasAnyPermission = useMemo(() => {
    return (resource: ResourceType): boolean => {
      const perms = getResourcePermissions(resource)
      if (!perms) return false

      return perms.create || perms.read || perms.update || perms.delete
    }
  }, [getResourcePermissions])

  /**
   * Check if user can access a specific farm
   */
  const canAccessFarm = useMemo(() => {
    return (farmId: number): boolean => {
      // No organization = individual user can access their own farms
      if (!currentOrganization) {
        return true
      }

      if (!userMembership) {
        return false
      }

      return checkFarmAccess(farmId, userMembership)
    }
  }, [currentOrganization, userMembership])

  /**
   * Get full permission matrix
   */
  const permissionMatrix = useMemo(() => {
    if (!userRole) {
      // Individual user gets full permissions
      if (!currentOrganization) {
        return DEFAULT_ROLE_PERMISSIONS.owner
      }
      return null
    }

    return DEFAULT_ROLE_PERMISSIONS[userRole]
  }, [userRole, currentOrganization])

  return {
    hasPermission,
    getResourcePermissions,
    hasAnyPermission,
    canAccessFarm,
    userRole,
    isOrgUser: !!currentOrganization,
    isAdmin: isOrgAdmin,
    isOwner: isOrgOwner,
    permissionMatrix
  }
}

/**
 * Helper function to check farm access based on membership
 */
function checkFarmAccess(farmId: number, membership: any): boolean {
  const { role, assignedFarmIds } = membership

  // Owner and Admin have access to all farms
  if (role === 'owner' || role === 'admin') {
    return true
  }

  // Farm Manager: Check if restricted to specific farms
  if (role === 'farm_manager') {
    if (!assignedFarmIds || assignedFarmIds.length === 0) {
      // No restriction = access to all farms
      return true
    }
    return assignedFarmIds.includes(farmId)
  }

  // Other roles: Must have farm explicitly assigned
  if (assignedFarmIds && assignedFarmIds.length > 0) {
    return assignedFarmIds.includes(farmId)
  }

  return false
}

/**
 * Hook to check a single permission
 * Convenience hook for simple permission checks
 */
export function useHasPermission(
  resource: ResourceType,
  permission: Permission,
  farmId?: number
): boolean {
  const { hasPermission } = usePermissions()
  return hasPermission(resource, permission, farmId)
}

/**
 * Hook to check if user can create a specific resource
 */
export function useCanCreate(resource: ResourceType, farmId?: number): boolean {
  return useHasPermission(resource, 'create', farmId)
}

/**
 * Hook to check if user can read a specific resource
 */
export function useCanRead(resource: ResourceType, farmId?: number): boolean {
  return useHasPermission(resource, 'read', farmId)
}

/**
 * Hook to check if user can update a specific resource
 */
export function useCanUpdate(resource: ResourceType, farmId?: number): boolean {
  return useHasPermission(resource, 'update', farmId)
}

/**
 * Hook to check if user can delete a specific resource
 */
export function useCanDelete(resource: ResourceType, farmId?: number): boolean {
  return useHasPermission(resource, 'delete', farmId)
}

/**
 * Hook to get user's accessible farms (if restricted)
 * Returns null if user has access to all farms
 */
export function useAccessibleFarms(): number[] | null {
  const { userMembership, currentOrganization } = useOrganization()

  if (!currentOrganization) {
    // Individual user has access to all their farms
    return null
  }

  if (!userMembership) {
    return []
  }

  const { role, assignedFarmIds } = userMembership

  // Owner and Admin have access to all farms
  if (role === 'owner' || role === 'admin') {
    return null
  }

  // Farm Manager without restrictions has access to all
  if (role === 'farm_manager' && (!assignedFarmIds || assignedFarmIds.length === 0)) {
    return null
  }

  // Return assigned farms (could be empty)
  return assignedFarmIds || []
}
