import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, onChange, ...props }: React.ComponentProps<'input'>) {
  // For number inputs, use text type with decimal inputMode to allow better control
  // Auto-add leading zero when user types just a decimal point
  const inputType = type === 'number' ? 'text' : type
  const inputMode = type === 'number' ? ('decimal' as const) : undefined
  const pattern = type === 'number' ? '[0-9]*\\.?[0-9]*' : undefined

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === 'number') {
      let value = e.target.value

      // Auto-add leading zero when user types just a decimal point
      if (value === '.') {
        value = '0.'
        e.target.value = value
      }
      // Handle multiple decimal points (keep only first one)
      else if (value.split('.').length > 2) {
        const parts = value.split('.')
        value = parts[0] + '.' + parts.slice(1).join('')
        e.target.value = value
      }
      // Only allow numbers and one decimal point
      else if (value !== '' && !/^-?\d*\.?\d*$/.test(value)) {
        return // Don't update if invalid
      }
    }

    onChange?.(e)
  }

  return (
    <input
      type={inputType}
      inputMode={inputMode}
      pattern={pattern}
      onChange={handleChange}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className
      )}
      {...props}
    />
  )
}

export { Input }
