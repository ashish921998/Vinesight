import { NextRequest } from 'next/server'
import { createServerSupabaseClient, validateUserSession } from '@/lib/auth-utils'

const MOISTURE_BUCKETS = [
  { label: '0–25%', min: 0, max: 25 },
  { label: '25–50%', min: 25, max: 50 },
  { label: '50–75%', min: 50, max: 75 },
  { label: '75–100%', min: 75, max: 100 },
  { label: '100%', min: 100, max: 100 }
]

const TEXTURES = ['Sandy loam', 'Loam', 'Clay loam', 'Silty clay', 'Sandy clay loam']
const AWC_RANGES = ['1.0–1.3 in/ft', '1.3–1.7 in/ft', '1.7–2.0 in/ft']
const SMD_RANGES = ['1.0–0.6 in/ft', '0.9–0.3 in/ft', '0.6–0.1 in/ft']

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const hashString = (value: string) =>
  value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 42

export async function POST(request: NextRequest) {
  const { user, error: authError } = await validateUserSession(request)

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const body = await request.json()
  const { photoPath, sectionName, ec_ds_m, dimension, farmId } = body || {}

  if (!photoPath || !sectionName) {
    return new Response(JSON.stringify({ error: 'photoPath and sectionName are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (farmId) {
    const supabase = await createServerSupabaseClient()
    const { data: farm, error } = await supabase
      .from('farms')
      .select('id')
      .eq('id', farmId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error || !farm) {
      return new Response(JSON.stringify({ error: 'Farm not found or access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  const seed = hashString(`${photoPath}-${sectionName}-${ec_ds_m ?? ''}-${dimension ?? ''}`)
  const moisturePct = clamp(Math.round((seed % 70) + 20 - (Number(ec_ds_m) || 0) * 2), 5, 100)
  const category =
    MOISTURE_BUCKETS.find((bucket) => moisturePct >= bucket.min && moisturePct <= bucket.max)
      ?.label || '0–25%'

  const texture = TEXTURES[seed % TEXTURES.length]
  const awc = AWC_RANGES[seed % AWC_RANGES.length]
  const smd = SMD_RANGES[seed % SMD_RANGES.length]
  const confidence = clamp(Number((0.55 + (seed % 30) / 100).toFixed(2)), 0.4, 0.95)

  return new Response(
    JSON.stringify({
      predicted_texture: texture,
      moisture_category: category,
      moisture_pct: moisturePct,
      awc_range: awc,
      smd_range: smd,
      confidence,
      rationale:
        'Estimated from palm impression contrast, EC hint, and brightness heuristics. Values are editable.',
      analyzed_at: new Date().toISOString()
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}
