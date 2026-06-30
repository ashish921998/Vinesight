import { describe, expect, it } from 'vitest'
import type { TriageItem } from '../consultant-triage-service'
import {
  adherenceSummary,
  avgTimeToReviewDays,
  buildCallList,
  buildFindings,
  groupCallList,
  farmsWithDeficiency,
  farmsWithPetioleData,
  goneQuietFarmers,
  nutrientStatusAcrossFarms,
  oldestOpenReviewDays,
  openReviewCount,
  reviewedNoPlan,
  severityCounts,
  statusCounts,
  teamWorkload,
  throughputTotal,
  weeklyThroughput,
  type FarmContactRef,
  type FarmPetioleSnapshot
} from '../consultant-dashboard-metrics'

const NOW = new Date('2026-06-23T12:00:00Z')

function mk(overrides: Partial<TriageItem>): TriageItem {
  return {
    id: Math.random().toString(36).slice(2),
    organizationId: 'org',
    farmId: 1,
    petioleTestId: null,
    clientUserId: 'c1',
    status: 'pending',
    severity: null,
    classification: null,
    summary: null,
    recommendation: null,
    reviewNotes: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: '2026-06-20T00:00:00Z',
    updatedAt: null,
    farmerName: null,
    farmName: null,
    testDate: null,
    ...overrides
  }
}

describe('openReviewCount', () => {
  it('counts only pending + in_review', () => {
    const items = [
      mk({ status: 'pending' }),
      mk({ status: 'in_review' }),
      mk({ status: 'reviewed' }),
      mk({ status: 'resolved' })
    ]
    expect(openReviewCount(items)).toBe(2)
  })
})

describe('avgTimeToReviewDays', () => {
  it('averages create→review days within the window and ignores older/incomplete', () => {
    const items = [
      mk({ createdAt: '2026-06-20T00:00:00Z', reviewedAt: '2026-06-22T00:00:00Z' }), // 2d, in window
      mk({ createdAt: '2026-06-18T00:00:00Z', reviewedAt: '2026-06-22T00:00:00Z' }), // 4d, in window
      mk({ createdAt: '2026-01-01T00:00:00Z', reviewedAt: '2026-01-05T00:00:00Z' }), // older than 30d
      mk({ createdAt: '2026-06-21T00:00:00Z', reviewedAt: null }) // not reviewed
    ]
    expect(avgTimeToReviewDays(items, { now: NOW })).toBeCloseTo(3, 5)
  })

  it('returns null when nothing was reviewed in the window', () => {
    expect(avgTimeToReviewDays([mk({ reviewedAt: null })], { now: NOW })).toBeNull()
  })
})

describe('statusCounts / severityCounts', () => {
  it('counts every status incl zeros', () => {
    const { counts, total } = statusCounts([mk({ status: 'pending' }), mk({ status: 'pending' })])
    expect(counts.pending).toBe(2)
    expect(counts.resolved).toBe(0)
    expect(total).toBe(2)
  })

  it('only counts classified (non-null) severities', () => {
    const { counts, classifiedTotal } = severityCounts([
      mk({ severity: 'high' }),
      mk({ severity: null }),
      mk({ severity: 'high' })
    ])
    expect(counts.high).toBe(2)
    expect(classifiedTotal).toBe(2)
  })
})

describe('weeklyThroughput', () => {
  it('always returns `weeks` buckets and only counts reviewed items in range', () => {
    const points = weeklyThroughput(
      [
        mk({ reviewedAt: NOW.toISOString() }),
        mk({ reviewedAt: '2020-01-01T00:00:00Z' }), // far outside the window
        mk({ reviewedAt: null })
      ],
      { now: NOW, weeks: 8 }
    )
    expect(points).toHaveLength(8)
    expect(throughputTotal(points)).toBe(1)
  })
})

describe('nutrientStatusAcrossFarms', () => {
  it('buckets latest petiole values and honors the sulphur→sulfur alias', () => {
    const rows = nutrientStatusAcrossFarms([
      { farmId: 1, parameters: { potassium: 1.0, sulfur: 0.1 } }, // K deficient, S deficient
      { farmId: 2, parameters: { potassium: 2.0, sulfur: 0.3 } }, // K optimal,   S optimal
      { farmId: 3, parameters: { potassium: 3.0 } } // K excess
    ])
    const k = rows.find((r) => r.key === 'potassium')
    const s = rows.find((r) => r.key === 'sulfur')
    expect(k).toMatchObject({ deficient: 1, optimal: 1, excess: 1, total: 3 })
    // The alias is what makes sulfur resolve to a range at all.
    expect(s).toMatchObject({ deficient: 1, optimal: 1, total: 2 })
  })

  it('canonicalizes raw keys before bucketing', () => {
    // British "Sulphur" should still land in the sulfur row.
    const rows = nutrientStatusAcrossFarms([{ farmId: 1, parameters: { Sulphur: 0.1 } }])
    expect(rows.find((r) => r.key === 'sulfur')?.deficient).toBe(1)
  })

  it('counts farms with usable petiole data', () => {
    expect(
      farmsWithPetioleData([
        { farmId: 1, parameters: { potassium: 2 } },
        { farmId: 2, parameters: null },
        { farmId: 3, parameters: { somethingUnknown: 5 } }
      ])
    ).toBe(1)
  })
})

describe('adherenceSummary', () => {
  it('computes the followed percentage', () => {
    const s = adherenceSummary({ followed: 3, partially_followed: 1, not_followed: 0 })
    expect(s.total).toBe(4)
    expect(s.followedPct).toBe(75)
  })

  it('is null-safe with no data', () => {
    expect(adherenceSummary(null).followedPct).toBeNull()
  })
})

describe('goneQuietFarmers', () => {
  it('flags farms past the threshold, most-overdue first, and skips never-sampled', () => {
    const farms: FarmPetioleSnapshot[] = [
      { farmId: 1, sampleDate: '2026-05-14T12:00:00Z', parameters: {} }, // 40d
      { farmId: 2, sampleDate: '2026-04-24T12:00:00Z', parameters: {} }, // 60d
      { farmId: 3, sampleDate: '2026-06-13T12:00:00Z', parameters: {} }, // 10d → not quiet
      { farmId: 4, sampleDate: null, parameters: {} }, // never sampled → skipped
      { farmId: 5, parameters: {} } // no sampleDate → skipped
    ]
    const quiet = goneQuietFarmers(farms, { now: NOW })
    expect(quiet.map((q) => q.farmId)).toEqual([2, 1])
    expect(quiet[0]).toMatchObject({ farmId: 2, daysSinceSample: 60 })
  })

  it('treats the threshold as exclusive (exactly 30d is not quiet)', () => {
    const farms: FarmPetioleSnapshot[] = [
      { farmId: 1, sampleDate: '2026-05-24T12:00:00Z', parameters: {} } // exactly 30d
    ]
    expect(goneQuietFarmers(farms, { now: NOW })).toHaveLength(0)
  })
})

describe('reviewedNoPlan', () => {
  it('includes reviewed/escalated without a plan; excludes resolved, open, and plan-linked', () => {
    const items = [
      mk({ id: 'r1', status: 'reviewed' }),
      mk({ id: 'r2', status: 'escalated' }),
      mk({ id: 'r3', status: 'reviewed' }), // has a plan
      mk({ id: 'r4', status: 'resolved' }), // deliberately closed
      mk({ id: 'r5', status: 'pending' }),
      mk({ id: 'r6', status: 'in_review' })
    ]
    const out = reviewedNoPlan(items, new Set(['r3']))
    expect(out.map((o) => o.triageId).sort()).toEqual(['r1', 'r2'])
  })

  it('projects the row fields the call list needs', () => {
    const items = [
      mk({
        id: 'r1',
        status: 'reviewed',
        farmId: 7,
        clientUserId: 'c9',
        farmerName: 'Asha',
        farmName: 'North block'
      })
    ]
    expect(reviewedNoPlan(items, new Set())[0]).toMatchObject({
      triageId: 'r1',
      farmId: 7,
      clientUserId: 'c9',
      farmerName: 'Asha',
      farmName: 'North block'
    })
  })
})

describe('oldestOpenReviewDays', () => {
  it('returns the oldest open item age in days, ignoring completed ones', () => {
    const items = [
      mk({ status: 'pending', createdAt: '2026-06-20T12:00:00Z' }), // 3d
      mk({ status: 'in_review', createdAt: '2026-06-13T12:00:00Z' }), // 10d
      mk({ status: 'reviewed', createdAt: '2026-01-01T00:00:00Z' }) // ignored
    ]
    expect(oldestOpenReviewDays(items, { now: NOW })).toBe(10)
  })

  it('is null when nothing is open', () => {
    expect(oldestOpenReviewDays([mk({ status: 'resolved' })], { now: NOW })).toBeNull()
  })
})

describe('farmsWithDeficiency', () => {
  it('counts farms with at least one deficient nutrient', () => {
    const farms: FarmPetioleSnapshot[] = [
      { farmId: 1, parameters: { potassium: 1.0 } }, // K deficient → counts
      { farmId: 2, parameters: { potassium: 2.0 } }, // K optimal
      { farmId: 3, parameters: { potassium: 3.0, sulfur: 0.1 } }, // K excess but S deficient → counts
      { farmId: 4, parameters: null }
    ]
    expect(farmsWithDeficiency(farms)).toBe(2)
  })
})

describe('buildCallList', () => {
  const index = new Map<number, FarmContactRef>([
    [1, { clientUserId: 'c1', farmerName: 'Asha', village: 'Niphad', farmName: 'North' }],
    [2, { clientUserId: 'c2', farmerName: 'Bharat', village: 'Lasalgaon', farmName: 'East' }]
  ])

  it('orders gone-quiet (most overdue first) before reviewed-no-plan, per-farm grain', () => {
    const rows = buildCallList(
      [
        { farmId: 1, daysSinceSample: 40, sampleDate: 'x' },
        { farmId: 2, daysSinceSample: 70, sampleDate: 'y' }
      ],
      [{ triageId: 't1', farmId: 1, clientUserId: 'c1', farmerName: 'Asha', farmName: 'North' }],
      index
    )
    expect(rows.map((r) => r.key)).toEqual(['quiet:2', 'quiet:1', 'no_plan:t1'])
    expect(rows[0]).toMatchObject({ reason: 'quiet', farmId: 2, village: 'Lasalgaon' })
  })

  it('skips gone-quiet with no farmer match but keeps no-plan rows via the triage row', () => {
    const rows = buildCallList(
      [{ farmId: 99, daysSinceSample: 50, sampleDate: 'x' }], // not in index → cannot navigate
      [{ triageId: 't9', farmId: 99, clientUserId: 'c9', farmerName: 'Gone', farmName: 'Plot' }],
      index
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ reason: 'no_plan', clientUserId: 'c9', village: null })
  })
})

describe('groupCallList', () => {
  const index = new Map<number, FarmContactRef>([
    [1, { clientUserId: 'c1', farmerName: 'Asha', village: 'Niphad', farmName: 'North' }],
    [2, { clientUserId: 'c1', farmerName: 'Asha', village: 'Lasalgaon', farmName: 'East' }],
    [3, { clientUserId: 'c2', farmerName: 'Bharat', village: 'Pimpalgaon', farmName: 'West' }]
  ])

  it('collapses one farmer with two quiet farms into a single group', () => {
    const rows = buildCallList(
      [
        { farmId: 1, daysSinceSample: 159, sampleDate: 'x' },
        { farmId: 2, daysSinceSample: 228, sampleDate: 'y' }
      ],
      [],
      index
    )
    const groups = groupCallList(rows)
    expect(groups).toHaveLength(1)
    expect(groups[0]).toMatchObject({ clientUserId: 'c1', farmerName: 'Asha', topReason: 'quiet' })
    expect(groups[0].planRows).toHaveLength(0)
    // Most overdue farm sorts first within the group.
    expect(groups[0].quietFarms.map((f) => f.daysSinceSample)).toEqual([228, 159])
  })

  it('keeps reviewed-no-plan farms as their own rows while quiet farms fold in', () => {
    const rows = buildCallList(
      [{ farmId: 1, daysSinceSample: 40, sampleDate: 'x' }],
      [{ triageId: 't2', farmId: 2, clientUserId: 'c1', farmerName: 'Asha', farmName: 'East' }],
      index
    )
    const groups = groupCallList(rows)
    expect(groups).toHaveLength(1)
    expect(groups[0].quietFarms.map((f) => f.farmId)).toEqual([1])
    expect(groups[0].planRows.map((f) => f.triageId)).toEqual(['t2'])
    // A quiet signal still wins the dot colour for a mixed farmer.
    expect(groups[0].topReason).toBe('quiet')
  })

  it('orders quiet-led farmers (most overdue first) above no-plan-only farmers', () => {
    const rows = buildCallList(
      [{ farmId: 1, daysSinceSample: 50, sampleDate: 'x' }],
      [{ triageId: 't3', farmId: 3, clientUserId: 'c2', farmerName: 'Bharat', farmName: 'West' }],
      index
    )
    const groups = groupCallList(rows)
    expect(groups.map((g) => g.clientUserId)).toEqual(['c1', 'c2'])
    expect(groups[1].topReason).toBe('no_plan')
  })
})

describe('buildFindings', () => {
  it('orders urgent → attention → positive and embeds counts', () => {
    const findings = buildFindings({
      openReviewCount: 4,
      oldestOpenDays: 9, // ≥7 → urgent
      goneQuietCount: 2,
      reviewedNoPlanCount: 1,
      adherencePct: 85 // ≥70 → positive
    })
    expect(findings.map((f) => f.id)).toEqual([
      'open_reviews',
      'gone_quiet',
      'reviewed_no_plan',
      'adherence'
    ])
    expect(findings[0].tone).toBe('urgent')
    expect(findings[3].tone).toBe('positive')
  })

  it('suppresses zero-count findings and null adherence', () => {
    expect(
      buildFindings({
        openReviewCount: 0,
        oldestOpenDays: null,
        goneQuietCount: 0,
        reviewedNoPlanCount: 0,
        adherencePct: null
      })
    ).toEqual([])
  })

  it('keeps adherence as attention (not positive) below the healthy threshold', () => {
    const findings = buildFindings({
      openReviewCount: 0,
      oldestOpenDays: null,
      goneQuietCount: 0,
      reviewedNoPlanCount: 0,
      adherencePct: 40
    })
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ id: 'adherence', tone: 'attention' })
  })

  it('marks open reviews as attention (not urgent) when the oldest is recent', () => {
    const findings = buildFindings({
      openReviewCount: 2,
      oldestOpenDays: 1,
      goneQuietCount: 0,
      reviewedNoPlanCount: 0,
      adherencePct: null
    })
    expect(findings[0]).toMatchObject({ id: 'open_reviews', tone: 'attention' })
  })

  it('uses singular copy for a single item', () => {
    const findings = buildFindings({
      openReviewCount: 1,
      oldestOpenDays: 0,
      goneQuietCount: 1,
      reviewedNoPlanCount: 1,
      adherencePct: null
    })
    const text = (id: string) =>
      findings
        .find((f) => f.id === id)!
        .segments.map((s) => s.text)
        .join('')
    expect(text('open_reviews')).toContain('1 report awaiting review')
    expect(text('gone_quiet')).toContain("1 farmer hasn't sampled")
    expect(text('reviewed_no_plan')).toContain('1 reviewed report has no plan')
  })
})

describe('teamWorkload', () => {
  it('buckets backlog by assignee, collects unassigned, and windows completions', () => {
    const items = [
      mk({ clientUserId: 'c1', status: 'pending' }), // → Asha backlog
      mk({ clientUserId: 'c2', status: 'in_review' }), // → Unassigned backlog
      mk({ clientUserId: 'c1', status: 'reviewed', reviewedBy: 'a', reviewedAt: NOW.toISOString() }) // → Asha completed
    ]
    const rows = teamWorkload(
      items,
      [{ userId: 'a', name: 'Asha' }],
      new Map([
        ['c1', 'a'],
        ['c2', null]
      ]),
      { now: NOW }
    )
    const asha = rows.find((r) => r.memberId === 'a')
    const unassigned = rows.find((r) => r.memberId === null)
    expect(asha).toMatchObject({ openBacklog: 1, completed30d: 1 })
    expect(unassigned).toMatchObject({ name: 'Unassigned', openBacklog: 1 })
  })
})
