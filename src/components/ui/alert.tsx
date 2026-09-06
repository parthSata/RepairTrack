import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Alert({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div role="alert" className={cn('rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive', className)} {...props} />
}