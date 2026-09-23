import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, type, min, onWheel, onKeyDown, ...props }, ref) {
    const isNumber = type === 'number'
    const isNonNegative = min === 0 || min === '0' || (typeof min === 'number' && min >= 0)

    return (
      <input
        ref={ref}
        type={type}
        min={min}
        onWheel={(e) => {
          if (isNumber) {
            ;(e.target as HTMLInputElement).blur()
          }
          onWheel?.(e)
        }}
        onKeyDown={(e) => {
          if (isNumber && isNonNegative && (e.key === '-' || e.key === 'Minus')) {
            e.preventDefault()
          }
          onKeyDown?.(e)
        }}
        className={cn(
          'flex h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground focus:ring-2 focus:ring-foreground/10 disabled:cursor-not-allowed disabled:opacity-50',
          isNumber &&
            '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
          className,
        )}
        {...props}
      />
    )
  },
)
