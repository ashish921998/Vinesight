import { describe, it, expect, vi } from 'vitest'
import {
  getVisitsForFarmer,
  getVisitableRecommendations,
  createVisit
} from '../consultant-visit-service'
import { type ConsultantAccess } from '../consultant-access'

type Maybe<T> = { data: T | null; error: unknown }

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

type ChainCalls = Array<[string, unknown[]]>

interface MockChain {
  calls: ChainCalls
  select: (...a: unknown[]) => MockChain
  eq: (...a: unknown[]) => MockChain
  in: (...a: unknown[]) => MockChain
  order: (...a: unknown[]) => MockChain
  insert: (...a: unknown[]) => MockChain
  delete: (...a: unknown[]) => MockChain
  single: () => Promise<Maybe<unknown>>
  maybeSingle: () => Promise<Maybe<unknown>>
  then: (
    resolve: (v: Maybe<unknown>) => unknown,
    reject: (e: unknown) => unknown
  ) => Promise<unknown>
}

/** Chainable, awaitable mock query that records its calls. */
function mockChain(result: Maybe<unknown> = { data: null, error: null }): MockChain {
  const calls: ChainCalls = []
  const chain: MockChain = {
    calls,
    select: vi.fn((...a: unknown[]) => (calls.push(['select', a]), chain)),
    eq: vi.fn((...a: unknown[]) => (calls.push(['eq', a]), chain)),
    in: vi.fn((...a: unknown[]) => (calls.push(['in', a]), chain)),
    order: vi.fn((...a: unknown[]) => (calls.push(['order', a]), chain)),
    insert: vi.fn((...a: unknown[]) => (calls.push(['insert', a]), chain)),
    delete: vi.fn((...a: unknown[]) => (calls.push(['delete', a]), chain)),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (v: Maybe<unknown>) => unknown, reject: (e: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject)
  }
  return chain
}

/** Supabase-like client handing out queued chains per table, plus a single rpc result. */
function mockClient(queues: Record<string, MockChain[]>, rpcResult?: Maybe<unknown>) {
  const counters: Record<string, number> = {}
  const from = vi.fn((table: string) => {
    const i = counters[table] ?? 0
    counters[table] = i + 1
    const chain = (queues[table] ?? [])[i]
    if (!chain) throw new Error(`No mock chain queued for "${table}" call #${i}`)
    return chain
  })
  const rpc = vi.fn(() => Promise.resolve(rpcResult ?? { data: null, error: null }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { client: { from, rpc } as any, from, rpc }
}

/** A petiole_triage row as returned to the triage service. */
function triageRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 't1',
    organization_id: 'org-1',
    farm_id: 1,
    petiole_test_id: null,
    client_user_id: 'farmer-1',
    status: 'reviewed',
    severity: 'high',
    classification: 'N deficiency',
    summary: null,
    recommendation: 'Apply 20kg N',
    review_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    ...overrides
  }
}

describe('getVisitableRecommendations', () => {
  it('keeps only triage items that carry a non-empty recommendation', async () => {
    const { client } = mockClient({
      organization_clients: [
        mockChain({ data: [{ client_user_id: 'farmer-1', assigned_to: null }], error: null })
      ],
      petiole_triage: [
        mockChain({
          data: [
            triageRow({ id: 't1', recommendation: 'Apply 20kg N' }),
            triageRow({ id: 't2', recommendation: '' }),
            triageRow({ id: 't3', recommendation: '   ' }),
            triageRow({ id: 't4', recommendation: null })
          ],
          error: null
        })
      ],
      profiles: [mockChain({ data: [{ id: 'farmer-1', full_name: 'Farmer One' }], error: null })],
      farms: [mockChain({ data: [{ id: 1, name: 'North Block' }], error: null })]
    })

    const recs = await getVisitableRecommendations(ownerAccess(), 'farmer-1', client)

    expect(recs.map((r) => r.triageId)).toEqual(['t1'])
    expect(recs[0]).toMatchObject({
      farmId: 1,
      farmName: 'North Block',
      recommendation: 'Apply 20kg N',
      classification: 'N deficiency',
      severity: 'high'
    })
  })
})

describe('getVisitsForFarmer', () => {
  it('returns [] and never queries follow-ups when there are no visits', async () => {
    const { client, from } = mockClient({
      consultant_visits: [mockChain({ data: [], error: null })]
    })

    const visits = await getVisitsForFarmer(ownerAccess(), 'farmer-1', client)

    expect(visits).toEqual([])
    expect(from).not.toHaveBeenCalledWith('visit_recommendation_followups')
  })

  it('groups follow-ups and resolves farm/visitor/recommendation labels', async () => {
    const { client } = mockClient({
      consultant_visits: [
        mockChain({
          data: [
            {
              id: 'v1',
              organization_id: 'org-1',
              client_user_id: 'farmer-1',
              farm_id: 1,
              visited_by: 'agro-1',
              visit_date: '2026-03-01',
              summary: 'Looks good',
              created_at: '2026-03-01T00:00:00Z'
            },
            {
              id: 'v2',
              organization_id: 'org-1',
              client_user_id: 'farmer-1',
              farm_id: null,
              visited_by: null,
              visit_date: '2026-02-01',
              summary: null,
              created_at: '2026-02-01T00:00:00Z'
            }
          ],
          error: null
        })
      ],
      visit_recommendation_followups: [
        mockChain({
          data: [
            { id: 'f1', visit_id: 'v1', triage_id: 't1', followed_status: 'followed', note: 'done' }
          ],
          error: null
        })
      ],
      farms: [mockChain({ data: [{ id: 1, name: 'North Block' }], error: null })],
      profiles: [mockChain({ data: [{ id: 'agro-1', full_name: 'Agro One' }], error: null })],
      petiole_triage: [
        mockChain({
          data: [{ id: 't1', recommendation: 'Apply N', classification: 'N deficiency' }],
          error: null
        })
      ]
    })

    const visits = await getVisitsForFarmer(ownerAccess(), 'farmer-1', client)

    const v1 = visits.find((v) => v.id === 'v1')!
    expect(v1.farmName).toBe('North Block')
    expect(v1.visitedByName).toBe('Agro One')
    expect(v1.followups).toHaveLength(1)
    expect(v1.followups[0]).toMatchObject({
      followedStatus: 'followed',
      note: 'done',
      recommendation: 'Apply N',
      classification: 'N deficiency'
    })

    // A visit whose visiting member was deleted (visited_by null) stays intact.
    const v2 = visits.find((v) => v.id === 'v2')!
    expect(v2.visitedBy).toBeNull()
    expect(v2.visitedByName).toBeNull()
    expect(v2.farmName).toBeNull()
    expect(v2.followups).toEqual([])
  })

  it('throws when the visits query errors', async () => {
    const { client } = mockClient({
      consultant_visits: [mockChain({ data: null, error: { message: 'db down' } })]
    })

    await expect(getVisitsForFarmer(ownerAccess(), 'farmer-1', client)).rejects.toThrow(
      'Failed to load visits: db down'
    )
  })

  it('throws when the follow-ups query errors', async () => {
    // farm_id and visited_by are null so hydrateVisits skips the farms/profiles
    // lookups and the follow-ups query is the next call to fail.
    const { client } = mockClient({
      consultant_visits: [
        mockChain({
          data: [
            {
              id: 'v1',
              organization_id: 'org-1',
              client_user_id: 'farmer-1',
              farm_id: null,
              visited_by: null,
              visit_date: '2026-03-01',
              summary: null,
              created_at: '2026-03-01T00:00:00Z'
            }
          ],
          error: null
        })
      ],
      visit_recommendation_followups: [mockChain({ data: null, error: { message: 'rls' } })]
    })

    await expect(getVisitsForFarmer(ownerAccess(), 'farmer-1', client)).rejects.toThrow(
      'Failed to load visit follow-ups: rls'
    )
  })
})

describe('createVisit', () => {
  it('calls the atomic RPC with mapped follow-ups and returns the reloaded visit', async () => {
    const { client, rpc } = mockClient(
      {
        // createVisit reloads the single row by id via .single(), not an array.
        consultant_visits: [
          mockChain({
            data: {
              id: 'v1',
              organization_id: 'org-1',
              client_user_id: 'farmer-1',
              farm_id: null,
              visited_by: 'agro-1',
              visit_date: '2026-03-01',
              summary: 'note',
              created_at: '2026-03-01T00:00:00Z'
            },
            error: null
          })
        ],
        visit_recommendation_followups: [mockChain({ data: [], error: null })],
        profiles: [mockChain({ data: [{ id: 'agro-1', full_name: 'Agro One' }], error: null })]
      },
      { data: { id: 'v1' }, error: null }
    )

    const visit = await createVisit(
      agronomistAccess('agro-1'),
      {
        farmerId: 'farmer-1',
        farmId: null,
        visitDate: '2026-03-01',
        summary: ' note ',
        followups: [{ triageId: 't1', followedStatus: 'partially_followed', note: ' partial ' }]
      },
      client
    )

    expect(visit.id).toBe('v1')
    expect(rpc).toHaveBeenCalledWith('create_visit_with_followups', {
      p_farmer_id: 'farmer-1',
      p_farm_id: null,
      p_visit_date: '2026-03-01',
      p_summary: 'note',
      p_followups: [{ triage_id: 't1', followed_status: 'partially_followed', note: 'partial' }]
    })
  })

  it('throws when the RPC returns an error', async () => {
    const { client } = mockClient({}, { data: null, error: { message: 'not authorized' } })

    await expect(
      createVisit(
        agronomistAccess('agro-1'),
        { farmerId: 'farmer-1', visitDate: '2026-03-01', followups: [] },
        client
      )
    ).rejects.toThrow('Failed to record visit: not authorized')
  })

  it('sends null for a blank summary and blank follow-up notes', async () => {
    // Whitespace-only summary/notes must reach the RPC as null, never '' or '   '.
    const { client, rpc } = mockClient(
      {
        consultant_visits: [
          mockChain({
            data: {
              id: 'v1',
              organization_id: 'org-1',
              client_user_id: 'farmer-1',
              farm_id: null,
              visited_by: null,
              visit_date: '2026-03-01',
              summary: null,
              created_at: '2026-03-01T00:00:00Z'
            },
            error: null
          })
        ],
        visit_recommendation_followups: [mockChain({ data: [], error: null })]
      },
      { data: { id: 'v1' }, error: null }
    )

    await createVisit(
      agronomistAccess('agro-1'),
      {
        farmerId: 'farmer-1',
        visitDate: '2026-03-01',
        summary: '   ',
        followups: [{ triageId: 't1', followedStatus: 'followed', note: '  ' }]
      },
      client
    )

    expect(rpc).toHaveBeenCalledWith('create_visit_with_followups', {
      p_farmer_id: 'farmer-1',
      p_farm_id: null,
      p_visit_date: '2026-03-01',
      p_summary: null,
      p_followups: [{ triage_id: 't1', followed_status: 'followed', note: null }]
    })
  })

  it('throws when the recorded visit cannot be reloaded', async () => {
    // RPC succeeds but the reload-by-id finds nothing (e.g. RLS hides the row):
    // surface a clear error rather than returning a phantom visit.
    const { client } = mockClient(
      { consultant_visits: [mockChain({ data: null, error: null })] },
      { data: { id: 'v1' }, error: null }
    )

    await expect(
      createVisit(
        agronomistAccess('agro-1'),
        { farmerId: 'farmer-1', visitDate: '2026-03-01', followups: [] },
        client
      )
    ).rejects.toThrow('could not be reloaded')
  })
})
