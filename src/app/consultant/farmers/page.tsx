'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Users, Search, Sprout, User, UserX, Phone, Mail, ChevronRight, MapPin } from 'lucide-react'
import { InviteFarmerDialog } from '@/components/consultant/InviteFarmerDialog'
import { JoinCodeCard } from '@/components/consultant/JoinCodeCard'
import { PaidToggleButton } from '@/components/consultant/PaidToggleButton'
import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'
import {
  farmerScope,
  useConsultantAccess,
  useFarmerClients
} from '@/hooks/consultant/useConsultantQueries'
import { consultantKeys } from '@/lib/consultant-query-keys'
import type { FarmerWithFarms } from '@/lib/consultant-query-service'

// Sentinel for the "All regions" option. Uses a non-region-like value so it can't
// collide with a real farm region (e.g. a region literally named "all").
const ALL_REGIONS = '__all__'

export default function FarmerDirectoryPage() {
  const queryClient = useQueryClient()
  const trackedViewKeyRef = useRef<string | null>(null)
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

    const viewKey = `${access.userId}:${access.organizationId}`
    if (trackedViewKeyRef.current === viewKey) return
    trackedViewKeyRef.current = viewKey

    posthog.capture('consultant_farmer_list_viewed', {
      org_id: access.organizationId,
      role: access.role,
      farmer_count: farmersQuery.data.length
    })
  }, [access, farmersQuery.data])

  const updateCachedPaymentStatus = (clientRecordId: string, isPaid: boolean) => {
    if (!access) return

    queryClient.setQueryData<FarmerWithFarms[]>(
      consultantKeys.farmers(access.organizationId, farmerScope(access)),
      (current) =>
        current?.map((farmer) =>
          farmer.clientRecordId === clientRecordId ? { ...farmer, isPaid } : farmer
        )
    )
  }

  // Unique regions across all farmers' farms, for the region filter dropdown.
  const regionSet = new Set<string>()
  for (const farmer of farmers) {
    for (const farm of farmer.farms) {
      const region = farm.region?.trim()
      if (region && region !== ALL_REGIONS) regionSet.add(region)
    }
  }
  const regions = Array.from(regionSet).sort((a, b) => a.localeCompare(b))

  // Derive the effective region during render: if the selected region is no
  // longer present (e.g. the only farmer in it was removed or reassigned), fall
  // back to "all" so the list never gets stuck on an empty, unrecoverable state.
  const effectiveRegion =
    regionFilter === ALL_REGIONS || regions.includes(regionFilter) ? regionFilter : ALL_REGIONS

  // Count of org clients with no agronomist assigned. Only meaningful for
  // owner/admin, whose directory includes the whole org; agronomists only ever
  // see their own assigned farmers, so the control below is gated on access.
  const unassignedCount = farmers.filter((farmer) => !farmer.assigned_to).length

  // Owner/admin only, and only worth showing when there's at least one.
  const showUnassignedFilter = Boolean(access?.canViewAllFarmers) && unassignedCount > 0

  // The toggle can only be active while its control is visible — otherwise an
  // agronomist (or a state where the count drops to 0) could be stuck filtering
  // by a control they can't see or unset.
  const effectiveUnassignedOnly = showUnassignedFilter && unassignedOnly

  // Filtered farmers
  const filteredFarmers = farmers.filter((farmer) => {
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

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-36" />
        </div>

        {/* Join code card */}
        <Skeleton className="h-24 w-full rounded-lg" />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 sm:w-56" />
        </div>

        {/* Worklist table */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border bg-secondary/50 px-4 py-2.5">
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            Farmer Directory
          </h1>
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

      {/* Results — a dense worklist table, not a card grid (DESIGN.md: tables over
          cards for any list of work). Mirrors FarmerFarmsTable's structure. */}
      {filteredFarmers.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-serif text-lg font-semibold">No farmers found</h3>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            {farmers.length === 0
              ? 'No farmers are linked to your organization yet.'
              : 'No farmers match your current filters. Try adjusting your search.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {/* Header counter + desktop column header */}
          <div className="border-b border-border bg-secondary/50 px-4 py-2.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {filteredFarmers.length} farmer{filteredFarmers.length !== 1 ? 's' : ''}
              {filteredFarmers.length !== farmers.length ? ` of ${farmers.length}` : ''}
            </p>
            <div className="mt-2.5 hidden grid-cols-[1.6fr_1.4fr_1fr_0.8fr_auto] gap-4 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-accent" />
                Farmer
              </div>
              <div>Contact</div>
              <div>Region</div>
              <div className="text-right">Farms</div>
              <div className="text-right">Status</div>
            </div>
          </div>

          <div className="divide-y divide-border">
            {filteredFarmers.map((farmer) => {
              // Distinct regions across this farmer's farms, for the Region column.
              const farmerRegions = Array.from(
                new Set(
                  farmer.farms.map((f) => f.region?.trim()).filter((r): r is string => Boolean(r))
                )
              )
              const regionLabel =
                farmerRegions.length === 0
                  ? null
                  : farmerRegions.length === 1
                    ? farmerRegions[0]
                    : `${farmerRegions[0]} +${farmerRegions.length - 1}`
              const isUnassigned = !farmer.assigned_to

              return (
                <div key={farmer.id} className="group relative transition-colors hover:bg-accent/5">
                  {/* The whole row navigates to the farmer detail page. An overlay
                      link (rather than wrapping the row) lets the Paid toggle stay
                      clickable without nesting a <button> inside an <a>. */}
                  <Link
                    href={`/consultant/farmers/${farmer.id}`}
                    aria-label={`View ${farmer.full_name || 'farmer'} details`}
                    className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  />

                  {/* Desktop: aligned columns */}
                  <div className="hidden grid-cols-[1.6fr_1.4fr_1fr_0.8fr_auto] items-center gap-4 px-4 py-3.5 sm:grid">
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="h-4 w-4 shrink-0 text-accent" />
                      <span className="truncate font-serif text-sm font-semibold leading-tight group-hover:text-accent transition-colors">
                        {farmer.full_name || 'Unknown Farmer'}
                      </span>
                      {isUnassigned && (
                        <span className="relative z-10 inline-flex items-center gap-1 rounded-full border border-[var(--nutrient-deficient-border,#f2c27a)] bg-[var(--nutrient-deficient-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--nutrient-deficient)]">
                          <UserX className="h-3 w-3" />
                          Unassigned
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 space-y-0.5 text-sm text-muted-foreground">
                      {farmer.phone && (
                        <span className="flex items-center gap-1.5 min-w-0">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate font-mono tabular-nums">{farmer.phone}</span>
                        </span>
                      )}
                      {farmer.email && (
                        <span className="flex items-center gap-1.5 min-w-0">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{farmer.email}</span>
                        </span>
                      )}
                      {!farmer.phone && !farmer.email && (
                        <span className="text-muted-foreground italic">No contact</span>
                      )}
                    </div>
                    <div className="truncate text-sm text-foreground">
                      {regionLabel || <span className="text-muted-foreground italic">Not set</span>}
                    </div>
                    <div className="flex items-center justify-end gap-1.5 text-sm tabular-nums text-foreground">
                      <Sprout className="h-3.5 w-3.5 text-accent" />
                      {farmer.farms.length}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      {/* Raised above the overlay so toggling payment never navigates. */}
                      <div className="relative z-10">
                        <PaidToggleButton
                          clientRecordId={farmer.clientRecordId}
                          isPaid={farmer.isPaid}
                          onChange={(isPaid) =>
                            updateCachedPaymentStatus(farmer.clientRecordId, isPaid)
                          }
                        />
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Mobile: stacked block */}
                  <div className="px-4 py-3.5 sm:hidden">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <User className="h-4 w-4 shrink-0 text-accent" />
                        <span className="truncate font-serif text-base font-semibold leading-tight group-hover:text-accent transition-colors">
                          {farmer.full_name || 'Unknown Farmer'}
                        </span>
                      </div>
                      <div className="relative z-10 flex-shrink-0">
                        <PaidToggleButton
                          clientRecordId={farmer.clientRecordId}
                          isPaid={farmer.isPaid}
                          onChange={(isPaid) =>
                            updateCachedPaymentStatus(farmer.clientRecordId, isPaid)
                          }
                        />
                      </div>
                    </div>
                    {isUnassigned && (
                      <span className="relative z-10 mt-1.5 inline-flex items-center gap-1 rounded-full border border-[var(--nutrient-deficient-border,#f2c27a)] bg-[var(--nutrient-deficient-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--nutrient-deficient)]">
                        <UserX className="h-3 w-3" />
                        Unassigned
                      </span>
                    )}
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <dt className="text-muted-foreground shrink-0">Region</dt>
                        <dd className="font-medium truncate">
                          {regionLabel || (
                            <span className="text-muted-foreground italic font-normal">
                              Not set
                            </span>
                          )}
                        </dd>
                      </div>
                      <div className="flex items-center gap-2">
                        <dt className="text-muted-foreground shrink-0">Farms</dt>
                        <dd className="font-medium tabular-nums">{farmer.farms.length}</dd>
                      </div>
                      {farmer.phone && (
                        <div className="flex items-center gap-2 min-w-0">
                          <dt className="text-muted-foreground shrink-0">Phone</dt>
                          <dd className="font-mono tabular-nums truncate">{farmer.phone}</dd>
                        </div>
                      )}
                      {farmer.email && (
                        <div className="flex items-center gap-2 min-w-0">
                          <dt className="text-muted-foreground shrink-0">Email</dt>
                          <dd className="font-medium truncate">{farmer.email}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
