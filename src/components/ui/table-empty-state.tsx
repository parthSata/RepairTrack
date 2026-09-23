import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface TableEmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  children?: ReactNode
}

export function TableEmptyState({
  icon: Icon,
  title,
  description,
  children,
}: TableEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {children}
    </div>
  )
}
