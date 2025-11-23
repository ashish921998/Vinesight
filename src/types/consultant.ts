/**
 * Types for Consultant Client Management System
 * Allows consultants to manage farmer clients and provide fertilizer recommendations
 */

// ============================================================================
// Consultant Client Types
// ============================================================================

export interface ConsultantClient {
  id: number
  consultantId: string
  clientUserId?: string | null // Link to VineSight user if exists

  // Client Information
  clientName: string
  clientEmail?: string | null
  clientPhone?: string | null
  clientAddress?: string | null
  clientVillage?: string | null
  clientDistrict?: string | null
  clientState?: string | null

  // Metadata
  notes?: string | null
  status: 'active' | 'inactive' | 'archived'

  // Timestamps
  createdAt: Date
  updatedAt: Date

  // Relationships (populated when needed)
  farms?: ClientFarm[]
  labReports?: ClientLabReport[]
  recommendations?: FertilizerRecommendation[]
}

export interface ConsultantClientInsert {
  clientName: string
  clientEmail?: string | null
  clientPhone?: string | null
  clientAddress?: string | null
  clientVillage?: string | null
  clientDistrict?: string | null
  clientState?: string | null
  clientUserId?: string | null
  notes?: string | null
  status?: 'active' | 'inactive' | 'archived'
}

export interface ConsultantClientUpdate extends Partial<ConsultantClientInsert> {}

// ============================================================================
// Client Farm Types
// ============================================================================

export interface ClientFarm {
  id: number
  clientId: number
  linkedFarmId?: number | null // Link to actual VineSight farm

  // Farm details
  farmName: string
  area?: number | null
  areaUnit?: string
  grapeVariety?: string | null
  village?: string | null
  district?: string | null
  soilType?: string | null
  irrigationType?: string | null

  // Pruning info
  dateOfPruning?: Date | null
  expectedHarvestDate?: Date | null

  // Metadata
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ClientFarmInsert {
  clientId: number
  linkedFarmId?: number | null
  farmName: string
  area?: number | null
  areaUnit?: string
  grapeVariety?: string | null
  village?: string | null
  district?: string | null
  soilType?: string | null
  irrigationType?: string | null
  dateOfPruning?: Date | string | null
  expectedHarvestDate?: Date | string | null
  notes?: string | null
}

export interface ClientFarmUpdate extends Partial<Omit<ClientFarmInsert, 'clientId'>> {}

// ============================================================================
// Client Lab Report Types
// ============================================================================

export interface ClientLabReport {
  id: number
  clientId: number
  clientFarmId?: number | null
  linkedSoilTestId?: number | null
  linkedPetioleTestId?: number | null

  // Report info
  reportType: 'soil' | 'petiole'
  testDate: Date
  labName?: string | null

  // Parameters (flexible JSON)
  parameters: Record<string, number | string>

  // File info
  reportUrl?: string | null
  reportFilename?: string | null

  // Metadata
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ClientLabReportInsert {
  clientId: number
  clientFarmId?: number | null
  reportType: 'soil' | 'petiole'
  testDate: Date | string
  labName?: string | null
  parameters?: Record<string, number | string>
  reportUrl?: string | null
  reportFilename?: string | null
  notes?: string | null
}

export interface ClientLabReportUpdate extends Partial<Omit<ClientLabReportInsert, 'clientId'>> {}

// ============================================================================
// Fertilizer Recommendation Types
// ============================================================================

export interface FertilizerRecommendation {
  id: number
  consultantId: string
  clientId: number
  clientFarmId?: number | null

  // Recommendation details
  title: string
  description?: string | null
  growthStage?: string | null
  daysAfterPruningStart?: number | null
  daysAfterPruningEnd?: number | null

  // Based on reports
  basedOnSoilReportId?: number | null
  basedOnPetioleReportId?: number | null

  // Status
  status: 'draft' | 'sent' | 'acknowledged' | 'completed'
  sentAt?: Date | null
  acknowledgedAt?: Date | null

  // Metadata
  notes?: string | null
  createdAt: Date
  updatedAt: Date

  // Relationships
  items?: FertilizerRecommendationItem[]
  client?: ConsultantClient
  farm?: ClientFarm
}

export interface FertilizerRecommendationInsert {
  clientId: number
  clientFarmId?: number | null
  title: string
  description?: string | null
  growthStage?: string | null
  daysAfterPruningStart?: number | null
  daysAfterPruningEnd?: number | null
  basedOnSoilReportId?: number | null
  basedOnPetioleReportId?: number | null
  status?: 'draft' | 'sent' | 'acknowledged' | 'completed'
  notes?: string | null
}

export interface FertilizerRecommendationUpdate extends Partial<Omit<FertilizerRecommendationInsert, 'clientId'>> {}

// ============================================================================
// Fertilizer Recommendation Item Types
// ============================================================================

export interface FertilizerRecommendationItem {
  id: number
  recommendationId: number

  // Fertilizer details
  fertilizerName: string
  quantity: number
  unit: string // kg, gm, L, mL
  brand?: string | null

  // Application details
  applicationMethod?: string | null
  frequency?: string | null
  timing?: string | null

  // Pricing
  estimatedCost?: number | null

  // Order
  sortOrder: number

  // Notes
  notes?: string | null
  createdAt: Date
}

export interface FertilizerRecommendationItemInsert {
  recommendationId: number
  fertilizerName: string
  quantity: number
  unit: string
  brand?: string | null
  applicationMethod?: string | null
  frequency?: string | null
  timing?: string | null
  estimatedCost?: number | null
  sortOrder?: number
  notes?: string | null
}

export interface FertilizerRecommendationItemUpdate extends Partial<Omit<FertilizerRecommendationItemInsert, 'recommendationId'>> {}

// ============================================================================
// Summary Types (for dashboard/lists)
// ============================================================================

export interface ClientSummary {
  id: number
  clientName: string
  clientEmail?: string | null
  clientPhone?: string | null
  status: string
  farmCount: number
  reportCount: number
  recommendationCount: number
  lastActivity?: Date | null
}

export interface RecommendationSummary {
  id: number
  title: string
  clientName: string
  farmName?: string | null
  status: string
  itemCount: number
  createdAt: Date
  sentAt?: Date | null
}

// ============================================================================
// Constants
// ============================================================================

export const CLIENT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' }
] as const

export const RECOMMENDATION_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'completed', label: 'Completed' }
] as const

export const FERTILIZER_UNITS = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'gm', label: 'Grams (gm)' },
  { value: 'L', label: 'Liters (L)' },
  { value: 'mL', label: 'Milliliters (mL)' },
  { value: 'kg/acre', label: 'kg per acre' },
  { value: 'gm/L', label: 'gm per liter' }
] as const

export const APPLICATION_METHODS = [
  { value: 'soil', label: 'Soil Application' },
  { value: 'foliar', label: 'Foliar Spray' },
  { value: 'fertigation', label: 'Fertigation' },
  { value: 'drip', label: 'Through Drip' },
  { value: 'broadcast', label: 'Broadcasting' }
] as const

export const GROWTH_STAGES = [
  { value: 'dormancy', label: 'Dormancy' },
  { value: 'bud_break', label: 'Bud Break' },
  { value: 'vegetative', label: 'Vegetative Growth' },
  { value: 'flowering', label: 'Flowering' },
  { value: 'fruit_set', label: 'Fruit Set' },
  { value: 'fruit_development', label: 'Fruit Development' },
  { value: 'veraison', label: 'Veraison' },
  { value: 'ripening', label: 'Ripening' },
  { value: 'harvest', label: 'Harvest' }
] as const
