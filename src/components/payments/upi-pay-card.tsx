'use client'

import * as React from 'react'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { buildUpiLink, toUpiQrDataUrl, type ShopUpi } from '@/features/payments/upi'
import { formatRupees } from '@/lib/format-money'

const QR_DISPLAY_SIZE = 104

type UpiPayCardProps = {
  upi: ShopUpi
  amountPaise: number
  ticketNumber: string
  className?: string
  showNote?: boolean
}

export function UpiPayCard({
  upi,
  amountPaise,
  ticketNumber,
  className = '',
  showNote = true,
}: UpiPayCardProps) {
  const [copied, setCopied] = React.useState(false)
  const link = buildUpiLink({ ...upi, amountPaise, ticketNumber })
  const amount = formatRupees(amountPaise)
  const qr = useQuery({
    queryKey: ['upi-qr', link],
    queryFn: () => toUpiQrDataUrl(link),
    staleTime: Infinity,
  })

  async function copyUpiId() {
    try {
      await navigator.clipboard.writeText(upi.upiId)
      setCopied(true)
      toast.success('UPI ID copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy. Select the UPI ID and copy it manually.')
    }
  }

  return (
    <div
      className={`relative flex flex-col sm:flex-row items-center gap-3.5 rounded-xl border border-border/80 bg-muted/20 p-3 shadow-2xs transition-all print:border-border print:bg-white print:p-2.5 print:break-inside-avoid ${className}`}
    >
      {/* QR Code Container */}
      <div className="relative shrink-0 flex items-center justify-center rounded-lg border border-border/70 bg-white p-1.5 shadow-2xs">
        {qr.isPending ? (
          <Skeleton className="size-[104px] rounded-md" aria-label="Generating QR code" />
        ) : qr.isError ? (
          <p className="size-[104px] flex items-center justify-center p-2 text-center text-[10px] text-destructive">
            QR unavailable. Use UPI ID.
          </p>
        ) : (
          <Image
            src={qr.data}
            alt={`UPI QR code to pay ${amount}`}
            width={QR_DISPLAY_SIZE}
            height={QR_DISPLAY_SIZE}
            className="rounded"
            unoptimized
          />
        )}
      </div>

      {/* Info & Details */}
      <div className="flex flex-1 flex-col justify-between self-stretch text-left space-y-1.5 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Scan to Pay
          </span>
          <span className="text-base font-bold tracking-tight text-foreground">{amount}</span>
        </div>

        {/* UPI ID Pill */}
        <div className="flex items-center justify-between gap-1.5 rounded-md border border-border/60 bg-background/80 px-2 py-1 shadow-2xs">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground leading-none">
              UPI ID
            </p>
            <p className="truncate font-mono text-xs font-semibold text-foreground" title={upi.upiId}>
              {upi.upiId}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 print:hidden hover:bg-muted text-muted-foreground hover:text-foreground"
            onClick={() => void copyUpiId()}
            aria-label="Copy UPI ID"
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-600" aria-hidden />
            ) : (
              <Copy className="h-3 w-3" aria-hidden />
            )}
          </Button>
        </div>

        {/* Apps & Instructions */}
        {showNote ? (
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>GPay · PhonePe · Paytm · BHIM</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
