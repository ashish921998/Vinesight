'use client'

import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { SupabaseService } from '@/lib/supabase-service'
import { farmKeys } from '@/lib/farm-query-keys'
import type {
  IrrigationRecord,
  SprayRecord,
  FertigationRecord,
  HarvestRecord,
  ExpenseRecord,
  SoilTestRecord,
  PetioleTestRecord,
  DailyNoteRecord
} from '@/lib/supabase'

/**
 * Mutation hooks for the farm journal write surface (farms/[id]).
 *
 * Per the slice's design we use *wholesale* invalidation of the farm summary on
 * every write — this matches the page's previous refetch-everything behavior and
 * keeps the recent-activity / counts / totals aggregate correct. Alongside the
 * summary we also invalidate the relevant `records` / `labTests` bucket so other
 * surfaces (logs page, lab workspace) reading those keys stay fresh. Per-record
 * granular caches are intentionally out of scope.
 */

// Activity/journal records that surface in the logs + activity feed.
function invalidateRecords(queryClient: QueryClient, farmId: number) {
  queryClient.invalidateQueries({ queryKey: farmKeys.summary(farmId) })
  queryClient.invalidateQueries({ queryKey: farmKeys.records(farmId) })
}

// Lab analyses (soil + petiole) that surface in the lab workspace.
function invalidateLabTests(queryClient: QueryClient, farmId: number) {
  queryClient.invalidateQueries({ queryKey: farmKeys.summary(farmId) })
  queryClient.invalidateQueries({ queryKey: farmKeys.labTests(farmId) })
}

type CreateInput<T> = Omit<T, 'id' | 'created_at'>
type UpdateArgs<T> = { id: number; updates: Partial<T> }

// ── Irrigation ──────────────────────────────────────────────────────────────
export function useAddIrrigationRecord(farmId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (record: CreateInput<IrrigationRecord>) =>
      SupabaseService.addIrrigationRecord(record),
    onSuccess: () => invalidateRecords(queryClient, farmId)
  })
}

export function useUpdateIrrigationRecord(farmId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: UpdateArgs<IrrigationRecord>) =>
      SupabaseService.updateIrrigationRecord(id, updates),
    onSuccess: () => invalidateRecords(queryClient, farmId)
  })
}

export function useDeleteIrrigationRecord(farmId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => SupabaseService.deleteIrrigationRecord(id),
    onSuccess: () => invalidateRecords(queryClient, farmId)
  })
}

// ── Spray ─────────────────────────────────────────────────────────────────--
export function useAddSprayRecord(farmId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (record: CreateInput<SprayRecord>) => SupabaseService.addSprayRecord(record),
    onSuccess: () => invalidateRecords(queryClient, farmId)
  })
}

export function useUpdateSprayRecord(farmId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: UpdateArgs<SprayRecord>) =>
      SupabaseService.updateSprayRecord(id, updates),
    onSuccess: () => invalidateRecords(queryClient, farmId)
  })
}

export function useDeleteSprayRecord(farmId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => SupabaseService.deleteSprayRecord(id),
    onSuccess: () => invalidateRecords(queryClient, farmId)
  })
}

// ── Harvest ───────────────────────────────────────────────────────────────--
export function useAddHarvestRecord(farmId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (record: CreateInput<HarvestRecord>) => SupabaseService.addHarvestRecord(record),
    onSuccess: () => invalidateRecords(queryClient, farmId)
  })
}

export function useUpdateHarvestRecord(farmId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: UpdateArgs<HarvestRecord>) =>
      SupabaseService.updateHarvestRecord(id, updates),
    onSuccess: () => invalidateRecords(queryClient, farmId)
  })
}

export function useDeleteHarvestRecord(farmId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => SupabaseService.deleteHarvestRecord(id),
    onSuccess: () => invalidateRecords(queryClient, farmId)
  })
}

// ── Expense ───────────────────────────────────────────────────────────────--
export function useAddExpenseRecord(farmId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (record: CreateInput<ExpenseRecord>) => SupabaseService.addExpenseRecord(record),
    onSuccess: () => invalidateRecords(queryClient, farmId)
  })
}

export function useUpdateExpenseRecord(farmId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: UpdateArgs<ExpenseRecord>) =>
      SupabaseService.updateExpenseRecord(id, updates),
    onSuccess: () => invalidateRecords(queryClient, farmId)
  })
}

export function useDeleteExpenseRecord(farmId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => SupabaseService.deleteExpenseRecord(id),
    onSuccess: () => invalidateRecords(queryClient, farmId)
  })
}

// ── Fertigation ─────────────────────────────────────────────────────────────
export function useAddFertigationRecord(farmId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (record: CreateInput<FertigationRecord>) =>
      SupabaseService.addFertigationRecord(record),
    onSuccess: () => invalidateRecords(queryClient, farmId)
  })
}

export function useUpdateFertigationRecord(farmId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: UpdateArgs<FertigationRecord>) =>
      SupabaseService.updateFertigationRecord(id, updates),
    onSuccess: () => invalidateRecords(queryClient, farmId)
  })
}

export function useDeleteFertigationRecord(farmId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => SupabaseService.deleteFertigationRecord(id),
    onSuccess: () => invalidateRecords(queryClient, farmId)
  })
}

// ── Soil test ───────────────────────────────────────────────────────────────
export function useAddSoilTestRecord(farmId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (record: CreateInput<SoilTestRecord>) => SupabaseService.addSoilTestRecord(record),
    onSuccess: () => invalidateLabTests(queryClient, farmId)
  })
}

export function useUpdateSoilTestRecord(farmId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: UpdateArgs<SoilTestRecord>) =>
      SupabaseService.updateSoilTestRecord(id, updates),
    onSuccess: () => invalidateLabTests(queryClient, farmId)
  })
}

export function useDeleteSoilTestRecord(farmId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => SupabaseService.deleteSoilTestRecord(id),
    onSuccess: () => invalidateLabTests(queryClient, farmId)
  })
}

// ── Petiole test ────────────────────────────────────────────────────────────
export function useAddPetioleTestRecord(farmId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (record: CreateInput<PetioleTestRecord>) =>
      SupabaseService.addPetioleTestRecord(record),
    onSuccess: () => invalidateLabTests(queryClient, farmId)
  })
}

export function useUpdatePetioleTestRecord(farmId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: UpdateArgs<PetioleTestRecord>) =>
      SupabaseService.updatePetioleTestRecord(id, updates),
    onSuccess: () => invalidateLabTests(queryClient, farmId)
  })
}

export function useDeletePetioleTestRecord(farmId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => SupabaseService.deletePetioleTestRecord(id),
    onSuccess: () => invalidateLabTests(queryClient, farmId)
  })
}

// ── Daily note ──────────────────────────────────────────────────────────────
type DailyNoteInput = { farm_id: number; date: string; notes?: string | null }

export function useAddDailyNote(farmId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (note: DailyNoteInput) => SupabaseService.upsertDailyNote(note),
    onSuccess: () => invalidateRecords(queryClient, farmId)
  })
}

export function useUpdateDailyNote(farmId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: UpdateArgs<DailyNoteRecord>) =>
      SupabaseService.updateDailyNote(id, updates),
    onSuccess: () => invalidateRecords(queryClient, farmId)
  })
}

export function useDeleteDailyNote(farmId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => SupabaseService.deleteDailyNote(id),
    onSuccess: () => invalidateRecords(queryClient, farmId)
  })
}

/**
 * Convenience aggregator: every journal record type's add/update/delete mutation
 * grouped by type, so a write surface can wire them with a single hook call.
 */
export function useFarmLogMutations(farmId: number) {
  return {
    irrigation: {
      add: useAddIrrigationRecord(farmId),
      update: useUpdateIrrigationRecord(farmId),
      remove: useDeleteIrrigationRecord(farmId)
    },
    spray: {
      add: useAddSprayRecord(farmId),
      update: useUpdateSprayRecord(farmId),
      remove: useDeleteSprayRecord(farmId)
    },
    harvest: {
      add: useAddHarvestRecord(farmId),
      update: useUpdateHarvestRecord(farmId),
      remove: useDeleteHarvestRecord(farmId)
    },
    expense: {
      add: useAddExpenseRecord(farmId),
      update: useUpdateExpenseRecord(farmId),
      remove: useDeleteExpenseRecord(farmId)
    },
    fertigation: {
      add: useAddFertigationRecord(farmId),
      update: useUpdateFertigationRecord(farmId),
      remove: useDeleteFertigationRecord(farmId)
    },
    soilTest: {
      add: useAddSoilTestRecord(farmId),
      update: useUpdateSoilTestRecord(farmId),
      remove: useDeleteSoilTestRecord(farmId)
    },
    petioleTest: {
      add: useAddPetioleTestRecord(farmId),
      update: useUpdatePetioleTestRecord(farmId),
      remove: useDeletePetioleTestRecord(farmId)
    },
    dailyNote: {
      add: useAddDailyNote(farmId),
      update: useUpdateDailyNote(farmId),
      remove: useDeleteDailyNote(farmId)
    }
  }
}
