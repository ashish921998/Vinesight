/**
 * Petiole Test Classification Utilities
 *
 * Rule-based classification logic for nutrient deficiency analysis.
 * Extracted from Edge Function for testability and reuse.
 */

export type Classification = 'green' | 'yellow' | 'red'

export interface NutrientValues {
  n?: number | null
  p?: number | null
  k?: number | null
  ca?: number | null
  mg?: number | null
  s?: number | null
  zn?: number | null
  b?: number | null
  fe?: number | null
}

export interface ClassificationThresholds {
  yellow: number // 15-30% drop triggers yellow
  red: number // >30% drop triggers red
}

export interface ClassificationResult {
  classification: Classification
  reason: string
  confidence: number
  deficientNutrients: string[]
  percentDrops: Record<string, number>
}

// Default thresholds for classification
const DEFAULT_THRESHOLDS: ClassificationThresholds = {
  yellow: 15, // 15-30% drop
  red: 30 // >30% drop
}

// Optimal ranges for grape petiole tests (Thompson Seedless variety)
const OPTIMAL_RANGES: Record<string, { min: number; max: number; unit: string }> = {
  n: { min: 1.0, max: 1.5, unit: '%' },
  p: { min: 0.3, max: 0.6, unit: '%' },
  k: { min: 1.5, max: 2.5, unit: '%' },
  ca: { min: 1.0, max: 2.0, unit: '%' },
  mg: { min: 0.3, max: 0.6, unit: '%' },
  s: { min: 0.2, max: 0.4, unit: '%' },
  zn: { min: 30, max: 50, unit: 'ppm' },
  b: { min: 30, max: 50, unit: 'ppm' },
  fe: { min: 50, max: 100, unit: 'ppm' }
}

// Nutrient display names
const NUTRIENT_NAMES: Record<string, string> = {
  n: 'Nitrogen',
  p: 'Phosphorus',
  k: 'Potassium',
  ca: 'Calcium',
  mg: 'Magnesium',
  s: 'Sulfur',
  zn: 'Zinc',
  b: 'Boron',
  fe: 'Iron'
}

/**
 * Calculate percent drop from optimal mid-point
 */
export function calculatePercentDrop(
  nutrient: string,
  value: number,
  ranges = OPTIMAL_RANGES
): number | null {
  const range = ranges[nutrient.toLowerCase()]
  if (!range) return null

  const optimalMidpoint = (range.min + range.max) / 2

  if (value >= range.min && value <= range.max) {
    return 0 // Within range
  }

  if (value < range.min) {
    // Calculate percent drop from minimum
    return ((range.min - value) / range.min) * 100
  }

  // Value above range is not considered a deficiency in this classifier.
  return 0
}

/**
 * Classify a single nutrient value
 */
export function classifyNutrient(
  nutrient: string,
  value: number,
  thresholds = DEFAULT_THRESHOLDS
): { classification: Classification; percentDrop: number | null } {
  const percentDrop = calculatePercentDrop(nutrient, value)

  if (percentDrop === null) {
    return { classification: 'green', percentDrop: null }
  }

  if (percentDrop > thresholds.red) {
    return { classification: 'red', percentDrop }
  }

  if (percentDrop > thresholds.yellow) {
    return { classification: 'yellow', percentDrop }
  }

  return { classification: 'green', percentDrop }
}

/**
 * Classify complete petiole test
 */
export function classifyPetioleTest(
  nutrients: NutrientValues,
  thresholds = DEFAULT_THRESHOLDS
): ClassificationResult {
  const deficientNutrients: string[] = []
  const percentDrops: Record<string, number> = {}
  let redCount = 0
  let yellowCount = 0

  // Process each nutrient
  for (const [key, value] of Object.entries(nutrients)) {
    if (value === null || value === undefined) continue

    const { classification, percentDrop } = classifyNutrient(key, value, thresholds)

    if (percentDrop !== null && percentDrop > 0) {
      percentDrops[key] = Math.round(percentDrop * 10) / 10

      if (classification === 'red') {
        redCount++
        deficientNutrients.push(NUTRIENT_NAMES[key] || key.toUpperCase())
      } else if (classification === 'yellow') {
        yellowCount++
        // Only add to deficient list if not already red
        if (!deficientNutrients.includes(NUTRIENT_NAMES[key] || key.toUpperCase())) {
          deficientNutrients.push(NUTRIENT_NAMES[key] || key.toUpperCase())
        }
      }
    }
  }

  // Determine overall classification
  let classification: Classification
  let reason: string
  let confidence: number

  if (redCount > 0) {
    classification = 'red'
    reason = `Critical deficiency detected in ${deficientNutrients.join(', ')}. Immediate intervention required.`
    confidence = Math.min(0.95, 0.7 + redCount * 0.05)
  } else if (yellowCount > 0) {
    classification = 'yellow'
    reason = `Moderate deficiency in ${deficientNutrients.join(', ')}. Review recommended.`
    confidence = Math.min(0.9, 0.6 + yellowCount * 0.05)
  } else {
    classification = 'green'
    reason = 'All nutrients within optimal ranges. No action required.'
    confidence = 0.95
  }

  return {
    classification,
    reason,
    confidence: Math.round(confidence * 100) / 100,
    deficientNutrients,
    percentDrops
  }
}

/**
 * Compare current test against baseline
 */
export function compareWithBaseline(
  current: NutrientValues,
  baseline: NutrientValues,
  thresholds = DEFAULT_THRESHOLDS
): ClassificationResult {
  const changes: Record<string, number> = {}
  const deficientNutrients: string[] = []
  let redCount = 0
  let yellowCount = 0

  for (const [key, currentValue] of Object.entries(current)) {
    const baselineValue = baseline[key as keyof NutrientValues]

    if (
      currentValue === null ||
      currentValue === undefined ||
      baselineValue === null ||
      baselineValue === undefined
    ) {
      continue
    }

    // Calculate percent change from baseline
    const percentChange = ((currentValue - baselineValue) / baselineValue) * 100
    const percentDrop = percentChange < 0 ? Math.abs(percentChange) : 0

    if (percentDrop > 0) {
      changes[key] = Math.round(percentDrop * 10) / 10

      if (percentDrop > thresholds.red) {
        redCount++
        deficientNutrients.push(NUTRIENT_NAMES[key] || key.toUpperCase())
      } else if (percentDrop > thresholds.yellow) {
        yellowCount++
        if (!deficientNutrients.includes(NUTRIENT_NAMES[key] || key.toUpperCase())) {
          deficientNutrients.push(NUTRIENT_NAMES[key] || key.toUpperCase())
        }
      }
    }
  }

  let classification: Classification
  let reason: string
  let confidence: number

  if (redCount > 0) {
    classification = 'red'
    reason = `Significant decline from baseline in ${deficientNutrients.join(', ')} (>30% drop).`
    confidence = Math.min(0.95, 0.75 + redCount * 0.05)
  } else if (yellowCount > 0) {
    classification = 'yellow'
    reason = `Moderate decline from baseline in ${deficientNutrients.join(', ')} (15-30% drop).`
    confidence = Math.min(0.85, 0.65 + yellowCount * 0.05)
  } else {
    classification = 'green'
    reason = 'Nutrient levels stable compared to baseline. No action required.'
    confidence = 0.9
  }

  return {
    classification,
    reason,
    confidence: Math.round(confidence * 100) / 100,
    deficientNutrients,
    percentDrops: changes
  }
}

/**
 * Check if template matches based on season stage and soil type
 */
export function matchTemplate(
  template: {
    season_stage: string[]
    applicable_soil_types: string[] | null
  },
  context: {
    seasonStage: string
    soilType: string | null
  }
): { matches: boolean; specificity: number } {
  const seasonMatch = template.season_stage.includes(context.seasonStage)

  if (!seasonMatch) {
    return { matches: false, specificity: 0 }
  }

  // Base specificity for season match
  let specificity = 1

  // Handle null vs empty array differently:
  // - null = no soil restriction specified (universal, 0.5 bonus)
  // - [] = explicitly applies to all soil types (1.0 bonus)
  // - [...] = specific soil types required (2.0 bonus if matched)
  const applicableSoilTypes = template.applicable_soil_types

  if (applicableSoilTypes === null) {
    // No soil restriction specified - universal template
    specificity += 0.5
  } else if (applicableSoilTypes.length === 0) {
    // Empty array = explicitly applies to all soil types
    specificity += 1
  } else {
    // Template specifies soil types - must match
    if (context.soilType && applicableSoilTypes.includes(context.soilType)) {
      specificity += 2 // Higher weight for soil match
    }
    // If soilType is null or doesn't match, still match but with lower specificity
  }

  return { matches: true, specificity }
}

/**
 * Find best matching template from a list
 */
export function findBestTemplate<
  T extends { season_stage: string[]; applicable_soil_types: string[] | null }
>(
  templates: T[],
  context: { seasonStage: string; soilType: string | null }
): { template: T | null; specificity: number } {
  let bestTemplate: T | null = null
  let bestSpecificity = 0

  for (const template of templates) {
    const { matches, specificity } = matchTemplate(template, context)

    if (matches && specificity > bestSpecificity) {
      bestTemplate = template
      bestSpecificity = specificity
    }
  }

  return { template: bestTemplate, specificity: bestSpecificity }
}

/**
 * Calculate season stage from pruning date
 */
export function calculateSeasonStage(pruningDate: string, referenceDate = new Date()): string {
  const pruning = new Date(pruningDate)
  const daysSincePruning = Math.floor(
    (referenceDate.getTime() - pruning.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysSincePruning < 0) {
    return 'pre_pruning'
  }

  if (daysSincePruning < 14) {
    return 'bud_break'
  }

  if (daysSincePruning < 45) {
    return 'flowering'
  }

  if (daysSincePruning < 75) {
    return 'fruit_set'
  }

  if (daysSincePruning < 120) {
    return 'veraison'
  }

  if (daysSincePruning < 160) {
    return 'harvest'
  }

  return 'post_harvest'
}
