import { useState, useEffect, useCallback } from 'react'
import { getTypedSupabaseClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export interface UserPreferences {
  areaUnitPreference: 'hectares' | 'acres'
  currencyPreference: 'INR' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD'
  spacingUnitPreference: 'feet' | 'mm'
}

export const defaultPreferences: UserPreferences = {
  areaUnitPreference: 'hectares',
  currencyPreference: 'INR',
  spacingUnitPreference: 'feet'
}

const VALID_AREA_UNITS = ['hectares', 'acres'] as const
const VALID_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD'] as const
const VALID_SPACING_UNITS = ['feet', 'mm'] as const

function isValidAreaUnit(value: unknown): value is 'hectares' | 'acres' {
  return (
    typeof value === 'string' &&
    VALID_AREA_UNITS.includes(value as (typeof VALID_AREA_UNITS)[number])
  )
}

function isValidCurrency(value: unknown): value is 'INR' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD' {
  return (
    typeof value === 'string' &&
    VALID_CURRENCIES.includes(value as (typeof VALID_CURRENCIES)[number])
  )
}

function isValidSpacingUnit(value: unknown): value is 'feet' | 'mm' {
  return (
    typeof value === 'string' &&
    VALID_SPACING_UNITS.includes(value as (typeof VALID_SPACING_UNITS)[number])
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
        .select('area_unit_preference, currency_preference, spacing_unit_preference')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        logger.error('Error fetching user preferences:', error)
        return
      }

      if (profile) {
        setPreferences({
          areaUnitPreference: isValidAreaUnit(profile.area_unit_preference)
            ? profile.area_unit_preference
            : defaultPreferences.areaUnitPreference,
          currencyPreference: isValidCurrency(profile.currency_preference)
            ? profile.currency_preference
            : defaultPreferences.currencyPreference,
          spacingUnitPreference: isValidSpacingUnit(profile.spacing_unit_preference)
            ? profile.spacing_unit_preference
            : defaultPreferences.spacingUnitPreference
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
  }, [fetchPreferences])

  return { preferences, loading, refreshPreferences: fetchPreferences }
}
