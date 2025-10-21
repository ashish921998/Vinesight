/**
 * Utility functions for formatting chemical data for display
 */

export interface Chemical {
  name: string
  quantity: number
  unit: string
}

/**
 * Validates a chemical object to ensure it has valid data
 * @param chemical - Chemical object to validate
 * @returns True if the chemical is valid, false otherwise
 */
function isValidChemical(chemical: Chemical): boolean {
  return (
    chemical &&
    typeof chemical === 'object' &&
    typeof chemical.name === 'string' &&
    chemical.name.trim() !== '' &&
    Number.isFinite(chemical.quantity)
  )
}

/**
 * Formats an array of chemicals into a readable string
 * @param chemicals - Array of chemical objects
 * @returns Formatted string like "Pesticide (5 gm/L), Fungicide (10 ml/L)"
 */
export function formatChemicalsArray(chemicals: Chemical[]): string {
  // Validate input to prevent runtime errors
  if (!chemicals || !Array.isArray(chemicals) || chemicals.length === 0) {
    return ''
  }

  // Filter out invalid chemicals instead of using fallback values
  const validChemicals = chemicals.filter(isValidChemical)

  if (validChemicals.length === 0) {
    return ''
  }

  return validChemicals
    .map((chemical) => {
      const name = chemical.name.trim()
      const unit = chemical.unit ? chemical.unit.trim() : ''

      // Preserve original precision without forced rounding
      const formattedQuantity = chemical.quantity.toString()

      // Fix trailing space issue: only add space before unit if unit exists
      if (unit) {
        return `${name} (${formattedQuantity} ${unit})`
      } else {
        return `${name} (${formattedQuantity})`
      }
    })
    .join(', ')
}

/**
 * Finds the best truncation point to avoid cutting words awkwardly
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Safe truncation index
 */
function findSafeTruncationPoint(text: string, maxLength: number): number {
  if (maxLength <= 0) return 0

  // If the text at maxLength is already a space or comma, we can truncate there
  const charAtMaxLength = text[maxLength - 1]
  if (charAtMaxLength === ' ' || charAtMaxLength === ',') {
    return maxLength
  }

  // Look backwards for a space or comma to truncate at a word boundary
  for (let i = maxLength - 1; i >= Math.max(0, maxLength - 10); i--) {
    if (text[i] === ' ' || text[i] === ',') {
      return i
    }
  }

  // If no good truncation point found, use maxLength
  return maxLength
}

/**
 * Formats chemicals for display in activity feed with intelligent truncation
 * @param chemicals - Array of chemical objects
 * @param maxLength - Maximum length before truncating (default: 30)
 * @returns Formatted and potentially truncated chemical string
 */
export function formatChemicalsForDisplay(chemicals: Chemical[], maxLength: number = 30): string {
  // Validate maxLength parameter
  if (!Number.isInteger(maxLength) || maxLength <= 0) {
    maxLength = 30
  }

  const formatted = formatChemicalsArray(chemicals)

  if (formatted.length > maxLength) {
    if (maxLength <= 3) return formatted.slice(0, maxLength)

    // Use intelligent truncation to avoid cutting words awkwardly
    const truncationPoint = findSafeTruncationPoint(formatted, maxLength - 3)
    return formatted.slice(0, truncationPoint) + '...'
  }

  return formatted
}

/**
 * Legacy function to handle both single chemical string and chemicals array
 * @param chemicalOrArray - Either a chemical string or chemicals array
 * @returns Formatted chemical string
 */
export function formatChemicalData(
  chemicalOrArray: string | Chemical[] | null | undefined
): string {
  // Add null/undefined checks to prevent runtime errors
  if (chemicalOrArray === null || chemicalOrArray === undefined) {
    return ''
  }

  if (Array.isArray(chemicalOrArray)) {
    return formatChemicalsArray(chemicalOrArray)
  }

  if (typeof chemicalOrArray === 'string') {
    const trimmed = chemicalOrArray.trim()
    return trimmed !== '' ? trimmed : ''
  }

  return ''
}
