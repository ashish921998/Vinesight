import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/types/database'

// Lazy initialization to avoid build-time errors
function getSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set')
  }
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)
}

// P1: Validate role against allowed values
const JoinSchema = z.object({
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  role: z.enum(['admin', 'agronomist']).default('agronomist')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input with Zod
    const parseResult = JoinSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input: ' + parseResult.error.message },
        { status: 400 }
      )
    }
    const { userId, organizationId, role } = parseResult.data

    // P0: Verify user was just created (within 5 minutes) - for signup flow security
    const { data: profile } = await getSupabaseAdmin()
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

    // Check if already a member
    const { data: existing } = await getSupabaseAdmin()
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already a member' }, { status: 409 })
    }

    // Add user as org member
    const { error: memberError } = await getSupabaseAdmin().from('organization_members').insert({
      organization_id: organizationId,
      user_id: userId,
      role,
      is_owner: false
    })

    if (memberError) {
      console.error('Error adding member:', memberError)
      return NextResponse.json({ error: 'Failed to join organization' }, { status: 500 })
    }

    // P1: Update user's profile with error handling and rollback
    const { error: profileError } = await getSupabaseAdmin()
      .from('profiles')
      .update({ user_type: 'org_member' })
      .eq('id', userId)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      // Rollback member addition
      await getSupabaseAdmin()
        .from('organization_members')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Joined organization successfully'
    })
  } catch (error) {
    console.error('Error in join API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
