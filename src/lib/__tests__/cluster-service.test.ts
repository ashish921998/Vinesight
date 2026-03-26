import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ClusterService } from '../cluster-service'
import { getTypedSupabaseClient } from '../supabase'

vi.mock('../supabase', () => ({
  getTypedSupabaseClient: vi.fn()
}))

describe('ClusterService', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = {
      rpc: vi.fn(),
      auth: { getUser: vi.fn() },
      from: vi.fn()
    }

    vi.mocked(getTypedSupabaseClient).mockResolvedValue(mockSupabase)
  })

  describe('getClusters', () => {
    it('calls RPC with correct params', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null })

      // Mock from().select()... for farm details fetch (won't be called with empty data)
      await ClusterService.getClusters('org-123')

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_farm_clusters', {
        p_org_id: 'org-123',
        p_days_ago: 30
      })
    })

    it('returns empty array when no clusters', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null })

      const result = await ClusterService.getClusters('org-123')
      expect(result).toEqual([])
    })

    it('throws on RPC error', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: new Error('RPC failed') })

      await expect(ClusterService.getClusters('org-123')).rejects.toThrow('RPC failed')
    })

    it('respects custom days option', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null })

      await ClusterService.getClusters('org-123', { days: 60 })

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_farm_clusters', {
        p_org_id: 'org-123',
        p_days_ago: 60
      })
    })
  })

  describe('getClusterStats', () => {
    it('aggregates cluster statistics', async () => {
      // getClusters returns FarmCluster[] after processing RPC data
      // We mock at the RPC level and the from() level
      const rpcData = [
        {
          region: 'Nashik',
          soil_type: 'loamy',
          classification: 'yellow',
          farm_count: 5,
          affected_farm_ids: [1, 2, 3, 4, 5],
          primary_deficiency: 'Nitrogen'
        },
        {
          region: 'Pune',
          soil_type: 'clay',
          classification: 'red',
          farm_count: 3,
          affected_farm_ids: [6, 7, 8],
          primary_deficiency: 'Potassium'
        }
      ]

      mockSupabase.rpc.mockResolvedValue({ data: rpcData, error: null })

      // Mock farm details fetch for each cluster
      const farmChain: any = {
        select: vi.fn(() => farmChain),
        in: vi.fn(() => farmChain),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      }
      mockSupabase.from.mockReturnValue(farmChain)

      const stats = await ClusterService.getClusterStats('org-123')

      expect(stats.totalClusters).toBe(2)
      expect(stats.totalAffectedFarms).toBe(8)
      expect(stats.byDeficiency.Nitrogen).toBe(1)
      expect(stats.byDeficiency.Potassium).toBe(1)
      expect(stats.byRegion.Nashik).toBe(1)
      expect(stats.byRegion.Pune).toBe(1)
    })

    it('handles empty clusters', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null })

      const stats = await ClusterService.getClusterStats('org-123')

      expect(stats.totalClusters).toBe(0)
      expect(stats.totalAffectedFarms).toBe(0)
    })
  })

  describe('findSimilarFarms', () => {
    it('finds farms with matching characteristics', async () => {
      // Mock source farm fetch
      const sourceFarmChain: any = {
        select: vi.fn(() => sourceFarmChain),
        eq: vi.fn(() => sourceFarmChain),
        single: vi.fn().mockResolvedValue({
          data: { soil_texture_class: 'loamy', region: 'Nashik' },
          error: null
        })
      }

      // Mock similar farms query — chain must support .eq() after .limit()
      const similarResult = {
        data: [
          {
            id: 2,
            name: 'Farm B',
            region: 'Nashik',
            soil_texture_class: 'loamy',
            area: 10,
            profiles: { full_name: 'Farmer B' },
            organization_clients: [{ organization_id: 'org-123' }]
          }
        ],
        error: null
      }
      const similarChain: any = {
        select: vi.fn(() => similarChain),
        eq: vi.fn(() => similarChain),
        neq: vi.fn(() => similarChain),
        limit: vi.fn(() => similarChain),
        then: (resolve: any) => resolve(similarResult)
      }

      mockSupabase.from
        .mockReturnValueOnce(sourceFarmChain) // source farm
        .mockReturnValueOnce(similarChain) // similar farms query

      const result = await ClusterService.findSimilarFarms(1, 'org-123', {
        sameSoilType: true,
        sameRegion: true
      })

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Farm B')
    })

    it('throws when source farm not found', async () => {
      const chain: any = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        single: vi.fn().mockResolvedValue({ data: null, error: null })
      }
      mockSupabase.from.mockReturnValue(chain)

      await expect(ClusterService.findSimilarFarms(999, 'org-123')).rejects.toThrow(
        'Source farm not found'
      )
    })
  })
})
