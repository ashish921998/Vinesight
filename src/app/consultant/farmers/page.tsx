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
  MapPin,
  Sprout,
  User,
  Phone,
  Mail,
  Loader2,
  ChevronRight
} from 'lucide-react'
import { getConsultantAccess, type ConsultantAccess } from '@/lib/consultant-access'
import { getFarmerClients, type FarmerWithFarms } from '@/lib/consultant-query-service'
import { InviteFarmerDialog } from '@/components/consultant/InviteFarmerDialog'
import { PaidToggleButton } from '@/components/consultant/PaidToggleButton'
import posthog from 'posthog-js'

export default function FarmerDirectoryPage() {
  const [farmers, setFarmers] = useState<FarmerWithFarms[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [regionFilter, setRegionFilter] = useState<string>('all')
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
      console.error('Failed to load farmers:', error)
      posthog.captureException(error, { context: 'getFarmerClients' })
      toast.error(error instanceof Error ? error.message : 'Failed to load farmer directory')
    } finally {
      setLoading(false)
    }
  }

  // Extract unique regions
  const regions = useMemo(() => {
    const regionSet = new Set<string>()
    for (const farmer of farmers) {
      for (const farm of farmer.farms) {
        if (farm.region) regionSet.add(farm.region)
      }
    }
    return Array.from(regionSet).sort()
  }, [farmers])

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

      // Region filter
      if (regionFilter !== 'all') {
        const hasRegion = farmer.farms.some((f) => f.region === regionFilter)
        if (!hasRegion) return false
      }

      return true
    })
  }, [farmers, searchQuery, regionFilter])

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

        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All Regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {regions.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <div className="space-y-4">
          {filteredFarmers.map((farmer) => (
            <Card key={farmer.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-accent" />
                      <Link href={`/consultant/farmers/${farmer.id}`} className="hover:underline">
                        {farmer.full_name || 'Unknown Farmer'}
                      </Link>
                    </CardTitle>
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
                  <div className="flex items-center gap-2">
                    <PaidToggleButton
                      clientRecordId={farmer.clientRecordId}
                      isPaid={farmer.isPaid}
                    />
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Sprout className="h-3 w-3" />
                      {farmer.farms.length} farm{farmer.farms.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              {farmer.farms.length > 0 && (
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {farmer.farms.map((farm) => (
                      <Link
                        key={farm.id}
                        href={`/consultant/farmers/${farmer.id}/farms/${farm.id}`}
                        className="block"
                      >
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                          <Sprout className="h-4 w-4 text-accent flex-shrink-0" />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{farm.name}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
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
                          </div>

                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
