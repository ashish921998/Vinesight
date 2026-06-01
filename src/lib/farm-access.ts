import { type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export type FarmAccessResult =
  | { allowed: true }
  | { allowed: false; reason: string; status: 403 | 404 }

export interface FarmAccessDeps {
  supabaseAdmin: SupabaseClient<Database>
}

/**
 * Check whether a user is allowed to access a farm for reading lab tests / reports.
 *
 * Rules:
 * 1. Farm owner (farms.user_id === userId) -> allowed.
 * 2. Consultant owner/admin whose org has an active organization_clients link to the farm owner -> allowed.
 * 3. Agronomist whose org has an active organization_clients link to the farm owner AND assigned_to === userId -> allowed.
 * 4. Everyone else -> denied.
 */
export async function checkFarmAccess(
  userId: string,
  farmId: number,
  deps: FarmAccessDeps
): Promise<FarmAccessResult> {
  const { supabaseAdmin } = deps

  const { data: farm, error: farmError } = await supabaseAdmin
    .from('farms')
    .select('id, user_id')
    .eq('id', farmId)
    .single()

  if (farmError) {
    if (farmError.code === 'PGRST116') {
      return { allowed: false, reason: 'Farm not found', status: 404 }
    }
    throw farmError
  }

  if (!farm) {
    return { allowed: false, reason: 'Farm not found', status: 404 }
  }

  if (!farm.user_id) {
    return { allowed: false, reason: 'Forbidden', status: 403 }
  }

  // Rule 1: Farm owner
  if (farm.user_id === userId) {
    return { allowed: true }
  }

  // Fetch all org memberships for the user
  const { data: memberships, error: membershipsError } = await supabaseAdmin
    .from('organization_members')
    .select('organization_id, role, is_owner')
    .eq('user_id', userId)

  if (membershipsError) throw membershipsError

  if (!memberships || memberships.length === 0) {
    return { allowed: false, reason: 'Forbidden', status: 403 }
  }

  const orgIds = memberships
    .map((membership) => membership.organization_id)
    .filter((organizationId): organizationId is string => Boolean(organizationId))

  if (orgIds.length === 0) {
    return { allowed: false, reason: 'Forbidden', status: 403 }
  }

  // Check active client links across all orgs
  const { data: clientLinks, error: clientLinksError } = await supabaseAdmin
    .from('organization_clients')
    .select('organization_id, assigned_to, status')
    .in('organization_id', orgIds)
    .eq('client_user_id', farm.user_id)
    .eq('status', 'active')

  if (clientLinksError) throw clientLinksError

  if (!clientLinks || clientLinks.length === 0) {
    return { allowed: false, reason: 'Forbidden', status: 403 }
  }

  for (const link of clientLinks) {
    const member = memberships.find((m) => m.organization_id === link.organization_id)
    if (!member) continue

    // Rule 2: Consultant owner/admin
    const isAdmin = member.is_owner || member.role === 'owner' || member.role === 'admin'
    if (isAdmin) {
      return { allowed: true }
    }

    // Rule 3: Agronomist assigned to this client
    if (member.role === 'agronomist' && link.assigned_to === userId) {
      return { allowed: true }
    }
  }

  return { allowed: false, reason: 'Forbidden', status: 403 }
}
