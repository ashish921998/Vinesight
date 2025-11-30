/**
 * Number formatting utilities for consistent number string handling
 */

/**
 * Format number string - removes leading zeros (e.g., "0400" -> "400")
 * Useful for cleaning up user input on blur events.
 *
 * Preserves trailing decimal points (e.g., "0." stays "0.") to allow
 * intermediate decimal typing without snapping to integer.
 *
 * @param value - The string value to format
 * @returns The formatted string, or the original value if not a valid number
 */
export const formatNumberString = (value: string): string => {
  if (!value) return value

  // Preserve trailing decimal point to allow intermediate decimal typing (e.g., "0." or "00.")
  if (value.endsWith('.')) {
    // Still normalize the integer part (e.g., "00." -> "0.")
    const integerPart = value.slice(0, -1)
    if (/^-?\d+$/.test(integerPart)) {
      const num = parseInt(integerPart, 10)
      if (!Number.isNaN(num)) {
        return num.toString() + '.'
      }
    }
    return value
  }

  // Only format if it's a valid number and not just a decimal point or minus sign
  if (/^-?\d*\.?\d*$/.test(value) && value !== '.' && value !== '-' && value !== '-.') {
    const num = parseFloat(value)
    if (!Number.isNaN(num)) {
      return num.toString()
    }
  }
  return value
}
