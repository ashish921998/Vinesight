'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { getTypedSupabaseClient } from '@/lib/supabase'
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
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Users,
  Search,
  MapPin,
  Sprout,
  Filter,
  User,
  Phone,
  Mail,
  Loader2,
  ChevronRight
} from 'lucide-react'

interface FarmTriage {
  classification: string | null
  nutrient_n: number | null
  nutrient_p: number | null
  nutrient_k: number | null
}

interface Farm {
  id: number
  name: string
  region: string | null
  crop_variety: string | null
  soil_texture_class: string | null
  area: number | null
  triage: FarmTriage | null
}

interface Farmer {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  farms: Farm[]
}

type TriageFilter = 'all' | 'red' | 'yellow' | 'green'

export default function FarmerDirectoryPage() {
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [triageFilter, setTriageFilter] = useState<TriageFilter>('all')

  useEffect(() => {
    loadFarmers()
  }, [])

  const loadFarmers = async () => {
    try {
      setLoading(true)
      const supabase = await getTypedSupabaseClient()
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Not authenticated')
        return
      }

      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (!membership?.organization_id) {
        toast.error('No organization found')
        return
      }

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .eq('consultant_organization_id', membership.organization_id)

      if (profilesError) {
        console.error('Failed to load profiles:', profilesError)
        toast.error('Failed to load farmers')
        return
      }

      if (!profiles || profiles.length === 0) {
        setFarmers([])
        return
      }

      const userIds = profiles.map((p) => p.id)

      // Fetch farms for all users
      const { data: farms, error: farmsError } = await supabase
        .from('farms')
        .select('id, name, region, crop_variety, soil_texture_class, area, user_id')
        .in('user_id', userIds)

      if (farmsError) {
        console.error('Failed to load farms:', farmsError)
        toast.error('Failed to load farm data')
        return
      }

      // Fetch latest triage for all farms
      const farmIds = (farms || []).map((f) => f.id)
      let triageMap: Record<number, FarmTriage> = {}

      if (farmIds.length > 0) {
        const { data: triageData } = await supabase
          .from('petiole_triage')
          .select('farm_id, classification, nutrient_n:confidence_score')
          .in('farm_id', farmIds)
          .order('created_at', { ascending: false })

        if (triageData) {
          // Keep only the latest triage per farm
          for (const t of triageData) {
            if (!triageMap[t.farm_id]) {
              triageMap[t.farm_id] = {
                classification: t.classification,
                nutrient_n: t.nutrient_n,
                nutrient_p: null,
                nutrient_k: null
              }
            }
          }
        }
      }

      // Build farmer objects with farms grouped by user
      const farmsByUser: Record<string, Farm[]> = {}
      for (const farm of farms || []) {
        const userId = (farm as { user_id: string }).user_id
        if (!farmsByUser[userId]) farmsByUser[userId] = []
        farmsByUser[userId].push({
          id: farm.id,
          name: farm.name,
          region: farm.region,
          crop_variety: farm.crop_variety,
          soil_texture_class: farm.soil_texture_class,
          area: farm.area,
          triage: triageMap[farm.id] || null
        })
      }

      const farmerList: Farmer[] = profiles.map((p) => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        phone: p.phone,
        farms: farmsByUser[p.id] || []
      }))

      setFarmers(farmerList)
    } catch (error) {
      console.error('Failed to load farmers:', error)
      toast.error('Failed to load farmer directory')
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

      // Triage classification filter
      if (triageFilter !== 'all') {
        const hasClassification = farmer.farms.some(
          (f) => f.triage?.classification === triageFilter
        )
        if (!hasClassification) return false
      }

      return true
    })
  }, [farmers, searchQuery, regionFilter, triageFilter])

  const getClassificationBadge = (classification: string | null) => {
    const variants: Record<string, { class: string; label: string; emoji: string }> = {
      red: {
        class: 'bg-destructive/10 text-destructive border-destructive/20',
        label: 'Urgent',
        emoji: '🔴'
      },
      yellow: {
        class: 'bg-accent/10 text-accent border-accent/20',
        label: 'Watch',
        emoji: '🟡'
      },
      green: {
        class: 'bg-green-500/10 text-green-600 border-green-500/20',
        label: 'Normal',
        emoji: '🟢'
      }
    }

    if (!classification || !variants[classification]) return null

    const v = variants[classification]
    return (
      <Badge variant="outline" className={cn('text-xs', v.class)}>
        {v.emoji} {v.label}
      </Badge>
    )
  }

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
      <div>
        <h1 className="text-2xl font-bold">Farmer Directory</h1>
        <p className="text-muted-foreground">
          {farmers.length} farmer{farmers.length !== 1 ? 's' : ''} in your organization
        </p>
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

        <Select value={triageFilter} onValueChange={(v) => setTriageFilter(v as TriageFilter)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All Classifications" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classifications</SelectItem>
            <SelectItem value="red">🔴 Urgent</SelectItem>
            <SelectItem value="yellow">🟡 Watch</SelectItem>
            <SelectItem value="green">🟢 Normal</SelectItem>
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
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Sprout className="h-3 w-3" />
                    {farmer.farms.length} farm{farmer.farms.length !== 1 ? 's' : ''}
                  </Badge>
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
                              {getClassificationBadge(farm.triage?.classification ?? null)}
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

                          {/* Mini nutrient values */}
                          {farm.triage?.nutrient_n != null && (
                            <div className="flex gap-2 text-xs">
                              <span className="px-2 py-1 bg-chart-1/10 rounded">
                                N: {farm.triage.nutrient_n}%
                              </span>
                            </div>
                          )}

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
