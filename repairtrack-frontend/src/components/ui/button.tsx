import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'accent' | 'ghost'
}

export function Button({ className, variant = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex h-11 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50',
        variant === 'default' && 'bg-foreground text-background hover:bg-foreground/90',
        variant === 'outline' && 'border border-border bg-background text-foreground hover:bg-muted',
        variant === 'accent' && 'bg-accent text-accent-foreground hover:bg-accent/90',
        variant === 'ghost' && 'text-muted-foreground hover:bg-muted hover:text-foreground',
        className,
      )}
      {...props}
    />
  )
}