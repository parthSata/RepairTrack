import type { LucideIcon } from 'lucide-react'
import {
  Package,
  Stethoscope,
  Hourglass,
  BadgeCheck,
  Boxes,
  Wrench,
  ClipboardCheck,
  PackageCheck,
  CircleCheckBig,
  XCircle,
  CircleDot,
} from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Received',
  DIAGNOSING: 'Diagnosing',
  WAITING_FOR_APPROVAL: 'Waiting for Approval',
  APPROVED: 'Approved',
  WAITING_FOR_PARTS: 'Waiting for Parts',
  IN_REPAIR: 'In Repair',
  QUALITY_CHECK: 'Quality Check',
  READY_FOR_PICKUP: 'Ready for Pickup',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export type RepairStatusTone = {
  /** Classes for the timeline node circle */
  node: string
  /** Classes for the icon inside the node */
  icon: string
  /** Soft pill / chip background for badges */
  chip: string
}

const STATUS_TONES: Record<string, RepairStatusTone> = {
  RECEIVED: {
    node: 'border-steel/40 bg-steel/10',
    icon: 'text-steel',
    chip: 'border-steel/30 bg-steel/10 text-steel',
  },
  DIAGNOSING: {
    node: 'border-accent/40 bg-accent/10',
    icon: 'text-accent',
    chip: 'border-accent/30 bg-accent/10 text-accent',
  },
  WAITING_FOR_APPROVAL: {
    node: 'border-amber-400/50 bg-amber-50 dark:bg-amber-950/40',
    icon: 'text-amber-600 dark:text-amber-400',
    chip: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
  },
  APPROVED: {
    node: 'border-success/40 bg-success/10',
    icon: 'text-success',
    chip: 'border-success/30 bg-success/10 text-success',
  },
  WAITING_FOR_PARTS: {
    node: 'border-steel/40 bg-muted',
    icon: 'text-steel',
    chip: 'border-border bg-muted text-foreground',
  },
  IN_REPAIR: {
    node: 'border-accent/40 bg-accent/10',
    icon: 'text-accent',
    chip: 'border-accent/30 bg-accent/10 text-accent',
  },
  QUALITY_CHECK: {
    node: 'border-steel/40 bg-steel/10',
    icon: 'text-steel',
    chip: 'border-steel/30 bg-steel/10 text-steel',
  },
  READY_FOR_PICKUP: {
    node: 'border-success/40 bg-success/10',
    icon: 'text-success',
    chip: 'border-success/30 bg-success/10 text-success',
  },
  COMPLETED: {
    node: 'border-success/50 bg-success/15',
    icon: 'text-success',
    chip: 'border-success/40 bg-success/15 text-success',
  },
  CANCELLED: {
    node: 'border-destructive/40 bg-destructive/10',
    icon: 'text-destructive',
    chip: 'border-destructive/30 bg-destructive/10 text-destructive',
  },
}

const STATUS_ICONS: Record<string, LucideIcon> = {
  RECEIVED: Package,
  DIAGNOSING: Stethoscope,
  WAITING_FOR_APPROVAL: Hourglass,
  APPROVED: BadgeCheck,
  WAITING_FOR_PARTS: Boxes,
  IN_REPAIR: Wrench,
  QUALITY_CHECK: ClipboardCheck,
  READY_FOR_PICKUP: PackageCheck,
  COMPLETED: CircleCheckBig,
  CANCELLED: XCircle,
}

const DEFAULT_TONE: RepairStatusTone = {
  node: 'border-border bg-background',
  icon: 'text-muted-foreground',
  chip: 'border-border bg-muted text-foreground',
}

export function getRepairStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status.replace(/_/g, ' ')
}

export function getRepairStatusTone(status: string): RepairStatusTone {
  return STATUS_TONES[status] ?? DEFAULT_TONE
}

export function getRepairStatusIcon(status: string): LucideIcon {
  return STATUS_ICONS[status] ?? CircleDot
}
