import { getTypedSupabaseClient } from './supabase'
import type { ConsultantRole } from './consultant-access'

export interface OrgMember {
  id: string
  full_name: string | null
  email: string | null
  role: ConsultantRole
  is_owner: boolean
  joined_at: string | null
}

export interface PendingInvite {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'agronomist'
  token: string
  expires_at: string
  created_at: string | null
}

/**
 * List members of an organization.
 * RLS lets any member read organization_members; profiles are fetched and merged.
 * Sort owners/admins first, then agronomists, then by name.
 */
export async function listOrgMembers(organizationId: string): Promise<OrgMember[]> {
  const supabase = await getTypedSupabaseClient()

  const { data: members, error } = await supabase
    .from('organization_members')
    .select('user_id, role, is_owner, joined_at')
    .eq('organization_id', organizationId)

  if (error) {
    throw new Error(`Failed to load organization members: ${error.message}`)
  }

  if (!members || members.length === 0) {
    return []
  }

  const userIds = members.map((m) => m.user_id)

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds)

  if (profilesError) {
    throw new Error(`Failed to load member profiles: ${profilesError.message}`)
  }

  const profilesById = new Map((profiles ?? []).map((p) => [p.id, p]))

  const rows: OrgMember[] = members.map((member) => {
    const profile = profilesById.get(member.user_id)
    const role = (member.is_owner ? 'owner' : member.role) as ConsultantRole
    return {
      id: member.user_id,
      full_name: profile?.full_name ?? null,
      email: profile?.email ?? null,
      role,
      is_owner: member.is_owner ?? false,
      joined_at: member.joined_at
    }
  })

  const roleRank: Record<ConsultantRole, number> = {
    owner: 0,
    admin: 0,
    agronomist: 1
  }

  return rows.sort((a, b) => {
    const rankDiff = roleRank[a.role] - roleRank[b.role]
    if (rankDiff !== 0) return rankDiff
    return (a.full_name ?? '').localeCompare(b.full_name ?? '')
  })
}

/**
 * List pending member invitations for an organization, newest first.
 * RLS returns [] for non-admins, which is fine.
 */
export async function listPendingInvites(organizationId: string): Promise<PendingInvite[]> {
  const supabase = await getTypedSupabaseClient()

  const { data, error } = await supabase
    .from('organization_member_invitations')
    .select('id, email, first_name, last_name, role, token, expires_at, created_at')
    .eq('organization_id', organizationId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load pending invitations: ${error.message}`)
  }

  return (data ?? []).map((invite) => ({
    id: invite.id,
    email: invite.email,
    first_name: invite.first_name,
    last_name: invite.last_name,
    role: invite.role as 'admin' | 'agronomist',
    token: invite.token,
    expires_at: invite.expires_at,
    created_at: invite.created_at
  }))
}
