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

  // Rule 1: Farm owner
  if (farm.user_id === userId) {
    return { allowed: true }
  }

  // Check organization membership and client links
  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('organization_members')
    .select('organization_id, role, is_owner')
    .eq('user_id', userId)
    .maybeSingle()

  if (membershipError) throw membershipError

  if (!membership) {
    return { allowed: false, reason: 'Forbidden', status: 403 }
  }

  const { data: clientLink, error: clientLinkError } = await supabaseAdmin
    .from('organization_clients')
    .select('id, assigned_to, status')
    .eq('organization_id', membership.organization_id)
    .eq('client_user_id', farm.user_id)
    .eq('status', 'active')
    .maybeSingle()

  if (clientLinkError) throw clientLinkError

  if (!clientLink) {
    return { allowed: false, reason: 'Forbidden', status: 403 }
  }

  // Rule 2: Consultant owner/admin
  const isAdmin =
    membership.is_owner ||
    membership.role === 'owner' ||
    membership.role === 'admin'

  if (isAdmin) {
    return { allowed: true }
  }

  // Rule 3: Agronomist assigned to this client
  if (membership.role === 'agronomist' && clientLink.assigned_to === userId) {
    return { allowed: true }
  }

  return { allowed: false, reason: 'Forbidden', status: 403 }
}
