# Types and Interfaces Documentation

## Core Application Types

### Farm Management Types

```typescript
// Core Farm interface (Application Layer)
export interface Farm {
  id?: number
  name: string
  region: string
  area: number
  crop: string
  cropVariety: string
  plantingDate: string
  vineSpacing?: number
  rowSpacing?: number
  totalTankCapacity?: number
  systemDischarge?: number
  remainingWater?: number
  waterCalculationUpdatedAt?: string
  latitude?: number
  longitude?: number
  elevation?: number
  locationName?: string
  timezone?: string
  locationSource?: 'manual' | 'search' | 'gps'
  locationUpdatedAt?: string
  dateOfPruning?: string
  bulkDensity?: number
  cationExchangeCapacity?: number
  soilWaterRetention?: number
  soilTextureClass?: string
  sandPercentage?: number
  siltPercentage?: number
  clayPercentage?: number
  createdAt?: string
  updatedAt?: string
  userId?: string
}

// Database Farm interface (Supabase Layer)
export interface DatabaseFarm {
  id?: number
  user_id: string
  name: string
  region: string
  area: number
  crop: string
  crop_variety: string
  planting_date: string
  vine_spacing?: number
  row_spacing?: number
  total_tank_capacity?: number | null
  system_discharge?: number | null
  remaining_water?: number | null
  water_calculation_updated_at?: string | null
  latitude?: number | null
  longitude?: number | null
  elevation?: number | null
  timezone?: string | null
  location_name?: string | null
  location_source?: string | null
  location_updated_at?: string | null
  bulk_density?: number | null
  cation_exchange_capacity?: number | null
  soil_water_retention?: number | null
  soil_texture_class?: string | null
  sand_percentage?: number | null
  silt_percentage?: number | null
  clay_percentage?: number | null
  date_of_pruning?: string | null
  created_at?: string | null
  updated_at?: string | null
}
```

### Activity & Journal Types

```typescript
export interface Activity {
  id?: number
  farmId: number
  activityType:
    | 'irrigation'
    | 'spray'
    | 'harvest'
    | 'fertigation'
    | 'pruning'
    | 'soil_test'
    | 'maintenance'
    | 'monitoring'
  date: string
  notes?: string
  createdAt?: string
}

export interface Expense {
  id?: number
  farmId: number
  category: 'pesticides' | 'fertilizers' | 'equipment' | 'labor' | 'seeds' | 'utilities' | 'other'
  itemName: string
  cost: number
  date: string
  quantity?: number
  unit?: string
  notes?: string
  createdAt?: string
}

export interface TaskReminder {
  id?: number
  farmId: number
  taskType: string
  description: string
  dueDate: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'completed' | 'overdue'
  createdAt?: string
}
```

### Calculator Types

```typescript
export interface ETcCalculationInputs {
  farmId: number
  weatherData: WeatherData
  growthStage: GrapeGrowthStage
  plantingDate: string
  location: {
    latitude: number
    longitude: number
    elevation: number
  }
  irrigationMethod: 'drip' | 'sprinkler' | 'surface'
  soilType: 'sandy' | 'loamy' | 'clay'
}

export interface ETcResults {
  etc: number // mm/day
  eto: number // mm/day
  kc: number // crop coefficient
  dailyWaterNeed: number // liters/day
  weeklyWaterNeed: number // liters/week
  irrigationFrequency: number // days
  irrigationDuration: number // hours
  recommendations: string[]
  calculationDate: string
}

export type GrapeGrowthStage =
  | 'dormant'
  | 'bud_break'
  | 'flowering'
  | 'fruit_set'
  | 'veraison'
  | 'harvest'
  | 'post_harvest'

export interface WeatherData {
  date: string
  temperatureMax: number
  temperatureMin: number
  humidity: number
  windSpeed: number
  rainfall: number
  solarRadiation?: number
  solarRadiationLux?: number
  sunshineHours?: number
}

export interface NutrientRecommendation {
  stage: string
  nitrogen: number
  phosphorus: number
  potassium: number
  micronutrients: {
    zinc: number
    boron: number
    iron: number
    manganese: number
    copper: number
    molybdenum: number
  }
  applicationTiming: string
  splitApplication: boolean
}
```

### Location & Geocoding Types

```typescript
export interface LocationResult {
  name: string
  latitude: number
  longitude: number
  elevation: number
  country: string
  admin1?: string // state/province
  admin2?: string // district/county
  timezone?: string
}

export interface OpenMeteoGeocoding {
  results?: LocationResult[]
  generationtime_ms: number
}

export interface OpenMeteoWeatherData {
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    relative_humidity_2m_max: number[]
    wind_speed_10m_max: number[]
    precipitation_sum: number[]
    shortwave_radiation_sum?: number[]
    sunshine_duration?: number[]
  }
  daily_units: {
    temperature_2m_max: string
    temperature_2m_min: string
    relative_humidity_2m_max: string
    wind_speed_10m_max: string
    precipitation_sum: string
    shortwave_radiation_sum?: string
    sunshine_duration?: string
  }
}
```

## Phase 3: Advanced AI Intelligence Types

### AI Profile & Personalization

```typescript
// Enhanced Farmer AI Profile
export interface FarmerAIProfile {
  id: string
  userId: string
  farmId: number
  riskTolerance: number // 0-1 scale
  decisionPatterns: {
    preferredTiming: string // early_morning, afternoon, evening
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

// Smart Task Recommendation
export interface AITaskRecommendation {
  id: string
  farmId: number
  userId: string
  taskType: 'irrigation' | 'spray' | 'harvest' | 'fertigation' | 'pruning' | 'soil_test'
  recommendedDate: Date
  priorityScore: number // 0-1
  weatherDependent: boolean
  reasoning: string // AI explanation
  confidenceScore: number // 0-1
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
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
}
```

### Pest & Disease Intelligence

```typescript
// Pest & Disease Prediction
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
  createdAt: Date
}
```

### Profitability & Market Intelligence

```typescript
// Profitability Analysis
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

// Market Intelligence
export interface MarketIntelligence {
  id: string
  region: string
  cropVariety?: string

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
}
```

### Community Learning & AI Context

```typescript
// Community Insights
export interface CommunityInsight {
  id: string
  insightType: 'practice' | 'outcome' | 'lesson'

  farmCharacteristics: {
    region: string
    farmSize: 'small' | 'medium' | 'large'
    cropVariety: string
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
  validationStatus: 'pending' | 'expert_verified' | 'community_validated'
  anonymizedDetails: Record<string, any>
  createdAt: Date
}

// Enhanced AI Conversation Context
export interface AIConversationContext {
  id: string
  conversationId: string
  contextType: 'farm_state' | 'decision_history' | 'preference' | 'outcome'
  contextData: Record<string, any>
  relevanceScore: number // 0-1
  decayFactor: number // How quickly context loses relevance
  createdAt: Date
  lastReferenced: Date
}
```

## AI Service Types

```typescript
// AI Disease Detection
export interface DiseaseDetectionResult {
  disease: string
  confidence: number
  severity: 'low' | 'medium' | 'high'
  treatmentRecommendations: Array<{
    type: 'chemical' | 'organic' | 'cultural'
    treatment: string
    effectiveness: number
    cost?: number
  }>
  preventionMeasures: string[]
}

// AI Chat Types
export interface AIConversation {
  id: string
  userId: string
  farmId?: number
  messages: AIMessage[]
  context?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  language: 'en' | 'hi' | 'mr'
  timestamp: Date
  metadata?: {
    confidence?: number
    sources?: string[]
    actionItems?: string[]
  }
}

// Analytics Types
export interface FarmAnalytics {
  farmId: number
  healthScore: number // 0-100
  yieldPrediction: {
    estimated: number
    confidence: number
    factors: string[]
  }
  riskAssessment: {
    disease: number
    weather: number
    market: number
    overall: number
  }
  recommendations: Array<{
    type: string
    priority: number
    description: string
    expectedImpact: string
  }>
  trends: {
    yield: Array<{ date: string; value: number }>
    costs: Array<{ date: string; value: number }>
    efficiency: Array<{ date: string; value: number }>
  }
}
```

## Utility & Helper Types

```typescript
// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    totalPages: number
    totalCount: number
  }
}

// Form Data Types
export interface FormValidation {
  isValid: boolean
  errors: Record<string, string>
}

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

// Language & Localization
export type SupportedLanguage = 'en' | 'hi' | 'mr'

export interface LocalizedContent {
  en: string
  hi: string
  mr: string
}

// Export Types
export interface ExportConfig {
  format: 'csv' | 'pdf'
  dateRange: {
    start: string
    end: string
  }
  includeImages?: boolean
  sections: string[]
}
```

---

**Last Updated:** January 5, 2025  
**Version:** 3.0 (includes Phase 3 Advanced AI types)
