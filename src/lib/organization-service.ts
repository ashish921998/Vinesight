/**
 * Organization Service
 * Handles CRUD operations for organizations, members, and invitations
 */

import { getSupabaseClient } from './supabase'
import { auditLogger } from './audit-logger'
import type {
  Organization,
  OrganizationInsert,
  OrganizationUpdate,
  OrganizationMember,
  OrganizationMemberInsert,
  OrganizationMemberUpdate,
  OrganizationInvitation,
  OrganizationInvitationInsert,
  UserRole
} from '@/types/rbac'

class OrganizationService {
  private supabase = getSupabaseClient()

  // ============================================
  // ORGANIZATION CRUD
  // ============================================

  /**
   * Create a new organization
   */
  async createOrganization(data: OrganizationInsert): Promise<Organization | null> {
    try {
      const { data: org, error } = await this.supabase
        .from('organizations')
        .insert({
          name: data.name,
          type: data.type,
          subscription_tier: data.subscriptionTier,
          subscription_status: data.subscriptionStatus,
          max_users: data.maxUsers,
          max_farms: data.maxFarms,
          registration_number: data.registrationNumber,
          tax_id: data.taxId,
          address: data.address,
          contact_email: data.contactEmail,
          contact_phone: data.contactPhone,
          features: data.features || {},
          settings: data.settings || {},
          created_by: data.createdBy,
          metadata: data.metadata || {}
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating organization:', error)
        return null
      }

      if (org) {
        // Auto-add creator as owner
        const member = await this.addMember({
          organizationId: org.id,
          userId: data.createdBy,
          role: 'owner'
        })

        // Rollback if owner couldn't be added (prevents orphan organization)
        if (!member) {
          console.error('Failed to add owner to organization, rolling back')
          const { error: deleteError } = await this.supabase
            .from('organizations')
            .delete()
            .eq('id', org.id)
          if (deleteError) {
            console.error('Failed to rollback organization:', deleteError)
          }
          return null
        }

        // Audit log
        await auditLogger.logCreate('organizations', org.id, org, {
          organizationId: org.id
        })
      }

      return this.normalizeOrganization(org)
    } catch (error) {
      console.error('Error in createOrganization:', error)
      return null
    }
  }

  /**
   * Get organization by ID
   */
  async getOrganization(id: string): Promise<Organization | null> {
    try {
      const { data, error } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        return null
      }

      return this.normalizeOrganization(data)
    } catch (error) {
      console.error('Error in getOrganization:', error)
      return null
    }
  }

  /**
   * Update organization
   */
  async updateOrganization(id: string, updates: OrganizationUpdate): Promise<Organization | null> {
    try {
      // Get old values for audit
      const oldOrg = await this.getOrganization(id)

      const { data, error } = await this.supabase
        .from('organizations')
        .update({
          name: updates.name,
          type: updates.type,
          subscription_tier: updates.subscriptionTier,
          subscription_status: updates.subscriptionStatus,
          max_users: updates.maxUsers,
          max_farms: updates.maxFarms,
          registration_number: updates.registrationNumber,
          tax_id: updates.taxId,
          address: updates.address,
          contact_email: updates.contactEmail,
          contact_phone: updates.contactPhone,
          features: updates.features,
          settings: updates.settings,
          metadata: updates.metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error || !data) {
        console.error('Error updating organization:', error)
        return null
      }

      // Audit log
      if (oldOrg) {
        await auditLogger.logUpdate('organizations', id, oldOrg, data, {
          organizationId: id
        })
      }

      return this.normalizeOrganization(data)
    } catch (error) {
      console.error('Error in updateOrganization:', error)
      return null
    }
  }

  /**
   * Delete organization (owner only)
   */
  async deleteOrganization(id: string): Promise<boolean> {
    try {
      // Get org for audit
      const org = await this.getOrganization(id)

      const { error } = await this.supabase.from('organizations').delete().eq('id', id)

      if (error) {
        console.error('Error deleting organization:', error)
        return false
      }

      // Audit log
      if (org) {
        await auditLogger.logDelete('organizations', id, org, {
          organizationId: id
        })
      }

      return true
    } catch (error) {
      console.error('Error in deleteOrganization:', error)
      return false
    }
  }

  // ============================================
  // MEMBER MANAGEMENT
  // ============================================

  /**
   * Add member to organization
   */
  async addMember(data: OrganizationMemberInsert): Promise<OrganizationMember | null> {
    try {
      const { data: member, error } = await this.supabase
        .from('organization_members')
        .insert({
          organization_id: data.organizationId,
          user_id: data.userId,
          role: data.role,
          custom_permissions: data.customPermissions || {},
          assigned_farm_ids: data.assignedFarmIds ?? null,
          status: data.status || 'active',
          invited_by: data.invitedBy
        })
        .select()
        .single()

      if (error || !member) {
        console.error('Error adding member:', error)
        return null
      }

      // Audit log
      await auditLogger.logCreate('organization_members', member.id, member, {
        organizationId: data.organizationId
      })

      return this.normalizeMember(member)
    } catch (error) {
      console.error('Error in addMember:', error)
      return null
    }
  }

  /**
   * Get organization members
   */
  async getMembers(organizationId: string): Promise<OrganizationMember[]> {
    try {
      const { data, error } = await this.supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .order('joined_at', { ascending: false })

      if (error || !data) {
        return []
      }

      return data.map(this.normalizeMember)
    } catch (error) {
      console.error('Error in getMembers:', error)
      return []
    }
  }

  /**
   * Get specific member
   */
  async getMember(organizationId: string, userId: string): Promise<OrganizationMember | null> {
    try {
      const { data, error } = await this.supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (error || !data) {
        return null
      }

      return this.normalizeMember(data)
    } catch (error) {
      console.error('Error in getMember:', error)
      return null
    }
  }

  /**
   * Update member (change role or farm assignments)
   */
  async updateMember(
    memberId: string,
    updates: OrganizationMemberUpdate,
    organizationId: string
  ): Promise<OrganizationMember | null> {
    try {
      // Get old values for audit
      const { data: oldMember } = await this.supabase
        .from('organization_members')
        .select('*')
        .eq('id', memberId)
        .eq('organization_id', organizationId)
        .single()

      const { data, error } = await this.supabase
        .from('organization_members')
        .update({
          role: updates.role,
          custom_permissions: updates.customPermissions,
          assigned_farm_ids: updates.assignedFarmIds ?? null,
          status: updates.status,
          last_active_at: updates.lastActiveAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)
        .eq('organization_id', organizationId)
        .select()
        .single()

      if (error || !data) {
        console.error('Error updating member:', error)
        return null
      }

      // Audit log
      if (oldMember) {
        await auditLogger.logUpdate('organization_members', memberId, oldMember, data, {
          organizationId
        })
      }

      return this.normalizeMember(data)
    } catch (error) {
      console.error('Error in updateMember:', error)
      return null
    }
  }

  /**
   * Remove member from organization
   */
  async removeMember(memberId: string, organizationId: string): Promise<boolean> {
    try {
      // Get member for audit
      const { data: member } = await this.supabase
        .from('organization_members')
        .select('*')
        .eq('id', memberId)
        .eq('organization_id', organizationId)
        .single()

      const { error } = await this.supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId)
        .eq('organization_id', organizationId)

      if (error) {
        console.error('Error removing member:', error)
        return false
      }

      // Audit log
      if (member) {
        await auditLogger.logRemove(member.user_id, member.role as UserRole, organizationId)
      }

      return true
    } catch (error) {
      console.error('Error in removeMember:', error)
      return false
    }
  }

  // ============================================
  // INVITATION MANAGEMENT
  // ============================================

  /**
   * Create invitation
   */
  async createInvitation(
    data: OrganizationInvitationInsert
  ): Promise<OrganizationInvitation | null> {
    try {
      const { data: invitation, error } = await this.supabase
        .from('organization_invitations')
        .insert({
          organization_id: data.organizationId,
          email: data.email,
          role: data.role,
          assigned_farm_ids: data.assignedFarmIds ?? null,
          token: data.token,
          expires_at: data.expiresAt,
          invited_by: data.invitedBy,
          message: data.message,
          metadata: data.metadata || {}
        })
        .select()
        .single()

      if (error || !invitation) {
        console.error('Error creating invitation:', error)
        return null
      }

      // Audit log
      await auditLogger.logInvite(data.email, data.role, data.organizationId)

      return this.normalizeInvitation(invitation)
    } catch (error) {
      console.error('Error in createInvitation:', error)
      return null
    }
  }

  /**
   * Get pending invitations for organization
   */
  async getPendingInvitations(organizationId: string): Promise<OrganizationInvitation[]> {
    try {
      const { data, error } = await this.supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error || !data) {
        return []
      }

      return data.map(this.normalizeInvitation)
    } catch (error) {
      console.error('Error in getPendingInvitations:', error)
      return []
    }
  }

  /**
   * Get invitation by token
   */
  async getInvitationByToken(token: string): Promise<OrganizationInvitation | null> {
    try {
      const { data, error } = await this.supabase
        .from('organization_invitations')
        .select('*')
        .eq('token', token)
        .single()

      if (error || !data) {
        return null
      }

      return this.normalizeInvitation(data)
    } catch (error) {
      console.error('Error in getInvitationByToken:', error)
      return null
    }
  }

  /**
   * Accept invitation - atomically claim first to prevent race conditions
   */
  async acceptInvitation(token: string, userId: string): Promise<OrganizationMember | null> {
    try {
      // Step 1: Atomically claim the invitation (prevents race condition)
      const { data: claimedInvitation, error: claimError } = await this.supabase
        .from('organization_invitations')
        .update({
          status: 'accepted',
          accepted_by: userId,
          accepted_at: new Date().toISOString()
        })
        .eq('token', token)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .select()
        .single()

      if (claimError || !claimedInvitation) {
        // Either already claimed, expired, or doesn't exist
        console.warn('Invitation could not be claimed:', claimError?.message || 'not found/expired')
        return null
      }

      const invitation = this.normalizeInvitation(claimedInvitation)

      // Step 2: Check for existing membership to avoid duplicates
      const { data: existingMember } = await this.supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', invitation.organizationId)
        .eq('user_id', userId)
        .single()

      if (existingMember) {
        console.warn('User is already a member of this organization')
        return null
      }

      // Step 3: Add member
      const member = await this.addMember({
        organizationId: invitation.organizationId,
        userId,
        role: invitation.role,
        assignedFarmIds: invitation.assignedFarmIds
      })

      // Step 4: If addMember failed, revert invitation status
      if (!member) {
        console.error('Failed to add member, reverting invitation status')
        await this.supabase
          .from('organization_invitations')
          .update({
            status: 'pending',
            accepted_by: null,
            accepted_at: null
          })
          .eq('token', token)
        return null
      }

      return member
    } catch (error) {
      console.error('Error in acceptInvitation:', error)
      return null
    }
  }

  /**
   * Revoke/cancel invitation
   * Only revokes if invitation belongs to the organization and is still pending
   */
  async revokeInvitation(invitationId: string, organizationId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('organization_invitations')
        .delete()
        .eq('id', invitationId)
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .select()

      if (error) {
        console.error('Error revoking invitation:', error)
        return false
      }

      // Verify a row was actually deleted
      if (!data || data.length === 0) {
        console.warn('No invitation was revoked - not found, wrong org, or not pending')
        return false
      }

      return true
    } catch (error) {
      console.error('Error in revokeInvitation:', error)
      return false
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Check if user has reached member limit
   */
  async canAddMember(organizationId: string): Promise<boolean> {
    try {
      const org = await this.getOrganization(organizationId)
      if (!org) return false

      const members = await this.getMembers(organizationId)
      return members.length < org.maxUsers
    } catch (error) {
      return false
    }
  }

  /**
   * Get member count for organization
   */
  async getMemberCount(organizationId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'active')

      if (error) {
        console.error('Error getting member count:', error)
      }
      return count || 0
    } catch (error) {
      console.error('Error in getMemberCount:', error)
      return 0
    }
  }

  /**
   * Get farm count for organization
   */
  async getFarmCount(organizationId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('farms')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)

      if (error) {
        console.error('Error getting farm count:', error)
      }
      return count || 0
    } catch (error) {
      console.error('Error in getFarmCount:', error)
      return 0
    }
  }

  /**
   * Migrate individual user to organization
   */
  async migrateUserToOrganization(
    userId: string,
    orgName: string,
    orgType: 'business' | 'enterprise' = 'business'
  ): Promise<Organization | null> {
    try {
      // Call database function
      const { data, error } = await this.supabase.rpc('migrate_user_to_organization', {
        p_user_id: userId,
        p_org_name: orgName,
        p_org_type: orgType
      })

      if (error) {
        console.error('Error migrating user:', error)
        return null
      }

      if (data) {
        return await this.getOrganization(data)
      }

      return null
    } catch (error) {
      console.error('Error in migrateUserToOrganization:', error)
      return null
    }
  }

  // ============================================
  // NORMALIZATION HELPERS
  // ============================================

  private normalizeOrganization(data: any): Organization {
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      subscriptionTier: data.subscription_tier,
      subscriptionStatus: data.subscription_status,
      maxUsers: data.max_users,
      maxFarms: data.max_farms,
      registrationNumber: data.registration_number,
      taxId: data.tax_id,
      address: data.address,
      contactEmail: data.contact_email,
      contactPhone: data.contact_phone,
      features: data.features || {},
      settings: data.settings || {},
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      metadata: data.metadata || {}
    }
  }

  private normalizeMember(data: any): OrganizationMember {
    return {
      id: data.id,
      organizationId: data.organization_id,
      userId: data.user_id,
      role: data.role,
      customPermissions: data.custom_permissions || {},
      assignedFarmIds: data.assigned_farm_ids,
      status: data.status,
      invitedBy: data.invited_by,
      joinedAt: data.joined_at,
      lastActiveAt: data.last_active_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  private normalizeInvitation(data: any): OrganizationInvitation {
    return {
      id: data.id,
      organizationId: data.organization_id,
      email: data.email,
      role: data.role,
      assignedFarmIds: data.assigned_farm_ids,
      status: data.status,
      token: data.token,
      expiresAt: data.expires_at,
      invitedBy: data.invited_by,
      acceptedBy: data.accepted_by,
      createdAt: data.created_at,
      acceptedAt: data.accepted_at,
      message: data.message,
      metadata: data.metadata || {}
    }
  }
}

// Export singleton instance
export const organizationService = new OrganizationService()
