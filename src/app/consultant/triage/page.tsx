'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { TriageService, type Classification, type PetioleTriage } from '@/lib/triage-service'
import { FertilizerPlanService } from '@/lib/fertilizer-plan-service'
import { getTypedSupabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertTriangle,
  Eye,
  CheckCircle,
  Loader2,
  ChevronRight,
  Filter,
  Check,
  X,
  Sprout,
  User,
  MapPin,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

export default function TriageQueuePage() {
  const [triageItems, setTriageItems] = useState<PetioleTriage[]>([])
  const [loading, setLoading] = useState(true)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [bulkApproving, setBulkApproving] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PetioleTriage | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)

  const loadTriageQueue = useCallback(async (classification?: Classification) => {
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

      const items = await TriageService.getTriageQueue(membership.organization_id, {
        classification
      })

      setTriageItems(items)
    } catch (error) {
      console.error('Failed to load triage:', error)
      toast.error('Failed to load triage queue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const classification = activeTab === 'all' ? undefined : (activeTab as Classification)
    loadTriageQueue(classification)
  }, [activeTab, loadTriageQueue])

  const handleBulkApproveGreen = async () => {
    if (!organizationId) return

    try {
      setBulkApproving(true)
      const supabase = await getTypedSupabaseClient()
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Not authenticated')
        return
      }

      const result = await TriageService.bulkApproveGreen(organizationId, user.id, 50)
      toast.success(
        `Approved ${result.approved} green items${result.failed > 0 ? `, ${result.failed} failed` : ''}`
      )

      // Refresh the queue
      loadTriageQueue(activeTab === 'all' ? undefined : (activeTab as Classification))
    } catch (error) {
      console.error('Bulk approve failed:', error)
      toast.error('Failed to bulk approve')
    } finally {
      setBulkApproving(false)
    }
  }

  const handleReview = async (item: PetioleTriage, action: 'approve' | 'reject') => {
    if (!organizationId) return

    try {
      const supabase = await getTypedSupabaseClient()
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Not authenticated')
        return
      }

      await TriageService.reviewTriage(item.id, user.id, {
        approve: action === 'approve',
        reject: action === 'reject'
      })

      toast.success(action === 'approve' ? 'Plan approved' : 'Plan rejected')
      setReviewDialogOpen(false)
      setSelectedItem(null)

      // Refresh the queue
      loadTriageQueue(activeTab === 'all' ? undefined : (activeTab as Classification))
    } catch (error) {
      console.error('Review failed:', error)
      toast.error('Failed to review item')
    }
  }

  const getClassificationIcon = (classification: Classification) => {
    switch (classification) {
      case 'red':
        return <AlertTriangle className="h-5 w-5 text-destructive" />
      case 'yellow':
        return <Eye className="h-5 w-5 text-accent" />
      case 'green':
        return <CheckCircle className="h-5 w-5 text-green-600" />
    }
  }

  const getClassificationLabel = (classification: Classification) => {
    switch (classification) {
      case 'red':
        return 'Urgent'
      case 'yellow':
        return 'Watch'
      case 'green':
        return 'Normal'
    }
  }

  const getClassificationBadge = (classification: Classification) => {
    const variants = {
      red: 'bg-destructive/10 text-destructive border-destructive/20',
      yellow: 'bg-accent/10 text-accent border-accent/20',
      green: 'bg-green-500/10 text-green-600 border-green-500/20'
    }

    return (
      <Badge variant="outline" className={cn('flex items-center gap-1', variants[classification])}>
        {getClassificationIcon(classification)}
        {getClassificationLabel(classification)}
      </Badge>
    )
  }

  const greenCount = triageItems.filter((t) => t.classification === 'green').length
  const yellowCount = triageItems.filter((t) => t.classification === 'yellow').length
  const redCount = triageItems.filter((t) => t.classification === 'red').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading triage queue...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Triage Queue</h1>
          <p className="text-muted-foreground">
            Review and approve AI-classified petiole test results
          </p>
        </div>
        <div className="flex items-center gap-3">
          {greenCount > 0 && (
            <Button variant="outline" onClick={handleBulkApproveGreen} disabled={bulkApproving}>
              {bulkApproving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Approve All Green ({greenCount})
            </Button>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="flex gap-4">
        <Card className="flex-1 border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold">{redCount}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1 border-l-4 border-l-accent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Watch</p>
                <p className="text-2xl font-bold">{yellowCount}</p>
              </div>
              <Eye className="h-6 w-6 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1 border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Normal</p>
                <p className="text-2xl font-bold">{greenCount}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 md:w-auto">
          <TabsTrigger value="all">All ({triageItems.length})</TabsTrigger>
          <TabsTrigger value="red" className="text-destructive">
            Urgent ({redCount})
          </TabsTrigger>
          <TabsTrigger value="yellow" className="text-accent">
            Watch ({yellowCount})
          </TabsTrigger>
          <TabsTrigger value="green" className="text-green-600">
            Normal ({greenCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {triageItems.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">All Caught Up!</h3>
                <p className="text-muted-foreground mt-2">
                  No {activeTab !== 'all' ? activeTab : ''} items in the triage queue.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {triageItems.map((item) => (
                <Card
                  key={item.id}
                  className={cn(
                    'transition-colors cursor-pointer hover:bg-muted/50',
                    item.classification === 'red' && 'border-l-4 border-l-destructive',
                    item.classification === 'yellow' && 'border-l-4 border-l-accent',
                    item.classification === 'green' && 'border-l-4 border-l-green-500'
                  )}
                  onClick={() => {
                    setSelectedItem(item)
                    setReviewDialogOpen(true)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {getClassificationBadge(item.classification)}
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.created_at).toLocaleDateString('en-IN')}
                          </span>
                        </div>

                        <h3 className="font-semibold truncate flex items-center gap-2">
                          <Sprout className="h-4 w-4 text-accent" />
                          {item.farm_name || 'Unknown Farm'}
                        </h3>

                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {item.farmer_name || 'Unknown Farmer'}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {item.farm_region || 'Unknown Region'}
                          </span>
                        </div>

                        <p className="text-sm mt-2 line-clamp-2">{item.classification_reason}</p>

                        {/* Nutrient sparkline mini */}
                        {(item.nutrient_n !== undefined ||
                          item.nutrient_p !== undefined ||
                          item.nutrient_k !== undefined) && (
                          <div className="flex gap-3 mt-3 text-xs">
                            {item.nutrient_n !== undefined && (
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-chart-1" />
                                N: {item.nutrient_n}%
                              </span>
                            )}
                            {item.nutrient_p !== undefined && (
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-chart-2" />
                                P: {item.nutrient_p}%
                              </span>
                            )}
                            {item.nutrient_k !== undefined && (
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-chart-3" />
                                K: {item.nutrient_k}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {item.ai_draft_plan_id && <Badge variant="secondary">AI Draft</Badge>}
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedItem && getClassificationIcon(selectedItem.classification)}
              Review {selectedItem?.farm_name}
            </DialogTitle>
            <DialogDescription>{selectedItem?.classification_reason}</DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              {/* Farm Details */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Farmer</p>
                      <p className="font-medium">{selectedItem.farmer_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Region</p>
                      <p className="font-medium">{selectedItem.farm_region}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Test Date</p>
                      <p className="font-medium">
                        {selectedItem.latest_petiole_date
                          ? new Date(selectedItem.latest_petiole_date).toLocaleDateString('en-IN')
                          : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Confidence</p>
                      <p className="font-medium">
                        {Math.round((selectedItem.confidence_score || 0) * 100)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Nutrient Values */}
              {(selectedItem.nutrient_n !== undefined ||
                selectedItem.nutrient_p !== undefined ||
                selectedItem.nutrient_k !== undefined) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Nutrient Values</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="grid grid-cols-3 gap-4">
                      {selectedItem.nutrient_n !== undefined && (
                        <div className="text-center p-3 bg-chart-1/10 rounded-lg">
                          <p className="text-2xl font-bold text-chart-1">
                            {selectedItem.nutrient_n}%
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Nitrogen (N)</p>
                        </div>
                      )}
                      {selectedItem.nutrient_p !== undefined && (
                        <div className="text-center p-3 bg-chart-2/10 rounded-lg">
                          <p className="text-2xl font-bold text-chart-2">
                            {selectedItem.nutrient_p}%
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Phosphorus (P)</p>
                        </div>
                      )}
                      {selectedItem.nutrient_k !== undefined && (
                        <div className="text-center p-3 bg-chart-3/10 rounded-lg">
                          <p className="text-2xl font-bold text-chart-3">
                            {selectedItem.nutrient_k}%
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Potassium (K)</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AI Draft Notice */}
              {selectedItem.ai_draft_plan_id ? (
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sprout className="h-5 w-5 text-accent mt-0.5" />
                    <div>
                      <p className="font-medium">AI Draft Plan Ready</p>
                      <p className="text-sm text-muted-foreground">
                        A fertilizer plan has been auto-drafted based on this classification.
                      </p>
                      <Link
                        href={`/consultant/farmers/${selectedItem.farmer_id}/farms/${selectedItem.farm_id}?plan=${selectedItem.ai_draft_plan_id}`}
                        className="text-sm text-accent hover:underline mt-2 inline-block"
                      >
                        View Plan Details →
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    No AI draft available. You can manually create a plan after reviewing.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedItem && handleReview(selectedItem, 'reject')}
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button onClick={() => selectedItem && handleReview(selectedItem, 'approve')}>
              <Check className="h-4 w-4 mr-2" />
              Approve Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
