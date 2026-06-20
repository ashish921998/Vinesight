'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getConsultantAccess, type ConsultantAccess } from '@/lib/consultant-access'
import { consultantKeys } from '@/lib/consultant-query-keys'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import {
  getFarmerClients,
  getFarmerFarms,
  getFarmerProfile,
  getFarmDetail,
  validateFarmerClient
} from '@/lib/consultant-query-service'
import {
  createVisit,
  getVisitsForFarmer,
  type CreateVisitInput
} from '@/lib/consultant-visit-service'
import { getTriageItems } from '@/lib/consultant-triage-service'
import { listOrgMembers, listPendingInvites } from '@/lib/team-service'
import { SupabaseService } from '@/lib/supabase-service'
import { FertilizerPlanService } from '@/lib/fertilizer-plan-service'
import type { LabTestRecord } from '@/types/lab-tests'

export type ConsultantAccessState = 'loading' | 'ok' | 'denied' | 'error'

export function getConsultantAccessState(
  isPending: boolean,
  isError: boolean,
  access: ConsultantAccess | null | undefined
): ConsultantAccessState {
  if (isPending) return 'loading'
  if (isError) return 'error'
  return access ? 'ok' : 'denied'
}

export function farmerScope(access: ConsultantAccess) {
  return access.canViewAllFarmers ? 'all' : access.userId
}

export function useConsultantAccess(enabled = true) {
  const { loading, user } = useSupabaseAuth()
  const userId = user?.id ?? 'anonymous'

  return useQuery({
    queryKey: consultantKeys.access(userId),
    queryFn: getConsultantAccess,
    enabled: Boolean(enabled && !loading && user)
  })
}

export function useFarmerClients(access: ConsultantAccess | null | undefined) {
  return useQuery({
    queryKey: access
      ? consultantKeys.farmers(access.organizationId, farmerScope(access))
      : ['consultant', 'farmers', 'disabled'],
    queryFn: () => getFarmerClients(access as ConsultantAccess),
    enabled: Boolean(access)
  })
}

export function useValidatedFarmerClient(
  access: ConsultantAccess | null | undefined,
  farmerId: string
) {
  return useQuery({
    queryKey: access
      ? consultantKeys.farmerValidation(farmerId, access.organizationId, farmerScope(access))
      : ['consultant', 'farmer', farmerId, 'validation', 'disabled'],
    queryFn: () => validateFarmerClient(access as ConsultantAccess, farmerId),
    enabled: Boolean(access && farmerId)
  })
}

export function useFarmerProfile(farmerId: string, enabled = true) {
  return useQuery({
    queryKey: consultantKeys.farmerProfile(farmerId),
    queryFn: () => getFarmerProfile(farmerId),
    enabled: Boolean(farmerId && enabled)
  })
}

export function useFarmerFarms(farmerId: string, enabled = true) {
  return useQuery({
    queryKey: consultantKeys.farmerFarms(farmerId),
    queryFn: () => getFarmerFarms(farmerId),
    enabled: Boolean(farmerId && enabled)
  })
}

export function useFarmDetail(
  farmId: number | null,
  enabled = true,
  access: ConsultantAccess | null | undefined = null
) {
  const canLoad = Boolean(farmId != null && enabled && access)

  return useQuery({
    queryKey: canLoad
      ? consultantKeys.farmDetail(farmId as number, access!.organizationId, farmerScope(access!))
      : ['consultant', 'farm', 'disabled', farmId],
    queryFn: () => getFarmDetail(farmId as number),
    enabled: canLoad
  })
}

export function useFarmLabTests(farmId: number | null, enabled = true) {
  return useQuery({
    queryKey:
      farmId != null ? consultantKeys.farmLabTests(farmId) : ['consultant', 'farm', 'labTests'],
    queryFn: async () => {
      const [soilTests, petioleTests] = await Promise.all([
        SupabaseService.getSoilTestRecords(farmId as number),
        SupabaseService.getPetioleTestRecords(farmId as number)
      ])
      return {
        soilTests: (soilTests ?? []) as LabTestRecord[],
        petioleTests: (petioleTests ?? []) as LabTestRecord[]
      }
    },
    enabled: Boolean(farmId != null && enabled)
  })
}

export function useFarmPlans(farmId: number | null, enabled = true) {
  return useQuery({
    queryKey: farmId != null ? consultantKeys.farmPlans(farmId) : ['consultant', 'farm', 'plans'],
    queryFn: () => FertilizerPlanService.getPlansByFarm(farmId as number),
    enabled: Boolean(farmId != null && enabled)
  })
}

export function useFarmTriage(
  access: ConsultantAccess | null | undefined,
  farmId: number | null,
  enabled = true
) {
  const canLoad = Boolean(access && farmId != null && enabled)

  return useQuery({
    queryKey: canLoad
      ? consultantKeys.farmTriage(farmId as number, access!.organizationId, farmerScope(access!))
      : ['consultant', 'farm', farmId, 'triage', 'disabled'],
    queryFn: () => getTriageItems(access as ConsultantAccess, { farmId: farmId as number }),
    enabled: canLoad
  })
}

export function useFarmerVisits(access: ConsultantAccess | null | undefined, farmerId: string) {
  return useQuery({
    queryKey: access
      ? consultantKeys.farmerVisits(farmerId, access.organizationId, farmerScope(access))
      : ['consultant', 'farmer', farmerId, 'visits', 'disabled'],
    queryFn: () => getVisitsForFarmer(access as ConsultantAccess, farmerId),
    enabled: Boolean(access && farmerId)
  })
}

// Pending Petiole Reviews across the consultant's scope, newest first — the
// work-item feed for the Command Center "Reports to Review" panel.
export function useReviewQueue(access: ConsultantAccess | null | undefined) {
  return useQuery({
    queryKey: access
      ? consultantKeys.reviewQueue(access.organizationId, farmerScope(access))
      : ['consultant', 'reviewQueue', 'disabled'],
    queryFn: async () => {
      const items = await getTriageItems(access as ConsultantAccess)
      return items.filter((t) => t.status === 'pending' || t.status === 'in_review')
    },
    enabled: Boolean(access)
  })
}

// Every triage item in the consultant's scope (all statuses) — drives the
// "Reports to Review" page counts + filters. Replaces a manual
// useEffect+fetch+setState that flagged as derived state.
export function useTriageItems(access: ConsultantAccess | null | undefined) {
  return useQuery({
    queryKey: access
      ? consultantKeys.triageItems(access.organizationId, farmerScope(access))
      : ['consultant', 'triageItems', 'disabled'],
    queryFn: () => getTriageItems(access as ConsultantAccess),
    enabled: Boolean(access)
  })
}

// Organization members (everyone). Replaces a manual fetch on the team pages.
export function useOrgMembers(access: ConsultantAccess | null | undefined) {
  return useQuery({
    queryKey: access
      ? consultantKeys.orgMembers(access.organizationId)
      : ['consultant', 'orgMembers', 'disabled'],
    queryFn: () => listOrgMembers((access as ConsultantAccess).organizationId),
    enabled: Boolean(access)
  })
}

// Pending member invitations (admins only — RLS returns [] for others).
export function usePendingInvites(access: ConsultantAccess | null | undefined) {
  return useQuery({
    queryKey: access
      ? consultantKeys.pendingInvites(access.organizationId)
      : ['consultant', 'pendingInvites', 'disabled'],
    queryFn: () => listPendingInvites((access as ConsultantAccess).organizationId),
    enabled: Boolean(access)
  })
}

export function useCreateVisit(access: ConsultantAccess | null | undefined, farmerId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateVisitInput) => {
      if (!access) {
        throw new Error('Consultant access is required to record a visit')
      }
      return createVisit(access, input)
    },
    onSuccess: () => {
      if (!access) return
      queryClient.invalidateQueries({
        queryKey: consultantKeys.farmerVisits(farmerId, access.organizationId, farmerScope(access))
      })
    }
  })
}
