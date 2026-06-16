import { useState, useEffect, useCallback, useRef, useContext } from 'react'
import { AuthContext } from '@/components/providers/AuthProvider'
import { DEFAULT_CURRENCY, isValidCurrency, type CurrencyCode } from '@/lib/currency-utils'
import { fetchAndValidateCurrency } from '@/lib/currency-preference'

export type { CurrencyCode }
export { isValidCurrency, DEFAULT_CURRENCY }

export interface UserPreferences {
  currencyPreference: CurrencyCode
}

export const defaultPreferences: UserPreferences = {
  currencyPreference: DEFAULT_CURRENCY
}

export function useUserPreferences(userId?: string) {
  const auth = useContext(AuthContext)
  const loggedInId = auth?.user?.id

  // Self when: no arg supplied, or arg equals the logged-in user's own id.
  // An undefined userId (data still loading) is treated as self to avoid
  // kicking off a fetch before we know the farm owner's identity.
  const isSelf = !userId || userId === loggedInId

  // fetchUserId is non-null only on the "other user" path (consultant viewing a grower's farm).
  const fetchUserId = isSelf ? undefined : userId

  const [fetchedPrefs, setFetchedPrefs] = useState<UserPreferences>(defaultPreferences)
  const [fetchLoading, setFetchLoading] = useState(false)
  const refreshCancelledRef = useRef(false)

  // Cancellable fetch — cleans up if fetchUserId changes or component unmounts mid-flight.
  useEffect(() => {
    if (!fetchUserId) {
      setFetchLoading(false)
      return
    }
    let cancelled = false
    setFetchLoading(true)
    fetchAndValidateCurrency(fetchUserId).then((currency) => {
      if (!cancelled) {
        setFetchedPrefs({ currencyPreference: currency })
        setFetchLoading(false)
      }
    })
    return () => {
      cancelled = true
      refreshCancelledRef.current = true
    }
  }, [fetchUserId])

  // Manual re-fetch for the "other user" path (e.g. after the grower updates their preference).
  const refreshFetchedPrefs = useCallback(async () => {
    if (!fetchUserId) return
    refreshCancelledRef.current = false
    setFetchLoading(true)
    try {
      const currency = await fetchAndValidateCurrency(fetchUserId)
      if (!refreshCancelledRef.current) {
        setFetchedPrefs({ currencyPreference: currency })
      }
    } finally {
      if (!refreshCancelledRef.current) {
        setFetchLoading(false)
      }
    }
  }, [fetchUserId])

  if (isSelf) {
    return {
      preferences: { currencyPreference: auth?.currencyPreference ?? DEFAULT_CURRENCY },
      loading: auth?.currencyLoading ?? false,
      refreshPreferences: auth?.refreshCurrency ?? (() => Promise.resolve())
    }
  }

  return {
    preferences: fetchedPrefs,
    loading: fetchLoading,
    refreshPreferences: refreshFetchedPrefs
  }
}
