import test from 'node:test'
import assert from 'node:assert/strict'
import { AnalyticsService } from '@/lib/analytics-service'

const farms = [
  { id: 1, name: 'A', area: 2 } as any,
  { id: 2, name: 'B', area: 3 } as any
]

const harvests = [
  { farm_id: 1, date: '2025-01-10', quantity: 1000, grade: 'Grade A', price: 20 },
  { farm_id: 2, date: '2025-01-20', quantity: 2000, grade: 'Grade B', price: 15 }
] as any

const expenses = [
  { farm_id: 1, date: '2025-01-05', type: 'labor', description: 'x', cost: 100 },
  { farm_id: 2, date: '2025-01-07', type: 'materials', description: 'y', cost: 200 }
] as any

const irrigations = [
  { farm_id: 1, date: '2025-01-02', duration: 2 },
  { farm_id: 2, date: '2025-01-03', duration: 3 }
] as any

const sprays = [] as any
const fertigations = [] as any

test('advanced analytics from aggregated data', async () => {
  const adv = await AnalyticsService.generateAdvancedAnalyticsFromData(farms, { irrigations, sprays, harvests, expenses, fertigations })
  assert.ok(adv.costAnalysis.totalCosts >= 300)
  assert.ok(adv.yieldAnalysis.currentYield > 0)
  assert.ok(adv.performanceMetrics.overallScore >= 0)
})
