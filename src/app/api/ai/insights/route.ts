import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth-utils'
import { AIInsightsService } from '@/lib/ai-insights-service'

export async function POST(request: NextRequest) {
  try {
    // Use centralized server-side Supabase client
    const supabase = await createServerSupabaseClient()

    // Authenticate the user
    const {
      data: { user },
      error: sessionError
    } = await supabase.auth.getUser()

    if (sessionError || !user) {
      return new Response(
        JSON.stringify({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const { farmId, limit = 10 } = await request.json()

    if (!farmId) {
      return new Response(JSON.stringify({ error: 'Farm ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Verify farm ownership - ensure the authenticated user owns this farm
    const { data: farm, error: farmError } = await supabase
      .from('farms')
      .select('user_id')
      .eq('id', farmId)
      .eq('user_id', user.id)
      .single()

    if (farmError || !farm) {
      return new Response(
        JSON.stringify({
          error: 'Farm not found or access denied',
          code: 'FORBIDDEN'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Get AI insights using the authenticated user ID
    const insights = await AIInsightsService.getInsightsForFarm(parseInt(farmId), user.id, limit)

    return new Response(JSON.stringify({ insights }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    // Log error for debugging in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('AI Insights API error:', error)
    }

    return new Response(
      JSON.stringify({
        error: 'Failed to generate insights',
        insights: [] // Return empty array as fallback
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
