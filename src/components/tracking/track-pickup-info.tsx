'use client'

import { Clock, MapPin, Phone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatBusinessHoursRows } from '@/features/shop/business-hours'
import type { PublicTrackingResponse } from '@/features/tracking/schemas'

type TrackPickupInfoProps = Pick<
  PublicTrackingResponse,
  'status' | 'shopName' | 'shopAddress' | 'shopPhone' | 'shopBusinessHours'
>

export function TrackPickupInfo({
  status,
  shopName,
  shopAddress,
  shopPhone,
  shopBusinessHours,
}: TrackPickupInfoProps) {
  if (status !== 'Ready for Pickup') return null
  const businessHourRows = formatBusinessHoursRows(shopBusinessHours)

  return (
    <Card className="w-full min-w-0 border-accent/30 bg-accent/5">
      <CardContent className="flex w-full min-w-0 flex-col gap-4 p-4 sm:p-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Pickup location
          </p>
          <h3 className="mt-1 text-base font-bold text-foreground wrap-break-word">{shopName}</h3>
        </div>
        <div className="flex min-w-0 flex-col gap-3 text-sm">
          <div className="flex min-w-0 items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
            <p className="min-w-0 leading-relaxed text-foreground wrap-break-word">{shopAddress}</p>
          </div>
          <div className="flex min-w-0 items-start gap-3">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
            <a
              href={`tel:${shopPhone}`}
              className="min-w-0 font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground wrap-break-word"
            >
              {shopPhone}
            </a>
          </div>
          {businessHourRows.length > 0 ? (
            <div className="flex min-w-0 items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
              <div className="grid min-w-0 flex-1 gap-2 text-sm sm:grid-cols-2 sm:gap-x-8 sm:gap-y-2">
                {businessHourRows.map((row) => (
                  <div key={row.label} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-2">
                    <span className="font-semibold text-foreground">{row.label}</span>
                    <span className="min-w-0 text-foreground wrap-break-word">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
