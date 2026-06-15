import { type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { getTypedSupabaseClient } from './supabase'
import { type ConsultantAccess } from './consultant-access'
import { getTriageItems, type TriageItem } from './consultant-triage-service'

export type FollowedStatus = 'followed' | 'partially_followed' | 'not_followed'

export const FOLLOWED_STATUSES: FollowedStatus[] = [
  'followed',
  'partially_followed',
  'not_followed'
]

export const followedStatusLabels: Record<FollowedStatus, string> = {
  followed: 'Followed',
  partially_followed: 'Partially followed',
  not_followed: 'Not followed'
}

/** A prior recommendation the agronomist can verify during a visit. */
export interface VisitableRecommendation {
  triageId: string
  farmId: number
  farmName: string | null
  recommendation: string
  classification: string | null
  severity: TriageItem['severity']
  createdAt: string | null
}

export interface VisitFollowup {
  id: string
  triageId: string
  followedStatus: FollowedStatus
  note: string | null
  /** Recommendation text resolved from the linked triage row, for display. */
  recommendation: string | null
  classification: string | null
}

export interface Visit {
  id: string
  organizationId: string
  clientUserId: string
  farmId: number | null
  farmName: string | null
  visitedBy: string | null
  visitedByName: string | null
  visitDate: string
  summary: string | null
  createdAt: string | null
  followups: VisitFollowup[]
}

export interface CreateVisitFollowupInput {
  triageId: string
  followedStatus: FollowedStatus
  note?: string | null
}

export interface CreateVisitInput {
  farmerId: string
  farmId?: number | null
  visitDate: string // YYYY-MM-DD
  summary?: string | null
  followups: CreateVisitFollowupInput[]
}

type VisitClient = SupabaseClient<Database>
type VisitRow = Database['public']['Tables']['consultant_visits']['Row']

async function resolveClient(client?: VisitClient): Promise<VisitClient> {
  return client ?? (await getTypedSupabaseClient())
}

/**
 * Turn raw consultant_visits rows into hydrated Visit objects: load their
 * follow-ups and resolve farm/visitor/recommendation display labels in batch.
 * Access is enforced by the caller (RLS on the rows already fetched), so this
 * never re-filters by org — it works for any set of rows handed to it.
 */
async function hydrateVisits(supabase: VisitClient, visits: VisitRow[]): Promise<Visit[]> {
  if (visits.length === 0) {
    return []
  }

  const visitIds = visits.map((v) => v.id)
  const farmIds = Array.from(
    new Set(visits.map((v) => v.farm_id).filter((id): id is number => id != null))
  )
  const visitorIds = Array.from(
    new Set(visits.map((v) => v.visited_by).filter((id): id is string => id != null))
  )

  const { data: followupRows, error: followupError } = await supabase
    .from('visit_recommendation_followups')
    .select('*')
    .in('visit_id', visitIds)

  if (followupError) {
    throw new Error(`Failed to load visit follow-ups: ${followupError.message}`)
  }

  const followups = followupRows ?? []
  const triageIds = Array.from(new Set(followups.map((f) => f.triage_id)))

  // Resolve display labels in batch: farm names, visitor names, recommendation text.
  const farmNames = new Map<number, string | null>()
  if (farmIds.length > 0) {
    const { data: farms, error: farmsError } = await supabase
      .from('farms')
      .select('id, name')
      .in('id', farmIds)
    if (farmsError) {
      throw new Error(`Failed to load farm names: ${farmsError.message}`)
    }
    for (const f of farms ?? []) farmNames.set(f.id, f.name)
  }

  const visitorNames = new Map<string, string | null>()
  if (visitorIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', visitorIds)
    if (profilesError) {
      throw new Error(`Failed to load visitor names: ${profilesError.message}`)
    }
    for (const p of profiles ?? []) visitorNames.set(p.id, p.full_name)
  }

  const triageById = new Map<
    string,
    { recommendation: string | null; classification: string | null }
  >()
  if (triageIds.length > 0) {
    const { data: triage, error: triageError } = await supabase
      .from('petiole_triage')
      .select('id, recommendation, classification')
      .in('id', triageIds)
    if (triageError) {
      throw new Error(`Failed to load recommendation details: ${triageError.message}`)
    }
    for (const t of triage ?? []) {
      triageById.set(t.id, { recommendation: t.recommendation, classification: t.classification })
    }
  }

  const followupsByVisit = new Map<string, VisitFollowup[]>()
  for (const f of followups) {
    const triage = triageById.get(f.triage_id)
    const entry: VisitFollowup = {
      id: f.id,
      triageId: f.triage_id,
      followedStatus: f.followed_status,
      note: f.note,
      recommendation: triage?.recommendation ?? null,
      classification: triage?.classification ?? null
    }
    const list = followupsByVisit.get(f.visit_id) ?? []
    list.push(entry)
    followupsByVisit.set(f.visit_id, list)
  }

  return visits.map((v) => ({
    id: v.id,
    organizationId: v.organization_id,
    clientUserId: v.client_user_id,
    farmId: v.farm_id,
    farmName: v.farm_id != null ? (farmNames.get(v.farm_id) ?? null) : null,
    visitedBy: v.visited_by,
    visitedByName: v.visited_by != null ? (visitorNames.get(v.visited_by) ?? null) : null,
    visitDate: v.visit_date,
    summary: v.summary,
    createdAt: v.created_at,
    followups: followupsByVisit.get(v.id) ?? []
  }))
}

/**
 * Recommendations available to verify on a visit: triage items for this farmer
 * that carry a consultant recommendation. Newest first.
 */
export async function getVisitableRecommendations(
  access: ConsultantAccess,
  farmerId: string,
  client?: VisitClient
): Promise<VisitableRecommendation[]> {
  const supabase = await resolveClient(client)

  const items = await getTriageItems(access, { farmerId }, supabase)

  return items
    .filter((item) => item.recommendation && item.recommendation.trim().length > 0)
    .map((item) => ({
      triageId: item.id,
      farmId: item.farmId,
      farmName: item.farmName,
      recommendation: item.recommendation as string,
      classification: item.classification,
      severity: item.severity,
      createdAt: item.createdAt
    }))
}

/**
 * Visits recorded for a farmer, newest first, each with its per-recommendation
 * follow-up outcomes and the visiting member's name.
 */
export async function getVisitsForFarmer(
  access: ConsultantAccess,
  farmerId: string,
  client?: VisitClient
): Promise<Visit[]> {
  const supabase = await resolveClient(client)

  const { data: visitRows, error } = await supabase
    .from('consultant_visits')
    .select('*')
    .eq('organization_id', access.organizationId)
    .eq('client_user_id', farmerId)
    .order('visit_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load visits: ${error.message}`)
  }

  return hydrateVisits(supabase, visitRows ?? [])
}

/**
 * Record a visit and its per-recommendation follow-ups in a single transaction
 * via the create_visit_with_followups RPC. The RPC derives the org from the
 * farmer's active client row, enforces can_access_org_client (so an unassigned
 * agronomist is rejected server-side), stamps visited_by = auth.uid(), and rolls
 * the whole thing back if any follow-up fails — no orphaned empty visit.
 */
export async function createVisit(
  _access: ConsultantAccess,
  input: CreateVisitInput,
  client?: VisitClient
): Promise<Visit> {
  const supabase = await resolveClient(client)

  const { data: visit, error } = await supabase.rpc('create_visit_with_followups', {
    p_farmer_id: input.farmerId,
    p_farm_id: input.farmId ?? null,
    p_visit_date: input.visitDate,
    p_summary: input.summary?.trim() ? input.summary.trim() : null,
    p_followups: input.followups.map((f) => ({
      triage_id: f.triageId,
      followed_status: f.followedStatus,
      note: f.note?.trim() ? f.note.trim() : null
    }))
  })

  if (error || !visit) {
    throw new Error(`Failed to record visit: ${error?.message ?? 'unknown error'}`)
  }

  // Reload by the visit's own id rather than re-filtering by access.organizationId:
  // the RPC derives the org from the farmer's active client row, which need not
  // equal the caller's access org. The write already succeeded and RLS still
  // gates this read, so a successful record can never surface as a failure.
  const { data: row, error: reloadError } = await supabase
    .from('consultant_visits')
    .select('*')
    .eq('id', visit.id)
    .single()
  if (reloadError || !row) {
    throw new Error('Visit was recorded but could not be reloaded')
  }
  const [created] = await hydrateVisits(supabase, [row])
  return created
}
