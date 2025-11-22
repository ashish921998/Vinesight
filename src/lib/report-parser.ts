import OpenAI, { toFile } from 'openai'
import type { Response as OpenAIResponse } from 'openai/resources/responses/responses.js'
import { canonicalizeParameterKey } from './parameter-canonicalization'

export interface ParsedReportResult {
  parameters: Record<string, number>
  summary?: string | null
  rawNotes?: string | null
  confidence?: number | null
  testDate?: string | null
}

interface StructuredParameterEntry {
  name: string
  value: number
}

interface StructuredReportPayload {
  parameters: StructuredParameterEntry[]
  summary: string | null
  rawNotes: string | null
  confidence: number | null
  testDate: string | null
}

type TestType = 'soil' | 'petiole'

const DEFAULT_MODEL = 'gpt-4o-mini'

/**
 * Expected ranges for soil test parameters.
 * Used to detect and correct likely unit conversion errors.
 */
const SOIL_PARAMETER_RANGES: Record<string, { min: number; max: number; unit: string }> = {
  ph: { min: 3.5, max: 10.5, unit: '' },
  ec: { min: 0.01, max: 10.0, unit: 'dS/m' },
  organicCarbon: { min: 0.05, max: 15.0, unit: '%' },
  organicMatter: { min: 0.1, max: 20.0, unit: '%' },
  nitrogen: { min: 1, max: 1000, unit: 'ppm' },
  phosphorus: { min: 0.5, max: 500, unit: 'ppm' },
  potassium: { min: 5, max: 2000, unit: 'ppm' },
  calcium: { min: 50, max: 30000, unit: 'ppm' },
  magnesium: { min: 10, max: 10000, unit: 'ppm' },
  sulfur: { min: 1, max: 500, unit: 'ppm' },
  calciumCarbonate: { min: 0.1, max: 50, unit: '%' },
  iron: { min: 0.1, max: 200, unit: 'ppm' },
  manganese: { min: 0.1, max: 200, unit: 'ppm' },
  zinc: { min: 0.05, max: 50, unit: 'ppm' },
  copper: { min: 0.05, max: 50, unit: 'ppm' },
  boron: { min: 0.05, max: 20, unit: 'ppm' },
  molybdenum: { min: 0.01, max: 10, unit: 'ppm' },
  sodium: { min: 1, max: 5000, unit: 'ppm' },
  chloride: { min: 1, max: 5000, unit: 'ppm' }
}

/**
 * Expected ranges for petiole test parameters.
 * Used to detect and correct likely unit conversion errors.
 */
const PETIOLE_PARAMETER_RANGES: Record<string, { min: number; max: number; unit: string }> = {
  // Major Nutrients (%)
  total_nitrogen: { min: 0.3, max: 6.0, unit: '%' },
  nitrate_nitrogen: { min: 50, max: 10000, unit: 'ppm' },
  ammonical_nitrogen: { min: 50, max: 10000, unit: 'ppm' },
  phosphorus: { min: 0.05, max: 2.0, unit: '%' },
  potassium: { min: 0.3, max: 6.0, unit: '%' },
  // Secondary Nutrients (%)
  calcium: { min: 0.2, max: 6.0, unit: '%' },
  magnesium: { min: 0.05, max: 3.0, unit: '%' },
  sulfur: { min: 0.02, max: 2.0, unit: '%' },
  // Micro Nutrients (ppm / mg/kg)
  iron: { min: 10, max: 500, unit: 'ppm' },
  manganese: { min: 5, max: 500, unit: 'ppm' },
  zinc: { min: 5, max: 300, unit: 'ppm' },
  copper: { min: 1, max: 100, unit: 'ppm' },
  boron: { min: 5, max: 200, unit: 'ppm' },
  molybdenum: { min: 0.01, max: 50, unit: 'ppm' },
  // Other (%)
  sodium: { min: 0.005, max: 3.0, unit: '%' },
  chloride: { min: 0.01, max: 3.0, unit: '%' }
}

export class ReportParser {
  private static getClient() {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured')
    }
    return new OpenAI({ apiKey })
  }

  static async parseTestReport(file: File, testType: TestType): Promise<ParsedReportResult> {
    const client = this.getClient()
    const schema = this.buildSchema()
    const uploadedFile = await this.uploadFileForParsing(client, file)

    try {
      const response = await client.responses.create({
        model: DEFAULT_MODEL,
        temperature: 0,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: 'You are an agronomy assistant extracting numerical nutrient data from laboratory soil and petiole test reports.'
              }
            ]
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `${this.getPrompt(testType)}\n\nAnalyze the attached report file without guessing values.`
              },
              {
                type: 'input_file',
                file_id: uploadedFile.id
              }
            ]
          }
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'test_report_extraction',
            schema,
            strict: true
          }
        }
      })

      const parsed = this.extractStructuredPayload(response)
      return this.toParsedResult(parsed, testType)
    } finally {
      void this.safeDeleteUploadedFile(client, uploadedFile.id)
    }
  }

  static determineReportType(mimeType: string) {
    return mimeType?.startsWith('image/') ? 'image' : 'pdf'
  }

  private static getPrompt(testType: TestType) {
    if (testType === 'soil') {
      return `Extract all nutrient and soil health parameters from the attached soil test report.

IMPORTANT: Return the EXACT numeric values as they appear in the report. Do NOT convert units or normalize values.
- For values in % (percent), return the number as-is (e.g., 0.45% → 0.45)
- For values in ppm or mg/kg, return the number as-is (e.g., 250 ppm → 250, NOT 0.025)
- For pH values, return as-is (e.g., 7.2)
- For EC values in dS/m or mS/cm, return as-is
- Never divide or multiply values to convert between units

Extract these parameters when available:
- Basic: ph, ec (electrical conductivity)
- Organic: organic_carbon (%), organic_matter (%)
- Macronutrients: nitrogen (ppm), phosphorus (ppm), potassium (ppm)
- Secondary: calcium (ppm), magnesium (ppm), sulfur (ppm), calcium_carbonate (%)
- Micronutrients: iron (ppm), manganese (ppm), zinc (ppm), copper (ppm), boron (ppm), molybdenum (ppm)
- Other: sodium, chloride, carbonate, bicarbonate

Also extract the test date or analysis date if present in the report (return in YYYY-MM-DD format).
Also return a short summary of key findings, any recommendations or notes, and a confidence score between 0 and 1 describing how certain you are about the extracted numbers.

Respond strictly as JSON with the shape:
{
  "parameters": [
    { "name": "parameter_name", "value": number }
  ],
  "summary": string | null,
  "rawNotes": string | null,
  "confidence": number | null,
  "testDate": string | null
}`
    }

    return `Extract nutrient values from the attached petiole analysis report.

IMPORTANT: Return the EXACT numeric values as they appear in the report. Do NOT convert units or normalize values.
- For values in % (percent), return the number as-is (e.g., 1.36% → 1.36)
- For values in mg/kg or ppm, return the number as-is (e.g., 350 mg/kg → 350, NOT 0.35)
- Never divide or multiply values to convert between units

Extract these parameters when available:
- Macronutrients: total_nitrogen (%), nitrate_nitrogen (mg/kg or ppm), ammonical_nitrogen (mg/kg or ppm), phosphorus (%), potassium (%)
- Secondary nutrients: calcium (%), magnesium (%), sulfur (%)
- Micronutrients: iron (mg/kg), manganese (mg/kg), zinc (mg/kg), copper (mg/kg), boron (mg/kg), molybdenum (mg/kg)
- Other: sodium (%), chloride (%)

Also extract the test date or analysis date if present in the report (return in YYYY-MM-DD format).
Include a short summary of the analysis, any notes, and a confidence score between 0 and 1 representing extraction certainty.

Respond strictly as JSON with the shape:
{
  "parameters": [
    { "name": "parameter_name", "value": number }
  ],
  "summary": string | null,
  "rawNotes": string | null,
  "confidence": number | null,
  "testDate": string | null
}`
  }

  private static toParsedResult(
    payload: StructuredReportPayload,
    testType: TestType
  ): ParsedReportResult {
    const normalizedParams = this.normalizeParameters(payload.parameters || [])
    const validatedParams = this.validateAndCorrectParameters(normalizedParams, testType)

    return {
      parameters: validatedParams,
      summary: payload.summary,
      rawNotes: payload.rawNotes,
      confidence: payload.confidence,
      testDate: payload.testDate
    }
  }

  /**
   * Validates parsed parameters against expected ranges and attempts to correct
   * likely unit conversion errors (e.g., ppm parsed as % or vice versa).
   */
  private static validateAndCorrectParameters(
    parameters: Record<string, number>,
    testType: TestType
  ): Record<string, number> {
    const ranges = testType === 'soil' ? SOIL_PARAMETER_RANGES : PETIOLE_PARAMETER_RANGES
    const corrected: Record<string, number> = {}

    for (const [key, value] of Object.entries(parameters)) {
      const range = ranges[key]

      if (!range) {
        // No range defined, keep as-is
        corrected[key] = value
        continue
      }

      // Check if value is within expected range
      if (value >= range.min && value <= range.max) {
        corrected[key] = value
        continue
      }

      // Attempt to detect and correct unit conversion errors
      const correctedValue = this.attemptUnitCorrection(value, range)
      corrected[key] = correctedValue
    }

    return corrected
  }

  /**
   * Attempts to correct likely unit conversion errors.
   * Common errors:
   * - ppm values divided by 1000 (350 → 0.35)
   * - % values multiplied by 100 (1.36 → 136)
   */
  private static attemptUnitCorrection(
    value: number,
    range: { min: number; max: number; unit: string }
  ): number {
    const { min, max, unit } = range

    // If already in range, return as-is
    if (value >= min && value <= max) {
      return value
    }

    // For ppm/mg/kg parameters that might have been incorrectly divided by 1000
    // e.g., 350 mg/kg parsed as 0.35
    if (unit === 'ppm' && value < min && value > 0) {
      const multiplied = value * 1000
      if (multiplied >= min && multiplied <= max) {
        return multiplied
      }
    }

    // For % parameters that might have been incorrectly multiplied by 100
    // e.g., 1.36% parsed as 136
    if (unit === '%' && value > max) {
      const divided = value / 100
      if (divided >= min && divided <= max) {
        return divided
      }
    }

    // For % parameters that might have been parsed from ppm without conversion
    // e.g., percentage shown as whole number (136 instead of 1.36)
    if (unit === '%' && value > max && value < 1000) {
      const divided = value / 100
      if (divided >= min && divided <= max) {
        return divided
      }
    }

    // Return original value if no correction applies
    return value
  }

  private static normalizeParameters(parameters: StructuredParameterEntry[]) {
    if (!Array.isArray(parameters)) {
      return {}
    }

    const normalized: Record<string, number> = {}

    parameters.forEach(({ name, value }) => {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        return
      }

      const cleanedKey = name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')

      if (!cleanedKey) return

      const candidateKeys = new Set<string>([cleanedKey])

      const withoutAsSuffix = cleanedKey.replace(/_as_.*/, '')
      if (withoutAsSuffix && withoutAsSuffix !== cleanedKey) {
        candidateKeys.add(withoutAsSuffix)
      }

      const strippedMetricSuffix = withoutAsSuffix.replace(
        /_(ppm|percent|value|level|amount)$/i,
        ''
      )
      if (strippedMetricSuffix && strippedMetricSuffix !== withoutAsSuffix) {
        candidateKeys.add(strippedMetricSuffix)
      }

      // Process candidates in reverse order (most-general first) to avoid overwriting specific values
      const candidateArray = Array.from(candidateKeys).reverse()

      for (const key of candidateArray) {
        if (!key) continue
        const canonicalKey = this.canonicalParameterKey(key)
        const targetKey = canonicalKey || key

        if (normalized[targetKey] === undefined) {
          normalized[targetKey] = value
        }

        // If we found a canonical match, stop processing further candidates for this input
        if (canonicalKey) {
          break
        }
      }
    })

    return normalized
  }

  private static canonicalParameterKey(key: string): string | null {
    return canonicalizeParameterKey(key)
  }

  private static buildSchema() {
    return {
      type: 'object',
      properties: {
        parameters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'number' }
            },
            required: ['name', 'value'],
            additionalProperties: false
          }
        },
        summary: {
          type: ['string', 'null']
        },
        rawNotes: {
          type: ['string', 'null']
        },
        confidence: {
          type: ['number', 'null'],
          minimum: 0,
          maximum: 1
        },
        testDate: {
          type: ['string', 'null']
        }
      },
      required: ['parameters', 'summary', 'rawNotes', 'confidence', 'testDate'],
      additionalProperties: false
    } as const
  }

  private static async uploadFileForParsing(client: OpenAI, file: File) {
    const normalized = file.name
      ? file
      : await toFile(file, `${Date.now()}-report`, {
          type: file.type || 'application/octet-stream'
        })

    return client.files.create({
      file: normalized,
      purpose: 'assistants'
    })
  }

  private static extractStructuredPayload(response: OpenAIResponse): StructuredReportPayload {
    const outputItems = Array.isArray(response.output) ? response.output : []

    for (const item of outputItems) {
      const content = (item as any)?.content
      if (!Array.isArray(content)) continue

      for (const part of content) {
        if (part?.type === 'output_json' && part.json) {
          return part.json as StructuredReportPayload
        }

        if (part?.type === 'output_text' && typeof part.text === 'string') {
          const trimmed = part.text.trim()
          if (trimmed) {
            try {
              return JSON.parse(trimmed) as StructuredReportPayload
            } catch (error) {
              throw new Error(
                `Failed to parse JSON from output_text: ${error instanceof Error ? error.message : 'Unknown error'}`
              )
            }
          }
        }
      }
    }

    const fallback = typeof response.output_text === 'string' ? response.output_text.trim() : ''
    if (fallback) {
      try {
        return JSON.parse(fallback) as StructuredReportPayload
      } catch (error) {
        throw new Error(
          `Failed to parse JSON from fallback output_text: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    throw new Error('Parser did not return any data')
  }

  private static safeDeleteUploadedFile(client: OpenAI, fileId: string) {
    return client.files.delete(fileId).catch(() => undefined)
  }
}
