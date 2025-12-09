import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Validate service role key at startup
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not configured')
}

// Use service role to bypass RLS (since we need to list orgs for public selection)
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    // Verify user is authenticated
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // Server-side, we don't set cookies
          }
        }
      }
    )

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch organizations
    const { data: organizations, error } = await supabaseAdmin
      .from('organizations')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching organizations:', error)
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
    }

    return NextResponse.json(organizations)
  } catch (error) {
    console.error('Error in organizations list API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
