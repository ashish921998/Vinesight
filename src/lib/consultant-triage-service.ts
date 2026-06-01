import { type SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/database'
import { getTypedSupabaseClient } from './supabase'
import { type ConsultantAccess } from './consultant-access'

export type TriageStatus = 'pending' | 'in_review' | 'reviewed' | 'escalated' | 'resolved'
export type TriageSeverity = 'low' | 'medium' | 'high' | 'critical'

export const TRIAGE_STATUSES: TriageStatus[] = [
  'pending',
  'in_review',
  'reviewed',
  'escalated',
  'resolved'
]
export const TRIAGE_SEVERITIES: TriageSeverity[] = ['low', 'medium', 'high', 'critical']

/** A triage row enriched with farmer/farm display fields for the review queue. */
export interface TriageItem {
  id: string
  organizationId: string
  farmId: number
  petioleTestId: number | null
  clientUserId: string
  status: TriageStatus
  severity: TriageSeverity | null
  classification: string | null
  summary: string | null
  recommendation: string | null
  reviewNotes: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string | null
  updatedAt: string | null
  // Enriched (display-only) fields
  farmerName: string | null
  farmName: string | null
  testDate: string | null
}

export interface TriagePetioleTest {
  id: number
  date: string | null
  dateOfPruning: string | null
  parameters: Json | null
  recommendations: string | null
  notes: string | null
}

export interface TriageDetail extends TriageItem {
  petioleTest: TriagePetioleTest | null
}

export interface TriageFilters {
  status?: TriageStatus
  severity?: TriageSeverity
  farmerId?: string
  farmId?: number
  /** Free-text match against farmer or farm name (applied in-memory). */
  search?: string
}

/** Consultant-only review fields. Farmer-facing fields are intentionally excluded. */
export interface TriageReviewPayload {
  status?: TriageStatus
  severity?: TriageSeverity | null
  classification?: string | null
  summary?: string | null
  recommendation?: string | null
  reviewNotes?: string | null
}

type TriageClient = SupabaseClient<Database>
type TriageRow = Database['public']['Tables']['petiole_triage']['Row']

async function resolveClient(client?: TriageClient): Promise<TriageClient> {
  return client ?? (await getTypedSupabaseClient())
}

/**
 * Resolve the set of farmer (client_user_id) values the consultant may act on.
 * Owner/admin: all active clients in the org.
 * Agronomist: only active clients where assigned_to = access.userId.
 * Always sourced from organization_clients — never profiles.consultant_organization_id.
 */
async function getVisibleClientIds(
  access: ConsultantAccess,
  supabase: TriageClient
): Promise<string[]> {
  let query = supabase
    .from('organization_clients')
    .select('client_user_id, assigned_to')
    .eq('organization_id', access.organizationId)
    .eq('status', 'active')

  if (!access.canViewAllFarmers) {
    query = query.eq('assigned_to', access.userId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to load organization clients: ${error.message}`)
  }

  return (data ?? []).map((row) => row.client_user_id)
}

/**
 * Confirm the consultant may act on a specific farmer (active client of the org,
 * and — for agronomists — assigned to them). Returns false when not permitted.
 */
async function canAccessClient(
  access: ConsultantAccess,
  clientUserId: string,
  supabase: TriageClient
): Promise<boolean> {
  const { data, error } = await supabase
    .from('organization_clients')
    .select('assigned_to')
    .eq('organization_id', access.organizationId)
    .eq('client_user_id', clientUserId)
    .eq('status', 'active')
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to validate triage access: ${error.message}`)
  }

  if (!data) {
    return false
  }

  if (!access.canViewAllFarmers && data.assigned_to !== access.userId) {
    return false
  }

  return true
}

function toTriageItem(
  row: TriageRow,
  farmerName: string | null,
  farmName: string | null,
  testDate: string | null
): TriageItem {
  return {
    id: row.id,
    organizationId: row.organization_id,
    farmId: row.farm_id,
    petioleTestId: row.petiole_test_id,
    clientUserId: row.client_user_id,
    status: row.status,
    severity: row.severity,
    classification: row.classification,
    summary: row.summary,
    recommendation: row.recommendation,
    reviewNotes: row.review_notes,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    farmerName,
    farmName,
    testDate
  }
}

/**
 * List triage items the consultant is allowed to see, newest first.
 * Visibility is enforced here (in addition to RLS) so the UI gets clear,
 * scoped results: owner/admin see all active org clients; agronomists see
 * only their assigned clients.
 */
export async function getTriageItems(
  access: ConsultantAccess,
  filters: TriageFilters = {},
  client?: TriageClient
): Promise<TriageItem[]> {
  const supabase = await resolveClient(client)

  const visibleClientIds = await getVisibleClientIds(access, supabase)
  if (visibleClientIds.length === 0) {
    return []
  }

  // Honor an explicit farmerId filter without widening visibility.
  const targetClientIds = filters.farmerId
    ? visibleClientIds.filter((id) => id === filters.farmerId)
    : visibleClientIds
  if (targetClientIds.length === 0) {
    return []
  }

  let query = supabase
    .from('petiole_triage')
    .select('*')
    .eq('organization_id', access.organizationId)
    .in('client_user_id', targetClientIds)

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.severity) query = query.eq('severity', filters.severity)
  if (typeof filters.farmId === 'number') query = query.eq('farm_id', filters.farmId)

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load triage items: ${error.message}`)
  }

  const rows = (data ?? []) as TriageRow[]
  if (rows.length === 0) {
    return []
  }

  const { farmerNames, farmNames, testDates } = await loadDisplayMaps(rows, supabase)

  let items = rows.map((row) =>
    toTriageItem(
      row,
      farmerNames.get(row.client_user_id) ?? null,
      farmNames.get(row.farm_id) ?? null,
      row.petiole_test_id != null ? (testDates.get(row.petiole_test_id) ?? null) : null
    )
  )

  if (filters.search) {
    const q = filters.search.toLowerCase()
    items = items.filter(
      (item) =>
        item.farmerName?.toLowerCase().includes(q) || item.farmName?.toLowerCase().includes(q)
    )
  }

  return items
}

/**
 * Fetch a single triage item (with its linked petiole test values), scoped to
 * what the consultant may access. Returns null when the item does not exist or
 * is outside the consultant's visibility.
 */
export async function getTriageItem(
  access: ConsultantAccess,
  triageId: string,
  client?: TriageClient
): Promise<TriageDetail | null> {
  const supabase = await resolveClient(client)

  const { data, error } = await supabase
    .from('petiole_triage')
    .select('*')
    .eq('id', triageId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load triage item: ${error.message}`)
  }

  const row = data as TriageRow | null
  if (!row) {
    return null
  }

  if (row.organization_id !== access.organizationId) {
    return null
  }

  const allowed = await canAccessClient(access, row.client_user_id, supabase)
  if (!allowed) {
    return null
  }

  const { farmerNames, farmNames, testDates } = await loadDisplayMaps([row], supabase)

  const item = toTriageItem(
    row,
    farmerNames.get(row.client_user_id) ?? null,
    farmNames.get(row.farm_id) ?? null,
    row.petiole_test_id != null ? (testDates.get(row.petiole_test_id) ?? null) : null
  )

  let petioleTest: TriagePetioleTest | null = null
  if (row.petiole_test_id != null) {
    const { data: test, error: testError } = await supabase
      .from('petiole_test_records')
      .select('id, date, date_of_pruning, parameters, recommendations, notes')
      .eq('id', row.petiole_test_id)
      .maybeSingle()

    if (testError) {
      throw new Error(`Failed to load petiole test: ${testError.message}`)
    }

    if (test) {
      petioleTest = {
        id: test.id,
        date: test.date,
        dateOfPruning: test.date_of_pruning,
        parameters: test.parameters,
        recommendations: test.recommendations,
        notes: test.notes
      }
    }
  }

  return { ...item, petioleTest }
}

/**
 * Update consultant review fields on a triage item after confirming the
 * consultant may act on the underlying client. Stamps reviewed_by/reviewed_at.
 * Throws on not-found or forbidden so callers can surface a clear error.
 */
export async function updateTriageReview(
  access: ConsultantAccess,
  triageId: string,
  payload: TriageReviewPayload,
  client?: TriageClient
): Promise<TriageItem> {
  const supabase = await resolveClient(client)

  const { data, error } = await supabase
    .from('petiole_triage')
    .select('id, organization_id, client_user_id')
    .eq('id', triageId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load triage item: ${error.message}`)
  }

  if (!data || data.organization_id !== access.organizationId) {
    throw new Error('Triage item not found')
  }

  const allowed = await canAccessClient(access, data.client_user_id, supabase)
  if (!allowed) {
    throw new Error('Forbidden')
  }

  const update: Database['public']['Tables']['petiole_triage']['Update'] = {
    reviewed_by: access.userId,
    reviewed_at: new Date().toISOString()
  }

  if (payload.status !== undefined) update.status = payload.status
  if (payload.severity !== undefined) update.severity = payload.severity
  if (payload.classification !== undefined) update.classification = payload.classification
  if (payload.summary !== undefined) update.summary = payload.summary
  if (payload.recommendation !== undefined) update.recommendation = payload.recommendation
  if (payload.reviewNotes !== undefined) update.review_notes = payload.reviewNotes

  const { data: updated, error: updateError } = await supabase
    .from('petiole_triage')
    .update(update)
    .eq('id', triageId)
    .eq('organization_id', access.organizationId)
    .select('*')
    .single()

  if (updateError) {
    throw new Error(`Failed to update triage review: ${updateError.message}`)
  }

  const row = updated as TriageRow
  return toTriageItem(row, null, null, null)
}

/** Batch-load farmer names, farm names, and petiole test dates for display. */
async function loadDisplayMaps(
  rows: TriageRow[],
  supabase: TriageClient
): Promise<{
  farmerNames: Map<string, string | null>
  farmNames: Map<number, string | null>
  testDates: Map<number, string | null>
}> {
  const clientIds = Array.from(new Set(rows.map((r) => r.client_user_id)))
  const farmIds = Array.from(new Set(rows.map((r) => r.farm_id)))
  const testIds = Array.from(
    new Set(rows.map((r) => r.petiole_test_id).filter((id): id is number => id != null))
  )

  const farmerNames = new Map<string, string | null>()
  const farmNames = new Map<number, string | null>()
  const testDates = new Map<number, string | null>()

  if (clientIds.length > 0) {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', clientIds)
    if (error) throw new Error(`Failed to load farmer profiles: ${error.message}`)
    for (const p of profiles ?? []) farmerNames.set(p.id, p.full_name)
  }

  if (farmIds.length > 0) {
    const { data: farms, error } = await supabase.from('farms').select('id, name').in('id', farmIds)
    if (error) throw new Error(`Failed to load farms: ${error.message}`)
    for (const f of farms ?? []) farmNames.set(f.id, f.name)
  }

  if (testIds.length > 0) {
    const { data: tests, error } = await supabase
      .from('petiole_test_records')
      .select('id, date')
      .in('id', testIds)
    if (error) throw new Error(`Failed to load petiole tests: ${error.message}`)
    for (const t of tests ?? []) testDates.set(t.id, t.date)
  }

  return { farmerNames, farmNames, testDates }
}
