import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

let cachedAdminClient: SupabaseClient<Database> | null = null

export function getServiceRoleSupabaseClient() {
  if (cachedAdminClient) {
    return cachedAdminClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return null
  }

  cachedAdminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false
    }
  })

  return cachedAdminClient
}
