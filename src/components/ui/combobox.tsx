'use client'

import * as React from 'react'
import { ChevronsUpDown, Check } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface ComboboxProps {
  options: {
    value: string
    label: string
  }[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  allowCustom?: boolean
  customPlaceholder?: string
}

export const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  (
    {
      options,
      value,
      onValueChange,
      placeholder = 'Select option...',
      searchPlaceholder = 'Search...',
      emptyText = 'No option found.',
      disabled = false,
      allowCustom = false,
      customPlaceholder = 'Type to create custom value...'
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false)
    const [searchValue, setSearchValue] = React.useState('')

    const selectedOption = options.find((opt) => opt.value === value)

    // Check if the current value is a custom value (not in the predefined options)
    const isCustomValue = value && !options.some((opt) => opt.value === value)

    const filteredOptions =
      searchValue.length > 0
        ? options.filter((option) => option.label.toLowerCase().includes(searchValue.toLowerCase()))
        : options

    // Check if search value matches any option exactly
    const hasExactMatch = options.some(
      (opt) => opt.label.toLowerCase() === searchValue.toLowerCase()
    )

    // Show custom create option if search value is not empty and doesn't match exactly
    const showCustomOption = allowCustom && searchValue.length > 0 && !hasExactMatch

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedOption?.label || (isCustomValue ? value : placeholder)}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchValue}
              onValueChange={setSearchValue}
            />
            {filteredOptions.length === 0 && !showCustomOption && (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )}
            <CommandList>
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      // Only update if the value is different (prevents clearing on reselection)
                      if (currentValue !== value) {
                        onValueChange(currentValue)
                      }
                      setOpen(false)
                      setSearchValue('')
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
                {showCustomOption && (
                  <CommandItem
                    value={searchValue}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue)
                      setOpen(false)
                      setSearchValue('')
                    }}
                    className="bg-blue-50 border-t border-blue-100"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === searchValue ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="text-blue-700 font-medium">
                      ✓ Add &quot;{searchValue}&quot; as custom variety
                    </span>
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }
)

Combobox.displayName = 'Combobox'
