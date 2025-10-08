/**
 * Leaf Area Index (LAI) Calculator for Grape Canopy Management
 * Based on vine morphology and canopy architecture principles
 */

export interface LAICalculationInputs {
  farmId: number
  vineSpacing: number // meters between vines
  rowSpacing: number // meters between rows
  leavesPerShoot: number
  shootsPerVine: number
  avgLeafLength: number // cm
  avgLeafWidth: number // cm
  canopyHeight: number // meters
  canopyWidth: number // meters
  leafShape: 'heart' | 'round' | 'lobed' // affects shape factor
  trellisSystem: 'vsp' | 'geneva' | 'scott-henry' | 'lyre' | 'pergola'
  season: 'spring' | 'summer' | 'autumn'
}

export interface LAIResults {
  lai: number // Leaf Area Index
  leafAreaPerVine: number // m²
  leafAreaPerAcre: number // m²/ha
  plantDensity: number // vines per acre
  canopyDensity: 'sparse' | 'optimal' | 'dense' | 'overcrowded'
  lightInterception: number // percentage
  recommendations: {
    canopyManagement: string[]
    pruningAdvice: string[]
    trellisAdjustments: string[]
  }
  qualityMetrics: {
    fruitExposure: 'poor' | 'adequate' | 'good' | 'excellent'
    airflow: 'poor' | 'adequate' | 'good' | 'excellent'
    diseaseRisk: 'low' | 'moderate' | 'high'
  }
}

// Shape factors for different leaf types
const LEAF_SHAPE_FACTORS = {
  heart: 0.68, // Heart-shaped grape leaves
  round: 0.79, // More circular leaves
  lobed: 0.63 // Deeply lobed leaves
}

// Seasonal adjustment factors
const SEASONAL_FACTORS = {
  spring: 0.6, // New growth, smaller leaves
  summer: 1.0, // Full leaf development
  autumn: 0.8 // Some leaf drop, yellowing
}

// Trellis system efficiency factors
const TRELLIS_EFFICIENCY = {
  vsp: 1.0, // Vertical Shoot Positioning (baseline)
  geneva: 1.15, // Geneva Double Curtain
  'scott-henry': 1.25, // Scott Henry divided canopy
  lyre: 1.3, // Lyre system
  pergola: 0.9 // Pergola system
}

export class LAICalculator {
  /**
   * Calculate individual leaf area
   */
  private static calculateLeafArea(length: number, width: number, leafShape: string): number {
    const shapeFactor = LEAF_SHAPE_FACTORS[leafShape as keyof typeof LEAF_SHAPE_FACTORS] || 0.68
    return (length * width * shapeFactor) / 10000 // Convert cm² to m²
  }

  /**
   * Calculate plant density (vines per acre)
   */
  private static calculatePlantDensity(vineSpacing: number, rowSpacing: number): number {
    return 10000 / (vineSpacing * rowSpacing)
  }

  /**
   * Estimate light interception based on LAI
   */
  private static calculateLightInterception(lai: number): number {
    // Beer-Lambert law adaptation for grape canopies
    // Light interception = 1 - e^(-k * LAI)
    // where k = extinction coefficient (0.5-0.7 for grapes)
    const k = 0.6
    return (1 - Math.exp(-k * lai)) * 100
  }

  /**
   * Classify canopy density
   */
  private static classifyCanopyDensity(lai: number): LAIResults['canopyDensity'] {
    if (lai < 1.0) return 'sparse'
    if (lai <= 2.5) return 'optimal'
    if (lai <= 4.0) return 'dense'
    return 'overcrowded'
  }

  /**
   * Generate canopy management recommendations
   */
  private static generateRecommendations(
    lai: number,
    canopyDensity: LAIResults['canopyDensity'],
    trellisSystem: string,
    lightInterception: number
  ): LAIResults['recommendations'] {
    const canopyManagement: string[] = []
    const pruningAdvice: string[] = []
    const trellisAdjustments: string[] = []

    // Canopy management recommendations
    switch (canopyDensity) {
      case 'sparse':
        canopyManagement.push('Encourage lateral shoot growth')
        canopyManagement.push('Consider reducing pruning severity')
        canopyManagement.push('Monitor for adequate fruit shading')
        pruningAdvice.push('Leave more buds during winter pruning')
        pruningAdvice.push('Reduce shoot thinning intensity')
        break

      case 'optimal':
        canopyManagement.push('Maintain current canopy management')
        canopyManagement.push('Continue regular shoot positioning')
        canopyManagement.push('Monitor for seasonal changes')
        pruningAdvice.push('Current pruning level is appropriate')
        break

      case 'dense':
        canopyManagement.push('Increase leaf removal in fruit zone')
        canopyManagement.push('Improve shoot positioning')
        canopyManagement.push('Consider selective shoot removal')
        pruningAdvice.push('Increase winter pruning severity')
        pruningAdvice.push('Remove excess shoots early in season')
        break

      case 'overcrowded':
        canopyManagement.push('Urgent canopy thinning required')
        canopyManagement.push('Remove basal leaves around fruit')
        canopyManagement.push('Improve air circulation')
        pruningAdvice.push('Severe pruning recommended')
        pruningAdvice.push('Consider canopy division systems')
        trellisAdjustments.push('Consider upgrading to divided canopy system')
        break
    }

    // Light interception specific advice
    if (lightInterception < 60) {
      canopyManagement.push('Insufficient light interception - allow more leaf growth')
    } else if (lightInterception > 85) {
      canopyManagement.push('Excessive shading - reduce leaf density')
    }

    // Trellis system specific advice
    if (trellisSystem === 'vsp' && lai > 3.0) {
      trellisAdjustments.push('Consider upgrading to divided canopy system')
      trellisAdjustments.push('VSP may be limiting for this canopy density')
    }

    return {
      canopyManagement,
      pruningAdvice,
      trellisAdjustments:
        trellisAdjustments.length > 0
          ? trellisAdjustments
          : ['Current trellis system is appropriate']
    }
  }

  /**
   * Assess quality metrics based on LAI and canopy structure
   */
  private static assessQualityMetrics(
    lai: number,
    lightInterception: number
  ): LAIResults['qualityMetrics'] {
    let fruitExposure: LAIResults['qualityMetrics']['fruitExposure'] = 'adequate'
    let airflow: LAIResults['qualityMetrics']['airflow'] = 'adequate'
    let diseaseRisk: LAIResults['qualityMetrics']['diseaseRisk'] = 'moderate'

    // Fruit exposure assessment
    if (lightInterception < 50 || lai < 1.0) {
      fruitExposure = 'poor'
    } else if (lightInterception >= 65 && lightInterception <= 80 && lai >= 1.5 && lai <= 3.0) {
      fruitExposure = 'excellent'
    } else if (lightInterception >= 55 && lightInterception <= 85) {
      fruitExposure = 'good'
    }

    // Airflow assessment
    if (lai > 4.0) {
      airflow = 'poor'
      diseaseRisk = 'high'
    } else if (lai >= 2.0 && lai <= 3.0) {
      airflow = 'good'
      diseaseRisk = 'low'
    } else if (lai > 3.0) {
      airflow = 'adequate'
      diseaseRisk = 'moderate'
    } else {
      airflow = 'excellent'
      diseaseRisk = 'low'
    }

    return { fruitExposure, airflow, diseaseRisk }
  }

  /**
   * Main LAI calculation function
   */
  static calculateLAI(inputs: LAICalculationInputs): LAIResults {
    const {
      vineSpacing,
      rowSpacing,
      leavesPerShoot,
      shootsPerVine,
      avgLeafLength,
      avgLeafWidth,
      leafShape,
      trellisSystem,
      season
    } = inputs

    // Calculate individual leaf area
    const individualLeafArea = this.calculateLeafArea(avgLeafLength, avgLeafWidth, leafShape)

    // Calculate total leaf area per vine
    const leafAreaPerVine = individualLeafArea * leavesPerShoot * shootsPerVine

    // Apply seasonal and trellis adjustments
    const seasonalFactor = SEASONAL_FACTORS[season]
    const trellisEfficiency = TRELLIS_EFFICIENCY[trellisSystem]
    const adjustedLeafAreaPerVine = leafAreaPerVine * seasonalFactor * trellisEfficiency

    // Calculate plant density
    const plantDensity = this.calculatePlantDensity(vineSpacing, rowSpacing)

    // Calculate LAI (Leaf Area per unit ground area)
    const leafAreaPerAcre = adjustedLeafAreaPerVine * plantDensity
    const lai = leafAreaPerAcre / 10000 // Convert to LAI units

    // Calculate light interception
    const lightInterception = this.calculateLightInterception(lai)

    // Classify canopy density
    const canopyDensity = this.classifyCanopyDensity(lai)

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      lai,
      canopyDensity,
      trellisSystem,
      lightInterception
    )

    // Assess quality metrics
    const qualityMetrics = this.assessQualityMetrics(lai, lightInterception)

    return {
      lai: Math.round(lai * 100) / 100,
      leafAreaPerVine: Math.round(adjustedLeafAreaPerVine * 100) / 100,
      leafAreaPerAcre: Math.round(leafAreaPerAcre),
      plantDensity: Math.round(plantDensity),
      canopyDensity,
      lightInterception: Math.round(lightInterception * 10) / 10,
      recommendations,
      qualityMetrics
    }
  }

  /**
   * Calculate optimal LAI for different grape production goals
   */
  static getOptimalLAITargets(productionGoal: 'table' | 'wine' | 'raisin'): {
    minLAI: number
    maxLAI: number
    optimalRange: string
    reasoning: string
  } {
    const targets = {
      table: {
        minLAI: 1.8,
        maxLAI: 2.8,
        optimalRange: '2.0 - 2.5',
        reasoning:
          'Table grapes need excellent fruit exposure for color and size while maintaining adequate leaf area for photosynthesis'
      },
      wine: {
        minLAI: 2.2,
        maxLAI: 3.5,
        optimalRange: '2.5 - 3.0',
        reasoning:
          'Wine grapes benefit from moderate shading for flavor development while ensuring sufficient photosynthetic capacity'
      },
      raisin: {
        minLAI: 2.0,
        maxLAI: 3.2,
        optimalRange: '2.3 - 2.8',
        reasoning:
          'Raisin grapes require balanced canopy for sugar accumulation and efficient drying conditions'
      }
    }

    return targets[productionGoal]
  }

  /**
   * Seasonal LAI monitoring recommendations
   */
  static getSeasonalMonitoringSchedule(): {
    season: string
    timing: string
    focus: string[]
    actions: string[]
  }[] {
    return [
      {
        season: 'Spring',
        timing: 'Bud break to bloom',
        focus: ['Shoot emergence', 'Initial leaf development', 'Canopy architecture'],
        actions: ['Shoot thinning', 'Early positioning', 'Sucker removal']
      },
      {
        season: 'Early Summer',
        timing: 'Post-bloom to véraison',
        focus: ['Peak leaf area development', 'Fruit zone management', 'Light penetration'],
        actions: ['Leaf removal', 'Shoot positioning', 'Hedging if needed']
      },
      {
        season: 'Late Summer',
        timing: 'Véraison to harvest',
        focus: ['Fruit exposure', 'Sugar accumulation', 'Disease prevention'],
        actions: ['Selective defoliation', 'Cluster thinning', 'Canopy opening']
      },
      {
        season: 'Autumn',
        timing: 'Post-harvest',
        focus: ['Leaf retention', 'Carbohydrate storage', 'Winter preparation'],
        actions: ['Minimal intervention', 'Disease control', 'Planning for dormant pruning']
      }
    ]
  }
}
