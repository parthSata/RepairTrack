import type { repairStatusEnum } from '@/server/db/schema/repairs'

type RepairStatus = (typeof repairStatusEnum.enumValues)[number]

export const PUBLIC_PROGRESS_STAGES = [
  'Received',
  'Diagnosing',
  'Repairing',
  'Ready for Pickup',
  'Delivered',
] as const

export type PublicProgressStage = (typeof PUBLIC_PROGRESS_STAGES)[number]

const STATUS_TO_PUBLIC_LABEL: Record<RepairStatus, PublicProgressStage | 'Cancelled'> = {
  RECEIVED: 'Received',
  DIAGNOSING: 'Diagnosing',
  WAITING_FOR_APPROVAL: 'Repairing',
  APPROVED: 'Repairing',
  WAITING_FOR_PARTS: 'Repairing',
  IN_REPAIR: 'Repairing',
  QUALITY_CHECK: 'Repairing',
  READY_FOR_PICKUP: 'Ready for Pickup',
  COMPLETED: 'Delivered',
  CANCELLED: 'Cancelled',
}

const PUBLIC_STATUS_MESSAGES: Record<PublicProgressStage, string> = {
  Received: 'Your device has been checked in and is waiting to be reviewed.',
  Diagnosing: 'Our team is inspecting your device to understand the issue.',
  Repairing: 'Your repair is in progress with our technicians.',
  'Ready for Pickup': 'Your device is ready — you can collect it from the shop.',
  Delivered: 'Your repair is complete. Thank you for choosing us.',
}

export function mapRepairStatusToPublicLabel(status: RepairStatus): string {
  const label = STATUS_TO_PUBLIC_LABEL[status]
  return label === 'Cancelled' ? 'Cancelled' : label
}

export function getPublicStatusMessage(statusLabel: string): string {
  if (statusLabel === 'Cancelled') {
    return 'This repair was cancelled.'
  }

  if (statusLabel in PUBLIC_STATUS_MESSAGES) {
    return PUBLIC_STATUS_MESSAGES[statusLabel as PublicProgressStage]
  }

  return 'Your repair status is being updated.'
}

export function getActiveProgressStageIndex(statusLabel: string): number {
  const index = PUBLIC_PROGRESS_STAGES.indexOf(statusLabel as PublicProgressStage)
  return index >= 0 ? index : 0
}

export function isCancelledStatus(statusLabel: string): boolean {
  return statusLabel === 'Cancelled'
}
