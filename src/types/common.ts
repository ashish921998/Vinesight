// Common Types & Enum-like Constants for VineSight
// Central source of truth for shared types across the application

// ===== ENUM-LIKE CONSTANTS =====

export const TASK_TYPE = {
  IRRIGATION: 'irrigation',
  SPRAY: 'spray',
  FERTIGATION: 'fertigation',
  TRAINING: 'training',
  HARVEST: 'harvest',
  PRUNING: 'pruning',
  SOIL_TEST: 'soil_test',
  MAINTENANCE: 'maintenance',
  OTHER: 'other'
} as const
export type TaskType = (typeof TASK_TYPE)[keyof typeof TASK_TYPE]

export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const
export type Priority = (typeof PRIORITY)[keyof typeof PRIORITY]

export const EXPENSE_TYPE = {
  LABOR: 'labor',
  MATERIALS: 'materials',
  EQUIPMENT: 'equipment',
  OTHER: 'other'
} as const
export type ExpenseType = (typeof EXPENSE_TYPE)[keyof typeof EXPENSE_TYPE]

export const CALCULATION_TYPE = {
  ETC: 'etc',
  NUTRIENTS: 'nutrients',
  LAI: 'lai',
  DISCHARGE: 'discharge'
} as const
export type CalculationType = (typeof CALCULATION_TYPE)[keyof typeof CALCULATION_TYPE]

export const LOCATION_SOURCE = {
  MANUAL: 'manual',
  SEARCH: 'search',
  CURRENT: 'current'
} as const
export type LocationSource = (typeof LOCATION_SOURCE)[keyof typeof LOCATION_SOURCE]

export const FARM_SIZE = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
} as const
export type FarmSize = (typeof FARM_SIZE)[keyof typeof FARM_SIZE]

export const RISK_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const
export type RiskLevel = (typeof RISK_LEVEL)[keyof typeof RISK_LEVEL]

export const EXTRACTION_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed'
} as const
export type ExtractionStatus = (typeof EXTRACTION_STATUS)[keyof typeof EXTRACTION_STATUS]

export const VALIDATION_STATUS = {
  PENDING: 'pending',
  EXPERT_VERIFIED: 'expert_verified',
  COMMUNITY_VALIDATED: 'community_validated',
  DISPUTED: 'disputed'
} as const
export type ValidationStatus = (typeof VALIDATION_STATUS)[keyof typeof VALIDATION_STATUS]

export const TASK_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  EXPIRED: 'expired'
} as const
export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS]

export const ALERT_STATUS = {
  ACTIVE: 'active',
  RESOLVED: 'resolved',
  FALSE_ALARM: 'false_alarm'
} as const
export type AlertStatus = (typeof ALERT_STATUS)[keyof typeof ALERT_STATUS]

export const IMPLEMENTATION_EFFORT = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
} as const
export type ImplementationEffort =
  (typeof IMPLEMENTATION_EFFORT)[keyof typeof IMPLEMENTATION_EFFORT]

export const CHEMICAL_UNIT = {
  GM_PER_L: 'gm/L',
  ML_PER_L: 'ml/L',
  PPM: 'ppm'
} as const
export type ChemicalUnit = (typeof CHEMICAL_UNIT)[keyof typeof CHEMICAL_UNIT]

export const FERTILIZER_UNIT = {
  KG_PER_ACRE: 'kg/acre',
  LITER_PER_ACRE: 'liter/acre'
} as const
export type FertilizerUnit = (typeof FERTILIZER_UNIT)[keyof typeof FERTILIZER_UNIT]

export const LANGUAGE = {
  EN: 'en',
  HI: 'hi',
  MR: 'mr'
} as const
export type Language = (typeof LANGUAGE)[keyof typeof LANGUAGE]

export const ADOPTION_SPEED = {
  CONSERVATIVE: 'conservative',
  MODERATE: 'moderate',
  EARLY_ADOPTER: 'early_adopter'
} as const
export type AdoptionSpeed = (typeof ADOPTION_SPEED)[keyof typeof ADOPTION_SPEED]

export const COMMUNICATION_STYLE = {
  DIRECT: 'direct',
  DETAILED: 'detailed',
  VISUAL: 'visual'
} as const
export type CommunicationStyle = (typeof COMMUNICATION_STYLE)[keyof typeof COMMUNICATION_STYLE]

export const PREFERRED_TIMING = {
  EARLY_MORNING: 'early_morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening'
} as const
export type PreferredTiming = (typeof PREFERRED_TIMING)[keyof typeof PREFERRED_TIMING]

export const PREFERRED_CHANNEL = {
  VOICE: 'voice',
  TEXT: 'text',
  VISUAL: 'visual'
} as const
export type PreferredChannel = (typeof PREFERRED_CHANNEL)[keyof typeof PREFERRED_CHANNEL]

export const INSIGHT_TYPE = {
  PRACTICE: 'practice',
  OUTCOME: 'outcome',
  LESSON: 'lesson',
  ALERT: 'alert'
} as const
export type InsightType = (typeof INSIGHT_TYPE)[keyof typeof INSIGHT_TYPE]

export const CONTEXT_TYPE = {
  FARM_STATE: 'farm_state',
  DECISION_HISTORY: 'decision_history',
  PREFERENCE: 'preference',
  OUTCOME: 'outcome',
  SEASONAL_NOTE: 'seasonal_note'
} as const
export type ContextType = (typeof CONTEXT_TYPE)[keyof typeof CONTEXT_TYPE]

export const AI_INSIGHT_TYPE = {
  PEST_PREDICTION: 'pest_prediction',
  TASK_RECOMMENDATION: 'task_recommendation',
  PROFITABILITY_INSIGHT: 'profitability_insight',
  WEATHER_ALERT: 'weather_alert',
  GENERAL_ADVICE: 'general_advice'
} as const
export type AIInsightType = (typeof AI_INSIGHT_TYPE)[keyof typeof AI_INSIGHT_TYPE]

export const ACTION_TYPE = {
  NAVIGATE: 'navigate',
  EXECUTE: 'execute',
  DISMISS: 'dismiss'
} as const
export type ActionType = (typeof ACTION_TYPE)[keyof typeof ACTION_TYPE]

export const BUTTON_TYPE = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary'
} as const
export type ButtonType = (typeof BUTTON_TYPE)[keyof typeof BUTTON_TYPE]

export const TREATMENT_TYPE = {
  CHEMICAL: 'chemical',
  ORGANIC: 'organic',
  CULTURAL: 'cultural'
} as const
export type TreatmentType = (typeof TREATMENT_TYPE)[keyof typeof TREATMENT_TYPE]

export const CRITICAL_ALERT_TYPE = {
  PEST_PREDICTION: 'pest_prediction',
  WEATHER_WARNING: 'weather_warning',
  EQUIPMENT_FAILURE: 'equipment_failure',
  MARKET_CRASH: 'market_crash'
} as const
export type CriticalAlertType = (typeof CRITICAL_ALERT_TYPE)[keyof typeof CRITICAL_ALERT_TYPE]

export const EXPENSE_FREQUENCY = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  SEASONAL: 'seasonal',
  ANNUAL: 'annual'
} as const
export type ExpenseFrequency = (typeof EXPENSE_FREQUENCY)[keyof typeof EXPENSE_FREQUENCY]

export const EXPENSE_NECESSITY = {
  ESSENTIAL: 'essential',
  IMPORTANT: 'important',
  OPTIONAL: 'optional'
} as const
export type ExpenseNecessity = (typeof EXPENSE_NECESSITY)[keyof typeof EXPENSE_NECESSITY]

// ===== COMMON INTERFACES =====

export interface Temperature {
  min: number
  max: number
  avg: number
}

export interface Humidity {
  min: number
  max: number
  avg: number
}

export interface WeatherConditions {
  temperature: Temperature
  humidity: Humidity
  precipitation: number
  windSpeed: number
  pressure?: number
  cloudCover?: number
}

export interface DateRange {
  start: Date
  end: Date
}

export interface TimeWindow {
  start: Date
  end: Date
  urgency: string
}

export interface ConfidenceInterval {
  lower: number
  upper: number
}

export interface Coordinates {
  latitude: number
  longitude: number
  elevation?: number
}

export interface LocationInfo extends Coordinates {
  locationName?: string
  timezone?: string
  locationSource?: LocationSource
  locationUpdatedAt?: string
}

// ===== CALCULATION TYPES =====

export interface CalculationInputs {
  [key: string]: number | string | boolean | null | undefined
}

export interface CalculationOutputs {
  [key: string]: number | string | boolean | null | undefined
}

// ===== SEASONAL & TIMING =====

export interface SeasonalPattern {
  month: number
  activityCount: number
  averageEffectiveness: number
  commonOperations: string[]
}

export interface SeasonalPatterns {
  [monthKey: string]: SeasonalPattern
}

// ===== BENCHMARKING =====

export interface MetricBenchmark {
  avg: number
  top10: number
  top25: number
}

export interface FarmMetrics {
  yieldPerAcre: MetricBenchmark
  costPerKg: MetricBenchmark
  profitMargin: MetricBenchmark
  waterUsage: MetricBenchmark
}

// ===== ERROR & RESPONSE TYPES =====

export interface ServiceError {
  code: string
  message: string
  details?: unknown
}

export interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: ServiceError
  metadata?: {
    timestamp: Date
    version?: string
    [key: string]: unknown
  }
}

// ===== PAGINATION =====

export interface PaginationParams {
  page: number
  limit: number
  offset?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Type guard utilities
export const isValidEnum = <T extends Record<string, string>>(
  enumObj: T,
  value: unknown
): value is T[keyof T] => {
  return Object.values(enumObj).includes(value as T[keyof T])
}
