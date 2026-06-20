import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DocumentService } from '@/lib/document-service'
import { validateUserSession } from '@/lib/auth-utils'
import { checkFarmAccess } from '@/lib/farm-access'
import type { Database } from '@/types/database'

export const runtime = 'nodejs'

// Lists every uploaded report file for a farm (across both test types), each
// with a signed URL. Files are stored at `{soil|petiole}/{farmId}/…` but are
// often not linked back onto a test record, so this surfaces them directly.
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await validateUserSession(request)
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const farmIdParam = request.nextUrl.searchParams.get('farmId')
    const farmId = Number(farmIdParam)
    if (!Number.isInteger(farmId) || farmId <= 0) {
      return NextResponse.json({ error: 'Valid farmId is required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Storage service unavailable' }, { status: 503 })
    }

    const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    })

    // Reuse the same authorization rules as the signed-url route: farm owner,
    // org owner/admin with an active client link, or the assigned agronomist.
    const access = await checkFarmAccess(user.id, farmId, { supabaseAdmin })
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: access.status })
    }

    const files = await DocumentService.listTestReports(farmId)
    return NextResponse.json({ files })
  } catch (error) {
    console.error('Failed to list test reports:', error)
    return NextResponse.json({ error: 'Failed to list test reports' }, { status: 500 })
  }
}
