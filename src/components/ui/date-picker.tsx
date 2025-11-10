'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface DatePickerProps {
  value?: string | Date
  onChange?: (date: string) => void
  disabled?: boolean
  className?: string
  id?: string
  required?: boolean
  max?: string
  min?: string
  placeholder?: string
}

export function DatePicker({
  value,
  onChange,
  disabled = false,
  className,
  id,
  required = false,
  max,
  min,
  placeholder = 'Pick a date'
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Convert string date to Date object
  const dateValue = value ? (typeof value === 'string' ? new Date(value) : value) : undefined

  // Convert max/min strings to Date objects
  const maxDate = max ? new Date(max) : undefined
  const minDate = min ? new Date(min) : undefined

  const handleSelect = (date: Date | undefined) => {
    if (date && onChange) {
      // Format date as YYYY-MM-DD for consistency with input type="date"
      const formattedDate = format(date, 'yyyy-MM-dd')
      onChange(formattedDate)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !dateValue && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateValue ? format(dateValue, 'PPP') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
          disabled={(date) => {
            if (maxDate && date > maxDate) return true
            if (minDate && date < minDate) return true
            return false
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
