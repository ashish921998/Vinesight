// AI & Machine Learning Types for VineSight
// Consolidated from ai-intelligence.ts and lib/types/ai-types.ts
// This is the single source of truth for all AI-related type definitions

// ===== FARMER AI PROFILE =====
export interface FarmerAIProfile {
  id: string
  userId: string
  farmId: number
  riskTolerance: number // 0-1 scale
  decisionPatterns: {
    preferredTiming: 'early_morning' | 'afternoon' | 'evening'
    riskAversion: number
    adoptionSpeed: 'conservative' | 'moderate' | 'early_adopter'
    communicationStyle: 'direct' | 'detailed' | 'visual'
  }
  successMetrics: {
    averageYield: number
    costEfficiency: number
    profitability: number
    waterUseEfficiency: number
  }
  learningPreferences: {
    preferredChannels: ('voice' | 'text' | 'visual')[]
    bestResponseTimes: string[]
    languagePreference: 'en' | 'hi' | 'mr'
  }
  seasonalPatterns: Record<string, any> // Month-wise activity patterns
  createdAt: Date
  updatedAt: Date
}

// ===== TASK RECOMMENDATIONS =====
export interface AITaskRecommendation {
  id: string
  farmId: number
  userId: string
  taskType:
    | 'irrigation'
    | 'spray'
    | 'harvest'
    | 'fertigation'
    | 'pruning'
    | 'soil_test'
    | 'maintenance'
  recommendedDate: Date
  priorityScore: number // 0-1
  weatherDependent: boolean
  reasoning: string // AI explanation
  confidenceScore: number // 0-1
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'expired'
  farmerFeedback?: string
  outcomeTracked: boolean

  // Detailed task parameters
  taskDetails: {
    duration?: number // minutes
    resources?: string[]
    conditions?: string[]
    alternatives?: string[]
  }

  createdAt: Date
  expiresAt?: Date
}

// ===== PEST & DISEASE PREDICTION =====
export interface PestDiseasePrediction {
  id: string
  farmId: number
  region: string
  pestDiseaseType: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  probabilityScore: number // 0-1
  predictedOnsetDate: Date

  weatherTriggers: {
    temperature: { min: number; max: number }
    humidity: { threshold: number }
    rainfall: { days: number; amount: number }
  }

  preventionWindow: {
    startDate: Date
    endDate: Date
    optimalTiming: string
  }

  recommendedTreatments: {
    chemical: Array<{
      product: string
      dosage: string
      cost: number
      effectiveness: number
    }>
    organic: Array<{
      method: string
      description: string
      effectiveness: number
    }>
    cultural: string[]
  }

  communityReports: number
  status: 'active' | 'resolved' | 'false_alarm'
  farmerActionTaken?: string
  outcome?: string
  alertPriority?: 'low' | 'medium' | 'high' | 'critical'
  createdAt: Date
  updatedAt?: Date
  resolvedAt?: Date
}

// ===== PROFITABILITY ANALYSIS =====
export interface ProfitabilityAnalysis {
  id: string
  farmId: number
  userId: string
  analysisPeriodStart: Date
  analysisPeriodEnd: Date
  totalExpenses: number

  expenseBreakdown: {
    labor: number
    materials: number
    equipment: number
    utilities: number
    other: number
  }

  efficiencyScores: {
    waterUse: number // liters per kg yield
    laborProductivity: number // hours per kg yield
    inputCostRatio: number // cost per kg yield
    overallEfficiency: number // 0-100 score
  }

  roiCalculation: number // percentage

  benchmarkComparison: {
    regionalAverage: number
    topPerformers: number
    yourRanking: number // percentile
  }

  improvementOpportunities: Array<{
    category: string
    currentCost: number
    potentialSavings: number
    implementationEffort: 'low' | 'medium' | 'high'
    recommendations: string[]
  }>

  predictedImpact: {
    costSavings: number
    yieldIncrease: number
    profitabilityImprovement: number
  }

  farmerImplemented: string[]
  actualOutcomes?: Record<string, any>
  createdAt: Date
}

// ===== MARKET INTELLIGENCE =====
export interface MarketIntelligence {
  id: string
  region: string
  grapeVariety?: string

  priceData: {
    current: number
    historical: Array<{
      date: Date
      price: number
      volume: number
    }>
    forecast: Array<{
      date: Date
      predictedPrice: number
      confidence: number
    }>
  }

  qualityPremiums: Record<string, number> // grade -> premium%
  demandForecast: Record<string, number> // month -> demand_index
  seasonalTrends: Record<string, any>

  supplyChainInsights: {
    buyerPreferences: string[]
    logisticsCosts: number
    contractOpportunities: Array<{
      buyer: string
      terms: string
      priceOffer: number
    }>
  }

  predictionDate: Date
  confidenceInterval: { lower: number; upper: number }
  dataSources: string[]
  createdAt: Date
  expiresAt?: Date
}

// ===== COMMUNITY INSIGHTS =====
export interface CommunityInsight {
  id: string
  insightType: 'practice' | 'outcome' | 'lesson' | 'alert'

  farmCharacteristics: {
    region: string
    farmSize: 'small' | 'medium' | 'large'
    grapeVariety: string
    soilType: string
    climaticConditions: string
  }

  practiceDescription: string

  outcomeMetrics: {
    yieldIncrease?: number // percentage
    costReduction?: number // percentage
    qualityImprovement?: number // grade improvement
    timesSaved?: number // hours per season
  }

  seasonalTiming: string
  regionalRelevance: string[]
  successScore: number // 0-1
  adoptionCount: number
  validationStatus: 'pending' | 'expert_verified' | 'community_validated' | 'disputed'
  anonymizedDetails: Record<string, any>
  createdAt: Date
  validatedAt?: Date
}

// ===== AI CONVERSATION CONTEXT =====
export interface AIConversationContext {
  id: string
  conversationId: string
  contextType: 'farm_state' | 'decision_history' | 'preference' | 'outcome' | 'seasonal_note'
  contextData: Record<string, any>
  relevanceScore: number // 0-1
  decayFactor: number // How quickly context loses relevance
  createdAt: Date
  lastReferenced: Date
}

// ===== AI INSIGHTS =====
export interface AIInsight {
  id: string
  type:
    | 'pest_prediction'
    | 'task_recommendation'
    | 'profitability_insight'
    | 'weather_alert'
    | 'general_advice'
  title: string
  subtitle: string
  description?: string
  icon: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  timeRelevant: boolean
  actionType: 'navigate' | 'execute'
  actionData?: Record<string, any>
  actionLabel: string
  tags?: string[]

  // Specific to pest predictions
  pestDetails?: {
    pestType: string
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    predictedDate: string
    preventionWindow: { start: string; end: string }
    treatments: Array<{
      name: string
      cost: number
      effectiveness: number
      type: 'chemical' | 'organic' | 'cultural'
    }>
  }

  // Specific to task recommendations
  taskDetails?: {
    taskType: string
    recommendedDate: string
    duration?: number
    resources?: string[]
    weatherDependent: boolean
  }

  // Specific to profitability insights
  profitabilityDetails?: {
    category: string
    currentCost: number
    potentialSavings: number
    roiImprovement: number
    implementationEffort: 'low' | 'medium' | 'high'
  }
}

// ===== CRITICAL ALERTS =====
export interface CriticalAlert {
  id: string
  type: 'pest_prediction' | 'weather_warning' | 'equipment_failure' | 'market_crash'
  severity: 'high' | 'critical'
  title: string
  message: string
  icon: string
  actionRequired: boolean
  timeWindow: {
    start: Date
    end: Date
    urgency: string // "Act within 24 hours", "Immediate action required"
  }
  actions: Array<{
    label: string
    type: 'primary' | 'secondary'
    action: 'navigate' | 'execute' | 'dismiss'
    actionData?: Record<string, any>
  }>
  farmId: number
  createdAt: Date
  acknowledgedAt?: Date
  resolvedAt?: Date
}

// ===== WEATHER DATA =====
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
  precipitation: number
  windSpeed: number
  pressure?: number
  cloudCover?: number
}

// ===== RISK ASSESSMENT =====
export interface RiskAssessment {
  overall: number // 0-1 overall risk score
  categories: {
    weather: number
    pest: number
    disease: number
    market: number
    resource: number
  }
  recommendations: Array<{
    type: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    action: string
    timing: string
    confidence: number
  }>
}

// ===== PEST RISK FACTORS =====
export interface PestRiskFactors {
  [pestType: string]: {
    temperature: {
      optimal: [number, number]
      weight: number
    }
    humidity: {
      threshold: number
      weight: number
    }
    rainfall?: {
      days: number
      threshold: number
      weight: number
    }
    drySpell?: {
      days: number
      weight: number
    }
    windSpeed?: {
      threshold: number
      weight: number
    }
    historicalMultiplier: number
    seasonalFactor: Record<string, number>
  }
}

// ===== AI SERVICE TYPES =====
export interface AIServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
  confidence?: number
  message?: string
  metadata?: Record<string, any>
}

export interface RecommendationRequest {
  farmId: number
  userId: string
  context: {
    currentWeather?: WeatherData
    growthStage?: string
    recentActivities?: string[]
    availableResources?: string[]
    farmConditions?: Record<string, any>
  }
  preferences?: {
    riskTolerance?: number
    preferredTiming?: string[]
    excludeTypes?: string[]
  }
}

export interface RecommendationResponse {
  taskRecommendations: AITaskRecommendation[]
  riskAssessments: RiskAssessment
  insights: Array<{
    type: string
    title: string
    description: string
    confidence: number
    actionRequired: boolean
  }>
  personalizedNotes: string[]
}

// ===== UTILITY TYPES =====
export interface TaskGenerationContext {
  farm: any // Farm data
  weather: WeatherData[]
  growthStage: string
  recentTasks: any[]
  farmerProfile: FarmerAIProfile
  riskAssessment: RiskAssessment
}

export interface ExpenseCategory {
  category: string
  subcategory?: string
  amount: number
  frequency: 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'annual'
  necessity: 'essential' | 'important' | 'optional'
  optimizationPotential: number // 0-1 score
}

export interface BenchmarkData {
  region: string
  farmSize: 'small' | 'medium' | 'large'
  grapeVariety: string
  metrics: {
    yieldPerAcre: { avg: number; top10: number; top25: number }
    costPerKg: { avg: number; top10: number; top25: number }
    profitMargin: { avg: number; top10: number; top25: number }
    waterUsage: { avg: number; top10: number; top25: number }
  }
  practices: Array<{
    practice: string
    adoptionRate: number
    impactOnYield: number
    impactOnCost: number
  }>
}
