import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Use service role to bypass RLS (for new user becoming client)
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, organizationId } = await request.json()

    // Validate required fields
    if (!userId || !organizationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if already a client
    const { data: existing } = await supabaseAdmin
      .from('organization_clients')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('client_user_id', userId)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already a client' }, { status: 409 })
    }

    // Add user as org client
    const { error: clientError } = await supabaseAdmin.from('organization_clients').insert({
      organization_id: organizationId,
      client_user_id: userId
    })

    if (clientError) {
      console.error('Error adding client:', clientError)
      return NextResponse.json({ error: 'Failed to add as client' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Added as client successfully'
    })
  } catch (error) {
    console.error('Error in add-client API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
