import { CheckCircle2, Clock3, Receipt } from 'lucide-react'
import { Badge, type BadgeProps } from '@/components/ui/badge'

export type PricingState = 'awaiting' | 'approved' | 'final'

const PRICING_STATE_CONFIG: Record<
  PricingState,
  { label: string; variant: BadgeProps['variant']; Icon: typeof Clock3 }
> = {
  awaiting: { label: 'Awaiting customer', variant: 'warning', Icon: Clock3 },
  approved: { label: 'Customer approved', variant: 'secondary', Icon: CheckCircle2 },
  final: { label: 'Final bill', variant: 'success', Icon: Receipt },
}

export function PricingStateBadge({ state }: { state: PricingState }) {
  const { label, variant, Icon } = PRICING_STATE_CONFIG[state]
  return (
    <Badge variant={variant} className="gap-1 rounded-md font-medium">
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </Badge>
  )
}
