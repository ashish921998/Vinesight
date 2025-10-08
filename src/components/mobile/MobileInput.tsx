'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
  variant?: 'default' | 'large'
  unit?: string
}

export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  ({ label, error, helper, variant = 'default', unit, className, ...props }, ref) => {
    const isLarge = variant === 'large'

    return (
      <div className="space-y-2">
        {label && (
          <Label
            htmlFor={props.id}
            className={cn('text-sm font-medium text-gray-700', isLarge && 'text-base')}
          >
            {label}
          </Label>
        )}
        <div className="relative">
          <Input
            ref={ref}
            className={cn(
              'touch-manipulation',
              isLarge && 'h-12 text-lg px-4',
              !isLarge && 'h-11 text-base',
              unit && 'pr-16',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              className
            )}
            {...props}
          />
          {unit && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500 text-sm font-medium">{unit}</span>
            </div>
          )}
        </div>
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        {helper && !error && <p className="text-sm text-gray-500 mt-1">{helper}</p>}
      </div>
    )
  }
)

MobileInput.displayName = 'MobileInput'
