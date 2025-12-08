import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Use service role to bypass RLS (for new user joining org)
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, organizationId, role = 'agronomist' } = await request.json()

    // Validate required fields
    if (!userId || !organizationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if already a member
    const { data: existing } = await supabaseAdmin
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already a member' }, { status: 409 })
    }

    // Add user as org member
    const { error: memberError } = await supabaseAdmin.from('organization_members').insert({
      organization_id: organizationId,
      user_id: userId,
      role,
      is_owner: false
    })

    if (memberError) {
      console.error('Error adding member:', memberError)
      return NextResponse.json({ error: 'Failed to join organization' }, { status: 500 })
    }

    // Update user's profile to set user_type = 'org_member'
    await supabaseAdmin.from('profiles').update({ user_type: 'org_member' }).eq('id', userId)

    return NextResponse.json({
      success: true,
      message: 'Joined organization successfully'
    })
  } catch (error) {
    console.error('Error in join API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
