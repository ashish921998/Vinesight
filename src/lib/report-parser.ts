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
        model: 'gpt-4o-mini',
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

CRITICAL INSTRUCTIONS:
1. This document contains a TABLE with multiple columns
2. The table has columns: Sr. No., Parameter, Unit, Actual Result, Limit, Status
3. You MUST read values from the "Actual Result" column - NOT from "Limit" column
4. The "Limit" column contains reference ranges (e.g., "6.5 - 7.5", "75 - 150") - DO NOT use these values
5. The "Actual Result" column contains single numbers - these are the values you need
6. DO NOT guess or fabricate values - only extract what you can clearly read

EXAMPLE FROM THIS REPORT FORMAT:
- Row: "pH" | "-" | "8.11" | "6.5 - 7.5" | "High" → Extract ph = 8.11 (from Actual Result, NOT 6.5-7.5)
- Row: "Organic Carbon" | "%" | "1.47" | "1.01 - 3.0" | "Optimal" → Extract organic_carbon = 1.47
- Row: "Nitrogen as N" | "ppm" | "156" | "75 - 150" | "High" → Extract nitrogen = 156
- Row: "Phosphorus as P" | "ppm" | "42" | "10 - 20" | "High" → Extract phosphorus = 42
- Row: "Calcium as Ca" | "ppm" | "7754" | "1000 - 4500" | "High" → Extract calcium = 7754

VALUE RULES:
- Return EXACT numbers from "Actual Result" column
- For % values: 1.47% → 1.47
- For ppm values: 156 ppm → 156, 7754 ppm → 7754
- NEVER use values from Limit column
- If "Actual Result" shows "Nil" or "-", skip that parameter

Parameters to extract from "Actual Result" column:
- ph, ec (electrical conductivity)
- organic_carbon (%), organic_matter (%)
- nitrogen, phosphorus, potassium (all in ppm)
- calcium, magnesium, sulfur (all in ppm)
- calcium_carbonate (%)
- iron, manganese, zinc, copper, boron, molybdenum (all in ppm)
- sodium, chloride, carbonate, bicarbonate (all in ppm)

Also find "Analysis Date" field in the header section (format: DD-Mon-YYYY like "09-Apr-2024") and convert to YYYY-MM-DD.

Respond strictly as JSON:
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

CRITICAL INSTRUCTIONS:
1. This document contains a TABLE with multiple columns
2. The table typically has columns: Sr. No., Parameter, Unit, Actual Result, Limit/Range, Status
3. You MUST read values from the "Actual Result" column - NOT from "Limit" or "Range" column
4. The "Limit" column contains reference ranges (e.g., "0.8 - 1.2", "1000 - 2000") - DO NOT use these values
5. The "Actual Result" column contains single numbers - these are the values you need
6. DO NOT guess or fabricate values - only extract what you can clearly read

VALUE RULES:
- Return EXACT numbers from "Actual Result" column
- For % values: 1.36% → 1.36
- For mg/kg or ppm values: 350 mg/kg → 350, 1500 ppm → 1500
- NEVER use values from Limit/Range column
- If "Actual Result" shows "Nil", "-", or "BDL", skip that parameter

Parameters to extract from "Actual Result" column:
- total_nitrogen (%), nitrate_nitrogen (mg/kg or ppm), ammonical_nitrogen (mg/kg or ppm)
- phosphorus (%), potassium (%)
- calcium (%), magnesium (%), sulfur (%)
- iron (mg/kg), manganese (mg/kg), zinc (mg/kg), copper (mg/kg), boron (mg/kg), molybdenum (mg/kg)
- sodium (%), chloride (%)

Also find "Analysis Date" field in the header section and convert to YYYY-MM-DD format.

Respond strictly as JSON:
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
   * Returns parameters as-is without modification.
   *
   * Previously this method attempted to "correct" unit conversion errors by
   * multiplying/dividing values outside expected ranges. This was removed
   * because it violates the requirement to return exact lab numbers:
   * - Legitimate low readings (e.g., sodium <1 ppm) were incorrectly multiplied
   * - Legitimate high readings (e.g., peaty soils >20% organic matter) were
   *   incorrectly divided
   *
   * The AI prompt handles unit normalization during extraction; post-processing
   * should not alter values.
   */
  private static validateAndCorrectParameters(
    parameters: Record<string, number>,
    _testType: TestType
  ): Record<string, number> {
    // Return exact values from the lab report without modification
    return { ...parameters }
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
