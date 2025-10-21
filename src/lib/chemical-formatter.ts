/**
 * Utility functions for formatting chemical data for display
 */

export interface Chemical {
  name: string
  quantity: number
  unit: string
}

/**
 * Formats an array of chemicals into a readable string
 * @param chemicals - Array of chemical objects
 * @returns Formatted string like "Pesticide (5 gm/L), Fungicide (10 ml/L)"
 */
export function formatChemicalsArray(chemicals: Chemical[]): string {
  if (!chemicals || !Array.isArray(chemicals) || chemicals.length === 0) {
    return ''
  }

  return chemicals
    .filter((chemical) => chemical.name && chemical.name.trim() !== '')
    .map((chemical) => {
      const name = chemical.name.trim()
      const quantity = chemical.quantity || 0
      const unit = chemical.unit || ''

      // Format the quantity to avoid unnecessary decimal places
      const formattedQuantity = quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(1)

      return `${name} (${formattedQuantity} ${unit})`
    })
    .join(', ')
}

/**
 * Formats chemicals for display in activity feed with truncation for long strings
 * @param chemicals - Array of chemical objects
 * @param maxLength - Maximum length before truncating (default: 30)
 * @returns Formatted and potentially truncated chemical string
 */
export function formatChemicalsForDisplay(chemicals: Chemical[], maxLength: number = 30): string {
  const formatted = formatChemicalsArray(chemicals)

  if (formatted.length > maxLength) {
    return formatted.substring(0, maxLength - 3) + '...'
  }

  return formatted
}

/**
 * Legacy function to handle both single chemical string and chemicals array
 * @param chemicalOrArray - Either a chemical string or chemicals array
 * @returns Formatted chemical string
 */
export function formatChemicalData(chemicalOrArray: string | Chemical[]): string {
  if (Array.isArray(chemicalOrArray)) {
    return formatChemicalsArray(chemicalOrArray)
  }

  if (typeof chemicalOrArray === 'string' && chemicalOrArray.trim()) {
    return chemicalOrArray.trim()
  }

  return ''
}
