import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TriageService } from '../triage-service'
import { getTypedSupabaseClient } from '../supabase'

vi.mock('../supabase', () => ({
  getTypedSupabaseClient: vi.fn()
}))

describe('TriageService', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } })
      },
      rpc: vi.fn(),
      from: vi.fn()
    }

    const chainable = () => {
      const chain: any = {
        select: vi.fn(() => chain),
        insert: vi.fn(() => chain),
        update: vi.fn(() => chain),
        upsert: vi.fn(() => chain),
        delete: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        in: vi.fn(() => chain),
        is: vi.fn(() => chain),
        gt: vi.fn(() => chain),
        order: vi.fn(() => chain),
        limit: vi.fn(() => chain),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
      }
      // Make chain itself resolvable (for queries that end with eq/gt/etc.)
      chain.then = (resolve: any) => resolve({ data: [], error: null })
      return chain
    }

    mockSupabase.from.mockImplementation(() => chainable())
    vi.mocked(getTypedSupabaseClient).mockResolvedValue(mockSupabase)
  })

  describe('getTriageQueue', () => {
    it('calls RPC with correct params', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null })

      await TriageService.getTriageQueue('org-123', { classification: 'red' })

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_triage_queue', {
        p_org_id: 'org-123',
        p_classification: 'red',
        p_limit: 50,
        p_offset: 0
      })
    })

    it('returns empty array when no data', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null })

      const result = await TriageService.getTriageQueue('org-123')
      expect(result).toEqual([])
    })

    it('throws on RPC error', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: new Error('RPC failed') })

      await expect(TriageService.getTriageQueue('org-123')).rejects.toThrow('RPC failed')
    })
  })

  describe('getTriageStats', () => {
    it('returns correct stats breakdown', async () => {
      const mockData = [
        { classification: 'green', reviewed_by: 'user-1' },
        { classification: 'yellow', reviewed_by: null },
        { classification: 'red', reviewed_by: null },
        { classification: 'green', reviewed_by: null }
      ]

      const chain: any = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        gt: vi.fn().mockResolvedValue({ data: mockData, error: null })
      }
      mockSupabase.from.mockReturnValue(chain)

      const stats = await TriageService.getTriageStats('org-123')

      expect(stats).toEqual({
        total: 4,
        green: 2,
        yellow: 1,
        red: 1,
        reviewed: 1,
        pending: 3
      })
    })
  })

  describe('bulkApproveGreen', () => {
    it('returns zero when no green items', async () => {
      const chain: any = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        is: vi.fn(() => chain),
        limit: vi.fn().mockResolvedValue({ data: [], error: null })
      }
      mockSupabase.from.mockReturnValue(chain)

      const result = await TriageService.bulkApproveGreen('org-123', 'user-123')

      expect(result).toEqual({ approved: 0, failed: 0 })
    })
  })
})
