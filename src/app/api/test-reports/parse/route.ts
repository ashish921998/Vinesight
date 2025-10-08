import { NextRequest, NextResponse } from 'next/server'
import { DocumentService } from '@/lib/document-service'
import { ReportParser } from '@/lib/report-parser'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const testType = formData.get('testType') as 'soil' | 'petiole' | null
    const farmIdRaw = formData.get('farmId')
    const existingPath = formData.get('existingPath') as string | null

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Invalid or missing file upload' }, { status: 400 })
    }

    if (!testType || !['soil', 'petiole'].includes(testType)) {
      return NextResponse.json({ error: 'Invalid test type' }, { status: 400 })
    }

    const farmId = farmIdRaw ? Number(farmIdRaw) : NaN
    if (!Number.isFinite(farmId)) {
      return NextResponse.json({ error: 'Invalid farm identifier' }, { status: 400 })
    }

    // Validate file size (e.g., 10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and image files are allowed' },
        { status: 400 }
      )
    }

    const uploadResult = await DocumentService.uploadTestReport(file, {
      farmId,
      testType,
      existingPath: existingPath || undefined
    })

    let extractionStatus: 'success' | 'failed' = 'failed'
    let extractionError: string | undefined
    let parsedParameters: Record<string, number> | undefined
    let rawNotes: string | null | undefined
    let summary: string | null | undefined
    let confidence: number | null | undefined

    try {
      const parsed = await ReportParser.parseTestReport(file, testType)
      extractionStatus = 'success'
      parsedParameters = parsed.parameters
      rawNotes = parsed.rawNotes
      summary = parsed.summary
      confidence = parsed.confidence
    } catch (error) {
      extractionError = error instanceof Error ? error.message : 'Failed to parse report'
    }

    const reportType = uploadResult.mimeType?.startsWith('image/') ? 'image' : 'pdf'

    return NextResponse.json({
      report: {
        storagePath: uploadResult.storagePath,
        filename: uploadResult.filename,
        mimeType: uploadResult.mimeType,
        signedUrl: uploadResult.signedUrl,
        publicUrl: uploadResult.publicUrl,
        reportType
      },
      extraction: {
        status: extractionStatus,
        error: extractionError,
        parameters: parsedParameters,
        rawNotes,
        summary,
        confidence
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error while parsing report'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
