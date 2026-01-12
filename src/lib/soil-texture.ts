/**
 * Determine soil texture class based on USDA soil texture triangle
 * using the percentages of sand, silt, and clay.
 *
 * Classification rules based on USDA textural triangle:
 *
 * 1. Sand: sand >= 85%
 * 2. Loamy sand: sand 70-85%
 * 3. Sandy loam: sand 43-85%, clay <= 20%
 * 4. Loam: clay 7-27%, sand 25-52%, silt 28-50%
 * 5. Silt loam: silt >= 50%, clay 12-27%, sand < 50%
 * 6. Silt: silt >= 80%
 * 7. Sandy clay loam: clay 20-35%, sand >= 45%
 * 8. Clay loam: clay 27-40%, sand 20-45%
 * 9. Silty clay loam: clay 27-40%, sand < 20%
 * 10. Sandy clay: clay >= 35%, sand >= 45%
 * 11. Silty clay: clay >= 40%, silt >= 40%
 * 12. Clay: clay >= 40%, sand < 45%, silt < 40%
 *
 * @param sand - Percentage of sand (0-100)
 * @param silt - Percentage of silt (0-100)
 * @param clay - Percentage of clay (0-100)
 * @returns The soil texture class name or null if inputs are invalid
 */

export type SoilTextureClass =
  | 'Sand'
  | 'Loamy sand'
  | 'Sandy loam'
  | 'Loam'
  | 'Silt loam'
  | 'Silt'
  | 'Sandy clay loam'
  | 'Clay loam'
  | 'Silty clay loam'
  | 'Sandy clay'
  | 'Silty clay'
  | 'Clay'

export function getSoilTextureClass(
  sand: number | string | undefined,
  silt: number | string | undefined,
  clay: number | string | undefined
): SoilTextureClass | null {
  // Parse input values
  const sandNum = typeof sand === 'string' ? parseFloat(sand) : sand
  const siltNum = typeof silt === 'string' ? parseFloat(silt) : silt
  const clayNum = typeof clay === 'string' ? parseFloat(clay) : clay

  // Validate inputs
  if (
    sandNum === undefined ||
    siltNum === undefined ||
    clayNum === undefined ||
    isNaN(sandNum) ||
    isNaN(siltNum) ||
    isNaN(clayNum) ||
    sandNum < 0 ||
    siltNum < 0 ||
    clayNum < 0
  ) {
    return null
  }

  // Check if values sum to approximately 100%
  const sum = sandNum + siltNum + clayNum
  if (sum < 95 || sum > 105) {
    return null
  }

  // Normalize to exactly 100% if close
  const normalizedSand = sum !== 100 ? (sandNum / sum) * 100 : sandNum
  const normalizedSilt = sum !== 100 ? (siltNum / sum) * 100 : siltNum
  const normalizedClay = sum !== 100 ? (clayNum / sum) * 100 : clayNum

  const s = normalizedSand
  const si = normalizedSilt
  const c = normalizedClay

  // Classification according to USDA soil texture triangle

  // 1. Sand
  if (s >= 85 && c <= 10) {
    return 'Sand'
  }

  // 2. Loamy sand
  // USDA boundary: silt + 2*clay <= 30 (diagonal boundary with Sandy loam)
  if (s >= 70 && s < 85 && c <= 15 && si + 2 * c <= 30) {
    return 'Loamy sand'
  }

  // 3. Sandy loam
  if (s >= 43 && s < 85 && c <= 20) {
    return 'Sandy loam'
  }

  // 4. Loam
  if (s >= 25 && s < 52 && si >= 28 && si <= 50 && c >= 7 && c <= 27) {
    return 'Loam'
  }

  // 5. Silt loam
  if (si >= 50 && c >= 12 && c <= 27 && s < 50) {
    return 'Silt loam'
  }

  // 6. Silt
  if (si >= 80 && c <= 15) {
    return 'Silt'
  }

  // 7. Sandy clay loam
  if (c >= 20 && c <= 35 && s >= 45) {
    return 'Sandy clay loam'
  }

  // 8. Clay loam
  if (c >= 27 && c <= 40 && s >= 20 && s < 45) {
    return 'Clay loam'
  }

  // 9. Silty clay loam
  if (c >= 27 && c <= 40 && s < 20) {
    return 'Silty clay loam'
  }

  // 10. Sandy clay
  if (c >= 35 && s >= 45) {
    return 'Sandy clay'
  }

  // 11. Silty clay
  if (c >= 40 && si >= 40) {
    return 'Silty clay'
  }

  // 12. Clay
  if (c >= 40 && s < 45 && si < 40) {
    return 'Clay'
  }

  // If no exact match, try to find the closest match
  return findClosestSoilTexture(s, si, c)
}

function findClosestSoilTexture(sand: number, silt: number, clay: number): SoilTextureClass | null {
  // Define representative points for each soil texture class
  const textureClasses: Array<{
    name: SoilTextureClass
    sand: number
    silt: number
    clay: number
  }> = [
    { name: 'Sand', sand: 90, silt: 5, clay: 5 },
    { name: 'Loamy sand', sand: 80, silt: 15, clay: 5 },
    { name: 'Sandy loam', sand: 65, silt: 25, clay: 10 },
    { name: 'Loam', sand: 40, silt: 40, clay: 20 },
    { name: 'Silt loam', sand: 20, silt: 60, clay: 20 },
    { name: 'Silt', sand: 10, silt: 80, clay: 10 },
    { name: 'Sandy clay loam', sand: 60, silt: 15, clay: 25 },
    { name: 'Clay loam', sand: 32, silt: 38, clay: 30 },
    { name: 'Silty clay loam', sand: 10, silt: 55, clay: 35 },
    { name: 'Sandy clay', sand: 50, silt: 10, clay: 40 },
    { name: 'Silty clay', sand: 10, silt: 45, clay: 45 },
    { name: 'Clay', sand: 20, silt: 20, clay: 60 }
  ]

  // Find the closest match using Euclidean distance
  let closestTexture: SoilTextureClass | null = null
  let minDistance = Infinity

  for (const texture of textureClasses) {
    const distance = Math.sqrt(
      Math.pow(sand - texture.sand, 2) +
        Math.pow(silt - texture.silt, 2) +
        Math.pow(clay - texture.clay, 2)
    )
    if (distance < minDistance) {
      minDistance = distance
      closestTexture = texture.name
    }
  }

  return closestTexture
}

/**
 * Get a description of the soil texture class properties
 */
export function getSoilTextureDescription(texture: SoilTextureClass): {
  description: string
  characteristics: string[]
  suitability: string
} {
  const descriptions: Record<SoilTextureClass, any> = {
    Sand: {
      description: 'Coarse-textured soil with large particles',
      characteristics: [
        'Very fast drainage',
        'Low water retention',
        'High aeration',
        'Low fertility',
        'Warms up quickly in spring'
      ],
      suitability: 'Fair for grapes - requires organic matter and frequent irrigation'
    },
    'Loamy sand': {
      description: 'Coarse-textured soil with some fine particles',
      characteristics: [
        'Fast drainage',
        'Low to moderate water retention',
        'Good aeration',
        'Easy to work with'
      ],
      suitability: 'Good for grapes - well-draining, requires irrigation management'
    },
    'Sandy loam': {
      description: 'Medium-coarse textured soil',
      characteristics: [
        'Good drainage',
        'Moderate water retention',
        'Good aeration',
        'Easy to work with',
        'Moderate fertility'
      ],
      suitability: 'Excellent for grapes - ideal drainage and water balance'
    },
    Loam: {
      description: 'Balanced medium-textured soil',
      characteristics: [
        'Balanced drainage',
        'Good water retention',
        'Good nutrient holding',
        'Easy to work with',
        'High fertility'
      ],
      suitability: 'Excellent for grapes - near-ideal growing conditions'
    },
    'Silt loam': {
      description: 'Medium-textured soil with dominant silt',
      characteristics: [
        'Moderate drainage',
        'Good water retention',
        'Moderate fertility',
        'Can crust when dry',
        'Easy to work with when moist'
      ],
      suitability: 'Good for grapes - needs careful irrigation to prevent crusting'
    },
    Silt: {
      description: 'Fine-textured soil with dominant silt particles',
      characteristics: [
        'Slow drainage',
        'High water retention',
        'Easy to work with',
        'Can become compacted',
        'Prone to crusting'
      ],
      suitability: 'Fair for grapes - requires drainage management'
    },
    'Sandy clay loam': {
      description: 'Medium-fine textured soil',
      characteristics: [
        'Moderate drainage',
        'Good water retention',
        'Good nutrient holding',
        'Can become sticky when wet'
      ],
      suitability: 'Good for grapes - good water and nutrient retention'
    },
    'Clay loam': {
      description: 'Medium-fine textured soil with significant clay',
      characteristics: [
        'Slow to moderate drainage',
        'High water retention',
        'High nutrient holding',
        'Can be sticky when wet',
        'Hard when dry'
      ],
      suitability: 'Good for grapes - excellent for drought resistance'
    },
    'Silty clay loam': {
      description: 'Fine-textured soil',
      characteristics: [
        'Slow drainage',
        'High water retention',
        'High nutrient holding',
        'Can be difficult to work with',
        'Prone to waterlogging'
      ],
      suitability: 'Fair for grapes - requires excellent drainage'
    },
    'Sandy clay': {
      description: 'Fine-textured soil with high clay content',
      characteristics: [
        'Slow drainage',
        'High water retention',
        'High nutrient holding',
        'Sticky when wet',
        'Hard when dry'
      ],
      suitability: 'Fair to good - requires careful water management'
    },
    'Silty clay': {
      description: 'Very fine-textured soil',
      characteristics: [
        'Very slow drainage',
        'Very high water retention',
        'High nutrient holding',
        'Very sticky when wet',
        'Very hard when dry'
      ],
      suitability: 'Challenging - requires raised beds or mounding'
    },
    Clay: {
      description: 'Very fine-textured soil with dominant clay',
      characteristics: [
        'Very slow drainage',
        'Very high water retention',
        'High nutrient holding',
        'Cracks when dry',
        'Very sticky when wet'
      ],
      suitability: 'Challenging - requires raised beds and careful irrigation'
    }
  }

  return descriptions[texture] || descriptions.Loam
}
