import { describe, it, expect, vi } from 'vitest'
import { checkFarmAccess, type FarmAccessDeps } from '../farm-access'

type Maybe<T> = { data: T | null; error: any }

function mockSupabaseClient(partial: {
  from: any
}): FarmAccessDeps['supabaseAdmin'] {
  return partial as unknown as FarmAccessDeps['supabaseAdmin']
}

function mockChain(result: Maybe<any> = { data: null, error: null }) {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
    limit: vi.fn(() => chain),
  }
  return chain
}

describe('checkFarmAccess', () => {
  it('allows farm owner', async () => {
    const farmId = 1
    const ownerId = 'user-owner'

    const from = vi.fn().mockReturnValue(
      mockChain({ data: { id: farmId, user_id: ownerId }, error: null })
    )
    const supabaseAdmin = mockSupabaseClient({ from })

    const result = await checkFarmAccess(ownerId, farmId, { supabaseAdmin })

    expect(result).toEqual({ allowed: true })
  })

  it('returns 404 when farm not found', async () => {
    const from = vi.fn().mockReturnValue(
      mockChain({ data: null, error: { code: 'PGRST116' } })
    )
    const supabaseAdmin = mockSupabaseClient({ from })

    const result = await checkFarmAccess('any-user', 1, { supabaseAdmin })

    expect(result).toEqual({ allowed: false, reason: 'Farm not found', status: 404 })
  })

  it('throws on unexpected farm query error', async () => {
    const from = vi.fn().mockReturnValue(
      mockChain({ data: null, error: new Error('db down') })
    )
    const supabaseAdmin = mockSupabaseClient({ from })

    await expect(checkFarmAccess('any-user', 1, { supabaseAdmin })).rejects.toThrow('db down')
  })

  it('allows consultant owner for their org client farm', async () => {
    const farmId = 2
    const farmerId = 'user-farmer'
    const consultantId = 'user-consultant'
    const orgId = 'org-1'

    const chains: Record<string, any> = {
      farms: mockChain({ data: { id: farmId, user_id: farmerId }, error: null }),
      organization_members: mockChain({
        data: { organization_id: orgId, role: 'owner', is_owner: true },
        error: null,
      }),
      organization_clients: mockChain({
        data: { id: 'oc-1', assigned_to: null, status: 'active' },
        error: null,
      }),
    }

    const from = vi.fn((table: string) => chains[table])
    const supabaseAdmin = mockSupabaseClient({ from })

    const result = await checkFarmAccess(consultantId, farmId, { supabaseAdmin })

    expect(result).toEqual({ allowed: true })
  })

  it('allows consultant admin for their org client farm', async () => {
    const farmId = 3
    const farmerId = 'user-farmer'
    const adminId = 'user-admin'
    const orgId = 'org-2'

    const chains: Record<string, any> = {
      farms: mockChain({ data: { id: farmId, user_id: farmerId }, error: null }),
      organization_members: mockChain({
        data: { organization_id: orgId, role: 'admin', is_owner: false },
        error: null,
      }),
      organization_clients: mockChain({
        data: { id: 'oc-2', assigned_to: null, status: 'active' },
        error: null,
      }),
    }

    const from = vi.fn((table: string) => chains[table])
    const supabaseAdmin = mockSupabaseClient({ from })

    const result = await checkFarmAccess(adminId, farmId, { supabaseAdmin })

    expect(result).toEqual({ allowed: true })
  })

  it('allows assigned agronomist for their client farm', async () => {
    const farmId = 4
    const farmerId = 'user-farmer'
    const agronomistId = 'user-agro'
    const orgId = 'org-3'

    const chains: Record<string, any> = {
      farms: mockChain({ data: { id: farmId, user_id: farmerId }, error: null }),
      organization_members: mockChain({
        data: { organization_id: orgId, role: 'agronomist', is_owner: false },
        error: null,
      }),
      organization_clients: mockChain({
        data: { id: 'oc-3', assigned_to: agronomistId, status: 'active' },
        error: null,
      }),
    }

    const from = vi.fn((table: string) => chains[table])
    const supabaseAdmin = mockSupabaseClient({ from })

    const result = await checkFarmAccess(agronomistId, farmId, { supabaseAdmin })

    expect(result).toEqual({ allowed: true })
  })

  it('denies unassigned agronomist (403)', async () => {
    const farmId = 5
    const farmerId = 'user-farmer'
    const agronomistId = 'user-agro'
    const orgId = 'org-4'

    const chains: Record<string, any> = {
      farms: mockChain({ data: { id: farmId, user_id: farmerId }, error: null }),
      organization_members: mockChain({
        data: { organization_id: orgId, role: 'agronomist', is_owner: false },
        error: null,
      }),
      organization_clients: mockChain({
        data: { id: 'oc-4', assigned_to: 'other-agro', status: 'active' },
        error: null,
      }),
    }

    const from = vi.fn((table: string) => chains[table])
    const supabaseAdmin = mockSupabaseClient({ from })

    const result = await checkFarmAccess(agronomistId, farmId, { supabaseAdmin })

    expect(result).toEqual({ allowed: false, reason: 'Forbidden', status: 403 })
  })

  it('denies unrelated user with no org membership (403)', async () => {
    const farmId = 6
    const farmerId = 'user-farmer'
    const unrelatedId = 'user-stranger'

    const chains: Record<string, any> = {
      farms: mockChain({ data: { id: farmId, user_id: farmerId }, error: null }),
      organization_members: mockChain({ data: null, error: null }),
    }

    const from = vi.fn((table: string) => chains[table])
    const supabaseAdmin = mockSupabaseClient({ from })

    const result = await checkFarmAccess(unrelatedId, farmId, { supabaseAdmin })

    expect(result).toEqual({ allowed: false, reason: 'Forbidden', status: 403 })
  })

  it('denies user whose org has no active client link to the farmer (403)', async () => {
    const farmId = 7
    const farmerId = 'user-farmer'
    const memberId = 'user-member'
    const orgId = 'org-5'

    const chains: Record<string, any> = {
      farms: mockChain({ data: { id: farmId, user_id: farmerId }, error: null }),
      organization_members: mockChain({
        data: { organization_id: orgId, role: 'owner', is_owner: true },
        error: null,
      }),
      organization_clients: mockChain({ data: null, error: null }),
    }

    const from = vi.fn((table: string) => chains[table])
    const supabaseAdmin = mockSupabaseClient({ from })

    const result = await checkFarmAccess(memberId, farmId, { supabaseAdmin })

    expect(result).toEqual({ allowed: false, reason: 'Forbidden', status: 403 })
  })
})
