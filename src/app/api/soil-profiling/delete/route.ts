import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/auth-utils'
import type { Database } from '@/types/database'

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

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

  const body = await request.json()
  const { id } = body || {}

  if (!id) {
    return new Response(JSON.stringify({ error: 'Profile id is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // verify ownership
  const { data: profile, error: profileError } = await serverSupabase
    .from('soil_profiles')
    .select('id, farm_id')
    .eq('id', id)
    .maybeSingle()

  if (profileError || !profile) {
    return new Response(JSON.stringify({ error: 'Profile not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const { data: farm, error: farmError } = await serverSupabase
    .from('farms')
    .select('id')
    .eq('id', profile.farm_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (farmError || !farm) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const { error: deleteError } = await adminClient.from('soil_profiles').delete().eq('id', id)

  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
