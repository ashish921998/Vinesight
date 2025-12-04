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
  const { id, farm_id, fusarium_pct, sections } = body || {}

  if (!id || !farm_id || !sections) {
    return new Response(JSON.stringify({ error: 'id, farm_id and sections are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const { data: farm, error: farmError } = await serverSupabase
    .from('farms')
    .select('id')
    .eq('id', farm_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (farmError || !farm) {
    return new Response(JSON.stringify({ error: 'Farm not found or access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const { data: profileRow, error: updateError } = await adminClient
    .from('soil_profiles')
    .update({
      fusarium_pct: fusarium_pct ?? null,
      sections
    })
    .eq('id', id)
    .eq('farm_id', farm_id)
    .select('*')
    .single()

  if (updateError || !profileRow) {
    return new Response(
      JSON.stringify({ error: updateError?.message || 'Failed to update profile' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  return new Response(JSON.stringify(profileRow), {
    headers: { 'Content-Type': 'application/json' }
  })
}
