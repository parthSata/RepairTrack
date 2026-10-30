'use client'

import * as React from 'react'
import { HardDrive, ShieldAlert } from 'lucide-react'
import {
  ConditionBadge,
  DeviceTypeIcon,
  ModelVerificationBadge,
} from '@/components/devices/device-table'
import { ModelConfirmationCard } from '@/components/repairs/model-confirmation-card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getModelVerificationBadgeKind } from '@/features/devices/model-verification'
import type { Repair } from '@/features/repairs/queries'
import { cn } from '@/lib/utils'

type Props = {
  device: Repair['device']
  repairId: string
  canConfirmModel: boolean
  onModelConfirmed?: () => void
}

export function RepairLinkedDeviceCard({
  device,
  repairId,
  canConfirmModel,
  onModelConfirmed,
}: Props) {
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const badgeKind = getModelVerificationBadgeKind(device)
  const needsConfirm = canConfirmModel && badgeKind !== 'verified'

  return (
    <>
      <div
        className={cn(
          'flex h-fit min-w-0 flex-col gap-3 self-start rounded-xl border bg-background/60 p-4 transition-colors duration-200',
          needsConfirm
            ? 'border-amber-300/70 bg-amber-50/40 dark:border-amber-800/50 dark:bg-amber-950/20'
            : 'border-border/70 hover:bg-muted/20',
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <HardDrive className="h-3.5 w-3.5" />
            Linked device
          </span>
          {canConfirmModel ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              className="h-7 gap-1 border-amber-300/80 bg-amber-500/10 px-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-500/15 dark:border-amber-700/60 dark:text-amber-300"
              aria-label="Confirm device model"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Confirm model
            </Button>
          ) : null}
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
            <DeviceTypeIcon type={device.deviceType} />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-foreground">
              <span>{device.brand}</span>
              {device.model ? (
                <span>{device.model}</span>
              ) : (
                <span className="text-xs font-normal italic text-muted-foreground">
                  Unknown model
                </span>
              )}
              <ModelVerificationBadge
                model={device.model}
                modelVerified={device.modelVerified}
                modelVerificationOverridden={device.modelVerificationOverridden}
              />
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="capitalize">{device.deviceType.toLowerCase()}</span>
              <ConditionBadge condition={device.condition} />
            </div>
            {device.serialNumber ? (
              <span className="break-all font-mono text-[11px] text-muted-foreground">
                S/N: {device.serialNumber}
              </span>
            ) : null}
          </div>
        </div>

        {needsConfirm ? (
          <p className="rounded-md border border-amber-200/80 bg-amber-500/5 px-2.5 py-2 text-[11px] leading-snug text-amber-800 dark:border-amber-800/40 dark:text-amber-300">
            Confirm the exact model before adding parts or sending a customer estimate.
          </p>
        ) : null}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm device model</DialogTitle>
          <DialogDescription>
            Enter the exact model from the device before adding parts or sending an estimate.
          </DialogDescription>
        </DialogHeader>
        <ModelConfirmationCard
          repairId={repairId}
          device={device}
          onCancel={() => setConfirmOpen(false)}
          onConfirmed={() => {
            setConfirmOpen(false)
            onModelConfirmed?.()
          }}
        />
      </Dialog>
    </>
  )
}
