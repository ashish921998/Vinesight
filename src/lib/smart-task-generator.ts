// @ts-nocheck
import { supabase } from './supabase'
import type {
  AITaskRecommendation,
  WeatherData,
  TaskGenerationContext,
  FarmerAIProfile,
  AIServiceResponse,
  RecommendationRequest,
  RecommendationResponse
} from './types/ai-types'
import { AIProfileService } from './ai-profile-service'
import { PestPredictionService } from './pest-prediction-service'
import { OpenMeteoWeatherService } from './open-meteo-weather'
import { SupabaseService } from './supabase-service'

export class SmartTaskGenerator {
  /**
   * Generate personalized task recommendations for a farmer
   */
  static async generateSmartTasks(
    request: RecommendationRequest
  ): Promise<AIServiceResponse<RecommendationResponse>> {
    try {
      // Get farmer profile for personalization
      const farmerProfile = await AIProfileService.getFarmerProfile(request.userId, request.farmId)
      if (!farmerProfile) {
        return { success: false, error: 'Farmer profile not found' }
      }

      // Get farm data
      const farmData = await SupabaseService.getFarm(request.farmId)
      if (!farmData) {
        return { success: false, error: 'Farm data not found' }
      }

      // Get weather forecast
      const weatherForecast = await this.getWeatherForecast(farmData.latitude, farmData.longitude)
      if (!weatherForecast) {
        return { success: false, error: 'Weather data unavailable' }
      }

      // Get recent activities
      const recentActivities = await this.getRecentActivities(request.farmId)

      // Get pending tasks to avoid duplicates
      const pendingTasks = await this.getPendingTasks(request.farmId)

      // Get pest predictions
      const pestPredictions = await PestPredictionService.getActivePredictions(request.farmId)

      // Build task generation context
      const context: TaskGenerationContext = {
        farm: farmData,
        weather: weatherForecast,
        growthStage: this.getCurrentGrowthStage(farmData),
        recentTasks: recentActivities,
        farmerProfile,
        riskAssessment: {
          overall: 0.5,
          categories: { weather: 0.4, pest: 0.6, disease: 0.5, market: 0.3, resource: 0.4 },
          recommendations: []
        }
      }

      // Generate task recommendations
      const taskRecommendations = await this.generateTaskRecommendations(context, pestPredictions)

      // Filter out existing pending tasks
      const filteredTasks = taskRecommendations.filter(
        (task) =>
          !pendingTasks.some(
            (pending) =>
              pending.task_type === task.taskType &&
              Math.abs(
                new Date(pending.recommended_date).getTime() - task.recommendedDate.getTime()
              ) <
                24 * 60 * 60 * 1000
          )
      )

      // Save recommendations to database
      if (filteredTasks.length > 0) {
        await this.saveTaskRecommendations(filteredTasks)
      }

      // Generate insights and risk assessments
      const insights = this.generateInsights(context, pestPredictions)
      const riskAssessment = this.generateRiskAssessment(context, pestPredictions)

      const response: RecommendationResponse = {
        taskRecommendations: filteredTasks,
        riskAssessments: riskAssessment,
        insights,
        personalizedNotes: this.generatePersonalizedNotes(farmerProfile, context)
      }

      return {
        success: true,
        data: response,
        confidence: 0.8,
        metadata: {
          tasksGenerated: filteredTasks.length,
          weatherDays: weatherForecast.length,
          pestAlerts: pestPredictions.filter(
            (p) => p.riskLevel === 'high' || p.riskLevel === 'critical'
          ).length
        }
      }
    } catch (error) {
      console.error('Error generating smart tasks:', error)
      return { success: false, error: 'Failed to generate task recommendations' }
    }
  }

  /**
   * Generate specific task recommendations based on context
   */
  private static async generateTaskRecommendations(
    context: TaskGenerationContext,
    pestPredictions: any[]
  ): Promise<AITaskRecommendation[]> {
    const recommendations: AITaskRecommendation[] = []
    const { weather, farm, farmerProfile } = context

    // 1. IRRIGATION RECOMMENDATIONS
    const irrigationTasks = this.generateIrrigationTasks(
      weather,
      farm,
      farmerProfile,
      context.recentTasks
    )
    recommendations.push(...irrigationTasks)

    // 2. PEST/DISEASE SPRAY RECOMMENDATIONS
    const sprayTasks = this.generateSprayTasks(pestPredictions, weather, farmerProfile)
    recommendations.push(...sprayTasks)

    // 3. HARVEST RECOMMENDATIONS
    const harvestTasks = this.generateHarvestTasks(context)
    recommendations.push(...harvestTasks)

    // 4. FERTIGATION RECOMMENDATIONS
    const fertigationTasks = this.generateFertigationTasks(context)
    recommendations.push(...fertigationTasks)

    // 5. MAINTENANCE RECOMMENDATIONS
    const maintenanceTasks = this.generateMaintenanceTasks(context)
    recommendations.push(...maintenanceTasks)

    // 6. SOIL TEST RECOMMENDATIONS
    const soilTestTasks = this.generateSoilTestTasks(context)
    recommendations.push(...soilTestTasks)

    // Sort by priority score and return top recommendations
    return recommendations.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 8) // Limit to top 8 recommendations
  }

  /**
   * Generate irrigation task recommendations
   */
  private static generateIrrigationTasks(
    weather: WeatherData[],
    farm: any,
    farmerProfile: FarmerAIProfile,
    recentTasks: any[]
  ): AITaskRecommendation[] {
    const tasks: AITaskRecommendation[] = []

    // Check last irrigation
    const lastIrrigation = recentTasks.find((task) => task.type === 'irrigation')
    const daysSinceIrrigation = lastIrrigation
      ? Math.floor((Date.now() - new Date(lastIrrigation.date).getTime()) / (1000 * 60 * 60 * 24))
      : 7

    // Calculate upcoming dry spell
    const dryDays = this.calculateConsecutiveDryDays(weather)
    const totalPrecipitation = weather.reduce((sum, day) => sum + day.precipitation, 0)

    // High priority if dry spell > 3 days and no recent irrigation
    if (dryDays >= 3 && daysSinceIrrigation >= 2) {
      const priorityScore = Math.min(0.9, 0.5 + dryDays * 0.1 + daysSinceIrrigation * 0.05)

      // Find optimal irrigation day (avoid high wind, rain)
      const optimalDay =
        weather.find((day) => day.precipitation < 5 && day.windSpeed < 15) || weather[1]

      tasks.push({
        id: this.generateId(),
        farmId: farm.id,
        userId: farmerProfile.userId,
        taskType: 'irrigation',
        recommendedDate: new Date(optimalDay.date),
        priorityScore,
        weatherDependent: true,
        reasoning: `${dryDays} consecutive dry days predicted with only ${totalPrecipitation.toFixed(1)}mm rain in forecast. Last irrigation was ${daysSinceIrrigation} days ago.`,
        confidenceScore: 0.85,
        status: 'pending',
        farmerFeedback: undefined,
        outcomeTracked: false,
        taskDetails: {
          duration: 120, // 2 hours default
          resources: ['irrigation system', 'water tank'],
          conditions: ['avoid windy conditions (>15 km/h)', 'skip if rain >10mm predicted'],
          alternatives: ['early morning (6-8 AM)', 'evening (6-8 PM)']
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
      })
    }

    // Medium priority for regular maintenance irrigation
    if (daysSinceIrrigation >= 5 && totalPrecipitation < 15) {
      tasks.push({
        id: this.generateId(),
        farmId: farm.id,
        userId: farmerProfile.userId,
        taskType: 'irrigation',
        recommendedDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        priorityScore: 0.6,
        weatherDependent: true,
        reasoning: `Regular irrigation cycle due. ${daysSinceIrrigation} days since last irrigation with low rainfall forecast.`,
        confidenceScore: 0.7,
        status: 'pending',
        farmerFeedback: undefined,
        outcomeTracked: false,
        taskDetails: {
          duration: 90,
          resources: ['irrigation system'],
          conditions: ['check soil moisture first'],
          alternatives: ['adjust based on soil moisture levels']
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      })
    }

    return tasks
  }

  /**
   * Generate spray task recommendations based on pest predictions
   */
  private static generateSprayTasks(
    pestPredictions: any[],
    weather: WeatherData[],
    farmerProfile: FarmerAIProfile
  ): AITaskRecommendation[] {
    const tasks: AITaskRecommendation[] = []

    // High-risk pest/disease treatments
    const criticalPests = pestPredictions.filter(
      (p) => p.riskLevel === 'critical' || p.riskLevel === 'high'
    )

    criticalPests.forEach((pest) => {
      // Find optimal spray window (low wind, no rain)
      const sprayWindow = weather.find(
        (day) =>
          day.windSpeed < 10 &&
          day.precipitation < 2 &&
          new Date(day.date) <= new Date(pest.preventionWindow.endDate)
      )

      if (sprayWindow) {
        const priorityScore = pest.riskLevel === 'critical' ? 0.95 : 0.8
        const treatment =
          pest.recommendedTreatments.chemical[0] || pest.recommendedTreatments.organic[0]

        tasks.push({
          id: this.generateId(),
          farmId: pest.farmId,
          userId: farmerProfile.userId,
          taskType: 'spray',
          recommendedDate: new Date(sprayWindow.date),
          priorityScore,
          weatherDependent: true,
          reasoning: `${pest.riskLevel.toUpperCase()} risk of ${pest.pestDiseaseType.replace(/_/g, ' ')} detected (${Math.round(pest.probabilityScore * 100)}% probability). Preventive treatment recommended.`,
          confidenceScore: pest.probabilityScore,
          status: 'pending',
          farmerFeedback: undefined,
          outcomeTracked: true,
          taskDetails: {
            duration: 60,
            resources: [treatment?.product || treatment?.method, 'spraying equipment'],
            conditions: ['wind speed <10 km/h', 'no rain for 4 hours after application'],
            alternatives: pest.recommendedTreatments.organic.map((o) => o.method)
          },
          createdAt: new Date(),
          expiresAt: new Date(pest.preventionWindow.endDate)
        })
      }
    })

    return tasks
  }

  /**
   * Generate harvest recommendations
   */
  private static generateHarvestTasks(context: TaskGenerationContext): AITaskRecommendation[] {
    const tasks: AITaskRecommendation[] = []
    const { farm, weather } = context

    // Simple harvest timing based on planting date (grape harvest typically 120-150 days after flowering)
    if (farm.planting_date) {
      const plantingDate = new Date(farm.planting_date)
      const estimatedHarvestStart = new Date(plantingDate)
      estimatedHarvestStart.setDate(plantingDate.getDate() + 150) // 150 days after planting

      const now = new Date()
      const daysUntilHarvest = Math.floor(
        (estimatedHarvestStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Recommend harvest preparation if within 30 days
      if (daysUntilHarvest > 0 && daysUntilHarvest <= 30) {
        // Find dry weather window for harvest
        const dryDays = weather.filter((day) => day.precipitation < 2)
        if (dryDays.length >= 2) {
          tasks.push({
            id: this.generateId(),
            farmId: farm.id,
            userId: context.farmerProfile.userId,
            taskType: 'harvest',
            recommendedDate: new Date(dryDays[0].date),
            priorityScore: 0.8,
            weatherDependent: true,
            reasoning: `Harvest window approaching (estimated ${daysUntilHarvest} days). Dry weather conditions favorable for harvest.`,
            confidenceScore: 0.75,
            status: 'pending',
            farmerFeedback: undefined,
            outcomeTracked: true,
            taskDetails: {
              duration: 480, // 8 hours
              resources: ['harvest containers', 'labor', 'transportation'],
              conditions: ['dry weather', 'morning harvest preferred'],
              alternatives: ['test berry sugar levels first', 'coordinate with buyer']
            },
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          })
        }
      }
    }

    return tasks
  }

  /**
   * Generate fertigation recommendations
   */
  private static generateFertigationTasks(context: TaskGenerationContext): AITaskRecommendation[] {
    const tasks: AITaskRecommendation[] = []
    const { farm, recentTasks } = context

    // Check last fertigation
    const lastFertigation = recentTasks.find((task) => task.type === 'fertigation')
    const daysSinceFertigation = lastFertigation
      ? Math.floor((Date.now() - new Date(lastFertigation.date).getTime()) / (1000 * 60 * 60 * 24))
      : 30

    // Recommend fertigation if >21 days since last application
    if (daysSinceFertigation >= 21) {
      const growthStage = this.getCurrentGrowthStage(farm)
      const fertilizer = this.recommendFertilizer(growthStage)

      tasks.push({
        id: this.generateId(),
        farmId: farm.id,
        userId: context.farmerProfile.userId,
        taskType: 'fertigation',
        recommendedDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        priorityScore: 0.7,
        weatherDependent: false,
        reasoning: `${daysSinceFertigation} days since last fertigation. ${growthStage} stage requires balanced nutrition.`,
        confidenceScore: 0.8,
        status: 'pending',
        farmerFeedback: undefined,
        outcomeTracked: false,
        taskDetails: {
          duration: 45,
          resources: [fertilizer.type, 'fertigation system'],
          conditions: ['ensure soil moisture', 'avoid extreme temperatures'],
          alternatives: [fertilizer.alternative]
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })
    }

    return tasks
  }

  /**
   * Generate maintenance task recommendations
   */
  private static generateMaintenanceTasks(context: TaskGenerationContext): AITaskRecommendation[] {
    const tasks: AITaskRecommendation[] = []
    const { farm, recentTasks, weather } = context

    // Pruning recommendations (seasonal)
    const currentMonth = new Date().getMonth() + 1
    if (currentMonth >= 11 || currentMonth <= 2) {
      // Nov-Feb pruning season
      const lastPruning = recentTasks.find((task) => task.type === 'pruning')
      if (!lastPruning || new Date(lastPruning.date).getFullYear() < new Date().getFullYear()) {
        tasks.push({
          id: this.generateId(),
          farmId: farm.id,
          userId: context.farmerProfile.userId,
          taskType: 'pruning',
          recommendedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          priorityScore: 0.6,
          weatherDependent: false,
          reasoning:
            "Dormant season pruning to maintain vine health and optimize next season's yield.",
          confidenceScore: 0.9,
          status: 'pending',
          farmerFeedback: undefined,
          outcomeTracked: false,
          taskDetails: {
            duration: 240, // 4 hours
            resources: ['pruning shears', 'loppers', 'gloves'],
            conditions: ['dry weather preferred', 'avoid extremely cold days'],
            alternatives: ['gradual pruning over multiple sessions']
          },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        })
      }
    }

    return tasks
  }

  /**
   * Generate soil test recommendations
   */
  private static generateSoilTestTasks(context: TaskGenerationContext): AITaskRecommendation[] {
    const tasks: AITaskRecommendation[] = []
    const { farm, recentTasks } = context

    // Check last soil test
    const lastSoilTest = recentTasks.find((task) => task.type === 'soil_test')
    const monthsSinceSoilTest = lastSoilTest
      ? Math.floor(
          (Date.now() - new Date(lastSoilTest.date).getTime()) / (1000 * 60 * 60 * 24 * 30)
        )
      : 12

    // Recommend soil test every 6 months
    if (monthsSinceSoilTest >= 6) {
      tasks.push({
        id: this.generateId(),
        farmId: farm.id,
        userId: context.farmerProfile.userId,
        taskType: 'soil_test',
        recommendedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        priorityScore: 0.5,
        weatherDependent: false,
        reasoning: `${monthsSinceSoilTest} months since last soil test. Regular testing helps optimize fertilizer application.`,
        confidenceScore: 0.7,
        status: 'pending',
        farmerFeedback: undefined,
        outcomeTracked: false,
        taskDetails: {
          duration: 30,
          resources: ['soil sampling tools', 'sample containers'],
          conditions: ['avoid recently fertilized areas', 'representative sampling'],
          alternatives: ['professional soil testing service', 'DIY soil test kits']
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      })
    }

    return tasks
  }

  /**
   * Helper methods
   */
  private static async getWeatherForecast(
    latitude: number,
    longitude: number
  ): Promise<WeatherData[] | null> {
    try {
      const today = new Date()
      const endDate = new Date(today)
      endDate.setDate(today.getDate() + 7)

      const weatherArray = await OpenMeteoWeatherService.getWeatherData(
        latitude,
        longitude,
        today.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      )

      return weatherArray.map((day) => ({
        date: day.date,
        temperature: {
          min: day.temperatureMin,
          max: day.temperatureMax,
          avg: day.temperatureMean
        },
        humidity: {
          min: day.relativeHumidityMin || day.relativeHumidityMean,
          max: day.relativeHumidityMax || day.relativeHumidityMean,
          avg: day.relativeHumidityMean
        },
        precipitation: day.precipitationSum,
        windSpeed: day.windSpeed10m,
        pressure: 1013,
        cloudCover: 50
      }))
    } catch (error) {
      console.error('Error fetching weather forecast:', error)
      return null
    }
  }

  private static async getRecentActivities(farmId: number): Promise<any[]> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      // Get recent activities from different tables
      const [irrigations, sprays, fertigations] = await Promise.all([
        supabase
          .from('irrigation_records')
          .select('*')
          .eq('farm_id', farmId)
          .gte('date', thirtyDaysAgo.toISOString().split('T')[0]),
        supabase
          .from('spray_records')
          .select('*')
          .eq('farm_id', farmId)
          .gte('date', thirtyDaysAgo.toISOString().split('T')[0]),
        supabase
          .from('fertigation_records')
          .select('*')
          .eq('farm_id', farmId)
          .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      ])

      const activities = [
        ...(irrigations.data || []).map((r) => ({ ...r, type: 'irrigation' })),
        ...(sprays.data || []).map((r) => ({ ...r, type: 'spray' })),
        ...(fertigations.data || []).map((r) => ({ ...r, type: 'fertigation' }))
      ]

      return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    } catch (error) {
      console.error('Error fetching recent activities:', error)
      return []
    }
  }

  private static async getPendingTasks(farmId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('ai_task_recommendations')
        .select('*')
        .eq('farm_id', farmId)
        .eq('status', 'pending')

      return data || []
    } catch (error) {
      console.error('Error fetching pending tasks:', error)
      return []
    }
  }

  private static calculateConsecutiveDryDays(weather: WeatherData[]): number {
    let maxDryDays = 0
    let currentDryStreak = 0

    weather.forEach((day) => {
      if (day.precipitation < 2) {
        // <2mm considered dry
        currentDryStreak++
        maxDryDays = Math.max(maxDryDays, currentDryStreak)
      } else {
        currentDryStreak = 0
      }
    })

    return maxDryDays
  }

  private static getCurrentGrowthStage(farm: any): string {
    // Simplified growth stage calculation
    const currentMonth = new Date().getMonth() + 1

    if (currentMonth >= 12 || currentMonth <= 2) return 'Dormant'
    if (currentMonth >= 3 && currentMonth <= 4) return 'Budbreak'
    if (currentMonth >= 5 && currentMonth <= 6) return 'Flowering'
    if (currentMonth >= 7 && currentMonth <= 8) return 'Fruit Development'
    if (currentMonth >= 9 && currentMonth <= 10) return 'Ripening'
    return 'Post-Harvest'
  }

  private static recommendFertilizer(growthStage: string): { type: string; alternative: string } {
    const recommendations = {
      Budbreak: { type: 'High Nitrogen (NPK 20-10-10)', alternative: 'Organic compost' },
      Flowering: { type: 'Balanced (NPK 15-15-15)', alternative: 'Phosphorus-rich fertilizer' },
      'Fruit Development': { type: 'Potassium-rich (NPK 10-10-20)', alternative: 'Organic potash' },
      Ripening: { type: 'Low Nitrogen (NPK 5-10-20)', alternative: 'Wood ash for potassium' },
      Dormant: { type: 'Organic compost', alternative: 'Well-aged manure' },
      'Post-Harvest': { type: 'Recovery blend (NPK 12-12-12)', alternative: 'Organic fertilizer' }
    }

    return (
      recommendations[growthStage as keyof typeof recommendations] || recommendations['Budbreak']
    )
  }

  private static generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  private static generateInsights(context: TaskGenerationContext, pestPredictions: any[]): any[] {
    const insights = []
    const { weather, farmerProfile } = context

    // Weather insights
    const avgTemp = weather.reduce((sum, day) => sum + day.temperature.avg, 0) / weather.length
    const totalRain = weather.reduce((sum, day) => sum + day.precipitation, 0)

    if (avgTemp > 30) {
      insights.push({
        type: 'weather',
        title: 'High Temperature Alert',
        description: `Average temperature of ${avgTemp.toFixed(1)}°C expected. Consider adjusting irrigation schedule.`,
        confidence: 0.8,
        actionRequired: true
      })
    }

    if (totalRain < 5) {
      insights.push({
        type: 'weather',
        title: 'Dry Period Ahead',
        description: `Only ${totalRain.toFixed(1)}mm rain forecasted. Plan irrigation carefully.`,
        confidence: 0.9,
        actionRequired: true
      })
    }

    // Pest insights
    const highRiskPests = pestPredictions.filter(
      (p) => p.riskLevel === 'high' || p.riskLevel === 'critical'
    )
    if (highRiskPests.length > 0) {
      insights.push({
        type: 'pest',
        title: 'Pest Alert',
        description: `${highRiskPests.length} high-risk pest/disease condition(s) detected. Early action recommended.`,
        confidence: 0.85,
        actionRequired: true
      })
    }

    return insights
  }

  private static generateRiskAssessment(
    context: TaskGenerationContext,
    pestPredictions: any[]
  ): any {
    const { weather } = context

    // Calculate weather risk
    const extremeTemp = weather.some((day) => day.temperature.max > 35 || day.temperature.min < 5)
    const heavyRain = weather.some((day) => day.precipitation > 50)
    const weatherRisk = (extremeTemp ? 0.3 : 0) + (heavyRain ? 0.4 : 0)

    // Calculate pest/disease risk
    const pestRisk =
      pestPredictions.length > 0 ? Math.max(...pestPredictions.map((p) => p.probabilityScore)) : 0.2

    return {
      overall: Math.min(1.0, (weatherRisk + pestRisk + 0.3) / 3), // Add base risk
      categories: {
        weather: weatherRisk,
        pest: pestRisk,
        disease: pestRisk * 0.8,
        market: 0.3, // Default market risk
        resource: 0.2 // Default resource risk
      },
      recommendations: [
        {
          type: 'immediate',
          priority: 'high' as const,
          action: 'Monitor weather conditions closely',
          timing: 'next 48 hours',
          confidence: 0.9
        }
      ]
    }
  }

  private static generatePersonalizedNotes(
    farmerProfile: FarmerAIProfile,
    context: TaskGenerationContext
  ): string[] {
    const notes = []

    // Based on risk tolerance
    if (farmerProfile.riskTolerance > 0.7) {
      notes.push('As a progressive farmer, consider trying the latest recommended practices.')
    } else if (farmerProfile.riskTolerance < 0.3) {
      notes.push('Conservative approach recommended - stick to proven methods.')
    }

    // Based on success metrics
    if (farmerProfile.successMetrics.averageYield > 0) {
      notes.push(
        `Your average yield performance: ${farmerProfile.successMetrics.averageYield.toFixed(1)} kg/acre`
      )
    }

    // Based on preferred timing
    if (farmerProfile.decisionPatterns.preferredTiming === 'early_morning') {
      notes.push('Schedule activities for early morning (6-9 AM) as per your preference.')
    }

    return notes
  }

  private static async saveTaskRecommendations(tasks: AITaskRecommendation[]): Promise<void> {
    try {
      const insertData = tasks.map((task) => ({
        farm_id: task.farmId,
        user_id: task.userId,
        task_type: task.taskType,
        recommended_date: task.recommendedDate.toISOString().split('T')[0],
        priority_score: task.priorityScore,
        weather_dependent: task.weatherDependent,
        reasoning: task.reasoning,
        confidence_score: task.confidenceScore,
        status: task.status,
        outcome_tracked: task.outcomeTracked,
        task_details: task.taskDetails,
        expires_at: task.expiresAt.toISOString()
      }))

      const { error } = await supabase.from('ai_task_recommendations').insert(insertData)

      if (error) {
        console.error('Error saving task recommendations:', error)
      }
    } catch (error) {
      console.error('Error in saveTaskRecommendations:', error)
    }
  }

  /**
   * Get active task recommendations for a farm
   */
  static async getActiveRecommendations(farmId: number): Promise<AITaskRecommendation[]> {
    try {
      const { data, error } = await supabase
        .from('ai_task_recommendations')
        .select('*')
        .eq('farm_id', farmId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('priority_score', { ascending: false })

      if (error) {
        console.error('Error fetching recommendations:', error)
        return []
      }

      return data.map(this.transformToRecommendation)
    } catch (error) {
      console.error('Error in getActiveRecommendations:', error)
      return []
    }
  }

  /**
   * Update task recommendation status
   */
  static async updateTaskStatus(
    taskId: string,
    status: 'accepted' | 'rejected' | 'completed',
    feedback?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_task_recommendations')
        .update({
          status,
          farmer_feedback: feedback
        })
        .eq('id', taskId)

      if (error) {
        console.error('Error updating task status:', error)
      }
    } catch (error) {
      console.error('Error in updateTaskStatus:', error)
    }
  }

  private static transformToRecommendation(data: any): AITaskRecommendation {
    return {
      id: data.id.toString(),
      farmId: data.farm_id,
      userId: data.user_id,
      taskType: data.task_type,
      recommendedDate: new Date(data.recommended_date),
      priorityScore: data.priority_score,
      weatherDependent: data.weather_dependent,
      reasoning: data.reasoning,
      confidenceScore: data.confidence_score,
      status: data.status,
      farmerFeedback: data.farmer_feedback,
      outcomeTracked: data.outcome_tracked,
      taskDetails: data.task_details,
      createdAt: new Date(data.created_at),
      expiresAt: new Date(data.expires_at)
    }
  }
}
