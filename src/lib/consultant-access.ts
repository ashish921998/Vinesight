import { getTypedSupabaseClient } from './supabase'

export type ConsultantRole = 'owner' | 'admin' | 'agronomist'

export const roleLabels: Record<ConsultantRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  agronomist: 'Agronomist'
}

export interface ConsultantAccess {
  userId: string
  organizationId: string
  role: ConsultantRole
  canViewAllFarmers: boolean
  isAgronomist: boolean
}

/**
 * Returns the consultant's access context for the current session.
 * Assumes one-org-per-user for V1 (deterministic: first membership by joined_at).
 */
export async function getConsultantAccess(): Promise<ConsultantAccess | null> {
  const supabase = await getTypedSupabaseClient()

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  // Deterministic: one org per user for V1
  const { data: membership, error: memberError } = await supabase
    .from('organization_members')
    .select('organization_id, role, is_owner')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (memberError || !membership) {
    return null
  }

  const validRoles: string[] = ['owner', 'admin', 'agronomist']
  const resolvedRole = membership.is_owner ? 'owner' : membership.role
  if (!validRoles.includes(resolvedRole)) {
    return null
  }

  const role = resolvedRole as ConsultantRole

  const canViewAllFarmers = role === 'owner' || role === 'admin'

  return {
    userId: user.id,
    organizationId: membership.organization_id,
    role,
    canViewAllFarmers,
    isAgronomist: role === 'agronomist'
  }
}
