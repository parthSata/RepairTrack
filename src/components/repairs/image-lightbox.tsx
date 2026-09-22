'use client'

import { X } from 'lucide-react'
import Image from 'next/image'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  src: string | null
  alt: string
  onClose: () => void
}

export function ImageLightbox({ open, src, alt, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open || !src || typeof document === 'undefined') return null

  return createPortal(
    <div
      role="presentation"
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-foreground/55 p-4 backdrop-blur-md',
        'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200',
      )}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={alt}
        className={cn(
          'relative w-full max-w-3xl overflow-hidden rounded-xl border border-border/60 bg-card shadow-xl',
          'motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:fade-in motion-safe:duration-200',
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm ring-1 ring-border transition hover:bg-background"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="relative flex max-h-[80vh] min-h-[200px] items-center justify-center bg-muted/30 p-4 sm:p-6">
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={900}
            unoptimized
            className="max-h-[70vh] w-auto max-w-full object-contain"
          />
        </div>
      </div>
    </div>,
    document.body,
  )
}
