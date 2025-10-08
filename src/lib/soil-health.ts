export interface SoilTestData {
  testDate: Date
  farmId: string
  location: {
    fieldName: string
    coordinates?: { lat: number; lng: number }
    depth: number // cm - standard depths: 0-15, 15-30, 30-60
  }

  // Physical Properties
  physical: {
    soilTexture:
      | 'sand'
      | 'loamy_sand'
      | 'sandy_loam'
      | 'loam'
      | 'silt_loam'
      | 'silt'
      | 'clay_loam'
      | 'silty_clay_loam'
      | 'sandy_clay'
      | 'silty_clay'
      | 'clay'
    bulkDensity: number // g/cm³
    porosity: number // %
    waterHoldingCapacity: number // %
    infiltrationRate: number // mm/hr
  }

  // Chemical Properties
  chemical: {
    pH: number // 4.5-9.0 range
    electricalConductivity: number // dS/m (salinity)
    organicMatter: number // %
    organicCarbon: number // %
    cationExchangeCapacity: number // cmol(+)/kg

    // Macronutrients (mg/kg or ppm)
    nitrogen: {
      total: number
      available: number // NO3-N + NH4-N
      nitrate: number // NO3-N
      ammonium: number // NH4-N
    }
    phosphorus: {
      total: number
      available: number // Olsen-P or Bray-P
      organic: number
    }
    potassium: {
      total: number
      available: number // K2O equivalent
      exchangeable: number
    }

    // Secondary Nutrients (mg/kg)
    calcium: number
    magnesium: number
    sulfur: number

    // Micronutrients (mg/kg)
    iron: number
    manganese: number
    zinc: number
    copper: number
    boron: number
    molybdenum: number
  }

  // Biological Properties
  biological: {
    microbialBiomassCarbon: number // mg/kg
    soilRespiration: number // mg CO2/kg/day
    enzymeActivity: {
      dehydrogenase: number // μg TPF/g/24h
      phosphatase: number // μg p-nitrophenol/g/h
      urease: number // μg NH4-N/g/2h
    }
    earthwormCount: number // count per m²
    nematodeCount: number // count per 100g soil
  }
}

export interface SoilHealthMetrics {
  overallScore: number // 0-100
  category: 'poor' | 'fair' | 'good' | 'excellent'

  subscores: {
    physical: { score: number; indicators: string[] }
    chemical: { score: number; indicators: string[] }
    biological: { score: number; indicators: string[] }
  }

  limitations: {
    factor: string
    severity: 'low' | 'moderate' | 'high' | 'severe'
    impact: string
    recommendation: string
  }[]

  trends: {
    parameter: string
    direction: 'improving' | 'stable' | 'declining'
    rate: number // % change per year
    significance: 'not_significant' | 'significant' | 'highly_significant'
  }[]
}

export interface SoilRecommendations {
  immediate: {
    action: string
    priority: 'urgent' | 'high' | 'medium' | 'low'
    timeframe: string
    expectedCost: number // INR per acre
    expectedBenefit: string
  }[]

  seasonal: {
    season: 'pre_monsoon' | 'monsoon' | 'post_monsoon' | 'winter'
    actions: string[]
    materials: { name: string; quantity: string; cost: number }[]
  }[]

  longTerm: {
    goal: string
    timeline: string // e.g., "2-3 years"
    strategy: string
    milestones: { year: number; target: string; metric: string }[]
  }[]

  fertilizer: {
    nutrient: string
    deficiency: number // kg/ha
    recommendation: {
      organic: { source: string; quantity: string; timing: string }
      inorganic: { fertilizer: string; quantity: string; timing: string }
    }
    costBenefit: { investment: number; expectedReturn: number }
  }[]
}

export interface SoilHealthInputs {
  testData: SoilTestData
  farmContext: {
    cropType: 'grapes'
    variety: string
    plantingYear: number
    irrigationMethod: 'drip' | 'sprinkler' | 'furrow' | 'none'
    previousCrops: string[]
    managementHistory: {
      organicMatter: boolean
      coverCrops: boolean
      tillage: 'no_till' | 'minimum_till' | 'conventional'
      chemicalInputs: 'low' | 'medium' | 'high'
    }
  }
  climateData: {
    averageRainfall: number // mm/year
    temperature: { min: number; max: number } // °C
    humidity: number // %
    windSpeed: number // m/s
  }
}

export interface SoilHealthResults {
  healthMetrics: SoilHealthMetrics
  recommendations: SoilRecommendations
  alerts: {
    type: 'critical' | 'warning' | 'info'
    parameter: string
    currentValue: number
    optimalRange: [number, number]
    message: string
    actionRequired: boolean
  }[]
  projections: {
    timeframe: '3months' | '6months' | '1year' | '3years'
    scenarios: {
      no_action: { soilScore: number; productivity: number; sustainability: number }
      recommended_action: { soilScore: number; productivity: number; sustainability: number }
      intensive_improvement: { soilScore: number; productivity: number; sustainability: number }
    }
  }
  integrations: {
    nutrientCalculator: { adjustedRecommendations: any }
    diseaseRisk: { soilRelatedRisks: string[] }
    yieldPrediction: { soilHealthFactor: number }
  }
  confidence: number // 0-100%
}

// Soil Health Standards for Indian Grape Cultivation
export const SOIL_STANDARDS = {
  grape_optimal: {
    pH: { min: 6.0, max: 7.5, optimal: 6.5 },
    organicMatter: { min: 1.5, max: 4.0, optimal: 2.5 }, // %
    electricalConductivity: { min: 0, max: 2.0, optimal: 0.5 }, // dS/m
    cationExchangeCapacity: { min: 10, max: 30, optimal: 20 }, // cmol(+)/kg

    // Macronutrients (mg/kg)
    nitrogen: { min: 200, max: 400, optimal: 300 },
    phosphorus: { min: 15, max: 50, optimal: 30 },
    potassium: { min: 150, max: 350, optimal: 250 },

    // Secondary nutrients (mg/kg)
    calcium: { min: 1000, max: 3000, optimal: 2000 },
    magnesium: { min: 120, max: 300, optimal: 200 },
    sulfur: { min: 10, max: 40, optimal: 20 },

    // Micronutrients (mg/kg)
    iron: { min: 4.5, max: 20, optimal: 10 },
    manganese: { min: 5, max: 50, optimal: 15 },
    zinc: { min: 0.6, max: 5, optimal: 2 },
    copper: { min: 0.2, max: 3, optimal: 1 },
    boron: { min: 0.5, max: 2, optimal: 1 },

    // Physical properties
    bulkDensity: { min: 1.0, max: 1.6, optimal: 1.3 }, // g/cm³
    porosity: { min: 35, max: 60, optimal: 50 }, // %
    waterHoldingCapacity: { min: 20, max: 40, optimal: 30 } // %
  },

  // Critical thresholds
  critical_levels: {
    pH: { very_low: 4.5, low: 5.5, high: 8.0, very_high: 8.5 },
    salinity: { low: 2, moderate: 4, high: 8, very_high: 16 }, // dS/m
    organicMatter: { very_low: 0.5, low: 1.0, moderate: 1.5 } // %
  }
}

export class SoilHealthAnalyzer {
  static analyzeSoilHealth(inputs: SoilHealthInputs): SoilHealthResults {
    const testData = inputs.testData
    const standards = SOIL_STANDARDS.grape_optimal

    // Calculate individual component scores
    const physicalScore = this.calculatePhysicalScore(testData.physical)
    const chemicalScore = this.calculateChemicalScore(testData.chemical)
    const biologicalScore = this.calculateBiologicalScore(testData.biological)

    // Calculate overall health score (weighted average)
    const overallScore = chemicalScore * 0.5 + physicalScore * 0.3 + biologicalScore * 0.2

    // Determine category
    const category = this.getHealthCategory(overallScore)

    // Identify limitations and generate alerts
    const limitations = this.identifyLimitations(testData, standards)
    const alerts = this.generateAlerts(testData, standards)

    // Calculate trends (requires historical data - mock for now)
    const trends = this.calculateTrends(testData)

    // Generate recommendations
    const recommendations = this.generateRecommendations(testData, inputs.farmContext, limitations)

    // Calculate projections
    const projections = this.calculateProjections(testData, recommendations)

    // Generate integrations with other systems
    const integrations = this.generateIntegrations(testData, overallScore)

    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence(testData)

    return {
      healthMetrics: {
        overallScore: Math.round(overallScore),
        category,
        subscores: {
          physical: {
            score: Math.round(physicalScore),
            indicators: this.getPhysicalIndicators(testData.physical)
          },
          chemical: {
            score: Math.round(chemicalScore),
            indicators: this.getChemicalIndicators(testData.chemical)
          },
          biological: {
            score: Math.round(biologicalScore),
            indicators: this.getBiologicalIndicators(testData.biological)
          }
        },
        limitations,
        trends
      },
      recommendations,
      alerts,
      projections,
      integrations,
      confidence
    }
  }

  private static calculatePhysicalScore(physical: SoilTestData['physical']): number {
    const standards = SOIL_STANDARDS.grape_optimal
    let score = 0
    let components = 0

    // Bulk density score (lower is better within range)
    if (
      physical.bulkDensity >= standards.bulkDensity.min &&
      physical.bulkDensity <= standards.bulkDensity.max
    ) {
      const optimalDistance = Math.abs(physical.bulkDensity - standards.bulkDensity.optimal)
      score += Math.max(0, 100 - (optimalDistance / 0.3) * 100)
    } else {
      score += physical.bulkDensity < standards.bulkDensity.min ? 50 : 20
    }
    components++

    // Porosity score
    if (
      physical.porosity >= standards.porosity.min &&
      physical.porosity <= standards.porosity.max
    ) {
      const optimalDistance = Math.abs(physical.porosity - standards.porosity.optimal)
      score += Math.max(0, 100 - (optimalDistance / 10) * 100)
    } else {
      score += physical.porosity < standards.porosity.min ? 30 : 70
    }
    components++

    // Water holding capacity score
    if (
      physical.waterHoldingCapacity >= standards.waterHoldingCapacity.min &&
      physical.waterHoldingCapacity <= standards.waterHoldingCapacity.max
    ) {
      const optimalDistance = Math.abs(
        physical.waterHoldingCapacity - standards.waterHoldingCapacity.optimal
      )
      score += Math.max(0, 100 - (optimalDistance / 5) * 100)
    } else {
      score += physical.waterHoldingCapacity < standards.waterHoldingCapacity.min ? 40 : 80
    }
    components++

    // Texture score (based on soil texture suitability for grapes)
    const textureScores = {
      sand: 40,
      loamy_sand: 60,
      sandy_loam: 85,
      loam: 100,
      silt_loam: 90,
      silt: 70,
      clay_loam: 75,
      silty_clay_loam: 70,
      sandy_clay: 50,
      silty_clay: 45,
      clay: 40
    }
    score += textureScores[physical.soilTexture] || 50
    components++

    return score / components
  }

  private static calculateChemicalScore(chemical: SoilTestData['chemical']): number {
    const standards = SOIL_STANDARDS.grape_optimal
    let score = 0
    let components = 0

    // pH score (critical for nutrient availability)
    const pHScore = this.calculateParameterScore(
      chemical.pH,
      standards.pH.min,
      standards.pH.max,
      standards.pH.optimal
    )
    score += pHScore * 2 // Weight pH heavily
    components += 2

    // Organic matter score (critical for soil health)
    const omScore = this.calculateParameterScore(
      chemical.organicMatter,
      standards.organicMatter.min,
      standards.organicMatter.max,
      standards.organicMatter.optimal
    )
    score += omScore * 1.5 // Weight organic matter heavily
    components += 1.5

    // Salinity score (EC) - lower is better
    let ecScore = 100
    if (chemical.electricalConductivity > 2.0) ecScore = 20
    else if (chemical.electricalConductivity > 1.0) ecScore = 60
    else if (chemical.electricalConductivity > 0.5) ecScore = 80
    score += ecScore
    components++

    // Major nutrient scores
    score += this.calculateParameterScore(
      chemical.nitrogen.available,
      standards.nitrogen.min,
      standards.nitrogen.max,
      standards.nitrogen.optimal
    )
    score += this.calculateParameterScore(
      chemical.phosphorus.available,
      standards.phosphorus.min,
      standards.phosphorus.max,
      standards.phosphorus.optimal
    )
    score += this.calculateParameterScore(
      chemical.potassium.available,
      standards.potassium.min,
      standards.potassium.max,
      standards.potassium.optimal
    )
    components += 3

    // Secondary nutrient scores
    score +=
      this.calculateParameterScore(
        chemical.calcium,
        standards.calcium.min,
        standards.calcium.max,
        standards.calcium.optimal
      ) * 0.5
    score +=
      this.calculateParameterScore(
        chemical.magnesium,
        standards.magnesium.min,
        standards.magnesium.max,
        standards.magnesium.optimal
      ) * 0.5
    score +=
      this.calculateParameterScore(
        chemical.sulfur,
        standards.sulfur.min,
        standards.sulfur.max,
        standards.sulfur.optimal
      ) * 0.5
    components += 1.5

    // Micronutrient scores
    const micronutrients = ['iron', 'manganese', 'zinc', 'copper', 'boron']
    let microScore = 0
    micronutrients.forEach((nutrient) => {
      const nutrientStandard = (standards as any)[nutrient]
      const nutrientValue = (chemical as any)[nutrient]
      if (nutrientStandard && nutrientValue !== undefined) {
        microScore += this.calculateParameterScore(
          nutrientValue,
          nutrientStandard.min,
          nutrientStandard.max,
          nutrientStandard.optimal
        )
      }
    })
    score += (microScore / micronutrients.length) * 0.8
    components += 0.8

    return score / components
  }

  private static calculateBiologicalScore(biological: SoilTestData['biological']): number {
    let score = 0
    let components = 0

    // Microbial biomass carbon (indicator of soil biological activity)
    if (biological.microbialBiomassCarbon > 300) score += 100
    else if (biological.microbialBiomassCarbon > 200) score += 80
    else if (biological.microbialBiomassCarbon > 100) score += 60
    else score += 30
    components++

    // Soil respiration (biological activity indicator)
    if (biological.soilRespiration > 50) score += 100
    else if (biological.soilRespiration > 30) score += 80
    else if (biological.soilRespiration > 15) score += 60
    else score += 30
    components++

    // Enzyme activity scores
    let enzymeScore = 0
    if (biological.enzymeActivity.dehydrogenase > 40) enzymeScore += 33
    else if (biological.enzymeActivity.dehydrogenase > 20) enzymeScore += 20
    else enzymeScore += 10

    if (biological.enzymeActivity.phosphatase > 200) enzymeScore += 33
    else if (biological.enzymeActivity.phosphatase > 100) enzymeScore += 20
    else enzymeScore += 10

    if (biological.enzymeActivity.urease > 50) enzymeScore += 34
    else if (biological.enzymeActivity.urease > 25) enzymeScore += 20
    else enzymeScore += 10

    score += enzymeScore
    components++

    // Macro-organism indicators
    if (biological.earthwormCount > 100) score += 100
    else if (biological.earthwormCount > 50) score += 80
    else if (biological.earthwormCount > 20) score += 60
    else score += 20
    components++

    return components > 0 ? score / components : 50 // Default if no data
  }

  private static calculateParameterScore(
    value: number,
    min: number,
    max: number,
    optimal: number
  ): number {
    if (value >= min && value <= max) {
      const optimalDistance = Math.abs(value - optimal)
      const range = Math.max(optimal - min, max - optimal)
      return Math.max(0, 100 - (optimalDistance / range) * 100)
    }

    if (value < min) {
      const deficit = min - value
      const range = min * 0.5 // Assume 50% below minimum is 0 score
      return Math.max(0, 100 - (deficit / range) * 100)
    }

    if (value > max) {
      const excess = value - max
      const range = max * 0.5 // Assume 50% above maximum is 0 score
      return Math.max(0, 100 - (excess / range) * 100)
    }

    return 50 // Default fallback
  }

  private static getHealthCategory(score: number): 'poor' | 'fair' | 'good' | 'excellent' {
    if (score >= 80) return 'excellent'
    if (score >= 65) return 'good'
    if (score >= 45) return 'fair'
    return 'poor'
  }

  private static identifyLimitations(
    testData: SoilTestData,
    standards: any
  ): SoilHealthMetrics['limitations'] {
    const limitations: SoilHealthMetrics['limitations'] = []

    // pH limitations
    if (testData.chemical.pH < 5.5) {
      limitations.push({
        factor: 'Soil Acidity',
        severity: testData.chemical.pH < 5.0 ? 'severe' : 'high',
        impact: 'Reduced nutrient availability, aluminum toxicity risk',
        recommendation: 'Apply agricultural lime 2-3 tons/ha, monitor pH quarterly'
      })
    } else if (testData.chemical.pH > 8.0) {
      limitations.push({
        factor: 'Soil Alkalinity',
        severity: testData.chemical.pH > 8.5 ? 'severe' : 'high',
        impact: 'Iron, zinc, and manganese deficiency, poor nutrient uptake',
        recommendation: 'Apply sulfur 200-500 kg/ha, use acidifying fertilizers'
      })
    }

    // Salinity limitations
    if (testData.chemical.electricalConductivity > 2.0) {
      limitations.push({
        factor: 'Soil Salinity',
        severity: testData.chemical.electricalConductivity > 4.0 ? 'severe' : 'high',
        impact: 'Reduced water uptake, stunted growth, yield reduction',
        recommendation: 'Improve drainage, apply gypsum, use salt-tolerant rootstocks'
      })
    }

    // Organic matter limitations
    if (testData.chemical.organicMatter < 1.0) {
      limitations.push({
        factor: 'Low Organic Matter',
        severity: testData.chemical.organicMatter < 0.5 ? 'severe' : 'high',
        impact: 'Poor soil structure, low water retention, reduced microbial activity',
        recommendation: 'Apply compost 5-10 t/ha, grow cover crops, reduce tillage'
      })
    }

    // Nutrient limitations
    if (testData.chemical.nitrogen.available < 200) {
      limitations.push({
        factor: 'Nitrogen Deficiency',
        severity: testData.chemical.nitrogen.available < 100 ? 'high' : 'moderate',
        impact: 'Reduced vegetative growth, poor fruit set, low yields',
        recommendation: 'Apply nitrogen fertilizer 150-200 kg N/ha in split doses'
      })
    }

    if (testData.chemical.phosphorus.available < 15) {
      limitations.push({
        factor: 'Phosphorus Deficiency',
        severity: testData.chemical.phosphorus.available < 10 ? 'high' : 'moderate',
        impact: 'Poor root development, delayed maturity, reduced fruit quality',
        recommendation: 'Apply phosphorus fertilizer 40-60 kg P2O5/ha before planting'
      })
    }

    if (testData.chemical.potassium.available < 150) {
      limitations.push({
        factor: 'Potassium Deficiency',
        severity: testData.chemical.potassium.available < 100 ? 'high' : 'moderate',
        impact: 'Poor fruit quality, reduced sugar content, disease susceptibility',
        recommendation: 'Apply potassium fertilizer 100-150 kg K2O/ha during fruit development'
      })
    }

    return limitations
  }

  private static generateAlerts(
    testData: SoilTestData,
    standards: any
  ): SoilHealthResults['alerts'] {
    const alerts: SoilHealthResults['alerts'] = []

    // Critical pH alert
    if (testData.chemical.pH < 5.0 || testData.chemical.pH > 8.5) {
      alerts.push({
        type: 'critical',
        parameter: 'Soil pH',
        currentValue: testData.chemical.pH,
        optimalRange: [standards.pH.min, standards.pH.max],
        message: `Extreme pH level detected. Immediate soil amendment required.`,
        actionRequired: true
      })
    }

    // Salinity warning
    if (testData.chemical.electricalConductivity > 2.0) {
      alerts.push({
        type: testData.chemical.electricalConductivity > 4.0 ? 'critical' : 'warning',
        parameter: 'Soil Salinity (EC)',
        currentValue: testData.chemical.electricalConductivity,
        optimalRange: [0, 2.0],
        message: `High salinity levels may affect grape yield and quality.`,
        actionRequired: testData.chemical.electricalConductivity > 4.0
      })
    }

    // Low organic matter warning
    if (testData.chemical.organicMatter < 1.0) {
      alerts.push({
        type: testData.chemical.organicMatter < 0.5 ? 'critical' : 'warning',
        parameter: 'Organic Matter',
        currentValue: testData.chemical.organicMatter,
        optimalRange: [standards.organicMatter.min, standards.organicMatter.max],
        message: `Low organic matter affects soil health and water retention.`,
        actionRequired: testData.chemical.organicMatter < 0.5
      })
    }

    return alerts
  }

  private static calculateTrends(testData: SoilTestData): SoilHealthMetrics['trends'] {
    // This would require historical data - providing mock trends for now
    return [
      {
        parameter: 'Soil pH',
        direction: 'stable',
        rate: 0.1,
        significance: 'not_significant'
      },
      {
        parameter: 'Organic Matter',
        direction: 'improving',
        rate: 2.3,
        significance: 'significant'
      },
      {
        parameter: 'Available Phosphorus',
        direction: 'declining',
        rate: -1.8,
        significance: 'significant'
      }
    ]
  }

  private static generateRecommendations(
    testData: SoilTestData,
    farmContext: any,
    limitations: any
  ): SoilRecommendations {
    const immediate: SoilRecommendations['immediate'] = []
    const seasonal: SoilRecommendations['seasonal'] = []
    const longTerm: SoilRecommendations['longTerm'] = []
    const fertilizer: SoilRecommendations['fertilizer'] = []

    // Generate immediate recommendations based on limitations
    limitations.forEach((limitation: any) => {
      let priority: 'urgent' | 'high' | 'medium' | 'low' = 'medium'
      if (limitation.severity === 'severe') priority = 'urgent'
      else if (limitation.severity === 'high') priority = 'high'

      immediate.push({
        action: limitation.recommendation,
        priority,
        timeframe: priority === 'urgent' ? 'Within 2 weeks' : 'Within 2 months',
        expectedCost: this.estimateCost(limitation.factor),
        expectedBenefit: limitation.impact
      })
    })

    // Generate seasonal recommendations
    seasonal.push(
      {
        season: 'pre_monsoon',
        actions: ['Apply organic matter', 'Soil testing', 'Drainage improvement'],
        materials: [
          { name: 'Compost', quantity: '5-8 t/ha', cost: 15000 },
          { name: 'Lime (if needed)', quantity: '2-3 t/ha', cost: 8000 }
        ]
      },
      {
        season: 'monsoon',
        actions: ['Monitor drainage', 'Cover crop establishment', 'Erosion control'],
        materials: [{ name: 'Cover crop seeds', quantity: '20-30 kg/ha', cost: 3000 }]
      },
      {
        season: 'post_monsoon',
        actions: ['Soil compaction assessment', 'Micronutrient application'],
        materials: [{ name: 'Micronutrient mix', quantity: '25 kg/ha', cost: 5000 }]
      },
      {
        season: 'winter',
        actions: ['Deep tillage (if needed)', 'Organic matter incorporation'],
        materials: [{ name: 'Farm yard manure', quantity: '10-15 t/ha', cost: 20000 }]
      }
    )

    // Generate long-term strategies
    longTerm.push({
      goal: 'Achieve optimal soil organic matter (2.5%)',
      timeline: '3-4 years',
      strategy: 'Consistent organic matter addition and reduced tillage',
      milestones: [
        { year: 1, target: '1.8%', metric: 'Organic matter content' },
        { year: 2, target: '2.1%', metric: 'Organic matter content' },
        { year: 3, target: '2.4%', metric: 'Organic matter content' }
      ]
    })

    // Generate fertilizer recommendations
    if (testData.chemical.nitrogen.available < 200) {
      fertilizer.push({
        nutrient: 'Nitrogen',
        deficiency: 200 - testData.chemical.nitrogen.available,
        recommendation: {
          organic: {
            source: 'Compost + Green manure',
            quantity: '8-10 t/ha',
            timing: 'Pre-monsoon'
          },
          inorganic: { fertilizer: 'Urea', quantity: '150-200 kg/ha', timing: 'Split application' }
        },
        costBenefit: { investment: 12000, expectedReturn: 25000 }
      })
    }

    return { immediate, seasonal, longTerm, fertilizer }
  }

  private static calculateProjections(
    testData: SoilTestData,
    recommendations: SoilRecommendations
  ): SoilHealthResults['projections'] {
    const currentScore = 65 // Would be calculated from actual analysis

    return {
      timeframe: '1year',
      scenarios: {
        no_action: {
          soilScore: Math.max(30, currentScore - 5),
          productivity: 70,
          sustainability: 45
        },
        recommended_action: {
          soilScore: Math.min(85, currentScore + 15),
          productivity: 85,
          sustainability: 80
        },
        intensive_improvement: {
          soilScore: Math.min(95, currentScore + 25),
          productivity: 95,
          sustainability: 90
        }
      }
    }
  }

  private static generateIntegrations(
    testData: SoilTestData,
    overallScore: number
  ): SoilHealthResults['integrations'] {
    return {
      nutrientCalculator: {
        adjustedRecommendations: {
          nitrogenAdjustment: testData.chemical.nitrogen.available < 200 ? 1.2 : 0.9,
          phosphorusAdjustment: testData.chemical.phosphorus.available < 15 ? 1.3 : 0.9,
          potassiumAdjustment: testData.chemical.potassium.available < 150 ? 1.2 : 0.9,
          organicMatterBonus: testData.chemical.organicMatter > 2.0 ? 0.85 : 1.0
        }
      },
      diseaseRisk: {
        soilRelatedRisks: [
          testData.chemical.pH > 7.5
            ? 'Increased fungal disease risk due to alkaline conditions'
            : null,
          testData.physical.waterHoldingCapacity < 20
            ? 'Root stress may increase disease susceptibility'
            : null,
          testData.chemical.organicMatter < 1.0
            ? 'Low organic matter reduces beneficial microorganisms'
            : null
        ].filter((risk): risk is string => risk !== null)
      },
      yieldPrediction: {
        soilHealthFactor: overallScore / 100 // 0.0-1.0 multiplier for yield predictions
      }
    }
  }

  private static calculateConfidence(testData: SoilTestData): number {
    let confidence = 100

    // Reduce confidence for missing or questionable data
    if (!testData.chemical.pH || testData.chemical.pH < 4 || testData.chemical.pH > 10)
      confidence -= 15
    if (!testData.chemical.organicMatter || testData.chemical.organicMatter < 0) confidence -= 10
    if (!testData.chemical.nitrogen.available) confidence -= 10
    if (!testData.chemical.phosphorus.available) confidence -= 10
    if (!testData.chemical.potassium.available) confidence -= 10

    // Age of test data
    const daysSinceTest = (Date.now() - testData.testDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceTest > 365) confidence -= Math.min(30, (daysSinceTest - 365) / 30)

    return Math.max(30, confidence)
  }

  private static estimateCost(factor: string): number {
    const costs: Record<string, number> = {
      'Soil Acidity': 12000, // Lime application cost per acre
      'Soil Alkalinity': 8000, // Sulfur application cost
      'Soil Salinity': 15000, // Gypsum + drainage improvement
      'Low Organic Matter': 20000, // Compost application
      'Nitrogen Deficiency': 8000, // Fertilizer cost
      'Phosphorus Deficiency': 6000, // P fertilizer cost
      'Potassium Deficiency': 7000 // K fertilizer cost
    }

    return costs[factor] || 10000
  }

  private static getPhysicalIndicators(physical: SoilTestData['physical']): string[] {
    const indicators: string[] = []

    if (physical.bulkDensity <= 1.4) indicators.push('Good soil compaction')
    if (physical.porosity >= 40) indicators.push('Adequate pore space')
    if (physical.waterHoldingCapacity >= 25) indicators.push('Good water retention')
    if (physical.infiltrationRate >= 10) indicators.push('Good water infiltration')

    return indicators.length ? indicators : ['Physical properties need improvement']
  }

  private static getChemicalIndicators(chemical: SoilTestData['chemical']): string[] {
    const indicators: string[] = []

    if (chemical.pH >= 6.0 && chemical.pH <= 7.5) indicators.push('Optimal pH range')
    if (chemical.organicMatter >= 2.0) indicators.push('Good organic matter content')
    if (chemical.electricalConductivity <= 2.0) indicators.push('Low salinity levels')
    if (chemical.nitrogen.available >= 200) indicators.push('Adequate nitrogen availability')

    return indicators.length ? indicators : ['Chemical properties need attention']
  }

  private static getBiologicalIndicators(biological: SoilTestData['biological']): string[] {
    const indicators: string[] = []

    if (biological.microbialBiomassCarbon > 200) indicators.push('Active microbial community')
    if (biological.soilRespiration > 30) indicators.push('Good biological activity')
    if (biological.earthwormCount > 50) indicators.push('Healthy soil fauna')

    return indicators.length ? indicators : ['Biological activity could be enhanced']
  }
}
