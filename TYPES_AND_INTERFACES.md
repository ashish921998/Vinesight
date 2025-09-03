# FarmAI TypeScript Types & Interfaces Documentation

## 📋 Table of Contents
- [Database Types (Supabase)](#database-types-supabase)
- [Business Domain Types](#business-domain-types)
- [Service Types](#service-types)  
- [AI & Machine Learning Types](#ai--machine-learning-types)
- [Analytics & Reporting Types](#analytics--reporting-types)
- [Calculator Types](#calculator-types)
- [Weather & Environmental Types](#weather--environmental-types)
- [Conversation & Messaging Types](#conversation--messaging-types)
- [Utility & Hook Types](#utility--hook-types)
- [Type Relationships](#type-relationships)
- [Best Practices](#best-practices)

---

## Database Types (Supabase)

### Core Database Schema
**File:** `src/types/database.ts`

```typescript
export type Database = {
  public: {
    Tables: {
      // All table definitions with Row, Insert, Update types
    }
  }
}
```

### Table Types Structure
Each table follows the pattern:
```typescript
table_name: {
  Row: { /* All fields for reading */ }
  Insert: { /* Fields for creating (some optional) */ }
  Update: { /* Fields for updating (most optional) */ }
}
```

#### AI Conversation Tables

**ai_conversations**
```typescript
Row: {
  id: number
  user_id: string | null
  farm_id: number | null  
  title: string
  topic_category: string | null
  summary: string | null
  last_message_at: string | null
  message_count: number | null
  context_tags: any | null
  created_at: string | null
  updated_at: string | null
}
```

**ai_messages** 
```typescript
Row: {
  id: number
  conversation_id: number | null
  role: string // 'user' | 'assistant' | 'system'
  content: string
  context_data: any | null
  farm_references: any | null
  confidence_score: number | null
  token_count: number | null
  processing_time: number | null
  created_at: string | null
}
```

#### Farm Management Tables

**farms**
```typescript
Row: {
  id: number
  name: string
  region: string
  area: number
  grape_variety: string
  planting_date: string
  vine_spacing: number
  row_spacing: number
  total_tank_capacity: number | null
  system_discharge: number | null
  remaining_water: number | null
  water_calculation_updated_at: string | null
  latitude: number | null
  longitude: number | null
  elevation: number | null
  location_name: string | null
  timezone: string | null
  location_source: string | null
  location_updated_at: string | null
  created_at: string | null
  updated_at: string | null
  user_id: string | null
}
```

**irrigation_records, spray_records, fertigation_records, harvest_records, expense_records, soil_test_records, calculation_history, task_reminders**
- Each with similar Row/Insert/Update structure
- All reference `farm_id: number`

---

## Business Domain Types

### Core Farm Types  
**File:** `src/lib/supabase.ts`

#### Farm Entity
```typescript
interface Farm {
  id?: number;
  name: string;
  region: string;
  area: number; // in acres
  grape_variety: string;
  planting_date: string;
  vine_spacing: number; // in meters
  row_spacing: number; // in meters
  total_tank_capacity?: number; // in liters
  system_discharge?: number; // in liters per hour
  remaining_water?: number; // in mm
  water_calculation_updated_at?: string;
  
  // Location data
  latitude?: number;
  longitude?: number;
  elevation?: number;
  location_name?: string;
  timezone?: string;
  location_source?: 'manual' | 'search' | 'current';
  location_updated_at?: string;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}
```

#### Record Types
```typescript
interface IrrigationRecord {
  id?: number;
  farm_id: number;
  date: string;
  duration: number; // hours
  area: number; // acres irrigated
  growth_stage: string;
  moisture_status: string;
  system_discharge: number; // L/hr
  notes?: string;
  created_at?: string;
}

interface SprayRecord {
  id?: number;
  farm_id: number;
  date: string;
  pest_disease: string;
  chemical: string;
  dose: string;
  area: number; // acres
  weather: string;
  operator: string;
  notes?: string;
  created_at?: string;
}

interface ExpenseRecord {
  id?: number;
  farm_id: number;
  date: string;
  type: 'labor' | 'materials' | 'equipment' | 'other';
  description: string;
  cost: number;
  remarks?: string;
  created_at?: string;
}

interface TaskReminder {
  id?: number;
  farm_id: number;
  title: string;
  description?: string;
  due_date: string;
  type: 'irrigation' | 'spray' | 'fertigation' | 'training' | 'harvest' | 'other';
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  created_at?: string;
  completed_at?: string;
}
```

---

## Service Types

### AI Service Types
**File:** `src/lib/ai-service.ts`

#### Disease Detection
```typescript
interface DiseaseDetectionResult {
  disease: string;
  confidence: number; // 0-1
  severity: 'low' | 'medium' | 'high' | 'critical';
  treatment: string;
  description: string;
  preventionTips: string[];
}

interface ImageAnalysisResult {
  diseaseDetection: DiseaseDetectionResult[];
  plantHealth: {
    overallHealth: number; // 0-100
    leafColor: string;
    leafDamage: number; // 0-100
  };
  grapeClusterCount?: number;
  berrySize?: 'small' | 'medium' | 'large';
  ripeness?: number; // 0-100
}
```

#### AI Recommendations
```typescript
interface AIRecommendation {
  id: string;
  category: 'irrigation' | 'fertilization' | 'pest_control' | 'pruning' | 'harvest' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  actions: string[];
  timing: string;
  expectedImpact: string;
  farmId: number;
  createdAt: Date;
}
```

### Analytics Service Types  
**File:** `src/lib/analytics-service.ts`

```typescript
interface CostAnalysis {
  totalCosts: number;
  costPerAcre: number;
  profitMargin: number;
  costBreakdown: {
    labor: number;
    materials: number;
    equipment: number;
    other: number;
  };
  monthlyTrends: Array<{
    month: string;
    cost: number;
  }>;
  roi: number;
}

interface YieldAnalysis {
  currentYield: number;
  targetYield: number;
  yieldEfficiency: number; // 0-100
  yieldTrends: Array<{
    period: string;
    yield: number;
  }>;
  projectedYield: number;
  benchmarkComparison: number;
}

interface PerformanceMetrics {
  overallScore: number; // 0-100
  irrigation: number;
  nutrition: number;
  pestManagement: number;
  yieldQuality: number;
  recommendations: string[];
  alerts: Array<{
    type: 'warning' | 'critical';
    message: string;
  }>;
}
```

---

## AI & Machine Learning Types

### Plant Health Analysis
```typescript
interface PlantHealthMetrics {
  ndviScore: number; // -1 to 1
  chlorophyllContent: number;
  leafAreaIndex: number;
  stressIndicators: {
    waterStress: boolean;
    nutrientDeficiency: boolean;
    diseaseSymptoms: boolean;
  };
  overallHealthScore: number; // 0-100
}

interface VineConditionAssessment {
  vigour: 'low' | 'moderate' | 'high';
  canopyDensity: number; // 0-100
  fruitLoad: 'light' | 'moderate' | 'heavy';
  maturityStage: GrapeGrowthStage;
  qualityPrediction: {
    sugarContent: number;
    acidity: number;
    expectedQuality: 'poor' | 'good' | 'excellent';
  };
}
```

### Prediction Models
```typescript
interface YieldPredictionModel {
  modelType: 'linear' | 'polynomial' | 'neural_network';
  accuracy: number; // 0-1
  lastTrained: Date;
  features: string[];
  predictions: {
    expectedYield: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
    riskFactors: string[];
  };
}
```

---

## Analytics & Reporting Types

### Reporting Framework
**File:** `src/lib/reporting-types.ts`

#### Compliance Reporting
```typescript
interface ComplianceReport {
  id: string;
  farmId: number;
  reportType: 'organic' | 'pesticide' | 'water_usage' | 'soil_health' | 'harvest';
  period: {
    startDate: string;
    endDate: string;
  };
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  data: any; // Specific to report type
  generatedAt: string;
  submittedAt?: string;
  metadata: {
    version: string;
    regulations: string[];
    certifyingBody?: string;
  };
}

interface PesticideUsageRecord {
  id: string;
  applicationDate: string;
  product: {
    name: string;
    activeIngredient: string;
    registrationNumber: string;
    organicApproved: boolean;
  };
  targetPest: string;
  applicationRate: number;
  totalQuantity: number;
  area: number;
  weather: {
    temperature: number;
    humidity: number;
    windSpeed: number;
  };
  operator: string;
  equipment: string;
  prehiInterval: number; // days
  reentryInterval: number; // hours
}
```

#### Financial Reporting  
```typescript
interface FinancialReport {
  period: { startDate: string; endDate: string; };
  revenue: {
    total: number;
    sources: RevenueSource[];
  };
  costs: {
    total: number;
    categories: CostCategory[];
  };
  profitability: {
    grossProfit: number;
    netProfit: number;
    margin: number;
    roi: number;
  };
}

interface CostCategory {
  name: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  items: Array<{
    description: string;
    amount: number;
    date: string;
  }>;
}
```

---

## Calculator Types

### ETc (Evapotranspiration) Calculator
**File:** `src/lib/etc-calculator.ts`

#### Input Types
```typescript
interface WeatherData {
  date: string;
  temperatureMax: number; // °C
  temperatureMin: number; // °C  
  humidity: number; // %
  windSpeed: number; // m/s
  rainfall: number; // mm
  solarRadiation?: number; // MJ/m²/day
  atmosphericPressure?: number; // kPa
}

interface ETcCalculationInputs {
  farmId: number;
  weatherData: WeatherData[];
  growthStage: GrapeGrowthStage;
  plantingDate: string;
  location: {
    latitude: number;
    longitude: number;
    elevation: number;
  };
  irrigationMethod: 'drip' | 'sprinkler' | 'flood' | 'micro_sprinkler';
  soilType: 'clay' | 'loam' | 'sand' | 'sandy_loam' | 'clay_loam';
}

enum GrapeGrowthStage {
  DORMANT = 'dormant',
  BUDBREAK = 'budbreak', 
  FLOWERING = 'flowering',
  FRUIT_SET = 'fruit_set',
  VERAISON = 'veraison',
  HARVEST = 'harvest',
  POST_HARVEST = 'post_harvest'
}
```

#### Output Types
```typescript
interface ETcResults {
  date: string;
  eto: number; // mm/day - Reference evapotranspiration
  kc: number; // Crop coefficient
  etc: number; // mm/day - Crop evapotranspiration  
  irrigationNeed: number; // mm
  irrigationRecommendation: IrrigationRecommendation;
  growthStage: GrapeGrowthStage;
  confidence: number; // 0-1
}

interface IrrigationRecommendation {
  shouldIrrigate: boolean;
  duration: number; // hours
  frequency: 'daily' | 'every_2_days' | 'weekly';
  notes: string[];
}
```

### Nutrient Calculator
**File:** `src/lib/nutrient-calculator.ts`

#### Soil Analysis Types  
```typescript
interface SoilTestResults {
  id: string;
  testDate: string;
  ph: number;
  organicMatter: number; // %
  
  // Macronutrients (ppm or kg/ha)
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  calcium: number;
  magnesium: number;
  sulfur: number;
  
  // Micronutrients (ppm)
  boron: number;
  zinc: number;
  manganese: number;
  iron: number;
  copper: number;
  
  cec: number; // Cation exchange capacity
}
```

#### Fertilization Planning
```typescript
interface NutrientCalculationInputs {
  farmId: number;
  targetYield: number; // tonnes/hectare
  currentGrowthStage: GrapeGrowthStage;
  soilTest: SoilTestResults;
  grapeVariety: string;
  irrigationMethod: string;
  previousApplications: PreviousApplication[];
  farmArea: number; // hectares
}

interface NutrientResults {
  nitrogen: NutrientRecommendation;
  phosphorus: NutrientRecommendation;
  potassium: NutrientRecommendation;
  calcium: NutrientRecommendation;
  magnesium: NutrientRecommendation;
  sulfur: NutrientRecommendation;
  micronutrients: { [key: string]: NutrientRecommendation };
  
  fertilizerProgram: FertilizerProgram;
  totalCost: number;
  applicationSchedule: ApplicationSchedule[];
  soilHealthAssessment: SoilHealthAssessment;
}

interface NutrientRecommendation {
  required: number; // kg/ha
  available: number; // kg/ha (from soil)
  deficit: number; // kg/ha to apply
  timing: ApplicationTiming[];
  form: 'liquid' | 'granular' | 'foliar';
  method: 'fertigation' | 'broadcast' | 'foliar_spray';
  notes: string[];
}
```

---

## Weather & Environmental Types

### Weather Data  
**File:** `src/lib/weather-service.ts`

```typescript
interface WeatherData {
  current: CurrentWeather;
  forecast: ForecastDay[];
  location: LocationData;
  lastUpdated: string;
}

interface CurrentWeather {
  temperature: number; // °C
  humidity: number; // %
  windSpeed: number; // m/s
  windDirection: string;
  pressure: number; // hPa
  uvIndex: number;
  cloudCover: number; // %
  visibility: number; // km
  condition: string;
  icon: string;
}

interface ForecastDay {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  humidity: number;
  precipitation: number; // mm
  precipitationProbability: number; // %
  windSpeed: number;
  windDirection: string;
  condition: string;
  sunrise: string;
  sunset: string;
}

interface LocationData {
  name: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}
```

### Agricultural Weather Alerts
```typescript
interface WeatherAlerts {
  irrigation: {
    recommendation: 'irrigate' | 'postpone' | 'reduce';
    reason: string;
    urgency: 'low' | 'medium' | 'high';
  };
  pest: {
    riskLevel: 'low' | 'medium' | 'high';
    conditions: string[];
    recommendations: string[];
  };
  harvest: {
    suitability: 'poor' | 'fair' | 'good' | 'excellent';
    window: {
      start: string;
      end: string;
    };
    notes: string[];
  };
}

interface ETc {
  daily: number; // mm/day
  weekly: number; // mm/week  
  monthly: number; // mm/month
  recommendation: string;
}
```

---

## Conversation & Messaging Types

### Core Messaging
**File:** `src/lib/conversation-storage.ts`

```typescript
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  language?: string;
  attachments?: Array<{
    type: 'image';
    name: string;
    url: string;  
    size?: number;
  }>;
  context?: {
    queryType?: string;
    confidence?: number;
    relatedTopics?: string[];
    farmReferences?: any;
    tokenCount?: number;
    processingTime?: number;
  };
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  farmId?: number;
  topicCategory?: string;
  summary?: string;
  lastMessageAt?: Date;
  messageCount?: number;
  contextTags?: string[];
}
```

### Enhanced Supabase Messaging
**File:** `src/lib/supabase-conversation-storage.ts`

Extends base types with additional database-specific features:
- Persistent storage across devices
- User authentication integration  
- Farm context linking
- Advanced search and filtering
- Quota tracking and management

---

## Utility & Hook Types  

### Authentication Hook
**File:** `src/hooks/useSupabaseAuth.ts`

```typescript
interface useSupabaseAuth {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}
```

### ETc Calculator Hook  
**File:** `src/hooks/useETcCalculator.ts`

```typescript
interface useETcCalculator {
  // Form state
  inputs: ETcCalculationInputs;
  results: ETcResults[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  updateInputs: (inputs: Partial<ETcCalculationInputs>) => void;
  calculate: () => Promise<void>;
  reset: () => void;
  
  // Validation
  isValid: boolean;
  validationErrors: ValidationError[];
}
```

---

## Type Relationships

### Primary Relationships

```
User (Auth) 
├── Farm (user_id)
│   ├── IrrigationRecord (farm_id)
│   ├── SprayRecord (farm_id)  
│   ├── HarvestRecord (farm_id)
│   ├── ExpenseRecord (farm_id)
│   ├── TaskReminder (farm_id)
│   └── CalculationHistory (farm_id)
├── Conversation (user_id)
│   └── Message (conversation_id)
└── ComplianceReport (linked via farm)
```

### Data Flow Relationships

```
WeatherData → ETcCalculationInputs → ETcResults → IrrigationRecommendation
SoilTestResults → NutrientCalculationInputs → NutrientResults → FertilizerProgram  
Farm Records → Analytics → ComplianceReport → Regulatory Submission
AI Analysis → Recommendations → TaskReminder → Farm Actions
```

---

## Best Practices

### Type Definition Guidelines

1. **Consistent Naming**: Use PascalCase for interfaces, camelCase for properties
2. **Required vs Optional**: Use `?` for optional fields, be explicit about requirements
3. **Union Types**: Use string literals for constrained values (`'high' | 'medium' | 'low'`)
4. **Date Handling**: Use ISO string format for database, Date objects for calculations
5. **Null vs Undefined**: Use `| null` for database nullable fields, `?` for optional properties

### Database Type Safety

```typescript
// Good - Explicit types
interface FarmRecord {
  farm_id: number;
  date: string; // ISO format
  status: 'active' | 'completed' | 'cancelled';
  metadata?: Record<string, any>; // Structured but flexible
}

// Avoid - Ambiguous types  
interface BadRecord {
  id: any;
  date: any;
  status: string;
  data: any;
}
```

### Service Integration Types

```typescript
// Good - Service boundary types
interface ServiceRequest<T> {
  data: T;
  options?: {
    timeout?: number;
    retries?: number;
  };
}

interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

### Error Handling Types

```typescript
interface AppError {
  type: 'validation' | 'network' | 'auth' | 'business';
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}
```

This comprehensive type system ensures robust type safety across the entire FarmAI application, providing clear contracts between components and preventing runtime type errors.