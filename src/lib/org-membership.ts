import type { getSupabaseAdmin } from '@/lib/supabase-admin'

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>

/**
 * Escape LIKE/ILIKE wildcards so an email is matched literally. `_` and `%` are
 * legal email characters (e.g. john_doe@gmail.com); an unescaped `.ilike('email', email)`
 * would treat `_` as "any char" and could resolve a DIFFERENT account. Backslash is
 * Postgres's default LIKE escape character.
 */
export function escapeLikePattern(value: string): string {
  return value.replace(/([\\%_])/g, '\\$1')
}

/**
 * Resolve the auth user id for an email. Invites are always issued via
 * inviteUserByEmail, which creates a confirmed, passwordless auth user with a
 * profile row — so the profiles lookup is the reliable path. The listUsers
 * fallback covers the rare case where no profile row exists yet.
 */
export async function findAuthUserIdByEmail(
  admin: SupabaseAdmin,
  email: string
): Promise<string | null> {
  // Case-insensitive but wildcard-literal exact match on the email.
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .ilike('email', escapeLikePattern(email))
    .maybeSingle()
  if (profile?.id) return profile.id

  // Fallback: page through auth users (small project; a few pages at most).
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !data?.users?.length) break
    const match = data.users.find((u) => (u.email ?? '').toLowerCase() === email.toLowerCase())
    if (match) return match.id
    if (data.users.length < 1000) break
  }
  return null
}

export type MembershipStatus = 'none' | 'member-of-target' | 'member-of-other'

/**
 * Classify a user's existing org membership relative to a target org, reasoning over
 * the organization_members rows directly. Deliberately avoids `.maybeSingle()`: the
 * table's only unique constraint is composite (organization_id, user_id), so a legacy
 * or partial-failure state could leave more than one row per user — fetch them all and
 * reason over the set so a corrupt multi-row state still resolves cleanly instead of
 * raising PGRST116. Returns `{ error }` on a DB failure so callers can surface a 500.
 */
export async function classifyMembership(
  admin: SupabaseAdmin,
  userId: string,
  targetOrganizationId: string
): Promise<{ status: MembershipStatus } | { error: string }> {
  const { data: memberships, error } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)

  if (error) return { error: error.message }

  if (memberships?.some((m) => m.organization_id === targetOrganizationId)) {
    return { status: 'member-of-target' }
  }
  if ((memberships?.length ?? 0) > 0) {
    return { status: 'member-of-other' }
  }
  return { status: 'none' }
}
