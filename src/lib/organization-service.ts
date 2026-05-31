import { getTypedSupabaseClient } from './supabase'
import type { Json, Database } from '@/types/database'

export interface Organization {
  id: string
  name: string
  slug: string | null
  description: string | null
  metadata: Json | null
  created_by: string | null
  created_at: string | null
  is_active: boolean | null
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: 'owner' | 'admin' | 'agronomist'
  is_owner: boolean | null
  joined_at: string | null
}

export interface OrganizationClient {
  id: string
  organization_id: string
  client_user_id: string
  assigned_to: string | null
  assigned_by: string | null
  status: 'active' | 'inactive' | 'pending'
  assigned_at: string | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
  full_name?: string | null
  email?: string | null
}

function canAdminOrganization(
  member: Pick<OrganizationMember, 'role' | 'is_owner'> | null
): boolean {
  return Boolean(member && (member.is_owner || member.role === 'owner' || member.role === 'admin'))
}

function isUniqueConstraintError(error: { code?: string; message?: string; details?: string }) {
  const text = `${error.message ?? ''} ${error.details ?? ''}`.toLowerCase()
  return error.code === '23505' || text.includes('duplicate') || text.includes('unique')
}

export class OrganizationService {
  static async getOrganization(id: string): Promise<Organization | null> {
    const supabase = await getTypedSupabaseClient()
    const { data, error } = await supabase.from('organizations').select('*').eq('id', id).single()

    if (error) {
      // PGRST116 = Row not found
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  }

  static async createOrganization(
    name: string,
    options?: { slug?: string; description?: string }
  ): Promise<Organization> {
    const supabase = await getTypedSupabaseClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    // Surface auth errors distinctly from unauthenticated state
    if (authError) {
      throw authError
    }
    if (!user) {
      throw new Error('User must be authenticated to create an organization')
    }

    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name,
        slug: options?.slug || null,
        description: options?.description || null,
        created_by: user.id,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
    const supabase = await getTypedSupabaseClient()
    const { data, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId)

    if (error) throw error
    // Cast needed because Supabase returns role as string, but our interface uses union type
    return (data ?? []) as OrganizationMember[]
  }

  static async addOrganizationMember(
    organizationId: string,
    userId: string,
    role: 'owner' | 'admin' | 'agronomist',
    isOwner = false
  ): Promise<OrganizationMember> {
    const supabase = await getTypedSupabaseClient()

    // Verify user is authenticated with distinct error handling
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError) {
      throw authError
    }
    if (!user) {
      throw new Error('User must be authenticated to add organization members')
    }

    // Verify calling user is a member of the target organization with permission to add members
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('id, role, is_owner')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (membershipError && membershipError.code !== 'PGRST116') {
      throw membershipError
    }

    if (!membership) {
      throw new Error('Permission denied: You are not authorized to modify this organization')
    }

    // Require admin or owner role to add members
    if (!canAdminOrganization(membership as OrganizationMember | null)) {
      throw new Error('Permission denied: You are not authorized to modify this organization')
    }

    const { data, error } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        role,
        is_owner: isOwner
      })
      .select()
      .single()

    if (error) throw error
    // Cast needed because Supabase returns role as string
    return data as OrganizationMember
  }

  static async getUserOrganizations(userId: string): Promise<Organization[]> {
    const supabase = await getTypedSupabaseClient()
    const { data, error } = await supabase
      .from('organization_members')
      .select('organization_id, organizations(*)')
      .eq('user_id', userId)

    if (error) throw error

    // Extract organizations from the joined data
    return (data || [])
      .map((row) => (row as { organizations: Organization }).organizations)
      .filter(Boolean)
  }

  static async isUserOrgMember(userId: string): Promise<boolean> {
    const supabase = await getTypedSupabaseClient()
    const { data, error } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (error) throw error
    return (data?.length || 0) > 0
  }

  static async getOrganizationClients(organizationId: string): Promise<OrganizationClient[]> {
    const supabase = await getTypedSupabaseClient()
    const { data: clients, error } = await supabase
      .from('organization_clients')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('assigned_at', { ascending: false })

    if (error) throw error

    const clientRows = (clients ?? []) as OrganizationClient[]
    const clientUserIds = clientRows.map((client) => client.client_user_id)

    if (clientUserIds.length === 0) {
      return []
    }

    // Fetch limited profile fields to minimize PII exposure.
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', clientUserIds)

    if (profilesError) throw profilesError

    const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))

    return clientRows.map((client) => {
      const profile = profilesById.get(client.client_user_id)
      return {
        ...client,
        full_name: profile?.full_name ?? null,
        email: profile?.email ?? null
      }
    })
  }

  static async addOrganizationClient(
    organizationId: string,
    clientUserId: string,
    assignedTo?: string | null
  ): Promise<void> {
    const supabase = await getTypedSupabaseClient()

    // Verify user is authenticated with distinct error handling
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError) {
      throw authError
    }
    if (!user) {
      throw new Error('User must be authenticated to add organization clients')
    }

    // Verify calling user is a member of the target organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('id, role, is_owner')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (membershipError && membershipError.code !== 'PGRST116') {
      throw membershipError
    }

    if (!membership) {
      throw new Error('Permission denied: You are not authorized to modify this organization')
    }

    // Require admin or owner role to add clients
    if (!canAdminOrganization(membership as OrganizationMember | null)) {
      throw new Error('Permission denied: You are not authorized to modify this organization')
    }

    if (assignedTo) {
      const { data: assigneeMembership, error: assigneeMembershipError } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', assignedTo)
        .maybeSingle()

      if (assigneeMembershipError) {
        throw assigneeMembershipError
      }

      if (!assigneeMembership) {
        throw new Error('Assigned agronomist must belong to the organization')
      }
    }

    const { data: activeClientLink, error: activeClientLinkError } = await supabase
      .from('organization_clients')
      .select('organization_id')
      .eq('client_user_id', clientUserId)
      .eq('status', 'active')
      .maybeSingle()

    if (activeClientLinkError) {
      throw activeClientLinkError
    }

    if (activeClientLink && activeClientLink.organization_id !== organizationId) {
      throw new Error('Client is already active in another organization')
    }

    const { error } = await supabase.from('organization_clients').upsert(
      {
        organization_id: organizationId,
        client_user_id: clientUserId,
        assigned_to: assignedTo ?? null,
        assigned_by: user.id,
        status: 'active'
      },
      { onConflict: 'organization_id,client_user_id' }
    )

    if (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error('Client is already active in another organization')
      }
      throw error
    }

    // Backward-compatible mirror for existing screens that still read profile state.
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ consultant_organization_id: organizationId })
      .eq('id', clientUserId)

    if (profileError) {
      console.error('Error updating legacy profile organization mirror:', {
        profileError,
        clientUserId,
        organizationId
      })
    }
  }

  static async isUserOrgClient(
    userId: string
  ): Promise<{ isClient: boolean; organizationId?: string }> {
    const supabase = await getTypedSupabaseClient()
    const { data, error } = await supabase
      .from('organization_clients')
      .select('organization_id')
      .eq('client_user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (error) {
      throw error
    }

    if (data?.organization_id) {
      return { isClient: true, organizationId: data.organization_id }
    }
    return { isClient: false }
  }

  static async getClientFarms(
    clientUserId: string
  ): Promise<Database['public']['Tables']['farms']['Row'][]> {
    const supabase = await getTypedSupabaseClient()
    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .eq('user_id', clientUserId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  }
}
