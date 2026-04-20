'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FertilizerPlanService, type FertilizerPlanWithItems } from '@/lib/fertilizer-plan-service'
import { ClusterService } from '@/lib/cluster-service'
import { getTypedSupabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Copy, Check, Loader2, MapPin, Sprout, Users, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface SimilarFarm {
  id: number
  name: string
  farmer_name: string
  region: string
  soil_texture_class: string
  area: number | null
  matchType: ('soil' | 'region')[]
}

interface SourceFarm {
  id: number
  name: string
  region: string
  soil_texture_class: string | null
  crop_variety: string
  area: number
}

export default function CopyPlanPage() {
  const params = useParams()
  const router = useRouter()
  const planId = params.planId as string

  const [plan, setPlan] = useState<FertilizerPlanWithItems | null>(null)
  const [sourceFarm, setSourceFarm] = useState<SourceFarm | null>(null)
  const [similarFarms, setSimilarFarms] = useState<SimilarFarm[]>([])
  const [selectedFarms, setSelectedFarms] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState(false)
  const [copyProgress, setCopyProgress] = useState({ done: 0, total: 0 })
  const [copyComplete, setCopyComplete] = useState(false)
  const [organizationId, setOrganizationId] = useState<string>('')

  // Filter toggles
  const [filterSoil, setFilterSoil] = useState(true)
  const [filterRegion, setFilterRegion] = useState(false)

  useEffect(() => {
    loadData()
  }, [planId])

  const loadData = async () => {
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

      setOrganizationId(membership.organization_id)

      // Get the source plan
      const planData = await FertilizerPlanService.getPlanById(planId)
      if (!planData) {
        toast.error('Plan not found')
        return
      }
      setPlan(planData)

      // Get source farm details
      const { data: farm } = await supabase
        .from('farms')
        .select('id, name, region, soil_texture_class, crop_variety, area')
        .eq('id', planData.farm_id)
        .single()

      if (farm) {
        setSourceFarm(farm as SourceFarm)
      }

      // Find similar farms
      await loadSimilarFarms(planData.farm_id, membership.organization_id)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load plan data')
    } finally {
      setLoading(false)
    }
  }

  const loadSimilarFarms = async (farmId: number, orgId: string) => {
    try {
      const [soilMatches, regionMatches] = await Promise.all([
        ClusterService.findSimilarFarms(farmId, orgId, {
          sameSoilType: true,
          maxResults: 30
        }),
        ClusterService.findSimilarFarms(farmId, orgId, {
          sameRegion: true,
          maxResults: 30
        })
      ])

      // Merge and dedupe
      const farmMap = new Map<number, SimilarFarm>()

      soilMatches.forEach((f) => {
        farmMap.set(f.id, { ...f, matchType: ['soil'] })
      })

      regionMatches.forEach((f) => {
        const existing = farmMap.get(f.id)
        if (existing) {
          existing.matchType.push('region')
        } else {
          farmMap.set(f.id, { ...f, matchType: ['region'] })
        }
      })

      setSimilarFarms(Array.from(farmMap.values()))
    } catch {
      // Tables may not exist yet
    }
  }

  const filteredFarms = similarFarms.filter((farm) => {
    if (!filterSoil && !filterRegion) return true
    if (filterSoil && filterRegion)
      return farm.matchType.includes('soil') && farm.matchType.includes('region')
    if (filterSoil) return farm.matchType.includes('soil')
    if (filterRegion) return farm.matchType.includes('region')
    return true
  })

  const toggleFarm = (farmId: number) => {
    setSelectedFarms((prev) =>
      prev.includes(farmId) ? prev.filter((id) => id !== farmId) : [...prev, farmId]
    )
  }

  const selectAll = () => {
    setSelectedFarms(filteredFarms.map((f) => f.id))
  }

  const deselectAll = () => {
    setSelectedFarms([])
  }

  const handleCopy = async () => {
    if (!plan || selectedFarms.length === 0) return

    try {
      setCopying(true)
      setCopyProgress({ done: 0, total: selectedFarms.length })

      for (let i = 0; i < selectedFarms.length; i++) {
        await FertilizerPlanService.createPlan({
          farm_id: selectedFarms[i],
          organization_id: organizationId,
          title: `${plan.title} (copied)`,
          notes:
            `Copied from plan for ${sourceFarm?.name || 'unknown farm'}. ${plan.notes || ''}`.trim(),
          items: plan.items.map((item) => ({
            fertilizer_name: item.fertilizer_name,
            quantity: item.quantity,
            unit: item.unit,
            application_method: item.application_method || undefined,
            application_frequency: item.application_frequency,
            notes: item.notes || undefined
          }))
        })
        setCopyProgress({ done: i + 1, total: selectedFarms.length })
      }

      setCopyComplete(true)
      toast.success(`Plan copied to ${selectedFarms.length} farms`)
    } catch (error) {
      console.error('Copy failed:', error)
      toast.error('Failed to copy plan')
    } finally {
      setCopying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading plan data...</p>
        </div>
      </div>
    )
  }

  if (copyComplete) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
          <h2 className="text-2xl font-bold">Plan Copied!</h2>
          <p className="text-muted-foreground">
            Successfully copied the fertilizer plan to {selectedFarms.length} farms.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/consultant/triage">
              <Button>Back to Triage</Button>
            </Link>
            <Link href="/consultant/farmers">
              <Button variant="outline">View Farmers</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Plan not found</p>
        <Link href="/consultant/triage">
          <Button variant="outline" className="mt-4">
            Back to Triage
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/consultant/triage">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Copy Plan to Similar Farms</h1>
          <p className="text-muted-foreground">
            Apply this fertilizer plan to farms with matching profiles
          </p>
        </div>
      </div>

      {/* Source Plan Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sprout className="h-4 w-4 text-accent" />
            Source Plan: {plan.title}
          </CardTitle>
          <CardDescription>
            {sourceFarm?.name} • {sourceFarm?.region} • {sourceFarm?.soil_texture_class} soil •{' '}
            {sourceFarm?.crop_variety}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {plan.items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                <span className="font-medium flex-1">{item.fertilizer_name}</span>
                <span className="text-muted-foreground">
                  {item.quantity} {item.unit}
                </span>
                {item.application_method && (
                  <Badge variant="outline" className="text-xs">
                    {item.application_method}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filter Options */}
      <div className="flex items-center gap-6">
        <span className="text-sm font-medium">Match by:</span>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={filterSoil} onCheckedChange={(c) => setFilterSoil(!!c)} />
          Same Soil Type
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={filterRegion} onCheckedChange={(c) => setFilterRegion(!!c)} />
          Same Region
        </label>
        <div className="flex-1" />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>
            Deselect All
          </Button>
        </div>
      </div>

      {/* Similar Farms List */}
      {filteredFarms.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No Similar Farms Found</h3>
            <p className="text-muted-foreground mt-2">Try adjusting the match filters above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredFarms.map((farm) => (
            <Card
              key={farm.id}
              className={cn(
                'transition-colors cursor-pointer',
                selectedFarms.includes(farm.id) ? 'border-accent bg-accent/5' : 'hover:bg-muted/50'
              )}
              onClick={() => toggleFarm(farm.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectedFarms.includes(farm.id)}
                    onCheckedChange={() => toggleFarm(farm.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Sprout className="h-4 w-4 text-accent flex-shrink-0" />
                      <span className="font-medium truncate">{farm.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{farm.farmer_name}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {farm.region}
                  </div>
                  <span className="text-sm text-muted-foreground">{farm.soil_texture_class}</span>
                  {farm.area && (
                    <span className="text-sm text-muted-foreground">{farm.area} acres</span>
                  )}
                  <div className="flex gap-1">
                    {farm.matchType.includes('soil') && (
                      <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                        Same Soil
                      </Badge>
                    )}
                    {farm.matchType.includes('region') && (
                      <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-600">
                        Same Region
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Bar */}
      {selectedFarms.length > 0 && (
        <div className="sticky bottom-4 flex items-center justify-between bg-card border rounded-lg p-4 shadow-lg">
          <span className="text-sm font-medium">
            {selectedFarms.length} farm{selectedFarms.length !== 1 ? 's' : ''} selected
          </span>
          {copying ? (
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">
                Copying... {copyProgress.done}/{copyProgress.total}
              </span>
            </div>
          ) : (
            <Button onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Plan to {selectedFarms.length} Farm{selectedFarms.length !== 1 ? 's' : ''}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
