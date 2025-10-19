/**
 * Chemical formatting utilities for VineSight
 * Shared helper functions for formatting chemical data across the application
 */

export interface ChemicalEntry {
  name: string
  quantity_amount?: number
  quantity_unit?: string
  mix_order?: number
}

/**
 * Format a list of chemicals into a human-readable string
 * Used in both CSV export and PDF export functionality
 */
export function formatChemicalsList(chemicals: ChemicalEntry[]): string {
  return chemicals
    .map((chem) => {
      // Use nullish checks to preserve valid zero values
      const amount =
        chem.quantity_amount != null ? `${chem.quantity_amount}${chem.quantity_unit ?? ''}` : ''
      return amount ? `${chem.name} (${amount})` : chem.name
    })
    .join('; ')
}

/**
 * Validate and normalize chemical quantity from string input
 */
export function parseChemicalQuantity(quantity: string | undefined): number | undefined {
  if (!quantity) return undefined

  const parsed = parseFloat(quantity)
  return Number.isFinite(parsed) ? parsed : undefined
}

/**
 * Parse chemical quantity and unit from dose string
 * Returns { quantity: number, unit: string } or null if parsing fails
 */
// Display mapping for formatted chemical units
export const UNIT_DISPLAY_MAP: Record<string, string> = {
  'gm/L': 'gm/L',
  'ml/L': 'ml/L',
  'g/L': 'gm/L',
  'g/l': 'gm/L',
  'ml/l': 'ml/L'
}

/**
 * Parse chemical quantity and unit from dose string
 * Returns { quantity: number; unit: string } or null if parsing fails
 */
export function parseChemicalDose(
  dose: string | undefined
): { quantity: number; unit: string } | null {
  if (!dose || !dose.trim()) return null

  const trimmedDose = dose.trim()

  // Match patterns like "1.5 gm/L", "2ml/L", "10 g/L", etc.
  const match = trimmedDose.match(/^([\d.]+)\s*([a-zA-Z/]+)$/)
  if (!match) return null

  const quantity = parseFloat(match[1])
  if (!Number.isFinite(quantity) || quantity <= 0) return null

  const unit = match[2].toLowerCase()

  // Normalize unit to standard format
  let normalizedUnit = unit
  if (unit === 'g/l' || unit === 'gm/l') {
    normalizedUnit = 'gm/L'
    normalizedUnit = 'gm/L'
  } else if (unit === 'ml/l') {
    normalizedUnit = 'ml/L'
  }

  return { quantity, unit: normalizedUnit }
}
