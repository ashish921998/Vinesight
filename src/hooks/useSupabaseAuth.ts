'use client'

import { useAuthContext } from '@/components/providers/AuthProvider'

export function useSupabaseAuth() {
  return useAuthContext()
}
