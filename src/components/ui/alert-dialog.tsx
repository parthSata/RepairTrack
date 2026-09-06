'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  /** Override the inner panel width/spacing (default: max-w-md). */
  contentClassName?: string
}

const emptySubscribe = () => () => {}

export function AlertDialog({ open, onOpenChange, children, contentClassName }: AlertDialogProps) {
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }
    if (open) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onOpenChange])

  if (!open || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        className={cn(
          'relative z-50 w-full max-w-md max-h-[min(90vh,900px)] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl transition-all duration-200 page-enter',
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function AlertDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-2 text-left mb-4', className)} {...props} />
}

export function AlertDialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold text-foreground', className)} {...props} />
}

export function AlertDialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground leading-relaxed', className)} {...props} />
}

export function AlertDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 gap-2 sm:gap-0', className)} {...props} />
}

export function AlertDialogAction({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-destructive px-4 text-sm font-medium text-white transition-colors hover:bg-destructive/90 focus:outline-none disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export function AlertDialogCancel({ className, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus:outline-none disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
