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
    // Surface the underlying fault server-side; the caller only sees the 500. Mirrors
    // resolveInviteAssignee and the inline checks this helper replaced.
    console.error('Error verifying assigned agronomist role:', error)
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

/**
 * Resolve the Assignment target when a Farmer accepts an invite. The inviter is
 * inherited as the assigned Agronomist only when they actually hold the
 * `agronomist` role; an Owner/Admin invite (or any case we can't confirm) lands
 * the Client **Unassigned** (`null`), to be assigned deliberately from
 * Team → Assignments. Null always satisfies the assignment trigger, so this fails
 * safe to Unassigned rather than blocking the accept. `assigned_by` is tracked
 * separately by the caller — it records who enrolled the Farmer regardless of role.
 * See docs/adr/0001-assignment-targets-agronomist.md.
 */
export async function resolveInviteAssignee(
  admin: SupabaseClient<Database>,
  organizationId: string,
  invitedBy: string | null | undefined
): Promise<string | null> {
  if (!invitedBy) {
    return null
  }

  const { data, error } = await admin
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', invitedBy)
    .maybeSingle()

  if (error) {
    // Non-fatal: we couldn't confirm the inviter's role, so land Unassigned. The
    // farmer is still linked; an Owner/Admin can assign them from Team → Assignments.
    console.error('Error resolving invite assignee role:', error)
    return null
  }

  return data?.role === 'agronomist' ? invitedBy : null
}
