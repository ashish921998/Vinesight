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
      return this.toParsedResult(parsed)
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
Return numeric values for pH, EC (electrical conductivity), organic carbon, nitrogen, phosphorus, potassium, calcium, magnesium, sulfur, iron, manganese, zinc, copper, boron, molybdenum, sodium, chloride, calcium carbonate, carbonate, bicarbonate, and any other nutrients you can find (include micronutrients if present).
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
Return numeric values for macronutrients and micronutrients (nitrogen, phosphorus, potassium, calcium, magnesium, sulfur, iron, manganese, zinc, copper, boron, etc.) when available.
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

  private static toParsedResult(payload: StructuredReportPayload): ParsedReportResult {
    return {
      parameters: this.normalizeParameters(payload.parameters || []),
      summary: payload.summary,
      rawNotes: payload.rawNotes,
      confidence: payload.confidence,
      testDate: payload.testDate
    }
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
