import * as React from 'react'

import { cn } from '@/lib/utils'

interface SkeletonProps extends React.ComponentProps<'div'> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-muted animate-pulse rounded-md', className)}
      {...props}
    />
  )
}

export { Skeleton }
