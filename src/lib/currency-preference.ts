import { getTypedSupabaseClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { DEFAULT_CURRENCY, isValidCurrency, type CurrencyCode } from '@/lib/currency-utils'

export async function fetchAndValidateCurrency(userId: string): Promise<CurrencyCode> {
  try {
    const supabase = getTypedSupabaseClient()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('currency_preference')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      logger.error('Error fetching currency preference:', error)
      return DEFAULT_CURRENCY
    }

    if (profile && isValidCurrency(profile.currency_preference)) {
      return profile.currency_preference
    }

    return DEFAULT_CURRENCY
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error('Error fetching currency preference:', msg)
    return DEFAULT_CURRENCY
  }
}
