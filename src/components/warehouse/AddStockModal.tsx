'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { warehouseService } from '@/lib/warehouse-service'
import { WarehouseItem } from '@/types/types'
import { toast } from 'sonner'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { formatCurrency } from '@/lib/currency-utils'
import { PackagePlus } from 'lucide-react'

interface AddStockModalProps {
  item: WarehouseItem
  onClose: () => void
  onSave: () => void
}

export function AddStockModal({ item, onClose, onSave }: AddStockModalProps) {
  const { user } = useSupabaseAuth()
  const { preferences } = useUserPreferences(user?.id)
  const [quantityToAdd, setQuantityToAdd] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const quantity = parseFloat(quantityToAdd)
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Please enter a valid quantity to add')
      return
    }

    try {
      setSaving(true)
      await warehouseService.addStock(item.id, quantity)

      const newQuantity = item.quantity + quantity
      toast.success(
        `Added ${quantity} ${item.unit} to ${item.name}. New quantity: ${newQuantity} ${item.unit}`
      )

      onSave()
    } catch (error) {
      console.error('Error adding stock:', error)
      toast.error('Failed to add stock')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5" />
            Add Stock
          </DialogTitle>
          <DialogDescription>Add more stock to {item.name}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Stock Info */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Stock:</span>
              <span className="font-medium">
                {item.quantity} {item.unit}
              </span>
            </div>
            {item.reorderQuantity && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reorder Level:</span>
                <span className="font-medium">
                  {item.reorderQuantity} {item.unit}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Unit Price:</span>
              <span className="font-medium">
                {formatCurrency(item.unitPrice, preferences.currencyPreference)}
              </span>
            </div>
          </div>

          {/* Quantity to Add */}
          <div className="space-y-2">
            <Label htmlFor="quantityToAdd">Quantity to Add ({item.unit}) *</Label>
            <Input
              id="quantityToAdd"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="50"
              value={quantityToAdd}
              onChange={(e) => setQuantityToAdd(e.target.value)}
              autoFocus
            />
          </div>

          {/* Preview */}
          {quantityToAdd && !isNaN(parseFloat(quantityToAdd)) && parseFloat(quantityToAdd) > 0 && (
            <div className="bg-accent/10 p-4 rounded-lg space-y-1">
              <p className="text-sm font-medium">After adding stock:</p>
              <p className="text-lg font-bold">
                {(item.quantity + parseFloat(quantityToAdd)).toFixed(2)} {item.unit}
              </p>
              <p className="text-sm text-muted-foreground">
                Value:{' '}
                {formatCurrency(
                  (item.quantity + parseFloat(quantityToAdd)) * item.unitPrice,
                  preferences.currencyPreference
                )}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Adding...' : 'Add Stock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
