import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import type { Database } from '@/types/database'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { globalRateLimiter } from '@/lib/validation'

const LOGO_BUCKET = 'org-logos'
const MAX_LOGO_BYTES = 2 * 1024 * 1024 // 2 MB
// SVG is deliberately excluded: file.type is client-controlled and the object
// is served from a public bucket with that content-type, so an SVG would be
// returned as image/svg+xml and execute embedded <script> on direct URL access
// (stored XSS). Raster types can't execute. Re-add SVG only behind server-side
// sanitization.
const LOGO_EXT_BY_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp'
}

const NameSchema = z.object({ name: z.string().trim().min(1).max(120) })

type ResolvedManager =
  | { error: NextResponse }
  | { admin: ReturnType<typeof getSupabaseAdmin>; organizationId: string }

// Resolve the caller's session + their single-org membership and confirm they
// may manage org branding (owner/admin only). The org is derived server-side
// from the membership row — never trusted from the request body. Each handler
// branches on the `error` shape instead of repeating the auth/permission dance.
async function resolveManager(): Promise<ResolvedManager> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return { error: NextResponse.json({ error: 'Server configuration error' }, { status: 500 }) }
  }

  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll() {
        // Server-side, we don't set cookies.
      }
    }
  })

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const admin = getSupabaseAdmin()
  const { data: membership, error: membershipError } = await admin
    .from('organization_members')
    .select('organization_id, role, is_owner')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (membershipError) {
    console.error('Error resolving org membership:', membershipError)
    return { error: NextResponse.json({ error: 'Failed to verify permissions' }, { status: 500 }) }
  }

  const canManage =
    !!membership &&
    (membership.is_owner || membership.role === 'owner' || membership.role === 'admin')

  if (!membership || !canManage) {
    return {
      error: NextResponse.json(
        { error: 'Only an organization owner or admin can change branding' },
        { status: 403 }
      )
    }
  }

  return { admin, organizationId: membership.organization_id }
}

// Pre-auth rate limit (stricter unauthenticated tier, keyed by IP) so an
// unauthenticated flood can't hammer the DB/storage. Branding edits are
// low-frequency, so this tier is ample for legitimate admins.
function rateLimited(request: NextRequest, key: string): NextResponse | null {
  const clientIP =
    request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'
  const limit = globalRateLimiter.checkLimit(`${key}-${clientIP}`, false)
  if (limit.allowed) return null
  return NextResponse.json({ error: limit.reason || 'Too many requests' }, { status: 429 })
}

// PATCH — rename the organization. Reflected immediately in the workspace
// sidebar title (which used to read "Organization Workspace").
export async function PATCH(request: NextRequest) {
  try {
    const limited = rateLimited(request, 'org-update')
    if (limited) return limited

    const resolved = await resolveManager()
    if ('error' in resolved) return resolved.error
    const { admin, organizationId } = resolved

    const body = await request.json().catch(() => null)
    const parsed = NameSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Enter a valid organization name' }, { status: 400 })
    }

    const { error: updateError } = await admin
      .from('organizations')
      .update({ name: parsed.data.name })
      .eq('id', organizationId)
    if (updateError) {
      console.error('Error updating organization name:', updateError)
      return NextResponse.json({ error: 'Failed to update organization name' }, { status: 500 })
    }

    return NextResponse.json({ name: parsed.data.name })
  } catch (error) {
    console.error('Error in organization PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — upload/replace the organization logo (multipart form, field "file").
export async function POST(request: NextRequest) {
  try {
    const limited = rateLimited(request, 'org-logo')
    if (limited) return limited

    const resolved = await resolveManager()
    if ('error' in resolved) return resolved.error
    const { admin, organizationId } = resolved

    const formData = await request.formData().catch(() => null)
    const file = formData?.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    const ext = LOGO_EXT_BY_TYPE[file.type]
    if (!ext) {
      return NextResponse.json({ error: 'Logo must be a PNG, JPG, or WEBP image' }, { status: 400 })
    }
    if (file.size > MAX_LOGO_BYTES) {
      return NextResponse.json({ error: 'Logo must be 2 MB or smaller' }, { status: 400 })
    }

    // Timestamped path so replacing the logo yields a fresh URL (no CDN/cache
    // staleness) — old objects are swept below.
    const path = `${organizationId}/logo-${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await admin.storage.from(LOGO_BUCKET).upload(path, buffer, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: true
    })
    if (uploadError) {
      console.error('Error uploading logo:', uploadError)
      return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 })
    }

    const {
      data: { publicUrl }
    } = admin.storage.from(LOGO_BUCKET).getPublicUrl(path)

    const { error: updateError } = await admin
      .from('organizations')
      .update({ logo_url: publicUrl })
      .eq('id', organizationId)
    if (updateError) {
      console.error('Error saving logo URL:', updateError)
      return NextResponse.json({ error: 'Failed to save logo' }, { status: 500 })
    }

    // Best-effort cleanup: drop older logo objects so the folder doesn't grow
    // one file per replacement. Never fail the request on a cleanup error.
    const { data: existing } = await admin.storage.from(LOGO_BUCKET).list(organizationId)
    const stale = (existing ?? [])
      .map((object) => `${organizationId}/${object.name}`)
      .filter((objectPath) => objectPath !== path)
    if (stale.length > 0) {
      await admin.storage.from(LOGO_BUCKET).remove(stale)
    }

    return NextResponse.json({ logoUrl: publicUrl })
  } catch (error) {
    console.error('Error in organization logo POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE — remove the organization logo (reverts the sidebar to the glyph).
export async function DELETE(request: NextRequest) {
  try {
    const limited = rateLimited(request, 'org-logo')
    if (limited) return limited

    const resolved = await resolveManager()
    if ('error' in resolved) return resolved.error
    const { admin, organizationId } = resolved

    const { data: existing } = await admin.storage.from(LOGO_BUCKET).list(organizationId)
    const paths = (existing ?? []).map((object) => `${organizationId}/${object.name}`)
    if (paths.length > 0) {
      await admin.storage.from(LOGO_BUCKET).remove(paths)
    }

    const { error: updateError } = await admin
      .from('organizations')
      .update({ logo_url: null })
      .eq('id', organizationId)
    if (updateError) {
      console.error('Error clearing logo URL:', updateError)
      return NextResponse.json({ error: 'Failed to remove logo' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in organization logo DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
