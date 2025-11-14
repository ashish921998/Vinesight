// AI Service Types for VineSight
// These types support the AI task generation and recommendation system

import type { AITaskRecommendation, FarmerAIProfile } from '@/types/ai'

// Re-export types from main AI types file
export type { AITaskRecommendation, FarmerAIProfile }

// Weather Data Interface
export interface WeatherData {
  date: string
  temperature: {
    min: number
    max: number
    avg: number
  }
  humidity: {
    min: number
    max: number
    avg: number
  }
  precipitation: number // mm
  windSpeed: number // km/h
  pressure: number // hPa
  cloudCover: number // percentage
}

// Task Generation Context
export interface TaskGenerationContext {
  farm: any // Farm data
  weather: WeatherData[]
  growthStage: string
  recentTasks: any[]
  farmerProfile: FarmerAIProfile
  riskAssessment: {
    overall: number
    categories: {
      weather: number
      pest: number
      disease: number
      market: number
      resource: number
    }
    recommendations: Array<{
      type: string
      priority: 'low' | 'medium' | 'high'
      action: string
      timing: string
      confidence: number
    }>
  }
}

// AI Service Response Wrapper
export interface AIServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
  confidence?: number
  metadata?: Record<string, any>
}

// Recommendation Request
export interface RecommendationRequest {
  farmId: number
  userId: string
  options?: {
    regenerate?: boolean
    daysAhead?: number
    taskTypes?: string[]
  }
}

// Recommendation Response
export interface RecommendationResponse {
  taskRecommendations: AITaskRecommendation[]
  riskAssessments: any
  insights: Array<{
    type: string
    title: string
    description: string
    confidence: number
    actionRequired: boolean
  }>
  personalizedNotes: string[]
}
