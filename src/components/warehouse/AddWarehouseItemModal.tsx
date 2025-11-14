'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { warehouseService } from '@/lib/warehouse-service'
import { WarehouseItem } from '@/types/types'
import { toast } from 'sonner'

interface AddWarehouseItemModalProps {
  item?: WarehouseItem // If provided, we're editing
  onClose: () => void
  onSave: () => void
}

export function AddWarehouseItemModal({ item, onClose, onSave }: AddWarehouseItemModalProps) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    type: item?.type || ('fertilizer' as 'fertilizer' | 'spray'),
    quantity: item?.quantity?.toString() || '',
    unit: item?.unit || ('kg' as 'kg' | 'liter' | 'gram' | 'ml'),
    unitPrice: item?.unitPrice?.toString() || '',
    reorderQuantity: item?.reorderQuantity?.toString() || '',
    notes: item?.notes || ''
  })

  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter item name')
      return
    }

    const quantity = parseFloat(formData.quantity)
    if (isNaN(quantity) || quantity < 0) {
      toast.error('Please enter a valid quantity')
      return
    }

    const unitPrice = parseFloat(formData.unitPrice)
    if (isNaN(unitPrice) || unitPrice < 0) {
      toast.error('Please enter a valid unit price')
      return
    }

    const reorderQuantity = formData.reorderQuantity
      ? parseFloat(formData.reorderQuantity)
      : undefined
    if (reorderQuantity !== undefined && (isNaN(reorderQuantity) || reorderQuantity < 0)) {
      toast.error('Please enter a valid reorder quantity')
      return
    }

    try {
      setSaving(true)

      if (item) {
        // Update existing item
        await warehouseService.updateWarehouseItem(item.id, {
          name: formData.name,
          quantity,
          unitPrice,
          reorderQuantity,
          notes: formData.notes || undefined
        })
        toast.success('Item updated successfully')
      } else {
        // Create new item
        await warehouseService.createWarehouseItem({
          name: formData.name,
          type: formData.type,
          quantity,
          unit: formData.unit,
          unitPrice,
          reorderQuantity,
          notes: formData.notes || undefined
        })
        toast.success('Item added successfully')
      }

      onSave()
    } catch (error) {
      console.error('Error saving item:', error)
      toast.error('Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Item' : 'Add Warehouse Item'}</DialogTitle>
          <DialogDescription>
            {item ? 'Update the item details' : 'Add a new item to your warehouse inventory'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type (only for new items) */}
          {!item && (
            <div className="space-y-2">
              <Label>Type</Label>
              <RadioGroup
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as 'fertilizer' | 'spray' })
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fertilizer" id="fertilizer" />
                  <Label htmlFor="fertilizer" className="font-normal cursor-pointer">
                    Fertilizer
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="spray" id="spray" />
                  <Label htmlFor="spray" className="font-normal cursor-pointer">
                    Spray
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g., NPK 19:19:19 or Imidacloprid"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0"
                placeholder="100"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) =>
                  setFormData({ ...formData, unit: value as typeof formData.unit })
                }
                disabled={!!item} // Can't change unit for existing items
              >
                <SelectTrigger id="unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="liter">liter</SelectItem>
                  <SelectItem value="gram">gram</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Unit Price */}
          <div className="space-y-2">
            <Label htmlFor="unitPrice">Unit Price (₹) *</Label>
            <Input
              id="unitPrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="50"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Price per {formData.unit} (e.g., ₹50 per kg)
            </p>
          </div>

          {/* Reorder Quantity */}
          <div className="space-y-2">
            <Label htmlFor="reorderQuantity">Reorder Quantity (Optional)</Label>
            <Input
              id="reorderQuantity"
              type="number"
              step="0.01"
              min="0"
              placeholder="20"
              value={formData.reorderQuantity}
              onChange={(e) => setFormData({ ...formData, reorderQuantity: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Alert when stock falls below this level</p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information..."
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : item ? 'Update' : 'Add Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
