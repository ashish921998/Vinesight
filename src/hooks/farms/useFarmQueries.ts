'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SupabaseService } from '@/lib/supabase-service'
import { FertilizerPlanService } from '@/lib/fertilizer-plan-service'
import { farmKeys } from '@/lib/farm-query-keys'
import type { Farm } from '@/types/types'

type FarmCreateInput = Omit<Farm, 'id' | 'createdAt' | 'updatedAt' | 'userId'>

export function useFarms() {
  return useQuery({
    queryKey: farmKeys.list(),
    queryFn: () => SupabaseService.getAllFarms()
  })
}

/**
 * Aggregate dashboard payload for the farm detail page (farm, recent activity,
 * counts, totals, pending tasks). Backed by `getDashboardSummary`; every journal
 * write invalidates `farmKeys.summary(farmId)` so this refetches wholesale.
 */
export function useDashboardSummary(farmId: number | null) {
  return useQuery({
    queryKey: farmId != null ? farmKeys.summary(farmId) : ['farms', 'summary', 'disabled'],
    queryFn: () => SupabaseService.getDashboardSummary(farmId as number),
    enabled: farmId != null && Number.isFinite(farmId)
  })
}

/** Agronomist fertilizer plans for a farm. Read-only on this surface. */
export function useFarmFertilizerPlans(farmId: number | null) {
  return useQuery({
    queryKey: farmId != null ? farmKeys.plans(farmId) : ['farms', 'plans', 'disabled'],
    queryFn: () => FertilizerPlanService.getPlansByFarm(farmId as number),
    enabled: farmId != null && Number.isFinite(farmId)
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
      // Farm edits (incl. the irrigation water-level bump) feed the dashboard
      // header/readiness, so refresh the summary too.
      queryClient.invalidateQueries({ queryKey: farmKeys.summary(id) })
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
