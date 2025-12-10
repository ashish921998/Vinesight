import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Creates a Supabase client with service role key for admin operations.
 * This bypasses RLS policies and should only be used in server-side code.
 *
 * @throws Error if SUPABASE_SERVICE_ROLE_KEY is not configured
 */
export function getSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not configured')
  }
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)
}
