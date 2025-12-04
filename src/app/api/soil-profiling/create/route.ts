import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth-utils'

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

  let body: unknown
  try {
    body = await request.json()
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  const { farm_id, fusarium_pct, sections, profile_date, profileDate } =
    (body as Record<string, unknown>) || {}
  const rawProfileDate = (profile_date ?? profileDate) as unknown

  if (typeof farm_id !== 'number' || !Array.isArray(sections) || sections.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Farm ID (number) and at least one section are required' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
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
    sections,
    created_at: parsedProfileDate.toISOString()
  }

  const { data: profileRow, error: profileError } = await serverSupabase
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
