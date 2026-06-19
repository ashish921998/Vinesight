'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Users,
  Search,
  Sprout,
  User,
  UserX,
  Phone,
  Mail,
  Loader2,
  ChevronRight,
  MapPin
} from 'lucide-react'
import { InviteFarmerDialog } from '@/components/consultant/InviteFarmerDialog'
import { JoinCodeCard } from '@/components/consultant/JoinCodeCard'
import { PaidToggleButton } from '@/components/consultant/PaidToggleButton'
import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'
import { useConsultantAccess, useFarmerClients } from '@/hooks/consultant/useConsultantQueries'
import { consultantKeys } from '@/lib/consultant-query-keys'
import type { FarmerWithFarms } from '@/lib/consultant-query-service'

// Sentinel for the "All regions" option. Uses a non-region-like value so it can't
// collide with a real farm region (e.g. a region literally named "all").
const ALL_REGIONS = '__all__'

export default function FarmerDirectoryPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [regionFilter, setRegionFilter] = useState(ALL_REGIONS)
  const [unassignedOnly, setUnassignedOnly] = useState(false)

  const accessQuery = useConsultantAccess()
  const access = accessQuery.data ?? null
  const farmersQuery = useFarmerClients(access)
  const farmers = farmersQuery.data ?? []
  const loading = accessQuery.isPending || farmersQuery.isPending

  useEffect(() => {
    if (accessQuery.error) {
      Sentry.captureException(accessQuery.error, { tags: { context: 'getConsultantAccess' } })
      toast.error('Not authenticated')
    }
  }, [accessQuery.error])

  useEffect(() => {
    if (farmersQuery.error) {
      Sentry.captureException(farmersQuery.error, { tags: { context: 'getFarmerClients' } })
      toast.error(
        farmersQuery.error instanceof Error
          ? farmersQuery.error.message
          : 'Failed to load farmer directory'
      )
    }
  }, [farmersQuery.error])

  useEffect(() => {
    if (!access || !farmersQuery.data) return

    posthog.capture('consultant_farmer_list_viewed', {
      org_id: access.organizationId,
      role: access.role,
      farmer_count: farmersQuery.data.length
    })
  }, [access, farmersQuery.data])

  const updateCachedPaymentStatus = (clientRecordId: string, isPaid: boolean) => {
    if (!access) return

    const scope = access.canViewAllFarmers ? 'all' : access.userId
    queryClient.setQueryData<FarmerWithFarms[]>(
      consultantKeys.farmers(access.organizationId, scope),
      (current) =>
        current?.map((farmer) =>
          farmer.clientRecordId === clientRecordId ? { ...farmer, isPaid } : farmer
        )
    )
  }

  // Unique regions across all farmers' farms, for the region filter dropdown.
  const regions = useMemo(() => {
    const set = new Set<string>()
    for (const farmer of farmers) {
      for (const farm of farmer.farms) {
        const region = farm.region?.trim()
        if (region && region !== ALL_REGIONS) set.add(region)
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [farmers])

  // Derive the effective region during render: if the selected region is no
  // longer present (e.g. the only farmer in it was removed or reassigned), fall
  // back to "all" so the list never gets stuck on an empty, unrecoverable state.
  const effectiveRegion =
    regionFilter === ALL_REGIONS || regions.includes(regionFilter) ? regionFilter : ALL_REGIONS

  // Count of org clients with no agronomist assigned. Only meaningful for
  // owner/admin, whose directory includes the whole org; agronomists only ever
  // see their own assigned farmers, so the control below is gated on access.
  const unassignedCount = useMemo(
    () => farmers.filter((farmer) => !farmer.assigned_to).length,
    [farmers]
  )

  // Owner/admin only, and only worth showing when there's at least one.
  const showUnassignedFilter = Boolean(access?.canViewAllFarmers) && unassignedCount > 0

  // The toggle can only be active while its control is visible — otherwise an
  // agronomist (or a state where the count drops to 0) could be stuck filtering
  // by a control they can't see or unset.
  const effectiveUnassignedOnly = showUnassignedFilter && unassignedOnly

  // Filtered farmers
  const filteredFarmers = useMemo(() => {
    return farmers.filter((farmer) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const nameMatch = farmer.full_name?.toLowerCase().includes(query)
        const farmMatch = farmer.farms.some((f) => f.name?.toLowerCase().includes(query))
        if (!nameMatch && !farmMatch) return false
      }

      // Region filter — keep the farmer if any of their farms is in the region
      if (effectiveRegion !== ALL_REGIONS) {
        const regionMatch = farmer.farms.some((f) => f.region?.trim() === effectiveRegion)
        if (!regionMatch) return false
      }

      // Unassigned filter — restrict to farmers with no agronomist assigned
      if (effectiveUnassignedOnly && farmer.assigned_to) {
        return false
      }

      return true
    })
  }, [farmers, searchQuery, effectiveRegion, effectiveUnassignedOnly])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading farmer directory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Farmer Directory</h1>
          <p className="text-muted-foreground">
            {farmers.length} farmer{farmers.length !== 1 ? 's' : ''}{' '}
            {access?.isAgronomist ? 'assigned to you' : 'in your organization'}
          </p>
        </div>
        {access && <InviteFarmerDialog organizationId={access.organizationId} />}
      </div>

      <JoinCodeCard access={access} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by farmer or farm name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {regions.length > 0 && (
          <Select value={effectiveRegion} onValueChange={setRegionFilter}>
            <SelectTrigger className="sm:w-56">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <SelectValue placeholder="All regions" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_REGIONS}>All regions</SelectItem>
              {regions.map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {showUnassignedFilter && (
          <Badge
            asChild
            variant={effectiveUnassignedOnly ? 'default' : 'outline'}
            className="h-9 px-3"
          >
            <button
              type="button"
              onClick={() => setUnassignedOnly((prev) => !prev)}
              aria-pressed={effectiveUnassignedOnly}
              className="cursor-pointer"
            >
              <UserX />
              Unassigned ({unassignedCount})
            </button>
          </Badge>
        )}
      </div>

      {/* Results */}
      {filteredFarmers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No Farmers Found</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              {farmers.length === 0
                ? 'No farmers are linked to your organization yet.'
                : 'No farmers match your current filters. Try adjusting your search.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredFarmers.map((farmer) => (
            <Card key={farmer.id} className="relative transition-colors hover:bg-muted/50">
              {/* The whole row navigates to the farmer detail page. An overlay
                  link (rather than wrapping the Card) lets the Paid toggle stay
                  clickable without nesting a <button> inside an <a>. */}
              <Link
                href={`/consultant/farmers/${farmer.id}`}
                aria-label={`View ${farmer.full_name || 'farmer'} details`}
                className="absolute inset-0 z-0"
              />
              <CardHeader className="py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-accent flex-shrink-0" />
                      <span className="truncate">{farmer.full_name || 'Unknown Farmer'}</span>
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                      {farmer.email && (
                        <span className="flex items-center gap-1 min-w-0">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{farmer.email}</span>
                        </span>
                      )}
                      {farmer.phone && (
                        <span className="flex items-center gap-1 min-w-0">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{farmer.phone}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Raised above the overlay so toggling payment never navigates. */}
                    <div className="relative z-10">
                      <PaidToggleButton
                        clientRecordId={farmer.clientRecordId}
                        isPaid={farmer.isPaid}
                        onChange={(isPaid) => updateCachedPaymentStatus(farmer.clientRecordId, isPaid)}
                      />
                    </div>
                    <Badge variant="secondary" className="hidden sm:flex items-center gap-1">
                      <Sprout className="h-3 w-3" />
                      {farmer.farms.length} farm{farmer.farms.length !== 1 ? 's' : ''}
                    </Badge>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
