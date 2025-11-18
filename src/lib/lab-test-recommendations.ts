/**
 * Lab Test Recommendations Engine
 * Generates rule-based recommendations for soil and petiole test results
 * Based on established agricultural science thresholds for grape farming
 */

export type RecommendationPriority = 'critical' | 'high' | 'moderate' | 'low' | 'optimal'
export type RecommendationType = 'action' | 'watch' | 'optimal' | 'savings'

export interface Recommendation {
  priority: RecommendationPriority
  type: RecommendationType
  parameter: string
  technical: string // Technical explanation
  simple: string // Simple farmer-friendly explanation
  icon: string // Emoji or icon identifier
}

/**
 * Priority order mapping for sorting recommendations
 */
const PRIORITY_ORDER: Record<RecommendationPriority, number> = {
  critical: 0,
  high: 1,
  moderate: 2,
  low: 3,
  optimal: 4
}

/**
 * Helper function to check if a parameter value is valid (not null, undefined, or non-numeric)
 */
function isValidParameter(value: number | undefined | null): value is number {
  return value !== undefined && value !== null && typeof value === 'number' && !isNaN(value)
}

export interface SoilTestParameters {
  ph?: number
  ec?: number // Electrical Conductivity (dS/m)
  organic_carbon?: number // %
  organic_matter?: number // %
  nitrogen?: number // ppm
  phosphorus?: number // ppm
  potassium?: number // ppm
  calcium?: number // ppm
  magnesium?: number // ppm
  sulfur?: number // ppm
  iron?: number // ppm
  manganese?: number // ppm
  zinc?: number // ppm
  copper?: number // ppm
  boron?: number // ppm
}

export interface PetioleTestParameters {
  total_nitrogen?: number // %
  nitrate_nitrogen?: number // ppm
  ammonium_nitrogen?: number // ppm
  phosphorus?: number // %
  potassium?: number // %
  calcium?: number // %
  magnesium?: number // %
  sulfur?: number // %
  iron?: number // ppm
  manganese?: number // ppm
  zinc?: number // ppm
  copper?: number // ppm
  boron?: number // ppm
  molybdenum?: number // ppm
  sodium?: number // %
  chloride?: number // %
}

/**
 * Validation ranges for soil test parameters
 * These catch clearly invalid data (negative values, extreme outliers)
 * while still allowing for legitimate edge cases
 */
const SOIL_VALIDATION_RANGES: Record<string, { min: number; max: number }> = {
  ph: { min: 0, max: 14 },
  ec: { min: 0, max: 20 }, // dS/m - extreme but possible
  organic_carbon: { min: 0, max: 20 }, // %
  organic_matter: { min: 0, max: 30 }, // %
  nitrogen: { min: 0, max: 2000 }, // ppm
  phosphorus: { min: 0, max: 500 }, // ppm
  potassium: { min: 0, max: 2000 }, // ppm
  calcium: { min: 0, max: 50000 }, // ppm
  magnesium: { min: 0, max: 10000 }, // ppm
  sulfur: { min: 0, max: 500 }, // ppm
  iron: { min: 0, max: 200 }, // ppm
  manganese: { min: 0, max: 200 }, // ppm
  zinc: { min: 0, max: 50 }, // ppm
  copper: { min: 0, max: 100 }, // ppm
  boron: { min: 0, max: 10 } // ppm
}

/**
 * Validate soil test parameters and return list of invalid parameters
 */
function validateSoilParameters(parameters: SoilTestParameters): string[] {
  const invalid: string[] = []

  Object.entries(parameters).forEach(([key, value]) => {
    if (!isValidParameter(value)) return // Skip null/undefined

    const range = SOIL_VALIDATION_RANGES[key]
    if (!range) return // No validation range defined

    if (value < range.min || value > range.max) {
      invalid.push(key)
    }
  })

  return invalid
}

/**
 * Generate recommendations for soil test results
 *
 * Validates parameters to catch clearly invalid data (negative values, extreme outliers)
 * before generating recommendations. Invalid data triggers a data quality warning.
 */
export function generateSoilTestRecommendations(parameters: SoilTestParameters): Recommendation[] {
  const recommendations: Recommendation[] = []

  // Validate parameters first - catch negative values, NaN, Infinity, extreme outliers
  const invalidParams = validateSoilParameters(parameters)

  if (invalidParams.length > 0) {
    recommendations.push({
      priority: 'critical',
      type: 'action',
      parameter: 'Data Quality',
      technical: `Invalid test data detected: ${invalidParams.join(', ')}. Please verify lab results for errors.`,
      simple: `Check lab report - some values look incorrect (${invalidParams.join(', ')})`,
      icon: '⚠️'
    })
    return recommendations
  }

  // pH Analysis
  if (isValidParameter(parameters.ph)) {
    if (parameters.ph < 5.5) {
      recommendations.push({
        priority: 'critical',
        type: 'action',
        parameter: 'pH',
        technical: `Soil is highly acidic (pH ${parameters.ph}). Apply agricultural lime (CaCO₃) at 2-3 tons/acre to raise pH to optimal range (6.5-7.5).`,
        simple: `Soil is too acidic. Add lime 2-3 tons per acre.`,
        icon: '🔴'
      })
    } else if (parameters.ph < 6.0) {
      recommendations.push({
        priority: 'high',
        type: 'action',
        parameter: 'pH',
        technical: `Soil is moderately acidic (pH ${parameters.ph}). Apply 1-2 tons/acre agricultural lime before planting season.`,
        simple: `Soil is slightly acidic. Add lime 1-2 tons per acre.`,
        icon: '🟡'
      })
    } else if (parameters.ph > 8.5) {
      recommendations.push({
        priority: 'critical',
        type: 'action',
        parameter: 'pH',
        technical: `Soil is highly alkaline (pH ${parameters.ph}). Apply gypsum (CaSO₄) at 1-2 tons/acre or elemental sulfur at 200-400 kg/acre.`,
        simple: `Soil is too alkaline. Add gypsum 1-2 tons or sulfur.`,
        icon: '🔴'
      })
    } else if (parameters.ph > 8.0) {
      recommendations.push({
        priority: 'high',
        type: 'action',
        parameter: 'pH',
        technical: `Soil is moderately alkaline (pH ${parameters.ph}). Apply gypsum at 500-1000 kg/acre to lower pH.`,
        simple: `Soil is slightly alkaline. Add gypsum 500kg-1 ton.`,
        icon: '🟡'
      })
    } else if (parameters.ph >= 6.5 && parameters.ph <= 7.5) {
      recommendations.push({
        priority: 'optimal',
        type: 'optimal',
        parameter: 'pH',
        technical: `pH is optimal for grape cultivation (${parameters.ph}). No correction needed.`,
        simple: `pH is perfect for grapes.`,
        icon: '✅'
      })
    } else {
      recommendations.push({
        priority: 'low',
        type: 'watch',
        parameter: 'pH',
        technical: `pH is acceptable (${parameters.ph}) but monitor regularly. Optimal range is 6.5-7.5.`,
        simple: `pH is okay, keep watching.`,
        icon: '⚠️'
      })
    }
  }

  // EC (Salinity) Analysis
  if (isValidParameter(parameters.ec)) {
    if (parameters.ec >= 4.0) {
      recommendations.push({
        priority: 'critical',
        type: 'action',
        parameter: 'EC',
        technical: `Very high salinity (EC ${parameters.ec} dS/m). Immediate leaching irrigation required. Apply 150% of normal water quantity to flush salts.`,
        simple: `Too much salt. Give heavy watering now to wash it out.`,
        icon: '🔴'
      })
    } else if (parameters.ec >= 2.0) {
      recommendations.push({
        priority: 'high',
        type: 'action',
        parameter: 'EC',
        technical: `Moderate salt buildup (EC ${parameters.ec} dS/m). Schedule leaching irrigation with 120% of normal water quantity.`,
        simple: `Salt is building up. Give extra watering to clean soil.`,
        icon: '🟡'
      })
    } else if (parameters.ec >= 1.5) {
      recommendations.push({
        priority: 'moderate',
        type: 'watch',
        parameter: 'EC',
        technical: `EC is slightly elevated (${parameters.ec} dS/m). Monitor irrigation water quality and consider occasional leaching.`,
        simple: `Soil getting a bit salty. Keep an eye on it.`,
        icon: '⚠️'
      })
    } else {
      recommendations.push({
        priority: 'optimal',
        type: 'optimal',
        parameter: 'EC',
        technical: `Salinity is in optimal range (EC ${parameters.ec} dS/m). Soil health is good.`,
        simple: `Salinity is good. Soil is healthy.`,
        icon: '✅'
      })
    }
  }

  // Nitrogen Analysis
  if (isValidParameter(parameters.nitrogen)) {
    if (parameters.nitrogen < 150) {
      recommendations.push({
        priority: 'high',
        type: 'action',
        parameter: 'Nitrogen',
        technical: `Low nitrogen (${parameters.nitrogen} ppm). Apply urea at 25-30 kg/acre or well-decomposed compost at 2-3 tons/acre.`,
        simple: `Nitrogen is low. Add urea 25-30 kg or compost.`,
        icon: '🟡'
      })
    } else if (parameters.nitrogen > 400) {
      recommendations.push({
        priority: 'moderate',
        type: 'action',
        parameter: 'Nitrogen',
        technical: `Excess nitrogen (${parameters.nitrogen} ppm). Reduce nitrogen fertilizers to prevent soft vegetative growth and disease susceptibility.`,
        simple: `Too much nitrogen. Reduce urea application.`,
        icon: '⚠️'
      })
    } else {
      recommendations.push({
        priority: 'optimal',
        type: 'optimal',
        parameter: 'Nitrogen',
        technical: `Nitrogen is in adequate range (${parameters.nitrogen} ppm). Maintain current fertilization practices.`,
        simple: `Nitrogen is good. Continue same fertilizer.`,
        icon: '✅'
      })
    }
  }

  // Phosphorus Analysis (with pH interaction)
  if (isValidParameter(parameters.phosphorus)) {
    const highPH = isValidParameter(parameters.ph) && parameters.ph > 8.0

    if (parameters.phosphorus < 20) {
      if (highPH) {
        recommendations.push({
          priority: 'high',
          type: 'action',
          parameter: 'Phosphorus',
          technical: `Low phosphorus (${parameters.phosphorus} ppm) with high pH reduces P availability. First correct pH with gypsum, then apply DAP at 50-60 kg/acre.`,
          simple: `Phosphorus low and pH high. Fix pH first, then add DAP.`,
          icon: '🟡'
        })
      } else {
        recommendations.push({
          priority: 'high',
          type: 'action',
          parameter: 'Phosphorus',
          technical: `Low phosphorus (${parameters.phosphorus} ppm). Apply DAP or SSP at 50-60 kg/acre before flowering stage.`,
          simple: `Phosphorus is low. Add DAP 50-60 kg per acre.`,
          icon: '🟡'
        })
      }
    } else if (parameters.phosphorus > 80) {
      recommendations.push({
        priority: 'low',
        type: 'savings',
        parameter: 'Phosphorus',
        technical: `High phosphorus (${parameters.phosphorus} ppm). You can skip phosphate fertilizers this season. Potential savings: ₹15,000-20,000 per acre.`,
        simple: `Phosphorus is high. Skip DAP this year. Save ₹15,000-20,000.`,
        icon: '💰'
      })
    } else {
      recommendations.push({
        priority: 'optimal',
        type: 'optimal',
        parameter: 'Phosphorus',
        technical: `Phosphorus is adequate (${parameters.phosphorus} ppm). Apply maintenance dose of 30-40 kg/acre DAP.`,
        simple: `Phosphorus is good. Give 30-40 kg DAP to maintain.`,
        icon: '✅'
      })
    }
  }

  // Potassium Analysis
  if (isValidParameter(parameters.potassium)) {
    if (parameters.potassium < 200) {
      recommendations.push({
        priority: 'high',
        type: 'action',
        parameter: 'Potassium',
        technical: `Low potassium (${parameters.potassium} ppm). Apply muriate of potash (MOP) at 40-50 kg/acre. Critical for fruit quality and disease resistance.`,
        simple: `Potash is low. Add MOP 40-50 kg. Important for fruit quality.`,
        icon: '🟡'
      })
    } else if (parameters.potassium > 500) {
      recommendations.push({
        priority: 'low',
        type: 'savings',
        parameter: 'Potassium',
        technical: `Potassium is abundant (${parameters.potassium} ppm). Reduce or skip potash application. Potential savings: ₹8,000-12,000 per acre.`,
        simple: `Potash is high. Skip MOP. Save ₹8,000-12,000.`,
        icon: '💰'
      })
    } else {
      recommendations.push({
        priority: 'optimal',
        type: 'optimal',
        parameter: 'Potassium',
        technical: `Potassium is in optimal range (${parameters.potassium} ppm). Continue current potash application.`,
        simple: `Potash is good. Continue same fertilizer.`,
        icon: '✅'
      })
    }
  }

  // Organic Matter Analysis
  if (isValidParameter(parameters.organic_matter)) {
    if (parameters.organic_matter < 1.0) {
      recommendations.push({
        priority: 'high',
        type: 'action',
        parameter: 'Organic Matter',
        technical: `Very low organic matter (${parameters.organic_matter}%). Apply 5-7 tons/acre well-decomposed FYM or compost to improve soil health.`,
        simple: `Organic matter very low. Add compost 5-7 tons.`,
        icon: '🟡'
      })
    } else if (parameters.organic_matter > 3.0) {
      recommendations.push({
        priority: 'optimal',
        type: 'optimal',
        parameter: 'Organic Matter',
        technical: `Excellent organic matter content (${parameters.organic_matter}%). Soil structure and microbial activity are healthy.`,
        simple: `Organic matter excellent. Soil is healthy.`,
        icon: '✅'
      })
    } else {
      recommendations.push({
        priority: 'moderate',
        type: 'watch',
        parameter: 'Organic Matter',
        technical: `Organic matter is moderate (${parameters.organic_matter}%). Continue adding 2-3 tons/acre compost annually.`,
        simple: `Organic matter okay. Add 2-3 tons compost yearly.`,
        icon: '⚠️'
      })
    }
  }

  // Micronutrient Analysis (brief checks)
  if (isValidParameter(parameters.zinc) && parameters.zinc < 1.0) {
    recommendations.push({
      priority: 'moderate',
      type: 'action',
      parameter: 'Zinc',
      technical: `Low zinc (${parameters.zinc} ppm). Apply zinc sulfate at 10-15 kg/acre or foliar spray of 0.5% ZnSO₄.`,
      simple: `Zinc is low. Add zinc sulfate 10-15 kg.`,
      icon: '⚠️'
    })
  }

  if (isValidParameter(parameters.boron) && parameters.boron < 0.5) {
    recommendations.push({
      priority: 'moderate',
      type: 'action',
      parameter: 'Boron',
      technical: `Low boron (${parameters.boron} ppm). Apply borax at 5-10 kg/acre. Essential for fruit set and development.`,
      simple: `Boron is low. Add borax 5-10 kg. Important for fruit.`,
      icon: '⚠️'
    })
  }

  if (isValidParameter(parameters.iron) && parameters.iron < 5.0) {
    recommendations.push({
      priority: 'moderate',
      type: 'action',
      parameter: 'Iron',
      technical: `Low iron (${parameters.iron} ppm). Apply ferrous sulfate at 20-25 kg/acre or foliar spray chelated iron.`,
      simple: `Iron is low. Add ferrous sulfate.`,
      icon: '⚠️'
    })
  }

  // Note: Some parameters (calcium, magnesium, sulfur, manganese, copper, organic_carbon)
  // currently don't generate specific recommendations in this version.
  // Recommendations for them may be added in future versions.

  // Sort recommendations by priority
  return recommendations.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
}

/**
 * Validation ranges for petiole test parameters
 * These catch clearly invalid data (negative values, extreme outliers)
 * while still allowing for legitimate edge cases
 */
const PETIOLE_VALIDATION_RANGES: Record<string, { min: number; max: number }> = {
  total_nitrogen: { min: 0, max: 10 }, // %
  nitrate_nitrogen: { min: 0, max: 5000 }, // ppm
  ammonium_nitrogen: { min: 0, max: 3000 }, // ppm
  phosphorus: { min: 0, max: 2 }, // %
  potassium: { min: 0, max: 6 }, // %
  calcium: { min: 0, max: 6 }, // %
  magnesium: { min: 0, max: 3 }, // %
  sulfur: { min: 0, max: 2 }, // %
  iron: { min: 0, max: 500 }, // ppm
  manganese: { min: 0, max: 500 }, // ppm
  zinc: { min: 0, max: 300 }, // ppm
  copper: { min: 0, max: 100 }, // ppm
  boron: { min: 0, max: 200 }, // ppm
  molybdenum: { min: 0, max: 5 }, // ppm
  sodium: { min: 0, max: 3 }, // %
  chloride: { min: 0, max: 2 } // %
}

/**
 * Validate petiole test parameters and return list of invalid parameters
 */
function validatePetioleParameters(parameters: PetioleTestParameters): string[] {
  const invalid: string[] = []

  Object.entries(parameters).forEach(([key, value]) => {
    if (!isValidParameter(value)) return // Skip null/undefined

    const range = PETIOLE_VALIDATION_RANGES[key]
    if (!range) return // No validation range defined

    if (value < range.min || value > range.max) {
      invalid.push(key)
    }
  })

  return invalid
}

/**
 * Generate recommendations for petiole test results
 *
 * Validates parameters to catch clearly invalid data (negative values, extreme outliers)
 * before generating recommendations. Invalid data triggers a data quality warning.
 */
export function generatePetioleTestRecommendations(
  parameters: PetioleTestParameters
): Recommendation[] {
  const recommendations: Recommendation[] = []

  // Validate parameters first - catch negative values, NaN, Infinity, extreme outliers
  const invalidParams = validatePetioleParameters(parameters)

  if (invalidParams.length > 0) {
    recommendations.push({
      priority: 'critical',
      type: 'action',
      parameter: 'Data Quality',
      technical: `Invalid test data detected: ${invalidParams.join(', ')}. Please verify lab results for errors.`,
      simple: `Check lab report - some values look incorrect (${invalidParams.join(', ')})`,
      icon: '⚠️'
    })
    return recommendations
  }

  // Total Nitrogen Analysis
  if (isValidParameter(parameters.total_nitrogen)) {
    if (parameters.total_nitrogen < 2.0) {
      recommendations.push({
        priority: 'high',
        type: 'action',
        parameter: 'Nitrogen',
        technical: `Low petiole nitrogen (${parameters.total_nitrogen}%). Apply immediate foliar spray of urea (1-2%) or increase fertigation nitrogen by 20%.`,
        simple: `Nitrogen low. Spray urea on leaves or increase in drip.`,
        icon: '🟡'
      })
    } else if (parameters.total_nitrogen > 4.0) {
      recommendations.push({
        priority: 'moderate',
        type: 'action',
        parameter: 'Nitrogen',
        technical: `Excess petiole nitrogen (${parameters.total_nitrogen}%). Reduce nitrogen fertilization to prevent excessive vegetative growth and disease risk.`,
        simple: `Nitrogen too high. Reduce urea to avoid diseases.`,
        icon: '⚠️'
      })
    } else {
      recommendations.push({
        priority: 'optimal',
        type: 'optimal',
        parameter: 'Nitrogen',
        technical: `Petiole nitrogen is optimal (${parameters.total_nitrogen}%). Continue current nitrogen management.`,
        simple: `Nitrogen is good. Continue same fertilizer.`,
        icon: '✅'
      })
    }
  }

  // Phosphorus Analysis (petiole)
  if (isValidParameter(parameters.phosphorus)) {
    if (parameters.phosphorus < 0.2) {
      recommendations.push({
        priority: 'high',
        type: 'action',
        parameter: 'Phosphorus',
        technical: `Low petiole phosphorus (${parameters.phosphorus}%). Apply phosphoric acid through fertigation at 5-7 liters/acre or foliar spray of DAP (2%).`,
        simple: `Phosphorus low. Give phosphoric acid or spray DAP.`,
        icon: '🟡'
      })
    } else if (parameters.phosphorus > 0.6) {
      recommendations.push({
        priority: 'low',
        type: 'savings',
        parameter: 'Phosphorus',
        technical: `High petiole phosphorus (${parameters.phosphorus}%). Plant is well-supplied. Reduce phosphorus fertilization.`,
        simple: `Phosphorus high. Reduce DAP, save money.`,
        icon: '💰'
      })
    } else {
      recommendations.push({
        priority: 'optimal',
        type: 'optimal',
        parameter: 'Phosphorus',
        technical: `Petiole phosphorus is adequate (${parameters.phosphorus}%). Maintain current phosphorus application.`,
        simple: `Phosphorus is good. Continue same fertilizer.`,
        icon: '✅'
      })
    }
  }

  // Potassium Analysis (petiole)
  if (isValidParameter(parameters.potassium)) {
    if (parameters.potassium < 1.5) {
      recommendations.push({
        priority: 'critical',
        type: 'action',
        parameter: 'Potassium',
        technical: `Very low petiole potassium (${parameters.potassium}%). Immediate action required. Apply potassium sulfate through fertigation at 15-20 kg/acre. Critical for fruit quality and color development.`,
        simple: `Potash very low. Give potash sulfate 15-20 kg now. Important for fruit color.`,
        icon: '🔴'
      })
    } else if (parameters.potassium < 2.0) {
      recommendations.push({
        priority: 'high',
        type: 'action',
        parameter: 'Potassium',
        technical: `Low petiole potassium (${parameters.potassium}%). Increase potassium fertigation by 30%. Critical stage for berry development.`,
        simple: `Potash low. Increase potash in drip system.`,
        icon: '🟡'
      })
    } else if (parameters.potassium > 3.5) {
      recommendations.push({
        priority: 'moderate',
        type: 'watch',
        parameter: 'Potassium',
        technical: `High petiole potassium (${parameters.potassium}%). May interfere with calcium and magnesium uptake. Monitor and adjust if needed.`,
        simple: `Potash high. May affect calcium uptake.`,
        icon: '⚠️'
      })
    } else {
      recommendations.push({
        priority: 'optimal',
        type: 'optimal',
        parameter: 'Potassium',
        technical: `Petiole potassium is optimal (${parameters.potassium}%). Excellent for fruit quality and sugar development.`,
        simple: `Potash is perfect. Great for fruit quality.`,
        icon: '✅'
      })
    }
  }

  // Calcium Analysis
  if (isValidParameter(parameters.calcium)) {
    if (parameters.calcium < 1.5) {
      recommendations.push({
        priority: 'high',
        type: 'action',
        parameter: 'Calcium',
        technical: `Low petiole calcium (${parameters.calcium}%). Apply calcium nitrate through fertigation at 10-15 kg/acre or foliar spray. Low calcium increases powdery mildew susceptibility.`,
        simple: `Calcium low. Give calcium nitrate. Low calcium increases diseases.`,
        icon: '🟡'
      })
    } else if (parameters.calcium > 3.5) {
      recommendations.push({
        priority: 'optimal',
        type: 'optimal',
        parameter: 'Calcium',
        technical: `Excellent petiole calcium (${parameters.calcium}%). Strong cell walls and good disease resistance.`,
        simple: `Calcium excellent. Disease resistance good.`,
        icon: '✅'
      })
    } else {
      recommendations.push({
        priority: 'optimal',
        type: 'optimal',
        parameter: 'Calcium',
        technical: `Petiole calcium is adequate (${parameters.calcium}%). Maintain current calcium management.`,
        simple: `Calcium is good. Continue same fertilizer.`,
        icon: '✅'
      })
    }
  }

  // Magnesium Analysis
  if (isValidParameter(parameters.magnesium)) {
    if (parameters.magnesium < 0.3) {
      recommendations.push({
        priority: 'high',
        type: 'action',
        parameter: 'Magnesium',
        technical: `Low petiole magnesium (${parameters.magnesium}%). Apply magnesium sulfate (Epsom salt) at 10-15 kg/acre or foliar spray at 1%. Essential for chlorophyll production.`,
        simple: `Magnesium low. Give Epsom salt 10-15 kg. Needed for green leaves.`,
        icon: '🟡'
      })
    } else if (parameters.magnesium > 1.0) {
      recommendations.push({
        priority: 'optimal',
        type: 'optimal',
        parameter: 'Magnesium',
        technical: `Excellent petiole magnesium (${parameters.magnesium}%). Photosynthesis and chlorophyll production are optimal.`,
        simple: `Magnesium excellent. Photosynthesis working well.`,
        icon: '✅'
      })
    } else {
      recommendations.push({
        priority: 'optimal',
        type: 'optimal',
        parameter: 'Magnesium',
        technical: `Petiole magnesium is adequate (${parameters.magnesium}%). Continue current magnesium application.`,
        simple: `Magnesium is good. Continue same fertilizer.`,
        icon: '✅'
      })
    }
  }

  // Micronutrients (brief checks)
  if (isValidParameter(parameters.zinc) && parameters.zinc < 20) {
    recommendations.push({
      priority: 'moderate',
      type: 'action',
      parameter: 'Zinc',
      technical: `Low petiole zinc (${parameters.zinc} ppm). Apply foliar spray of zinc sulfate (0.5%) during active growth stages.`,
      simple: `Zinc low. Spray zinc on leaves.`,
      icon: '⚠️'
    })
  }

  if (isValidParameter(parameters.boron) && parameters.boron < 30) {
    recommendations.push({
      priority: 'moderate',
      type: 'action',
      parameter: 'Boron',
      technical: `Low petiole boron (${parameters.boron} ppm). Apply borax foliar spray (0.1-0.2%) before and after flowering. Critical for fruit set.`,
      simple: `Boron low. Spray before and after flowering. Important for fruit set.`,
      icon: '⚠️'
    })
  }

  // Support both 'iron' (current) and 'ferrous' (legacy) keys
  const ironValue = parameters.iron ?? (parameters as any).ferrous
  if (isValidParameter(ironValue) && ironValue < 50) {
    recommendations.push({
      priority: 'moderate',
      type: 'action',
      parameter: 'Iron',
      technical: `Low petiole iron (${ironValue} ppm). Apply chelated iron foliar spray or through fertigation. Symptoms: yellowing between leaf veins.`,
      simple: `Iron low. Spray on leaves. Leaves may turn yellow.`,
      icon: '⚠️'
    })
  }

  // Note: Some parameters (nitrate_nitrogen, sulfur, manganese, copper)
  // don't generate specific recommendations in this version yet.
  // Recommendations for these parameters may be added in future versions.

  // Sort by priority
  return recommendations.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
}

/**
 * Priority color mappings for UI display
 */
const PRIORITY_COLORS: Record<RecommendationPriority, string> = {
  critical: 'text-red-600 bg-red-50 border-red-200',
  high: 'text-orange-600 bg-orange-50 border-orange-200',
  moderate: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  low: 'text-blue-600 bg-blue-50 border-blue-200',
  optimal: 'text-green-600 bg-green-50 border-green-200'
}

/**
 * Priority label mappings for display
 */
const PRIORITY_LABELS: Record<RecommendationPriority, string> = {
  critical: 'Urgent Action Required',
  high: 'High Priority',
  moderate: 'Monitor',
  low: 'Suggestion',
  optimal: 'Optimal'
}

/**
 * Get priority color for UI display
 */
export function getPriorityColor(priority: RecommendationPriority): string {
  return PRIORITY_COLORS[priority]
}

/**
 * Get priority label for display
 */
export function getPriorityLabel(priority: RecommendationPriority): string {
  return PRIORITY_LABELS[priority]
}
