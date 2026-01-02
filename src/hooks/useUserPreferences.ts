import { useState, useEffect, useCallback } from 'react'
import { getTypedSupabaseClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export interface UserPreferences {
  currencyPreference: 'INR' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD'
}

export const defaultPreferences: UserPreferences = {
  currencyPreference: 'INR'
}

const VALID_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD'] as const

function isValidCurrency(value: unknown): value is 'INR' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD' {
  return (
    typeof value === 'string' &&
    VALID_CURRENCIES.includes(value as (typeof VALID_CURRENCIES)[number])
  )
}

export function useUserPreferences(userId?: string) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [loading, setLoading] = useState(!!userId)

  const fetchPreferences = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const supabase = getTypedSupabaseClient()
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('currency_preference')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        logger.error('Error fetching user preferences:', error)
        setLoading(false)
        return
      }

      if (profile) {
        setPreferences({
          currencyPreference: isValidCurrency(profile.currency_preference)
            ? profile.currency_preference
            : defaultPreferences.currencyPreference
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Error fetching user preferences:', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences, userId])

  return { preferences, loading, refreshPreferences: fetchPreferences }
}
