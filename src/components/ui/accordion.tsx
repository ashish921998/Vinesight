'use client'

import { createContext, useContext, useMemo, useState, type ReactNode, type React } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type AccordionValue = string | null

type AccordionContextValue = {
  value: AccordionValue
  setValue: (next: AccordionValue) => void
  collapsible?: boolean
}

const AccordionContext = createContext<AccordionContextValue | null>(null)

interface AccordionProps {
  type?: 'single'
  collapsible?: boolean
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: ReactNode
  className?: string
}

export function Accordion({
  type = 'single',
  collapsible = false,
  defaultValue = null,
  value: controlledValue,
  onValueChange,
  children,
  className
}: AccordionProps) {
  const [internalValue, setInternalValue] = useState<AccordionValue>(defaultValue)
  const isControlled = controlledValue !== undefined
  const currentValue = isControlled ? (controlledValue ?? null) : internalValue

  const setValue = (next: AccordionValue) => {
    if (type === 'single' && !collapsible && next === currentValue) {
      return
    }
    if (!isControlled) {
      setInternalValue(next)
    }
    onValueChange?.(next || '')
  }

  const ctx = useMemo(
    () => ({
      value: currentValue,
      setValue,
      collapsible
    }),
    [currentValue, collapsible]
  )

  return (
    <AccordionContext.Provider value={ctx}>
      <div className={cn('w-full', className)}>{children}</div>
    </AccordionContext.Provider>
  )
}

const useAccordion = () => {
  const ctx = useContext(AccordionContext)
  if (!ctx) throw new Error('Accordion components must be used within Accordion')
  return ctx
}

interface AccordionItemProps {
  value: string
  children: ReactNode
  className?: string
}

export function AccordionItem({ value, children, className }: AccordionItemProps) {
  return (
    <div className={cn('border-b border-border/60', className)} data-value={value}>
      {children}
    </div>
  )
}

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  className?: string
  value?: string
}

export function AccordionTrigger({ children, className, value, ...props }: AccordionTriggerProps) {
  const { value: openValue, setValue, collapsible } = useAccordion()
  const itemValue = value || ''
  const open = openValue === itemValue
  return (
    <button
      type="button"
      onClick={() => setValue(open && collapsible ? null : itemValue)}
      className={cn(
        'flex w-full items-center justify-between py-2 text-sm font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'hover:underline',
        className
      )}
      aria-expanded={open}
      {...props}
    >
      {children}
      <ChevronDown
        className={cn('h-4 w-4 shrink-0 transition-transform duration-200', open && 'rotate-180')}
      />
    </button>
  )
}

interface AccordionContentProps {
  children: ReactNode
  className?: string
  value?: string
}

export function AccordionContent({ children, className, value }: AccordionContentProps) {
  const { value: openValue } = useAccordion()
  const itemValue = value || ''
  const open = openValue === itemValue

  if (!open) return null

  return (
    <div
      className={cn(
        'overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
        className
      )}
      data-state={open ? 'open' : 'closed'}
    >
      <div className="pt-0 pb-2">{children}</div>
    </div>
  )
}
