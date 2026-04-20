'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FertilizerPlanService } from '@/lib/fertilizer-plan-service'
import { getTypedSupabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  ArrowLeft,
  Sparkles,
  Plus,
  Trash2,
  Loader2,
  Check,
  RefreshCw,
  AlertTriangle,
  Sprout,
  MapPin,
  Beaker
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface FarmDetails {
  id: number
  name: string
  region: string
  soil_texture_class: string | null
  crop_variety: string
  area: number
  date_of_pruning: string | null
  user_id: string | null
}

interface PlanItem {
  fertilizer_name: string
  quantity: number
  unit: string
  application_method: string
  application_frequency: number
  notes: string
}

interface AIDraft {
  title: string
  reasoning: string
  items: PlanItem[]
  warnings: string[]
  confidence: number
}

function extractNPK(params: Record<string, any>): {
  n: number | null
  p: number | null
  k: number | null
} {
  const get = (keys: string[]) => {
    for (const key of keys) {
      const val = params[key]
      if (val !== undefined && val !== null) return typeof val === 'number' ? val : parseFloat(val)
    }
    return null
  }
  return {
    n: get(['N', 'Nitrogen', 'nitrogen', 'n']),
    p: get(['P', 'Phosphorus', 'phosphorus', 'p']),
    k: get(['K', 'Potassium', 'potassium', 'k'])
  }
}

export default function AIPlanBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const farmId = parseInt(params.farmId as string)

  const [farm, setFarm] = useState<FarmDetails | null>(null)
  const [farmerName, setFarmerName] = useState<string>('')
  const [organizationId, setOrganizationId] = useState<string>('')
  const [latestPTO, setLatestPTO] = useState<{
    date: string
    n: number | null
    p: number | null
    k: number | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  // Draft state
  const [draft, setDraft] = useState<AIDraft | null>(null)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<PlanItem[]>([])

  useEffect(() => {
    loadFarmData()
  }, [farmId])

  const loadFarmData = async () => {
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

      // Get farm
      const { data: farmData } = await supabase
        .from('farms')
        .select(
          'id, name, region, soil_texture_class, crop_variety, area, date_of_pruning, user_id'
        )
        .eq('id', farmId)
        .single()

      if (!farmData) {
        toast.error('Farm not found')
        return
      }

      setFarm(farmData as FarmDetails)

      // Get farmer name
      if (farmData.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', farmData.user_id)
          .single()

        if (profile?.full_name) setFarmerName(profile.full_name)
      }

      // Get latest PTO
      const { data: ptoData } = await supabase
        .from('petiole_test_records')
        .select('date, parameters')
        .eq('farm_id', farmId)
        .order('date', { ascending: false })
        .limit(1)

      if (ptoData && ptoData.length > 0) {
        const npk = extractNPK((ptoData[0].parameters || {}) as Record<string, any>)
        setLatestPTO({ date: ptoData[0].date, ...npk })
      }
    } catch (error) {
      console.error('Failed to load farm:', error)
      toast.error('Failed to load farm data')
    } finally {
      setLoading(false)
    }
  }

  const generateDraft = async () => {
    if (!farm) return

    try {
      setGenerating(true)

      const response = await fetch('/api/ai/fertilizer-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmId: farm.id, organizationId })
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to generate plan')
      }

      const data: AIDraft = await response.json()
      setDraft(data)
      setTitle(data.title)
      setNotes(data.reasoning)
      setItems(
        data.items.map((item) => ({
          fertilizer_name: item.fertilizer_name,
          quantity: item.quantity,
          unit: item.unit || 'kg',
          application_method: item.application_method || 'soil',
          application_frequency: item.application_frequency || 1,
          notes: item.notes || ''
        }))
      )
      toast.success('AI draft generated!')
    } catch (error) {
      console.error('Generation failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate draft')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!farm || items.length === 0) return

    const validItems = items.filter((i) => i.fertilizer_name.trim() && i.quantity > 0)
    if (validItems.length === 0) {
      toast.error('At least one valid item is required')
      return
    }

    try {
      setSaving(true)
      await FertilizerPlanService.createPlan({
        farm_id: farm.id,
        organization_id: organizationId,
        title: title || `AI Plan - ${farm.name}`,
        notes: notes || undefined,
        items: validItems.map((item) => ({
          fertilizer_name: item.fertilizer_name,
          quantity: item.quantity,
          unit: item.unit,
          application_method: item.application_method,
          application_frequency: item.application_frequency,
          notes: item.notes || undefined
        }))
      })

      toast.success('Plan saved successfully!')
      router.push('/consultant/triage')
    } catch (error) {
      console.error('Save failed:', error)
      toast.error('Failed to save plan')
    } finally {
      setSaving(false)
    }
  }

  const updateItem = (index: number, field: keyof PlanItem, value: string | number) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        fertilizer_name: '',
        quantity: 0,
        unit: 'kg',
        application_method: 'soil',
        application_frequency: 1,
        notes: ''
      }
    ])
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading farm data...</p>
        </div>
      </div>
    )
  }

  if (!farm) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Farm not found</p>
        <Link href="/consultant/farmers">
          <Button variant="outline" className="mt-4">
            Back to Farmers
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/consultant/farmers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" />
            AI-Assisted Plan Builder
          </h1>
          <p className="text-muted-foreground">
            {farm.name} • {farmerName}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Generate Button */}
          {!draft && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center space-y-4">
                <Sparkles className="h-12 w-12 text-accent mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold">Generate AI Draft</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    AI will analyze petiole tests, soil data, and season stage to recommend a
                    fertilizer plan.
                  </p>
                </div>
                <Button onClick={generateDraft} disabled={generating} size="lg">
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing farm data...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate AI Draft
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Draft Form */}
          {draft && (
            <>
              {/* AI Reasoning */}
              <Card className="bg-accent/5 border-accent/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    AI Analysis
                    <Badge variant="secondary" className="ml-auto">
                      {Math.round(draft.confidence * 100)}% confidence
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{draft.reasoning}</p>
                </CardContent>
              </Card>

              {/* Warnings */}
              {draft.warnings && draft.warnings.length > 0 && (
                <div className="space-y-2">
                  {draft.warnings.map((warning, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg"
                    >
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{warning}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Plan Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              {/* Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Fertilizer Items</Label>
                  <Button variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>

                {items.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="grid gap-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Fertilizer</Label>
                            <Input
                              value={item.fertilizer_name}
                              onChange={(e) => updateItem(index, 'fertilizer_name', e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2">
                            <div className="space-y-1 flex-1">
                              <Label className="text-xs">Qty</Label>
                              <Input
                                type="number"
                                value={item.quantity || ''}
                                onChange={(e) =>
                                  updateItem(index, 'quantity', parseFloat(e.target.value) || 0)
                                }
                              />
                            </div>
                            <div className="space-y-1 w-24">
                              <Label className="text-xs">Unit</Label>
                              <Select
                                value={item.unit}
                                onValueChange={(v) => updateItem(index, 'unit', v)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="kg">kg</SelectItem>
                                  <SelectItem value="liters">L</SelectItem>
                                  <SelectItem value="grams">g</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Method</Label>
                            <Select
                              value={item.application_method}
                              onValueChange={(v) => updateItem(index, 'application_method', v)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="soil">Soil</SelectItem>
                                <SelectItem value="foliar">Foliar</SelectItem>
                                <SelectItem value="fertigation">Fertigation</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Frequency</Label>
                            <Input
                              type="number"
                              value={item.application_frequency || ''}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  'application_frequency',
                                  parseInt(e.target.value) || 1
                                )
                              }
                            />
                          </div>
                          <div className="flex items-end">
                            {items.length > 1 && (
                              <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {item.notes && (
                          <div className="space-y-1">
                            <Label className="text-xs">Notes</Label>
                            <Input
                              value={item.notes}
                              onChange={(e) => updateItem(index, 'notes', e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Plan Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Approve & Save
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={generateDraft} disabled={generating}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
                <Link href="/consultant/farmers" className="ml-auto">
                  <Button variant="ghost">Cancel</Button>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Right: Farm Context Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sprout className="h-4 w-4 text-accent" />
                Farm Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Farm</dt>
                  <dd className="font-medium">{farm.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Farmer</dt>
                  <dd className="font-medium">{farmerName || 'Unknown'}</dd>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <dt className="text-muted-foreground">Region</dt>
                  <dd className="font-medium ml-auto">{farm.region}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Crop Variety</dt>
                  <dd className="font-medium">{farm.crop_variety}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Soil Type</dt>
                  <dd className="font-medium">{farm.soil_texture_class || 'Unknown'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Area</dt>
                  <dd className="font-medium">{farm.area} acres</dd>
                </div>
                {farm.date_of_pruning && (
                  <div>
                    <dt className="text-muted-foreground">Pruning Date</dt>
                    <dd className="font-medium">
                      {new Date(farm.date_of_pruning).toLocaleDateString('en-IN')}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {latestPTO && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Beaker className="h-4 w-4 text-accent" />
                  Latest Petiole Test
                </CardTitle>
                <CardDescription>
                  {new Date(latestPTO.date).toLocaleDateString('en-IN')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {latestPTO.n !== null && (
                    <div className="text-center p-2 bg-chart-1/10 rounded-lg">
                      <p className="text-lg font-bold text-chart-1">{latestPTO.n}%</p>
                      <p className="text-xs text-muted-foreground">N</p>
                    </div>
                  )}
                  {latestPTO.p !== null && (
                    <div className="text-center p-2 bg-chart-2/10 rounded-lg">
                      <p className="text-lg font-bold text-chart-2">{latestPTO.p}%</p>
                      <p className="text-xs text-muted-foreground">P</p>
                    </div>
                  )}
                  {latestPTO.k !== null && (
                    <div className="text-center p-2 bg-chart-3/10 rounded-lg">
                      <p className="text-lg font-bold text-chart-3">{latestPTO.k}%</p>
                      <p className="text-xs text-muted-foreground">K</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
