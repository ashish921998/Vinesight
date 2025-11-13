import { supabase } from './supabase'
import { PestPredictionService } from './pest-prediction-service'
import { SmartTaskGenerator } from './smart-task-generator'
import { WeatherService } from './weather-service'
import { AIInsight } from '../types/ai'

export type { AIInsight }

export class AIInsightsService {
  // Simple in-memory cache for insights (5 minute TTL)
  private static insightsCache = new Map<string, { data: AIInsight[]; timestamp: number }>()
  private static categoriesCache = new Map<
    string,
    { data: Record<string, AIInsight[]>; timestamp: number }
  >()
  private static CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Get cached insights if available and not expired
   */
  private static getCachedInsights(farmId: number, userId: string): AIInsight[] | null {
    const cacheKey = `${farmId}_${userId}`
    const cached = this.insightsCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    return null
  }

  /**
   * Cache insights for future requests
   */
  private static setCachedInsights(farmId: number, userId: string, insights: AIInsight[]): void {
    const cacheKey = `${farmId}_${userId}`
    this.insightsCache.set(cacheKey, {
      data: insights,
      timestamp: Date.now()
    })
  }

  /**
   * Get all AI insights for a farm, sorted by priority and relevance
   */
  static async getInsightsForFarm(
    farmId: number,
    userId: string,
    limit = 10
  ): Promise<AIInsight[]> {
    try {
      // Check cache first
      const cachedInsights = this.getCachedInsights(farmId, userId)
      if (cachedInsights) {
        return cachedInsights.slice(0, limit)
      }

      const insights: AIInsight[] = []

      // Get farm data for context
      const { data: farm } = await supabase.from('farms').select('*').eq('id', farmId).single()

      if (!farm) return []

      // 1. Pest & Disease Alerts
      const pestPredictions = await PestPredictionService.getActivePredictions(farmId)
      const criticalPests = pestPredictions.filter(
        (p) => p.riskLevel === 'critical' || p.riskLevel === 'high'
      )

      criticalPests.forEach((pest) => {
        const daysUntil = Math.ceil(
          (pest.predictedOnsetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )
        insights.push({
          id: `pest_${pest.id}`,
          type: 'pest_prediction',
          priority: pest.riskLevel === 'critical' ? 'critical' : 'high',
          title: `${pest.pestDiseaseType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} Risk`,
          subtitle:
            daysUntil > 0 ? `Prevention window: ${daysUntil} days` : 'Immediate action needed',
          icon: 'AlertTriangle',
          actionLabel: pest.riskLevel === 'critical' ? 'Apply Treatment' : 'View Prevention',
          actionType: 'navigate',
          actionData: {
            route: `/farms/${farmId}/pest-alerts`,
            pestId: pest.id,
            expiresAt: pest.predictedOnsetDate
          },
          confidence: pest.probabilityScore,
          timeRelevant: daysUntil <= 7,
          tags: ['pest', 'disease', 'prevention']
        })
      })

      // 2. Smart Task Recommendations
      const taskRecommendations = await SmartTaskGenerator.getActiveRecommendations(farmId)
      const highPriorityTasks = taskRecommendations.filter((t) => t.priorityScore >= 0.7)

      highPriorityTasks.slice(0, 3).forEach((task) => {
        insights.push({
          id: `task_${task.id}`,
          type: 'task_recommendation',
          priority:
            task.priorityScore >= 0.9 ? 'critical' : task.priorityScore >= 0.8 ? 'high' : 'medium',
          title: this.getTaskTitle(task.taskType),
          subtitle: task.reasoning.substring(0, 60) + '...',
          icon: this.getTaskIcon(task.taskType),
          actionLabel: task.weatherDependent ? 'Check Weather & Execute' : 'Execute Now',
          actionType: 'execute',
          actionData: {
            taskId: task.id,
            taskType: task.taskType,
            expiresAt: task.expiresAt ? new Date(task.expiresAt) : undefined
          },
          confidence: task.confidenceScore,
          timeRelevant: true,
          tags: ['task', 'recommendation', task.taskType]
        })
      })

      // 3. AI-Powered Weather-Based Insights
      try {
        const weatherData = await WeatherService.getCurrentWeather(farmId)
        const activities = await this.getRecentActivities(farmId)

        // Call weather insights server action
        const { generateWeatherInsights } = await import('@/actions')
        const result = await generateWeatherInsights({
          weatherData,
          farmData: farm,
          history: activities
        })

        if (!result.success || !result.data) throw new Error('Server action failed')
        const aiWeatherInsights = result.data

        // Convert AI insights to our format
        aiWeatherInsights.forEach((aiInsight: any, index: number) => {
          insights.push({
            id: `ai_weather_${index}`,
            type: 'weather_alert',
            priority: aiInsight.priority,
            title: aiInsight.title,
            subtitle: aiInsight.subtitle,
            icon: 'CloudRain',
            actionLabel: aiInsight.actionLabel,
            actionType: 'navigate',
            actionData: { route: `/farms/${farmId}/weather` },
            confidence: aiInsight.confidence,
            timeRelevant: aiInsight.timeRelevant,
            tags: ['weather', 'ai', 'advisory']
          })
        })
      } catch (error) {
        console.warn('AI weather insights unavailable, falling back:', error)
        // Fallback to basic weather insights
        try {
          const weatherData = await WeatherService.getCurrentWeather(farmId)
          const basicWeatherInsights = this.generateWeatherInsights(weatherData, farm)
          insights.push(...basicWeatherInsights)
        } catch (fallbackError) {
          console.warn('Weather insights completely unavailable:', fallbackError)
        }
      }

      // 4. Financial Insights (Mock for now - can be enhanced with real data)
      const financialInsights = await this.getFinancialInsights(farmId)
      insights.push(...financialInsights)

      // 5. Growth Stage Optimization
      const growthInsights = await this.getGrowthOptimizationInsights(farmId, farm)
      insights.push(...growthInsights)

      // Sort by priority and time relevance
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }

      const sortedInsights = insights
        .sort((a, b) => {
          // First by priority
          const aPriority = priorityOrder[a.priority]
          const bPriority = priorityOrder[b.priority]
          if (aPriority !== bPriority) return aPriority - bPriority

          // Then by time relevance
          if (a.timeRelevant && !b.timeRelevant) return -1
          if (!a.timeRelevant && b.timeRelevant) return 1

          // Finally by confidence
          return b.confidence - a.confidence
        })
        .slice(0, limit)

      // Cache the results
      this.setCachedInsights(farmId, userId, sortedInsights)

      return sortedInsights
    } catch (error) {
      console.error('Error getting AI insights:', error)
      return []
    }
  }

  /**
   * Generate weather-based insights
   */
  private static generateWeatherInsights(weatherData: any, farm: any): AIInsight[] {
    const insights: AIInsight[] = []

    if (weatherData.humidity > 80 && weatherData.temperature > 20) {
      insights.push({
        id: 'weather_fungal_risk',
        type: 'weather_alert',
        priority: 'high',
        title: 'High Fungal Disease Risk',
        subtitle: `${weatherData.humidity}% humidity, ${weatherData.temperature}°C`,
        icon: 'CloudRain',
        actionLabel: 'Check Prevention Plan',
        actionType: 'navigate',
        actionData: { route: `/farms/${farm.id}/pest-alerts` },
        confidence: 0.85,
        timeRelevant: true,
        tags: ['weather', 'disease', 'prevention']
      })
    }

    if (weatherData.wind_speed > 15) {
      insights.push({
        id: 'weather_spray_warning',
        type: 'weather_alert',
        priority: 'medium',
        title: 'High Wind - Avoid Spraying',
        subtitle: `Wind speed: ${weatherData.wind_speed} km/h`,
        icon: 'Wind',
        actionLabel: 'Check Forecast',
        actionType: 'navigate',
        actionData: { route: `/farms/${farm.id}/weather` },
        confidence: 0.9,
        timeRelevant: true,
        tags: ['weather', 'spray', 'safety']
      })
    }

    return insights
  }

  /**
   * Get AI-powered financial insights with dynamic baselines
   */
  private static async getFinancialInsights(farmId: number): Promise<AIInsight[]> {
    try {
      // Get recent expense data
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const { data: recentExpenses } = await supabase
        .from('expense_records')
        .select('*')
        .eq('farm_id', farmId)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])

      if (!recentExpenses || recentExpenses.length === 0) return []

      // Get historical data for AI analysis
      const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
      const { data: historicalExpenses } = await supabase
        .from('expense_records')
        .select('*')
        .eq('farm_id', farmId)
        .gte('date', sixMonthsAgo.toISOString().split('T')[0])
        .lt('date', thirtyDaysAgo.toISOString().split('T')[0])

      // Use AI to analyze financial patterns
      const { generateFinancialAnalysis } = await import('@/actions')
      const result = await generateFinancialAnalysis({
        expenses: recentExpenses,
        historicalData: historicalExpenses || []
      })

      if (!result.success || !result.data) throw new Error('Financial analysis failed')
      const aiAnalysis = result.data

      const insights: AIInsight[] = []
      const totalSpent = recentExpenses.reduce((sum, exp) => sum + exp.cost, 0)

      // Create insights based on AI analysis
      if (aiAnalysis.confidence > 0.7) {
        const priority = Math.abs(aiAnalysis.varianceFromAverage) > 25 ? 'high' : 'medium'

        insights.push({
          id: 'ai_financial_analysis',
          type: 'profitability_insight',
          priority,
          title: this.getFinancialInsightTitle(aiAnalysis.trend, aiAnalysis.varianceFromAverage),
          subtitle: aiAnalysis.recommendation.substring(0, 60) + '...',
          icon:
            aiAnalysis.trend === 'increasing'
              ? 'TrendingUp'
              : aiAnalysis.trend === 'decreasing'
                ? 'TrendingDown'
                : 'DollarSign',
          actionLabel: 'View Analysis',
          actionType: 'navigate',
          actionData: {
            route: `/farms/${farmId}/reports`,
            analysis: aiAnalysis
          },
          confidence: aiAnalysis.confidence,
          timeRelevant: true,
          tags: ['finance', 'ai', aiAnalysis.trend, 'analysis']
        })
      }

      // Add risk factors as separate insights if significant
      if (aiAnalysis.riskFactors.length > 0 && aiAnalysis.confidence > 0.8) {
        aiAnalysis.riskFactors.slice(0, 2).forEach((risk: any, index: number) => {
          insights.push({
            id: `financial_risk_${index}`,
            type: 'profitability_insight',
            priority: 'medium',
            title: 'Financial Risk Detected',
            subtitle: risk.substring(0, 60) + '...',
            icon: 'AlertTriangle',
            actionLabel: 'Review Risk',
            actionType: 'navigate',
            actionData: { route: `/farms/${farmId}/reports` },
            confidence: aiAnalysis.confidence,
            timeRelevant: true,
            tags: ['finance', 'risk', 'ai']
          })
        })
      }

      return insights
    } catch (error) {
      console.warn('AI financial analysis failed, using fallback:', error)

      // Fallback to basic analysis
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const { data: expenses } = await supabase
          .from('expense_records')
          .select('*')
          .eq('farm_id', farmId)
          .gte('date', thirtyDaysAgo.toISOString().split('T')[0])

        if (!expenses || expenses.length === 0) return []

        const totalSpent = expenses.reduce((sum, exp) => sum + exp.cost, 0)
        const avgMonthlySpend = 15000 // Basic fallback baseline

        const insights: AIInsight[] = []

        if (totalSpent > avgMonthlySpend * 1.2) {
          insights.push({
            id: 'financial_overspend_fallback',
            type: 'profitability_insight',
            priority: 'medium',
            title: `Spending Above Average: ₹${totalSpent.toLocaleString()}`,
            subtitle: 'Basic analysis - consider detailed review',
            icon: 'DollarSign',
            actionLabel: 'View Breakdown',
            actionType: 'navigate',
            actionData: { route: `/farms/${farmId}/reports` },
            confidence: 0.6,
            timeRelevant: true,
            tags: ['finance', 'expense', 'fallback']
          })
        }

        return insights
      } catch (fallbackError) {
        console.error('Financial insights completely failed:', fallbackError)
        return []
      }
    }
  }

  /**
   * Generate financial insight title based on AI analysis
   */
  private static getFinancialInsightTitle(trend: string, variance: number): string {
    const absVariance = Math.abs(variance)

    if (trend === 'increasing') {
      return absVariance > 30
        ? 'High Spending Increase Detected'
        : absVariance > 15
          ? 'Moderate Spending Increase'
          : 'Spending Trending Up'
    } else if (trend === 'decreasing') {
      return absVariance > 30
        ? 'Significant Cost Reduction'
        : absVariance > 15
          ? 'Spending Optimization Detected'
          : 'Costs Trending Down'
    } else {
      return 'Stable Spending Pattern'
    }
  }

  /**
   * Get AI-powered growth stage optimization insights
   */
  private static async getGrowthOptimizationInsights(
    farmId: number,
    farm: any
  ): Promise<AIInsight[]> {
    const insights: AIInsight[] = []

    try {
      // Get recent activities for context
      const activities = await this.getRecentActivities(farmId)
      const weatherData = await WeatherService.getCurrentWeather(farm.region)

      // AI-powered growth stage analysis
      const { generateGrowthAnalysis } = await import('@/actions')
      const result = await generateGrowthAnalysis({
        farmData: farm,
        activities
      })

      if (!result.success || !result.data) throw new Error('Growth analysis failed')
      const growthAnalysis = result.data

      if (growthAnalysis.confidence > 0.6) {
        insights.push({
          id: 'ai_growth_stage',
          type: 'general_advice',
          priority: growthAnalysis.timeRelevant ? 'high' : 'medium',
          title: this.getGrowthStageTitle(growthAnalysis.stage),
          subtitle: growthAnalysis.description,
          icon: 'Sprout',
          actionLabel: 'View Recommendations',
          actionType: 'navigate',
          actionData: {
            route: `/farms/${farmId}/growth-guide`,
            recommendations: growthAnalysis.recommendations,
            analysis: growthAnalysis
          },
          confidence: growthAnalysis.confidence,
          timeRelevant: growthAnalysis.timeRelevant,
          tags: ['growth', 'ai', growthAnalysis.stage, 'optimization']
        })
      }
    } catch (error) {
      console.warn('AI growth stage analysis failed, using fallback:', error)

      // Fallback to basic month-based analysis
      const currentMonth = new Date().getMonth()
      if (currentMonth >= 2 && currentMonth <= 4) {
        // March-May: Flowering/Fruit Set
        insights.push({
          id: 'growth_flowering_fallback',
          type: 'general_advice',
          priority: 'high',
          title: 'Critical Flowering Stage',
          subtitle: 'Traditional seasonal analysis - optimize pollination',
          icon: 'Sprout',
          actionLabel: 'View Care Plan',
          actionType: 'navigate',
          actionData: { route: `/farms/${farmId}/growth-guide` },
          confidence: 0.6,
          timeRelevant: true,
          tags: ['growth', 'flowering', 'fallback']
        })
      }
    }

    return insights
  }

  /**
   * Get human-readable growth stage title
   */
  private static getGrowthStageTitle(stage: string): string {
    const titles: Record<string, string> = {
      bud_break: 'Bud Break Stage',
      leaf_development: 'Leaf Development Phase',
      flowering: 'Critical Flowering Stage',
      fruit_set: 'Fruit Set Period',
      veraison: 'Veraison Stage',
      harvest: 'Harvest Time',
      dormancy: 'Dormancy Period'
    }

    return (
      titles[stage] || `${stage.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} Stage`
    )
  }

  /**
   * Get recent activities for context
   */
  private static async getRecentActivities(farmId: number): Promise<any[]> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

      // Get recent activities from different tables (matching actual database schema)
      const [irrigations, sprays, fertigations] = await Promise.all([
        supabase
          .from('irrigation_records')
          .select('*')
          .eq('farm_id', farmId)
          .gte('date', thirtyDaysAgoStr)
          .limit(5),
        supabase
          .from('spray_records')
          .select('*')
          .eq('farm_id', farmId)
          .gte('date', thirtyDaysAgoStr)
          .limit(5),
        supabase
          .from('fertigation_records')
          .select('*')
          .eq('farm_id', farmId)
          .gte('date', thirtyDaysAgoStr)
          .limit(5)
      ])

      // Combine activities with standardized format
      const activities: any[] = []

      if (irrigations.data) {
        irrigations.data.forEach((record) => {
          activities.push({
            id: record.id,
            activity_type: 'irrigation',
            date: record.date,
            notes: record.notes || `${record.duration}h irrigation, ${record.area} area`,
            created_at: record.created_at
          })
        })
      }

      if (sprays.data) {
        sprays.data.forEach((record) => {
          activities.push({
            id: record.id,
            activity_type: 'spray',
            date: record.date,
            notes: record.notes || `${record.chemical}`,
            created_at: record.created_at
          })
        })
      }

      if (fertigations.data) {
        fertigations.data.forEach((record) => {
          activities.push({
            id: record.id,
            activity_type: 'fertigation',
            date: record.date,
            notes: record.notes || `${record.fertilizer} application`,
            created_at: record.created_at
          })
        })
      }

      // Sort by date and return recent activities
      return activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)
    } catch (error) {
      console.warn('Could not fetch recent activities:', error)
      return []
    }
  }

  /**
   * Helper methods for task formatting
   */
  private static getTaskTitle(taskType: string): string {
    switch (taskType) {
      case 'irrigation':
        return 'Irrigation Recommended'
      case 'spray':
        return 'Protective Spray Due'
      case 'fertigation':
        return 'Nutrition Application'
      case 'pruning':
        return 'Pruning Required'
      default:
        return 'Farm Task Pending'
    }
  }

  private static getTaskIcon(taskType: string): string {
    switch (taskType) {
      case 'irrigation':
        return 'Droplets'
      case 'spray':
        return 'SprayCan'
      case 'fertigation':
        return 'Zap'
      case 'pruning':
        return 'Scissors'
      default:
        return 'CheckCircle'
    }
  }

  /**
   * Get insights by category for the detailed page
   */
  static async getInsightsByCategory(
    farmId: number,
    userId: string | null
  ): Promise<Record<string, AIInsight[]>> {
    // Check cache for category data
    const cacheKey = `${farmId}_${userId}_categories`
    const cached = this.categoriesCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    const allInsights = await this.getInsightsForFarm(farmId, userId || 'anonymous', 50)

    const categories = allInsights.reduce(
      (acc, insight) => {
        if (!acc[insight.type]) {
          acc[insight.type] = []
        }
        acc[insight.type].push(insight)
        return acc
      },
      {} as Record<string, AIInsight[]>
    )

    // Cache the category results
    this.categoriesCache.set(cacheKey, {
      data: categories,
      timestamp: Date.now()
    })

    return categories
  }

  /**
   * Execute an AI insight action
   */
  static async executeInsightAction(
    insight: AIInsight
  ): Promise<{ success: boolean; message: string }> {
    try {
      switch (insight.actionType) {
        case 'execute':
          // Handle task execution
          if (
            insight.type === 'task_recommendation' &&
            insight.actionData &&
            'taskId' in insight.actionData
          ) {
            // Mark task as executed or create a pending task
            return { success: true, message: 'Task scheduled for execution' }
          }
          break

        case 'navigate':
          // Navigation is handled by the UI component
          return { success: true, message: 'Navigating to details' }

        case 'execute':
          // Execute action for detailed information
          return { success: true, message: 'Executing action' }

        default:
          return { success: false, message: 'Unknown action type' }
      }

      return { success: true, message: 'Action completed' }
    } catch (error) {
      console.error('Error executing insight action:', error)
      return { success: false, message: 'Action failed' }
    }
  }
}
