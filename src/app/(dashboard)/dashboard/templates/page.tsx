'use client'

import { useEffect, useState, useCallback } from 'react'
import { TemplateService, type PlanTemplate, type SeasonStage } from '@/lib/template-service'
import type { Json } from '@/types/database'

type TemplateItem = {
  fertilizer_name: string
  base_quantity: number
  unit: string
  method: string
  frequency: number
}

function parseTemplateItems(items: Json): TemplateItem[] {
  if (Array.isArray(items)) return items as unknown as TemplateItem[]
  return []
}
import { getTypedSupabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Plus,
  Edit,
  Copy,
  Trash2,
  Loader2,
  Sprout,
  FileText,
  Beaker,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const SEASON_STAGES: { value: SeasonStage; label: string }[] = [
  { value: 'dormancy', label: 'Dormancy' },
  { value: 'pruning', label: 'Pruning / Bud Break' },
  { value: 'flowering', label: 'Flowering / Fruit Set' },
  { value: 'fruiting', label: 'Fruiting / Berry Development' },
  { value: 'harvest', label: 'Harvest' },
  { value: 'post_harvest', label: 'Post-Harvest' }
]

const SOIL_TYPES = ['sandy', 'clay', 'loam', 'sandy_loam', 'clay_loam', 'silt']

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<PlanTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PlanTemplate | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    season_stage: 'pruning' as SeasonStage,
    soil_type: '',
    items: [{ fertilizer_name: '', base_quantity: 0, unit: 'kg', method: 'soil', frequency: 1 }]
  })

  const loadTemplates = useCallback(async () => {
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
      const templates = await TemplateService.getTemplates(membership.organization_id)
      setTemplates(templates)
    } catch (error) {
      console.error('Failed to load templates:', error)
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const handleSaveTemplate = async () => {
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

      // Validate
      if (!formData.name.trim()) {
        toast.error('Template name is required')
        return
      }

      const validItems = formData.items.filter(
        (item) => item.fertilizer_name.trim() && item.base_quantity > 0
      )
      if (validItems.length === 0) {
        toast.error('At least one valid fertilizer item is required')
        return
      }

      if (editingTemplate) {
        await TemplateService.updateTemplate(editingTemplate.id, {
          name: formData.name,
          season_stage: formData.season_stage,
          soil_type: formData.soil_type || undefined,
          template_items: validItems
        })
        toast.success('Template updated')
      } else {
        await TemplateService.createTemplate(organizationId, user.id, {
          name: formData.name,
          season_stage: formData.season_stage,
          soil_type: formData.soil_type || undefined,
          trigger_conditions: {},
          template_items: validItems
        })
        toast.success('Template created')
      }

      setDialogOpen(false)
      setEditingTemplate(null)
      resetForm()
      loadTemplates()
    } catch (error) {
      console.error('Failed to save template:', error)
      toast.error('Failed to save template')
    }
  }

  const handleDuplicate = async (template: PlanTemplate) => {
    try {
      await TemplateService.duplicateTemplate(template.id, `${template.name} (Copy)`)
      toast.success('Template duplicated')
      loadTemplates()
    } catch (error) {
      console.error('Failed to duplicate:', error)
      toast.error('Failed to duplicate template')
    }
  }

  const handleDelete = async (templateId: string) => {
    try {
      await TemplateService.deactivateTemplate(templateId)
      toast.success('Template deactivated')
      loadTemplates()
    } catch (error) {
      console.error('Failed to deactivate:', error)
      toast.error('Failed to deactivate template')
    }
  }

  const openEditDialog = (template: PlanTemplate) => {
    setEditingTemplate(template)
    const items = parseTemplateItems(template.template_items)
    setFormData({
      name: template.name,
      season_stage: template.season_stage as SeasonStage,
      soil_type: template.soil_type || '',
      items:
        items.length > 0
          ? items
          : [{ fertilizer_name: '', base_quantity: 0, unit: 'kg', method: 'soil', frequency: 1 }]
    })
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingTemplate(null)
    resetForm()
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      season_stage: 'pruning',
      soil_type: '',
      items: [{ fertilizer_name: '', base_quantity: 0, unit: 'kg', method: 'soil', frequency: 1 }]
    })
  }

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { fertilizer_name: '', base_quantity: 0, unit: 'kg', method: 'soil', frequency: 1 }
      ]
    }))
  }

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateItem = (index: number, field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    )
  }

  const activeTemplates = templates.filter((t) => t.is_active)
  const inactiveTemplates = templates.filter((t) => !t.is_active)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Plan Templates</h1>
          <p className="text-muted-foreground">
            {activeTemplates.length} active templates for auto-drafting fertilizer plans
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Templates</p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeTemplates.length}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Season Stages Covered</p>
                <p className="text-2xl font-bold">
                  {new Set(activeTemplates.map((t) => t.season_stage)).size}/6
                </p>
              </div>
              <Sprout className="h-6 w-6 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Soil Types</p>
                <p className="text-2xl font-bold">
                  {new Set(activeTemplates.filter((t) => t.soil_type).map((t) => t.soil_type)).size}
                </p>
              </div>
              <Beaker className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates List */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({activeTemplates.length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({inactiveTemplates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {activeTemplates.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No Active Templates</h3>
                <p className="text-muted-foreground mt-2">
                  Create templates to enable auto-drafting for routine cases.
                </p>
                <Button onClick={openCreateDialog} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activeTemplates.map((template) => (
                <Card key={template.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription>
                          {SEASON_STAGES.find((s) => s.value === template.season_stage)?.label}
                          {template.soil_type && ` • ${template.soil_type}`}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicate(template)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {parseTemplateItems(template.template_items).map(
                        (item: TemplateItem, i: number) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-sm p-2 bg-muted rounded"
                          >
                            <Badge variant="secondary" className="text-xs">
                              {item.frequency}x
                            </Badge>
                            <span className="flex-1 font-medium">{item.fertilizer_name}</span>
                            <span className="text-muted-foreground">
                              {item.base_quantity} {item.unit}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {item.method}
                            </Badge>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="mt-4">
          {inactiveTemplates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No inactive templates</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {inactiveTemplates.map((template) => (
                <Card key={template.id} className="opacity-60">
                  <CardHeader>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription>Inactive</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
            <DialogDescription>
              Templates auto-match petiole tests based on season stage and soil type.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Sandy soil - pruning stage - normal NPK"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="season_stage">Season Stage</Label>
                <Select
                  value={formData.season_stage}
                  onValueChange={(value: SeasonStage) =>
                    setFormData((prev) => ({ ...prev, season_stage: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEASON_STAGES.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="soil_type">Soil Type (optional)</Label>
                <Select
                  value={formData.soil_type}
                  onValueChange={(value: string) =>
                    setFormData((prev) => ({ ...prev, soil_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any soil type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any soil type</SelectItem>
                    {SOIL_TYPES.map((soil) => (
                      <SelectItem key={soil} value={soil}>
                        {soil.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Fertilizer Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Fertilizer name"
                        value={item.fertilizer_name}
                        onChange={(e) => updateItem(index, 'fertilizer_name', e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Quantity"
                          value={item.base_quantity || ''}
                          onChange={(e) =>
                            updateItem(index, 'base_quantity', parseFloat(e.target.value) || 0)
                          }
                          className="w-24"
                        />
                        <Select
                          value={item.unit}
                          onValueChange={(value: string) => updateItem(index, 'unit', value)}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="liters">L</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={item.method}
                          onValueChange={(value: string) => updateItem(index, 'method', value)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="soil">Soil</SelectItem>
                            <SelectItem value="foliar">Foliar</SelectItem>
                            <SelectItem value="fertigation">Fertigation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {formData.items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
