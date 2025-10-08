import { supabase } from './supabase'
import { PestPredictionService } from './pest-prediction-service'
import { SmartTaskGenerator } from './smart-task-generator'
import { AIProfileService } from './ai-profile-service'
import type { RecommendationRequest } from '@/types/ai'

export class AIInitializationService {
  /**
   * Initialize AI services for a farm and user
   */
  static async initializeAIForFarm(
    farmId: number,
    userId: string
  ): Promise<{
    success: boolean
    predictions?: any[]
    recommendations?: any[]
    profile?: any
    error?: string
  }> {
    try {
      // Get farm data
      const { data: farm, error: farmError } = await supabase
        .from('farms')
        .select('*')
        .eq('id', farmId)
        .single()

      if (farmError || !farm) {
        return { success: false, error: 'Farm not found' }
      }

      // 1. Create or get AI profile for the farmer
      let profile = await AIProfileService.getFarmerProfile(userId, farmId)
      if (!profile) {
        profile = await AIProfileService.createDefaultProfile(userId, farmId)
      }

      // 2. Generate pest/disease predictions
      const predictionResult = await PestPredictionService.generatePredictions(farmId, farm)

      // 3. Generate smart task recommendations
      const taskRequest: RecommendationRequest = {
        farmId,
        userId,
        context: {
          currentWeather: undefined, // Will be fetched by the service
          growthStage: undefined, // Will be determined by the service
          recentActivities: [], // Will be fetched by the service
          availableResources: [],
          farmConditions: {}
        }
      }

      const recommendationResult = await SmartTaskGenerator.generateSmartTasks(taskRequest)

      return {
        success: true,
        predictions: predictionResult.success ? predictionResult.data : [],
        recommendations: recommendationResult.success
          ? recommendationResult.data?.taskRecommendations
          : [],
        profile
      }
    } catch (error) {
      console.error('Error initializing AI services:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Test AI services with sample data
   */
  static async testAIServices(
    farmId: number,
    userId: string
  ): Promise<{
    success: boolean
    results: Record<string, any>
  }> {
    try {
      console.log('🧪 Testing AI Services...')

      const results: Record<string, any> = {}

      // Test 1: AI Profile Service
      console.log('Testing AI Profile Service...')
      const profile = await AIProfileService.getFarmerProfile(userId, farmId)
      results.profile = {
        exists: !!profile,
        riskTolerance: profile?.riskTolerance,
        adoptionSpeed: profile?.decisionPatterns?.adoptionSpeed
      }

      // Test 2: Pest Prediction Service
      console.log('Testing Pest Prediction Service...')
      const activePredictions = await PestPredictionService.getActivePredictions(farmId)
      results.pestPredictions = {
        count: activePredictions.length,
        highRiskAlerts: activePredictions.filter(
          (p) => p.riskLevel === 'high' || p.riskLevel === 'critical'
        ).length
      }

      // Test 3: Smart Task Generator
      console.log('Testing Smart Task Generator...')
      const activeRecommendations = await SmartTaskGenerator.getActiveRecommendations(farmId)
      results.taskRecommendations = {
        count: activeRecommendations.length,
        highPriorityTasks: activeRecommendations.filter((r) => r.priorityScore >= 0.7).length
      }

      // Test 4: Database connectivity
      console.log('Testing Database Connectivity...')
      const { data: farmData, error } = await supabase
        .from('farms')
        .select('id, name, region')
        .eq('id', farmId)
        .single()

      results.database = {
        connected: !error,
        farmFound: !!farmData,
        farmName: (farmData as any)?.name
      }

      console.log('✅ AI Services Test Results:', results)

      return { success: true, results }
    } catch (error) {
      console.error('❌ AI Services Test Failed:', error)
      return {
        success: false,
        results: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  /**
   * Check if Phase 3A database tables exist
   */
  static async verifyDatabaseSchema(): Promise<{
    success: boolean
    tablesFound: string[]
    missing: string[]
  }> {
    const requiredTables = [
      'farmer_ai_profiles',
      'ai_task_recommendations',
      'pest_disease_predictions',
      'profitability_analyses',
      'market_intelligence',
      'community_insights',
      'ai_conversation_context'
    ] as const

    const tablesFound: string[] = []
    const missing: string[] = []

    for (const table of requiredTables) {
      try {
        const { error } = await supabase
          .from(table as any)
          .select('id')
          .limit(1)

        if (error) {
          missing.push(table)
          console.warn(`Table ${table} not found:`, error.message)
        } else {
          tablesFound.push(table)
        }
      } catch (error) {
        missing.push(table)
        console.warn(`Error checking table ${table}:`, error)
      }
    }

    return {
      success: missing.length === 0,
      tablesFound,
      missing
    }
  }

  /**
   * Seed demo data for testing AI features
   */
  static async seedDemoData(
    farmId: number,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🌱 Seeding demo data for AI features...')

      // Create demo AI profile
      await AIProfileService.createDefaultProfile(userId, farmId)

      // Create demo pest prediction
      const demoPrediction = {
        farm_id: farmId,
        region: 'Nashik',
        pest_disease_type: 'downy_mildew',
        risk_level: 'high',
        probability_score: 0.75,
        predicted_onset_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        weather_triggers: {
          temperature: { min: 20, max: 25 },
          humidity: { threshold: 85 },
          rainfall: { days: 3, amount: 15 }
        },
        prevention_window: {
          startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          optimalTiming: '2 days before predicted onset'
        },
        recommended_treatments: {
          chemical: [
            { product: 'Metalaxyl + Mancozeb', dosage: '2g/L', cost: 150, effectiveness: 0.9 }
          ],
          organic: [
            {
              method: 'Bordeaux mixture',
              description: 'Copper-based fungicide',
              effectiveness: 0.7
            }
          ],
          cultural: ['Improve air circulation', 'Avoid overhead irrigation']
        },
        community_reports: 2,
        status: 'active'
      }

      await supabase.from('pest_disease_predictions').insert([demoPrediction as any])

      // Create demo task recommendation
      const demoTask = {
        farm_id: farmId,
        user_id: userId,
        task_type: 'irrigation',
        recommended_date: new Date().toISOString().split('T')[0],
        priority_score: 0.8,
        weather_dependent: true,
        reasoning:
          'Demo: High temperature forecast with low humidity requires irrigation attention',
        confidence_score: 0.85,
        status: 'pending',
        task_details: {
          duration: 120,
          resources: ['irrigation system', 'water tank'],
          conditions: ['avoid windy conditions', 'check soil moisture first']
        },
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }

      await supabase.from('ai_task_recommendations').insert([demoTask as any])

      return { success: true, message: 'Demo data seeded successfully' }
    } catch (error) {
      console.error('Error seeding demo data:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
