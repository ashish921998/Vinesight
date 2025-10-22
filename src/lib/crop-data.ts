// Crop varieties data for VineSight
// This file provides crop and variety options for farm setup

export interface CropOption {
  name: string
  isPopular: boolean
  varieties: string[]
}

export const CROPS_AND_VARIETIES: Record<string, string[]> = {
  Grapes: [
    'Thompson Seedless',
    'Flame Seedless',
    'Red Globe',
    'Black Muscat',
    'Arkavati',
    'Bhokri'
  ],
  Pomegranates: ['Bhagwa', 'Kandhari', 'Sinduri', 'Mridula'],
  Cotton: ['American Cotton', 'Indian Cotton', 'Hybrid Cotton'],
  Strawberries: ['Chandler', 'Sweet Charlie', 'Festival'],
  Sugarcane: ['Co-86032', 'CoPant 94', 'CoLk-94269'],
  Maize: ['Hybrid Maize - NK 6240', 'Local Maize'],
  Onions: ['Nasik Red', 'White Onion'],
  Tomatoes: ['Hybrid Tomato', 'Local Tomato']
}

// Popular crops to show first in dropdowns
export const POPULAR_CROPS = [
  'Grapes',
  'Pomegranates',
  'Cotton',
  'Strawberries',
  'Sugarcane',
  'Maize',
  'Onions',
  'Tomatoes'
]

// Get all available crops
export function getAllCrops(): string[] {
  return Object.keys(CROPS_AND_VARIETIES).sort()
}

// Get varieties for a specific crop
export function getVarietiesForCrop(crop: string): string[] {
  return CROPS_AND_VARIETIES[crop] || []
}

// Search crops by name (case-insensitive partial match)
export function searchCrops(query: string): string[] {
  if (!query.trim()) {
    // Return popular crops first if no query
    return POPULAR_CROPS
  }

  const lowerQuery = query.toLowerCase()
  const allCrops = getAllCrops()

  // Exact matches first, then partial matches
  const exactMatches = allCrops.filter((crop) => crop.toLowerCase() === lowerQuery)

  const partialMatches = allCrops.filter(
    (crop) => crop.toLowerCase().includes(lowerQuery) && crop.toLowerCase() !== lowerQuery
  )

  return [...exactMatches, ...partialMatches]
}

// Search varieties for a specific crop
export function searchVarieties(crop: string, query: string): string[] {
  const varieties = getVarietiesForCrop(crop)

  if (!query.trim()) {
    return varieties
  }

  const lowerQuery = query.toLowerCase()

  // Exact matches first, then partial matches
  const exactMatches = varieties.filter((variety) => variety.toLowerCase() === lowerQuery)

  const partialMatches = varieties.filter(
    (variety) => variety.toLowerCase().includes(lowerQuery) && variety.toLowerCase() !== lowerQuery
  )

  return [...exactMatches, ...partialMatches]
}

// Check if a crop is popular
export function isPopularCrop(crop: string): boolean {
  return POPULAR_CROPS.includes(crop)
}

// Regional crop mappings for better maintainability
const REGION_CROP_MAPPINGS = {
  // Maharashtra regions (primary focus)
  nashik: ['Grapes', 'Pomegranates', 'Onions'],
  pune: ['Grapes', 'Pomegranates', 'Strawberries'],
  sangli: ['Grapes', 'Sugarcane', 'Pomegranates'],
  solapur: ['Cotton', 'Sugarcane', 'Pomegranates'],
  satara: ['Strawberries', 'Grapes', 'Sugarcane'],
  hingoli: ['Cotton', 'Sugarcane', 'Pomegranates'],
  kolhapur: ['Sugarcane', 'Pomegranates', 'Grapes'],
  ahmednagar: ['Grapes', 'Onions', 'Pomegranates'],
  // Generic climate-based recommendations
  hot: ['Cotton', 'Sugarcane', 'Pomegranates'],
  moderate: ['Grapes', 'Pomegranates', 'Strawberries'],
  cool: ['Strawberries', 'Grapes']
}

// Alternative region names and spellings
const REGION_ALIASES: Record<string, string[]> = {
  nashik: ['nashik', 'nasik'],
  pune: ['pune', 'poona'],
  sangli: ['sangli'],
  solapur: ['solapur', 'sholapur'],
  satara: ['satara'],
  kolhapur: ['kolhapur', 'kolhapur'],
  ahmednagar: ['ahmednagar', 'ahmadnagar']
}

// Get recommended crops based on region (enhanced implementation)
export function getRecommendedCropsForRegion(region: string): string[] {
  if (!region || !region.trim()) {
    return POPULAR_CROPS
  }

  const region_lower = region.toLowerCase().trim()

  // Check for exact matches and aliases
  for (const [canonicalRegion, aliases] of Object.entries(REGION_ALIASES)) {
    if (aliases.some((alias) => region_lower.includes(alias))) {
      return (
        REGION_CROP_MAPPINGS[canonicalRegion as keyof typeof REGION_CROP_MAPPINGS] || POPULAR_CROPS
      )
    }
  }

  // Check for partial matches in region names
  for (const [regionKey, crops] of Object.entries(REGION_CROP_MAPPINGS)) {
    if (region_lower.includes(regionKey)) {
      return crops
    }
  }

  // Climate-based fallback (very basic for now)
  if (
    region_lower.includes('north') ||
    region_lower.includes('hill') ||
    region_lower.includes('mountain')
  ) {
    return REGION_CROP_MAPPINGS.cool
  }

  if (region_lower.includes('coastal') || region_lower.includes('beach')) {
    return ['Mango', 'Coconut', 'Pomegranates']
  }

  // Default: return popular crops
  return POPULAR_CROPS
}

// Check if a crop is recommended for a region
export function isCropRecommendedForRegion(region: string, crop: string): boolean {
  const recommendedCrops = getRecommendedCropsForRegion(region)
  return recommendedCrops.includes(crop)
}

// Get default variety for a crop
export function getDefaultVariety(crop: string): string {
  const varieties = getVarietiesForCrop(crop)
  return varieties.length > 0 ? varieties[0] : ''
}
