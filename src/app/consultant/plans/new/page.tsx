'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FertilizerPlanService } from '@/lib/fertilizer-plan-service'
import { getTypedSupabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { ArrowLeft, Plus, Trash2, Loader2, Sprout, MapPin, Beaker, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Profile {
  id: string
  full_name: string | null
}

interface Farm {
  id: number
  name: string
  user_id: string | null
  region: string
  crop_variety: string
  soil_texture_class: string | null
}

interface PetioleData {
  date: string
  parameters: Record<string, number> | null
}

interface FertilizerItem {
  fertilizer_name: string
  quantity: number
  unit: string
  application_method: string
  application_frequency: number
  application_date: string
  notes: string
}

const EMPTY_ITEM: FertilizerItem = {
  fertilizer_name: '',
  quantity: 0,
  unit: 'kg',
  application_method: 'soil',
  application_frequency: 1,
  application_date: '',
  notes: ''
}

export default function NewFertilizerPlanPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [organizationId, setOrganizationId] = useState<string | null>(null)

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [farms, setFarms] = useState<Farm[]>([])

  const [selectedFarmerId, setSelectedFarmerId] = useState<string>('')
  const [selectedFarmId, setSelectedFarmId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<FertilizerItem[]>([{ ...EMPTY_ITEM }])

  const [petioleData, setPetioleData] = useState<PetioleData | null>(null)
  const [loadingPetiole, setLoadingPetiole] = useState(false)

  const selectedFarm = farms.find((f) => String(f.id) === selectedFarmId)
  const farmerFarms = farms.filter((f) => f.user_id === selectedFarmerId)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      const supabase = getTypedSupabaseClient()
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

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('consultant_organization_id', membership.organization_id)

      const fetchedProfiles = profilesData || []
      setProfiles(fetchedProfiles)

      const farmerIds = fetchedProfiles.map((p) => p.id)
      if (farmerIds.length > 0) {
        const { data: farmsData } = await supabase
          .from('farms')
          .select('id, name, user_id, region, crop_variety, soil_texture_class')
          .in('user_id', farmerIds)

        setFarms(farmsData || [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadPetioleData = useCallback(async (farmId: number) => {
    setLoadingPetiole(true)
    setPetioleData(null)
    try {
      const supabase = getTypedSupabaseClient()
      const { data } = await supabase
        .from('petiole_test_records')
        .select('date, parameters')
        .eq('farm_id', farmId)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data) {
        setPetioleData({
          date: data.date as string,
          parameters: data.parameters as Record<string, number> | null
        })
      }
    } catch (error) {
      console.error('Failed to load petiole data:', error)
    } finally {
      setLoadingPetiole(false)
    }
  }, [])

  const handleFarmerChange = (farmerId: string) => {
    setSelectedFarmerId(farmerId)
    setSelectedFarmId('')
    setPetioleData(null)
  }

  const handleFarmChange = (farmId: string) => {
    setSelectedFarmId(farmId)
    const farm = farms.find((f) => String(f.id) === farmId)
    if (farm) {
      const today = new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
      setTitle(`Fertilizer Plan - ${farm.name} - ${today}`)
      loadPetioleData(farm.id)
    }
  }

  const updateItem = (index: number, field: keyof FertilizerItem, value: string | number) => {
    setItems((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addItem = () => {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }])
  }

  const removeItem = (index: number) => {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const validate = (): boolean => {
    if (!selectedFarmId) {
      toast.error('Please select a farm')
      return false
    }
    if (!title.trim()) {
      toast.error('Please enter a plan title')
      return false
    }
    const hasValidItem = items.some((item) => item.fertilizer_name.trim() && item.quantity > 0)
    if (!hasValidItem) {
      toast.error('Add at least one fertilizer item with a name and quantity > 0')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validate() || !organizationId) return

    setSubmitting(true)
    try {
      await FertilizerPlanService.createPlan({
        farm_id: Number(selectedFarmId),
        organization_id: organizationId,
        title: title.trim(),
        notes: notes.trim() || undefined,
        items: items
          .filter((item) => item.fertilizer_name.trim())
          .map((item) => ({
            fertilizer_name: item.fertilizer_name.trim(),
            quantity: item.quantity,
            unit: item.unit || undefined,
            application_method: item.application_method || undefined,
            application_frequency: item.application_frequency || undefined,
            application_date: item.application_date || undefined,
            notes: item.notes.trim() || undefined
          }))
      })

      toast.success('Fertilizer plan created successfully')
      router.push('/consultant/triage')
    } catch (error) {
      console.error('Failed to create plan:', error)
      toast.error('Failed to create plan')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
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
          <h1 className="text-2xl font-bold">Create Fertilizer Plan</h1>
          <p className="text-muted-foreground">
            Build a manual fertilizer plan for a farmer&apos;s farm
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Farm Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Farm</CardTitle>
              <CardDescription>Choose a farmer and their farm</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="farmer">Farmer</Label>
                  <Select value={selectedFarmerId} onValueChange={handleFarmerChange}>
                    <SelectTrigger id="farmer">
                      <SelectValue placeholder="Select farmer" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name || 'Unnamed Farmer'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="farm">Farm</Label>
                  <Select
                    value={selectedFarmId}
                    onValueChange={handleFarmChange}
                    disabled={!selectedFarmerId}
                  >
                    <SelectTrigger id="farm">
                      <SelectValue
                        placeholder={selectedFarmerId ? 'Select farm' : 'Select farmer first'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {farmerFarms.map((farm) => (
                        <SelectItem key={farm.id} value={String(farm.id)}>
                          {farm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plan Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Plan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Fertilizer Plan - Farm Name - Date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="General notes about this plan..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Fertilizer Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Fertilizer Items</CardTitle>
                  <CardDescription>Add fertilizers and application details</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {items.map((item, index) => (
                <div
                  key={index}
                  className={cn('space-y-4 rounded-lg border p-4', index > 0 && 'mt-4')}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Item {index + 1}
                    </span>
                    {items.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fertilizer Name</Label>
                      <Input
                        value={item.fertilizer_name}
                        onChange={(e) => updateItem(index, 'fertilizer_name', e.target.value)}
                        placeholder="e.g. Urea, DAP, MOP"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.1"
                          value={item.quantity || ''}
                          onChange={(e) =>
                            updateItem(index, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit</Label>
                        <Select
                          value={item.unit}
                          onValueChange={(v) => updateItem(index, 'unit', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="liters">liters</SelectItem>
                            <SelectItem value="grams">grams</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Application Method</Label>
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
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.application_frequency || ''}
                        onChange={(e) =>
                          updateItem(index, 'application_frequency', parseInt(e.target.value) || 1)
                        }
                        placeholder="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Application Date</Label>
                      <Input
                        type="date"
                        value={item.application_date}
                        onChange={(e) => updateItem(index, 'application_date', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Item Notes</Label>
                    <Input
                      value={item.notes}
                      onChange={(e) => updateItem(index, 'notes', e.target.value)}
                      placeholder="Optional notes for this item"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Link href="/consultant/triage">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Create Plan
            </Button>
          </div>
        </div>

        {/* Right Column - Context Panel */}
        <div className="space-y-6">
          {/* Farm Details */}
          {selectedFarm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sprout className="h-5 w-5 text-accent" />
                  Farm Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">Region</p>
                      <p className="font-medium">{selectedFarm.region || 'Not specified'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Crop Variety</p>
                    <p className="font-medium">{selectedFarm.crop_variety || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Soil Texture</p>
                    <p className="font-medium">
                      {selectedFarm.soil_texture_class || 'Not specified'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Petiole Test Data */}
          {selectedFarmId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Beaker className="h-5 w-5 text-accent" />
                  Latest Petiole Test
                </CardTitle>
                <CardDescription>Most recent N/P/K values for reference</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPetiole ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : petioleData ? (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Test date:{' '}
                      {new Date(petioleData.date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    {petioleData.parameters ? (
                      <div className="grid grid-cols-3 gap-3">
                        {petioleData.parameters.N !== undefined && (
                          <div className="text-center p-3 bg-chart-1/10 rounded-lg">
                            <p className="text-xl font-bold text-chart-1">
                              {petioleData.parameters.N}%
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">N</p>
                          </div>
                        )}
                        {petioleData.parameters.P !== undefined && (
                          <div className="text-center p-3 bg-chart-2/10 rounded-lg">
                            <p className="text-xl font-bold text-chart-2">
                              {petioleData.parameters.P}%
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">P</p>
                          </div>
                        )}
                        {petioleData.parameters.K !== undefined && (
                          <div className="text-center p-3 bg-chart-3/10 rounded-lg">
                            <p className="text-xl font-bold text-chart-3">
                              {petioleData.parameters.K}%
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">K</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No parameter data available</p>
                    )}

                    {/* Show all other parameters */}
                    {petioleData.parameters && (
                      <div className="space-y-1">
                        {Object.entries(petioleData.parameters)
                          .filter(([key]) => !['N', 'P', 'K'].includes(key))
                          .map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{key}</span>
                              <span className="font-medium">{value}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No petiole test data found for this farm
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Empty state for right column */}
          {!selectedFarmId && (
            <Card>
              <CardContent className="p-8 text-center">
                <Sprout className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Select a farm to see details and petiole test data
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
