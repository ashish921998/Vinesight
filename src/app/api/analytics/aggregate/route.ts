import { NextRequest } from 'next/server'
import { z } from 'zod'
import { fetchAggregatedData, type TimeRange } from '@/lib/analytics-server'
import { AnalyticsService } from '@/lib/analytics-service'
import { logger } from '@/lib/logger'

const InputSchema = z.object({ range: z.enum(['30d','90d','1y']).default('30d') })

export async function POST(req: NextRequest) {
  const t0 = performance.now()
  try {
    const body = await req.json().catch(() => ({}))
    const { range } = InputSchema.parse(body)

    const aggregated = await fetchAggregatedData(range as TimeRange)
    const farmMap = new Map<number, string>()
    aggregated.farms.forEach(f => { if (f.id) farmMap.set(f.id, f.name) })

    const totalFarms = aggregated.farms.length
    const totalArea = aggregated.farms.reduce((s, f) => s + f.area, 0)

    const totalIrrigationHours = aggregated.irrigations.reduce((s, r) => s + r.duration, 0)
    const totalHarvestQuantity = aggregated.harvests.reduce((s, r) => s + r.quantity, 0)
    const totalHarvestValue = aggregated.harvests.reduce((s, r) => s + r.quantity * (r.price || 0), 0)

    const irrigationsByMonthMap = new Map<string, { hours: number; count: number }>()
    aggregated.irrigations.forEach(r => {
      const monthYear = new Date(r.date).toLocaleString('default', { month: 'short', year: '2-digit' })
      const m = irrigationsByMonthMap.get(monthYear) || { hours: 0, count: 0 }
      m.hours += r.duration
      m.count += 1
      irrigationsByMonthMap.set(monthYear, m)
    })
    const irrigationsByMonth = Array.from(irrigationsByMonthMap.entries()).map(([month, m]) => ({ month, ...m })).slice(-6)

    const spraysByTypeMap = new Map<string, number>()
    aggregated.sprays.forEach(r => {
      const type = (r as any).pest_disease || r.chemical || 'unknown'
      spraysByTypeMap.set(type, (spraysByTypeMap.get(type) || 0) + 1)
    })
    const spraysByType = Array.from(spraysByTypeMap.entries()).map(([type, count]) => ({ type, count })).sort((a,b) => b.count - a.count).slice(0,5)

    const harvestsByFarmMap = new Map<number, { quantity: number; value: number }>()
    aggregated.harvests.forEach(h => {
      const m = harvestsByFarmMap.get(h.farm_id) || { quantity: 0, value: 0 }
      m.quantity += h.quantity
      m.value += h.quantity * (h.price || 0)
      harvestsByFarmMap.set(h.farm_id, m)
    })
    const harvestsByFarm = Array.from(harvestsByFarmMap.entries()).map(([fid, agg]) => ({ farmName: farmMap.get(fid) || `Farm ${fid}` , quantity: agg.quantity, value: agg.value }))

    const recentActivity: { type: 'irrigation' | 'spray' | 'harvest'; farmName: string; date: string; details: string }[] = []
    aggregated.irrigations.slice(-5).forEach(r => recentActivity.push({ type: 'irrigation', farmName: farmMap.get(r.farm_id) || 'Farm', date: r.date, details: `${r.duration}h irrigation - ${r.growth_stage}` }))
    aggregated.sprays.slice(-5).forEach(r => recentActivity.push({ type: 'spray', farmName: farmMap.get(r.farm_id) || 'Farm', date: r.date, details: `${(r as any).pest_disease || 'Treatment'} with ${r.chemical}` }))
    aggregated.harvests.slice(-5).forEach(r => recentActivity.push({ type: 'harvest', farmName: farmMap.get(r.farm_id) || 'Farm', date: r.date, details: `${r.quantity}kg harvested - ${r.grade} grade` }))

    const analyticsData = {
      totalFarms,
      totalArea,
      totalIrrigationHours,
      totalHarvestQuantity,
      totalHarvestValue,
      irrigationsByMonth,
      spraysByType,
      harvestsByFarm,
      recentActivity: recentActivity.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0,10)
    }

    const advanced = await AnalyticsService.generateAdvancedAnalyticsFromData(aggregated.farms, {
      irrigations: aggregated.irrigations,
      sprays: aggregated.sprays,
      harvests: aggregated.harvests,
      expenses: aggregated.expenses,
      fertigations: aggregated.fertigations
    })

    const t1 = performance.now()
    logger.info(`Analytics aggregation API ${(t1 - t0).toFixed(1)}ms`)

    return new Response(JSON.stringify({ analytics: analyticsData, advanced, farms: aggregated.farms }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Aggregation failed' }), { status: 500 })
  }
}
