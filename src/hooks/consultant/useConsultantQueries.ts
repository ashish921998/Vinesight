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
