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
