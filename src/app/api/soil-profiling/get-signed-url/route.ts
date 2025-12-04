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
    console.error('Supabase service role key and URL must be configured')
    return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const { photoPath, farmId } = await request.json()

  if (!photoPath || !farmId) {
    return new Response(JSON.stringify({ error: 'Missing photo path or farm ID' }), {
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

  // Verify user has access to this farm
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

  // Validate that photoPath belongs to this farm
  // Photos follow the convention: soil-profiles/{farmId}/{section}-{timestamp}.{ext}
  const expectedPrefix = `soil-profiles/${farmIdNum}/`
  if (!photoPath.startsWith(expectedPrefix)) {
    return new Response(JSON.stringify({ error: 'Photo path does not belong to this farm' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const { data: signedUrlData, error: signedUrlError } = await adminClient.storage
      .from(SOIL_BUCKET)
      .createSignedUrl(photoPath, 3600)

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Failed to create signed URL for soil profile photo', signedUrlError)
      return new Response(JSON.stringify({ error: 'Failed to generate signed URL' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(
      JSON.stringify({
        signedUrl: signedUrlData.signedUrl
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error generating signed URL:', error)
    return new Response(JSON.stringify({ error: 'Failed to generate signed URL' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
