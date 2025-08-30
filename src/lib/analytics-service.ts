import { CloudDataService } from './cloud-data-service';
import type { Farm } from './supabase';

export interface CostAnalysis {
  totalCosts: number;
  costPerHectare: number;
  profitMargin: number;
  costBreakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  monthlyTrends: {
    month: string;
    costs: number;
    revenue: number;
    profit: number;
  }[];
  roi: number;
}

export interface YieldAnalysis {
  currentYield: number;
  targetYield: number;
  yieldEfficiency: number;
  yieldTrends: {
    year: string;
    yield: number;
    quality: string;
  }[];
  projectedYield: number;
  benchmarkComparison: {
    your: number;
    regional: number;
    optimal: number;
  };
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
  alerts: {
    type: 'warning' | 'info' | 'success';
    message: string;
    action?: string;
  }[];
}

export interface AdvancedAnalytics {
  costAnalysis: CostAnalysis;
  yieldAnalysis: YieldAnalysis;
  performanceMetrics: PerformanceMetrics;
  lastUpdated: Date;
}

export class AnalyticsService {
  static async generateAdvancedAnalytics(farms: Farm[]): Promise<AdvancedAnalytics> {
    const costAnalysis = await this.calculateCostAnalysis(farms);
    const yieldAnalysis = await this.calculateYieldAnalysis(farms);
    const performanceMetrics = await this.calculatePerformanceMetrics(farms);

    return {
      costAnalysis,
      yieldAnalysis,
      performanceMetrics,
      lastUpdated: new Date()
    };
  }

  private static async calculateCostAnalysis(farms: Farm[]): Promise<CostAnalysis> {
    let totalCosts = 0;
    let totalRevenue = 0;
    const totalArea = farms.reduce((sum, farm) => sum + farm.area, 0);

    const costByCategory = new Map<string, number>();
    const monthlyData = new Map<string, { costs: number; revenue: number }>();

    // Collect expense and harvest data
    for (const farm of farms) {
      try {
        // Get expenses
        const expenses = await CloudDataService.getExpenseRecords(farm.id!);
        expenses.forEach(expense => {
          totalCosts += expense.cost;
          const existing = costByCategory.get(expense.type) || 0;
          costByCategory.set(expense.type, existing + expense.cost);

          // Monthly tracking
          const monthYear = new Date(expense.date).toLocaleDateString('en-US', { 
            month: 'short', 
            year: '2-digit' 
          });
          const monthData = monthlyData.get(monthYear) || { costs: 0, revenue: 0 };
          monthData.costs += expense.cost;
          monthlyData.set(monthYear, monthData);
        });

        // Get harvest revenue
        const harvests = await CloudDataService.getHarvestRecords(farm.id!);
        harvests.forEach(harvest => {
          const revenue = harvest.quantity * (harvest.price || 0);
          totalRevenue += revenue;

          const monthYear = new Date(harvest.date).toLocaleDateString('en-US', { 
            month: 'short', 
            year: '2-digit' 
          });
          const monthData = monthlyData.get(monthYear) || { costs: 0, revenue: 0 };
          monthData.revenue += revenue;
          monthlyData.set(monthYear, monthData);
        });
      } catch (error) {
        console.error(`Error calculating costs for farm ${farm.name}:`, error);
      }
    }

    // Calculate cost breakdown
    const costBreakdown = Array.from(costByCategory.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalCosts) * 100
      }))
      .sort((a, b) => b.amount - a.amount);

    // Monthly trends (last 12 months)
    const monthlyTrends = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        costs: data.costs,
        revenue: data.revenue,
        profit: data.revenue - data.costs
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-12);

    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0;
    const roi = totalCosts > 0 ? ((totalRevenue - totalCosts) / totalCosts) * 100 : 0;

    return {
      totalCosts,
      costPerHectare: totalArea > 0 ? totalCosts / totalArea : 0,
      profitMargin,
      costBreakdown,
      monthlyTrends,
      roi
    };
  }

  private static async calculateYieldAnalysis(farms: Farm[]): Promise<YieldAnalysis> {
    let totalYield = 0;
    const totalArea = farms.reduce((sum, farm) => sum + farm.area, 0);
    
    // Industry benchmarks for grape yields (tons/hectare)
    const REGIONAL_BENCHMARK = 12; // Average for Maharashtra
    const OPTIMAL_BENCHMARK = 18;  // Best practices yield

    const yieldTrends: { year: string; yield: number; quality: string }[] = [];

    // Collect harvest data for yield calculation
    for (const farm of farms) {
      try {
        const harvests = await CloudDataService.getHarvestRecords(farm.id!);
        const farmYield = harvests.reduce((sum, h) => sum + h.quantity, 0) / 1000; // Convert kg to tons
        totalYield += farmYield;

        // Group by year for trends
        const yearlyData = new Map<string, { yield: number; grades: string[] }>();
        harvests.forEach(harvest => {
          const year = new Date(harvest.date).getFullYear().toString();
          const existing = yearlyData.get(year) || { yield: 0, grades: [] };
          existing.yield += harvest.quantity / 1000; // Convert to tons
          existing.grades.push(harvest.grade);
          yearlyData.set(year, existing);
        });

        // Add to trends
        yearlyData.forEach((data, year) => {
          const avgQuality = this.calculateAverageGrade(data.grades);
          yieldTrends.push({
            year,
            yield: data.yield,
            quality: avgQuality
          });
        });
      } catch (error) {
        console.error(`Error calculating yield for farm ${farm.name}:`, error);
      }
    }

    const currentYieldPerHa = totalArea > 0 ? totalYield / totalArea : 0;
    const targetYield = OPTIMAL_BENCHMARK;
    const yieldEfficiency = (currentYieldPerHa / targetYield) * 100;

    // Simple yield projection based on trend
    const projectedYield = this.calculateYieldProjection(yieldTrends, currentYieldPerHa);

    return {
      currentYield: currentYieldPerHa,
      targetYield,
      yieldEfficiency,
      yieldTrends: yieldTrends.slice(-5), // Last 5 years
      projectedYield,
      benchmarkComparison: {
        your: currentYieldPerHa,
        regional: REGIONAL_BENCHMARK,
        optimal: OPTIMAL_BENCHMARK
      }
    };
  }

  private static calculateAverageGrade(grades: string[]): string {
    const gradeScores: { [key: string]: number } = {
      'Premium': 5,
      'Grade A': 4,
      'Grade B': 3,
      'Grade C': 2,
      'Below Grade': 1
    };

    const totalScore = grades.reduce((sum, grade) => sum + (gradeScores[grade] || 2), 0);
    const avgScore = totalScore / grades.length;

    if (avgScore >= 4.5) return 'Premium';
    if (avgScore >= 3.5) return 'Grade A';
    if (avgScore >= 2.5) return 'Grade B';
    if (avgScore >= 1.5) return 'Grade C';
    return 'Below Grade';
  }

  private static calculateYieldProjection(trends: { year: string; yield: number }[], current: number): number {
    if (trends.length < 2) return current * 1.05; // Conservative 5% growth

    // Simple linear regression for trend
    const years = trends.map(t => parseInt(t.year));
    const yields = trends.map(t => t.yield);
    
    const n = trends.length;
    const sumX = years.reduce((a, b) => a + b, 0);
    const sumY = yields.reduce((a, b) => a + b, 0);
    const sumXY = years.reduce((sum, year, i) => sum + year * yields[i], 0);
    const sumXX = years.reduce((sum, year) => sum + year * year, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const nextYear = Math.max(...years) + 1;
    const projection = slope * nextYear + intercept;

    return Math.max(projection, current * 0.8); // Minimum 80% of current
  }

  private static async calculatePerformanceMetrics(farms: Farm[]): Promise<PerformanceMetrics> {
    let irrigationScore = 0;
    let nutritionScore = 0;
    let pestScore = 0;
    let yieldScore = 0;

    const recommendations: string[] = [];
    const alerts: { type: 'warning' | 'info' | 'success'; message: string; action?: string }[] = [];

    for (const farm of farms) {
      try {
        // Irrigation efficiency analysis
        const irrigations = await CloudDataService.getIrrigationRecords(farm.id!);
        const avgDuration = irrigations.reduce((sum, i) => sum + i.duration, 0) / irrigations.length;
        const irrigationFreq = irrigations.length / 30; // Per month approximation

        if (avgDuration > 0 && irrigationFreq > 0) {
          // Score based on optimal irrigation practices
          irrigationScore += this.scoreIrrigationPractice(avgDuration, irrigationFreq);
        }

        // Nutrition management
        const fertigations = await CloudDataService.getFertigationRecords(farm.id!);
        if (fertigations.length > 0) {
          nutritionScore += this.scoreFertigationPractice(fertigations);
        }

        // Pest management
        const sprays = await CloudDataService.getSprayRecords(farm.id!);
        pestScore += this.scorePestManagement(sprays);

        // Yield quality
        const harvests = await CloudDataService.getHarvestRecords(farm.id!);
        if (harvests.length > 0) {
          yieldScore += this.scoreYieldQuality(harvests, farm.area);
        }

      } catch (error) {
        console.error(`Error calculating performance for farm ${farm.name}:`, error);
      }
    }

    // Average scores
    const farmCount = farms.length || 1;
    irrigationScore = Math.min(100, irrigationScore / farmCount);
    nutritionScore = Math.min(100, nutritionScore / farmCount);
    pestScore = Math.min(100, pestScore / farmCount);
    yieldScore = Math.min(100, yieldScore / farmCount);

    const overallScore = (irrigationScore + nutritionScore + pestScore + yieldScore) / 4;

    // Generate recommendations
    if (irrigationScore < 70) {
      recommendations.push("Consider optimizing irrigation scheduling and duration");
      alerts.push({
        type: 'warning',
        message: 'Irrigation efficiency could be improved',
        action: 'Review ETc calculations and adjust schedules'
      });
    }

    if (nutritionScore < 70) {
      recommendations.push("Review fertigation program and soil test results");
      alerts.push({
        type: 'info',
        message: 'Nutrition management needs attention',
        action: 'Schedule soil analysis and adjust fertilizer program'
      });
    }

    if (pestScore < 70) {
      recommendations.push("Implement integrated pest management practices");
    }

    if (overallScore > 85) {
      alerts.push({
        type: 'success',
        message: 'Excellent farm performance! Keep up the great work.'
      });
    }

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
    };
  }

  private static scoreIrrigationPractice(avgDuration: number, frequency: number): number {
    // Optimal: 2-4 hours per session, 3-4 times per week
    let score = 70; // Base score

    if (avgDuration >= 2 && avgDuration <= 4) score += 15;
    else if (avgDuration > 4) score -= 10;

    if (frequency >= 12 && frequency <= 16) score += 15; // 3-4 times per week
    else if (frequency < 8) score -= 10;

    return Math.max(0, score);
  }

  private static scoreFertigationPractice(fertigations: any[]): number {
    let score = 60; // Base score

    const avgConcentration = fertigations.reduce((sum, f) => {
      const conc = parseFloat(f.concentration?.toString() || '0');
      return sum + (isNaN(conc) ? 0 : conc);
    }, 0) / fertigations.length;

    const avgPH = fertigations.reduce((sum, f) => {
      const ph = parseFloat(f.phLevel?.toString() || '0');
      return sum + (isNaN(ph) ? 0 : ph);
    }, 0) / fertigations.length;

    // Optimal pH: 6.0-6.8 for grapes
    if (avgPH >= 6.0 && avgPH <= 6.8) score += 20;
    
    // Regular fertigation schedule
    if (fertigations.length >= 4) score += 20; // At least weekly

    return Math.max(0, score);
  }

  private static scorePestManagement(sprays: any[]): number {
    let score = 75; // Base score

    if (sprays.length === 0) return 90; // No pests is good

    // Preventive vs reactive spraying
    const preventiveCount = sprays.filter(s => 
      s.pestDisease?.toLowerCase().includes('preventive') || 
      s.pestDisease?.toLowerCase().includes('prophylactic')
    ).length;

    const preventiveRatio = preventiveCount / sprays.length;
    if (preventiveRatio > 0.5) score += 15;

    // Frequency - not too many sprays
    if (sprays.length <= 6) score += 10; // Conservative spraying

    return Math.max(0, score);
  }

  private static scoreYieldQuality(harvests: any[], area: number): number {
    let score = 60; // Base score

    const totalYield = harvests.reduce((sum, h) => sum + h.quantity, 0) / 1000; // Convert to tons
    const yieldPerHa = totalYield / area;

    // Yield scoring (based on tons/hectare)
    if (yieldPerHa >= 15) score += 25; // Excellent yield
    else if (yieldPerHa >= 12) score += 15; // Good yield
    else if (yieldPerHa >= 8) score += 5; // Average yield

    // Quality scoring
    const gradeScores: { [key: string]: number } = {
      'Premium': 15,
      'Grade A': 10,
      'Grade B': 5,
      'Grade C': 0,
      'Below Grade': -5
    };

    const avgGradeScore = harvests.reduce((sum, h) => sum + (gradeScores[h.grade] || 0), 0) / harvests.length;
    score += avgGradeScore;

    return Math.max(0, score);
  }
}