'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SupabaseService } from '@/lib/supabase-service'
import { FertilizerPlanService } from '@/lib/fertilizer-plan-service'
import { farmKeys, type LogFilters } from '@/lib/farm-query-keys'
import { SoilProfileService } from '@/lib/soil-profile-service'
import { searchLogs } from '@/actions/search-logs'
import type { Farm } from '@/types/types'
import type { LabTestRecord } from '@/types/lab-tests'
import type { SoilSection } from '@/lib/supabase'

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
  const hasFarm = farmId != null && Number.isFinite(farmId)
  return useQuery({
    queryKey: hasFarm ? farmKeys.summary(farmId as number) : ['farms', 'summary', 'disabled'],
    queryFn: () => {
      // Fail fast: refetch() bypasses `enabled` in React Query v5, so guard explicitly
      // rather than casting a possible null/NaN to number. farms/[id]/page.tsx passes
      // NaN (not null) for invalid IDs, so both checks are required.
      if (farmId == null || !Number.isFinite(farmId)) throw new Error('farmId is required')
      return SupabaseService.getDashboardSummary(farmId)
    },
    enabled: hasFarm
  })
}

/**
 * Paginated, filtered farm activity log list (farms/[id]/logs). The active
 * `filters` are part of the query key, so changing search / type / date / page
 * swaps to a distinct cache entry rather than imperatively re-fetching. Journal
 * writes invalidate the filterless `farmKeys.logs(farmId)` prefix, which covers
 * every filter variant. While paginating/filtering within the *same* farm we
 * keep the current page visible so the list doesn't flash to skeletons on every
 * keystroke/page. We deliberately do NOT keep the previous farm's rows when the
 * farm changes — those rows expose edit/delete actions keyed to the newly
 * selected farm, so showing stale cross-farm data is a correctness hazard.
 */
export function useLogs(farmId: number | null, filters: LogFilters) {
  const hasFarm = farmId != null && Number.isFinite(farmId)
  return useQuery({
    queryKey: hasFarm ? farmKeys.logs(farmId as number, filters) : ['farms', 'logs', 'disabled'],
    queryFn: () =>
      searchLogs({
        farmId: farmId as number,
        searchQuery: filters.searchQuery,
        selectedActivityTypes: filters.selectedActivityTypes,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        currentPage: filters.page,
        itemsPerPage: filters.itemsPerPage
      }),
    enabled: hasFarm,
    placeholderData: (previousData, previousQuery) => {
      // Only reuse the prior result when it belongs to the same farm; the farmId
      // lives at index 1 of the `['farms', farmId, 'logs', filters]` key.
      const previousFarmId = previousQuery?.queryKey?.[1]
      return previousFarmId === farmId ? previousData : undefined
    }
  })
}

/** Agronomist fertilizer plans for a farm. Read-only on this surface. */
export function useFarmFertilizerPlans(farmId: number | null) {
  const hasFarm = farmId != null && Number.isFinite(farmId)
  return useQuery({
    queryKey: hasFarm ? farmKeys.plans(farmId as number) : ['farms', 'plans', 'disabled'],
    queryFn: () => {
      // Same NaN-not-null caller contract as useDashboardSummary above.
      if (farmId == null || !Number.isFinite(farmId)) throw new Error('farmId is required')
      return FertilizerPlanService.getPlansByFarm(farmId)
    },
    enabled: hasFarm
  })
}

export function useFarm(farmId: number | null) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: farmId != null ? farmKeys.detail(farmId) : ['farms', 'detail', 'disabled'],
    queryFn: () => {
      if (farmId == null) throw new Error('farmId is required')
      return SupabaseService.getFarmById(farmId)
    },
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

export function useFarmTasks(farmId: number | null) {
  return useQuery({
    queryKey: farmId != null ? farmKeys.tasks(farmId) : ['farms', 'tasks', 'disabled'],
    queryFn: () => {
      if (farmId == null) throw new Error('farmId is required')
      return SupabaseService.getTaskReminders(farmId)
    },
    enabled: farmId != null
  })
}

export function useCompleteFarmTask(farmId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: number) => SupabaseService.completeTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: farmKeys.tasks(farmId) })
      queryClient.invalidateQueries({ queryKey: farmKeys.summary(farmId) })
    }
  })
}

export function useReopenFarmTask(farmId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: number) => SupabaseService.reopenTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: farmKeys.tasks(farmId) })
      queryClient.invalidateQueries({ queryKey: farmKeys.summary(farmId) })
    }
  })
}

export function useDeleteFarmTask(farmId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: number) => SupabaseService.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: farmKeys.tasks(farmId) })
      queryClient.invalidateQueries({ queryKey: farmKeys.summary(farmId) })
    }
  })
}

export function useFarmLabTests(farmId: number | null) {
  return useQuery({
    queryKey: farmId != null ? farmKeys.labTests(farmId) : ['farms', 'lab-tests', 'disabled'],
    queryFn: async () => {
      if (farmId == null) throw new Error('farmId is required')
      const [soilTests, petioleTests] = await Promise.all([
        SupabaseService.getSoilTestRecords(farmId),
        SupabaseService.getPetioleTestRecords(farmId)
      ])

      return {
        soilTests: (soilTests || []) as LabTestRecord[],
        petioleTests: (petioleTests || []) as LabTestRecord[]
      }
    },
    enabled: farmId != null
  })
}

export function useDeleteFarmLabTest(farmId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, type }: { id: number; type: 'soil' | 'petiole' }) =>
      type === 'soil'
        ? SupabaseService.deleteSoilTestRecord(id)
        : SupabaseService.deletePetioleTestRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: farmKeys.labTests(farmId) })
      queryClient.invalidateQueries({ queryKey: farmKeys.summary(farmId) })
    }
  })
}

export function useFarmSoilProfiles(farmId: number | null) {
  return useQuery({
    queryKey:
      farmId != null ? farmKeys.soilProfiles(farmId) : ['farms', 'soil-profiles', 'disabled'],
    queryFn: () => {
      if (farmId == null) throw new Error('farmId is required')
      return SoilProfileService.listProfiles(farmId)
    },
    enabled: farmId != null
  })
}

export function useSaveFarmSoilProfile(farmId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      id?: number | null
      farm_id: number
      fusarium_pct?: number | null
      sections: Array<Omit<SoilSection, 'id' | 'profile_id' | 'created_at'>>
      profileDate: string
    }) =>
      input.id
        ? SoilProfileService.updateProfile({
            id: input.id,
            farm_id: input.farm_id,
            fusarium_pct: input.fusarium_pct,
            sections: input.sections as SoilSection[],
            profileDate: input.profileDate
          })
        : SoilProfileService.createProfileWithSections({
            farm_id: input.farm_id,
            fusarium_pct: input.fusarium_pct,
            sections: input.sections,
            profileDate: input.profileDate
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: farmKeys.soilProfiles(farmId) })
      queryClient.invalidateQueries({ queryKey: farmKeys.summary(farmId) })
    }
  })
}

export function useDeleteFarmSoilProfile(farmId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (profileId: number) => SoilProfileService.deleteProfile(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: farmKeys.soilProfiles(farmId) })
      queryClient.invalidateQueries({ queryKey: farmKeys.summary(farmId) })
    }
  })
}
