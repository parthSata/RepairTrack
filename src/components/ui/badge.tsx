import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variant === 'default' && 'border-transparent bg-foreground text-background hover:bg-foreground/80',
        variant === 'secondary' && 'border-transparent bg-muted text-foreground hover:bg-muted/80',
        variant === 'outline' && 'border-border text-foreground',
        variant === 'success' && 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
        variant === 'warning' && 'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400',
        variant === 'destructive' && 'border-transparent bg-destructive/15 text-destructive',
        className,
      )}
      {...props}
    />
  )
}
