'use client'

import * as React from 'react'
import { HardDrive, Pencil } from 'lucide-react'
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
import type { Repair } from '@/features/repairs/queries'

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

  return (
    <>
      <div className="flex h-fit min-w-0 flex-col gap-3 self-start rounded-xl border border-border/70 bg-background/60 p-4 transition-colors duration-200 hover:bg-muted/20">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <HardDrive className="h-3.5 w-3.5" />
            Linked device
          </span>
          {canConfirmModel ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              className="h-7 gap-1 px-2 text-xs text-amber-700 hover:bg-amber-500/10 hover:text-amber-800 dark:text-amber-400"
              aria-label="Confirm device model"
            >
              <Pencil className="h-3.5 w-3.5" />
              Confirm
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
                <span className="text-xs font-normal italic text-muted-foreground">Unknown model</span>
              )}
              <ModelVerificationBadge
                modelVerified={device.modelVerified && Boolean(device.model?.trim())}
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
