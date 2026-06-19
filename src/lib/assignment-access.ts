import { type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export type AssigneeCheckResult = { ok: true } | { ok: false; error: string; status: 400 | 500 }

/**
 * Validate a proposed Assignment target (`organization_clients.assigned_to`).
 *
 * An Assignment may only ever target an Agronomist: `assignedTo` must be null
 * (Unassigned) or a member holding the `agronomist` role in the SAME
 * organization. This mirrors the database trigger
 * (202606190001_assignment_targets_agronomist) so API routes can return a
 * friendly message before the DB raises. See
 * docs/adr/0001-assignment-targets-agronomist.md.
 */
export async function assertAssigneeIsAgronomist(
  admin: SupabaseClient<Database>,
  organizationId: string,
  assignedTo: string | null | undefined
): Promise<AssigneeCheckResult> {
  if (!assignedTo) {
    return { ok: true }
  }

  const { data, error } = await admin
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', assignedTo)
    .maybeSingle()

  if (error) {
    return { ok: false, error: 'Failed to verify assigned agronomist', status: 500 }
  }

  if (!data) {
    return { ok: false, error: 'Assigned agronomist must belong to the organization', status: 400 }
  }

  if (data.role !== 'agronomist') {
    return { ok: false, error: 'Assigned user must have the agronomist role', status: 400 }
  }

  return { ok: true }
}
