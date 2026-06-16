import { useState, useEffect, useCallback, useContext } from 'react'
import { AuthContext } from '@/components/providers/AuthProvider'
import {
  fetchAndValidateCurrency,
  DEFAULT_CURRENCY,
  isValidCurrency,
  type CurrencyCode
} from '@/lib/currency-utils'

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

  // Self when: no arg supplied, or arg is the logged-in user's own id.
  // Undefined userId (data still loading) is treated as self so we don't
  // kick off a fetch before we know who owns the farm.
  const isSelf = !userId || userId === loggedInId

  // Fetch state for the "other user" path only
  const fetchUserId = isSelf ? undefined : userId
  const [fetchedPrefs, setFetchedPrefs] = useState<UserPreferences>(defaultPreferences)
  const [fetchLoading, setFetchLoading] = useState(!!fetchUserId)

  const doFetch = useCallback(async () => {
    if (!fetchUserId) {
      setFetchLoading(false)
      return
    }
    setFetchLoading(true)
    const currency = await fetchAndValidateCurrency(fetchUserId)
    setFetchedPrefs({ currencyPreference: currency })
    setFetchLoading(false)
  }, [fetchUserId])

  useEffect(() => {
    doFetch()
  }, [doFetch])

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
    refreshPreferences: doFetch
  }
}
