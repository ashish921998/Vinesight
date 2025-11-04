// AI & Machine Learning Types for VineSight
// Consolidated from ai-intelligence.ts and lib/types/ai-types.ts
// This is the single source of truth for all AI-related type definitions

import type {
  TaskType,
  Priority,
  RiskLevel,
  TaskStatus,
  AlertStatus,
  ImplementationEffort,
  Language,
  AdoptionSpeed,
  CommunicationStyle,
  PreferredTiming,
  PreferredChannel,
  InsightType,
  ContextType,
  AIInsightType,
  ActionType,
  ButtonType,
  TreatmentType,
  CriticalAlertType,
  ValidationStatus,
  FarmSize,
  WeatherConditions,
  TimeWindow,
  ConfidenceInterval,
  SeasonalPatterns,
  ExpenseFrequency,
  ExpenseNecessity,
  FarmMetrics
} from './common'

// ===== FARMER AI PROFILE =====

export interface SuccessMetrics {
  averageYield: number
  costEfficiency: number
  profitability: number
  waterUseEfficiency: number
}

export interface DecisionPatterns {
  preferredTiming: PreferredTiming
  riskAversion: number
  adoptionSpeed: AdoptionSpeed
  communicationStyle: CommunicationStyle
}

export interface LearningPreferences {
  preferredChannels: PreferredChannel[]
  bestResponseTimes: string[]
  languagePreference: Language
}

export interface FarmerAIProfile {
  id: string
  userId: string
  farmId: number
  riskTolerance: number // 0-1 scale
  decisionPatterns: DecisionPatterns
  successMetrics: SuccessMetrics
  learningPreferences: LearningPreferences
  seasonalPatterns: SeasonalPatterns
  createdAt: Date
  updatedAt: Date
}

// ===== TASK RECOMMENDATIONS =====

export interface TaskDetails {
  duration?: number // minutes
  resources?: string[]
  conditions?: string[]
  alternatives?: string[]
}

export interface AITaskRecommendation {
  id: string
  farmId: number
  userId: string
  taskType: TaskType
  recommendedDate: Date
  priorityScore: number // 0-1
  weatherDependent: boolean
  reasoning: string // AI explanation
  confidenceScore: number // 0-1
  status: TaskStatus
  farmerFeedback?: string
  outcomeTracked: boolean
  taskDetails: TaskDetails
  createdAt: Date
  expiresAt?: Date
}

// ===== PEST & DISEASE PREDICTION =====

export interface TemperatureTrigger {
  min: number
  max: number
}

export interface HumidityTrigger {
  threshold: number
}

export interface RainfallTrigger {
  days: number
  amount: number
}

export interface WeatherTriggers {
  temperature: TemperatureTrigger
  humidity: HumidityTrigger
  rainfall?: RainfallTrigger
  windSpeedThreshold?: number
}

export interface PreventionWindow {
  startDate: Date
  endDate: Date
  optimalTiming: string
}

export interface ChemicalTreatment {
  product: string
  dosage: string
  cost: number
  effectiveness: number
}

export interface OrganicTreatment {
  method: string
  description: string
  effectiveness: number
}

export interface TreatmentRecommendations {
  chemical: ChemicalTreatment[]
  organic: OrganicTreatment[]
  cultural: string[]
}

export interface PestDiseasePrediction {
  id: string
  farmId: number
  region: string
  pestDiseaseType: string
  riskLevel: RiskLevel
  probabilityScore: number // 0-1
  predictedOnsetDate: Date
  weatherTriggers: WeatherTriggers
  preventionWindow: PreventionWindow
  recommendedTreatments: TreatmentRecommendations
  communityReports: number
  status: AlertStatus
  farmerActionTaken?: string
  outcome?: string
  alertPriority?: Priority
  createdAt: Date
  updatedAt?: Date
  resolvedAt?: Date
}

// ===== PROFITABILITY ANALYSIS =====

export interface ExpenseBreakdown {
  labor: number
  materials: number
  equipment: number
  utilities: number
  other: number
}

export interface EfficiencyScores {
  waterUse: number // liters per kg yield
  laborProductivity: number // hours per kg yield
  inputCostRatio: number // cost per kg yield
  overallEfficiency: number // 0-100 score
}

export interface BenchmarkComparison {
  regionalAverage: number
  topPerformers: number
  yourRanking: number // percentile
}

export interface ImprovementOpportunity {
  category: string
  currentCost: number
  potentialSavings: number
  implementationEffort: ImplementationEffort
  recommendations: string[]
}

export interface PredictedImpact {
  costSavings: number
  yieldIncrease: number
  profitabilityImprovement: number
}

export interface ActualOutcome {
  category: string
  implementedDate: Date
  actualSavings: number
  actualYieldChange: number
  notes?: string
}

export interface ProfitabilityAnalysis {
  id: string
  farmId: number
  userId: string
  analysisPeriodStart: Date
  analysisPeriodEnd: Date
  totalExpenses: number
  expenseBreakdown: ExpenseBreakdown
  efficiencyScores: EfficiencyScores
  roiCalculation: number // percentage
  benchmarkComparison: BenchmarkComparison
  improvementOpportunities: ImprovementOpportunity[]
  predictedImpact: PredictedImpact
  farmerImplemented: string[]
  actualOutcomes?: ActualOutcome[]
  createdAt: Date
}

// ===== MARKET INTELLIGENCE =====

export interface HistoricalPricePoint {
  date: Date
  price: number
  volume: number
}

export interface PriceForecast {
  date: Date
  predictedPrice: number
  confidence: number
}

export interface PriceData {
  current: number
  historical: HistoricalPricePoint[]
  forecast: PriceForecast[]
}

export interface QualityPremiums {
  [grade: string]: number // percentage premium
}

export interface DemandForecast {
  [month: string]: number // demand index
}

export interface SeasonalTrend {
  month: string
  avgPrice: number
  priceVolatility: number
  demandLevel: number
}

export interface SeasonalTrends {
  [periodKey: string]: SeasonalTrend
}

export interface ContractOpportunity {
  buyer: string
  terms: string
  priceOffer: number
}

export interface SupplyChainInsights {
  buyerPreferences: string[]
  logisticsCosts: number
  contractOpportunities: ContractOpportunity[]
}

export interface MarketIntelligence {
  id: string
  region: string
  grapeVariety?: string
  priceData: PriceData
  qualityPremiums: QualityPremiums
  demandForecast: DemandForecast
  seasonalTrends: SeasonalTrends
  supplyChainInsights: SupplyChainInsights
  predictionDate: Date
  confidenceInterval: ConfidenceInterval
  dataSources: string[]
  createdAt: Date
  expiresAt?: Date
}

// ===== COMMUNITY INSIGHTS =====

export interface FarmCharacteristics {
  region: string
  farmSize: FarmSize
  grapeVariety: string
  soilType: string
  climaticConditions: string
}

export interface OutcomeMetrics {
  yieldIncrease?: number // percentage
  costReduction?: number // percentage
  qualityImprovement?: number // grade improvement
  timesSaved?: number // hours per season
}

export interface CommunityInsight {
  id: string
  insightType: InsightType
  farmCharacteristics: FarmCharacteristics
  practiceDescription: string
  outcomeMetrics: OutcomeMetrics
  seasonalTiming: string
  regionalRelevance: string[]
  successScore: number // 0-1
  adoptionCount: number
  validationStatus: ValidationStatus
  anonymizedDetails: Record<string, unknown>
  createdAt: Date
  validatedAt?: Date
}

// ===== AI CONVERSATION CONTEXT =====

export interface ConversationContextData {
  [key: string]: string | number | boolean | null | undefined | object
}

export interface AIConversationContext {
  id: string
  conversationId: string
  contextType: ContextType
  contextData: ConversationContextData
  relevanceScore: number // 0-1
  decayFactor: number // How quickly context loses relevance
  createdAt: Date
  lastReferenced: Date
}

// ===== AI INSIGHTS =====

export interface PestInsightDetails {
  pestType: string
  riskLevel: RiskLevel
  predictedDate: string
  preventionWindow: { start: string; end: string }
  treatments: Array<{
    name: string
    cost: number
    effectiveness: number
    type: TreatmentType
  }>
}

export interface TaskInsightDetails {
  taskType: TaskType
  recommendedDate: string
  duration?: number
  resources?: string[]
  weatherDependent: boolean
}

export interface ProfitabilityInsightDetails {
  category: string
  currentCost: number
  potentialSavings: number
  roiImprovement: number
  implementationEffort: ImplementationEffort
}

export interface InsightActionData {
  route?: string
  taskId?: string
  pestId?: string
  expiresAt?: Date | string
  analysis?: unknown
  recommendations?: unknown
  [key: string]: unknown
}

export interface AIInsight {
  id: string
  type: AIInsightType
  title: string
  subtitle: string
  description?: string
  icon: string
  priority: Priority
  confidence: number
  timeRelevant: boolean
  actionType: ActionType
  actionData?: InsightActionData
  actionLabel: string
  tags?: string[]
  pestDetails?: PestInsightDetails
  taskDetails?: TaskInsightDetails
  profitabilityDetails?: ProfitabilityInsightDetails
}

// ===== CRITICAL ALERTS =====

export interface AlertAction {
  label: string
  type: ButtonType
  action: ActionType
  actionData?: Record<string, unknown>
}

export interface CriticalAlert {
  id: string
  type: CriticalAlertType
  severity: Extract<Priority, 'high' | 'critical'>
  title: string
  message: string
  icon: string
  actionRequired: boolean
  timeWindow: TimeWindow
  actions: AlertAction[]
  farmId: number
  createdAt: Date
  acknowledgedAt?: Date
  resolvedAt?: Date
}

// ===== WEATHER DATA =====
export interface WeatherData extends WeatherConditions {
  date: string
}

// ===== RISK ASSESSMENT =====

export interface RiskCategoryScores {
  weather: number
  pest: number
  disease: number
  market: number
  resource: number
}

export interface RiskRecommendation {
  type: string
  priority: Priority
  action: string
  timing: string
  confidence: number
}

export interface RiskAssessment {
  overall: number // 0-1 overall risk score
  categories: RiskCategoryScores
  recommendations: RiskRecommendation[]
}

// ===== PEST RISK FACTORS =====

export interface TemperatureRiskFactor {
  optimal: [number, number]
  weight: number
}

export interface HumidityRiskFactor {
  threshold: number
  weight: number
}

export interface RainfallRiskFactor {
  days: number
  threshold: number
  weight: number
}

export interface DrySpellRiskFactor {
  days: number
  weight: number
}

export interface WindSpeedRiskFactor {
  threshold: number
  weight: number
}

export interface SeasonalFactors {
  [seasonKey: string]: number
}

export interface PestRiskFactor {
  temperature: TemperatureRiskFactor
  humidity: HumidityRiskFactor
  rainfall?: RainfallRiskFactor
  drySpell?: DrySpellRiskFactor
  windSpeed?: WindSpeedRiskFactor
  historicalMultiplier: number
  seasonalFactor: SeasonalFactors
}

export interface PestRiskFactors {
  [pestType: string]: PestRiskFactor
}

// ===== AI SERVICE TYPES =====

export interface AIMetadata {
  timestamp?: Date
  modelVersion?: string
  processingTime?: number
  [key: string]: unknown
}

export interface AIServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
  confidence?: number
  message?: string
  metadata?: AIMetadata
}

export interface RequestContext {
  currentWeather?: WeatherData
  growthStage?: string
  recentActivities?: string[]
  availableResources?: string[]
  farmConditions?: Record<string, number | string | boolean>
}

export interface RequestPreferences {
  riskTolerance?: number
  preferredTiming?: string[]
  excludeTypes?: TaskType[]
}

export interface RecommendationRequest {
  farmId: number
  userId: string
  context: RequestContext
  preferences?: RequestPreferences
}

export interface InsightSummary {
  type: string
  title: string
  description: string
  confidence: number
  actionRequired: boolean
}

export interface RecommendationResponse {
  taskRecommendations: AITaskRecommendation[]
  riskAssessments: RiskAssessment
  insights: InsightSummary[]
  personalizedNotes: string[]
}

// ===== UTILITY TYPES =====

export interface RecentTask {
  id: number
  type: TaskType | string
  date: string
  [key: string]: unknown
}

export interface TaskGenerationContext {
  farm: Record<string, unknown> // Farm data - flexible for different farm schemas
  weather: WeatherData[]
  growthStage: string
  recentTasks: RecentTask[]
  farmerProfile: FarmerAIProfile
  riskAssessment: RiskAssessment
}

export interface ExpenseCategory {
  category: string
  subcategory?: string
  amount: number
  frequency: ExpenseFrequency
  necessity: ExpenseNecessity
  optimizationPotential: number // 0-1 score
}

export interface PracticeBenchmark {
  practice: string
  adoptionRate: number
  impactOnYield: number
  impactOnCost: number
}

export interface BenchmarkData {
  region: string
  farmSize: FarmSize
  grapeVariety: string
  metrics: FarmMetrics
  practices: PracticeBenchmark[]
}
