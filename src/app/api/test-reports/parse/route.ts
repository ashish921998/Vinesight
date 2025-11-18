import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { validateUserSession } from '@/lib/auth-utils'
import { DocumentService } from '@/lib/document-service'
import { ReportParser } from '@/lib/report-parser'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await validateUserSession(request)
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const testType = formData.get('testType') as 'soil' | 'petiole' | null
    const farmIdRaw = formData.get('farmId')
    const existingPathRaw = formData.get('existingPath')
    const existingPath =
      typeof existingPathRaw === 'string' && existingPathRaw.trim() ? existingPathRaw : null

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Invalid or missing file upload' }, { status: 400 })
    }

    if (!testType || !['soil', 'petiole'].includes(testType)) {
      return NextResponse.json({ error: 'Invalid test type' }, { status: 400 })
    }

    const farmId = farmIdRaw ? Number(farmIdRaw) : NaN
    if (!Number.isInteger(farmId) || farmId <= 0) {
      return NextResponse.json({ error: 'Invalid farm identifier' }, { status: 400 })
    }

    // Verify farm ownership
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Storage service unavailable' }, { status: 503 })
    }
    const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    })
    const { data: farm, error: farmError } = await supabaseAdmin
      .from('farms')
      .select('id, user_id')
      .eq('id', farmId)
      .single()
    if (farmError) {
      if ((farmError as any).code === 'PGRST116') {
        return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
      }
      throw farmError
    }
    if (!farm || farm.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

    // Normalize and validate existingPath if provided
    let normalizedExistingPath: string | undefined
    if (existingPath) {
      const p = existingPath.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\//, '')
      if (p.includes('../') || !p.startsWith(`${testType}/${farmId}/`)) {
        return NextResponse.json({ error: 'Invalid existingPath' }, { status: 400 })
      }
      normalizedExistingPath = p
    }

    const uploadResult = await DocumentService.uploadTestReport(file, {
      farmId,
      testType,
      existingPath: normalizedExistingPath
    })

    let extractionStatus: 'success' | 'failed' = 'failed'
    let extractionError: string | undefined
    let parsedParameters: Record<string, number> | undefined
    let rawNotes: string | null | undefined
    let summary: string | null | undefined
    let confidence: number | null | undefined
    let testDate: string | null | undefined

    try {
      const parsed = await ReportParser.parseTestReport(file, testType)
      extractionStatus = 'success'
      parsedParameters = parsed.parameters
      rawNotes = parsed.rawNotes
      summary = parsed.summary
      confidence = parsed.confidence
      testDate = parsed.testDate
    } catch (error) {
      // Log the full error server-side
      if (error instanceof Error) {
        logger.error('Failed to parse test report', {
          message: error.message,
          stack: error.stack,
          testType,
          farmId,
          fileName: file.name
        })
      } else {
        logger.error('Failed to parse test report with non-Error object', {
          error,
          testType,
          farmId,
          fileName: file.name
        })
      }

      extractionError = 'Failed to parse report'
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
        confidence,
        testDate
      }
    })
  } catch (error) {
    // Log the full error server-side
    if (error instanceof Error) {
      logger.error('Unexpected error in test-reports parse API', {
        message: error.message,
        stack: error.stack
      })
    } else {
      logger.error('Unexpected non-Error in test-reports parse API', { error })
    }

    // Return generic error message to client
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
