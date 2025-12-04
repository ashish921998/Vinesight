import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/auth-utils'
import type { Database } from '@/types/database'

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SOIL_BUCKET = 'soil-profiling-photos'

if (!SERVICE_ROLE_KEY || !SUPABASE_URL) {
  throw new Error('Supabase service role key and URL must be configured')
}

const adminClient = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY)

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

  const formData = await request.formData()
  const file = formData.get('file')
  const farmId = formData.get('farmId')
  const section = formData.get('section')

  if (!(file instanceof File) || !farmId || !section) {
    return new Response(JSON.stringify({ error: 'Missing upload data' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024
  if (file.size > MAX_FILE_SIZE) {
    return new Response(JSON.stringify({ error: 'File too large (max 10MB)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (file.type && !allowedMimeTypes.includes(file.type)) {
    return new Response(JSON.stringify({ error: 'Invalid file type (images only)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const farmIdNum = Number(farmId)
  if (Number.isNaN(farmIdNum)) {
    return new Response(JSON.stringify({ error: 'Invalid farm ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const { data: farm, error: farmError } = await serverSupabase
    .from('farms')
    .select('id')
    .eq('id', farmIdNum)
    .eq('user_id', user.id)
    .maybeSingle()

  if (farmError || !farm) {
    return new Response(JSON.stringify({ error: 'Farm not found or access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp']
  const safeExt = allowedExtensions.includes(ext) ? ext : 'jpg'
  const timestamp = Date.now()
  const path = `soil-profiles/${farmIdNum}/${section}-${timestamp}.${safeExt}`

  const buffer = Buffer.from(await file.arrayBuffer())

  const { data, error } = await adminClient.storage.from(SOIL_BUCKET).upload(path, buffer, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type || 'application/octet-stream'
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const { data: signedUrlData, error: signedUrlError } = await adminClient.storage
    .from(SOIL_BUCKET)
    .createSignedUrl(data.path, 3600)

  if (signedUrlError || !signedUrlData?.signedUrl) {
    console.error('Failed to create signed URL for soil profile upload', signedUrlError)
    return new Response(JSON.stringify({ error: 'Failed to generate signed URL' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(
    JSON.stringify({
      path: data.path,
      signedUrl: signedUrlData.signedUrl
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
