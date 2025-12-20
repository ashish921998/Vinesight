import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type AppMode = 'vineyard' | 'winery'

interface AppModeContextValue {
  mode: AppMode
  setMode: (mode: AppMode) => void
}

const STORAGE_KEY = 'vinesight-app-mode'

const AppModeContext = createContext<AppModeContextValue | undefined>(undefined)

export function AppModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppMode>('vineyard')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(STORAGE_KEY) as AppMode | null
    if (stored === 'vineyard' || stored === 'winery') {
      setModeState(stored)
      document.documentElement.dataset.appMode = stored
    } else {
      document.documentElement.dataset.appMode = 'vineyard'
    }
  }, [])

  const setMode = (value: AppMode) => {
    setModeState(value)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, value)
      document.documentElement.dataset.appMode = value
    }
  }

  const value = useMemo(() => ({ mode, setMode }), [mode])

  return <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>
}

export function useAppMode() {
  const ctx = useContext(AppModeContext)
  if (!ctx) {
    throw new Error('useAppMode must be used within AppModeProvider')
  }
  return ctx
}
