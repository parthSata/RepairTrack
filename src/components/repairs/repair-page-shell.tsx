import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface RepairPageShellProps {
  children: ReactNode
  className?: string
}

export function RepairPageShell({ children, className }: RepairPageShellProps) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl space-y-6', className)}>
      {children}
    </div>
  )
}
