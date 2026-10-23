'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/** Native select styled for list filter rows (Repairs-style). */
export function ListFilterSelect({
  className,
  children,
  ...props
}: React.ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'h-10 w-full cursor-pointer rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground shadow-xs transition-colors hover:border-accent-foreground/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
