import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const TEST_REPORT_BUCKET = 'test-reports'
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/tiff'
]
const ALLOWED_FILE_EXTENSIONS = ['pdf', 'jpeg', 'jpg', 'png', 'webp', 'heic', 'heif', 'tiff', 'tif']
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export interface ReportUploadResult {
  storagePath: string
  filename: string
  mimeType: string
  signedUrl: string
  publicUrl: string
}

type UploadFile = File | (Blob & { name?: string })

export class DocumentService {
  private static bucketEnsured = false

  private static getServiceClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url) {
      throw new Error('Supabase URL is not configured')
    }

    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server-side storage operations')
    }

    return createClient<Database>(url, serviceRoleKey, {
      auth: {
        persistSession: false
      }
    })
  }

  private static async ensureBucket() {
    if (this.bucketEnsured) {
      return
    }

    const supabase = this.getServiceClient()
    const { data, error } = await supabase.storage.getBucket(TEST_REPORT_BUCKET)

    if (error) {
      const status =
        (error as any)?.status ?? (error as any)?.statusCode ?? (error as any)?.status_code
      const code = (error as any)?.code ?? (error as any)?.error
      const message = typeof error.message === 'string' ? error.message : ''

      const isNotFound =
        status === 404 ||
        status === '404' ||
        code === 'PGRST404' ||
        code === '404' ||
        message.toLowerCase().includes('not found')

      if (isNotFound) {
        const { error: createError } = await supabase.storage.createBucket(TEST_REPORT_BUCKET, {
          public: false,
          allowedMimeTypes: ALLOWED_MIME_TYPES,
          allowedFileExtensions: ALLOWED_FILE_EXTENSIONS,
          fileSizeLimit: `${MAX_FILE_SIZE_BYTES}`
        } as any)

        if (createError) {
          throw new Error(`Failed to create test reports bucket: ${createError.message}`)
        }
      } else {
        throw new Error(
          `Failed to verify test reports bucket: ${message || 'Unknown storage error'}`
        )
      }
    } else if (data) {
      const bucketInfo = data as {
        allowedMimeTypes?: string[] | null
        allowed_mime_types?: string[] | null
        allowedFileExtensions?: string[] | null
        allowed_file_extensions?: string[] | null
        fileSizeLimit?: string | number | null
        file_size_limit?: string | number | null
      }
      const existingMimeTypes = (bucketInfo.allowedMimeTypes ||
        bucketInfo.allowed_mime_types ||
        []) as string[] | null
      const normalizedExisting = new Set(
        (existingMimeTypes || []).map((type) => type.toLowerCase())
      )
      const missingMimeType = ALLOWED_MIME_TYPES.some(
        (type) => !normalizedExisting.has(type.toLowerCase())
      )

      const existingExtensions = (bucketInfo.allowedFileExtensions ||
        bucketInfo.allowed_file_extensions ||
        []) as string[] | null
      const normalizedExtensions = new Set(
        (existingExtensions || []).map((ext) => ext.replace(/^[.]/, '').toLowerCase())
      )
      const missingExtension = ALLOWED_FILE_EXTENSIONS.some(
        (ext) => !normalizedExtensions.has(ext.toLowerCase())
      )

      const existingFileSizeLimit = bucketInfo.fileSizeLimit || bucketInfo.file_size_limit
      const needsFileLimitUpdate = existingFileSizeLimit
        ? `${existingFileSizeLimit}` !== `${MAX_FILE_SIZE_BYTES}`
        : true

      if (missingMimeType || missingExtension || needsFileLimitUpdate) {
        const { error: updateError } = await supabase.storage.updateBucket(TEST_REPORT_BUCKET, {
          public: false,
          allowedMimeTypes: ALLOWED_MIME_TYPES,
          allowedFileExtensions: ALLOWED_FILE_EXTENSIONS,
          fileSizeLimit: `${MAX_FILE_SIZE_BYTES}`
        } as any)

        if (updateError) {
          throw new Error(`Failed to update test reports bucket: ${updateError.message}`)
        }
      }
    }

    this.bucketEnsured = true
  }

  private static validateFile(file: UploadFile) {
    if (!file) {
      throw new Error('No file provided for upload')
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error('Report file is too large. Maximum allowed size is 10 MB.')
    }

    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error('Unsupported file type. Please upload a PDF or image report.')
    }
  }

  private static sanitizeFileName(fileName: string) {
    return fileName
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  private static inferMimeType(file: UploadFile, fallbackExtension: string) {
    if (file.type) return file.type

    if (fallbackExtension === 'pdf') return 'application/pdf'
    if (['jpg', 'jpeg'].includes(fallbackExtension)) return 'image/jpeg'
    if (fallbackExtension === 'png') return 'image/png'
    if (fallbackExtension === 'webp') return 'image/webp'
    if (['heic', 'heif'].includes(fallbackExtension)) return 'image/heic'
    if (fallbackExtension === 'tif' || fallbackExtension === 'tiff') return 'image/tiff'

    return 'application/octet-stream'
  }

  static async uploadTestReport(
    file: UploadFile,
    options: {
      farmId: number
      testType: 'soil' | 'petiole'
      existingPath?: string | null
    }
  ): Promise<ReportUploadResult> {
    this.validateFile(file)
    await this.ensureBucket()

    const supabase = this.getServiceClient()
    const originalName = file.name || `${options.testType}-report`
    const extension = originalName.split('.').pop()?.toLowerCase() || 'pdf'
    const sanitizedName = `${Date.now()}-${this.sanitizeFileName(originalName)}`
    const storagePath = `${options.testType}/${options.farmId}/${sanitizedName}`
    const contentType = this.inferMimeType(file, extension)

    const { error } = await supabase.storage.from(TEST_REPORT_BUCKET).upload(storagePath, file, {
      contentType,
      upsert: false
    })

    if (error) {
      throw new Error(`Failed to upload test report: ${error.message}`)
    }

    if (options.existingPath) {
      await this.deleteReport(options.existingPath).catch(() => undefined)
    }

    const signedUrl = await this.createSignedUrl(storagePath)
    const { data: publicUrlData } = supabase.storage
      .from(TEST_REPORT_BUCKET)
      .getPublicUrl(storagePath)

    return {
      storagePath,
      filename: sanitizedName,
      mimeType: contentType,
      signedUrl,
      publicUrl: publicUrlData.publicUrl
    }
  }

  static async createSignedUrl(path: string, expiresInSeconds = 60 * 60 * 24 * 7) {
    await this.ensureBucket()
    const supabase = this.getServiceClient()
    const { data, error } = await supabase.storage
      .from(TEST_REPORT_BUCKET)
      .createSignedUrl(path, expiresInSeconds)

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`)
    }

    return data.signedUrl
  }

  static async deleteReport(path: string) {
    await this.ensureBucket()
    const supabase = this.getServiceClient()
    const { error } = await supabase.storage.from(TEST_REPORT_BUCKET).remove([path])

    if (error) {
      throw new Error(`Failed to delete report: ${error.message}`)
    }
  }
}
