import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth-utils'
import { getServiceRoleSupabaseClient } from '@/lib/supabase-admin-client'

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
    console.error('Supabase service role key and URL must be configured for soil profile update')
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
  const { id, farm_id, fusarium_pct, sections, profile_date, profileDate } =
    (body as Record<string, unknown>) || {}
  const rawProfileDate = (profile_date ?? profileDate) as unknown

  if (typeof id !== 'number' || typeof farm_id !== 'number' || !Array.isArray(sections)) {
    return new Response(
      JSON.stringify({
        error: 'id (number), farm_id (number) and sections (array) are required'
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  if (fusarium_pct !== undefined && fusarium_pct !== null && typeof fusarium_pct !== 'number') {
    return new Response(JSON.stringify({ error: 'fusarium_pct must be a number' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (typeof rawProfileDate !== 'string') {
    return new Response(JSON.stringify({ error: 'profile_date (string) is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const parsedProfileDate = new Date(rawProfileDate)
  if (Number.isNaN(parsedProfileDate.getTime())) {
    return new Response(JSON.stringify({ error: 'profile_date must be a valid date string' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const normalizedFusarium = typeof fusarium_pct === 'number' ? fusarium_pct : null
  const normalizedProfileDate = parsedProfileDate.toISOString()

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
      fusarium_pct: normalizedFusarium,
      sections,
      created_at: normalizedProfileDate
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
