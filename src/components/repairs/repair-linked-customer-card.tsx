import { User } from 'lucide-react'
import type { Repair } from '@/features/repairs/queries'

type Props = {
  customer: Repair['customer']
}

export function RepairLinkedCustomerCard({ customer }: Props) {
  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-background/60 p-4 transition-colors duration-200 hover:bg-muted/20">
      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <User className="h-3.5 w-3.5" />
        Customer
      </span>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-foreground">{customer.name}</span>
        <span className="mt-0.5 text-xs text-muted-foreground">{customer.phone}</span>
        {customer.email ? (
          <span className="break-all text-xs text-muted-foreground">{customer.email}</span>
        ) : null}
      </div>
    </div>
  )
}
