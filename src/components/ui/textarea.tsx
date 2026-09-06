import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('min-h-28 w-full resize-y rounded-md border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground focus:ring-2 focus:ring-foreground/10', className)} {...props} />
}