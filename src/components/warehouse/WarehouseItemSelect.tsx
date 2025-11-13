'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Package } from 'lucide-react'
import { warehouseService } from '@/lib/warehouse-service'
import { WarehouseItem } from '@/types/types'

interface WarehouseItemSelectProps {
  type: 'fertilizer' | 'spray'
  value: string
  onChange: (value: string, warehouseItemId?: number) => void
  placeholder?: string
  className?: string
}

export function WarehouseItemSelect({
  type,
  value,
  onChange,
  placeholder,
  className
}: WarehouseItemSelectProps) {
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([])
  const [loading, setLoading] = useState(false)
  const [showWarehouse, setShowWarehouse] = useState(false)
  const [customInput, setCustomInput] = useState(value)

  useEffect(() => {
    loadWarehouseItems()
  }, [type])

  useEffect(() => {
    setCustomInput(value)
  }, [value])

  const loadWarehouseItems = async () => {
    try {
      setLoading(true)
      const items = await warehouseService.getWarehouseItems(type)
      setWarehouseItems(items)
    } catch (error) {
      console.error('Error loading warehouse items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWarehouseSelect = (itemId: string) => {
    const item = warehouseItems.find((i) => i.id.toString() === itemId)
    if (item) {
      onChange(item.name, item.id)
      setCustomInput(item.name)
      setShowWarehouse(false)
    }
  }

  const handleCustomInput = (value: string) => {
    setCustomInput(value)
    onChange(value, undefined)
  }

  if (!showWarehouse && warehouseItems.length > 0) {
    return (
      <div className="space-y-2">
        <Input
          type="text"
          value={customInput}
          onChange={(e) => handleCustomInput(e.target.value)}
          placeholder={placeholder}
          className={className}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowWarehouse(true)}
          className="w-full text-xs h-7"
        >
          <Package className="h-3 w-3 mr-1" />
          Select from Warehouse ({warehouseItems.length} items)
        </Button>
      </div>
    )
  }

  if (showWarehouse && warehouseItems.length > 0) {
    return (
      <div className="space-y-2">
        <Select onValueChange={handleWarehouseSelect}>
          <SelectTrigger className={className}>
            <SelectValue placeholder="Select from warehouse..." />
          </SelectTrigger>
          <SelectContent>
            {warehouseItems.map((item) => (
              <SelectItem key={item.id} value={item.id.toString()}>
                {item.name} ({item.quantity} {item.unit})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowWarehouse(false)}
          className="w-full text-xs h-7"
        >
          or type custom name
        </Button>
      </div>
    )
  }

  return (
    <Input
      type="text"
      value={customInput}
      onChange={(e) => handleCustomInput(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  )
}
