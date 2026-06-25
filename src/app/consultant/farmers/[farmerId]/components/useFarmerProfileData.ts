'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'
import { useQueryClient } from '@tanstack/react-query'
import { type ConsultantAccess } from '@/lib/consultant-access'
import { type FarmerFarm } from '@/lib/consultant-query-service'
import { consultantKeys } from '@/lib/consultant-query-keys'
import {
  farmerScope,
  useConsultantAccess,
  useFarmerFarms,
  useFarmerProfile,
  useValidatedFarmerClient
} from '@/hooks/consultant/useConsultantQueries'

export interface FarmerProfile {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
}

export interface FarmerProfileData {
  farmer: FarmerProfile | null
  farms: FarmerFarm[]
  loading: boolean
  notFound: boolean
  access: ConsultantAccess | null
  clientRecordId: string | null
  isPaid: boolean
  setIsPaid: (paid: boolean) => void
}

/**
 * Loads everything the farmer profile page needs — consultant access, the
 * farmer's organization-client validation (paid status), their profile, and
 * their farms. Backed by TanStack Query so the data is cached and shared with
 * the rest of the consultant surface. Lifted out of the page so the page is
 * just rendering.
 */
export function useFarmerProfileData(farmerId: string): FarmerProfileData {
  const queryClient = useQueryClient()

  const accessQuery = useConsultantAccess()
  const access = accessQuery.data ?? null

  const validationQuery = useValidatedFarmerClient(access, farmerId)
  const validation = validationQuery.data
  const isValidClient = validation?.isValid ?? false

  const farmerQuery = useFarmerProfile(farmerId, isValidClient)
  const farmsQuery = useFarmerFarms(farmerId, isValidClient)

  const farmer = (farmerQuery.data ?? null) as FarmerProfile | null
  const farms = (farmsQuery.data ?? []) as FarmerFarm[]
  const clientRecordId = validation?.isValid ? validation.clientRecordId : null
  const isPaid = (validation?.isValid && validation.isPaid) ?? false

  const loading =
    accessQuery.isPending ||
    (Boolean(access) && validationQuery.isPending) ||
    (isValidClient && (farmerQuery.isPending || farmsQuery.isPending))
  const notFound =
    (!accessQuery.isPending && !accessQuery.isError && !access) ||
    validation?.isValid === false ||
    (isValidClient && farmerQuery.isSuccess && !farmer)

  // Surface load failures from any of the underlying queries once.
  useEffect(() => {
    const error =
      accessQuery.error ?? validationQuery.error ?? farmerQuery.error ?? farmsQuery.error
    if (!error) return

    Sentry.captureException(error, {
      tags: { context: 'loadFarmerProfile' },
      extra: { farmerId }
    })
    toast.error(error instanceof Error ? error.message : 'Failed to load farmer profile')
  }, [accessQuery.error, validationQuery.error, farmerQuery.error, farmsQuery.error, farmerId])

  // Fire the profile-viewed event once per (consultant, org, farmer) load.
  const trackedViewKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (!access || !farmerQuery.data || !farmsQuery.data) return

    const viewKey = `${access.userId}:${access.organizationId}:${farmerId}`
    if (trackedViewKeyRef.current === viewKey) return
    trackedViewKeyRef.current = viewKey

    posthog.capture('consultant_farmer_profile_viewed', {
      farmer_id: farmerId,
      org_id: access.organizationId,
      role: access.role,
      farm_count: farmsQuery.data.length
    })
  }, [access, farmerId, farmerQuery.data, farmsQuery.data])

  // Optimistically reflect a payment-status change in the validation cache so
  // the badge/toggle update immediately and stay consistent on revisit.
  const setIsPaid = (paid: boolean) => {
    if (!access) return

    queryClient.setQueryData(
      consultantKeys.farmerValidation(farmerId, access.organizationId, farmerScope(access)),
      (current: typeof validation) =>
        current && current.isValid ? { ...current, isPaid: paid } : current
    )
  }

  return { farmer, farms, loading, notFound, access, clientRecordId, isPaid, setIsPaid }
}
