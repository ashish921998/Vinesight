'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Search, Check } from 'lucide-react'
import { warehouseService } from '@/lib/warehouse-service'
import { WarehouseItem } from '@/types/types'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

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
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('')
  const [searchOpen, setSearchOpen] = useState(false)

  const loadWarehouseItems = useCallback(async () => {
    try {
      setLoading(true)
      const items = await warehouseService.getWarehouseItems(type)
      setWarehouseItems(items)
    } catch (error) {
      console.error('Error loading warehouse items:', error)
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => {
    loadWarehouseItems()
  }, [loadWarehouseItems])

  useEffect(() => {
    setCustomInput(value)
  }, [value])

  const handleWarehouseSelect = (itemId: string) => {
    const item = warehouseItems.find((i) => i.id.toString() === itemId)
    if (item) {
      setSelectedWarehouseId(itemId)
      onChange(item.name, item.id)
      setCustomInput(item.name)
      setShowWarehouse(false)
      setSearchOpen(false)
    }
  }

  const handleCustomInput = (value: string) => {
    setCustomInput(value)
    setSelectedWarehouseId('') // Clear warehouse selection when using custom input
    onChange(value, undefined)
  }

  // Get stock status badge
  const getStockBadge = (item: WarehouseItem) => {
    const quantity = parseFloat(item.quantity.toString())
    if (quantity <= 0) {
      return (
        <Badge variant="destructive" className="text-[0.65rem] px-1 py-0">
          Out of stock
        </Badge>
      )
    } else if (quantity < 10) {
      return (
        <Badge
          variant="outline"
          className="text-[0.65rem] px-1 py-0 border-amber-400 text-amber-700"
        >
          Low stock
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-[0.65rem] px-1 py-0 border-green-400 text-green-700">
        In stock
      </Badge>
    )
  }

  // Enhanced warehouse mode with searchable combobox
  if (showWarehouse && warehouseItems.length > 0) {
    return (
      <div className="space-y-2">
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={searchOpen}
              className={`w-full justify-between ${className}`}
            >
              {selectedWarehouseId ? (
                <span className="truncate">
                  {warehouseItems.find((item) => item.id.toString() === selectedWarehouseId)?.name}
                </span>
              ) : (
                <span className="text-muted-foreground">Search warehouse items...</span>
              )}
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput
                placeholder={`Search ${type === 'spray' ? 'chemicals' : 'fertilizers'}...`}
              />
              <CommandEmpty>No items found in warehouse.</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  {warehouseItems.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.name}
                      onSelect={() => handleWarehouseSelect(item.id.toString())}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Check
                          className={`h-4 w-4 ${
                            selectedWarehouseId === item.id.toString() ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {item.quantity} {item.unit}
                        </span>
                        {getStockBadge(item)}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

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

  // Default mode with option to switch to warehouse
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

  // Fallback: no warehouse items, show simple input
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
