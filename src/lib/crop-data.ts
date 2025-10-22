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

// Get recommended crops based on region (basic implementation)
export function getRecommendedCropsForRegion(region: string): string[] {
  const region_lower = region.toLowerCase()

  // Simple region-based recommendations
  if (
    region_lower.includes('nashik') ||
    region_lower.includes('pune') ||
    region_lower.includes('sangli')
  ) {
    return ['Grapes', 'Pomegranates', 'Onions']
  }

  if (region_lower.includes('solapur') || region_lower.includes('hingoli')) {
    return ['Cotton', 'Sugarcane', 'Pomegranates']
  }

  if (region_lower.includes('satara')) {
    return ['Strawberries', 'Grapes', 'Sugarcane']
  }

  // Default: return popular crops
  return POPULAR_CROPS
}

// Get default variety for a crop
export function getDefaultVariety(crop: string): string {
  const varieties = getVarietiesForCrop(crop)
  return varieties.length > 0 ? varieties[0] : ''
}
