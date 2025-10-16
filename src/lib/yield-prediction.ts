export interface HistoricalYieldData {
  year: number
  yieldPerAcre: number // kg/ha
  averageClusterWeight: number // grams
  clustersPerVine: number
  berrySize: 'small' | 'medium' | 'large'
  sugarContent: number // Brix
  acidity: number // g/L tartaric acid
  pH: number
  harvestDate: Date
  weatherConditions: {
    growingSeason: {
      averageTemp: number // °C
      totalRainfall: number // mm
      sunlightHours: number // hours
      extremeWeatherEvents: number
    }
    floweringPeriod: {
      averageTemp: number
      rainfall: number
      windSpeed: number // m/s
    }
    ripening: {
      averageTemp: number
      rainfall: number
      heatWavesDays: number
    }
  }
  managementPractices: {
    pruningIntensity: 'light' | 'moderate' | 'heavy'
    irrigationAmount: number // mm
    fertilizationProgram: 'minimal' | 'standard' | 'intensive'
    canopyManagement: 'minimal' | 'standard' | 'intensive'
    pestControl: number // applications count
  }
  soilConditions: {
    organicMatter: number // %
    nitrogen: number // kg/ha
    phosphorus: number // kg/ha
    potassium: number // kg/ha
    pH: number
    drainage: 'poor' | 'moderate' | 'good'
  }
}

export interface YieldPredictionInputs {
  historicalData: HistoricalYieldData[]
  currentSeasonData: {
    vineAge: number // years
    grapeVariety:
      | 'cabernet_sauvignon'
      | 'chardonnay'
      | 'pinot_noir'
      | 'merlot'
      | 'sauvignon_blanc'
      | 'riesling'
    plantingDensity: number // vines per acre
    targetQuality: 'premium' | 'standard' | 'bulk'
    currentWeather: HistoricalYieldData['weatherConditions']
    plannedManagement: HistoricalYieldData['managementPractices']
    currentSoil: HistoricalYieldData['soilConditions']
    budBreakDate: Date
    floweringDate: Date | null
    veraison: Date | null
  }
  economicFactors: {
    targetPrice: number // per kg
    productionCost: number // per acre
    laborCost: number // per hour
    inputCosts: {
      fertilizer: number
      pesticides: number
      water: number
    }
  }
}

export interface YieldPredictionModel {
  baseYield: number // kg/ha
  adjustments: {
    weather: { factor: number; impact: number; description: string }
    management: { factor: number; impact: number; description: string }
    soil: { factor: number; impact: number; description: string }
    variety: { factor: number; impact: number; description: string }
    vineAge: { factor: number; impact: number; description: string }
  }
  scenarios: {
    optimistic: { yield: number; probability: number }
    realistic: { yield: number; probability: number }
    pessimistic: { yield: number; probability: number }
  }
}

export interface QualityPrediction {
  sugarContent: { predicted: number; range: [number, number] }
  acidity: { predicted: number; range: [number, number] }
  pH: { predicted: number; range: [number, number] }
  overallQuality: 'excellent' | 'good' | 'average' | 'below_average'
  qualityScore: number // 0-100
  harvestWindow: {
    optimal: Date
    earliest: Date
    latest: Date
  }
}

export interface EconomicAnalysis {
  revenue: {
    optimistic: number
    realistic: number
    pessimistic: number
  }
  costs: {
    total: number
    perKg: number
    breakdown: {
      labor: number
      materials: number
      equipment: number
      overhead: number
    }
  }
  profitability: {
    optimistic: { profit: number; margin: number }
    realistic: { profit: number; margin: number }
    pessimistic: { profit: number; margin: number }
  }
  breakEvenYield: number // kg/ha
  roi: number // %
}

export interface YieldPredictionResults {
  prediction: YieldPredictionModel
  quality: QualityPrediction
  economics: EconomicAnalysis
  riskFactors: {
    factor: string
    impact: 'high' | 'medium' | 'low'
    mitigation: string
  }[]
  recommendations: {
    category: 'irrigation' | 'nutrition' | 'canopy' | 'harvest'
    action: string
    timing: string
    impact: string
  }[]
  confidence: number // 0-100%
  dataQuality: {
    historicalYears: number
    completeness: number // %
    relevance: number // %
  }
}

// Variety-specific parameters
const VARIETY_PARAMETERS = {
  cabernet_sauvignon: {
    baseYield: 12000, // kg/ha
    qualityYieldTradeoff: 0.85, // higher = less tradeoff
    optimalBrix: 24.5,
    optimalAcidity: 6.2,
    optimalPH: 3.65,
    heatTolerance: 0.8,
    droughtTolerance: 0.9,
    diseaseResistance: 0.7
  },
  chardonnay: {
    baseYield: 14000,
    qualityYieldTradeoff: 0.75,
    optimalBrix: 22.5,
    optimalAcidity: 7.5,
    optimalPH: 3.35,
    heatTolerance: 0.6,
    droughtTolerance: 0.7,
    diseaseResistance: 0.5
  },
  pinot_noir: {
    baseYield: 10000,
    qualityYieldTradeoff: 0.9,
    optimalBrix: 23.5,
    optimalAcidity: 6.8,
    optimalPH: 3.55,
    heatTolerance: 0.4,
    droughtTolerance: 0.5,
    diseaseResistance: 0.3
  },
  merlot: {
    baseYield: 13000,
    qualityYieldTradeoff: 0.8,
    optimalBrix: 24.0,
    optimalAcidity: 5.8,
    optimalPH: 3.7,
    heatTolerance: 0.7,
    droughtTolerance: 0.8,
    diseaseResistance: 0.6
  },
  sauvignon_blanc: {
    baseYield: 15000,
    qualityYieldTradeoff: 0.7,
    optimalBrix: 21.5,
    optimalAcidity: 8.0,
    optimalPH: 3.25,
    heatTolerance: 0.5,
    droughtTolerance: 0.6,
    diseaseResistance: 0.6
  },
  riesling: {
    baseYield: 16000,
    qualityYieldTradeoff: 0.65,
    optimalBrix: 20.5,
    optimalAcidity: 9.0,
    optimalPH: 3.15,
    heatTolerance: 0.3,
    droughtTolerance: 0.4,
    diseaseResistance: 0.8
  }
}

export class YieldPredictionEngine {
  static predictYield(inputs: YieldPredictionInputs): YieldPredictionResults {
    const varietyParams = VARIETY_PARAMETERS[inputs.currentSeasonData.grapeVariety]

    // Calculate base yield from historical average
    const historicalAverage = this.calculateHistoricalAverage(inputs.historicalData)
    const baseYield = Math.max(varietyParams.baseYield * 0.7, historicalAverage)

    // Calculate adjustment factors
    const adjustments = this.calculateAdjustments(inputs, varietyParams)

    // Generate yield scenarios
    const scenarios = this.generateScenarios(baseYield, adjustments)

    // Predict quality parameters
    const quality = this.predictQuality(inputs, varietyParams)

    // Calculate economic analysis
    const economics = this.calculateEconomics(scenarios, quality, inputs.economicFactors)

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(inputs, adjustments)

    // Generate recommendations
    const recommendations = this.generateRecommendations(inputs, adjustments, riskFactors)

    // Calculate confidence and data quality
    const confidence = this.calculateConfidence(inputs.historicalData, inputs.currentSeasonData)
    const dataQuality = this.assessDataQuality(inputs.historicalData)

    return {
      prediction: {
        baseYield,
        adjustments,
        scenarios
      },
      quality,
      economics,
      riskFactors,
      recommendations,
      confidence,
      dataQuality
    }
  }

  private static calculateHistoricalAverage(data: HistoricalYieldData[]): number {
    if (data.length === 0) return 0

    // Weight recent years more heavily
    let totalWeight = 0
    let weightedSum = 0
    const currentYear = new Date().getFullYear()

    data.forEach((yearData) => {
      const yearsAgo = currentYear - yearData.year
      const weight = Math.max(0.1, 1 - yearsAgo * 0.1) // Decay weight by 10% per year
      weightedSum += yearData.yieldPerAcre * weight
      totalWeight += weight
    })

    return totalWeight > 0 ? weightedSum / totalWeight : 0
  }

  private static calculateAdjustments(
    inputs: YieldPredictionInputs,
    varietyParams: any
  ): YieldPredictionModel['adjustments'] {
    const current = inputs.currentSeasonData

    // Weather adjustment
    const weatherFactor = this.calculateWeatherFactor(current.currentWeather, varietyParams)
    const weatherImpact = (weatherFactor - 1) * 100

    // Management adjustment
    const managementFactor = this.calculateManagementFactor(
      current.plannedManagement,
      varietyParams
    )
    const managementImpact = (managementFactor - 1) * 100

    // Soil adjustment
    const soilFactor = this.calculateSoilFactor(current.currentSoil)
    const soilImpact = (soilFactor - 1) * 100

    // Variety adjustment (baseline is 1.0)
    const varietyFactor = this.calculateVarietyFactor(current.grapeVariety, current.targetQuality)
    const varietyImpact = (varietyFactor - 1) * 100

    // Vine age adjustment
    const ageAdjustment = this.calculateVineAgeAdjustment(current.vineAge)
    const ageImpact = (ageAdjustment.factor - 1) * 100

    return {
      weather: {
        factor: weatherFactor,
        impact: weatherImpact,
        description: this.getWeatherDescription(weatherImpact)
      },
      management: {
        factor: managementFactor,
        impact: managementImpact,
        description: this.getManagementDescription(managementImpact)
      },
      soil: {
        factor: soilFactor,
        impact: soilImpact,
        description: this.getSoilDescription(soilImpact)
      },
      variety: {
        factor: varietyFactor,
        impact: varietyImpact,
        description: this.getVarietyDescription(current.grapeVariety, current.targetQuality)
      },
      vineAge: {
        factor: ageAdjustment.factor,
        impact: ageImpact,
        description: ageAdjustment.description
      }
    }
  }

  private static calculateWeatherFactor(
    weather: HistoricalYieldData['weatherConditions'],
    varietyParams: any
  ): number {
    let factor = 1.0

    // Growing season temperature
    const tempOptimal = 20 // °C
    const tempDeviation = Math.abs(weather.growingSeason.averageTemp - tempOptimal)
    factor *= Math.max(0.6, 1 - tempDeviation * 0.05)

    // Heat tolerance adjustment
    if (weather.growingSeason.averageTemp > 25) {
      factor *= varietyParams.heatTolerance
    }

    // Rainfall impact
    const rainfallOptimal = 400 // mm
    const rainfallDeviation = Math.abs(weather.growingSeason.totalRainfall - rainfallOptimal)
    factor *= Math.max(0.7, 1 - rainfallDeviation / 1000)

    // Drought tolerance adjustment
    if (weather.growingSeason.totalRainfall < 300) {
      factor *= varietyParams.droughtTolerance
    }

    // Sunlight hours
    const sunlightOptimal = 2500 // hours
    const sunlightFactor = Math.min(1.2, weather.growingSeason.sunlightHours / sunlightOptimal)
    factor *= sunlightFactor

    // Extreme weather events
    factor *= Math.max(0.5, 1 - weather.growingSeason.extremeWeatherEvents * 0.1)

    return Math.max(0.3, Math.min(1.5, factor))
  }

  private static calculateManagementFactor(
    management: HistoricalYieldData['managementPractices'],
    varietyParams: any
  ): number {
    let factor = 1.0

    // Pruning intensity
    const pruningFactors = { light: 1.1, moderate: 1.0, heavy: 0.85 }
    factor *= pruningFactors[management.pruningIntensity]

    // Irrigation amount
    const irrigationOptimal = 300 // mm
    const irrigationFactor = Math.min(1.2, management.irrigationAmount / irrigationOptimal)
    factor *= irrigationFactor

    // Fertilization program
    const fertFactors = { minimal: 0.9, standard: 1.0, intensive: 1.15 }
    factor *= fertFactors[management.fertilizationProgram]

    // Canopy management
    const canopyFactors = { minimal: 0.85, standard: 1.0, intensive: 1.1 }
    factor *= canopyFactors[management.canopyManagement]

    return Math.max(0.5, Math.min(1.4, factor))
  }

  private static calculateSoilFactor(soil: HistoricalYieldData['soilConditions']): number {
    let factor = 1.0

    // Organic matter
    const organicOptimal = 3.5 // %
    const organicFactor = Math.min(1.2, soil.organicMatter / organicOptimal)
    factor *= organicFactor

    // Nutrient balance
    const nFactor = Math.min(1.1, soil.nitrogen / 150) // 150 kg/ha optimal
    const pFactor = Math.min(1.1, soil.phosphorus / 50) // 50 kg/ha optimal
    const kFactor = Math.min(1.1, soil.potassium / 200) // 200 kg/ha optimal
    factor *= (nFactor + pFactor + kFactor) / 3

    // pH
    const pHOptimal = 6.5
    const pHDeviation = Math.abs(soil.pH - pHOptimal)
    factor *= Math.max(0.8, 1 - pHDeviation * 0.1)

    // Drainage
    const drainageFactors = { poor: 0.8, moderate: 1.0, good: 1.1 }
    factor *= drainageFactors[soil.drainage]

    return Math.max(0.6, Math.min(1.3, factor))
  }

  private static calculateVarietyFactor(variety: string, targetQuality: string): number {
    const varietyParams = VARIETY_PARAMETERS[variety as keyof typeof VARIETY_PARAMETERS]

    // Quality vs yield tradeoff
    const qualityFactors = {
      premium: varietyParams.qualityYieldTradeoff * 0.8, // Reduce yield for premium quality
      standard: varietyParams.qualityYieldTradeoff,
      bulk: varietyParams.qualityYieldTradeoff * 1.2 // Increase yield for bulk
    }

    return qualityFactors[targetQuality as keyof typeof qualityFactors] || 1.0
  }

  private static calculateVineAgeAdjustment(age: number): { factor: number; description: string } {
    if (age <= 3) {
      return { factor: 0.6, description: 'Young vines producing below full potential' }
    } else if (age <= 7) {
      return { factor: 0.9, description: 'Vines approaching full production capacity' }
    } else if (age <= 20) {
      return { factor: 1.0, description: 'Mature vines at optimal production' }
    } else if (age <= 35) {
      return { factor: 0.95, description: 'Established vines with stable high-quality production' }
    } else {
      return { factor: 0.8, description: 'Old vines with lower yields but concentrated flavors' }
    }
  }

  private static generateScenarios(
    baseYield: number,
    adjustments: YieldPredictionModel['adjustments']
  ): YieldPredictionModel['scenarios'] {
    const totalFactor = Object.values(adjustments).reduce((acc, adj) => acc * adj.factor, 1)
    const adjustedYield = baseYield * totalFactor

    return {
      optimistic: {
        yield: Math.round(adjustedYield * 1.15),
        probability: 25
      },
      realistic: {
        yield: Math.round(adjustedYield),
        probability: 50
      },
      pessimistic: {
        yield: Math.round(adjustedYield * 0.8),
        probability: 25
      }
    }
  }

  private static predictQuality(
    inputs: YieldPredictionInputs,
    varietyParams: any
  ): QualityPrediction {
    const weather = inputs.currentSeasonData.currentWeather

    // Sugar content prediction
    const baseBrix = varietyParams.optimalBrix
    let brixAdjustment = 0

    if (weather.ripening.averageTemp > 25) brixAdjustment += 1.5
    if (weather.ripening.heatWavesDays > 5) brixAdjustment += 0.8
    if (weather.ripening.rainfall > 50) brixAdjustment -= 1.2

    const predictedBrix = baseBrix + brixAdjustment
    const brixRange: [number, number] = [predictedBrix - 1.5, predictedBrix + 1.5]

    // Acidity prediction
    const baseAcidity = varietyParams.optimalAcidity
    let acidityAdjustment = 0

    if (weather.ripening.averageTemp > 25) acidityAdjustment -= 0.8
    if (weather.growingSeason.averageTemp < 18) acidityAdjustment += 0.5

    const predictedAcidity = baseAcidity + acidityAdjustment
    const acidityRange: [number, number] = [predictedAcidity - 0.8, predictedAcidity + 0.8]

    // pH prediction
    const basePH = varietyParams.optimalPH
    const predictedPH = basePH + acidityAdjustment * -0.05
    const pHRange: [number, number] = [predictedPH - 0.15, predictedPH + 0.15]

    // Overall quality assessment
    const qualityScore = this.calculateQualityScore(
      predictedBrix,
      predictedAcidity,
      predictedPH,
      varietyParams
    )
    const overallQuality = this.getQualityGrade(qualityScore)

    // Harvest window
    const harvestWindow = this.calculateHarvestWindow(inputs.currentSeasonData, predictedBrix)

    return {
      sugarContent: { predicted: predictedBrix, range: brixRange },
      acidity: { predicted: predictedAcidity, range: acidityRange },
      pH: { predicted: predictedPH, range: pHRange },
      overallQuality,
      qualityScore,
      harvestWindow
    }
  }

  private static calculateQualityScore(
    brix: number,
    acidity: number,
    pH: number,
    varietyParams: any
  ): number {
    let score = 100

    // Brix score
    const brixDeviation = Math.abs(brix - varietyParams.optimalBrix)
    score -= brixDeviation * 5

    // Acidity score
    const acidityDeviation = Math.abs(acidity - varietyParams.optimalAcidity)
    score -= acidityDeviation * 3

    // pH score
    const pHDeviation = Math.abs(pH - varietyParams.optimalPH)
    score -= pHDeviation * 20

    return Math.max(0, Math.min(100, score))
  }

  private static getQualityGrade(
    score: number
  ): 'excellent' | 'good' | 'average' | 'below_average' {
    if (score >= 90) return 'excellent'
    if (score >= 75) return 'good'
    if (score >= 60) return 'average'
    return 'below_average'
  }

  private static calculateHarvestWindow(
    currentSeason: YieldPredictionInputs['currentSeasonData'],
    targetBrix: number
  ): QualityPrediction['harvestWindow'] {
    const budBreak = currentSeason.budBreakDate
    const daysToHarvest = this.calculateDaysToHarvest(currentSeason.grapeVariety, targetBrix)

    const optimal = new Date(budBreak)
    optimal.setDate(optimal.getDate() + daysToHarvest)

    const earliest = new Date(optimal)
    earliest.setDate(earliest.getDate() - 7)

    const latest = new Date(optimal)
    latest.setDate(latest.getDate() + 14)

    return { optimal, earliest, latest }
  }

  private static calculateDaysToHarvest(variety: string, targetBrix: number): number {
    const baseDays = {
      cabernet_sauvignon: 150,
      chardonnay: 110,
      pinot_noir: 130,
      merlot: 140,
      sauvignon_blanc: 100,
      riesling: 120
    }

    const baseForVariety = baseDays[variety as keyof typeof baseDays] || 130
    const brixAdjustment = (targetBrix - 22) * 3 // 3 days per degree Brix

    return Math.max(90, baseForVariety + brixAdjustment)
  }

  private static calculateEconomics(
    scenarios: YieldPredictionModel['scenarios'],
    quality: QualityPrediction,
    economicFactors: YieldPredictionInputs['economicFactors']
  ): EconomicAnalysis {
    const priceMultipliers = {
      excellent: 1.3,
      good: 1.1,
      average: 1.0,
      below_average: 0.8
    }

    const adjustedPrice = economicFactors.targetPrice * priceMultipliers[quality.overallQuality]

    // Revenue calculations
    const revenue = {
      optimistic: scenarios.optimistic.yield * adjustedPrice,
      realistic: scenarios.realistic.yield * adjustedPrice,
      pessimistic: scenarios.pessimistic.yield * adjustedPrice
    }

    // Cost calculations
    const totalCosts =
      economicFactors.productionCost +
      economicFactors.inputCosts.fertilizer +
      economicFactors.inputCosts.pesticides +
      economicFactors.inputCosts.water

    const costs = {
      total: totalCosts,
      perKg: totalCosts / scenarios.realistic.yield,
      breakdown: {
        labor: economicFactors.laborCost * 40, // Estimated 40 hours per acre
        materials: economicFactors.inputCosts.fertilizer + economicFactors.inputCosts.pesticides,
        equipment: economicFactors.productionCost * 0.3, // 30% for equipment
        overhead: economicFactors.productionCost * 0.2 // 20% overhead
      }
    }

    // Profitability calculations
    const profitability = {
      optimistic: {
        profit: revenue.optimistic - totalCosts,
        margin: ((revenue.optimistic - totalCosts) / revenue.optimistic) * 100
      },
      realistic: {
        profit: revenue.realistic - totalCosts,
        margin: ((revenue.realistic - totalCosts) / revenue.realistic) * 100
      },
      pessimistic: {
        profit: revenue.pessimistic - totalCosts,
        margin: ((revenue.pessimistic - totalCosts) / revenue.pessimistic) * 100
      }
    }

    const breakEvenYield = totalCosts / adjustedPrice
    const roi = (profitability.realistic.profit / totalCosts) * 100

    return {
      revenue,
      costs,
      profitability,
      breakEvenYield,
      roi
    }
  }

  private static identifyRiskFactors(
    inputs: YieldPredictionInputs,
    adjustments: YieldPredictionModel['adjustments']
  ): YieldPredictionResults['riskFactors'] {
    const risks: YieldPredictionResults['riskFactors'] = []

    // Weather risks
    if (adjustments.weather.factor < 0.9) {
      risks.push({
        factor: 'Adverse Weather Conditions',
        impact: adjustments.weather.factor < 0.7 ? 'high' : 'medium',
        mitigation: 'Consider protective measures such as netting or adjusted irrigation schedules'
      })
    }

    // Management risks
    if (adjustments.management.factor < 0.9) {
      risks.push({
        factor: 'Suboptimal Management Practices',
        impact: 'medium',
        mitigation: 'Review and optimize canopy management, fertilization, and irrigation practices'
      })
    }

    // Soil risks
    if (adjustments.soil.factor < 0.9) {
      risks.push({
        factor: 'Soil Fertility Issues',
        impact: adjustments.soil.factor < 0.8 ? 'high' : 'medium',
        mitigation: 'Implement soil improvement program with organic matter and targeted nutrition'
      })
    }

    // Age-related risks
    if (adjustments.vineAge.factor < 0.9) {
      risks.push({
        factor: 'Vine Age Impact',
        impact: inputs.currentSeasonData.vineAge < 5 ? 'medium' : 'low',
        mitigation:
          inputs.currentSeasonData.vineAge < 5
            ? 'Allow young vines to establish; focus on canopy development'
            : 'Consider replanting sections with declining productivity'
      })
    }

    return risks
  }

  private static generateRecommendations(
    inputs: YieldPredictionInputs,
    adjustments: YieldPredictionModel['adjustments'],
    risks: YieldPredictionResults['riskFactors']
  ): YieldPredictionResults['recommendations'] {
    const recommendations: YieldPredictionResults['recommendations'] = []

    // Irrigation recommendations
    if (adjustments.weather.impact < -10) {
      recommendations.push({
        category: 'irrigation',
        action: 'Increase irrigation frequency during dry periods',
        timing: 'Throughout growing season',
        impact: 'Could improve yield by 10-15%'
      })
    }

    // Nutrition recommendations
    if (adjustments.soil.factor < 0.9) {
      recommendations.push({
        category: 'nutrition',
        action: 'Apply targeted fertilizer based on soil test results',
        timing: 'Early spring before budbreak',
        impact: 'Could improve yield by 8-12%'
      })
    }

    // Canopy management
    if (adjustments.management.factor < 1.0) {
      recommendations.push({
        category: 'canopy',
        action: 'Implement strategic leaf removal and shoot thinning',
        timing: 'Pre-flowering and post-fruit set',
        impact: 'Could improve both yield and quality'
      })
    }

    // Harvest timing
    recommendations.push({
      category: 'harvest',
      action: 'Monitor sugar and acid levels closely for optimal harvest timing',
      timing: '2 weeks before projected harvest date',
      impact: 'Ensures optimal quality and market price'
    })

    return recommendations
  }

  private static calculateConfidence(
    historicalData: HistoricalYieldData[],
    currentSeason: YieldPredictionInputs['currentSeasonData']
  ): number {
    let confidence = 100

    // Reduce confidence based on limited historical data
    if (historicalData.length < 3) confidence -= 30
    else if (historicalData.length < 5) confidence -= 15

    // Reduce confidence for unusual conditions
    if (currentSeason.vineAge < 3 || currentSeason.vineAge > 40) confidence -= 10

    // Reduce confidence if data is too old
    const currentYear = new Date().getFullYear()
    const latestDataYear = Math.max(...historicalData.map((d) => d.year))
    const dataAge = currentYear - latestDataYear
    if (dataAge > 2) confidence -= dataAge * 5

    return Math.max(30, confidence)
  }

  private static assessDataQuality(
    historicalData: HistoricalYieldData[]
  ): YieldPredictionResults['dataQuality'] {
    const years = historicalData.length

    // Calculate completeness based on required fields
    let totalFields = 0
    let completeFields = 0

    historicalData.forEach((data) => {
      const fields = [
        'yieldPerAcre',
        'averageClusterWeight',
        'clustersPerVine',
        'sugarContent',
        'acidity',
        'pH'
      ]

      fields.forEach((field) => {
        totalFields++
        if (
          data[field as keyof HistoricalYieldData] !== undefined &&
          data[field as keyof HistoricalYieldData] !== null
        ) {
          completeFields++
        }
      })
    })

    const completeness = totalFields > 0 ? (completeFields / totalFields) * 100 : 0

    // Calculate relevance based on data recency
    const currentYear = new Date().getFullYear()
    const avgAge = historicalData.reduce((sum, data) => sum + (currentYear - data.year), 0) / years
    const relevance = Math.max(30, 100 - avgAge * 5)

    return {
      historicalYears: years,
      completeness: Math.round(completeness),
      relevance: Math.round(relevance)
    }
  }

  // Helper methods for description generation
  private static getWeatherDescription(impact: number): string {
    if (impact > 10) return 'Favorable weather conditions supporting higher yields'
    if (impact > 0) return 'Slightly favorable weather conditions'
    if (impact > -10) return 'Minor weather challenges may reduce yields'
    return 'Significant weather challenges expected to impact yields'
  }

  private static getManagementDescription(impact: number): string {
    if (impact > 10) return 'Intensive management practices promoting optimal yields'
    if (impact > 0) return 'Good management practices supporting yields'
    if (impact > -10) return 'Management practices may limit yield potential'
    return 'Suboptimal management practices constraining yields'
  }

  private static getSoilDescription(impact: number): string {
    if (impact > 10) return 'Excellent soil conditions supporting high yields'
    if (impact > 0) return 'Good soil fertility supporting yields'
    if (impact > -10) return 'Soil limitations may reduce yield potential'
    return 'Poor soil conditions constraining yields significantly'
  }

  private static getVarietyDescription(variety: string, quality: string): string {
    const varietyName = variety.replace(/_/g, ' ').toUpperCase()
    return `${varietyName} variety optimized for ${quality} production`
  }
}
