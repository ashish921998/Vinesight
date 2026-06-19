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
  organizationName: string | null
  joinCode: string | null
  role: ConsultantRole
  canViewAllFarmers: boolean
  isAgronomist: boolean
}

/** Shape of the embedded `organizations(name, slug)` selection. */
interface EmbeddedOrganization {
  name: string | null
  slug: string | null
}

/**
 * The PostgREST embed for a many-to-one relationship is a single record, but the
 * generated types can surface it as either an object or a single-element array.
 * Normalize defensively to one record (or null).
 */
function normalizeEmbeddedOrganization(
  organizations: EmbeddedOrganization | EmbeddedOrganization[] | null
): EmbeddedOrganization | null {
  if (!organizations) {
    return null
  }
  return Array.isArray(organizations) ? (organizations[0] ?? null) : organizations
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
    .select('organization_id, role, is_owner, organizations(name, slug)')
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

  const organization = normalizeEmbeddedOrganization(membership.organizations)

  return {
    userId: user.id,
    organizationId: membership.organization_id,
    organizationName: organization?.name ?? null,
    joinCode: organization?.slug ?? null,
    role,
    canViewAllFarmers,
    isAgronomist: role === 'agronomist'
  }
}
