import { type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { getTypedSupabaseClient } from './supabase'
import { FOLLOWED_STATUSES, type FollowedStatus } from './consultant-visit-service'
import type { AdherenceCounts, FarmPetioleSnapshot } from './consultant-dashboard-metrics'

type DashboardClient = SupabaseClient<Database>

async function resolveClient(client?: DashboardClient): Promise<DashboardClient> {
  return client ?? (await getTypedSupabaseClient())
}

const FOLLOWED_STATUS_SET = new Set<string>(FOLLOWED_STATUSES)

/**
 * Recommendation-adherence counts across every visit follow-up the caller can
 * see. The get_org_followup_adherence RPC scopes by can_access_org_client, so
 * owner/admin get the whole org and agronomists get only their assigned clients.
 */
export async function getOrgFollowupAdherence(client?: DashboardClient): Promise<AdherenceCounts> {
  const supabase = await resolveClient(client)
  const { data, error } = await supabase.rpc('get_org_followup_adherence')

  if (error) {
    throw new Error(`Failed to load adherence summary: ${error.message}`)
  }

  const counts: AdherenceCounts = { followed: 0, partially_followed: 0, not_followed: 0 }
  for (const row of data ?? []) {
    if (FOLLOWED_STATUS_SET.has(row.followed_status)) {
      counts[row.followed_status as FollowedStatus] = Number(row.total) || 0
    }
  }
  return counts
}

/**
 * The latest petiole test (canonical `parameters` blob) for each farm the
 * caller can access, via the get_org_latest_petiole RPC. The client buckets
 * each value against the bloom-stage ranges.
 */
export async function getOrgLatestPetiole(
  client?: DashboardClient
): Promise<FarmPetioleSnapshot[]> {
  const supabase = await resolveClient(client)
  const { data, error } = await supabase.rpc('get_org_latest_petiole')

  if (error) {
    throw new Error(`Failed to load petiole snapshot: ${error.message}`)
  }

  return (data ?? []).map((row) => ({
    farmId: row.farm_id,
    // Carry the sample date through so the dashboard can flag gone-quiet farms.
    sampleDate: row.sample_date ?? null,
    parameters: (row.parameters as Record<string, number | string | null> | null) ?? null
  }))
}
