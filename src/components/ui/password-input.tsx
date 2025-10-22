'use client'

import { forwardRef, useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string
  error?: string
  id: string
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const errorId = error ? `${id}-error` : undefined

    return (
      <div>
        {label ? (
          <Label htmlFor={id} className="mb-2 block text-sm font-medium text-card-foreground">
            {label}
          </Label>
        ) : null}
        <div className="relative">
          <Input
            id={id}
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            className={cn(
              'pr-10',
              error &&
                'border-destructive text-destructive focus-visible:border-destructive focus-visible:ring-destructive/40 dark:focus-visible:ring-destructive/30',
              className
            )}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {error ? (
          <p id={errorId} className="mt-1 text-xs text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }
