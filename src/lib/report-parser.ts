import OpenAI from 'openai'

export interface ParsedReportResult {
  parameters: Record<string, number>
  summary?: string | null
  rawNotes?: string | null
  confidence?: number | null
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
}

type TestType = 'soil' | 'petiole'

const DEFAULT_MODEL = process.env.OPENAI_REPORT_PARSER_MODEL || 'gpt-4o-mini'

export class ReportParser {
  private static getClient() {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_VISION
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured')
    }

    return new OpenAI({ apiKey })
  }

  static async parseTestReport(file: File, testType: TestType): Promise<ParsedReportResult> {
    const client = this.getClient()
    const schema = this.buildSchema()

    const uploaded = await client.files.create({
      file,
      purpose: 'assistants'
    })

    try {
      const response = await client.responses.create({
        model: DEFAULT_MODEL,
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
                text: this.getPrompt(testType)
              },
              {
                type: 'input_file',
                file_id: uploaded.id
              }
            ]
          }
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'test_report_extraction',
            schema
          }
        }
      })

      const cleanOutput = response.output_text?.replace(/```(?:json)?/g, '').trim()
      if (!cleanOutput) {
        throw new Error('Parser did not return any data')
      }

      const parsed = JSON.parse(cleanOutput) as StructuredReportPayload
      return this.toParsedResult(parsed)
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid file format')) {
        throw new Error(error.message)
      }
      throw error
    } finally {
      await client.files.delete(uploaded.id).catch(() => undefined)
    }
  }

  static determineReportType(mimeType: string) {
    return mimeType?.startsWith('image/') ? 'image' : 'pdf'
  }

  private static getPrompt(testType: TestType) {
    if (testType === 'soil') {
      return `Extract all nutrient and soil health parameters from the attached soil test report.
Return numeric values for pH, nitrogen, phosphorus, potassium, and any other nutrients you can find (include micronutrients if present).
Also return a short summary of key findings, any recommendations or notes, and a confidence score between 0 and 1 describing how certain you are about the extracted numbers.

Respond strictly as JSON with the shape:
{
  "parameters": [
    { "name": "parameter_name", "value": number }
  ],
  "summary": string | null,
  "rawNotes": string | null,
  "confidence": number | null
}`
    }

    return `Extract nutrient values from the attached petiole analysis report.
Return numeric values for macronutrients and micronutrients (nitrogen, phosphorus, potassium, calcium, magnesium, sulfur, iron, manganese, zinc, copper, boron, etc.) when available.
Include a short summary of the analysis, any notes, and a confidence score between 0 and 1 representing extraction certainty.

Respond strictly as JSON with the shape:
{
  "parameters": [
    { "name": "parameter_name", "value": number }
  ],
  "summary": string | null,
  "rawNotes": string | null,
  "confidence": number | null
}`
  }

  private static toParsedResult(payload: StructuredReportPayload): ParsedReportResult {
    return {
      parameters: this.normalizeParameters(payload.parameters || []),
      summary: payload.summary,
      rawNotes: payload.rawNotes,
      confidence: payload.confidence
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

      candidateKeys.forEach((key) => {
        if (!key) return
        if (normalized[key] === undefined) {
          normalized[key] = value
        }
      })
    })

    return normalized
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
        }
      },
      required: ['parameters', 'summary', 'rawNotes', 'confidence'],
      additionalProperties: false
    } as const
  }
}
