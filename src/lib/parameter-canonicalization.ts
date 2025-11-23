/**
 * Shared parameter canonicalization logic for test reports
 * Used by both the report parser and the UI to ensure consistent parameter mapping
 */

/**
 * Mapping from normalized parameter names to canonical keys.
 * Keys are lowercase alphanumeric only (no spaces, underscores, or special characters).
 * Values are the canonical keys used throughout the application.
 */
const PARAMETER_MAPPINGS: Record<string, string> = {
  // ========== SOIL TEST PARAMETERS ==========

  // pH
  ph: 'ph',
  soilph: 'ph',
  phvalue: 'ph',

  // EC (Electrical Conductivity)
  ec: 'ec',
  soilec: 'ec',
  electricalconductivity: 'ec',
  conductivity: 'ec',
  ecdsm: 'ec',

  // Organic Carbon
  oc: 'organicCarbon',
  organiccarbon: 'organicCarbon',
  orgcarbon: 'organicCarbon',
  organiccarbonasc: 'organicCarbon',
  carbon: 'organicCarbon',
  orgc: 'organicCarbon',

  // Organic Matter
  om: 'organicMatter',
  organicmatter: 'organicMatter',
  orgmatter: 'organicMatter',

  // Generic Nitrogen (for soil tests)
  nitrogen: 'nitrogen',
  n: 'nitrogen',
  availablenitrogen: 'nitrogen',
  nitrogenasn: 'nitrogen',

  // ========== PETIOLE TEST PARAMETERS ==========

  // Total Nitrogen
  totalnitrogen: 'total_nitrogen',
  totalnitrogenasn: 'total_nitrogen',
  tn: 'total_nitrogen',
  totaln: 'total_nitrogen',

  // Nitrate Nitrogen
  nitratenitrogen: 'nitrate_nitrogen',
  nitratenitrogenasno3n: 'nitrate_nitrogen',
  no3n: 'nitrate_nitrogen',
  no3: 'nitrate_nitrogen',
  nitrate: 'nitrate_nitrogen',
  nitraten: 'nitrate_nitrogen',

  // Ammonical/Ammonium Nitrogen (handle multiple spellings)
  ammonicalnitrogen: 'ammonical_nitrogen',
  ammoniacalnitrogen: 'ammonical_nitrogen',
  ammoniumnitrogen: 'ammonical_nitrogen',
  ammonicalnitrogenasnh4n: 'ammonical_nitrogen',
  ammoniacalnitrogenasnh4n: 'ammonical_nitrogen',
  ammoniumnitrogenasnh4n: 'ammonical_nitrogen',
  nh4n: 'ammonical_nitrogen',
  nh4: 'ammonical_nitrogen',
  ammonium: 'ammonical_nitrogen',
  ammonical: 'ammonical_nitrogen',
  ammoniacal: 'ammonical_nitrogen',

  // ========== SHARED PARAMETERS (SOIL & PETIOLE) ==========

  // Phosphorus
  phosphorus: 'phosphorus',
  phosphorous: 'phosphorus',
  p: 'phosphorus',
  totalphosphorus: 'phosphorus',
  totalphosphorusasp: 'phosphorus',
  phosphorusasp: 'phosphorus',
  availablephosphorus: 'phosphorus',
  phosphorusp: 'phosphorus',

  // Potassium
  potassium: 'potassium',
  k: 'potassium',
  totalpotassium: 'potassium',
  totalpotassiumask: 'potassium',
  potassiumask: 'potassium',
  availablepotassium: 'potassium',
  potassiumk: 'potassium',

  // Calcium
  calcium: 'calcium',
  ca: 'calcium',
  totalcalcium: 'calcium',
  totalcalciumasca: 'calcium',
  calciumasca: 'calcium',
  availablecalcium: 'calcium',
  calciumca: 'calcium',
  exchangeablecalcium: 'calcium',

  // Calcium Carbonate (soil specific)
  calciumcarbonate: 'calciumCarbonate',
  caco3: 'calciumCarbonate',
  lime: 'calciumCarbonate',

  // Magnesium
  magnesium: 'magnesium',
  mg: 'magnesium',
  totalmagnesium: 'magnesium',
  totalmagnesiumasmg: 'magnesium',
  magnesiumasmg: 'magnesium',
  availablemagnesium: 'magnesium',
  magnesiummg: 'magnesium',
  exchangeablemagnesium: 'magnesium',

  // Sulfur (handle British 'sulphur' and American 'sulfur')
  sulfur: 'sulfur',
  sulphur: 'sulfur',
  s: 'sulfur',
  totalsulfur: 'sulfur',
  totalsulphur: 'sulfur',
  totalsulfurass: 'sulfur',
  totalsulphurass: 'sulfur',
  sulfurass: 'sulfur',
  sulphurass: 'sulfur',
  availablesulfur: 'sulfur',
  availablesulphur: 'sulfur',

  // Iron
  iron: 'iron',
  fe: 'iron',
  ferrous: 'iron',
  totaliron: 'iron',
  totalironasfe: 'iron',
  ironasfe: 'iron',
  availableiron: 'iron',
  ironfe: 'iron',

  // Manganese
  manganese: 'manganese',
  mn: 'manganese',
  totalmanganese: 'manganese',
  totalmanganeseasmn: 'manganese',
  manganeseasmn: 'manganese',
  availablemanganese: 'manganese',
  manganesemn: 'manganese',

  // Zinc
  zinc: 'zinc',
  zn: 'zinc',
  totalzinc: 'zinc',
  totalzincaszn: 'zinc',
  zincaszn: 'zinc',
  availablezinc: 'zinc',
  zinczn: 'zinc',

  // Copper
  copper: 'copper',
  cu: 'copper',
  totalcopper: 'copper',
  totalcopperascu: 'copper',
  copperascu: 'copper',
  availablecopper: 'copper',
  coppercu: 'copper',

  // Boron
  boron: 'boron',
  b: 'boron',
  totalboron: 'boron',
  totalboronasb: 'boron',
  boronasb: 'boron',
  availableboron: 'boron',
  boronb: 'boron',

  // Molybdenum
  molybdenum: 'molybdenum',
  mo: 'molybdenum',
  totalmolybdenum: 'molybdenum',
  totalmolybdenumasmo: 'molybdenum',
  molybdenumasmo: 'molybdenum',
  availablemolybdenum: 'molybdenum',
  molybdenummo: 'molybdenum',

  // Sodium
  sodium: 'sodium',
  na: 'sodium',
  totalsodium: 'sodium',
  totalsodiumasna: 'sodium',
  sodiumasna: 'sodium',
  exchangeablesodium: 'sodium',
  sodiumna: 'sodium',

  // Chloride
  chloride: 'chloride',
  cl: 'chloride',
  chlorides: 'chloride',
  chloridescl: 'chloride',
  chlorideasscl: 'chloride',

  // Carbonate (soil specific)
  carbonate: 'carbonate',
  co3: 'carbonate',
  carbonates: 'carbonate',

  // Bicarbonate (soil specific)
  bicarbonate: 'bicarbonate',
  hco3: 'bicarbonate',
  bicarbonates: 'bicarbonate'
}

/**
 * Canonicalizes a parameter key to a standard form (generic, test-type agnostic)
 * @param key The parameter key to canonicalize (case-insensitive)
 * @returns The canonical key or null if no mapping exists
 */
export function canonicalizeParameterKey(key: string): string | null {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '')
  return PARAMETER_MAPPINGS[normalized] ?? null
}

/**
 * Applies generic canonicalization to a record of parameters (fallback, test-type agnostic)
 * @param parameters Record of parameter names to values (accepts strings for parsing flexibility)
 * @returns Record with canonicalized keys and numeric values
 */
export function canonicalizeParameters(
  parameters: Record<string, number | string | null | undefined>
): Record<string, number> {
  return Object.entries(parameters).reduce<Record<string, number>>((acc, [key, rawValue]) => {
    let value: number
    if (typeof rawValue === 'string') {
      const parsed = parseFloat(rawValue)
      value = Number.isFinite(parsed) ? parsed : NaN
    } else if (typeof rawValue === 'number') {
      value = rawValue
    } else {
      // null or undefined
      return acc
    }

    if (!Number.isFinite(value)) return acc

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
