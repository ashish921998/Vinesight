import { AIService, AIRecommendation } from './ai-service'

export interface SoilTestData {
  id: string
  farmId: string
  testDate: Date
  labName?: string
  samples: {
    location: string
    depth: number // cm
    coordinates?: { lat: number; lng: number }
  }
  results: {
    // Basic Properties
    pH: number
    organicMatter: number // %
    cationExchangeCapacity: number // meq/100g

    // Macronutrients (kg/ha)
    nitrogen: number
    phosphorus: number
    potassium: number

    // Secondary Nutrients (kg/ha)
    calcium: number
    magnesium: number
    sulfur: number

    // Micronutrients (ppm)
    boron: number
    copper: number
    iron: number
    manganese: number
    zinc: number
    molybdenum: number

    // Physical Properties
    texture: {
      sand: number // %
      silt: number // %
      clay: number // %
      classification: string // e.g., "Sandy Loam"
    }

    // Chemical Properties
    electricalConductivity: number // dS/m
    sodiumAdsorptionRatio?: number
    carbonates?: number // %

    // Biological Properties
    microbialActivity?: number // 0-100 scale
    enzymeActivity?: number // 0-100 scale
  }
  recommendations?: string[]
  cost?: number
  notes?: string
}

export interface SoilAnalysisReport {
  summary: {
    overallHealth: number // 0-100
    status: 'excellent' | 'good' | 'average' | 'poor' | 'critical'
    primaryConcerns: string[]
    strengths: string[]
  }

  nutrientStatus: {
    macronutrients: NutrientAnalysis[]
    secondaryNutrients: NutrientAnalysis[]
    micronutrients: NutrientAnalysis[]
  }

  physicalProperties: {
    textureAnalysis: {
      classification: string
      drainage: 'excellent' | 'good' | 'moderate' | 'poor'
      waterHoldingCapacity: 'high' | 'medium' | 'low'
      aeration: 'excellent' | 'good' | 'moderate' | 'poor'
    }
    compactionRisk: 'low' | 'medium' | 'high'
  }

  chemicalProperties: {
    pHStatus: {
      level:
        | 'very_acidic'
        | 'acidic'
        | 'slightly_acidic'
        | 'neutral'
        | 'slightly_alkaline'
        | 'alkaline'
        | 'very_alkaline'
      impact: string
      recommendations: string[]
    }
    salinityStatus: {
      level: 'normal' | 'slight' | 'moderate' | 'high'
      impact: string
      management: string[]
    }
  }

  recommendations: AIRecommendation[]

  fertilizerPlan: {
    season: string
    applications: FertilizerApplication[]
    organicAmendments: OrganicAmendment[]
    totalCost: number
  }

  monitoringSchedule: {
    nextTestDate: Date
    parameters: string[]
    frequency: 'monthly' | 'quarterly' | 'biannual' | 'annual'
  }
}

interface NutrientAnalysis {
  nutrient: string
  current: number
  optimal: { min: number; max: number }
  status: 'deficient' | 'low' | 'adequate' | 'high' | 'excessive'
  impact: string
  corrections: string[]
}

interface FertilizerApplication {
  timing: string
  product: string
  rate: number
  unit: string
  method: string
  cost: number
  nutrients: { [key: string]: number }
}

interface OrganicAmendment {
  amendment: string
  rate: number
  unit: string
  benefits: string[]
  timing: string
  cost: number
}

export class AISoilAnalysisService {
  private static NUTRIENT_STANDARDS = {
    // Optimal ranges for grape production
    macronutrients: {
      nitrogen: { min: 120, max: 180, unit: 'kg/ha' },
      phosphorus: { min: 30, max: 60, unit: 'kg/ha' },
      potassium: { min: 200, max: 300, unit: 'kg/ha' },
    },

    secondaryNutrients: {
      calcium: { min: 1500, max: 3000, unit: 'kg/ha' },
      magnesium: { min: 150, max: 300, unit: 'kg/ha' },
      sulfur: { min: 20, max: 40, unit: 'kg/ha' },
    },

    micronutrients: {
      boron: { min: 0.5, max: 2.0, unit: 'ppm' },
      copper: { min: 0.2, max: 1.0, unit: 'ppm' },
      iron: { min: 4.5, max: 15, unit: 'ppm' },
      manganese: { min: 5, max: 50, unit: 'ppm' },
      zinc: { min: 0.8, max: 3.0, unit: 'ppm' },
      molybdenum: { min: 0.1, max: 0.5, unit: 'ppm' },
    },

    pH: { min: 6.0, max: 7.5 },
    organicMatter: { min: 2.5, max: 5.0, unit: '%' },
    cec: { min: 10, max: 25, unit: 'meq/100g' },
  }

  static async analyzeSoilData(soilData: SoilTestData): Promise<SoilAnalysisReport> {
    // Calculate overall health score
    const overallHealth = this.calculateOverallHealth(soilData)
    const status = this.getHealthStatus(overallHealth)

    // Analyze nutrients
    const nutrientStatus = this.analyzeNutrients(soilData)

    // Analyze physical properties
    const physicalProperties = this.analyzePhysicalProperties(soilData)

    // Analyze chemical properties
    const chemicalProperties = this.analyzeChemicalProperties(soilData)

    // Generate AI recommendations
    const recommendations = await this.generateAIRecommendations(
      soilData,
      nutrientStatus,
      physicalProperties,
      chemicalProperties,
    )

    // Create fertilizer plan
    const fertilizerPlan = this.createFertilizerPlan(soilData, nutrientStatus)

    // Set monitoring schedule
    const monitoringSchedule = this.createMonitoringSchedule(soilData, overallHealth)

    return {
      summary: {
        overallHealth,
        status,
        primaryConcerns: this.identifyPrimaryConcerns(
          soilData,
          nutrientStatus,
          physicalProperties,
          chemicalProperties,
        ),
        strengths: this.identifyStrengths(
          soilData,
          nutrientStatus,
          physicalProperties,
          chemicalProperties,
        ),
      },
      nutrientStatus,
      physicalProperties,
      chemicalProperties,
      recommendations,
      fertilizerPlan,
      monitoringSchedule,
    }
  }

  private static calculateOverallHealth(soilData: SoilTestData): number {
    let score = 0
    let factors = 0

    // pH score (20 points)
    const pHScore = this.scorePH(soilData.results.pH)
    score += pHScore * 0.2
    factors += 0.2

    // Organic matter score (15 points)
    const omScore = this.scoreNutrient(
      soilData.results.organicMatter,
      this.NUTRIENT_STANDARDS.organicMatter,
    )
    score += omScore * 0.15
    factors += 0.15

    // Macronutrient scores (30 points)
    const macroScore =
      (this.scoreNutrient(
        soilData.results.nitrogen,
        this.NUTRIENT_STANDARDS.macronutrients.nitrogen,
      ) +
        this.scoreNutrient(
          soilData.results.phosphorus,
          this.NUTRIENT_STANDARDS.macronutrients.phosphorus,
        ) +
        this.scoreNutrient(
          soilData.results.potassium,
          this.NUTRIENT_STANDARDS.macronutrients.potassium,
        )) /
      3
    score += macroScore * 0.3
    factors += 0.3

    // CEC score (10 points)
    const cecScore = this.scoreNutrient(
      soilData.results.cationExchangeCapacity,
      this.NUTRIENT_STANDARDS.cec,
    )
    score += cecScore * 0.1
    factors += 0.1

    // Secondary nutrients (15 points)
    const secondaryScore =
      (this.scoreNutrient(
        soilData.results.calcium,
        this.NUTRIENT_STANDARDS.secondaryNutrients.calcium,
      ) +
        this.scoreNutrient(
          soilData.results.magnesium,
          this.NUTRIENT_STANDARDS.secondaryNutrients.magnesium,
        ) +
        this.scoreNutrient(
          soilData.results.sulfur,
          this.NUTRIENT_STANDARDS.secondaryNutrients.sulfur,
        )) /
      3
    score += secondaryScore * 0.15
    factors += 0.15

    // Micronutrients (10 points)
    const microScore =
      Object.entries(this.NUTRIENT_STANDARDS.micronutrients).reduce((acc, [key, standard]) => {
        const value = soilData.results[key as keyof typeof soilData.results] as number
        return acc + this.scoreNutrient(value, standard)
      }, 0) / Object.keys(this.NUTRIENT_STANDARDS.micronutrients).length
    score += microScore * 0.1
    factors += 0.1

    return Math.max(0, Math.min(100, score))
  }

  private static scorePH(pH: number): number {
    const optimal = this.NUTRIENT_STANDARDS.pH
    if (pH >= optimal.min && pH <= optimal.max) return 100

    const deviation = Math.min(Math.abs(pH - optimal.min), Math.abs(pH - optimal.max))
    return Math.max(0, 100 - deviation * 20) // 20 points penalty per unit deviation
  }

  private static scoreNutrient(value: number, standard: { min: number; max: number }): number {
    if (value >= standard.min && value <= standard.max) return 100

    if (value < standard.min) {
      const ratio = value / standard.min
      return ratio * 100
    } else {
      // Excessive levels
      const excess = value - standard.max
      const excessRatio = excess / standard.max
      return Math.max(0, 100 - excessRatio * 50) // 50% penalty for excess
    }
  }

  private static getHealthStatus(
    score: number,
  ): 'excellent' | 'good' | 'average' | 'poor' | 'critical' {
    if (score >= 90) return 'excellent'
    if (score >= 75) return 'good'
    if (score >= 60) return 'average'
    if (score >= 40) return 'poor'
    return 'critical'
  }

  private static analyzeNutrients(soilData: SoilTestData) {
    const analyzeNutrientGroup = (
      nutrients: { [key: string]: { min: number; max: number } },
      category: string,
    ) => {
      return Object.entries(nutrients).map(([nutrient, standard]) => {
        const current = soilData.results[nutrient as keyof typeof soilData.results] as number
        const status = this.getNutrientStatus(current, standard)

        return {
          nutrient: nutrient.charAt(0).toUpperCase() + nutrient.slice(1),
          current,
          optimal: standard,
          status,
          impact: this.getNutrientImpact(nutrient, status),
          corrections: this.getNutrientCorrections(nutrient, status),
        }
      })
    }

    return {
      macronutrients: analyzeNutrientGroup(this.NUTRIENT_STANDARDS.macronutrients, 'macro'),
      secondaryNutrients: analyzeNutrientGroup(
        this.NUTRIENT_STANDARDS.secondaryNutrients,
        'secondary',
      ),
      micronutrients: analyzeNutrientGroup(this.NUTRIENT_STANDARDS.micronutrients, 'micro'),
    }
  }

  private static getNutrientStatus(
    value: number,
    standard: { min: number; max: number },
  ): 'deficient' | 'low' | 'adequate' | 'high' | 'excessive' {
    if (value < standard.min * 0.5) return 'deficient'
    if (value < standard.min) return 'low'
    if (value <= standard.max) return 'adequate'
    if (value <= standard.max * 1.5) return 'high'
    return 'excessive'
  }

  private static getNutrientImpact(nutrient: string, status: string): string {
    const impacts = {
      nitrogen: {
        deficient: 'Reduced vegetative growth and yellowing leaves',
        low: 'Slower vine development and reduced yield potential',
        adequate: 'Healthy vine growth and development',
        high: 'Excessive vegetative growth, delayed ripening',
        excessive: 'Excessive foliage, poor fruit quality, disease susceptibility',
      },
      phosphorus: {
        deficient: 'Poor root development and delayed maturity',
        low: 'Reduced flowering and fruit set',
        adequate: 'Strong root system and good fruit development',
        high: 'May interfere with micronutrient uptake',
        excessive: 'Micronutrient deficiencies, especially zinc and iron',
      },
      potassium: {
        deficient: 'Poor fruit quality and disease resistance',
        low: 'Reduced sugar content and poor color development',
        adequate: 'Good fruit quality and winter hardiness',
        high: 'May interfere with magnesium and calcium uptake',
        excessive: 'Magnesium deficiency symptoms',
      },
      // Add more nutrients as needed
    }

    return (
      impacts[nutrient as keyof typeof impacts]?.[
        status as keyof (typeof impacts)[keyof typeof impacts]
      ] || `${status} levels may affect plant performance`
    )
  }

  private static getNutrientCorrections(nutrient: string, status: string): string[] {
    const corrections = {
      nitrogen: {
        deficient: [
          'Apply nitrogen fertilizer immediately',
          'Consider slow-release nitrogen sources',
          'Apply organic matter',
        ],
        low: ['Increase nitrogen application rate', 'Split applications for better efficiency'],
        high: ['Reduce nitrogen inputs', 'Avoid late season nitrogen applications'],
        excessive: ['Stop nitrogen applications', 'Use cover crops to scavenge excess nitrogen'],
      },
      phosphorus: {
        deficient: ['Apply phosphorus fertilizer', 'Use mycorrhizal inoculants to improve uptake'],
        low: ['Increase phosphorus application', 'Apply rock phosphate for long-term release'],
        high: ['Reduce phosphorus applications', 'Monitor micronutrient levels'],
        excessive: ['Stop phosphorus applications', 'Apply zinc and iron if deficient'],
      },
      potassium: {
        deficient: ['Apply potassium fertilizer', 'Use potassium sulfate for quality'],
        low: ['Increase potassium application rate', 'Apply before fruit development'],
        high: ['Reduce potassium inputs', 'Monitor magnesium levels'],
        excessive: ['Stop potassium applications', 'Apply magnesium to balance'],
      },
    }

    return (
      corrections[nutrient as keyof typeof corrections]?.[
        status as keyof (typeof corrections)[keyof typeof corrections]
      ] || [`Adjust ${nutrient} levels based on soil test recommendations`]
    )
  }

  private static analyzePhysicalProperties(soilData: SoilTestData) {
    const texture = soilData.results.texture

    return {
      textureAnalysis: {
        classification: texture.classification,
        drainage: this.assessDrainage(texture),
        waterHoldingCapacity: this.assessWaterHolding(texture),
        aeration: this.assessAeration(texture),
      },
      compactionRisk: this.assessCompactionRisk(texture),
    }
  }

  private static assessDrainage(texture: any): 'excellent' | 'good' | 'moderate' | 'poor' {
    if (texture.sand > 70) return 'excellent'
    if (texture.sand > 50) return 'good'
    if (texture.clay < 30) return 'moderate'
    return 'poor'
  }

  private static assessWaterHolding(texture: any): 'high' | 'medium' | 'low' {
    if (texture.clay > 40) return 'high'
    if (texture.silt > 40 || (texture.clay > 20 && texture.clay <= 40)) return 'medium'
    return 'low'
  }

  private static assessAeration(texture: any): 'excellent' | 'good' | 'moderate' | 'poor' {
    if (texture.sand > 60) return 'excellent'
    if (texture.sand > 40) return 'good'
    if (texture.clay < 35) return 'moderate'
    return 'poor'
  }

  private static assessCompactionRisk(texture: any): 'low' | 'medium' | 'high' {
    if (texture.sand > 70) return 'low'
    if (texture.clay > 40) return 'high'
    return 'medium'
  }

  private static analyzeChemicalProperties(soilData: SoilTestData) {
    return {
      pHStatus: this.analyzePH(soilData.results.pH),
      salinityStatus: this.analyzeSalinity(soilData.results.electricalConductivity),
    }
  }

  private static analyzePH(pH: number) {
    let level: any = 'neutral'
    if (pH < 5.5) level = 'very_acidic'
    else if (pH < 6.0) level = 'acidic'
    else if (pH < 6.8) level = 'slightly_acidic'
    else if (pH <= 7.2) level = 'neutral'
    else if (pH <= 7.8) level = 'slightly_alkaline'
    else if (pH <= 8.5) level = 'alkaline'
    else level = 'very_alkaline'

    return {
      level,
      impact: this.getPHImpact(level),
      recommendations: this.getPHRecommendations(level),
    }
  }

  private static getPHImpact(level: string): string {
    const impacts = {
      very_acidic: 'Severe nutrient deficiencies, aluminum toxicity',
      acidic: 'Reduced nutrient availability, especially phosphorus',
      slightly_acidic: 'Good for most nutrients, may need lime',
      neutral: 'Optimal nutrient availability',
      slightly_alkaline: 'Good overall, monitor micronutrients',
      alkaline: 'Reduced iron, zinc, and manganese availability',
      very_alkaline: 'Severe micronutrient deficiencies',
    }
    return impacts[level as keyof typeof impacts] || 'pH effects on nutrient availability'
  }

  private static getPHRecommendations(level: string): string[] {
    const recommendations = {
      very_acidic: [
        'Apply agricultural lime immediately',
        'Test for aluminum toxicity',
        'Use dolomitic lime if magnesium is low',
      ],
      acidic: [
        'Apply lime to raise pH',
        'Monitor aluminum levels',
        'Consider gradual pH adjustment',
      ],
      slightly_acidic: ['Minor lime application may be beneficial', 'Monitor pH annually'],
      neutral: ['Maintain current pH with proper fertilization'],
      slightly_alkaline: [
        'Monitor micronutrient levels',
        'Consider acidifying fertilizers if needed',
      ],
      alkaline: [
        'Apply sulfur to lower pH',
        'Use chelated micronutrients',
        'Apply acidifying fertilizers',
      ],
      very_alkaline: [
        'Apply elemental sulfur',
        'Use acid-forming fertilizers',
        'Consider soil amendments',
      ],
    }
    return recommendations[level as keyof typeof recommendations] || ['Monitor pH regularly']
  }

  private static analyzeSalinity(ec: number) {
    let level: 'normal' | 'slight' | 'moderate' | 'high'
    if (ec < 2) level = 'normal'
    else if (ec < 4) level = 'slight'
    else if (ec < 8) level = 'moderate'
    else level = 'high'

    return {
      level,
      impact: this.getSalinityImpact(level),
      management: this.getSalinityManagement(level),
    }
  }

  private static getSalinityImpact(level: string): string {
    const impacts = {
      normal: 'No salt stress on plants',
      slight: 'Minor effects on salt-sensitive plants',
      moderate: 'Reduced growth in most crops',
      high: 'Severe growth restrictions, only salt-tolerant plants survive',
    }
    return impacts[level as keyof typeof impacts] || ''
  }

  private static getSalinityManagement(level: string): string[] {
    const management = {
      normal: ['Continue current management'],
      slight: ['Monitor salt levels', 'Ensure adequate drainage'],
      moderate: ['Improve drainage', 'Apply gypsum if needed', 'Use salt-tolerant rootstock'],
      high: [
        'Install drainage system',
        'Apply gypsum',
        'Leach salts with good quality water',
        'Use salt-tolerant varieties',
      ],
    }
    return management[level as keyof typeof management] || []
  }

  private static async generateAIRecommendations(
    soilData: SoilTestData,
    nutrientStatus: any,
    physicalProperties: any,
    chemicalProperties: any,
  ): Promise<AIRecommendation[]> {
    // Use existing AI service to generate comprehensive recommendations
    return AIService.analyzeSoilData({
      ph: soilData.results.pH,
      nitrogen: soilData.results.nitrogen,
      phosphorus: soilData.results.phosphorus,
      potassium: soilData.results.potassium,
      organicMatter: soilData.results.organicMatter,
    })
  }

  private static createFertilizerPlan(soilData: SoilTestData, nutrientStatus: any): any {
    const applications: FertilizerApplication[] = []
    const amendments: OrganicAmendment[] = []

    // Generate fertilizer applications based on deficiencies
    nutrientStatus.macronutrients.forEach((nutrient: any) => {
      if (nutrient.status === 'deficient' || nutrient.status === 'low') {
        applications.push({
          timing: this.getFertilizerTiming(nutrient.nutrient),
          product: this.getFertilizerProduct(nutrient.nutrient),
          rate: this.calculateFertilizerRate(nutrient.nutrient, nutrient.status),
          unit: 'kg/ha',
          method: 'broadcast and incorporate',
          cost: this.estimateFertilizerCost(nutrient.nutrient),
          nutrients: {
            [nutrient.nutrient]: this.calculateFertilizerRate(nutrient.nutrient, nutrient.status),
          },
        })
      }
    })

    // Add organic amendments if organic matter is low
    if (soilData.results.organicMatter < this.NUTRIENT_STANDARDS.organicMatter.min) {
      amendments.push({
        amendment: 'Compost',
        rate: 20,
        unit: 'tons/ha',
        benefits: [
          'Improve soil structure',
          'Increase water retention',
          'Provide slow-release nutrients',
        ],
        timing: 'Fall or early spring',
        cost: 300,
      })
    }

    const totalCost =
      applications.reduce((sum, app) => sum + app.cost, 0) +
      amendments.reduce((sum, amend) => sum + amend.cost, 0)

    return {
      season: this.getCurrentSeason(),
      applications,
      organicAmendments: amendments,
      totalCost,
    }
  }

  private static createMonitoringSchedule(soilData: SoilTestData, overallHealth: number): any {
    const frequency = overallHealth < 60 ? 'quarterly' : overallHealth < 80 ? 'biannual' : 'annual'

    const nextTestDate = new Date()
    nextTestDate.setMonth(
      nextTestDate.getMonth() + (frequency === 'quarterly' ? 3 : frequency === 'biannual' ? 6 : 12),
    )

    return {
      nextTestDate,
      parameters: this.getMonitoringParameters(soilData, overallHealth),
      frequency,
    }
  }

  // Helper methods
  private static identifyPrimaryConcerns(
    soilData: SoilTestData,
    nutrientStatus: any,
    physicalProperties: any,
    chemicalProperties: any,
  ): string[] {
    const concerns: string[] = []

    // pH concerns
    if (soilData.results.pH < 5.5 || soilData.results.pH > 8.0) {
      concerns.push(`pH is ${soilData.results.pH < 5.5 ? 'too acidic' : 'too alkaline'}`)
    }

    // Nutrient deficiencies
    ;[...nutrientStatus.macronutrients, ...nutrientStatus.secondaryNutrients].forEach(
      (nutrient: any) => {
        if (nutrient.status === 'deficient') {
          concerns.push(`${nutrient.nutrient} deficiency`)
        }
      },
    )

    // Physical issues
    if (physicalProperties.textureAnalysis.drainage === 'poor') {
      concerns.push('Poor drainage')
    }

    return concerns.slice(0, 5) // Limit to top 5 concerns
  }

  private static identifyStrengths(
    soilData: SoilTestData,
    nutrientStatus: any,
    physicalProperties: any,
    chemicalProperties: any,
  ): string[] {
    const strengths: string[] = []

    // Good pH
    if (soilData.results.pH >= 6.0 && soilData.results.pH <= 7.5) {
      strengths.push('Optimal pH range')
    }

    // Adequate nutrients
    ;[...nutrientStatus.macronutrients, ...nutrientStatus.secondaryNutrients].forEach(
      (nutrient: any) => {
        if (nutrient.status === 'adequate') {
          strengths.push(`Adequate ${nutrient.nutrient.toLowerCase()}`)
        }
      },
    )

    // Good organic matter
    if (soilData.results.organicMatter >= this.NUTRIENT_STANDARDS.organicMatter.min) {
      strengths.push('Good organic matter content')
    }

    return strengths.slice(0, 5)
  }

  private static getFertilizerTiming(nutrient: string): string {
    const timings = {
      nitrogen: 'Early spring before bud break',
      phosphorus: 'Fall or early spring',
      potassium: 'Fall application preferred',
    }
    return timings[nutrient as keyof typeof timings] || 'As recommended'
  }

  private static getFertilizerProduct(nutrient: string): string {
    const products = {
      nitrogen: 'Urea or ammonium sulfate',
      phosphorus: 'Single superphosphate',
      potassium: 'Potassium sulfate',
    }
    return products[nutrient as keyof typeof products] || `${nutrient} fertilizer`
  }

  private static calculateFertilizerRate(nutrient: string, status: string): number {
    const rates = {
      nitrogen: { deficient: 80, low: 50 },
      phosphorus: { deficient: 40, low: 25 },
      potassium: { deficient: 100, low: 60 },
    }
    return (
      rates[nutrient as keyof typeof rates]?.[status as keyof (typeof rates)[keyof typeof rates]] ||
      30
    )
  }

  private static estimateFertilizerCost(nutrient: string): number {
    const costs = { nitrogen: 150, phosphorus: 200, potassium: 180 }
    return costs[nutrient as keyof typeof costs] || 150
  }

  private static getCurrentSeason(): string {
    const month = new Date().getMonth()
    if (month >= 2 && month <= 4) return 'Spring'
    if (month >= 5 && month <= 7) return 'Summer'
    if (month >= 8 && month <= 10) return 'Fall'
    return 'Winter'
  }

  private static getMonitoringParameters(soilData: SoilTestData, overallHealth: number): string[] {
    const baseParams = ['pH', 'organic matter', 'nitrogen', 'phosphorus', 'potassium']

    if (overallHealth < 60) {
      return [...baseParams, 'micronutrients', 'salinity', 'CEC']
    }

    return baseParams
  }
}
