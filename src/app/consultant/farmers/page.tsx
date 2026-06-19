'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
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
  Phone,
  Mail,
  Loader2,
  ChevronRight,
  MapPin
} from 'lucide-react'
import { getConsultantAccess, type ConsultantAccess } from '@/lib/consultant-access'
import { getFarmerClients, type FarmerWithFarms } from '@/lib/consultant-query-service'
import { InviteFarmerDialog } from '@/components/consultant/InviteFarmerDialog'
import { PaidToggleButton } from '@/components/consultant/PaidToggleButton'
import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'

// Sentinel for the "All regions" option. Uses a non-region-like value so it can't
// collide with a real farm region (e.g. a region literally named "all").
const ALL_REGIONS = '__all__'

export default function FarmerDirectoryPage() {
  const [farmers, setFarmers] = useState<FarmerWithFarms[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [regionFilter, setRegionFilter] = useState(ALL_REGIONS)
  const [access, setAccess] = useState<ConsultantAccess | null>(null)

  useEffect(() => {
    loadFarmers()
  }, [])

  const loadFarmers = async () => {
    try {
      setLoading(true)
      const currentAccess = await getConsultantAccess()
      if (!currentAccess) {
        toast.error('Not authenticated')
        return
      }
      setAccess(currentAccess)
      const data = await getFarmerClients(currentAccess)
      setFarmers(data)
      posthog.capture('consultant_farmer_list_viewed', {
        org_id: currentAccess.organizationId,
        role: currentAccess.role,
        farmer_count: data.length
      })
    } catch (error) {
      Sentry.captureException(error, { tags: { context: 'getFarmerClients' } })
      toast.error(error instanceof Error ? error.message : 'Failed to load farmer directory')
    } finally {
      setLoading(false)
    }
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

      return true
    })
  }, [farmers, searchQuery, effectiveRegion])

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
