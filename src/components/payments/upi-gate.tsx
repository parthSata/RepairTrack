'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { canCollectByUpi, type ShopUpi } from '@/features/payments/upi'

type UpiGateProps = {
  upi: ShopUpi | null
  balance: number | null
  repairStatus: string
  userRole: string
  children: (upi: ShopUpi) => ReactNode
}

/** Renders UPI payment UI only when there is something to collect and the shop has a UPI ID. */
export function UpiGate({ upi, balance, repairStatus, userRole, children }: UpiGateProps) {
  if (!canCollectByUpi({ balance, repairStatus })) return null
  if (upi) return <>{children(upi)}</>
  if (userRole !== 'OWNER') return null

  return (
    <Link
      href="/settings/shop"
      className="text-xs font-medium text-accent underline-offset-4 hover:underline print:hidden"
    >
      Add a UPI ID in Shop Profile
    </Link>
  )
}
