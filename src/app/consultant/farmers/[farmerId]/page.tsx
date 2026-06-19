'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Loader2,
  User,
  Mail,
  Phone,
  Sprout,
  MapPin,
  ChevronRight,
  ClipboardCheck,
  CalendarDays,
  CheckCircle2,
  MinusCircle,
  XCircle
} from 'lucide-react'
import {
  farmerScope,
  useConsultantAccess,
  useFarmerFarms,
  useFarmerProfile,
  useFarmerVisits,
  useValidatedFarmerClient
} from '@/hooks/consultant/useConsultantQueries'
import {
  followedStatusLabels,
  type Visit,
  type FollowedStatus
} from '@/lib/consultant-visit-service'
import { RecordVisitDialog } from '@/components/consultant/RecordVisitDialog'
import { PaidToggleButton } from '@/components/consultant/PaidToggleButton'
import { consultantKeys } from '@/lib/consultant-query-keys'
import type { FarmerWithFarms, ValidatedFarmerClient } from '@/lib/consultant-query-service'
import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'

export default function FarmerProfilePage() {
  const params = useParams()
  const queryClient = useQueryClient()
  const trackedProfileViewKeyRef = useRef<string | null>(null)
  const farmerId = params.farmerId as string

  const accessQuery = useConsultantAccess()
  const access = accessQuery.data ?? null
  const validationQuery = useValidatedFarmerClient(access, farmerId)
  const validation = validationQuery.data
  const isValidClient = validation?.isValid ?? false
  const farmerQuery = useFarmerProfile(farmerId, isValidClient)
  const farmsQuery = useFarmerFarms(farmerId, isValidClient)
  const visitsQuery = useFarmerVisits(isValidClient ? access : null, farmerId)

  const farmer = farmerQuery.data ?? null
  const farms = farmsQuery.data ?? []
  const visits = visitsQuery.data ?? []
  const loading =
    accessQuery.isPending ||
    validationQuery.isPending ||
    (isValidClient && (farmerQuery.isPending || farmsQuery.isPending || visitsQuery.isPending))
  const notFound =
    (!accessQuery.isPending && !accessQuery.isError && !access) ||
    validation?.isValid === false ||
    (isValidClient && farmerQuery.isSuccess && !farmer)

  useEffect(() => {
    const error =
      accessQuery.error ??
      validationQuery.error ??
      farmerQuery.error ??
      farmsQuery.error ??
      visitsQuery.error
    if (!error) return

    Sentry.captureException(error, {
      tags: { context: 'loadFarmerProfile' },
      extra: { farmerId }
    })
    toast.error(error instanceof Error ? error.message : 'Failed to load farmer profile')
  }, [accessQuery.error, validationQuery.error, farmerQuery.error, farmsQuery.error, visitsQuery.error, farmerId])

  useEffect(() => {
    if (!access || !farmerQuery.data || !farmsQuery.data || !visitsQuery.data) return

    const viewKey = `${access.userId}:${access.organizationId}:${farmerId}`
    if (trackedProfileViewKeyRef.current === viewKey) return
    trackedProfileViewKeyRef.current = viewKey

    posthog.capture('consultant_farmer_profile_viewed', {
      farmer_id: farmerId,
      org_id: access.organizationId,
      role: access.role,
      farm_count: farmsQuery.data.length,
      visit_count: visitsQuery.data.length
    })
  }, [access, farmerId, farmerQuery.data, farmsQuery.data, visitsQuery.data])

  const updateCachedPaymentStatus = (isPaid: boolean) => {
    if (!access) return

    const scope = farmerScope(access)

    queryClient.setQueryData<ValidatedFarmerClient>(
      consultantKeys.farmerValidation(farmerId, access.organizationId, scope),
      (current) => (current ? { ...current, isPaid } : current)
    )
    queryClient.setQueryData<FarmerWithFarms[]>(
      consultantKeys.farmers(access.organizationId, scope),
      (current) =>
        current?.map((farmer) => (farmer.id === farmerId ? { ...farmer, isPaid } : farmer))
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading farmer profile...</p>
        </div>
      </div>
    )
  }

  if (notFound || !farmer) {
    return (
      <div className="space-y-6">
        <Link href="/consultant/farmers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Farmers
          </Button>
        </Link>
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Farmer Not Found</h3>
            <p className="text-muted-foreground mt-2">
              This farmer does not exist or is not part of your organization.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/consultant/farmers">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Farmers
        </Button>
      </Link>

      {/* Farmer profile header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6 text-accent" />
            {farmer.full_name || 'Unknown Farmer'}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-muted-foreground">
            {farmer.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {farmer.email}
              </span>
            )}
            {farmer.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {farmer.phone}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {validation?.clientRecordId && (
            <PaidToggleButton
              clientRecordId={validation.clientRecordId}
              isPaid={validation.isPaid}
              size="default"
              onChange={updateCachedPaymentStatus}
            />
          )}
          {access && (
            <RecordVisitDialog
              access={access}
              farmerId={farmerId}
              farms={farms.map((f) => ({ id: f.id, name: f.name }))}
            />
          )}
        </div>
      </div>

      {/* Visit history */}
      <VisitHistory visits={visits} />

      {/* Farms section */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Farms ({farms.length})</h2>

        {farms.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Sprout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No Farms</h3>
              <p className="text-muted-foreground mt-2">This farmer has not added any farms yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {farms.map((farm) => (
              <Link key={farm.id} href={`/consultant/farmers/${farmerId}/farms/${farm.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sprout className="h-4 w-4 text-accent flex-shrink-0" />
                        {farm.name}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {farm.region && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {farm.region}
                        </span>
                      )}
                      {farm.crop_variety && <span>{farm.crop_variety}</span>}
                      {farm.area && <span>{farm.area} acres</span>}
                      {farm.soil_texture_class && <span>{farm.soil_texture_class}</span>}
                    </div>
                    <div className="flex justify-end mt-3">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const followedStatusIcon: Record<FollowedStatus, ReactNode> = {
  followed: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  partially_followed: <MinusCircle className="h-4 w-4 text-amber-600" />,
  not_followed: <XCircle className="h-4 w-4 text-red-600" />
}

function VisitHistory({ visits }: { visits: Visit[] }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <ClipboardCheck className="h-5 w-5 text-accent" />
        Visits ({visits.length})
      </h2>

      {visits.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No visits recorded yet. Use “Record Visit” to log one and verify recommendation
              follow-up.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {visits.map((visit) => (
            <Card key={visit.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-accent" />
                    {new Date(visit.visitDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {visit.farmName && (
                      <Badge variant="secondary" className="gap-1">
                        <Sprout className="h-3 w-3" />
                        {visit.farmName}
                      </Badge>
                    )}
                    {visit.visitedByName && <span>by {visit.visitedByName}</span>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {visit.summary && <p className="text-sm">{visit.summary}</p>}

                {visit.followups.length > 0 && (
                  <div className="space-y-2">
                    {visit.followups.map((f) => (
                      <div key={f.id} className="rounded-lg border bg-muted/40 p-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {followedStatusIcon[f.followedStatus]}
                          {followedStatusLabels[f.followedStatus]}
                          {f.classification && (
                            <Badge variant="outline" className="ml-1 font-normal">
                              {f.classification}
                            </Badge>
                          )}
                        </div>
                        {f.recommendation && (
                          <p className="mt-1 text-sm text-muted-foreground">{f.recommendation}</p>
                        )}
                        {f.note && <p className="mt-1 text-sm">{f.note}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
