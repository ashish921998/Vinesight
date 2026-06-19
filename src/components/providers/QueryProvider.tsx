'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase'

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false
          }
        }
      })
  )
  const currentUserIdRef = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      currentUserIdRef.current = data.user?.id ?? null
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user?.id ?? null
      const previousUserId = currentUserIdRef.current

      if (previousUserId !== undefined && previousUserId !== nextUserId) {
        client.clear()
      }

      currentUserIdRef.current = nextUserId
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [client])

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
