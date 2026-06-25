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

interface SupabaseStorageError {
  status?: number | string
  statusCode?: number | string
  status_code?: number | string
  code?: string
  error?: string
  message: string
}
export interface ReportUploadResult {
  storagePath: string
  filename: string
  mimeType: string
  signedUrl: string
  publicUrl: string
}

export interface TestReportFile {
  path: string
  filename: string
  testType: 'soil' | 'petiole'
  mimeType: string | null
  sizeBytes: number | null
  uploadedAt: string | null
  signedUrl: string | null
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
    const { error } = await supabase.storage.getBucket(TEST_REPORT_BUCKET)

    if (error) {
      const storageError = error as unknown as SupabaseStorageError
      const status = storageError.status ?? storageError.statusCode ?? storageError.status_code
      const code = storageError.code ?? storageError.error
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

    const fileName = file.name || ''
    const extension = fileName.split('.').pop()?.toLowerCase() || ''

    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error('Unsupported file type. Please upload a PDF or image report.')
    }

    if (
      (!file.type || file.type.trim() === '') &&
      extension &&
      !ALLOWED_FILE_EXTENSIONS.includes(extension)
    ) {
      throw new Error('Unsupported file extension. Please upload a PDF or image report.')
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
    if (fallbackExtension === 'heic') return 'image/heic'
    if (fallbackExtension === 'heif') return 'image/heif'
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

  /**
   * List every uploaded report file for a farm, across both test types, with a
   * signed URL for each. Files live under `{soil|petiole}/{farmId}/…`. Used to
   * surface report PDFs that exist in storage but were never linked back onto a
   * test record (report_storage_path is null on the row).
   */
  static async listTestReports(
    farmId: number,
    expiresInSeconds = 60 * 60 * 24
  ): Promise<TestReportFile[]> {
    await this.ensureBucket()
    const supabase = this.getServiceClient()
    const testTypes: ('soil' | 'petiole')[] = ['soil', 'petiole']

    const PAGE_SIZE = 100
    const files: Omit<TestReportFile, 'signedUrl'>[] = []
    for (const testType of testTypes) {
      const prefix = `${testType}/${farmId}`
      // A farm can accumulate many reports per test type over time, and the
      // storage API caps each response at `limit`. Page through with `offset`
      // until a short page comes back so older reports aren't silently dropped.
      let offset = 0
      for (;;) {
        const { data, error } = await supabase.storage.from(TEST_REPORT_BUCKET).list(prefix, {
          limit: PAGE_SIZE,
          offset,
          sortBy: { column: 'created_at', order: 'desc' }
        })

        if (error) {
          throw new Error(`Failed to list ${testType} reports: ${error.message}`)
        }

        const page = data ?? []
        for (const obj of page) {
          // `list` can return folder placeholders with a null id — skip them.
          if (!obj.id) continue
          const metadata = (obj.metadata ?? {}) as { size?: number; mimetype?: string }
          files.push({
            path: `${prefix}/${obj.name}`,
            filename: obj.name,
            testType,
            mimeType: metadata.mimetype ?? null,
            sizeBytes: typeof metadata.size === 'number' ? metadata.size : null,
            uploadedAt: obj.created_at ?? null
          })
        }

        if (page.length < PAGE_SIZE) break
        offset += PAGE_SIZE
      }
    }

    if (files.length === 0) return []

    // Newest upload first, interleaving both test types.
    files.sort((a, b) => {
      const ta = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0
      const tb = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0
      return tb - ta
    })

    const { data: signed, error: signError } = await supabase.storage
      .from(TEST_REPORT_BUCKET)
      .createSignedUrls(
        files.map((f) => f.path),
        expiresInSeconds
      )

    if (signError) {
      throw new Error(`Failed to sign report URLs: ${signError.message}`)
    }

    const urlByPath = new Map<string, string>()
    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) urlByPath.set(item.path, item.signedUrl)
    }

    return files.map((f) => ({ ...f, signedUrl: urlByPath.get(f.path) ?? null }))
  }
}
