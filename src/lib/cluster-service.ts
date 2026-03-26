// ============================================================================
// CLUSTER SERVICE
//
// Provides farm clustering intelligence based on petiole test triage results
// ============================================================================

import { getTypedSupabaseClient } from './supabase'

export interface FarmCluster {
  region: string
  soil_type: string
  classification: 'yellow' | 'red'
  farm_count: number
  affected_farm_ids: number[]
  primary_deficiency: string
  farms: Array<{
    id: number
    name: string
    farmer_name: string
    nutrient_n?: number
    nutrient_p?: number
    nutrient_k?: number
    latest_petiole_date?: string
  }>
}

export class ClusterService {
  // Get farm clusters for an organization
  static async getClusters(
    organizationId: string,
    options?: {
      days?: number
      minFarms?: number
    }
  ): Promise<FarmCluster[]> {
    const supabase = await getTypedSupabaseClient()

    const { data, error } = await supabase.rpc('get_farm_clusters', {
      p_org_id: organizationId,
      p_days_ago: options?.days || 30
    })

    if (error) throw error

    if (!data || data.length === 0) return []

    // Fetch farm details for each cluster
    const clusters: FarmCluster[] = []

    for (const cluster of data) {
      // Filter by minimum farm count if specified
      if (options?.minFarms && cluster.farm_count < options.minFarms) {
        continue
      }

      // Get farm details
      const { data: farms } = await supabase
        .from('farms')
        .select(
          `
          id,
          name,
          profiles:user_id (full_name),
          petiole_test_records!inner (
            date,
            parameters
          )
        `
        )
        .in('id', cluster.affected_farm_ids)
        .order('petiole_test_records.date', { ascending: false })

      const farmDetails = (farms || []).map((farm) => {
        const latestTest = farm.petiole_test_records?.[0]
        const params = (latestTest?.parameters || {}) as Record<string, number>

        return {
          id: farm.id,
          name: farm.name,
          farmer_name: (farm.profiles as { full_name?: string })?.full_name || 'Unknown',
          nutrient_n: params.N,
          nutrient_p: params.P,
          nutrient_k: params.K,
          latest_petiole_date: latestTest?.date
        }
      })

      clusters.push({
        region: cluster.region || 'Unknown',
        soil_type: cluster.soil_type || 'Unknown',
        classification: cluster.classification === 'red' ? 'red' : 'yellow',
        farm_count: cluster.farm_count,
        affected_farm_ids: cluster.affected_farm_ids,
        primary_deficiency: cluster.primary_deficiency,
        farms: farmDetails
      })
    }

    return clusters
  }

  // Get cluster statistics
  static async getClusterStats(organizationId: string): Promise<{
    totalClusters: number
    totalAffectedFarms: number
    byDeficiency: Record<string, number>
    byRegion: Record<string, number>
  }> {
    const clusters = await this.getClusters(organizationId)

    const byDeficiency: Record<string, number> = {}
    const byRegion: Record<string, number> = {}

    let totalFarms = 0

    clusters.forEach((cluster) => {
      // Count unique farms across clusters (farm may be in multiple clusters)
      totalFarms += cluster.farm_count

      byDeficiency[cluster.primary_deficiency] = (byDeficiency[cluster.primary_deficiency] || 0) + 1
      byRegion[cluster.region] = (byRegion[cluster.region] || 0) + 1
    })

    return {
      totalClusters: clusters.length,
      totalAffectedFarms: totalFarms,
      byDeficiency,
      byRegion
    }
  }

  // Find similar farms based on soil profile
  static async findSimilarFarms(
    sourceFarmId: number,
    organizationId: string,
    options?: {
      sameSoilType?: boolean
      sameRegion?: boolean
      maxResults?: number
    }
  ): Promise<
    Array<{
      id: number
      name: string
      farmer_name: string
      region: string
      soil_texture_class: string
      area: number | null
    }>
  > {
    const supabase = await getTypedSupabaseClient()

    // Get source farm details
    const { data: sourceFarm } = await supabase
      .from('farms')
      .select('soil_texture_class, region')
      .eq('id', sourceFarmId)
      .single()

    if (!sourceFarm) throw new Error('Source farm not found')

    // Build query for similar farms
    let query = supabase
      .from('farms')
      .select(
        `
        id,
        name,
        region,
        soil_texture_class,
        area,
        profiles:user_id (full_name),
        organization_clients!inner (
          organization_id
        )
      `
      )
      .eq('organization_clients.organization_id', organizationId)
      .neq('id', sourceFarmId)
      .limit(options?.maxResults || 20)

    if (options?.sameSoilType && sourceFarm.soil_texture_class) {
      query = query.eq('soil_texture_class', sourceFarm.soil_texture_class)
    }

    if (options?.sameRegion && sourceFarm.region) {
      query = query.eq('region', sourceFarm.region)
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []).map((farm) => ({
      id: farm.id,
      name: farm.name,
      farmer_name: (farm.profiles as { full_name?: string })?.full_name || 'Unknown',
      region: farm.region || 'Unknown',
      soil_texture_class: farm.soil_texture_class || 'Unknown',
      area: farm.area
    }))
  }
}
