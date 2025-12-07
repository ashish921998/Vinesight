'use client'

/**
 * PermissionGuard Components
 * Conditional rendering based on user permissions
 */

import { ReactNode } from 'react'
import {
  usePermissions,
  useCanCreate,
  useCanRead,
  useCanUpdate,
  useCanDelete
} from '@/hooks/usePermissions'
import { Permission, ResourceType } from '@/types/rbac'

// ============================================
// BASE PERMISSION GUARD
// ============================================

interface PermissionGuardProps {
  /** Resource type to check permissions for */
  resource: ResourceType
  /** Permission level required */
  permission: Permission
  /** Optional farm ID for farm-specific permissions */
  farmId?: number
  /** Content to render if permission denied */
  fallback?: ReactNode
  /** Content to render if permission granted */
  children: ReactNode
  /** Optional: Show loading state */
  showLoading?: boolean
  /** Optional: Custom loading component */
  loadingComponent?: ReactNode
}

/**
 * Base PermissionGuard component
 * Renders children only if user has the specified permission
 */
export function PermissionGuard({
  resource,
  permission,
  farmId,
  fallback = null,
  children,
  showLoading = false,
  loadingComponent = null
}: PermissionGuardProps) {
  const { hasPermission, isOrgUser } = usePermissions()

  // For individual users (no org), always allow
  if (!isOrgUser) {
    return <>{children}</>
  }

  if (showLoading && loadingComponent) {
    return <>{loadingComponent}</>
  }

  if (!hasPermission(resource, permission, farmId)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// ============================================
// CONVENIENCE COMPONENTS
// ============================================

interface SimpleGuardProps {
  /** Resource type to check permissions for */
  resource: ResourceType
  /** Optional farm ID for farm-specific permissions */
  farmId?: number
  /** Content to render if permission denied */
  fallback?: ReactNode
  /** Content to render if permission granted */
  children: ReactNode
}

/**
 * Render children only if user can CREATE the resource
 */
export function CanCreate({ resource, farmId, children, fallback }: SimpleGuardProps) {
  const canCreate = useCanCreate(resource, farmId)

  if (!canCreate) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Render children only if user can READ the resource
 */
export function CanRead({ resource, farmId, children, fallback }: SimpleGuardProps) {
  const canRead = useCanRead(resource, farmId)

  if (!canRead) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Render children only if user can UPDATE the resource
 */
export function CanUpdate({ resource, farmId, children, fallback }: SimpleGuardProps) {
  const canUpdate = useCanUpdate(resource, farmId)

  if (!canUpdate) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Render children only if user can DELETE the resource
 */
export function CanDelete({ resource, farmId, children, fallback }: SimpleGuardProps) {
  const canDelete = useCanDelete(resource, farmId)

  if (!canDelete) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// ============================================
// ROLE-BASED GUARDS
// ============================================

interface RoleGuardProps {
  /** Content to render if permission denied */
  fallback?: ReactNode
  /** Content to render if permission granted */
  children: ReactNode
}

/**
 * Render children only if user is organization admin (owner or admin)
 */
export function RequireAdmin({ children, fallback = null }: RoleGuardProps) {
  const { isAdmin, isOrgUser } = usePermissions()

  // Individual users are considered admins of their own data
  if (!isOrgUser) {
    return <>{children}</>
  }

  if (!isAdmin) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Render children only if user is organization owner
 */
export function RequireOwner({ children, fallback = null }: RoleGuardProps) {
  const { isOwner, isOrgUser } = usePermissions()

  // Individual users are considered owners of their own data
  if (!isOrgUser) {
    return <>{children}</>
  }

  if (!isOwner) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Render children only if user is in an organization
 */
export function RequireOrganization({ children, fallback = null }: RoleGuardProps) {
  const { isOrgUser } = usePermissions()

  if (!isOrgUser) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Render children only if user is NOT in an organization (individual user)
 */
export function RequireIndividual({ children, fallback = null }: RoleGuardProps) {
  const { isOrgUser } = usePermissions()

  if (isOrgUser) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// ============================================
// FARM ACCESS GUARD
// ============================================

interface FarmGuardProps {
  /** Farm ID to check access for */
  farmId: number
  /** Content to render if access denied */
  fallback?: ReactNode
  /** Content to render if access granted */
  children: ReactNode
}

/**
 * Render children only if user can access the specified farm
 */
export function CanAccessFarm({ farmId, children, fallback = null }: FarmGuardProps) {
  const { canAccessFarm } = usePermissions()

  if (!canAccessFarm(farmId)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// ============================================
// MULTI-PERMISSION GUARDS
// ============================================

interface MultiPermissionGuardProps {
  /** Array of permission checks (all must pass) */
  permissions: Array<{
    resource: ResourceType
    permission: Permission
    farmId?: number
  }>
  /** Content to render if any permission check fails */
  fallback?: ReactNode
  /** Content to render if all permission checks pass */
  children: ReactNode
}

/**
 * Render children only if user has ALL specified permissions
 */
export function RequireAllPermissions({
  permissions,
  children,
  fallback = null
}: MultiPermissionGuardProps) {
  const { hasPermission } = usePermissions()

  const hasAllPermissions = permissions.every((p) =>
    hasPermission(p.resource, p.permission, p.farmId)
  )

  if (!hasAllPermissions) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Render children if user has ANY of the specified permissions
 */
export function RequireAnyPermission({
  permissions,
  children,
  fallback = null
}: MultiPermissionGuardProps) {
  const { hasPermission } = usePermissions()

  const hasAnyPermission = permissions.some((p) =>
    hasPermission(p.resource, p.permission, p.farmId)
  )

  if (!hasAnyPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// ============================================
// PERMISSION-AWARE WRAPPERS
// ============================================

interface DisabledWrapperProps {
  /** Resource type to check permissions for */
  resource: ResourceType
  /** Permission level required */
  permission: Permission
  /** Optional farm ID for farm-specific permissions */
  farmId?: number
  /** Content to wrap */
  children: ReactNode
  /** Optional: Custom disabled message */
  disabledMessage?: string
}

/**
 * Wrapper that disables its children if permission is denied
 * Useful for buttons and input elements
 */
export function PermissionDisabledWrapper({
  resource,
  permission,
  farmId,
  children,
  disabledMessage
}: DisabledWrapperProps) {
  const { hasPermission } = usePermissions()

  const allowed = hasPermission(resource, permission, farmId)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!allowed && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <div
      className={!allowed ? 'opacity-50 pointer-events-none' : ''}
      title={disabledMessage}
      onKeyDown={handleKeyDown}
      role={!allowed ? 'none' : undefined}
    >
      {children}
    </div>
  )
}

// ============================================
// EXPORT ALL COMPONENTS
// ============================================

export default PermissionGuard
