import { describe, it, expect, vi } from 'vitest'
import { getTriageItems, getTriageItem, updateTriageReview } from '../consultant-triage-service'
import { type ConsultantAccess } from '../consultant-access'

type Maybe<T> = { data: T | null; error: unknown }

const ALLOWED_UPDATE_KEYS = new Set([
  'reviewed_by',
  'reviewed_at',
  'status',
  'severity',
  'classification',
  'summary',
  'recommendation',
  'review_notes'
])

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

function adminAccess(): ConsultantAccess {
  return {
    userId: 'admin-1',
    organizationId: 'org-1',
    role: 'admin',
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

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 't1',
    organization_id: 'org-1',
    farm_id: 1,
    petiole_test_id: null,
    client_user_id: 'farmer-1',
    status: 'pending',
    severity: null,
    classification: null,
    summary: null,
    recommendation: null,
    review_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides
  }
}

type ChainCalls = Array<[string, unknown[]]>

interface MockChain {
  calls: ChainCalls
  select: (...a: unknown[]) => MockChain
  eq: (...a: unknown[]) => MockChain
  in: (...a: unknown[]) => MockChain
  order: (...a: unknown[]) => MockChain
  update: (...a: unknown[]) => MockChain
  insert: (...a: unknown[]) => MockChain
  single: () => Promise<Maybe<unknown>>
  maybeSingle: () => Promise<Maybe<unknown>>
  then: (
    resolve: (v: Maybe<unknown>) => unknown,
    reject: (e: unknown) => unknown
  ) => Promise<unknown>
}

/** A chainable, awaitable mock query that records its calls. */
function mockChain(result: Maybe<unknown> = { data: null, error: null }): MockChain {
  const calls: ChainCalls = []
  const chain: MockChain = {
    calls,
    select: vi.fn((...a: unknown[]) => (calls.push(['select', a]), chain)),
    eq: vi.fn((...a: unknown[]) => (calls.push(['eq', a]), chain)),
    in: vi.fn((...a: unknown[]) => (calls.push(['in', a]), chain)),
    order: vi.fn((...a: unknown[]) => (calls.push(['order', a]), chain)),
    update: vi.fn((...a: unknown[]) => (calls.push(['update', a]), chain)),
    insert: vi.fn((...a: unknown[]) => (calls.push(['insert', a]), chain)),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (v: Maybe<unknown>) => unknown, reject: (e: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject)
  }
  return chain
}

/** Build a Supabase-like client that hands out queued chains per table. */
function mockClient(queues: Record<string, MockChain[]>) {
  const counters: Record<string, number> = {}
  const handed: Record<string, MockChain[]> = {}
  const from = vi.fn((table: string) => {
    const i = counters[table] ?? 0
    counters[table] = i + 1
    const chain = (queues[table] ?? [])[i]
    if (!chain) {
      throw new Error(`No mock chain queued for "${table}" call #${i}`)
    }
    ;(handed[table] ??= []).push(chain)
    return chain
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { client: { from } as any, from, handed }
}

describe('getTriageItems', () => {
  it('owner sees triage for all active org clients', async () => {
    const orgClients = mockChain({
      data: [
        { client_user_id: 'farmer-1', assigned_to: null },
        { client_user_id: 'farmer-2', assigned_to: 'agro-1' }
      ],
      error: null
    })
    const triage = mockChain({
      data: [
        makeRow({ id: 't1', client_user_id: 'farmer-1', farm_id: 1 }),
        makeRow({ id: 't2', client_user_id: 'farmer-2', farm_id: 2 })
      ],
      error: null
    })
    const { client } = mockClient({
      organization_clients: [orgClients],
      petiole_triage: [triage],
      profiles: [
        mockChain({
          data: [
            { id: 'farmer-1', full_name: 'Farmer One' },
            { id: 'farmer-2', full_name: 'Farmer Two' }
          ],
          error: null
        })
      ],
      farms: [
        mockChain({
          data: [
            { id: 1, name: 'Farm 1' },
            { id: 2, name: 'Farm 2' }
          ],
          error: null
        })
      ]
    })

    const items = await getTriageItems(ownerAccess(), {}, client)

    expect(items.map((i) => i.id)).toEqual(['t1', 't2'])
    expect(items[0].farmerName).toBe('Farmer One')
    // Owner must NOT be scoped by assigned_to
    expect(orgClients.calls).not.toContainEqual(['eq', ['assigned_to', 'owner-1']])
  })

  it('admin sees triage for all active org clients', async () => {
    const orgClients = mockChain({
      data: [{ client_user_id: 'farmer-1', assigned_to: null }],
      error: null
    })
    const { client } = mockClient({
      organization_clients: [orgClients],
      petiole_triage: [
        mockChain({ data: [makeRow({ id: 't1', client_user_id: 'farmer-1' })], error: null })
      ],
      profiles: [mockChain({ data: [{ id: 'farmer-1', full_name: 'Farmer One' }], error: null })],
      farms: [mockChain({ data: [{ id: 1, name: 'Farm 1' }], error: null })]
    })

    const items = await getTriageItems(adminAccess(), {}, client)

    expect(items).toHaveLength(1)
    expect(orgClients.calls).not.toContainEqual(['eq', ['assigned_to', 'admin-1']])
  })

  it('agronomist sees triage only for assigned clients', async () => {
    const orgClients = mockChain({
      data: [{ client_user_id: 'farmer-2', assigned_to: 'agro-1' }],
      error: null
    })
    const triage = mockChain({
      data: [makeRow({ id: 't2', client_user_id: 'farmer-2', farm_id: 2 })],
      error: null
    })
    const { client } = mockClient({
      organization_clients: [orgClients],
      petiole_triage: [triage],
      profiles: [mockChain({ data: [{ id: 'farmer-2', full_name: 'Farmer Two' }], error: null })],
      farms: [mockChain({ data: [{ id: 2, name: 'Farm 2' }], error: null })]
    })

    const items = await getTriageItems(agronomistAccess('agro-1'), {}, client)

    expect(items.map((i) => i.clientUserId)).toEqual(['farmer-2'])
    // Visibility scoped to the agronomist's assignments...
    expect(orgClients.calls).toContainEqual(['eq', ['assigned_to', 'agro-1']])
    // ...and the triage query is restricted to only those client ids.
    expect(triage.calls).toContainEqual(['in', ['client_user_id', ['farmer-2']]])
  })

  it('unassigned agronomist with no clients sees nothing and never queries triage', async () => {
    const { client, from } = mockClient({
      organization_clients: [mockChain({ data: [], error: null })]
    })

    const items = await getTriageItems(agronomistAccess('agro-unassigned'), {}, client)

    expect(items).toEqual([])
    expect(from).not.toHaveBeenCalledWith('petiole_triage')
  })

  it('ignores a farmerId filter outside the consultant visibility set', async () => {
    const { client, from } = mockClient({
      organization_clients: [
        mockChain({ data: [{ client_user_id: 'farmer-1', assigned_to: 'agro-1' }], error: null })
      ]
    })

    const items = await getTriageItems(
      agronomistAccess('agro-1'),
      { farmerId: 'someone-else' },
      client
    )

    expect(items).toEqual([])
    expect(from).not.toHaveBeenCalledWith('petiole_triage')
  })

  it('wires status, severity, and farmId filters into the triage query', async () => {
    const triage = mockChain({ data: [], error: null })
    const { client } = mockClient({
      organization_clients: [
        mockChain({ data: [{ client_user_id: 'farmer-1', assigned_to: null }], error: null })
      ],
      petiole_triage: [triage]
    })

    await getTriageItems(ownerAccess(), { status: 'reviewed', severity: 'high', farmId: 1 }, client)

    expect(triage.calls).toContainEqual(['eq', ['status', 'reviewed']])
    expect(triage.calls).toContainEqual(['eq', ['severity', 'high']])
    expect(triage.calls).toContainEqual(['eq', ['farm_id', 1]])
    // Newest-first ordering is requested from the DB, not sorted in memory.
    expect(triage.calls).toContainEqual(['order', ['created_at', { ascending: false }]])
  })

  it('enriches items with the linked petiole test date', async () => {
    const testChain = mockChain({ data: [{ id: 99, date: '2026-02-01' }], error: null })
    const { client } = mockClient({
      organization_clients: [
        mockChain({ data: [{ client_user_id: 'farmer-1', assigned_to: null }], error: null })
      ],
      petiole_triage: [
        mockChain({
          data: [makeRow({ id: 't1', client_user_id: 'farmer-1', petiole_test_id: 99 })],
          error: null
        })
      ],
      profiles: [mockChain({ data: [{ id: 'farmer-1', full_name: 'Farmer One' }], error: null })],
      farms: [mockChain({ data: [{ id: 1, name: 'Farm 1' }], error: null })],
      petiole_test_records: [testChain]
    })

    const items = await getTriageItems(ownerAccess(), {}, client)

    expect(items[0].testDate).toBe('2026-02-01')
    expect(testChain.calls).toContainEqual(['in', ['id', [99]]])
  })

  it('applies the in-memory search filter on farmer and farm names', async () => {
    const { client } = mockClient({
      organization_clients: [
        mockChain({
          data: [
            { client_user_id: 'farmer-1', assigned_to: null },
            { client_user_id: 'farmer-2', assigned_to: null }
          ],
          error: null
        })
      ],
      petiole_triage: [
        mockChain({
          data: [
            makeRow({ id: 't1', client_user_id: 'farmer-1', farm_id: 1 }),
            makeRow({ id: 't2', client_user_id: 'farmer-2', farm_id: 2 })
          ],
          error: null
        })
      ],
      profiles: [
        mockChain({
          data: [
            { id: 'farmer-1', full_name: 'Alice Grower' },
            { id: 'farmer-2', full_name: 'Bob Vintner' }
          ],
          error: null
        })
      ],
      farms: [
        mockChain({
          data: [
            { id: 1, name: 'North Block' },
            { id: 2, name: 'South Block' }
          ],
          error: null
        })
      ]
    })

    const items = await getTriageItems(ownerAccess(), { search: 'alice' }, client)

    expect(items.map((i) => i.id)).toEqual(['t1'])
  })
})

describe('getTriageItem', () => {
  it('owner can read a triage item for an active org client', async () => {
    const { client } = mockClient({
      petiole_triage: [
        mockChain({ data: makeRow({ id: 't1', client_user_id: 'farmer-1' }), error: null })
      ],
      organization_clients: [mockChain({ data: { assigned_to: null }, error: null })],
      profiles: [mockChain({ data: [{ id: 'farmer-1', full_name: 'Farmer One' }], error: null })],
      farms: [mockChain({ data: [{ id: 1, name: 'Farm 1' }], error: null })]
    })

    const item = await getTriageItem(ownerAccess(), 't1', client)

    expect(item?.id).toBe('t1')
    expect(item?.farmerName).toBe('Farmer One')
  })

  it('returns null for a triage item belonging to another organization', async () => {
    const { client } = mockClient({
      petiole_triage: [
        mockChain({ data: makeRow({ id: 't1', organization_id: 'org-OTHER' }), error: null })
      ]
    })

    const item = await getTriageItem(ownerAccess(), 't1', client)

    expect(item).toBeNull()
  })

  it('returns null for an unassigned agronomist viewing another farmer triage', async () => {
    const { client } = mockClient({
      petiole_triage: [
        mockChain({ data: makeRow({ id: 't1', client_user_id: 'farmer-1' }), error: null })
      ],
      organization_clients: [mockChain({ data: { assigned_to: 'other-agro' }, error: null })]
    })

    const item = await getTriageItem(agronomistAccess('agro-1'), 't1', client)

    expect(item).toBeNull()
  })

  it('maps the linked petiole test values into the detail', async () => {
    const { client } = mockClient({
      petiole_triage: [
        mockChain({
          data: makeRow({ id: 't1', client_user_id: 'farmer-1', petiole_test_id: 99 }),
          error: null
        })
      ],
      organization_clients: [mockChain({ data: { assigned_to: null }, error: null })],
      profiles: [mockChain({ data: [{ id: 'farmer-1', full_name: 'Farmer One' }], error: null })],
      farms: [mockChain({ data: [{ id: 1, name: 'Farm 1' }], error: null })],
      petiole_test_records: [
        // First call: loadDisplayMaps .in() for the list test-date map.
        mockChain({ data: [{ id: 99, date: '2026-02-01' }], error: null }),
        // Second call: the detail .maybeSingle() fetch.
        mockChain({
          data: {
            id: 99,
            date: '2026-02-01',
            date_of_pruning: '2025-12-15',
            parameters: { N: 2.1, K: 1.4 },
            recommendations: 'Increase N',
            notes: null
          },
          error: null
        })
      ]
    })

    const item = await getTriageItem(ownerAccess(), 't1', client)

    expect(item?.petioleTest?.id).toBe(99)
    expect(item?.petioleTest?.dateOfPruning).toBe('2025-12-15')
    expect(item?.petioleTest?.parameters).toEqual({ N: 2.1, K: 1.4 })
  })
})

describe('updateTriageReview', () => {
  it('owner can update review fields and only writes consultant fields', async () => {
    const updateChain = mockChain({
      data: makeRow({ id: 't1', status: 'reviewed', reviewed_by: 'owner-1' }),
      error: null
    })
    const { client } = mockClient({
      petiole_triage: [
        mockChain({
          data: { id: 't1', organization_id: 'org-1', client_user_id: 'farmer-1' },
          error: null
        }),
        updateChain
      ],
      organization_clients: [mockChain({ data: { assigned_to: null }, error: null })]
    })

    const result = await updateTriageReview(
      ownerAccess(),
      't1',
      { status: 'reviewed', classification: 'N deficiency', reviewNotes: 'looks fine' },
      client
    )

    expect(result.status).toBe('reviewed')
    const updateCall = updateChain.calls.find((c) => c[0] === 'update')
    expect(updateCall).toBeDefined()
    const payload = (updateCall?.[1] as Record<string, unknown>[])[0]
    expect(payload.reviewed_by).toBe('owner-1')
    expect(payload.reviewed_at).toBeTruthy()
    // No farmer-facing / non-review fields may be written.
    for (const key of Object.keys(payload)) {
      expect(ALLOWED_UPDATE_KEYS.has(key)).toBe(true)
    }
  })

  it('assigned agronomist can update review fields', async () => {
    const updateChain = mockChain({ data: makeRow({ id: 't1', status: 'in_review' }), error: null })
    const { client } = mockClient({
      petiole_triage: [
        mockChain({
          data: { id: 't1', organization_id: 'org-1', client_user_id: 'farmer-2' },
          error: null
        }),
        updateChain
      ],
      organization_clients: [mockChain({ data: { assigned_to: 'agro-1' }, error: null })]
    })

    const result = await updateTriageReview(
      agronomistAccess('agro-1'),
      't1',
      { status: 'in_review' },
      client
    )

    expect(result.status).toBe('in_review')
    // Stamp must carry the acting agronomist's id, not a hardcoded reviewer.
    const updateCall = updateChain.calls.find((c) => c[0] === 'update')
    const payload = (updateCall?.[1] as Record<string, unknown>[])[0]
    expect(payload.reviewed_by).toBe('agro-1')
  })

  it('unassigned agronomist cannot update and never issues an update', async () => {
    const updateChain = mockChain({ data: makeRow(), error: null })
    const { client } = mockClient({
      petiole_triage: [
        mockChain({
          data: { id: 't1', organization_id: 'org-1', client_user_id: 'farmer-2' },
          error: null
        }),
        updateChain
      ],
      organization_clients: [mockChain({ data: { assigned_to: 'other-agro' }, error: null })]
    })

    await expect(
      updateTriageReview(agronomistAccess('agro-1'), 't1', { status: 'reviewed' }, client)
    ).rejects.toThrow('Forbidden')
    expect(updateChain.calls.find((c) => c[0] === 'update')).toBeUndefined()
  })

  it('throws when the triage item is in another organization', async () => {
    const { client } = mockClient({
      petiole_triage: [
        mockChain({
          data: { id: 't1', organization_id: 'org-OTHER', client_user_id: 'farmer-1' },
          error: null
        })
      ]
    })

    await expect(
      updateTriageReview(ownerAccess(), 't1', { status: 'reviewed' }, client)
    ).rejects.toThrow('Triage item not found')
  })

  it('throws when the triage item does not exist', async () => {
    const { client } = mockClient({
      petiole_triage: [mockChain({ data: null, error: null })]
    })

    await expect(
      updateTriageReview(ownerAccess(), 'missing', { status: 'reviewed' }, client)
    ).rejects.toThrow('Triage item not found')
  })
})
