import { describe, expect, it } from 'vitest'
import type { TriageItem } from '../consultant-triage-service'
import {
  adherenceSummary,
  avgTimeToReviewDays,
  farmsWithPetioleData,
  nutrientStatusAcrossFarms,
  openReviewCount,
  severityCounts,
  statusCounts,
  teamWorkload,
  throughputTotal,
  weeklyThroughput
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
