'use client'

import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'var(--card)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
          borderRadius: '0.5rem',
        },
      }}
      duration={3000}
    />
  )
}

export const toast = sonnerToast
