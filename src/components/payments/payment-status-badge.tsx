import { Badge, type BadgeProps } from '@/components/ui/badge'
import { PAYMENT_STATUS_LABELS } from '@/features/payments/schemas'
import type { PaymentStatus } from '@/features/payments/summary'

const STATUS_VARIANTS: Record<PaymentStatus, BadgeProps['variant']> = {
  UNPAID: 'destructive',
  PARTIAL: 'warning',
  PAID: 'success',
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant={STATUS_VARIANTS[status]}>{PAYMENT_STATUS_LABELS[status]}</Badge>
}
