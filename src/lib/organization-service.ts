import { getTypedSupabaseClient } from './supabase'
import type { Json, Database } from '@/types/database'

// Types
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
  role: 'admin' | 'agronomist'
  is_owner: boolean | null
  joined_at: string | null
}

export interface OrganizationClient {
  id: string
  organization_id: string
  client_user_id: string
  assigned_by: string | null
  assigned_at: string | null
  notes: string | null
  full_name?: string | null
  email?: string | null
}

export class OrganizationService {
  // ==================== ORGANIZATION CRUD ====================

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

  // ==================== ORGANIZATION MEMBERS ====================

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
    role: 'admin' | 'agronomist',
    isOwner = false
  ): Promise<OrganizationMember> {
    const supabase = await getTypedSupabaseClient()
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

  // ==================== ORGANIZATION CLIENTS (FARMERS) ====================

  static async getOrganizationClients(organizationId: string): Promise<OrganizationClient[]> {
    const supabase = await getTypedSupabaseClient()
    // Fetch limited profile fields (id, full_name, email, updated_at) to minimize PII exposure.
    // Sensitive fields like phone, address, etc. are intentionally excluded.
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, updated_at')
      .eq('consultant_organization_id', organizationId)

    if (error) throw error

    // Map profiles to OrganizationClient structure
    return (data ?? []).map((profile) => ({
      id: profile.id,
      client_user_id: profile.id,
      organization_id: organizationId,
      full_name: profile.full_name,
      email: profile.email,
      assigned_at: profile.updated_at,
      assigned_by: null,
      notes: null
    }))
  }

  static async addOrganizationClient(organizationId: string, clientUserId: string): Promise<void> {
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
      .select('id, role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (membershipError && membershipError.code !== 'PGRST116') {
      throw membershipError
    }

    if (!membership) {
      throw new Error('Permission denied: You are not authorized to modify this organization')
    }

    const { error } = await supabase
      .from('profiles')
      .update({ consultant_organization_id: organizationId })
      .eq('id', clientUserId)

    if (error) throw error
  }

  static async isUserOrgClient(
    userId: string
  ): Promise<{ isClient: boolean; organizationId?: string }> {
    const supabase = await getTypedSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('consultant_organization_id')
      .eq('id', userId)
      .single()

    if (error) {
      // Handle profile not found gracefully - treat as not a client
      if (error.code === 'PGRST116') {
        return { isClient: false }
      }
      throw error
    }

    if (data && data.consultant_organization_id) {
      return { isClient: true, organizationId: data.consultant_organization_id }
    }
    return { isClient: false }
  }

  // ==================== CLIENT FARMS ====================

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
