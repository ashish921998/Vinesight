/**
 * Shared parameter canonicalization logic for test reports
 * Used by both the report parser and the UI to ensure consistent parameter mapping
 */

/**
 * Canonicalizes a parameter key to a standard form (generic, test-type agnostic)
 * @param key The parameter key to canonicalize (case-insensitive)
 * @returns The canonical key or null if no mapping exists
 */
export function canonicalizeParameterKey(key: string): string | null {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '')

  const mappings: Record<string, string> = {
    soilph: 'ph',
    ph: 'ph',
    electricalconductivity: 'ec',
    soilec: 'ec',
    ec: 'ec',
    organiccarbon: 'organicCarbon',
    organicmatter: 'organicMatter',
    oc: 'organicCarbon',
    // Specific nitrogen types for petiole tests (check these first before generic nitrogen)
    totalnitrogen: 'total_nitrogen',
    totalnitrogenasn: 'total_nitrogen',
    nitratenitrogen: 'nitrate_nitrogen',
    nitratenitrogenasno3n: 'nitrate_nitrogen',
    no3n: 'nitrate_nitrogen',
    ammonicalnitrogen: 'ammonical_nitrogen',
    ammoniacalnitrogen: 'ammonical_nitrogen',
    ammoniumnitrogen: 'ammonical_nitrogen',
    ammonicalnitrogenasnh4n: 'ammonical_nitrogen',
    ammoniacalnitrogenasnh4n: 'ammonical_nitrogen',
    ammoniumnitrogenasnh4n: 'ammonical_nitrogen',
    nh4n: 'ammonical_nitrogen',
    // Generic nitrogen for soil tests
    nitrogen: 'nitrogen',
    n: 'nitrogen',
    phosphorus: 'phosphorus',
    phosphorous: 'phosphorus',
    p: 'phosphorus',
    potassium: 'potassium',
    k: 'potassium',
    calciumcarbonate: 'calciumCarbonate',
    caco3: 'calciumCarbonate',
    calcium: 'calcium',
    ca: 'calcium',
    magnesium: 'magnesium',
    mg: 'magnesium',
    sulphur: 'sulfur',
    sulfur: 'sulfur',
    s: 'sulfur',
    iron: 'iron',
    ferrous: 'iron',
    fe: 'iron',
    manganese: 'manganese',
    mn: 'manganese',
    zinc: 'zinc',
    zn: 'zinc',
    copper: 'copper',
    cu: 'copper',
    boron: 'boron',
    b: 'boron',
    molybdenum: 'molybdenum',
    mo: 'molybdenum',
    sodium: 'sodium',
    na: 'sodium',
    chloride: 'chloride',
    cl: 'chloride',
    carbonate: 'carbonate',
    co3: 'carbonate',
    bicarbonate: 'bicarbonate',
    hco3: 'bicarbonate'
  }

  return mappings[normalized] ?? null
}

/**
 * Applies canonicalization to a record of parameters (soil test specific)
 * Uses generic canonicalization which maps everything to canonical forms like 'iron', 'sulfur'
 * @param parameters Record of parameter names to values
 * @returns Record with canonicalized keys for soil tests
 */
export function canonicalizeSoilParameters(
  parameters: Record<string, number>
): Record<string, number> {
  return canonicalizeParameters(parameters)
}

/**
 * Applies canonicalization to a record of parameters (petiole test specific)
 * Uses generic canonicalization which keeps everything in canonical iron/sulfur form
 * @param parameters Record of parameter names to values
 * @returns Record with canonicalized keys for petiole tests
 */
export function canonicalizePetioleParameters(
  parameters: Record<string, number>
): Record<string, number> {
  return canonicalizeParameters(parameters)
}

/**
 * Applies generic canonicalization to a record of parameters (fallback, test-type agnostic)
 * @param parameters Record of parameter names to values
 * @returns Record with canonicalized keys
 */
export function canonicalizeParameters(parameters: Record<string, number>): Record<string, number> {
  return Object.entries(parameters).reduce<Record<string, number>>((acc, [key, rawValue]) => {
    let value = rawValue
    if (typeof value === 'string') {
      const parsed = parseFloat(value)
      value = Number.isFinite(parsed) ? parsed : NaN
    }
    if (typeof value !== 'number' || !Number.isFinite(value)) return acc

    const canonicalKey = canonicalizeParameterKey(key)
    if (canonicalKey) {
      acc[canonicalKey] = value
    } else {
      // Keep original key if no canonical mapping exists
      const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (normalized) {
        acc[normalized] = value
      }
    }
    return acc
  }, {})
}
