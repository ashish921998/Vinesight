import { getTypedSupabaseClient } from './supabase'
import type { Json } from '@/types/database'

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
}

export class OrganizationService {
  // ==================== ORGANIZATION CRUD ====================

  static async getOrganization(id: string): Promise<Organization | null> {
    const supabase = await getTypedSupabaseClient()
    const { data, error } = await supabase.from('organizations').select('*').eq('id', id).single()

    if (error) throw error
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

    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name,
        slug: options?.slug || null,
        description: options?.description || null,
        created_by: user?.id || null,
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
    const { data, error } = await supabase
      .from('organization_clients')
      .select('*')
      .eq('organization_id', organizationId)

    if (error) throw error
    return (data || []) as OrganizationClient[]
  }

  static async addOrganizationClient(
    organizationId: string,
    clientUserId: string,
    notes?: string
  ): Promise<OrganizationClient> {
    const supabase = await getTypedSupabaseClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('organization_clients')
      .insert({
        organization_id: organizationId,
        client_user_id: clientUserId,
        assigned_by: user?.id || null,
        notes: notes || null
      })
      .select()
      .single()

    if (error) throw error
    return data as OrganizationClient
  }

  static async isUserOrgClient(
    userId: string
  ): Promise<{ isClient: boolean; organizationId?: string }> {
    const supabase = await getTypedSupabaseClient()
    const { data, error } = await supabase
      .from('organization_clients')
      .select('organization_id')
      .eq('client_user_id', userId)
      .limit(1)

    if (error) throw error
    if (data && data.length > 0) {
      return { isClient: true, organizationId: data[0].organization_id }
    }
    return { isClient: false }
  }

  // ==================== CLIENT FARMS ====================

  static async getClientFarms(clientUserId: string) {
    const supabase = await getTypedSupabaseClient()
    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .eq('user_id', clientUserId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }
}
