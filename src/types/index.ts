// Central export file for all types
// Import types from this file to ensure consistency across the application

// Common types and enums
export * from './common'

// Database-generated types
export type { Database } from './database'

// Application types - export individually to avoid conflicts
export type {
  TaskReminder,
  Farm,
  SimpleWeatherData,
  DatabaseRow,
  DatabaseInsert,
  DatabaseUpdate
} from './types'
export { taskReminderFromDB } from './types'

// AI types - export individually to avoid WeatherData conflict
export type {
  FarmerAIProfile,
  SuccessMetrics,
  DecisionPatterns,
  LearningPreferences,
  AITaskRecommendation,
  TaskDetails,
  PestDiseasePrediction,
  TemperatureTrigger,
  HumidityTrigger,
  RainfallTrigger,
  WeatherTriggers,
  PreventionWindow,
  ChemicalTreatment,
  OrganicTreatment,
  TreatmentRecommendations,
  ProfitabilityAnalysis,
  ExpenseBreakdown,
  EfficiencyScores,
  BenchmarkComparison,
  ImprovementOpportunity,
  PredictedImpact,
  ActualOutcome,
  MarketIntelligence,
  HistoricalPricePoint,
  PriceForecast,
  PriceData,
  QualityPremiums,
  DemandForecast,
  SeasonalTrend,
  SeasonalTrends,
  ContractOpportunity,
  SupplyChainInsights,
  CommunityInsight,
  FarmCharacteristics,
  OutcomeMetrics,
  AIConversationContext,
  ConversationContextData,
  AIInsight,
  PestInsightDetails,
  TaskInsightDetails,
  ProfitabilityInsightDetails,
  CriticalAlert,
  AlertAction,
  WeatherData,
  RiskAssessment,
  RiskCategoryScores,
  RiskRecommendation,
  PestRiskFactors,
  PestRiskFactor,
  TemperatureRiskFactor,
  HumidityRiskFactor,
  RainfallRiskFactor,
  DrySpellRiskFactor,
  WindSpeedRiskFactor,
  SeasonalFactors,
  AIServiceResponse,
  AIMetadata,
  RequestContext,
  RequestPreferences,
  RecommendationRequest,
  InsightSummary,
  RecommendationResponse,
  RecentTask,
  TaskGenerationContext,
  ExpenseCategory,
  PracticeBenchmark,
  BenchmarkData
} from './ai'

// Report types
export * from './reports'
