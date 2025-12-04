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
  const { farm_id, fusarium_pct, sections } = body || {}

  if (!farm_id || !Array.isArray(sections) || sections.length === 0) {
    return new Response(JSON.stringify({ error: 'Farm ID and sections are required' }), {
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

  const profilePayload = {
    farm_id,
    fusarium_pct: fusarium_pct ?? null,
    sections: sections || []
  }

  const { data: profileRow, error: profileError } = await adminClient
    .from('soil_profiles')
    .insert(profilePayload)
    .select('*')
    .single()

  if (profileError || !profileRow) {
    return new Response(
      JSON.stringify({ error: profileError?.message || 'Failed to create profile' }),
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
