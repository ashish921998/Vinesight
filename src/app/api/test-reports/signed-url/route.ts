import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DocumentService } from '@/lib/document-service'
import { validateUserSession } from '@/lib/auth-utils'
import type { Database } from '@/types/database'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await validateUserSession(request)
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await request.json()
    const rawPath = payload?.path
    const expiresIn = payload?.expiresIn

    if (typeof rawPath !== 'string' || rawPath.trim().length === 0) {
      return NextResponse.json({ error: 'Storage path is required' }, { status: 400 })
    }

    // Normalize and validate path
    const normalizedPath = rawPath.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\//, '')

    // Prevent path traversal
    if (normalizedPath.includes('../') || normalizedPath.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid path format' }, { status: 400 })
    }

    // Optionally: Validate against allowed prefixes
    const allowedPrefixes = ['soil/', 'petiole/', 'documents/']
    if (!allowedPrefixes.some((prefix) => normalizedPath.startsWith(prefix))) {
      return NextResponse.json({ error: 'Path not in allowed directory' }, { status: 400 })
    }

    const segments = normalizedPath.split('/')
    if (segments.length < 3) {
      return NextResponse.json({ error: 'Invalid path format' }, { status: 400 })
    }

    const [testTypeSegment, farmIdSegment] = segments
    const allowedTestTypes = ['soil', 'petiole']
    if (!allowedTestTypes.includes(testTypeSegment)) {
      return NextResponse.json({ error: 'Invalid path format' }, { status: 400 })
    }

    const farmId = Number(farmIdSegment)
    if (!Number.isInteger(farmId) || farmId <= 0) {
      return NextResponse.json({ error: 'Invalid path format' }, { status: 400 })
    }

    if (!normalizedPath.startsWith(`${testTypeSegment}/${farmId}/`)) {
      return NextResponse.json({ error: 'Invalid path format' }, { status: 400 })
    }

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
      if (farmError.code === 'PGRST116' || farmError.code === '404') {
        return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
      }
      throw farmError
    }

    if (!farm || farm.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate expiresIn range (e.g., between 1 minute and 7 days)
    if (typeof expiresIn === 'number' && (expiresIn < 60 || expiresIn > 604800)) {
      return NextResponse.json(
        { error: 'expiresIn must be between 60 seconds (1 minute) and 604800 seconds (7 days)' },
        { status: 400 }
      )
    }

    const signedUrl = await DocumentService.createSignedUrl(
      normalizedPath,
      typeof expiresIn === 'number' ? expiresIn : undefined
    )

    return NextResponse.json({ signedUrl })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 })
  }
}
