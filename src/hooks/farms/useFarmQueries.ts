'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SupabaseService } from '@/lib/supabase-service'
import { farmKeys } from '@/lib/farm-query-keys'
import type { Farm } from '@/types/types'

type FarmCreateInput = Omit<Farm, 'id' | 'created_at' | 'updated_at' | 'user_id'>

export function useFarms() {
  return useQuery({
    queryKey: farmKeys.list(),
    queryFn: () => SupabaseService.getAllFarms()
  })
}

export function useFarm(farmId: number | null) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: farmId != null ? farmKeys.detail(farmId) : ['farms', 'detail', 'disabled'],
    queryFn: () => SupabaseService.getFarmById(farmId as number),
    enabled: farmId != null,
    // Seed the detail from the farms-list cache so a warm list needs no extra
    // fetch, while a cold deep-link (no list cached) still resolves via queryFn.
    initialData: () => {
      if (farmId == null) return undefined
      const farms = queryClient.getQueryData<Farm[]>(farmKeys.list())
      return farms?.find((farm) => farm.id === farmId)
    },
    initialDataUpdatedAt: () => queryClient.getQueryState(farmKeys.list())?.dataUpdatedAt
  })
}

export function useCreateFarm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (farm: FarmCreateInput) => SupabaseService.createFarm(farm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: farmKeys.list() })
    }
  })
}

export function useUpdateFarm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Farm> }) =>
      SupabaseService.updateFarm(id, updates),
    onSuccess: (_farm, { id }) => {
      queryClient.invalidateQueries({ queryKey: farmKeys.list() })
      queryClient.invalidateQueries({ queryKey: farmKeys.detail(id) })
    }
  })
}

export function useDeleteFarm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => SupabaseService.deleteFarm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: farmKeys.list() })
    }
  })
}
