'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface SearchableComboboxOption {
  value: string
  label: string
  keywords?: string[]
}

interface SearchableComboboxProps {
  value?: string
  onSelect: (value: string) => void
  options: SearchableComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  allowCustom?: boolean
  createLabel?: (value: string) => string
  disabled?: boolean
  buttonClassName?: string
  className?: string
}

const normalizeValue = (input?: string): string => {
  if (!input) return ''
  return input.trim().toLowerCase().replace(/&/g, ' and ')
}

export function SearchableCombobox({
  value,
  onSelect,
  options,
  placeholder = 'Select option',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  allowCustom = false,
  createLabel,
  disabled = false,
  buttonClassName,
  className
}: SearchableComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')

  const normalizedValue = normalizeValue(value)

  const selectedOption = React.useMemo(() => {
    if (!value) return undefined
    return options.find((option) => {
      const optionValue = normalizeValue(option.value)
      const optionLabel = normalizeValue(option.label)
      return optionValue === normalizedValue || optionLabel === normalizedValue
    })
  }, [value, options, normalizedValue])

  const displayLabel = selectedOption?.label ?? value ?? placeholder
  const trimmedSearch = searchTerm.trim()

  const handleSelect = (option: SearchableComboboxOption) => {
    onSelect(option.label)
    setOpen(false)
    setSearchTerm('')
  }

  const handleCustomSelect = () => {
    if (!trimmedSearch) return
    onSelect(trimmedSearch)
    setOpen(false)
    setSearchTerm('')
  }

  const filteredOptions = React.useMemo(() => {
    if (!trimmedSearch) return options
    const normalizedSearch = normalizeValue(trimmedSearch)
    return options.filter((option) => {
      const haystack = `${option.label} ${(option.keywords || []).join(' ')}`.toLowerCase()
      return haystack.includes(normalizedSearch)
    })
  }, [options, trimmedSearch])

  const createOptionLabel = (input: string) =>
    createLabel ? createLabel(input) : `Add "${input.trim()}"`

  const canCreateCustom = allowCustom && trimmedSearch.length > 0

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={(newOpen) => {
        setOpen(newOpen)
        if (!newOpen) {
          setSearchTerm('')
        }
      }}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between truncate',
              !value && 'text-muted-foreground',
              buttonClassName
            )}
            disabled={disabled}
          >
            <span className="truncate">{displayLabel}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
          <Command>
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchTerm}
              onValueChange={setSearchTerm}
              autoFocus
            />
            <CommandList>
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-sm text-muted-foreground">
                  {canCreateCustom ? (
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2"
                      onMouseDown={(event) => {
                        event.preventDefault()
                        handleCustomSelect()
                      }}
                    >
                      <PlusCircle className="h-4 w-4" />
                      {createOptionLabel(trimmedSearch)}
                    </Button>
                  ) : (
                    emptyMessage
                  )}
                </div>
              ) : (
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={`${option.label} ${(option.keywords || []).join(' ')}`}
                      onSelect={() => handleSelect(option)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedOption?.value === option.value ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="truncate">{option.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
            {canCreateCustom && filteredOptions.length > 0 && (
              <div className="border-t px-2 py-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={handleCustomSelect}
                >
                  <PlusCircle className="h-4 w-4" />
                  {createOptionLabel(trimmedSearch)}
                </Button>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
