'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import { printWithTitle } from '@/lib/print'
import { cn } from '@/lib/utils'

interface PrintButtonProps {
  /** Suggested file name when the user picks "Save as PDF"; build it with `toFileTitle`. */
  fileTitle: string
  label?: string
  className?: string
}

export function PrintButton({ fileTitle, label = 'Print', className }: PrintButtonProps) {
  function handlePrint() {
    try {
      printWithTitle(fileTitle)
    } catch {
      toast.error("Printing isn't available here. Use your browser's menu to print or save as PDF.")
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={cn('gap-2 print:hidden', className)}
      // OS printer drivers (e.g. Microsoft Print to PDF) ignore document.title; only the browser's own destination uses it.
      title={`Choose "Save as PDF" as the destination to save as "${fileTitle}.pdf"`}
      onClick={handlePrint}
    >
      <Printer className="h-4 w-4" aria-hidden />
      {label}
    </Button>
  )
}
