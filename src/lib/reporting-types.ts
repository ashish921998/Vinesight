export interface ComplianceReport {
  id: string
  farmId: string
  reportType: 'organic' | 'pesticide' | 'water_usage' | 'soil_health' | 'harvest'
  title: string
  generatedAt: Date
  periodStart: Date
  periodEnd: Date
  status: 'draft' | 'completed' | 'submitted'
  data: any
  metadata: {
    generatedBy: string
    version: string
    certificationBody?: string
    regulatoryStandard: string
  }
}

export interface FinancialReport {
  id: string
  farmId: string
  reportType: 'cost_analysis' | 'profit_loss' | 'roi_analysis' | 'budget_vs_actual'
  title: string
  generatedAt: Date
  periodStart: Date
  periodEnd: Date
  currency: string
  data: {
    totalRevenue: number
    totalCosts: number
    netProfit: number
    profitMargin: number
    costBreakdown: CostCategory[]
    revenueBreakdown: RevenueSource[]
  }
}

export interface CostCategory {
  category:
    | 'labor'
    | 'materials'
    | 'equipment'
    | 'utilities'
    | 'pesticides'
    | 'fertilizers'
    | 'other'
  subcategory: string
  amount: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
}

export interface RevenueSource {
  source: 'grape_sales' | 'wine_production' | 'agritourism' | 'consulting' | 'other'
  description: string
  amount: number
  percentage: number
  quantity?: number
  unitPrice?: number
}

export interface PesticideUsageRecord {
  date: Date
  pesticideName: string
  activeIngredient: string
  concentration: number
  applicationRate: number
  areaApplied: number
  totalAmount: number
  preHarvestInterval: number
  applicationMethod: string
  weatherConditions: string
  applicatorName: string
  certificationNumber?: string
}

export interface OrganicComplianceData {
  certificationBody: string
  certificationNumber: string
  certificationExpiry: Date
  organicInputsUsed: OrganicInput[]
  prohibitedSubstancesCheck: boolean
  bufferZoneCompliance: boolean
  recordKeepingCompliance: boolean
  inspectionDate?: Date
  nonComplianceIssues: string[]
}

export interface OrganicInput {
  name: string
  supplier: string
  certificationStatus: 'certified' | 'pending' | 'not_required'
  usageAmount: number
  applicationDate: Date
  purpose: string
}

export interface WaterUsageCompliance {
  waterSource: 'well' | 'canal' | 'reservoir' | 'municipal' | 'rainwater'
  licenseNumber?: string
  allocatedAmount: number
  actualUsage: number
  compliancePercentage: number
  conservationMeasures: string[]
  qualityTestResults: WaterQualityTest[]
}

export interface WaterQualityTest {
  testDate: Date
  ph: number
  salinity: number
  nitrates: number
  phosphates: number
  heavyMetals: { [key: string]: number }
  bacterialCount: number
  complianceStatus: 'compliant' | 'non_compliant' | 'pending'
}

export interface SoilHealthReport {
  testDate: Date
  laboratory: string
  sampleLocations: SoilSample[]
  overallRating: 'excellent' | 'good' | 'fair' | 'poor'
  recommendations: string[]
  complianceNotes: string
}

export interface SoilSample {
  location: string
  depth: number
  ph: number
  organicMatter: number
  nitrogen: number
  phosphorus: number
  potassium: number
  micronutrients: { [key: string]: number }
  heavyMetals: { [key: string]: number }
  soilStructure: string
}

export interface HarvestRecord {
  harvestDate: Date
  blockId: string
  varietyName: string
  quantity: number
  quality: 'premium' | 'standard' | 'processing'
  sugarContent: number
  acidity: number
  destinationBuyer: string
  pricePerUnit: number
  totalValue: number
  laborHours: number
  equipment: string[]
  weatherConditions: string
  notes: string
}

export interface ReportTemplate {
  id: string
  name: string
  type: ComplianceReport['reportType'] | FinancialReport['reportType']
  description: string
  requiredFields: string[]
  sections: ReportSection[]
  formatting: ReportFormatting
  isActive: boolean
}

export interface ReportSection {
  id: string
  title: string
  order: number
  type: 'text' | 'table' | 'chart' | 'image' | 'summary'
  content: any
  isRequired: boolean
}

export interface ReportFormatting {
  pageSize: 'A4' | 'Letter'
  orientation: 'portrait' | 'landscape'
  margins: {
    top: number
    bottom: number
    left: number
    right: number
  }
  headerFooter: {
    includeHeader: boolean
    includeFooter: boolean
    headerContent: string
    footerContent: string
  }
  styling: {
    fontFamily: string
    fontSize: number
    lineHeight: number
    colors: {
      primary: string
      secondary: string
      text: string
      background: string
    }
  }
}

export interface ReportExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json'
  includeCharts: boolean
  includeImages: boolean
  compressionLevel?: 'low' | 'medium' | 'high'
  passwordProtect?: boolean
  password?: string
}

export interface RegulatoryCompliance {
  region: 'india' | 'maharashtra' | 'karnataka' | 'other'
  standards: RegulatoryStandard[]
  lastAuditDate?: Date
  nextAuditDate?: Date
  complianceScore: number
  issues: ComplianceIssue[]
}

export interface RegulatoryStandard {
  name: string
  authority: string
  description: string
  requirements: string[]
  complianceStatus: 'compliant' | 'non_compliant' | 'pending' | 'not_applicable'
  lastChecked: Date
  evidence: string[]
}

export interface ComplianceIssue {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  regulation: string
  discoveredDate: Date
  dueDate: Date
  status: 'open' | 'in_progress' | 'resolved'
  assignedTo?: string
  resolutionNotes?: string
  resolvedDate?: Date
}
