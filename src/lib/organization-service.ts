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
      data: { user }
    } = await supabase.auth.getUser()

    // P1: Verify user is authenticated
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
    return (data || []) as OrganizationMember[]
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
    // Fetch profiles that have this organization as their consultant
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('consultant_organization_id', organizationId)

    if (error) throw error

    // Map profiles to structure compatible with frontend (or updated structure)
    // We map id to client_user_id to maintain compatibility where possible,
    // but consumers should be aware this is now profile data.
    return (data || []).map((profile) => ({
      ...profile,
      client_user_id: profile.id, // Alias for compatibility
      organization_id: organizationId,
      assigned_at: profile.updated_at, // Approximate
      assigned_by: null, // No longer tracked
      notes: null // No notes support in profiles yet
    }))
  }

  static async addOrganizationClient(organizationId: string, clientUserId: string): Promise<void> {
    const supabase = await getTypedSupabaseClient()

    // P1: Verify user is authenticated
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User must be authenticated to add organization clients')
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

    if (error) throw error

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
