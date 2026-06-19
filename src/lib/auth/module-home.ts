import { createClient } from '@/lib/supabase'
import { FARMER_HOME, ORG_HOME } from '@/lib/auth/homes'

/**
 * Resolve the signed-in user's app home using the same membership source as
 * middleware and consultant route gating.
 */
export async function resolveModuleHome(userId: string): Promise<string> {
  try {
    const supabase = createClient()
    const { data: membership, error } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('resolveModuleHome: failed to check organization_members', error)
      return FARMER_HOME
    }

    return membership ? ORG_HOME : FARMER_HOME
  } catch (err) {
    console.error('resolveModuleHome: unexpected error checking organization_members', err)
    return FARMER_HOME
  }
}
