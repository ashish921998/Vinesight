'use client'

import { forwardRef } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface FormFieldProps {
  id: string
  label: string
  type?: 'text' | 'number' | 'date' | 'time' | 'email' | 'password' | 'textarea' | 'select'
  value: string | number
  onChange: (value: string | number) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  hint?: string
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  step?: number
  rows?: number
  className?: string
  unit?: string
  icon?: React.ReactNode
}

export const FormField = forwardRef<HTMLInputElement | HTMLTextAreaElement, FormFieldProps>(
  (
    {
      id,
      label,
      type = 'text',
      value,
      onChange,
      placeholder,
      required = false,
      disabled = false,
      error,
      hint,
      options = [],
      min,
      max,
      step,
      rows = 3,
      className,
      unit,
      icon,
      ...props
    },
    ref
  ) => {
    const hasError = Boolean(error)

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      const newValue = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
      onChange(newValue)
    }

    const inputClassName = cn(
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      hasError && 'border-red-500 focus-visible:ring-red-500',
      className
    )

    const renderInput = () => {
      switch (type) {
        case 'textarea':
          return (
            <Textarea
              id={id}
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              required={required}
              disabled={disabled}
              rows={rows}
              className={cn(inputClassName, 'min-h-[80px]')}
              ref={ref as React.Ref<HTMLTextAreaElement>}
              {...props}
            />
          )

        case 'select': {
          const selectValue =
            value === undefined || value === null || value === '' ? undefined : String(value)

          return (
            <Select
              value={selectValue}
              onValueChange={(newValue) => onChange(newValue)}
              disabled={disabled}
            >
              <SelectTrigger id={id} className={inputClassName} aria-required={required}>
                <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        }

        default:
          return (
            <div className="relative">
              {icon && (
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  {icon}
                </div>
              )}
              <Input
                id={id}
                type={type}
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                min={min}
                max={max}
                step={step}
                className={cn(inputClassName, icon && 'pl-10', unit && 'pr-12')}
                ref={ref as React.Ref<HTMLInputElement>}
                {...props}
              />
              {unit && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                  {unit}
                </div>
              )}
            </div>
          )
      }
    }

    return (
      <div className="space-y-2">
        <Label
          htmlFor={id}
          className={cn(
            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            required && "after:content-['*'] after:text-red-500 after:ml-1"
          )}
        >
          {label}
        </Label>
        {renderInput()}
        {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-red-500"></span>
            {error}
          </p>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'
