'use client'

import * as React from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import { downloadBlob } from '@/lib/download'
import { cn } from '@/lib/utils'

interface DownloadPdfButtonProps {
  /** File name without extension; build it with `toFileTitle`. */
  fileTitle: string
  /** Lazily imports and returns the react-pdf `<Document>`, so the PDF code loads only on click. */
  loadDocument: () => Promise<React.ReactElement<DocumentProps>>
  label?: string
  className?: string
}

export function DownloadPdfButton({
  fileTitle,
  loadDocument,
  label = 'Download PDF',
  className,
}: DownloadPdfButtonProps) {
  const [isGenerating, setIsGenerating] = React.useState(false)

  async function handleDownload() {
    setIsGenerating(true)
    try {
      const [{ pdf }, { registerPdfFonts }, document] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/lib/pdf-fonts'),
        loadDocument(),
      ])
      registerPdfFonts()
      const blob = await pdf(document).toBlob()
      downloadBlob(blob, `${fileTitle}.pdf`)
    } catch (error) {
      console.error('PDF generation failed', error)
      toast.error("Couldn't create the PDF. Check your connection and try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={cn('gap-2 print:hidden', className)}
      onClick={handleDownload}
      disabled={isGenerating}
      aria-busy={isGenerating}
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <FileDown className="h-4 w-4" aria-hidden />
      )}
      {isGenerating ? 'Preparing PDF…' : label}
    </Button>
  )
}
