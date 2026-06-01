import { getTypedSupabaseClient } from './supabase'
import { getConsultantAccess, type ConsultantAccess } from './consultant-access'

export interface FarmerProfile {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
}

export interface FarmerFarm {
  id: number
  name: string
  region: string | null
  crop_variety: string | null
  soil_texture_class: string | null
  area: number | null
}

export interface FarmerWithFarms extends FarmerProfile {
  farms: FarmerFarm[]
  assigned_to: string | null
}

export interface FarmDetail {
  id: number
  name: string
  region: string | null
  crop_variety: string | null
  area: number | null
  date_of_pruning: string | null
  bulk_density: number | null
  cation_exchange_capacity: number | null
  soil_water_retention: number | null
  soil_texture_class: string | null
  sand_percentage: number | null
  silt_percentage: number | null
  clay_percentage: number | null
  user_id: string | null
}

/**
 * Query active organization clients as the canonical source of truth.
 * Owner/admin: all active org clients.
 * Agronomist: only rows where assigned_to = user.id.
 * Never trusts profiles.consultant_organization_id for directory reads.
 */
export async function getFarmerClients(access: ConsultantAccess): Promise<FarmerWithFarms[]> {
  const supabase = await getTypedSupabaseClient()

  let query = supabase
    .from('organization_clients')
    .select('client_user_id, assigned_to')
    .eq('organization_id', access.organizationId)
    .eq('status', 'active')

  if (!access.canViewAllFarmers) {
    query = query.eq('assigned_to', access.userId)
  }

  const { data: clients, error } = await query

  if (error) {
    throw new Error(`Failed to load organization clients: ${error.message}`)
  }

  if (!clients || clients.length === 0) {
    return []
  }

  const clientUserIds = clients.map((c) => c.client_user_id)

  // Fetch profile fields from profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone')
    .in('id', clientUserIds)

  if (profilesError) {
    throw new Error(`Failed to load farmer profiles: ${profilesError.message}`)
  }

  const profilesById = new Map((profiles ?? []).map((p) => [p.id, p as FarmerProfile]))

  // Fetch farms by farms.user_id IN farmerIds
  const { data: farms, error: farmsError } = await supabase
    .from('farms')
    .select('id, name, region, crop_variety, soil_texture_class, area, user_id')
    .in('user_id', clientUserIds)

  if (farmsError) {
    throw new Error(`Failed to load farms: ${farmsError.message}`)
  }

  const farmsByUser: Record<string, FarmerFarm[]> = {}
  for (const farm of farms ?? []) {
    const uid = farm.user_id as string
    if (!farmsByUser[uid]) farmsByUser[uid] = []
    farmsByUser[uid].push({
      id: farm.id,
      name: farm.name,
      region: farm.region,
      crop_variety: farm.crop_variety,
      soil_texture_class: farm.soil_texture_class,
      area: farm.area
    })
  }

  return clients.map((client) => {
    const profile = profilesById.get(client.client_user_id)
    return {
      id: client.client_user_id,
      full_name: profile?.full_name ?? null,
      email: profile?.email ?? null,
      phone: profile?.phone ?? null,
      farms: farmsByUser[client.client_user_id] || [],
      assigned_to: client.assigned_to
    }
  })
}

/**
 * Validate a single farmer is an active client of the current organization.
 * For agronomists, also validate assignment.
 */
export async function validateFarmerClient(
  access: ConsultantAccess,
  farmerId: string
): Promise<{ isValid: boolean; assigned_to: string | null }> {
  const supabase = await getTypedSupabaseClient()

  let query = supabase
    .from('organization_clients')
    .select('assigned_to')
    .eq('organization_id', access.organizationId)
    .eq('client_user_id', farmerId)
    .eq('status', 'active')
    .maybeSingle()

  const { data: client, error } = await query

  if (error) {
    throw new Error(`Failed to validate farmer: ${error.message}`)
  }

  if (!client) {
    return { isValid: false, assigned_to: null }
  }

  if (!access.canViewAllFarmers && client.assigned_to !== access.userId) {
    return { isValid: false, assigned_to: client.assigned_to }
  }

  return { isValid: true, assigned_to: client.assigned_to }
}

/**
 * Fetch a farmer's profile fields.
 */
export async function getFarmerProfile(farmerId: string): Promise<FarmerProfile | null> {
  const supabase = await getTypedSupabaseClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone')
    .eq('id', farmerId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load farmer profile: ${error.message}`)
  }

  return data
}

/**
 * Fetch farms belonging to a specific farmer.
 */
export async function getFarmerFarms(farmerId: string): Promise<FarmerFarm[]> {
  const supabase = await getTypedSupabaseClient()
  const { data, error } = await supabase
    .from('farms')
    .select('id, name, region, crop_variety, soil_texture_class, area')
    .eq('user_id', farmerId)

  if (error) {
    throw new Error(`Failed to load farms: ${error.message}`)
  }

  return (data ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    region: f.region,
    crop_variety: f.crop_variety,
    soil_texture_class: f.soil_texture_class,
    area: f.area
  }))
}

/**
 * Fetch detailed farm data with all soil fields.
 */
export async function getFarmDetail(farmId: number): Promise<FarmDetail | null> {
  const supabase = await getTypedSupabaseClient()
  const { data, error } = await supabase
    .from('farms')
    .select(
      'id, name, region, crop_variety, area, date_of_pruning, bulk_density, cation_exchange_capacity, soil_water_retention, soil_texture_class, sand_percentage, silt_percentage, clay_percentage, user_id'
    )
    .eq('id', farmId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load farm detail: ${error.message}`)
  }

  if (!data) return null

  return {
    id: data.id,
    name: data.name,
    region: data.region,
    crop_variety: data.crop_variety,
    area: data.area,
    date_of_pruning: data.date_of_pruning,
    bulk_density: data.bulk_density,
    cation_exchange_capacity: data.cation_exchange_capacity,
    soil_water_retention: data.soil_water_retention,
    soil_texture_class: data.soil_texture_class,
    sand_percentage: data.sand_percentage,
    silt_percentage: data.silt_percentage,
    clay_percentage: data.clay_percentage,
    user_id: data.user_id
  }
}
