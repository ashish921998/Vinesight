import { describe, it, expect, vi, beforeEach } from 'vitest'
import { type ConsultantAccess } from '../consultant-access'

// validateFarmerClient and setClientPaymentStatus call getTypedSupabaseClient()
// directly (no injectable client like the visit/triage services), so we mock the
// module. vi.hoisted keeps the spies alive across the hoisted vi.mock factory.
const { maybeSingle, rpc, fromChain } = vi.hoisted(() => {
  const maybeSingle = vi.fn()
  const rpc = vi.fn()
  // Chainable query stub: select()/eq() return the chain; maybeSingle() resolves.
  const chain: {
    select: () => typeof chain
    eq: () => typeof chain
    maybeSingle: typeof maybeSingle
  } = {
    select: () => chain,
    eq: () => chain,
    maybeSingle
  }
  return { maybeSingle, rpc, fromChain: chain }
})

vi.mock('../supabase', () => ({
  getTypedSupabaseClient: vi.fn(async () => ({
    from: () => fromChain,
    rpc
  }))
}))

import { validateFarmerClient, setClientPaymentStatus } from '../consultant-query-service'

function ownerAccess(): ConsultantAccess {
  return {
    userId: 'owner-1',
    organizationId: 'org-1',
    role: 'owner',
    canViewAllFarmers: true,
    isAgronomist: false,
    organizationName: null,
    joinCode: null
  }
}

function agronomistAccess(userId = 'agro-1'): ConsultantAccess {
  return {
    userId,
    organizationId: 'org-1',
    role: 'agronomist',
    canViewAllFarmers: false,
    isAgronomist: true,
    organizationName: null,
    joinCode: null
  }
}

describe('validateFarmerClient', () => {
  beforeEach(() => {
    maybeSingle.mockReset()
  })

  it('returns an all-null invalid result when the farmer is not an active client', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null })

    expect(await validateFarmerClient(ownerAccess(), 'farmer-1')).toEqual({
      isValid: false,
      assigned_to: null,
      clientRecordId: null,
      isPaid: false
    })
  })

  it('denies an agronomist not assigned to the farmer WITHOUT leaking the record id or paid state', async () => {
    // A client row exists, but this agronomist is assigned to someone else. The
    // result must be the same opaque invalid shape as "not a client at all" — no
    // clientRecordId, no isPaid — so a caller cannot act on a farmer off-limits to them.
    maybeSingle.mockResolvedValue({
      data: { id: 'c1', assigned_to: 'other-agro', is_paid: true },
      error: null
    })

    expect(await validateFarmerClient(agronomistAccess('agro-1'), 'farmer-1')).toEqual({
      isValid: false,
      assigned_to: null,
      clientRecordId: null,
      isPaid: false
    })
  })

  it('allows the assigned agronomist and surfaces the record id + paid state', async () => {
    maybeSingle.mockResolvedValue({
      data: { id: 'c1', assigned_to: 'agro-1', is_paid: false },
      error: null
    })

    expect(await validateFarmerClient(agronomistAccess('agro-1'), 'farmer-1')).toEqual({
      isValid: true,
      assigned_to: 'agro-1',
      clientRecordId: 'c1',
      isPaid: false
    })
  })

  it('allows an owner regardless of who the farmer is assigned to', async () => {
    maybeSingle.mockResolvedValue({
      data: { id: 'c1', assigned_to: 'other-agro', is_paid: true },
      error: null
    })

    const result = await validateFarmerClient(ownerAccess(), 'farmer-1')
    expect(result.isValid).toBe(true)
    expect(result.clientRecordId).toBe('c1')
    expect(result.isPaid).toBe(true)
  })

  it('throws a prefixed error when the lookup fails', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'db down' } })

    await expect(validateFarmerClient(ownerAccess(), 'farmer-1')).rejects.toThrow(
      'Failed to validate farmer: db down'
    )
  })
})

describe('setClientPaymentStatus', () => {
  beforeEach(() => {
    rpc.mockReset()
  })

  it('throws a prefixed error when the RPC fails', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'not authorized' } })

    await expect(setClientPaymentStatus('c1', true)).rejects.toThrow(
      'Failed to update payment status: not authorized'
    )
  })

  it('returns the server-confirmed is_paid', async () => {
    rpc.mockResolvedValue({ data: { is_paid: false }, error: null })

    expect(await setClientPaymentStatus('c1', true)).toBe(false)
  })

  it('falls back to the requested value when the RPC returns no row', async () => {
    rpc.mockResolvedValue({ data: null, error: null })

    expect(await setClientPaymentStatus('c1', true)).toBe(true)
  })
})
