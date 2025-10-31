/**
 * Utility functions for soil test parameter processing and normalization
 */

/**
 * Maps various soil parameter key formats to standardized keys
 * Handles different naming conventions, cases, and separators
 */
export function mapSoilKey(key: string): string {
  const normalized = key.toLowerCase()
  const stripped = normalized.replace(/[_\-\s]/g, '')

  if (normalized === 'ph' || normalized === 'soilph') return 'pH'
  if (normalized === 'nitrogen' || normalized === 'n') return 'nitrogen'
  if (normalized === 'phosphorus' || normalized === 'p') return 'phosphorus'
  if (normalized === 'potassium' || normalized === 'k') return 'potassium'
  if (normalized === 'ec' || stripped === 'electricalconductivity' || normalized === 'soilec')
    return 'ec'
  if (stripped === 'calciumcarbonate' || stripped === 'caco3') return 'calciumCarbonate'
  if (stripped === 'organiccarbon' || normalized === 'oc') return 'organicCarbon'
  if (stripped === 'organicmatter') return 'organicMatter'
  if (stripped === 'calcium') return 'calcium'
  if (stripped === 'magnesium') return 'magnesium'
  if (stripped === 'sulphur' || stripped === 'sulfur' || normalized === 's') return 'sulfur'
  if (stripped === 'iron' || stripped === 'ferrous') return 'iron'
  if (stripped === 'manganese') return 'manganese'
  if (stripped === 'zinc') return 'zinc'
  if (stripped === 'copper') return 'copper'
  if (stripped === 'boron') return 'boron'
  if (stripped === 'molybdenum') return 'molybdenum'
  if (stripped === 'sodium') return 'sodium'
  if (stripped === 'chloride') return 'chloride'
  if (stripped === 'bicarbonate' || normalized === 'hco3') return 'bicarbonate'
  if (stripped === 'carbonate' || normalized === 'co3') return 'carbonate'
  return key
}

/**
 * Safely parses a value as a number with validation
 * Returns undefined if the value cannot be parsed as a finite number
 */
export function parseNumericValue(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

/**
 * Normalizes and validates soil test parameters from parsed report data
 * Maps keys using mapSoilKey and ensures numeric values
 */
export function normalizeParsedParameters(
  parsedParameters: Record<string, unknown>
): Record<string, number> {
  const combinedParameters: Record<string, number> = {}

  Object.entries(parsedParameters).forEach(([key, value]) => {
    const numericValue = parseNumericValue(value)
    if (numericValue === undefined) return

    const mappedKey = mapSoilKey(key)
    combinedParameters[mappedKey] = numericValue
  })

  return combinedParameters
}

/**
 * Creates parameter entries from form data with validation
 * Handles alternative field names and ensures finite numbers
 */
export function createParameterEntries<T extends Record<string, string>>(
  data: T,
  fieldMappings: Array<[string, ...string[]]>
): Array<[string, number]> {
  return fieldMappings.map(([key, ...alternatives]) => {
    // Try primary field first, then alternatives
    let rawValue = data[key]
    for (const alt of alternatives) {
      if (!rawValue) rawValue = data[alt as keyof T]
      if (rawValue) break
    }

    const value = parseFloat(rawValue ?? '')
    return [key, value]
  })
}

/**
 * Filters and adds valid numeric entries to parameters object
 */
export function addValidEntries(
  target: Record<string, number>,
  entries: Array<[string, number]>
): void {
  entries.forEach(([key, value]) => {
    if (Number.isFinite(value)) {
      target[key] = value
    }
  })
}
