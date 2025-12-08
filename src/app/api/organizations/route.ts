import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Use service role to bypass RLS (for new user org creation)
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, name, slug } = await request.json()

    // Validate required fields
    if (!userId || !name || !slug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if slug already exists
    const { data: existing } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'This organization URL is already taken' }, { status: 409 })
    }

    // Create the organization using admin client (bypasses RLS)
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name,
        slug,
        created_by: userId,
        is_active: true
      })
      .select()
      .single()

    if (orgError) {
      console.error('Error creating organization:', orgError)
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }

    // Add user as org owner
    const { error: memberError } = await supabaseAdmin.from('organization_members').insert({
      organization_id: org.id,
      user_id: userId,
      role: 'admin',
      is_owner: true
    })

    if (memberError) {
      console.error('Error adding member:', memberError)
      // Rollback org creation
      await supabaseAdmin.from('organizations').delete().eq('id', org.id)
      return NextResponse.json({ error: 'Failed to set up organization' }, { status: 500 })
    }

    // Update user's profile to set user_type = 'org_member'
    await supabaseAdmin.from('profiles').update({ user_type: 'org_member' }).eq('id', userId)

    return NextResponse.json({
      success: true,
      organization: org
    })
  } catch (error) {
    console.error('Error in create-org API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
