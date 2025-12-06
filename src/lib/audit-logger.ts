/**
 * Audit Logger Service
 * Tracks all significant actions for compliance and security
 */

import { getSupabaseClient } from './supabase'
import type { AuditAction, AuditLogInsert, UserRole } from '@/types/rbac'

interface AuditLogOptions {
  organizationId?: string
  farmId?: number
  action: AuditAction
  resourceType: string
  resourceId?: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  metadata?: Record<string, any>
}

class AuditLogger {
  private supabase = getSupabaseClient()

  /**
   * Log an action to the audit trail
   */
  async log(options: AuditLogOptions): Promise<void> {
    try {
      // Get current user and their role
      const {
        data: { user }
      } = await this.supabase.auth.getUser()

      if (!user) {
        console.warn('Audit log attempted without authenticated user')
        return
      }

      // Get user's role in organization (if in org context)
      let userRole: UserRole | null = null
      if (options.organizationId) {
        const { data: membership } = await this.supabase
          .from('organization_members')
          .select('role')
          .eq('organization_id', options.organizationId)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        if (membership) {
          userRole = membership.role as UserRole
        }
      }

      // Get request metadata
      const metadata = {
        ...options.metadata,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        timestamp: new Date().toISOString()
      }

      // Create audit log entry
      const auditLog: AuditLogInsert = {
        organizationId: options.organizationId || null,
        farmId: options.farmId || null,
        userId: user.id,
        userRole: userRole,
        action: options.action,
        resourceType: options.resourceType,
        resourceId: options.resourceId || null,
        oldValues: options.oldValues || null,
        newValues: options.newValues || null,
        ipAddress: null, // Would need server-side implementation
        userAgent: metadata.userAgent || null,
        requestId: crypto.randomUUID(),
        metadata
      }

      const { error } = await this.supabase.from('audit_logs').insert(auditLog)

      if (error) {
        console.error('Failed to create audit log:', error)
      }
    } catch (error) {
      console.error('Error in audit logging:', error)
      // Don't throw - audit logging should not break app functionality
    }
  }

  /**
   * Log a create action
   */
  async logCreate(
    resourceType: string,
    resourceId: string,
    newValues: Record<string, any>,
    options: Omit<AuditLogOptions, 'action' | 'resourceType' | 'resourceId' | 'newValues'> = {}
  ): Promise<void> {
    await this.log({
      ...options,
      action: 'create',
      resourceType,
      resourceId,
      newValues
    })
  }

  /**
   * Log an update action
   */
  async logUpdate(
    resourceType: string,
    resourceId: string,
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
    options: Omit<
      AuditLogOptions,
      'action' | 'resourceType' | 'resourceId' | 'oldValues' | 'newValues'
    > = {}
  ): Promise<void> {
    await this.log({
      ...options,
      action: 'update',
      resourceType,
      resourceId,
      oldValues,
      newValues
    })
  }

  /**
   * Log a delete action
   */
  async logDelete(
    resourceType: string,
    resourceId: string,
    oldValues: Record<string, any>,
    options: Omit<AuditLogOptions, 'action' | 'resourceType' | 'resourceId' | 'oldValues'> = {}
  ): Promise<void> {
    await this.log({
      ...options,
      action: 'delete',
      resourceType,
      resourceId,
      oldValues
    })
  }

  /**
   * Log an export action
   */
  async logExport(
    resourceType: string,
    options: Omit<AuditLogOptions, 'action' | 'resourceType'> = {}
  ): Promise<void> {
    await this.log({
      ...options,
      action: 'export',
      resourceType,
      metadata: {
        ...options.metadata,
        exportedAt: new Date().toISOString()
      }
    })
  }

  /**
   * Log a user invitation
   */
  async logInvite(
    email: string,
    role: UserRole,
    organizationId: string,
    options: Partial<AuditLogOptions> = {}
  ): Promise<void> {
    await this.log({
      ...options,
      organizationId,
      action: 'invite',
      resourceType: 'users',
      newValues: { email, role },
      metadata: {
        ...options.metadata,
        invitedEmail: email,
        assignedRole: role
      }
    })
  }

  /**
   * Log a user removal
   */
  async logRemove(
    userId: string,
    role: UserRole,
    organizationId: string,
    options: Partial<AuditLogOptions> = {}
  ): Promise<void> {
    await this.log({
      ...options,
      organizationId,
      action: 'remove',
      resourceType: 'users',
      resourceId: userId,
      oldValues: { role },
      metadata: {
        ...options.metadata,
        removedUserId: userId,
        previousRole: role
      }
    })
  }

  /**
   * Log a user login
   */
  async logLogin(organizationId?: string): Promise<void> {
    await this.log({
      organizationId,
      action: 'login',
      resourceType: 'auth',
      metadata: {
        loginTime: new Date().toISOString()
      }
    })
  }

  /**
   * Log a user logout
   */
  async logLogout(organizationId?: string): Promise<void> {
    await this.log({
      organizationId,
      action: 'logout',
      resourceType: 'auth',
      metadata: {
        logoutTime: new Date().toISOString()
      }
    })
  }

  /**
   * Query audit logs for an organization
   */
  async getOrganizationLogs(
    organizationId: string,
    options: {
      limit?: number
      offset?: number
      action?: AuditAction
      resourceType?: string
      userId?: string
      startDate?: Date
      endDate?: Date
    } = {}
  ) {
    let query = this.supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('timestamp', { ascending: false })

    if (options.action) {
      query = query.eq('action', options.action)
    }

    if (options.resourceType) {
      query = query.eq('resource_type', options.resourceType)
    }

    if (options.userId) {
      query = query.eq('user_id', options.userId)
    }

    if (options.startDate) {
      query = query.gte('timestamp', options.startDate.toISOString())
    }

    if (options.endDate) {
      query = query.lte('timestamp', options.endDate.toISOString())
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    return query
  }

  /**
   * Query audit logs for a specific farm
   */
  async getFarmLogs(
    farmId: number,
    options: {
      limit?: number
      offset?: number
      action?: AuditAction
      startDate?: Date
      endDate?: Date
    } = {}
  ) {
    let query = this.supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('farm_id', farmId)
      .order('timestamp', { ascending: false })

    if (options.action) {
      query = query.eq('action', options.action)
    }

    if (options.startDate) {
      query = query.gte('timestamp', options.startDate.toISOString())
    }

    if (options.endDate) {
      query = query.lte('timestamp', options.endDate.toISOString())
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    return query
  }

  /**
   * Get recent activity summary for an organization
   */
  async getActivitySummary(
    organizationId: string,
    days: number = 7
  ): Promise<{
    totalActions: number
    actionsByType: Record<AuditAction, number>
    activeUsers: number
    recentActivities: any[]
  }> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: logs, error } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false })

    if (error || !logs) {
      return {
        totalActions: 0,
        actionsByType: {} as Record<AuditAction, number>,
        activeUsers: 0,
        recentActivities: []
      }
    }

    const actionsByType = logs.reduce(
      (acc, log) => {
        acc[log.action as AuditAction] = (acc[log.action as AuditAction] || 0) + 1
        return acc
      },
      {} as Record<AuditAction, number>
    )

    const uniqueUsers = new Set(logs.map((log) => log.user_id).filter(Boolean))

    return {
      totalActions: logs.length,
      actionsByType,
      activeUsers: uniqueUsers.size,
      recentActivities: logs.slice(0, 10)
    }
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger()

/**
 * Higher-order function to wrap an async function with audit logging
 */
export function withAuditLog<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  getAuditOptions: (...args: Parameters<T>) => AuditLogOptions
): T {
  return (async (...args: Parameters<T>) => {
    const result = await fn(...args)
    const auditOptions = getAuditOptions(...args)
    await auditLogger.log(auditOptions)
    return result
  }) as T
}
