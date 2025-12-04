import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth-utils'
import { getServiceRoleSupabaseClient } from '@/lib/supabase-admin-client'

const SOIL_BUCKET = 'soil-profiling-photos'

export async function POST(request: NextRequest) {
  const serverSupabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: userError
  } = await serverSupabase.auth.getUser()

  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const adminClient = getServiceRoleSupabaseClient()
  if (!adminClient) {
    console.error('Supabase service role key and URL must be configured for soil profile delete')
    return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  const { id } = (body as Record<string, unknown>) || {}

  if (typeof id !== 'number') {
    return new Response(JSON.stringify({ error: 'Profile id (number) is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const { data: profile, error: profileError } = await serverSupabase
    .from('soil_profiles')
    .select('id, sections')
    .eq('id', id)
    .maybeSingle()

  if (profileError) {
    return new Response(JSON.stringify({ error: profileError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (!profile) {
    return new Response(JSON.stringify({ error: 'Profile not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const photoPaths =
    Array.isArray(profile.sections) && profile.sections.length > 0
      ? profile.sections
          .map((section: any) => section?.photo_path)
          .filter((path): path is string => typeof path === 'string' && path.length > 0)
      : []

  const { data: deletedRows, error: deleteError } = await serverSupabase
    .from('soil_profiles')
    .delete()
    .eq('id', id)
    .select('id')

  if (deleteError) {
    const status = deleteError.code === '42501' ? 403 : 500
    const errorMessage =
      deleteError.code === '42501' ? 'Access denied' : deleteError.message || 'Delete failed'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (!deletedRows || deletedRows.length === 0) {
    return new Response(JSON.stringify({ error: 'Profile not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (photoPaths.length > 0) {
    const { error: storageError } = await adminClient.storage.from(SOIL_BUCKET).remove(photoPaths)
    if (storageError) {
      console.error('Failed to remove soil profile photos', storageError)
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
