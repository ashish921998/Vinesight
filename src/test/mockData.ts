import type { WeatherData } from '@/lib/etc-calculator'
import { vi } from 'vitest'

// Mock weather data for ETc calculator tests
export const mockWeatherData: WeatherData = {
  date: '2025-01-15',
  temperatureMax: 30,
  temperatureMin: 15,
  humidity: 60,
  windSpeed: 2.5,
  rainfall: 0,
  solarRadiation: 20,
}

export const mockWeatherDataArray: WeatherData[] = [
  {
    date: '2025-01-15',
    temperatureMax: 30,
    temperatureMin: 15,
    humidity: 60,
    windSpeed: 2.5,
    rainfall: 0,
    solarRadiation: 20,
  },
  {
    date: '2025-01-16',
    temperatureMax: 32,
    temperatureMin: 16,
    humidity: 55,
    windSpeed: 3.0,
    rainfall: 5,
    solarRadiation: 22,
  },
  {
    date: '2025-01-17',
    temperatureMax: 28,
    temperatureMin: 14,
    humidity: 70,
    windSpeed: 2.0,
    rainfall: 10,
    solarRadiation: 18,
  },
]

// Mock farm data
export const mockFarm = {
  id: 1,
  user_id: 'test-user-id',
  name: 'Test Vineyard',
  location: 'Nashik, Maharashtra',
  area: 5,
  area_unit: 'acre' as const,
  grape_variety: 'Thompson Seedless',
  planting_date: '2023-01-15',
  planting_system: 'Y-Trellis',
  soil_type: 'clay',
  irrigation_type: 'drip',
  latitude: 19.9975,
  longitude: 73.7898,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2025-01-15T00:00:00Z',
}

// Mock soil test results
export const mockSoilTestResult = {
  id: 1,
  farm_id: 1,
  test_date: '2025-01-01',
  ph: 6.5,
  ec: 0.5,
  organic_carbon: 0.6,
  nitrogen: 250,
  phosphorus: 25,
  potassium: 300,
  calcium: 1500,
  magnesium: 200,
  sulfur: 15,
  iron: 4.5,
  manganese: 12,
  zinc: 1.2,
  copper: 0.8,
  boron: 0.5,
  created_at: '2025-01-01T00:00:00Z',
}

// Mock AI profile
export const mockAIProfile = {
  id: 'test-profile-id',
  userId: 'test-user-id',
  farmId: 1,
  riskTolerance: 0.5,
  decisionPatterns: {
    preferredTiming: 'early_morning',
    riskAversion: 0.4,
    adoptionSpeed: 'moderate' as const,
    communicationStyle: 'detailed' as const,
  },
  successMetrics: {
    averageYield: 15000,
    costEfficiency: 0.75,
    profitability: 0.6,
    waterUseEfficiency: 0.8,
  },
  learningPreferences: {
    preferredChannels: ['text', 'visual'] as const,
    bestResponseTimes: ['08:00', '18:00'],
    languagePreference: 'en' as const,
  },
  seasonalPatterns: {},
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-15'),
}

// Mock pest prediction
export const mockPestPrediction = {
  id: 'test-prediction-id',
  farmId: 1,
  region: 'Nashik',
  pestDiseaseType: 'Downy Mildew',
  riskLevel: 'high' as const,
  probabilityScore: 0.85,
  predictedOnsetDate: new Date('2025-01-20'),
  weatherTriggers: {
    temperature: { min: 15, max: 25 },
    humidity: { threshold: 85 },
    rainfall: { days: 3, amount: 10 },
  },
  preventionWindow: {
    startDate: new Date('2025-01-18'),
    endDate: new Date('2025-01-22'),
    optimalTiming: 'Early morning application recommended',
  },
  recommendedTreatments: {
    chemical: [
      {
        product: 'Metalaxyl',
        dosage: '2g/L',
        cost: 500,
        effectiveness: 0.9,
      },
    ],
    organic: [
      {
        method: 'Bordeaux mixture',
        description: 'Apply 1% solution',
        effectiveness: 0.7,
      },
    ],
    cultural: ['Improve air circulation', 'Remove infected leaves'],
  },
  communityReports: 5,
  status: 'active' as const,
  createdAt: new Date('2025-01-15'),
}

// Mock task recommendation
export const mockTaskRecommendation = {
  id: 'test-task-id',
  farmId: 1,
  userId: 'test-user-id',
  taskType: 'irrigation' as const,
  recommendedDate: new Date('2025-01-16'),
  priorityScore: 0.85,
  weatherDependent: true,
  reasoning: 'Based on upcoming dry days and current soil moisture levels',
  confidenceScore: 0.9,
  status: 'pending' as const,
  outcomeTracked: false,
  taskDetails: {
    duration: 120,
    resources: ['Drip irrigation system', 'Water pump'],
    conditions: ['Early morning recommended', 'Check system pressure'],
    alternatives: ['Manual irrigation if system unavailable'],
  },
  createdAt: new Date('2025-01-15'),
}

// Mock Supabase client
export const createMockSupabaseClient = () => ({
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      data: [],
      error: null,
      eq: vi.fn(() => ({ data: [], error: null })),
      single: vi.fn(() => ({ data: null, error: null })),
    })),
    insert: vi.fn(() => ({ data: [], error: null })),
    update: vi.fn(() => ({ data: [], error: null })),
    delete: vi.fn(() => ({ data: [], error: null })),
    upsert: vi.fn(() => ({ data: [], error: null })),
  })),
  auth: {
    getUser: vi.fn(() => ({ data: { user: { id: 'test-user-id' } }, error: null })),
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(() => ({ data: { path: 'test-path' }, error: null })),
      download: vi.fn(() => ({ data: new Blob(), error: null })),
    })),
  },
})
