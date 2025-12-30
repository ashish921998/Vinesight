import { useState, useEffect, useCallback } from 'react'
import { getTypedSupabaseClient } from '@/lib/supabase'

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
        console.error('Error fetching user preferences:', error)
        return
      }

      if (profile) {
        setPreferences({
          areaUnitPreference:
            (profile.area_unit_preference as 'hectares' | 'acres') ||
            defaultPreferences.areaUnitPreference,
          currencyPreference:
            (profile.currency_preference as 'INR' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD') ||
            defaultPreferences.currencyPreference,
          spacingUnitPreference:
            (profile.spacing_unit_preference as 'feet' | 'mm') ||
            defaultPreferences.spacingUnitPreference
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Error fetching user preferences:', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  return { preferences, loading, refreshPreferences: fetchPreferences }
}
