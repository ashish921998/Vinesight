'use server'

import { createServerSupabaseClient } from '@/lib/auth-utils'
import { DocumentService } from '@/lib/document-service'
import { ReportParser } from '@/lib/report-parser'
import { logger } from '@/lib/logger'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Generate a signed URL for accessing uploaded test reports
 */
export async function getSignedUploadUrl(
  path: string,
  expiresIn?: number
): Promise<
  | {
      success: true
      signedUrl: string
    }
  | {
      success: false
      error: string
    }
> {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate path format
    if (typeof path !== 'string' || path.trim().length === 0) {
      return { success: false, error: 'Storage path is required' }
    }

    // Normalize and validate path
    const normalizedPath = path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\//, '')

    // Prevent path traversal
    if (normalizedPath.includes('../') || normalizedPath.startsWith('/')) {
      return { success: false, error: 'Invalid path format' }
    }

    // Validate against allowed prefixes
    const allowedPrefixes = ['soil/', 'petiole/']
    if (!allowedPrefixes.some((prefix) => normalizedPath.startsWith(prefix))) {
      return { success: false, error: 'Path not in allowed directory' }
    }

    const segments = normalizedPath.split('/')
    if (segments.length < 3) {
      return { success: false, error: 'Invalid path format' }
    }

    const [testTypeSegment, farmIdSegment] = segments
    const allowedTestTypes = ['soil', 'petiole']
    if (!allowedTestTypes.includes(testTypeSegment)) {
      return { success: false, error: 'Invalid path format' }
    }

    const farmId = Number(farmIdSegment)
    if (!Number.isInteger(farmId) || farmId <= 0) {
      return { success: false, error: 'Invalid path format' }
    }

    if (!normalizedPath.startsWith(`${testTypeSegment}/${farmId}/`)) {
      return { success: false, error: 'Invalid path format' }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return { success: false, error: 'Storage service unavailable' }
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
      if (farmError.code === 'PGRST116') {
        return { success: false, error: 'Resource not found' }
      }
      throw farmError
    }

    if (!farm || farm.user_id !== user.id) {
      return { success: false, error: 'Forbidden' }
    }

    // Validate expiresIn
    if (expiresIn !== undefined && typeof expiresIn !== 'number') {
      return { success: false, error: 'expiresIn must be a number' }
    }

    if (typeof expiresIn === 'number' && (expiresIn < 60 || expiresIn > 604800)) {
      return {
        success: false,
        error: 'expiresIn must be between 60 seconds (1 minute) and 604800 seconds (7 days)'
      }
    }

    const signedUrl = await DocumentService.createSignedUrl(
      normalizedPath,
      typeof expiresIn === 'number' ? expiresIn : undefined
    )

    return { success: true, signedUrl }
  } catch (error) {
    console.error('Failed to generate signed URL:', error)
    return { success: false, error: 'Failed to generate signed URL' }
  }
}

/**
 * Upload and parse a test report (soil or petiole)
 */
export async function uploadTestReport(formData: FormData) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const file = formData.get('file')
    const testType = formData.get('testType') as 'soil' | 'petiole' | null
    const farmIdRaw = formData.get('farmId')
    const existingPathRaw = formData.get('existingPath')
    const existingPath =
      typeof existingPathRaw === 'string' && existingPathRaw.trim() ? existingPathRaw : null

    if (!(file instanceof File)) {
      return { success: false, error: 'Invalid or missing file upload' }
    }

    if (!testType || !['soil', 'petiole'].includes(testType)) {
      return { success: false, error: 'Invalid test type' }
    }

    const farmId = farmIdRaw ? Number(farmIdRaw) : NaN
    if (!Number.isInteger(farmId) || farmId <= 0) {
      return { success: false, error: 'Invalid farm identifier' }
    }

    // Verify farm ownership
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return { success: false, error: 'Storage service unavailable' }
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
        return { success: false, error: 'Resource not found' }
      }
      throw farmError
    }

    if (!farm || farm.user_id !== user.id) {
      return { success: false, error: 'Forbidden' }
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'File size exceeds 10MB limit' }
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Only PDF and image files are allowed'
      }
    }

    // Normalize and validate existingPath if provided
    let normalizedExistingPath: string | undefined
    if (existingPath) {
      const p = existingPath.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\//, '')
      if (p.includes('../') || !p.startsWith(`${testType}/${farmId}/`)) {
        return { success: false, error: 'Invalid existingPath' }
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

    try {
      const parsed = await ReportParser.parseTestReport(file, testType)
      extractionStatus = 'success'
      parsedParameters = parsed.parameters
      rawNotes = parsed.rawNotes
      summary = parsed.summary
      confidence = parsed.confidence
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

    return {
      success: true,
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
    }
  } catch (error) {
    // Log the full error server-side
    if (error instanceof Error) {
      logger.error('Unexpected error in uploadTestReport', {
        message: error.message,
        stack: error.stack
      })
    } else {
      logger.error('Unexpected non-Error in uploadTestReport', { error })
    }

    return { success: false, error: 'Internal server error' }
  }
}
