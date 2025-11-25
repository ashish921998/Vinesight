'use client'

import * as React from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Farm {
  id: number
  name: string
}

interface FarmsMultiSelectProps {
  farms: Farm[]
  selectedFarmIds: number[]
  onSelectionChange: (farmIds: number[]) => void
  placeholder?: string
}

export const FarmsMultiSelect = React.forwardRef<HTMLButtonElement, FarmsMultiSelectProps>(
  ({ farms, selectedFarmIds, onSelectionChange, placeholder = 'Select farms...' }, ref) => {
    const [open, setOpen] = React.useState(false)
    const listId = React.useId()

    const isAllSelected = selectedFarmIds.length === farms.length && farms.length > 0

    const handleAllFarmsToggle = () => {
      if (isAllSelected) {
        onSelectionChange([])
      } else {
        onSelectionChange(farms.map((f) => f.id))
      }
    }

    const handleFarmToggle = (farmId: number) => {
      if (selectedFarmIds.includes(farmId)) {
        onSelectionChange(selectedFarmIds.filter((id) => id !== farmId))
      } else {
        onSelectionChange([...selectedFarmIds, farmId])
      }
    }

    const getDisplayText = () => {
      if (selectedFarmIds.length === 0) {
        return placeholder
      }
      if (isAllSelected) {
        return 'All Farms'
      }
      if (selectedFarmIds.length === 1) {
        return farms.find((f) => f.id === selectedFarmIds[0])?.name || placeholder
      }
      return `${selectedFarmIds.length} farms selected`
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            ref={ref}
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            className={cn(
              'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              selectedFarmIds.length === 0 && 'text-muted-foreground'
            )}
          >
            <span className="truncate">{getDisplayText()}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent id={listId} className="w-[--radix-popover-trigger-width] p-1" align="start">
          {/* All Farms Option */}
          <div
            role="option"
            tabIndex={0}
            aria-selected={isAllSelected}
            className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            onClick={handleAllFarmsToggle}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleAllFarmsToggle()
              }
            }}
          >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
              {isAllSelected && <Check className="h-4 w-4" />}
            </span>
            <span className="font-medium">All Farms</span>
          </div>

          {/* Separator */}
          <div className="-mx-1 my-1 h-px bg-muted" />

          {/* Individual Farm Options */}
          <div className="max-h-64 overflow-y-auto">
            {farms.map((farm) => {
              const isSelected = selectedFarmIds.includes(farm.id)
              return (
                <div
                  key={farm.id}
                  role="option"
                  tabIndex={isAllSelected ? -1 : 0}
                  aria-selected={isSelected}
                  className={cn(
                    'relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                    isAllSelected && 'pointer-events-none opacity-50'
                  )}
                  onClick={() => {
                    if (!isAllSelected) {
                      handleFarmToggle(farm.id)
                    }
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !isAllSelected) {
                      e.preventDefault()
                      handleFarmToggle(farm.id)
                    }
                  }}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    {isSelected && <Check className="h-4 w-4" />}
                  </span>
                  <span className="truncate">{farm.name}</span>
                </div>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    )
  }
)

FarmsMultiSelect.displayName = 'FarmsMultiSelect'
