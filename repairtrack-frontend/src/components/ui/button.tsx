import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'accent' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function Button({ className, variant = 'default', size = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50',
        size === 'default' && 'h-11 px-4 text-sm',
        size === 'sm' && 'h-9 px-3 text-xs',
        size === 'lg' && 'h-12 px-8 text-base',
        size === 'icon' && 'h-9 w-9',
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