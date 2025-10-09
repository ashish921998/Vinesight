export type TestReportType = 'image' | 'pdf'

export interface ReportAttachmentMeta {
  storagePath: string
  signedUrl: string
  filename: string
  mimeType: string
  reportType: TestReportType
  extractionStatus: 'pending' | 'success' | 'failed'
  extractionError?: string
  parsedParameters?: Record<string, number>
  rawNotes?: string | null
  summary?: string | null
  confidence?: number | null
}
