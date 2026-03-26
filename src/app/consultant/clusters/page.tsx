'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClusterService, type FarmCluster } from '@/lib/cluster-service'
import { TriageService } from '@/lib/triage-service'
import { FertilizerPlanService } from '@/lib/fertilizer-plan-service'
import { getTypedSupabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Users,
  MapPin,
  AlertTriangle,
  Sprout,
  ChevronRight,
  Loader2,
  Beaker,
  Check,
  ArrowRight,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function ClustersPage() {
  const [clusters, setClusters] = useState<FarmCluster[]>([])
  const [loading, setLoading] = useState(true)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [selectedFarms, setSelectedFarms] = useState<number[]>([])
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    loadClusters()
  }, [])

  const loadClusters = async () => {
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
      const clusterData = await ClusterService.getClusters(membership.organization_id, { days: 30 })
      setClusters(clusterData)
    } catch (error) {
      console.error('Failed to load clusters:', error)
      toast.error('Failed to load farm clusters')
    } finally {
      setLoading(false)
    }
  }

  const toggleFarmSelection = (farmId: number) => {
    setSelectedFarms((prev) =>
      prev.includes(farmId) ? prev.filter((id) => id !== farmId) : [...prev, farmId]
    )
  }

  const selectAllInCluster = (cluster: FarmCluster) => {
    const allSelected = cluster.farms.every((f) => selectedFarms.includes(f.id))
    if (allSelected) {
      setSelectedFarms((prev) => prev.filter((id) => !cluster.farms.some((f) => f.id === id)))
    } else {
      setSelectedFarms((prev) => [...new Set([...prev, ...cluster.farms.map((f) => f.id)])])
    }
  }

  const handleBulkApply = async () => {
    if (!organizationId || selectedFarms.length === 0) return

    try {
      setApplying(true)
      const supabase = await getTypedSupabaseClient()
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Not authenticated')
        return
      }

      // Create a plan for each selected farm
      const planTitle = `Bulk Plan - ${new Date().toLocaleDateString('en-IN')} - ${selectedFarms.length} farms`

      for (const farmId of selectedFarms) {
        await FertilizerPlanService.createPlan({
          farm_id: farmId,
          organization_id: organizationId,
          title: planTitle,
          notes: 'Created via bulk cluster operation',
          items: [
            {
              fertilizer_name: 'Urea',
              quantity: 50,
              unit: 'kg',
              application_method: 'soil',
              application_frequency: 1,
              notes: 'Bulk application for nutrient deficiency'
            }
          ]
        })
      }

      toast.success(`Created plans for ${selectedFarms.length} farms`)
      setBulkDialogOpen(false)
      setSelectedFarms([])
    } catch (error) {
      console.error('Bulk apply failed:', error)
      toast.error('Failed to create bulk plans')
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Analyzing farm clusters...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cluster Intelligence</h1>
          <p className="text-muted-foreground">
            {clusters.length > 0
              ? `${clusters.length} farm clusters detected with similar nutrient patterns`
              : 'No clusters detected in the last 30 days'}
          </p>
        </div>
        {selectedFarms.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {selectedFarms.length} farms selected
            </span>
            <Button onClick={() => setBulkDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Bulk Plan
            </Button>
          </div>
        )}
      </div>

      {/* No Clusters State */}
      {clusters.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No Clusters Detected</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Farm clusters appear when 3+ farms in the same region with similar soil types show the
              same nutrient deficiency pattern within 30 days.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {clusters.map((cluster, index) => (
            <Card
              key={index}
              className={cn(
                'overflow-hidden',
                cluster.classification === 'red' && 'border-l-4 border-l-destructive',
                cluster.classification === 'yellow' && 'border-l-4 border-l-accent'
              )}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge
                        variant={cluster.classification === 'red' ? 'destructive' : 'secondary'}
                        className="flex items-center gap-1"
                      >
                        {cluster.classification === 'red' ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <Beaker className="h-3 w-3" />
                        )}
                        {cluster.classification === 'red' ? 'Urgent' : 'Watch'}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {cluster.farm_count} farms
                      </Badge>
                    </div>

                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-accent" />
                      {cluster.region}
                    </CardTitle>

                    <CardDescription className="mt-1">
                      {cluster.soil_type} soil • {cluster.primary_deficiency} deficiency
                    </CardDescription>
                  </div>

                  <Button variant="outline" size="sm" onClick={() => selectAllInCluster(cluster)}>
                    {cluster.farms.every((f) => selectedFarms.includes(f.id)) ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Selected
                      </>
                    ) : (
                      'Select All'
                    )}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <Accordion type="single" collapsible>
                  <AccordionItem value="farms">
                    <AccordionTrigger className="text-sm">
                      View {cluster.farm_count} Affected Farms
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 mt-2">
                        {cluster.farms.map((farm) => (
                          <div
                            key={farm.id}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                              selectedFarms.includes(farm.id)
                                ? 'bg-accent/10 border-accent'
                                : 'bg-muted/50 hover:bg-muted'
                            )}
                          >
                            <Checkbox
                              checked={selectedFarms.includes(farm.id)}
                              onCheckedChange={() => toggleFarmSelection(farm.id)}
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Sprout className="h-4 w-4 text-accent flex-shrink-0" />
                                <span className="font-medium truncate">{farm.name}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{farm.farmer_name}</p>
                            </div>

                            <div className="flex items-center gap-3 text-sm">
                              {(farm.nutrient_n !== undefined ||
                                farm.nutrient_p !== undefined ||
                                farm.nutrient_k !== undefined) && (
                                <div className="flex gap-2 text-xs">
                                  {farm.nutrient_n !== undefined && (
                                    <span className="px-2 py-1 bg-chart-1/10 rounded">
                                      N: {farm.nutrient_n}%
                                    </span>
                                  )}
                                  {farm.nutrient_p !== undefined && (
                                    <span className="px-2 py-1 bg-chart-2/10 rounded">
                                      P: {farm.nutrient_p}%
                                    </span>
                                  )}
                                  {farm.nutrient_k !== undefined && (
                                    <span className="px-2 py-1 bg-chart-3/10 rounded">
                                      K: {farm.nutrient_k}%
                                    </span>
                                  )}
                                </div>
                              )}

                              <Link href={`/clients/${farm.id}`}>
                                <Button variant="ghost" size="icon">
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bulk Apply Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Bulk Plan</DialogTitle>
            <DialogDescription>
              Create fertilizer plans for {selectedFarms.length} selected farms.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              This will create a plan for each selected farm with standardized fertilizer
              recommendations. You can customize individual plans after creation.
            </p>

            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm font-medium">Selected Farms:</p>
              <p className="text-2xl font-bold">{selectedFarms.length}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkApply} disabled={applying}>
              {applying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Plans...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create {selectedFarms.length} Plans
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
