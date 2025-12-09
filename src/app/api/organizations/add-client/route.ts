import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/types/database'

// Use service role to bypass RLS (for new user becoming client)
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// P0: Validate input schema
const AddClientSchema = z.object({
  userId: z.string().uuid(),
  organizationId: z.string().uuid()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input with Zod
    const parseResult = AddClientSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input: ' + parseResult.error.message },
        { status: 400 }
      )
    }
    const { userId, organizationId } = parseResult.data

    // P0: Verify user was just created (within 5 minutes) - for signup flow security
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('created_at')
      .eq('id', userId)
      .single()

    if (!profile || !profile.created_at) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const createdAt = new Date(profile.created_at)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    if (createdAt < fiveMinutesAgo) {
      return NextResponse.json({ error: 'Unauthorized - user session expired' }, { status: 401 })
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
