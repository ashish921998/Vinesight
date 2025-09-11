import type { Farm } from '@/types/types';
import type { IrrigationRecord, SprayRecord, HarvestRecord, ExpenseRecord } from './supabase'

export interface CostAnalysis {
  totalCosts: number;
  costPerAcre: number;
  profitMargin: number;
  costBreakdown: { category: string; amount: number; percentage: number; }[];
  monthlyTrends: { month: string; costs: number; revenue: number; profit: number; }[];
  roi: number;
}

export interface YieldAnalysis {
  currentYield: number;
  targetYield: number;
  yieldEfficiency: number;
  yieldTrends: { year: string; yield: number; quality: string; }[];
  projectedYield: number;
  benchmarkComparison: { your: number; regional: number; optimal: number; };
}

export interface PerformanceMetrics {
  overallScore: number;
  categories: {
    irrigation: { score: number; trend: 'up' | 'down' | 'stable' };
    nutrition: { score: number; trend: 'up' | 'down' | 'stable' };
    pestManagement: { score: number; trend: 'up' | 'down' | 'stable' };
    yieldQuality: { score: number; trend: 'up' | 'down' | 'stable' };
  };
  recommendations: string[];
  alerts: { type: 'warning' | 'info' | 'success'; message: string; action?: string; }[];
}

export interface AdvancedAnalytics {
  costAnalysis: CostAnalysis;
  yieldAnalysis: YieldAnalysis;
  performanceMetrics: PerformanceMetrics;
  lastUpdated: Date;
}

export class AnalyticsService {
  static async generateAdvancedAnalyticsFromData(
    farms: Farm[],
    data: {
      irrigations: IrrigationRecord[]
      sprays: SprayRecord[]
      harvests: HarvestRecord[]
      expenses: ExpenseRecord[]
      fertigations: any[]
    }
  ): Promise<AdvancedAnalytics> {
    const costAnalysis = this.calculateCostAnalysis(farms, data.expenses, data.harvests)
    const yieldAnalysis = this.calculateYieldAnalysis(farms, data.harvests)
    const performanceMetrics = this.calculatePerformanceMetrics(farms, data)

    return {
      costAnalysis,
      yieldAnalysis,
      performanceMetrics,
      lastUpdated: new Date()
    }
  }

  private static calculateCostAnalysis(farms: Farm[], expenses: ExpenseRecord[], harvests: HarvestRecord[]): CostAnalysis {
    let totalCosts = 0
    let totalRevenue = 0
    const totalArea = farms.reduce((sum, farm) => sum + farm.area, 0)

    const costByCategory = new Map<string, number>()
    const monthlyData = new Map<string, { costs: number; revenue: number }>()

    expenses.forEach(expense => {
      totalCosts += expense.cost
      const existing = costByCategory.get(expense.type) || 0
      costByCategory.set(expense.type, existing + expense.cost)
      const monthYear = new Date(expense.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      const m = monthlyData.get(monthYear) || { costs: 0, revenue: 0 }
      m.costs += expense.cost
      monthlyData.set(monthYear, m)
    })

    harvests.forEach(harvest => {
      const revenue = harvest.quantity * (harvest.price || 0)
      totalRevenue += revenue
      const monthYear = new Date(harvest.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      const m = monthlyData.get(monthYear) || { costs: 0, revenue: 0 }
      m.revenue += revenue
      monthlyData.set(monthYear, m)
    })

    const costBreakdown = Array.from(costByCategory.entries())
      .map(([category, amount]) => ({ category, amount, percentage: totalCosts ? (amount / totalCosts) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount)

    const monthlyTrends = Array.from(monthlyData.entries())
      .map(([month, data]) => ({ month, costs: data.costs, revenue: data.revenue, profit: data.revenue - data.costs }))
      .slice(-12)

    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0
    const roi = totalCosts > 0 ? ((totalRevenue - totalCosts) / totalCosts) * 100 : 0

    return {
      totalCosts,
      costPerAcre: totalArea > 0 ? totalCosts / totalArea : 0,
      profitMargin,
      costBreakdown,
      monthlyTrends,
      roi
    }
  }

  private static calculateYieldAnalysis(farms: Farm[], harvests: HarvestRecord[]): YieldAnalysis {
    let totalYield = 0
    const totalArea = farms.reduce((sum, farm) => sum + farm.area, 0)

    const REGIONAL_BENCHMARK = 12
    const OPTIMAL_BENCHMARK = 18

    const yearlyData = new Map<string, { yield: number; grades: string[] }>()

    harvests.forEach(h => {
      const year = new Date(h.date).getFullYear().toString()
      totalYield += h.quantity / 1000
      const existing = yearlyData.get(year) || { yield: 0, grades: [] as string[] }
      existing.yield += h.quantity / 1000
      existing.grades.push(h.grade)
      yearlyData.set(year, existing)
    })

    const yieldTrends: { year: string; yield: number; quality: string }[] = []
    yearlyData.forEach((data, year) => {
      const avgQuality = this.calculateAverageGrade(data.grades)
      yieldTrends.push({ year, yield: data.yield, quality: avgQuality })
    })

    const currentYieldPerHa = totalArea > 0 ? totalYield / totalArea : 0
    const targetYield = OPTIMAL_BENCHMARK
    const yieldEfficiency = targetYield ? (currentYieldPerHa / targetYield) * 100 : 0
    const projectedYield = this.calculateYieldProjection(yieldTrends, currentYieldPerHa)

    return {
      currentYield: currentYieldPerHa,
      targetYield,
      yieldEfficiency,
      yieldTrends: yieldTrends.slice(-5),
      projectedYield,
      benchmarkComparison: { your: currentYieldPerHa, regional: REGIONAL_BENCHMARK, optimal: OPTIMAL_BENCHMARK }
    }
  }

  private static calculateAverageGrade(grades: string[]): string {
    const gradeScores: { [key: string]: number } = { 'Premium': 5, 'Grade A': 4, 'Grade B': 3, 'Grade C': 2, 'Below Grade': 1 }
    const totalScore = grades.reduce((sum, grade) => sum + (gradeScores[grade] || 2), 0)
    const avgScore = grades.length ? totalScore / grades.length : 0
    if (avgScore >= 4.5) return 'Premium'
    if (avgScore >= 3.5) return 'Grade A'
    if (avgScore >= 2.5) return 'Grade B'
    if (avgScore >= 1.5) return 'Grade C'
    return 'Below Grade'
  }

  private static calculateYieldProjection(trends: { year: string; yield: number }[], current: number): number {
    if (trends.length < 2) return current * 1.05
    const years = trends.map(t => parseInt(t.year))
    const yields = trends.map(t => t.yield)
    const n = trends.length
    const sumX = years.reduce((a, b) => a + b, 0)
    const sumY = yields.reduce((a, b) => a + b, 0)
    const sumXY = years.reduce((sum, year, i) => sum + year * yields[i], 0)
    const sumXX = years.reduce((sum, year) => sum + year * year, 0)
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    const nextYear = Math.max(...years) + 1
    const projection = slope * nextYear + intercept
    return Math.max(projection, current * 0.8)
  }

  private static calculatePerformanceMetrics(
    farms: Farm[],
    data: { irrigations: IrrigationRecord[]; fertigations: any[]; sprays: SprayRecord[]; harvests: HarvestRecord[] }
  ): PerformanceMetrics {
    let irrigationScore = 0
    let nutritionScore = 0
    let pestScore = 0
    let yieldScore = 0

    const recommendations: string[] = []
    const alerts: { type: 'warning' | 'info' | 'success'; message: string; action?: string }[] = []

    const farmCount = Math.max(1, farms.length)

    if (data.irrigations.length > 0) {
      const avgDuration = data.irrigations.reduce((sum, i) => sum + i.duration, 0) / data.irrigations.length
      const firstDate = data.irrigations.reduce((min, r) => Math.min(min, new Date(r.date).getTime()), Date.now())
      const days = Math.max(1, (Date.now() - firstDate) / (1000 * 60 * 60 * 24))
      const irrigationFreq = (data.irrigations.length / days) * 30
      if (avgDuration > 0 && irrigationFreq > 0) irrigationScore += this.scoreIrrigationPractice(avgDuration, irrigationFreq)
    }

    if (data.fertigations.length > 0) nutritionScore += this.scoreFertigationPractice(data.fertigations)

    if (data.sprays.length > 0) pestScore += this.scorePestManagement(data.sprays)

    if (data.harvests.length > 0) {
      const area = farms.reduce((a, f) => a + f.area, 0)
      yieldScore += this.scoreYieldQuality(data.harvests, area)
    }

    irrigationScore = Math.min(100, irrigationScore / farmCount)
    nutritionScore = Math.min(100, nutritionScore / farmCount)
    pestScore = Math.min(100, pestScore / farmCount)
    yieldScore = Math.min(100, yieldScore / farmCount)

    const overallScore = (irrigationScore + nutritionScore + pestScore + yieldScore) / 4

    if (irrigationScore < 70) {
      recommendations.push('Consider optimizing irrigation scheduling and duration')
      alerts.push({ type: 'warning', message: 'Irrigation efficiency could be improved', action: 'Review ETc calculations and adjust schedules' })
    }
    if (nutritionScore < 70) {
      recommendations.push('Review fertigation program and soil test results')
      alerts.push({ type: 'info', message: 'Nutrition management needs attention', action: 'Schedule soil analysis and adjust fertilizer program' })
    }
    if (pestScore < 70) { recommendations.push('Implement integrated pest management practices') }
    if (overallScore > 85) { alerts.push({ type: 'success', message: 'Excellent farm performance! Keep up the great work.' }) }

    return {
      overallScore,
      categories: {
        irrigation: { score: irrigationScore, trend: 'stable' },
        nutrition: { score: nutritionScore, trend: 'stable' },
        pestManagement: { score: pestScore, trend: 'stable' },
        yieldQuality: { score: yieldScore, trend: 'stable' }
      },
      recommendations,
      alerts
    }
  }

  private static scoreIrrigationPractice(avgDuration: number, frequency: number): number {
    let score = 70
    if (avgDuration >= 2 && avgDuration <= 4) score += 15
    else if (avgDuration > 4) score -= 10
    if (frequency >= 12 && frequency <= 16) score += 15
    else if (frequency < 8) score -= 10
    return Math.max(0, score)
  }

  private static scoreFertigationPractice(fertigations: any[]): number {
    let score = 60
    const avgConcentration = fertigations.reduce((sum, f) => {
      const conc = parseFloat(f.concentration?.toString() || '0')
      return sum + (isNaN(conc) ? 0 : conc)
    }, 0) / fertigations.length
    const avgPH = fertigations.reduce((sum, f) => {
      const ph = parseFloat(f.phLevel?.toString() || '0')
      return sum + (isNaN(ph) ? 0 : ph)
    }, 0) / fertigations.length
    if (avgPH >= 6.0 && avgPH <= 6.8) score += 20
    if (fertigations.length >= 4) score += 20
    return Math.max(0, score)
  }

  private static scorePestManagement(sprays: any[]): number {
    let score = 75
    if (sprays.length === 0) return 90
    const preventiveCount = sprays.filter((s: any) => s.pest_disease?.toLowerCase().includes('preventive') || s.pest_disease?.toLowerCase().includes('prophylactic')).length
    const preventiveRatio = preventiveCount / sprays.length
    if (preventiveRatio > 0.5) score += 15
    if (sprays.length <= 6) score += 10
    return Math.max(0, score)
  }

  private static scoreYieldQuality(harvests: any[], area: number): number {
    let score = 60
    const totalYield = harvests.reduce((sum, h) => sum + h.quantity, 0) / 1000
    const yieldPerHa = area > 0 ? totalYield / area : 0
    if (yieldPerHa >= 15) score += 25
    else if (yieldPerHa >= 12) score += 15
    else if (yieldPerHa >= 8) score += 5
    const gradeScores: { [key: string]: number } = { 'Premium': 15, 'Grade A': 10, 'Grade B': 5, 'Grade C': 0, 'Below Grade': -5 }
    const avgGradeScore = harvests.reduce((sum, h) => sum + (gradeScores[h.grade] || 0), 0) / (harvests.length || 1)
    score += avgGradeScore
    return Math.max(0, score)
  }
}
