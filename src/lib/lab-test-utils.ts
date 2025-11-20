/**
 * Lab Test Utilities
 * Shared helper functions for lab test components
 */

/**
 * Format lab test values with appropriate decimal places
 * @param value - The numeric value to format
 * @param unit - The unit of measurement (e.g., '%', 'ppm', 'dS/m')
 * @returns Formatted string with appropriate decimal precision
 */
export function formatLabTestValue(value: number, unit: string): string {
  return value.toFixed(unit === '%' ? 2 : 1)
}
