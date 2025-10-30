import { type ReactNode } from 'react'

import {
  getLogTypeBgColor,
  getLogTypeColor,
  getLogTypeIcon,
  getLogTypeLabel
} from '@/lib/log-type-config'
import { cn } from '@/lib/utils'

type ActivityLogRowVariant = 'default' | 'muted'

interface ActivityLogRowProps extends React.HTMLAttributes<HTMLDivElement> {
  activityType: string
  title: string
  label?: string
  supportingText?: string
  topRight?: ReactNode
  footer?: ReactNode
  actions?: ReactNode
  variant?: ActivityLogRowVariant
  interactive?: boolean
}

const variantClasses: Record<ActivityLogRowVariant, string> = {
  default: 'border border-gray-200 bg-gray-50',
  muted: 'bg-muted/40'
}

export function ActivityLogRow({
  activityType,
  title,
  label,
  supportingText,
  topRight,
  footer,
  actions,
  variant = 'default',
  interactive = false,
  className,
  ...rest
}: ActivityLogRowProps) {
  const Icon = getLogTypeIcon(activityType)
  const labelText = label === undefined ? getLogTypeLabel(activityType) : label

  return (
    <div
      className={cn(
        'grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-xl p-3 transition',
        variantClasses[variant],
        interactive && 'cursor-pointer hover:shadow-md',
        interactive && variant === 'default' && 'hover:bg-gray-100',
        className
      )}
      {...rest}
    >
      <div className={cn('flex-shrink-0 rounded-md p-2', getLogTypeBgColor(activityType))}>
        <Icon className={cn('h-4 w-4', getLogTypeColor(activityType))} />
      </div>

      <div className="min-w-0">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <p className="truncate text-sm font-medium text-foreground sm:max-w-[320px] md:max-w-[420px]">
            {title}
          </p>
          {topRight ? <span className="text-xs font-medium text-blue-600">{topRight}</span> : null}
        </div>
        {labelText ? (
          <p className="text-xs font-medium text-muted-foreground capitalize">{labelText}</p>
        ) : null}
        {supportingText ? (
          <p className="mt-1 text-xs text-muted-foreground">{supportingText}</p>
        ) : null}
        {footer ? <div className="mt-2">{footer}</div> : null}
      </div>

      {actions ? <div className="flex flex-shrink-0 items-center gap-1">{actions}</div> : null}
    </div>
  )
}
