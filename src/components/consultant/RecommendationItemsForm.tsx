import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { Trash2, MoveUp, MoveDown, Plus } from 'lucide-react'
import { FERTILIZER_UNITS, APPLICATION_METHODS } from '@/types/consultant'
import type { FertilizerItemForm } from '@/hooks/consultant/useRecommendationForm'

interface RecommendationItemsFormProps {
  items: FertilizerItemForm[]
  onUpdateItem: (tempId: string, field: keyof FertilizerItemForm, value: string) => void
  onRemoveItem: (tempId: string) => void
  onMoveItem: (index: number, direction: 'up' | 'down') => void
  onAddItem: () => void
}

export function RecommendationItemsForm({
  items,
  onUpdateItem,
  onRemoveItem,
  onMoveItem,
  onAddItem
}: RecommendationItemsFormProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Fertilizer Items</h2>
        <Button onClick={onAddItem} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <Card key={item.tempId} className="relative">
            <CardContent className="p-4 pt-10 sm:pt-4">
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={index === 0}
                  onClick={() => onMoveItem(index, 'up')}
                >
                  <MoveUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={index === items.length - 1}
                  onClick={() => onMoveItem(index, 'down')}
                >
                  <MoveDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => onRemoveItem(item.tempId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fertilizer Name *</Label>
                    <Input
                      placeholder="e.g., Urea"
                      value={item.fertilizerName}
                      onChange={(e) => onUpdateItem(item.tempId, 'fertilizerName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Brand (Optional)</Label>
                    <Input
                      placeholder="e.g., IFFCO"
                      value={item.brand || ''}
                      onChange={(e) => onUpdateItem(item.tempId, 'brand', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={item.quantity}
                      onChange={(e) => onUpdateItem(item.tempId, 'quantity', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select
                      value={item.unit}
                      onValueChange={(value) => onUpdateItem(item.tempId, 'unit', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FERTILIZER_UNITS.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Application Method</Label>
                    <Select
                      value={item.applicationMethod || APPLICATION_METHODS[0].value}
                      onValueChange={(value) =>
                        onUpdateItem(item.tempId, 'applicationMethod', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {APPLICATION_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Input
                      placeholder="e.g., Twice a week"
                      value={item.frequency || ''}
                      onChange={(e) => onUpdateItem(item.tempId, 'frequency', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Timing</Label>
                    <Input
                      placeholder="e.g., Morning"
                      value={item.timing || ''}
                      onChange={(e) => onUpdateItem(item.tempId, 'timing', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Est. Cost (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={item.estimatedCost || ''}
                      onChange={(e) => onUpdateItem(item.tempId, 'estimatedCost', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Add special instructions..."
                    value={item.notes || ''}
                    onChange={(e) => onUpdateItem(item.tempId, 'notes', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
