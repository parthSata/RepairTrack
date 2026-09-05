'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  /** When true, Esc / overlay / X do not close — caller must provide explicit Cancel. */
  preventDismiss?: boolean
  className?: string
}

const emptySubscribe = () => () => {}

export function Dialog({ open, onOpenChange, children, preventDismiss = false, className }: DialogProps) {
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !preventDismiss) {
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
  }, [open, onOpenChange, preventDismiss])

  if (!open || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={() => {
          if (!preventDismiss) onOpenChange(false)
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl transition-all duration-200 page-enter',
          className,
        )}
      >
        {!preventDismiss && <DialogClose onClick={() => onOpenChange(false)} />}
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 text-left mb-4 pr-6', className)} {...props} />
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold leading-none tracking-tight text-foreground', className)} {...props} />
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 gap-2 sm:gap-0', className)} {...props} />
}

export function DialogClose({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring text-muted-foreground hover:text-foreground"
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  )
}
