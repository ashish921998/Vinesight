'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'
import { getConsultantAccess, type ConsultantAccess } from '@/lib/consultant-access'
import {
  validateFarmerClient,
  getFarmerProfile,
  getFarmerFarms,
  type FarmerFarm
} from '@/lib/consultant-query-service'

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
 * their farms. Lifted out of the page so the page is just rendering.
 */
export function useFarmerProfileData(farmerId: string): FarmerProfileData {
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null)
  const [farms, setFarms] = useState<FarmerFarm[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [access, setAccess] = useState<ConsultantAccess | null>(null)
  const [clientRecordId, setClientRecordId] = useState<string | null>(null)
  const [isPaid, setIsPaid] = useState(false)

  useEffect(() => {
    // Guard against stale loads when [farmerId] changes without remounting
    // (App Router preserves the [farmerId] segment component). If a newer
    // navigation fires before this load resolves, bail before any setState so
    // farmer A's data can never overwrite farmer B's.
    let stale = false

    const load = async () => {
      try {
        setLoading(true)
        setNotFound(false)

        const currentAccess = await getConsultantAccess()
        if (stale) return
        if (!currentAccess) {
          toast.error('Not authenticated')
          return
        }
        setAccess(currentAccess)

        // Validate farmer is an active client of the organization
        const validation = await validateFarmerClient(currentAccess, farmerId)
        if (stale) return
        if (!validation.isValid) {
          setNotFound(true)
          return
        }
        setClientRecordId(validation.clientRecordId)
        setIsPaid(validation.isPaid)

        const [profile, farmsData] = await Promise.all([
          getFarmerProfile(farmerId),
          getFarmerFarms(farmerId)
        ])

        if (stale) return
        if (!profile) {
          setNotFound(true)
          return
        }

        setFarmer(profile)
        setFarms(farmsData)
        posthog.capture('consultant_farmer_profile_viewed', {
          farmer_id: farmerId,
          org_id: currentAccess.organizationId,
          role: currentAccess.role,
          farm_count: farmsData.length
        })
      } catch (error) {
        if (stale) return
        Sentry.captureException(error, {
          tags: { context: 'loadFarmerProfile' },
          extra: { farmerId }
        })
        toast.error(error instanceof Error ? error.message : 'Failed to load farmer profile')
      } finally {
        if (!stale) setLoading(false)
      }
    }

    load()
    return () => {
      stale = true
    }
  }, [farmerId])

  return { farmer, farms, loading, notFound, access, clientRecordId, isPaid, setIsPaid }
}
