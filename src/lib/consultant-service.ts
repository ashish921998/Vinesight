/**
 * Consultant Service
 * Handles all consultant-client management operations
 */

import { createClient } from '@/lib/supabase'
import type {
  ConsultantClient,
  ConsultantClientInsert,
  ConsultantClientUpdate,
  ClientFarm,
  ClientFarmInsert,
  ClientFarmUpdate,
  ClientLabReport,
  ClientLabReportInsert,
  ClientLabReportUpdate,
  FertilizerRecommendation,
  FertilizerRecommendationInsert,
  FertilizerRecommendationUpdate,
  FertilizerRecommendationItem,
  FertilizerRecommendationItemInsert,
  ClientSummary
} from '@/types/consultant'

// ============================================================================
// Helper Functions
// ============================================================================

function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    result[snakeKey] = value
  }
  return result
}

function toCamelCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = value
  }
  return result
}

// ============================================================================
// Client Management
// ============================================================================

export async function getClients(): Promise<ConsultantClient[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('consultant_clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map((row) => toCamelCase(row) as ConsultantClient)
}

export async function getClientById(id: number): Promise<ConsultantClient | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('consultant_clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data ? (toCamelCase(data) as ConsultantClient) : null
}

export async function getClientWithDetails(id: number): Promise<ConsultantClient | null> {
  const supabase = createClient()

  // Get client
  const { data: client, error: clientError } = await supabase
    .from('consultant_clients')
    .select('*')
    .eq('id', id)
    .single()

  if (clientError) {
    if (clientError.code === 'PGRST116') return null
    throw new Error(clientError.message)
  }

  if (!client) return null

  // Get farms
  const { data: farms, error: farmsError } = await supabase
    .from('client_farms')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  if (farmsError) throw new Error(`Failed to load client farms: ${farmsError.message}`)

  // Get reports
  const { data: reports, error: reportsError } = await supabase
    .from('client_lab_reports')
    .select('*')
    .eq('client_id', id)
    .order('test_date', { ascending: false })

  if (reportsError) throw new Error(`Failed to load lab reports: ${reportsError.message}`)

  // Get recommendations
  const { data: recommendations, error: recommendationsError } = await supabase
    .from('fertilizer_recommendations')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  if (recommendationsError)
    throw new Error(`Failed to load recommendations: ${recommendationsError.message}`)

  return {
    ...toCamelCase(client),
    farms: (farms || []).map((f) => toCamelCase(f) as ClientFarm),
    labReports: (reports || []).map((r) => toCamelCase(r) as ClientLabReport),
    recommendations: (recommendations || []).map(
      (rec) => toCamelCase(rec) as FertilizerRecommendation
    )
  } as ConsultantClient
}

export async function createConsultantClient(
  data: ConsultantClientInsert
): Promise<ConsultantClient> {
  const supabase = createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user?.user?.id) throw new Error('Not authenticated')

  const insertData = {
    ...toSnakeCase(data),
    consultant_id: user.user.id
  }

  const { data: result, error } = await supabase
    .from('consultant_clients')
    .insert(insertData)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return toCamelCase(result) as ConsultantClient
}

export async function updateClient(
  id: number,
  data: ConsultantClientUpdate
): Promise<ConsultantClient> {
  const supabase = createClient()

  const { data: result, error } = await supabase
    .from('consultant_clients')
    .update(toSnakeCase(data))
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return toCamelCase(result) as ConsultantClient
}

export async function deleteClient(id: number): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('consultant_clients').delete().eq('id', id)

  if (error) throw new Error(error.message)
}

export async function getClientsSummary(): Promise<ClientSummary[]> {
  const supabase = createClient()

  const { data: clients, error } = await supabase
    .from('consultant_clients')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  if (!clients || clients.length === 0) return []

  const summaries: ClientSummary[] = []

  for (const client of clients) {
    // Get counts
    const [
      { count: farmCount, error: farmCountError },
      { count: reportCount, error: reportCountError },
      { count: recommendationCount, error: recommendationCountError }
    ] = await Promise.all([
      supabase
        .from('client_farms')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', client.id),
      supabase
        .from('client_lab_reports')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', client.id),
      supabase
        .from('fertilizer_recommendations')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', client.id)
    ])

    if (farmCountError)
      throw new Error(`Failed to count farms for client ${client.id}: ${farmCountError.message}`)
    if (reportCountError)
      throw new Error(
        `Failed to count reports for client ${client.id}: ${reportCountError.message}`
      )
    if (recommendationCountError)
      throw new Error(
        `Failed to count recommendations for client ${client.id}: ${recommendationCountError.message}`
      )

    summaries.push({
      id: client.id,
      clientName: client.client_name,
      clientEmail: client.client_email,
      clientPhone: client.client_phone,
      status: client.status,
      farmCount: farmCount || 0,
      reportCount: reportCount || 0,
      recommendationCount: recommendationCount || 0,
      lastActivity: client.updated_at
    })
  }

  return summaries
}

// ============================================================================
// Farm Management
// ============================================================================

export async function getClientFarms(clientId: number): Promise<ClientFarm[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('client_farms')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map((row) => toCamelCase(row) as ClientFarm)
}

export async function createClientFarm(data: ClientFarmInsert): Promise<ClientFarm> {
  const supabase = createClient()

  const { data: result, error } = await supabase
    .from('client_farms')
    .insert(toSnakeCase(data))
    .select()
    .single()

  if (error) throw new Error(error.message)
  return toCamelCase(result) as ClientFarm
}

export async function updateClientFarm(id: number, data: ClientFarmUpdate): Promise<ClientFarm> {
  const supabase = createClient()

  const { data: result, error } = await supabase
    .from('client_farms')
    .update(toSnakeCase(data))
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return toCamelCase(result) as ClientFarm
}

export async function deleteClientFarm(id: number): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('client_farms').delete().eq('id', id)

  if (error) throw new Error(error.message)
}

// ============================================================================
// Lab Reports Management
// ============================================================================

export async function getClientLabReports(clientId: number): Promise<ClientLabReport[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('client_lab_reports')
    .select('*')
    .eq('client_id', clientId)
    .order('test_date', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map((row) => toCamelCase(row) as ClientLabReport)
}

export async function getLabReportById(id: number): Promise<ClientLabReport | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('client_lab_reports')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data ? (toCamelCase(data) as ClientLabReport) : null
}

export async function createLabReport(data: ClientLabReportInsert): Promise<ClientLabReport> {
  const supabase = createClient()

  const { data: result, error } = await supabase
    .from('client_lab_reports')
    .insert(toSnakeCase(data))
    .select()
    .single()

  if (error) throw new Error(error.message)
  return toCamelCase(result) as ClientLabReport
}

export async function updateLabReport(
  id: number,
  data: ClientLabReportUpdate
): Promise<ClientLabReport> {
  const supabase = createClient()

  const { data: result, error } = await supabase
    .from('client_lab_reports')
    .update(toSnakeCase(data))
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return toCamelCase(result) as ClientLabReport
}

export async function deleteLabReport(id: number): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('client_lab_reports').delete().eq('id', id)

  if (error) throw new Error(error.message)
}

// ============================================================================
// Fertilizer Recommendations Management
// ============================================================================

export async function getRecommendations(clientId?: number): Promise<FertilizerRecommendation[]> {
  const supabase = createClient()

  let query = supabase
    .from('fertilizer_recommendations')
    .select('*')
    .order('created_at', { ascending: false })

  if (clientId) {
    query = query.eq('client_id', clientId)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)
  return (data || []).map((row) => toCamelCase(row) as FertilizerRecommendation)
}

export async function getRecommendationById(id: number): Promise<FertilizerRecommendation | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('fertilizer_recommendations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data ? (toCamelCase(data) as FertilizerRecommendation) : null
}

export async function getRecommendationWithItems(
  id: number
): Promise<FertilizerRecommendation | null> {
  const supabase = createClient()

  // Get recommendation
  const { data: rec, error: recError } = await supabase
    .from('fertilizer_recommendations')
    .select('*')
    .eq('id', id)
    .single()

  if (recError) {
    if (recError.code === 'PGRST116') return null
    throw new Error(recError.message)
  }

  if (!rec) return null

  // Get items
  const { data: items, error: itemsError } = await supabase
    .from('fertilizer_recommendation_items')
    .select('*')
    .eq('recommendation_id', id)
    .order('sort_order', { ascending: true })

  if (itemsError) throw new Error(`Failed to load recommendation items: ${itemsError.message}`)

  // Get client and farm
  const { data: client, error: clientError } = await supabase
    .from('consultant_clients')
    .select('*')
    .eq('id', rec.client_id)
    .single()

  if (clientError) throw new Error(`Failed to load client: ${clientError.message}`)

  let farm = null
  if (rec.client_farm_id) {
    const { data: farmData, error: farmError } = await supabase
      .from('client_farms')
      .select('*')
      .eq('id', rec.client_farm_id)
      .single()
    if (farmError) throw new Error(`Failed to load client farm: ${farmError.message}`)
    farm = farmData
  }

  return {
    ...toCamelCase(rec),
    items: (items || []).map((i) => toCamelCase(i) as FertilizerRecommendationItem),
    client: client ? (toCamelCase(client) as ConsultantClient) : undefined,
    farm: farm ? (toCamelCase(farm) as ClientFarm) : undefined
  } as FertilizerRecommendation
}

export async function createRecommendation(
  data: FertilizerRecommendationInsert
): Promise<FertilizerRecommendation> {
  const supabase = createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user?.user?.id) throw new Error('Not authenticated')

  const insertData = {
    ...toSnakeCase(data),
    consultant_id: user.user.id
  }

  const { data: result, error } = await supabase
    .from('fertilizer_recommendations')
    .insert(insertData)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return toCamelCase(result) as FertilizerRecommendation
}

export async function updateRecommendation(
  id: number,
  data: FertilizerRecommendationUpdate
): Promise<FertilizerRecommendation> {
  const supabase = createClient()

  const { data: result, error } = await supabase
    .from('fertilizer_recommendations')
    .update(toSnakeCase(data))
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return toCamelCase(result) as FertilizerRecommendation
}

export async function deleteRecommendation(id: number): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('fertilizer_recommendations').delete().eq('id', id)

  if (error) throw new Error(error.message)
}

export async function sendRecommendation(id: number): Promise<FertilizerRecommendation> {
  return updateRecommendation(id, {
    status: 'sent',
    sentAt: new Date().toISOString() as any
  })
}

// ============================================================================
// Recommendation Items Management
// ============================================================================

export async function getRecommendationItems(
  recommendationId: number
): Promise<FertilizerRecommendationItem[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('fertilizer_recommendation_items')
    .select('*')
    .eq('recommendation_id', recommendationId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []).map((row) => toCamelCase(row) as FertilizerRecommendationItem)
}

export async function createRecommendationItem(
  data: FertilizerRecommendationItemInsert
): Promise<FertilizerRecommendationItem> {
  const supabase = createClient()

  const { data: result, error } = await supabase
    .from('fertilizer_recommendation_items')
    .insert(toSnakeCase(data))
    .select()
    .single()

  if (error) throw new Error(error.message)
  return toCamelCase(result) as FertilizerRecommendationItem
}

export async function updateRecommendationItem(
  id: number,
  data: Partial<FertilizerRecommendationItemInsert>
): Promise<FertilizerRecommendationItem> {
  const supabase = createClient()

  const { data: result, error } = await supabase
    .from('fertilizer_recommendation_items')
    .update(toSnakeCase(data))
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return toCamelCase(result) as FertilizerRecommendationItem
}

export async function deleteRecommendationItem(id: number): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('fertilizer_recommendation_items').delete().eq('id', id)

  if (error) throw new Error(error.message)
}

export async function bulkCreateRecommendationItems(
  recommendationId: number,
  items: Omit<FertilizerRecommendationItemInsert, 'recommendationId'>[]
): Promise<FertilizerRecommendationItem[]> {
  const supabase = createClient()

  const itemsWithRecommendationId = items.map((item) => ({
    ...toSnakeCase(item),
    recommendation_id: recommendationId
  }))

  const { data: results, error } = await supabase
    .from('fertilizer_recommendation_items')
    .insert(itemsWithRecommendationId)
    .select()

  if (error) throw new Error(error.message)
  return (results || []).map((row) => toCamelCase(row) as FertilizerRecommendationItem)
}

export async function reorderRecommendationItems(
  items: { id: number; sortOrder: number }[]
): Promise<void> {
  const supabase = createClient()

  for (const item of items) {
    const { error } = await supabase
      .from('fertilizer_recommendation_items')
      .update({ sort_order: item.sortOrder })
      .eq('id', item.id)

    if (error) throw new Error(error.message)
  }
}

// ============================================================================
// Export all functions as a service object
// ============================================================================

export const ConsultantService = {
  // Clients
  getClients,
  getClientById,
  getClientWithDetails,
  createConsultantClient,
  updateClient,
  deleteClient,
  getClientsSummary,

  // Farms
  getClientFarms,
  createClientFarm,
  updateClientFarm,
  deleteClientFarm,

  // Lab Reports
  getClientLabReports,
  getLabReportById,
  createLabReport,
  updateLabReport,
  deleteLabReport,

  // Recommendations
  getRecommendations,
  getRecommendationById,
  getRecommendationWithItems,
  createRecommendation,
  updateRecommendation,
  deleteRecommendation,
  sendRecommendation,

  // Recommendation Items
  getRecommendationItems,
  createRecommendationItem,
  updateRecommendationItem,
  deleteRecommendationItem,
  bulkCreateRecommendationItems,
  reorderRecommendationItems
}

export default ConsultantService
