import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/types/database'

// Use service role to bypass RLS (for new user org creation)
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// P0/P2: Validate input with proper schema
const CreateOrgSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1).max(100).trim(),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input with Zod
    const parseResult = CreateOrgSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input: ' + parseResult.error.message },
        { status: 400 }
      )
    }
    const { userId, name, slug } = parseResult.data

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

    // P1: Update user's profile with error handling and full rollback
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ user_type: 'org_member' })
      .eq('id', userId)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      // Rollback member and org creation
      await supabaseAdmin
        .from('organization_members')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', org.id)
      await supabaseAdmin.from('organizations').delete().eq('id', org.id)
      return NextResponse.json({ error: 'Failed to set up organization' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      organization: org
    })
  } catch (error) {
    console.error('Error in create-org API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
