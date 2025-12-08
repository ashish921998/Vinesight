'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Plus, Trash2, FlaskConical, Calendar, Loader2, X, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import {
  FertilizerPlanService,
  type FertilizerPlanWithItems,
  type CreatePlanInput
} from '@/lib/fertilizer-plan-service'

interface PlanItem {
  id: string
  application_date: string
  fertilizer_name: string
  quantity: string
  unit: string
  application_method: string
  application_frequency: string
  notes: string
  isExisting?: boolean // Track if it's from DB
}

interface FertilizerPlanSectionProps {
  farmId: number
  organizationId: string
  plans: FertilizerPlanWithItems[]
  onPlanCreated: () => void
  onPlanDeleted: () => void
}

export function FertilizerPlanSection({
  farmId,
  organizationId,
  plans,
  onPlanCreated,
  onPlanDeleted
}: FertilizerPlanSectionProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Edit mode
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<PlanItem[]>([])
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([])

  const getEmptyItem = (): PlanItem => ({
    id: crypto.randomUUID(),
    application_date: '',
    fertilizer_name: '',
    quantity: '',
    unit: 'kg/acre',
    application_method: '',
    application_frequency: '1',
    notes: '',
    isExisting: false
  })

  const resetForm = () => {
    setTitle('')
    setNotes('')
    setItems([getEmptyItem()])
    setDeletedItemIds([])
    setEditingPlanId(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setShowDialog(true)
  }

  const openEditDialog = (plan: FertilizerPlanWithItems) => {
    setEditingPlanId(plan.id)
    setTitle(plan.title)
    setNotes(plan.notes || '')
    setItems(
      plan.items.map((item) => ({
        id: item.id,
        application_date: item.application_date || '',
        fertilizer_name: item.fertilizer_name,
        quantity: item.quantity.toString(),
        unit: item.unit,
        application_method: item.application_method || '',
        application_frequency: item.application_frequency?.toString() || '1',
        notes: item.notes || '',
        isExisting: true
      }))
    )
    setDeletedItemIds([])
    setShowDialog(true)
  }

  const addItem = () => {
    setItems([...items, getEmptyItem()])
  }

  const removeItem = (id: string, isExisting?: boolean) => {
    if (items.length <= 1) return
    setItems(items.filter((item) => item.id !== id))
    if (isExisting) {
      setDeletedItemIds([...deletedItemIds, id])
    }
  }

  const updateItem = (id: string, field: keyof PlanItem, value: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a plan title')
      return
    }

    const validItems = items.filter((item) => item.fertilizer_name.trim() && item.quantity)
    if (validItems.length === 0) {
      toast.error('Please add at least one fertilizer item')
      return
    }

    setSaving(true)
    try {
      if (editingPlanId) {
        // Update existing plan
        await FertilizerPlanService.updatePlan(editingPlanId, {
          title: title.trim(),
          notes: notes.trim() || undefined
        })

        // Delete removed items
        for (const itemId of deletedItemIds) {
          await FertilizerPlanService.deletePlanItem(itemId)
        }

        // Update existing items and add new ones
        for (const item of validItems) {
          if (item.isExisting) {
            await FertilizerPlanService.updatePlanItem(item.id, {
              application_date: item.application_date || null,
              fertilizer_name: item.fertilizer_name.trim(),
              quantity: parseFloat(item.quantity),
              unit: item.unit,
              application_method: item.application_method.trim() || null,
              application_frequency: parseInt(item.application_frequency) || 1,
              notes: item.notes.trim() || null
            })
          } else {
            await FertilizerPlanService.addPlanItem(editingPlanId, {
              application_date: item.application_date || undefined,
              fertilizer_name: item.fertilizer_name.trim(),
              quantity: parseFloat(item.quantity),
              unit: item.unit,
              application_method: item.application_method.trim() || undefined,
              application_frequency: parseInt(item.application_frequency) || 1,
              notes: item.notes.trim() || undefined
            })
          }
        }

        toast.success('Fertilizer plan updated')
      } else {
        // Create new plan
        const input: CreatePlanInput = {
          farm_id: farmId,
          organization_id: organizationId,
          title: title.trim(),
          notes: notes.trim() || undefined,
          items: validItems.map((item) => ({
            application_date: item.application_date || undefined,
            fertilizer_name: item.fertilizer_name.trim(),
            quantity: parseFloat(item.quantity),
            unit: item.unit,
            application_method: item.application_method.trim() || undefined,
            application_frequency: parseInt(item.application_frequency) || 1,
            notes: item.notes.trim() || undefined
          }))
        }

        await FertilizerPlanService.createPlan(input)
        toast.success('Fertilizer plan created')
      }

      resetForm()
      setShowDialog(false)
      onPlanCreated()
    } catch (error) {
      console.error('Error saving plan:', error)
      toast.error('Failed to save fertilizer plan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (planId: string) => {
    setDeleting(planId)
    try {
      await FertilizerPlanService.deletePlan(planId)
      toast.success('Plan deleted')
      onPlanDeleted()
    } catch (error) {
      console.error('Error deleting plan:', error)
      toast.error('Failed to delete plan')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-green-600" />
          Fertilizer Plans
        </h2>
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-1" />
          Create Plan
        </Button>
      </div>

      {/* Plan Form Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlanId ? 'Edit Fertilizer Plan' : 'Create Fertilizer Plan'}
            </DialogTitle>
            <DialogDescription>
              {editingPlanId
                ? 'Update the fertilizer plan. Changes will be visible to the farmer.'
                : 'Create a fertilizer application plan for this farm. The farmer will be able to see this plan.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Plan Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Plan Title</Label>
              <Input
                id="title"
                placeholder="e.g., Spring 2024 Fertigation Plan"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Plan Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="General notes about this plan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Fertilizer Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Fertilizer Applications</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Item
                </Button>
              </div>

              {items.map((item, index) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      Item {index + 1}
                    </span>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id, item.isExisting)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                      <Label className="text-xs">Fertilizer Name</Label>
                      <Input
                        placeholder="e.g., 19:19:19"
                        value={item.fertilizer_name}
                        onChange={(e) => updateItem(item.id, 'fertilizer_name', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Quantity</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                          className="flex-1"
                        />
                        <Select
                          value={item.unit}
                          onValueChange={(value) => updateItem(item.id, 'unit', value)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg/acre">kg/acre</SelectItem>
                            <SelectItem value="liter/acre">liter/acre</SelectItem>
                            <SelectItem value="gm/acre">gm/acre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Application Date (Optional)</Label>
                      <Input
                        type="date"
                        value={item.application_date}
                        onChange={(e) => updateItem(item.id, 'application_date', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Frequency (times)</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="1"
                        value={item.application_frequency || ''}
                        onChange={(e) =>
                          updateItem(item.id, 'application_frequency', e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Method (Optional)</Label>
                      <Input
                        placeholder="e.g., Drip irrigation"
                        value={item.application_method}
                        onChange={(e) => updateItem(item.id, 'application_method', e.target.value)}
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="text-xs">Item Notes (Optional)</Label>
                      <Input
                        placeholder="Any specific instructions..."
                        value={item.notes}
                        onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm()
                setShowDialog(false)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingPlanId ? 'Save Changes' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Display existing plans */}
      {plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FlaskConical className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Fertilizer Plans</h3>
            <p className="text-muted-foreground text-center">
              Create a fertilizer plan for this farm.
              <br />
              The farmer will be able to see it on their dashboard.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{plan.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Created {new Date(plan.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(plan)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(plan.id)}
                      disabled={deleting === plan.id}
                    >
                      {deleting === plan.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {plan.notes && <p className="text-sm text-muted-foreground mb-4">{plan.notes}</p>}

                <div className="space-y-2">
                  {plan.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-5">{index + 1}.</span>
                        <div>
                          <p className="font-medium">{item.fertilizer_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} {item.unit}
                            {item.application_frequency > 1 &&
                              ` × ${item.application_frequency} times`}
                            {item.application_method && ` • ${item.application_method}`}
                          </p>
                        </div>
                      </div>
                      {item.application_date && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.application_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
